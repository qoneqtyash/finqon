"use client";

import { useState } from "react";
import { ExtractedImage } from "@/hooks/useOcrProcessing";

export interface FailedImage {
  image: ExtractedImage;
  error: string;
}

interface FailedImagesProps {
  failedImages: FailedImage[];
  onRetry: (image: ExtractedImage) => Promise<void>;
  onRetryAll: () => Promise<void>;
  onDismiss: (imageName: string) => void;
  onDismissAll: () => void;
  isRetrying: boolean;
}

export default function FailedImages({
  failedImages,
  onRetry,
  onRetryAll,
  onDismiss,
  onDismissAll,
  isRetrying,
}: FailedImagesProps) {
  const [retryingIndex, setRetryingIndex] = useState<string | null>(null);

  if (failedImages.length === 0) return null;

  const handleRetrySingle = async (fi: FailedImage) => {
    setRetryingIndex(fi.image.name);
    await onRetry(fi.image);
    setRetryingIndex(null);
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-red-800">
          {failedImages.length} Failed Image{failedImages.length > 1 ? "s" : ""}
        </h3>
        <div className="flex items-center gap-2">
          {failedImages.length > 1 && (
            <button
              onClick={onRetryAll}
              disabled={isRetrying}
              className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isRetrying ? "Retrying..." : "Retry All"}
            </button>
          )}
          <button
            onClick={onDismissAll}
            className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
          >
            Dismiss All
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {failedImages.map((fi) => (
          <div
            key={fi.image.name}
            className="flex items-center gap-3 bg-white rounded-lg p-2 border border-red-100"
          >
            {/* Thumbnail */}
            <img
              src={`data:image/jpeg;base64,${fi.image.base64}`}
              alt={fi.image.name}
              className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {fi.image.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                from {fi.image.sourceFileName}
              </p>
              <p className="text-xs text-red-500 truncate" title={fi.error}>
                {fi.error}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleRetrySingle(fi)}
                disabled={isRetrying || retryingIndex === fi.image.name}
                className="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {retryingIndex === fi.image.name ? "..." : "Retry"}
              </button>
              <button
                onClick={() => onDismiss(fi.image.name)}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"
                title="Dismiss"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
