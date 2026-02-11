"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "@/types/voucher";

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const addFiles = useCallback((newFiles: File[]) => {
    const entries: UploadedFile[] = newFiles.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      type: file.type,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...entries]);
    return entries;
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFile = useCallback(
    (id: string, updates: Partial<UploadedFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const uploadFile = useCallback(
    async (entry: UploadedFile): Promise<string> => {
      updateFile(entry.id, { status: "uploading" });

      try {
        const formData = new FormData();
        formData.append("file", entry.file);

        const resp = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Upload failed");
        }

        const { url } = await resp.json();
        updateFile(entry.id, { status: "uploaded", blobUrl: url });
        return url;
      } catch (err) {
        updateFile(entry.id, {
          status: "error",
          error: (err as Error).message,
        });
        throw err;
      }
    },
    [updateFile]
  );

  /**
   * Upload all entries, returns a map of file id → blob URL for successfully uploaded files.
   */
  const uploadAll = useCallback(
    async (entries: UploadedFile[]): Promise<Map<string, string>> => {
      const results = new Map<string, string>();
      const concurrency = 3;
      const queue = [...entries];

      const worker = async () => {
        while (queue.length > 0) {
          const entry = queue.shift();
          if (!entry) break;
          try {
            const blobUrl = await uploadFile(entry);
            results.set(entry.id, blobUrl);
          } catch {
            // Error already handled in uploadFile
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, entries.length) }, () => worker())
      );

      return results;
    },
    [uploadFile]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    updateFile,
    uploadFile,
    uploadAll,
    clearFiles,
  };
}
