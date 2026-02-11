import { NextRequest, NextResponse } from "next/server";
import { extractImagesFromDocx } from "@/lib/files/docx-extractor";
import { extractImagesFromPdf } from "@/lib/files/pdf-extractor";
import { optimizeImage } from "@/lib/files/image-optimizer";

/**
 * POST /api/process
 * Accepts FormData with a "file" field.
 * Extracts images from DOCX/PDF (or passes through direct images),
 * optimizes them with sharp, returns base64 JPEG strings.
 *
 * Returns: { images: [{ name: string, base64: string }] }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const buffer = await file.arrayBuffer();

    let rawImages: { name: string; data: Uint8Array }[];

    if (ext === "docx") {
      rawImages = await extractImagesFromDocx(buffer);
    } else if (ext === "pdf") {
      rawImages = await extractImagesFromPdf(buffer);
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      rawImages = [{ name: file.name, data: new Uint8Array(buffer) }];
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}` },
        { status: 400 }
      );
    }

    if (rawImages.length === 0) {
      return NextResponse.json(
        { error: "No images found in the uploaded file" },
        { status: 400 }
      );
    }

    // Optimize each image and convert to base64
    const images: { name: string; base64: string }[] = [];

    for (const img of rawImages) {
      const optimized = await optimizeImage(img.data);
      const b64 = Buffer.from(optimized).toString("base64");
      images.push({
        name: img.name.replace(/\.[^.]+$/, ".jpeg"),
        base64: b64,
      });
    }

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Process error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
