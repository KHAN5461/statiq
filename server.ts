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

// The API routes have been moved to the `/api` directory for Vercel Serverless Function compatibility.

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
