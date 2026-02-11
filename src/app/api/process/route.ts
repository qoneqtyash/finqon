import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { extractImagesFromDocx } from "@/lib/files/docx-extractor";
import { extractImagesFromPdf } from "@/lib/files/pdf-extractor";
import { optimizeImage } from "@/lib/files/image-optimizer";

/**
 * POST /api/process
 * Takes a Blob URL of an uploaded file, extracts images if DOCX/PDF,
 * optimizes all images, and uploads them to Blob.
 * Returns array of optimized image Blob URLs.
 *
 * Body: { url: string, filename: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { url, filename } = await request.json();

    if (!url || !filename) {
      return NextResponse.json(
        { error: "url and filename are required" },
        { status: 400 }
      );
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";

    // Fetch the file from Blob storage
    const fileResp = await fetch(url);
    if (!fileResp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch uploaded file" },
        { status: 400 }
      );
    }
    const buffer = await fileResp.arrayBuffer();

    let images: { name: string; data: Uint8Array }[];

    if (ext === "docx") {
      images = await extractImagesFromDocx(buffer);
    } else if (ext === "pdf") {
      images = await extractImagesFromPdf(buffer);
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      // Direct image — just wrap it
      images = [{ name: filename, data: new Uint8Array(buffer) }];
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}` },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images found in the uploaded file" },
        { status: 400 }
      );
    }

    // Optimize and upload each image to Blob
    const imageUrls: string[] = [];

    for (const img of images) {
      const optimized = await optimizeImage(img.data);
      const blobName = `processed/${Date.now()}_${img.name.replace(/\.[^.]+$/, ".jpeg")}`;
      const blob = await put(blobName, Buffer.from(optimized), {
        access: "public",
        contentType: "image/jpeg",
      });
      imageUrls.push(blob.url);
    }

    return NextResponse.json({ imageUrls });
  } catch (err) {
    console.error("Process error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
