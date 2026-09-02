import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini client (ensure GEMINI_API_KEY is in your environment or .env.example will tell users)
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (error) {
  console.warn("Failed to initialize Gemini API client:", error);
}

app.post("/api/generate-quiz", async (req, res) => {
  try {
    if (!ai) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    
    const { sourceText } = req.body;
    
    if (!sourceText) {
      return res.status(400).json({ error: "No source text provided" });
    }

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        assessment_title: { type: Type.STRING },
        target_competency: { type: Type.STRING },
        difficulty_level: { type: Type.STRING, description: "Enum: Basic, Intermediate, Advanced" },
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
              correct_option_index: { type: Type.INTEGER, description: "0-based index (0 to 3)" },
              bloom_taxonomy_level: { type: Type.STRING, description: "Enum: 'Recall (L1)', 'Application (L2)', 'Scenario (L3)'" },
              explanation: { type: Type.STRING },
              topic_tag: { type: Type.STRING }
            },
            required: ["id", "question_text", "options", "correct_option_index", "bloom_taxonomy_level", "explanation", "topic_tag"]
          }
        }
      },
      required: ["assessment_title", "target_competency", "difficulty_level", "questions"]
    };

    const systemInstruction = `You are the official Assessment & Competency Intelligence Engine for India's Ministry of Statistics and Programme Implementation (MoSPI) and the iGOT Karmayogi FRAC framework.

Your task is to ingest statistical text, circulars, survey manuals (NSSO, ASI, CPI, IIP, National Accounts), or governance guidelines (DPDP Act 2023, NDSAP) and convert them into structured assessment JSON.

Rules:
1. Ensure all questions are factually grounded in the provided context.
2. Formulate 4 clear, plausible options with exactly 1 correct answer.
3. Categorize cognitive difficulty using Bloom's Taxonomy: 'Recall (L1)', 'Application (L2)', or 'Scenario (L3)'.
4. Provide an official justification/explanation for the correct answer referencing methodology.
5. Strictly adhere to the provided JSON Schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Convert the following official text into structured assessment JSON:\n\n${sourceText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const outputText = response.text;
    if (outputText) {
      const assessmentData = JSON.parse(outputText);
      res.json(assessmentData);
    } else {
      res.status(500).json({ error: "Failed to generate questions" });
    }
    
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
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
