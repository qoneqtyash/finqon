import { NextRequest, NextResponse } from "next/server";
import { ocrImage } from "@/lib/vlm/client";

/**
 * POST /api/ocr
 * Runs OCR on a single base64 image using Qwen VL (primary) → GPT-4o (fallback).
 *
 * Body: { imageBase64: string }  (raw base64, no data URI prefix)
 * Returns: { data: OcrData, provider: "qwen" | "openai" }
 */
export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const dataUri = `data:image/jpeg;base64,${imageBase64}`;
    const result = await ocrImage(dataUri);

    return NextResponse.json(result);
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
