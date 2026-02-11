import { OcrData } from "@/types/voucher";
import { callQwen } from "./qwen";
import { callOpenAI } from "./openai";
import { extractJson } from "./parse-response";

export interface VlmResult {
  data: OcrData;
  provider: "qwen" | "openai";
}

/**
 * Dual VLM client with failover: Qwen VL (primary) → GPT-4o (fallback).
 * Accepts a data URI (data:image/jpeg;base64,...).
 */
export async function ocrImage(imageDataUri: string): Promise<VlmResult> {
  // Try Qwen first
  try {
    const rawText = await callQwen(imageDataUri);
    console.log(`[VLM] Qwen raw response (first 300 chars): ${rawText.slice(0, 300)}`);
    const data = extractJson(rawText);
    if (data) {
      return { data, provider: "qwen" };
    }
    console.warn("[VLM] Qwen returned unparseable response, falling back to GPT-4o");
  } catch (err) {
    console.warn("[VLM] Qwen failed, falling back to GPT-4o:", (err as Error).message);
  }

  // Fallback to GPT-4o
  try {
    const rawText = await callOpenAI(imageDataUri);
    console.log(`[VLM] OpenAI raw response (first 300 chars): ${rawText.slice(0, 300)}`);
    const data = extractJson(rawText);
    if (data) {
      return { data, provider: "openai" };
    }
    throw new Error("GPT-4o returned unparseable JSON response");
  } catch (err) {
    throw new Error(`Both VLM providers failed. Last error: ${(err as Error).message}`);
  }
}
