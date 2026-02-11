"use client";

interface ProcessingStatusProps {
  total: number;
  completed: number;
  failed: number;
  stage: "uploading" | "extracting" | "ocr" | "done";
}

const stageLabels: Record<ProcessingStatusProps["stage"], string> = {
  uploading: "Uploading files...",
  extracting: "Extracting images from documents...",
  ocr: "Running OCR on images...",
  done: "Processing complete!",
};

export default function ProcessingStatus({
  total,
  completed,
  failed,
  stage,
}: ProcessingStatusProps) {
  const progress = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {stageLabels[stage]}
        </span>
        <span className="text-sm text-gray-500">
          {completed + failed} / {total}
          {failed > 0 && (
            <span className="text-red-500 ml-1">({failed} failed)</span>
          )}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            stage === "done" ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
