import { createRequire } from "module";

const require = createRequire(import.meta.url);

export async function extractTextFromPdfBase64(base64Data: string): Promise<string> {
  try {
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, "").trim();
    const buffer = Buffer.from(cleanBase64, "base64");
    
    // Try pdf-parse
    try {
      const pdfLib = require("pdf-parse");
      if (pdfLib && pdfLib.PDFParse) {
        const parser = new pdfLib.PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        if (result && typeof result.text === "string" && result.text.trim().length > 0) {
          return result.text.trim();
        }
      }
    } catch (parseErr: any) {
      console.warn("[PDF Extractor] pdf-parse direct parser failed:", parseErr?.message);
    }

    // Secondary fallback: extract readable ASCII/UTF-8 text streams from PDF buffer
    const rawString = buffer.toString("binary");
    const textBlocks: string[] = [];
    
    // Match stream blocks and BT...ET blocks
    const btMatches = rawString.match(/BT[\s\S]*?ET/g);
    if (btMatches && btMatches.length > 0) {
      for (const block of btMatches) {
        // Match string literals ( ... ) Tj or TJ
        const tjMatches = block.match(/\((.*?)\)\s*Tj/g);
        if (tjMatches) {
          const blockText = tjMatches.map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ');
          if (blockText.trim().length > 3) textBlocks.push(blockText.trim());
        }
      }
    }

    if (textBlocks.length > 0) {
      return textBlocks.join("\n");
    }

    // Generic printable character extraction if binary stream has embedded text
    const cleanText = rawString
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    return cleanText.slice(0, 100000);
  } catch (err: any) {
    console.error("[PDF Extractor] Error extracting text from PDF:", err);
    return "";
  }
}
