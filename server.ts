import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";
import { handleApiError, handleApiSuccess } from "./src/lib/apiUtils";
import crypto from "crypto";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./src/lib/firebase";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client with standard user agent header
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
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
    const client = getGeminiClient();
    
    const { sourceText, totalQuestions, bloomL1, bloomL2, bloomL3, competencyTag, pdfBase64 } = req.body;
    
    if (!sourceText && !pdfBase64) {
      return handleApiError(res, new Error("No source text or PDF provided"), "Invalid Request", 400);
    }

    const ragContextText = chunkAndSelectContext(sourceText || "", competencyTag || "Sampling", 4);

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
              explanation: { type: Type.STRING, description: "Explicit methodological rationale" },
              bloom_level: { type: Type.STRING, description: "Must be 'L1: Recall', 'L2: Application', or 'L3: Scenario'" },
              topic_tag: { type: Type.STRING, description: "One of the 8 MoSPI FRAC axes: Sampling, Accounts, Indices, Python/R, GIS, Governance, Quality, Field Ops" },
              data_table_markdown: { type: Type.STRING, description: "Optional markdown table for data interpretation questions" }
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

    const systemInstruction = `You are the official AI Assessment & Competency Intelligence Engine for India's Ministry of Statistics and Programme Implementation (MoSPI) and NSSTA / iGOT Karmayogi FRAC framework.

Your task is to ingest uploaded official ministerial documentation (such as NSSO survey manuals, ASI circulars, National Accounts guidelines, or DPDP Act compliance rules) and output a rigorously validated JSON question bank that can be edited and previewed directly in a Trainer QA interface.

INGESTION & GENERATION REQUIREMENTS:
1. QUESTION FORMAT & QUANTITY: Generate exactly ${totalQuestions || 5} multiple-choice questions (MCQs) complete with exactly 4 options, the correct option index (0-3), an explicit methodological rationale explaining why the answer is correct, and Bloom's cognitive taxonomy level ('L1: Recall', 'L2: Application', 'L3: Scenario').
2. COMPETENCY MAPPING: Tag every question to one of the 8 official MoSPI FRAC axes: Sampling, Accounts, Indices, Python/R, GIS, Governance, Quality, or Field Ops.
3. EDITABLE JSON SCHEMA ENFORCEMENT: Enforce strict Pydantic JSON validation matching:

{
  "assessment_title": "[Descriptive Assessment Title]",
  "target_cadre": "JSO / SSO / Field Officers",
  "target_domain": "${competencyTag || "Sampling"}",
  "questions": [
    {
      "id": "q1",
      "question_text": "[Question prompt text]",
      "options": ["[Option A]", "[Option B]", "[Option C]", "[Option D]"],
      "correct_option_index": 0,
      "explanation": "[Detailed methodological rationale]",
      "bloom_level": "L2: Application",
      "topic_tag": "${competencyTag || "Sampling"}"
    }
  ]
}

Allowed Bloom Levels for this generation: ${allowedBloomLevels}.
Tag every question to one of the 8 official MoSPI FRAC axes: Sampling, Accounts, Indices, Python/R, GIS, Governance, Quality, Field Ops.
Strictly adhere to the provided JSON Schema.`;

    let contents: any;
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      contents = [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64,
          },
        },
        `Please ingest the uploaded official PDF document and RAG text context:\n\n${ragContextText}\n\nGenerate exactly ${totalQuestions || 5} questions matching the requirements for competency domain ${competencyTag || "Sampling"}. Ensure technical statistical accuracy.`
      ];
    } else {
      contents = `Convert the following official RAG context into structured assessment JSON:\n\n${ragContextText}`;
    }

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-pro"];
    let retryCount = 0;
    const maxRetries = 2;
    let outputText = "";
    
    while (retryCount <= maxRetries) {
      const modelName = modelsToTry[retryCount % modelsToTry.length];
      try {
        console.log(`[Gemini Engine] Attempt ${retryCount + 1} using model: ${modelName}`);
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
        console.warn(`[Gemini Engine] Attempt ${retryCount + 1} (${modelName}) failed:`, genError.message);
        if (retryCount === maxRetries) {
          return handleApiError(res, new Error("Failed to generate valid questions after retries: " + genError.message), "Generation Failed", 500);
        }
      }
      retryCount++;
    }
    
    return handleApiError(res, new Error("Failed to generate questions"), "Generation Failed", 500);
    
  } catch (error: any) {
    return handleApiError(res, error, "Failed to generate quiz", 500);
  }
});

// --- iGOT Karmayogi Telemetry & Webhook Synchronizer ---

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
    app.use("*", async (req, res, next) => {
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
