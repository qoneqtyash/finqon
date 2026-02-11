"use client";

import { useState, useCallback } from "react";
import { OcrResult } from "@/types/voucher";

interface ProcessingState {
  total: number;
  completed: number;
  failed: number;
  stage: "uploading" | "extracting" | "ocr" | "done";
}

export interface ExtractedImage {
  name: string;
  base64: string;
  sourceFileName: string;
}

export function useOcrProcessing() {
  const [processing, setProcessing] = useState<ProcessingState>({
    total: 0,
    completed: 0,
    failed: 0,
    stage: "done",
  });

  /**
   * Send a file to /api/process, get back base64 images.
   */
  const extractImages = useCallback(
    async (file: File): Promise<ExtractedImage[]> => {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to process file");
      }

      const { images } = await resp.json();
      return (images as { name: string; base64: string }[]).map((img) => ({
        ...img,
        sourceFileName: file.name,
      }));
    },
    []
  );

  /**
   * Run OCR on a single base64 image. Calls /api/ocr.
   */
  const ocrSingleImage = useCallback(
    async (imageBase64: string): Promise<OcrResult> => {
      const resp = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        return {
          imageUrl: `data:image/jpeg;base64,${imageBase64.slice(0, 50)}`,
          data: null,
          provider: "qwen",
          error: err.error,
        };
      }

      const result = await resp.json();
      return {
        imageUrl: "",
        data: result.data,
        provider: result.provider,
      };
    },
    []
  );

  /**
   * Run OCR on multiple base64 images with concurrency limit.
   */
  const ocrBatch = useCallback(
    async (images: ExtractedImage[]): Promise<(OcrResult & { image: ExtractedImage })[]> => {
      setProcessing({
        total: images.length,
        completed: 0,
        failed: 0,
        stage: "ocr",
      });

      const results: (OcrResult & { image: ExtractedImage })[] = [];
      const concurrency = 3;
      const queue = [...images];

      const worker = async () => {
        while (queue.length > 0) {
          const img = queue.shift();
          if (!img) break;

          const result = await ocrSingleImage(img.base64);
          results.push({ ...result, image: img });

          setProcessing((prev) => ({
            ...prev,
            completed: prev.completed + (result.data ? 1 : 0),
            failed: prev.failed + (result.error ? 1 : 0),
          }));
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, images.length) }, () =>
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
    ocrBatch,
  };
}
