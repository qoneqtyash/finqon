"use client";

import { UploadedFile } from "@/types/voucher";

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

const statusConfig: Record<UploadedFile["status"], { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-gray-500" },
  uploading: { label: "Uploading...", color: "text-blue-500" },
  uploaded: { label: "Uploaded", color: "text-blue-600" },
  processing: { label: "Processing...", color: "text-amber-600" },
  done: { label: "Done", color: "text-green-600" },
  error: { label: "Error", color: "text-red-600" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("pdf")) return "📄";
  if (type.includes("document") || type.includes("docx")) return "📝";
  return "📎";
}

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium text-gray-700">
        {files.length} file{files.length !== 1 ? "s" : ""} selected
      </h3>
      <div className="space-y-1.5">
        {files.map((f) => {
          const status = statusConfig[f.status];
          return (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200"
            >
              <span className="text-lg">{fileIcon(f.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {f.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatSize(f.file.size)}
                </p>
              </div>
              <span className={`text-xs font-medium ${status.color}`}>
                {f.error || status.label}
              </span>
              {(f.status === "pending" || f.status === "error") && (
                <button
                  onClick={() => onRemove(f.id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
