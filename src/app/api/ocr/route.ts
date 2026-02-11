import { NextRequest, NextResponse } from "next/server";
import { ocrImage } from "@/lib/vlm/client";

// Allow up to 60s on Vercel (Hobby plan max) — VLM calls take 10-30s
export const maxDuration = 60;

const MAX_BASE64_SIZE = 10 * 1024 * 1024; // ~10MB base64 (roughly 7.5MB image)

/**
 * POST /api/ocr
 * Runs OCR on a single base64 image using Qwen VL (primary) → GPT-4o (fallback).
 *
 * Body: { imageBase64: string }  (raw base64, no data URI prefix)
 * Returns: { data: OcrData, provider: "qwen" | "openai" }
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required and must be a string" },
        { status: 400 }
      );
    }

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json(
        { error: "Image too large for OCR processing" },
        { status: 400 }
      );
    }

    const dataUri = `data:image/jpeg;base64,${imageBase64}`;
    console.log(`[OCR] Processing image (${Math.round(imageBase64.length / 1024)}KB base64)`);
    const result = await ocrImage(dataUri);
    console.log(`[OCR] Success: provider=${result.provider}, company=${result.data?.company || "unknown"}`);

    return NextResponse.json(result);
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
