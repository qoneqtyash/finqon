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
 * Accepts a publicly-accessible image URL (Vercel Blob).
 */
export async function ocrImage(imageUrl: string): Promise<VlmResult> {
  // Try Qwen first
  try {
    const rawText = await callQwen(imageUrl);
    const data = extractJson(rawText);
    if (data) {
      return { data, provider: "qwen" };
    }
    console.warn("Qwen returned unparseable response, falling back to GPT-4o");
  } catch (err) {
    console.warn("Qwen failed, falling back to GPT-4o:", (err as Error).message);
  }

  // Fallback to GPT-4o
  try {
    const rawText = await callOpenAI(imageUrl);
    const data = extractJson(rawText);
    if (data) {
      return { data, provider: "openai" };
    }
    throw new Error("GPT-4o returned unparseable JSON response");
  } catch (err) {
    throw new Error(`Both VLM providers failed. Last error: ${(err as Error).message}`);
  }
}
