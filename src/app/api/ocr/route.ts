import { NextRequest, NextResponse } from "next/server";
import { ocrImage } from "@/lib/vlm/client";

/**
 * POST /api/ocr
 * Runs OCR on a single image URL using Qwen VL (primary) → GPT-4o (fallback).
 *
 * Body: { imageUrl: string }
 * Returns: { data: OcrData, provider: "qwen" | "openai" }
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const result = await ocrImage(imageUrl);

    return NextResponse.json(result);
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
