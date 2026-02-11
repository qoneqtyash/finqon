import { OcrData } from "@/types/voucher";

/**
 * Extract a JSON object from VLM response text.
 * Ported from ocr_receipts.py lines 48-74.
 * Handles markdown code fences and bare JSON.
 */
export function extractJson(text: string): OcrData | null {
  // Strip Qwen3 thinking blocks if present
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // Try markdown code block first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Find the first balanced { ... } block
  let depth = 0;
  let start: number | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== null) {
        try {
          return JSON.parse(text.slice(start, i + 1)) as OcrData;
        } catch {
          // Malformed JSON in this block, keep scanning
          continue;
        }
      }
    }
  }

  // Fallback: try parsing the whole text
  try {
    return JSON.parse(text) as OcrData;
  } catch {
    return null;
  }
}
