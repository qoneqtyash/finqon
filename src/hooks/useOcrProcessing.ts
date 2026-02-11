"use client";

import { useState, useCallback } from "react";
import { OcrResult } from "@/types/voucher";

interface ProcessingState {
  total: number;
  completed: number;
  failed: number;
  stage: "uploading" | "extracting" | "ocr" | "done";
}

export function useOcrProcessing() {
  const [processing, setProcessing] = useState<ProcessingState>({
    total: 0,
    completed: 0,
    failed: 0,
    stage: "done",
  });

  /**
   * Extract images from an uploaded file (DOCX/PDF → images, or pass through).
   * Calls /api/process.
   */
  const extractImages = useCallback(
    async (blobUrl: string, filename: string): Promise<string[]> => {
      const resp = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blobUrl, filename }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to process file");
      }

      const { imageUrls } = await resp.json();
      return imageUrls as string[];
    },
    []
  );

  /**
   * Run OCR on a single image URL. Calls /api/ocr.
   */
  const ocrSingleImage = useCallback(
    async (imageUrl: string): Promise<OcrResult> => {
      const resp = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        return { imageUrl, data: null, provider: "qwen", error: err.error };
      }

      const result = await resp.json();
      return {
        imageUrl,
        data: result.data,
        provider: result.provider,
      };
    },
    []
  );

  /**
   * Run OCR on multiple images with concurrency limit.
   */
  const ocrBatch = useCallback(
    async (imageUrls: string[]): Promise<OcrResult[]> => {
      setProcessing({
        total: imageUrls.length,
        completed: 0,
        failed: 0,
        stage: "ocr",
      });

      const results: OcrResult[] = [];
      const concurrency = 3;
      const queue = [...imageUrls];

      const worker = async () => {
        while (queue.length > 0) {
          const url = queue.shift();
          if (!url) break;

          const result = await ocrSingleImage(url);
          results.push(result);

          setProcessing((prev) => ({
            ...prev,
            completed: prev.completed + (result.data ? 1 : 0),
            failed: prev.failed + (result.error ? 1 : 0),
          }));
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, imageUrls.length) }, () =>
          worker()
        )
      );

      setProcessing((prev) => ({ ...prev, stage: "done" }));
      return results;
    },
    [ocrSingleImage]
  );

  return {
    processing,
    setProcessing,
    extractImages,
    ocrSingleImage,
    ocrBatch,
  };
}
