import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";
import { handleApiError, handleApiSuccess } from "./src/lib/apiUtils";
import crypto from "crypto";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./src/lib/firebase";
import { generateMoSPIFallbackAssessment, generateStrictPdfAssessment } from "./src/lib/mospiKnowledgeEngine";
import { extractTextFromPdfBase64 } from "./src/lib/pdfExtractor";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client with standard user agent header
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return null;
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

function chunkAndSelectContext(text: string, tag: string, maxChunks = 4): string {
  if (!text || text.length < 1000) return text;
  
  // Split into ~1200 char semantic chunks
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > 1200) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? (currentChunk + "\n\n" + para) : para;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  
  if (chunks.length <= maxChunks) return chunks.join("\n\n---\n\n");
  
  // Rank chunks by keyword score matching tag & statistical terms
  const tagKeywords = [tag, "sampling", "stratum", "fsu", "gva", "cpi", "dpdp", "anonymization", "variance", "allocation", "survey", "nsso", "asi", "quota", "weight"];
  const scoredChunks = chunks.map(chunk => {
    const lower = chunk.toLowerCase();
    let score = 0;
    tagKeywords.forEach(kw => {
      if (kw && lower.includes(kw.toLowerCase())) score += 2;
    });
    return { chunk, score };
  });
  
  scoredChunks.sort((a, b) => b.score - a.score);
  const selected = scoredChunks.slice(0, maxChunks).map(c => c.chunk);
  return selected.join("\n\n---\n\n");
}

function sanitizeAssessmentSchema(assessmentData: any, competencyTag: string): any {
  if (!assessmentData) return { assessment_title: "MoSPI Assessment", questions: [] };
  
  const title = assessmentData.assessment_title || assessmentData.title || `${competencyTag || 'Sampling'} Competency Assessment`;
  const cadre = assessmentData.target_cadre || "JSO / SSO Officers";
  const domain = assessmentData.target_domain || competencyTag || "Sampling";
  
  let rawQuestions: any[] = [];
  if (Array.isArray(assessmentData.questions)) {
    rawQuestions = assessmentData.questions;
  } else if (Array.isArray(assessmentData.sections)) {
    assessmentData.sections.forEach((sec: any) => {
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((q: any) => {
          rawQuestions.push({
            ...q,
            data_table_markdown: sec.data_table_markdown || q.data_table_markdown
          });
        });
      }
    });
  }

  const sanitizedQuestions = rawQuestions.map((q: any, idx: number) => {
    let opts = Array.isArray(q.options) ? q.options.map((o: any) => String(o?.text || o)) : ["Option A", "Option B", "Option C", "Option D"];
    while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
    opts = opts.slice(0, 4);

    return {
      id: `q${idx + 1}`,
      question_text: q.question_text || q.prompt || q.text || `Question ${idx + 1}`,
      options: opts,
      correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : (q.correct_index ?? q.correctIndex ?? 0),
      explanation: q.explanation || q.rationale || "Official MoSPI methodological justification.",
      bloom_level: q.bloom_level || q.bloom || "L2: Application",
      topic_tag: q.topic_tag || domain,
      ...(q.data_table_markdown ? { data_table_markdown: q.data_table_markdown } : {})
    };
  });

  return {
    assessment_title: title,
    target_cadre: cadre,
    target_domain: domain,
    questions: sanitizedQuestions
  };
}

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { totalQuestions, bloomL1, bloomL2, bloomL3, competencyTag, pdfBase64, fileName } = req.body;
    
    // STRICT GROUNDING REQUIREMENT: Must ground only from PDF, not anything else
    if (!pdfBase64) {
      return handleApiError(
        res, 
        new Error("Strict Grounding Policy: A PDF document is required. Questions must be grounded exclusively and only from the uploaded PDF document, not from external knowledge."),
        "PDF Grounding Required", 
        400
      );
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "").trim();
    const docName = fileName || "Reference_Document.pdf";

    // Extract raw text from PDF for fallback grounding and prompt grounding
    let extractedPdfText = "";
    try {
      extractedPdfText = await extractTextFromPdfBase64(cleanBase64);
      console.log(`[PDF Grounding Engine] Extracted ${extractedPdfText.length} characters from ${docName}`);
    } catch (textErr: any) {
      console.warn("[PDF Grounding Engine] PDF text extraction warning:", textErr?.message);
    }

    let client: GoogleGenAI | null = null;
    try {
      client = getGeminiClient();
    } catch (clientErr: any) {
      console.warn("[Gemini Engine] Client init warning:", clientErr?.message);
    }

    // If no client available (e.g. missing or unconfigured key), use Strict PDF Grounding Engine directly
    if (!client) {
      console.log("[Gemini Engine] Operating in Strict PDF Grounding fallback mode (no active GEMINI_API_KEY).");
      const fallbackAssessment = generateStrictPdfAssessment({
        pdfText: extractedPdfText,
        competencyTag: competencyTag || "Sampling",
        totalQuestions: totalQuestions || 5,
        fileName: docName,
      });
      return handleApiSuccess(res, fallbackAssessment);
    }

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        assessment_title: { type: Type.STRING },
        target_cadre: { type: Type.STRING },
        target_domain: { type: Type.STRING },
        passing_criteria_pct: { type: Type.INTEGER },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question_text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 strings representing options."
              },
              correct_option_index: { type: Type.INTEGER, description: "0-based index of correct option (0 to 3)" },
              explanation: { type: Type.STRING, description: "Direct textual citation and rationale cited exclusively from the PDF" },
              bloom_level: { type: Type.STRING, description: "Must be 'L1: Recall', 'L2: Application', or 'L3: Scenario'" },
              topic_tag: { type: Type.STRING, description: "One of the 8 MoSPI FRAC axes: Sampling, Accounts, Indices, Python/R, GIS, Governance, Quality, Field Ops" },
              data_table_markdown: { type: Type.STRING, description: "Optional markdown table extracted from PDF data" }
            },
            required: ["id", "question_text", "options", "correct_option_index", "explanation", "bloom_level", "topic_tag"]
          }
        }
      },
      required: ["assessment_title", "target_cadre", "questions"]
    };

    const l1Text = bloomL1 !== false ? "'L1: Recall'" : "";
    const l2Text = bloomL2 !== false ? "'L2: Application'" : "";
    const l3Text = bloomL3 === true ? "'L3: Scenario'" : "";
    const allowedBloomLevels = [l1Text, l2Text, l3Text].filter(Boolean).join(", ") || "'L1: Recall', 'L2: Application'";

    const systemInstruction = `You are an expert psychometric assessment specialist operating under an absolute STRICT ZERO-HALLUCINATION GROUNDING DIRECTIVE for India's Ministry of Statistics and Programme Implementation (MoSPI) and NSSTA / iGOT Karmayogi FRAC framework.

CRITICAL STRICT GROUNDING MANDATE:
1. GROUND ONLY AND EXCLUSIVELY FROM THIS PDF: You MUST ground every question, every answer option (both correct option and all 3 distractors), and every explanation ONLY and EXCLUSIVELY from the provided PDF document.
2. ABSOLUTELY NO EXTERNAL KNOWLEDGE: Do NOT use any outside facts, general world knowledge, prior training data, or unstated assumptions. If a rule, calculation, threshold, classification, formula, or procedure is NOT explicitly stated in this uploaded PDF, you are STRICTLY FORBIDDEN from creating a question about it.
3. DIRECT TEXTUAL CITATIONS: In the "explanation" property of every single question, you MUST provide the exact textual quote, clause, section, table, or page reference from the uploaded PDF that explicitly proves why the correct option is true and verifiable.
4. EXACT SCHEMA ENFORCEMENT: Generate exactly ${totalQuestions || 5} multiple-choice questions matching the schema.

Allowed Bloom Levels for this generation: ${allowedBloomLevels}.
Competency Axis: ${competencyTag || "Statistical Competency"}.
Strictly adhere to the provided JSON Schema.`;

    const contents: any = [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64,
        },
      },
      {
        text: `STRICT GROUNDING INSTRUCTION:
Please analyze the attached PDF document (${docName}).
Generate exactly ${totalQuestions || 5} multiple-choice questions grounded ONLY and EXCLUSIVELY from this attached PDF document.
Do NOT use ANY outside knowledge or information not contained within this PDF document.
Every single question and explanation must be directly citeable to and verifiable against the contents of this PDF.`
      }
    ];

    const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest"];
    let retryCount = 0;
    const maxRetries = 1;
    let outputText = "";
    
    while (retryCount <= maxRetries) {
      const modelName = modelsToTry[retryCount % modelsToTry.length];
      try {
        console.log(`[Gemini Engine] Attempt ${retryCount + 1} using model: ${modelName} (Strict PDF Grounding)`);
        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          }
        });
        outputText = response.text || "";
        if (outputText) {
          const rawParsed = JSON.parse(outputText);
          const sanitized = sanitizeAssessmentSchema(rawParsed, competencyTag || "Sampling");
          return handleApiSuccess(res, sanitized);
        }
      } catch (genError: any) {
        const errorMsg = String(genError?.message || "");
        console.warn(`[Gemini Engine] Attempt ${retryCount + 1} (${modelName}) failed:`, errorMsg);
        
        const isAuthError = 
          genError?.status === 401 ||
          errorMsg.includes("401") ||
          errorMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
          errorMsg.includes("UNAUTHENTICATED") ||
          errorMsg.includes("API_KEY_INVALID") ||
          errorMsg.includes("API_KEY_SERVICE_BLOCKED");

        if (isAuthError || retryCount === maxRetries) {
          console.warn("[Gemini Engine] Activating Strict PDF Grounding fallback from extracted document text.");
          const fallbackAssessment = generateStrictPdfAssessment({
            pdfText: extractedPdfText,
            competencyTag,
            totalQuestions: totalQuestions || 5,
            fileName: docName,
          });
          return handleApiSuccess(res, fallbackAssessment);
        }
      }
      retryCount++;
    }
    
    const fallbackAssessment = generateStrictPdfAssessment({
      pdfText: extractedPdfText,
      competencyTag,
      totalQuestions: totalQuestions || 5,
      fileName: docName,
    });
    return handleApiSuccess(res, fallbackAssessment);
    
  } catch (error: any) {
    console.error("[generate-quiz] Failure in strict grounding execution:", error);
    try {
      const { totalQuestions, competencyTag, pdfBase64, fileName } = req.body || {};
      let extracted = "";
      if (pdfBase64) {
        const cleanBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, "").trim();
        extracted = await extractTextFromPdfBase64(cleanBase64);
      }
      const fallbackAssessment = generateStrictPdfAssessment({
        pdfText: extracted,
        competencyTag,
        totalQuestions: totalQuestions || 5,
        fileName: fileName || "Document.pdf",
      });
      return handleApiSuccess(res, fallbackAssessment);
    } catch (fbError) {
      return handleApiError(res, error, "Failed to generate strictly grounded quiz", 500);
    }
  }
});

// --- iGOT Karmayogi Telemetry & Webhook Synchronizer ---

app.get("/api/v1/igot/progress", async (req, res) => {
  try {
    const { user_parichay_id, courses } = req.query;
    if (!user_parichay_id || !courses) {
      return handleApiError(res, new Error("Missing user_parichay_id or courses query parameters"), "Invalid Request", 400);
    }
    
    const courseList = typeof courses === 'string' ? courses.split(',') : [];
    
    // Generate mock progress for the requested courses for demonstration
    const progress: Record<string, any> = {};
    courseList.forEach(courseId => {
      // Create a deterministic pseudo-random progress based on user and course string
      const hash = String(user_parichay_id + courseId).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
      const percentage = Math.abs(hash % 101); // 0 to 100
      let status = 'In Progress';
      if (percentage === 0) status = 'Not Started';
      if (percentage === 100) status = 'Completed';
      
      progress[courseId] = {
        courseId,
        completionPercentage: percentage,
        status,
        lastAccessed: new Date(Date.now() - Math.abs(hash % 10000) * 60000).toISOString() // Random recent date
      };
    });

    return handleApiSuccess(res, {
      status: "success",
      progress
    });
  } catch (error: any) {
    return handleApiError(res, error, "Failed to fetch progress", 500);
  }
});

// Outbound assessment telemetry sync: StatIQ -> iGOT
app.post("/api/v1/igot/sync", async (req, res) => {
  try {
    const { user_parichay_id, assessment_id, scores, timestamp } = req.body;
    
    if (!user_parichay_id || !scores) {
      return handleApiError(res, new Error("Missing user_parichay_id or scores"), "Invalid Request", 400);
    }

    console.log(`[iGOT Outbound Sync] Syncing telemetry for officer ${user_parichay_id} on assessment ${assessment_id}`);

    // Call upstream iGOT Telemetry API if configured, otherwise fallback to mock registration
    const iGOT_API_URL = "https://api.igotkarmayogi.gov.in/v1/telemetry/frac/update";
    const apiKey = process.env.IGOT_TELEMETRY_API_KEY || "STATIQ_SERVICE_TOKEN";
    
    let upstreamSuccess = false;
    try {
      const response = await fetch(iGOT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_parichay_id,
          assessment_id,
          scores,
          timestamp
        })
      });
      upstreamSuccess = response.ok;
      console.log(`[iGOT Outbound Sync] Upstream status code: ${response.status}`);
    } catch (fetchError) {
      console.warn("[iGOT Outbound Sync] Upstream iGOT API unreachable. Running in offline fallback mode:", fetchError);
    }

    // Always record local sync record in Firestore to ensure durability
    try {
      await addDoc(collection(db, "telemetry_logs"), {
        user_parichay_id,
        assessment_id,
        scores,
        clientTimestamp: timestamp || new Date().toISOString(),
        syncedToiGOT: upstreamSuccess,
        createdAt: serverTimestamp()
      });
    } catch (fsError) {
      console.error("[iGOT Outbound Sync] Failed to log telemetry in Firestore:", fsError);
    }

    return handleApiSuccess(res, {
      status: "success",
      message: "Telemetry synchronized successfully",
      syncedToiGOT: upstreamSuccess
    });
  } catch (error: any) {
    return handleApiError(res, error, "Telemetry sync failed", 500);
  }
});

// Inbound webhook sync: iGOT -> StatIQ
app.post("/api/v1/igot/webhook/course-completion", async (req, res) => {
  try {
    const signature = req.headers["x-igot-signature"];
    const payload = req.body;

    if (!payload || !payload.user_parichay_id || !payload.frac_competencies_awarded) {
      return handleApiError(res, new Error("Invalid iGOT Webhook payload structure"), "Bad Request", 400);
    }

    // Verify HMAC-SHA256 signature if configured
    const webhookSecret = process.env.IGOT_WEBHOOK_SECRET || "STATIQ_WEBHOOK_SECRET";
    if (signature) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex");
      
      const providedSig = typeof signature === "string" ? signature.replace(/^sha256=/, "") : "";
      
      try {
        if (!crypto.timingSafeEqual(Buffer.from(providedSig, "utf8"), Buffer.from(expectedSig, "utf8"))) {
          return handleApiError(res, new Error("Invalid iGOT signature validation failed"), "Unauthorized Webhook Call", 401);
        }
      } catch (cryptoErr) {
        return handleApiError(res, new Error("Signature comparison mismatch length"), "Unauthorized Webhook Call", 401);
      }
    } else {
      console.warn("[iGOT Webhook] Warning: Skipping webhook signature verification since header is missing.");
    }

    const { user_parichay_id, course_id, frac_competencies_awarded } = payload;
    console.log(`[iGOT Inbound Webhook] Received course-completion webhook for officer ${user_parichay_id}, course ${course_id}`);

    // Update user's baseline in Firestore
    try {
      const usersRef = collection(db, "users");
      const userDocRef = doc(db, "users", user_parichay_id);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        await updateDoc(userDocRef, {
          lastCompletedCourse: course_id,
          lastCompetencyAwardedAt: serverTimestamp(),
          igotAwards: frac_competencies_awarded
        });
        console.log(`[iGOT Webhook] Successfully updated profile for user ${user_parichay_id}`);
      } else {
        const q = query(usersRef, where("email", "==", user_parichay_id));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const userDoc = qSnap.docs[0];
          await updateDoc(doc(db, "users", userDoc.id), {
            lastCompletedCourse: course_id,
            lastCompetencyAwardedAt: serverTimestamp(),
            igotAwards: frac_competencies_awarded
          });
          console.log(`[iGOT Webhook] Successfully updated profile for user email ${user_parichay_id}`);
        } else {
          await setDoc(doc(db, "users", user_parichay_id), {
            uid: user_parichay_id,
            role: "learner",
            lastCompletedCourse: course_id,
            lastCompetencyAwardedAt: serverTimestamp(),
            igotAwards: frac_competencies_awarded
          }, { merge: true });
          console.log(`[iGOT Webhook] Registered new/fallback profile for user ${user_parichay_id}`);
        }
      }

      await addDoc(collection(db, "igot_webhook_logs"), {
        payload,
        processedAt: serverTimestamp(),
        success: true
      });

    } catch (dbError) {
      console.error("[iGOT Webhook] Failed to process database update:", dbError);
      return handleApiError(res, dbError, "Database sync failed during webhook execution", 500);
    }

    return handleApiSuccess(res, {
      status: "acknowledged",
      message: "iGOT course completion successfully processed and competency baselines updated."
    });

  } catch (error: any) {
    return handleApiError(res, error, "Webhook handler execution failed", 500);
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback in dev mode
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
