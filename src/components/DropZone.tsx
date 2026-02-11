"use client";

import { useCallback, useState, DragEvent, ChangeEvent } from "react";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".docx"];

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFiles = useCallback((fileList: FileList | File[]): File[] => {
    const files = Array.from(fileList);
    const valid: File[] = [];

    for (const file of files) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)) {
        if (file.size > 50 * 1024 * 1024) {
          alert(`${file.name} is too large (max 50MB)`);
          continue;
        }
        valid.push(file);
      } else {
        alert(`${file.name} is not a supported file type. Use JPEG, PNG, PDF, or DOCX.`);
      }
    }

    if (valid.length > 30) {
      alert("Maximum 30 files per batch. Only the first 30 will be used.");
      return valid.slice(0, 30);
    }

    return valid;
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const files = validateFiles(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [disabled, onFilesSelected, validateFiles]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || disabled) return;
      const files = validateFiles(e.target.files);
      if (files.length > 0) onFilesSelected(files);
      e.target.value = ""; // Reset so same file can be selected again
    },
    [disabled, onFilesSelected, validateFiles]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
        ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="space-y-3">
        <div className="text-4xl">📁</div>
        <p className="text-lg font-medium text-gray-700">
          {isDragOver ? "Drop files here" : "Drag & drop receipt files"}
        </p>
        <p className="text-sm text-gray-500">
          or click to browse — JPEG, PNG, PDF, DOCX (max 50MB each, 30 files)
        </p>
      </div>
    </div>
  );
}
