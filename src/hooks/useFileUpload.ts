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

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    updateFile,
    clearFiles,
  };
}
