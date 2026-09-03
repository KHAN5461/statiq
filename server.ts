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

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const client = getGeminiClient();
    
    const { sourceText, totalQuestions, bloomL1, bloomL2, bloomL3, competencyTag, pdfBase64 } = req.body;
    
    if (!sourceText && !pdfBase64) {
      return handleApiError(res, new Error("No source text or PDF provided"), "Invalid Request", 400);
    }

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        assessment_id: { type: Type.STRING },
        title: { type: Type.STRING },
        target_cadre: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        target_domain: { type: Type.STRING },
        passing_criteria_pct: { type: Type.INTEGER },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              section_name: { type: Type.STRING },
              type: { type: Type.STRING, description: "Must be either 'standard_mcq' or 'data_interpretation_caselet'" },
              data_table_markdown: { type: Type.STRING, description: "Markdown format data table. Only populated if type is data_interpretation_caselet, otherwise leave empty." },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    bloom_level: { type: Type.STRING, description: "Must be 'Recall', 'Application', or 'Scenario'" },
                    prompt: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array of exactly 4 strings representing options."
                    },
                    correct_index: { type: Type.INTEGER, description: "0-based index of correct option (0 to 3)" },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "bloom_level", "prompt", "options", "correct_index", "explanation"]
                }
              }
            },
            required: ["section_name", "type", "questions"]
          }
        }
      },
      required: ["assessment_id", "title", "target_cadre", "target_domain", "passing_criteria_pct", "sections"]
    };

    const l1Text = bloomL1 !== false ? "'Recall'" : "";
    const l2Text = bloomL2 !== false ? "'Application'" : "";
    const l3Text = bloomL3 === true ? "'Scenario'" : "";
    const allowedBloomLevels = [l1Text, l2Text, l3Text].filter(Boolean).join(", ") || "'Recall', 'Application'";

    const systemInstruction = `You are the official Assessment & Competency Intelligence Engine for India's Ministry of Statistics and Programme Implementation (MoSPI) and the iGOT Karmayogi FRAC framework.

Your task is to ingest statistical text, circulars, survey manuals (NSSO, ASI, CPI, IIP, National Accounts), or governance guidelines (DPDP Act 2023, NDSAP) and convert them into a structured assessment JSON.

Rules:
1. Generate a comprehensive assessment containing sections of different types as requested.
2. The overall JSON structure must follow exactly:
{
  "assessment_id": "ASMT-[Year]-[Topic]-[Random]",
  "title": "[Descriptive MoSPI Assessment Title]",
  "target_cadre": ["JSO", "SSO"],
  "target_domain": "${competencyTag || "Survey Sampling & Estimation"}",
  "passing_criteria_pct": 70,
  "sections": [
    {
      "section_name": "[Descriptive Section Name, e.g., Part A: Methodological MCQs]",
      "type": "standard_mcq",
      "questions": [
        {
          "id": "q101",
          "bloom_level": "Recall",
          "prompt": "[Question text]",
          "options": ["[Option A]", "[Option B]", "[Option C]", "[Option D]"],
          "correct_index": [0-3 integer],
          "explanation": "[Detailed methodological explanation]"
        }
      ]
    },
    {
      "section_name": "[Descriptive Section Name, e.g., Part B: Tabular Data Interpretation]",
      "type": "data_interpretation_caselet",
      "data_table_markdown": "[A realistic Markdown table representing survey data, strata variance, sampling allocations, or indices CPI/IIP, e.g., | Stratum | Total Enterprises ($N_h$) | Variance ($S_h$) |\\n|---|---|---|\\n| Rural Small | 1200 | 14.2 |\\n| Rural Large | 300 | 48.6 |]",
      "questions": [
        {
          "id": "q201",
          "bloom_level": "Application",
          "prompt": "[A quantitative or analytical question interpreting the markdown table above]",
          "options": ["[Option A]", "[Option B]", "[Option C]", "[Option D]"],
          "correct_index": [0-3 integer],
          "explanation": "[Analytical justification of correct index referencing Neyman, allocation, or data from table]"
        }
      ]
    }
  ]
}
3. Generate exactly ${totalQuestions || 5} total questions distributed across the sections. Create at least 2 sections: one of type 'standard_mcq' and another of type 'data_interpretation_caselet' with a realistic statistical Markdown table.
4. Distribute question difficulty using Bloom's Taxonomy. Allowed levels for this generation: ${allowedBloomLevels}.
5. Provide an official justification/explanation for the correct answer referencing methodology.
6. Strictly adhere to the provided JSON Schema.`;

    let contents: any;
    if (pdfBase64) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            text: `Please ingest the uploaded PDF document and generate exactly ${totalQuestions || 5} questions matching the requirements. Ensure a high level of technical statistical accuracy in the questions.`,
          },
        ],
      };
    } else {
      contents = `Convert the following official text into structured assessment JSON:\n\n${sourceText}`;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const outputText = response.text;
    if (outputText) {
      const assessmentData = JSON.parse(outputText);
      return handleApiSuccess(res, assessmentData);
    } else {
      return handleApiError(res, new Error("Failed to generate questions"), "Generation Failed", 500);
    }
    
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
