var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/lib/apiUtils.ts
function handleApiError(res, error, defaultMessage = "Internal Server Error", statusCode = 500) {
  console.error("[API Error]:", error);
  if (error?.status) {
    statusCode = error.status;
  }
  const errorMessage = error?.message || defaultMessage;
  return res.status(statusCode).json({ error: errorMessage });
}
function handleApiSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

// server.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_firestore2 = require("firebase/firestore");

// src/lib/firebase.ts
var import_app = require("firebase/app");
var import_auth = require("firebase/auth");
var import_firestore = require("firebase/firestore");
var firebaseConfig = {
  projectId: "gen-lang-client-0078750575",
  appId: "1:648019862426:web:67ebcb9f3513663e495023",
  apiKey: "AIzaSyDn5Opix2OVuONnmDCdky0K18wtU2jjQBI",
  authDomain: "gen-lang-client-0078750575.firebaseapp.com",
  storageBucket: "gen-lang-client-0078750575.firebasestorage.app",
  messagingSenderId: "648019862426"
};
var app = (0, import_app.initializeApp)(firebaseConfig);
var auth = (0, import_auth.getAuth)(app);
var db = (0, import_firestore.getFirestore)(app, "ai-studio-karmayogistatiq-ffbe22f0-de82-4b76-8fb8-3e3560e0b36c");

// server.ts
import_dotenv.default.config();
var app2 = (0, import_express.default)();
var PORT = 3e3;
app2.use((0, import_cors.default)());
app2.use(import_express.default.json({ limit: "50mb" }));
app2.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var ai = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return ai;
}
function chunkAndSelectContext(text, tag, maxChunks = 4) {
  if (!text || text.length < 1e3) return text;
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = "";
  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > 1200) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  if (chunks.length <= maxChunks) return chunks.join("\n\n---\n\n");
  const tagKeywords = [tag, "sampling", "stratum", "fsu", "gva", "cpi", "dpdp", "anonymization", "variance", "allocation", "survey", "nsso", "asi", "quota", "weight"];
  const scoredChunks = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    tagKeywords.forEach((kw) => {
      if (kw && lower.includes(kw.toLowerCase())) score += 2;
    });
    return { chunk, score };
  });
  scoredChunks.sort((a, b) => b.score - a.score);
  const selected = scoredChunks.slice(0, maxChunks).map((c) => c.chunk);
  return selected.join("\n\n---\n\n");
}
function sanitizeAssessmentSchema(assessmentData, competencyTag) {
  if (!assessmentData) return { assessment_title: "MoSPI Assessment", questions: [] };
  const title = assessmentData.assessment_title || assessmentData.title || `${competencyTag || "Sampling"} Competency Assessment`;
  const cadre = assessmentData.target_cadre || "JSO / SSO Officers";
  const domain = assessmentData.target_domain || competencyTag || "Sampling";
  let rawQuestions = [];
  if (Array.isArray(assessmentData.questions)) {
    rawQuestions = assessmentData.questions;
  } else if (Array.isArray(assessmentData.sections)) {
    assessmentData.sections.forEach((sec) => {
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((q) => {
          rawQuestions.push({
            ...q,
            data_table_markdown: sec.data_table_markdown || q.data_table_markdown
          });
        });
      }
    });
  }
  const sanitizedQuestions = rawQuestions.map((q, idx) => {
    let opts = Array.isArray(q.options) ? q.options.map((o) => String(o?.text || o)) : ["Option A", "Option B", "Option C", "Option D"];
    while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
    opts = opts.slice(0, 4);
    return {
      id: `q${idx + 1}`,
      question_text: q.question_text || q.prompt || q.text || `Question ${idx + 1}`,
      options: opts,
      correct_option_index: typeof q.correct_option_index === "number" ? q.correct_option_index : q.correct_index ?? q.correctIndex ?? 0,
      explanation: q.explanation || q.rationale || "Official MoSPI methodological justification.",
      bloom_level: q.bloom_level || q.bloom || "L2: Application",
      topic_tag: q.topic_tag || domain,
      ...q.data_table_markdown ? { data_table_markdown: q.data_table_markdown } : {}
    };
  });
  return {
    assessment_title: title,
    target_cadre: cadre,
    target_domain: domain,
    questions: sanitizedQuestions
  };
}
app2.post("/api/generate-quiz", async (req, res) => {
  try {
    const client = getGeminiClient();
    const { sourceText, totalQuestions, bloomL1, bloomL2, bloomL3, competencyTag, pdfBase64 } = req.body;
    if (!sourceText && !pdfBase64) {
      return handleApiError(res, new Error("No source text or PDF provided"), "Invalid Request", 400);
    }
    const ragContextText = chunkAndSelectContext(sourceText || "", competencyTag || "Sampling", 4);
    const responseSchema = {
      type: import_genai.Type.OBJECT,
      properties: {
        assessment_title: { type: import_genai.Type.STRING },
        target_cadre: { type: import_genai.Type.STRING },
        target_domain: { type: import_genai.Type.STRING },
        passing_criteria_pct: { type: import_genai.Type.INTEGER },
        questions: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              id: { type: import_genai.Type.STRING },
              question_text: { type: import_genai.Type.STRING },
              options: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: "Array of exactly 4 strings representing options."
              },
              correct_option_index: { type: import_genai.Type.INTEGER, description: "0-based index of correct option (0 to 3)" },
              explanation: { type: import_genai.Type.STRING, description: "Explicit methodological rationale" },
              bloom_level: { type: import_genai.Type.STRING, description: "Must be 'L1: Recall', 'L2: Application', or 'L3: Scenario'" },
              topic_tag: { type: import_genai.Type.STRING, description: "One of the 8 MoSPI FRAC axes: Sampling, Accounts, Indices, Python/R, GIS, Governance, Quality, Field Ops" },
              data_table_markdown: { type: import_genai.Type.STRING, description: "Optional markdown table for data interpretation questions" }
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
    let contents;
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      contents = [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64
          }
        },
        `Please ingest the uploaded official PDF document and RAG text context:

${ragContextText}

Generate exactly ${totalQuestions || 5} questions matching the requirements for competency domain ${competencyTag || "Sampling"}. Ensure technical statistical accuracy.`
      ];
    } else {
      contents = `Convert the following official RAG context into structured assessment JSON:

${ragContextText}`;
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
            responseSchema
          }
        });
        outputText = response.text || "";
        if (outputText) {
          const rawParsed = JSON.parse(outputText);
          const sanitized = sanitizeAssessmentSchema(rawParsed, competencyTag || "Sampling");
          return handleApiSuccess(res, sanitized);
        }
      } catch (genError) {
        console.warn(`[Gemini Engine] Attempt ${retryCount + 1} (${modelName}) failed:`, genError.message);
        if (retryCount === maxRetries) {
          return handleApiError(res, new Error("Failed to generate valid questions after retries: " + genError.message), "Generation Failed", 500);
        }
      }
      retryCount++;
    }
    return handleApiError(res, new Error("Failed to generate questions"), "Generation Failed", 500);
  } catch (error) {
    return handleApiError(res, error, "Failed to generate quiz", 500);
  }
});
app2.post("/api/v1/igot/sync", async (req, res) => {
  try {
    const { user_parichay_id, assessment_id, scores, timestamp } = req.body;
    if (!user_parichay_id || !scores) {
      return handleApiError(res, new Error("Missing user_parichay_id or scores"), "Invalid Request", 400);
    }
    console.log(`[iGOT Outbound Sync] Syncing telemetry for officer ${user_parichay_id} on assessment ${assessment_id}`);
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
    try {
      await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db, "telemetry_logs"), {
        user_parichay_id,
        assessment_id,
        scores,
        clientTimestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        syncedToiGOT: upstreamSuccess,
        createdAt: (0, import_firestore2.serverTimestamp)()
      });
    } catch (fsError) {
      console.error("[iGOT Outbound Sync] Failed to log telemetry in Firestore:", fsError);
    }
    return handleApiSuccess(res, {
      status: "success",
      message: "Telemetry synchronized successfully",
      syncedToiGOT: upstreamSuccess
    });
  } catch (error) {
    return handleApiError(res, error, "Telemetry sync failed", 500);
  }
});
app2.post("/api/v1/igot/webhook/course-completion", async (req, res) => {
  try {
    const signature = req.headers["x-igot-signature"];
    const payload = req.body;
    if (!payload || !payload.user_parichay_id || !payload.frac_competencies_awarded) {
      return handleApiError(res, new Error("Invalid iGOT Webhook payload structure"), "Bad Request", 400);
    }
    const webhookSecret = process.env.IGOT_WEBHOOK_SECRET || "STATIQ_WEBHOOK_SECRET";
    if (signature) {
      const expectedSig = import_crypto.default.createHmac("sha256", webhookSecret).update(JSON.stringify(payload)).digest("hex");
      const providedSig = typeof signature === "string" ? signature.replace(/^sha256=/, "") : "";
      try {
        if (!import_crypto.default.timingSafeEqual(Buffer.from(providedSig, "utf8"), Buffer.from(expectedSig, "utf8"))) {
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
    try {
      const usersRef = (0, import_firestore2.collection)(db, "users");
      const userDocRef = (0, import_firestore2.doc)(db, "users", user_parichay_id);
      const userSnap = await (0, import_firestore2.getDoc)(userDocRef);
      if (userSnap.exists()) {
        await (0, import_firestore2.updateDoc)(userDocRef, {
          lastCompletedCourse: course_id,
          lastCompetencyAwardedAt: (0, import_firestore2.serverTimestamp)(),
          igotAwards: frac_competencies_awarded
        });
        console.log(`[iGOT Webhook] Successfully updated profile for user ${user_parichay_id}`);
      } else {
        const q = (0, import_firestore2.query)(usersRef, (0, import_firestore2.where)("email", "==", user_parichay_id));
        const qSnap = await (0, import_firestore2.getDocs)(q);
        if (!qSnap.empty) {
          const userDoc = qSnap.docs[0];
          await (0, import_firestore2.updateDoc)((0, import_firestore2.doc)(db, "users", userDoc.id), {
            lastCompletedCourse: course_id,
            lastCompetencyAwardedAt: (0, import_firestore2.serverTimestamp)(),
            igotAwards: frac_competencies_awarded
          });
          console.log(`[iGOT Webhook] Successfully updated profile for user email ${user_parichay_id}`);
        } else {
          await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "users", user_parichay_id), {
            uid: user_parichay_id,
            role: "learner",
            lastCompletedCourse: course_id,
            lastCompetencyAwardedAt: (0, import_firestore2.serverTimestamp)(),
            igotAwards: frac_competencies_awarded
          }, { merge: true });
          console.log(`[iGOT Webhook] Registered new/fallback profile for user ${user_parichay_id}`);
        }
      }
      await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db, "igot_webhook_logs"), {
        payload,
        processedAt: (0, import_firestore2.serverTimestamp)(),
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
  } catch (error) {
    return handleApiError(res, error, "Webhook handler execution failed", 500);
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app2.use(import_express.default.static(distPath));
    app2.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
