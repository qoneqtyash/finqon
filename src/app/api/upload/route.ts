import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * POST /api/upload
 * Server-side file upload to Vercel Blob.
 * Accepts FormData with a "file" field.
 * Returns { url, filename }.
 *
 * Works on localhost (unlike client-token flow which needs public callback).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["jpg", "jpeg", "png", "pdf", "docx"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} not allowed. Use: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url, filename: file.name });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
