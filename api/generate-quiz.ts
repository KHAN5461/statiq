import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize Gemini client
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', success: false });
  }

  try {
    const client = getGeminiClient();
    
    const { sourceText, totalQuestions, bloomL1, bloomL2, bloomL3, competencyTag, pdfBase64 } = req.body || {};
    
    if (!sourceText && !pdfBase64) {
      return res.status(400).json({ error: 'No source text or PDF provided', success: false });
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
        {
          text: `Please ingest the uploaded official PDF document and RAG text context:\n\n${ragContextText}\n\nGenerate exactly ${totalQuestions || 5} questions matching the requirements for competency domain ${competencyTag || "Sampling"}. Ensure technical statistical accuracy.`
        }
      ];
    } else {
      contents = `Convert the following official RAG context into structured assessment JSON:\n\n${ragContextText}`;
    }

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-pro-preview"];
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
          return res.status(200).json({ data: sanitized, success: true });
        }
      } catch (genError: any) {
        console.warn(`[Gemini Engine] Attempt ${retryCount + 1} (${modelName}) failed:`, genError.message);
        if (retryCount === maxRetries) {
          return res.status(500).json({ error: "Failed to generate valid questions after retries: " + genError.message, success: false });
        }
      }
      retryCount++;
    }
    
    return res.status(500).json({ error: "Failed to generate questions", success: false });
    
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate quiz", success: false });
  }
}
