"use client";

import { useCallback, useState } from "react";
import DropZone from "@/components/DropZone";
import FileList from "@/components/FileList";
import ProcessingStatus from "@/components/ProcessingStatus";
import VoucherList from "@/components/VoucherList";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useOcrProcessing, ExtractedImage } from "@/hooks/useOcrProcessing";
import { useVoucherState } from "@/hooks/useVoucherState";
import { mapOcrToVoucher } from "@/lib/utils/field-mapper";
import { UploadedFile } from "@/types/voucher";

export default function Home() {
  const { files, addFiles, removeFile, updateFile, clearFiles } =
    useFileUpload();
  const { processing, setProcessing, extractImages, ocrBatch } =
    useOcrProcessing();
  const { vouchers, addVouchers, updateVoucher, removeVoucher, clearAll } =
    useVoucherState();

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      addFiles(newFiles);
    },
    [addFiles]
  );

  const handleProcess = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsRunning(true);
    setError(null);

    try {
      // Step 1: Extract images from each file
      setProcessing({
        total: pendingFiles.length,
        completed: 0,
        failed: 0,
        stage: "extracting",
      });

      const allImages: ExtractedImage[] = [];

      for (const file of pendingFiles) {
        updateFile(file.id, { status: "processing" });
        try {
          const images = await extractImages(file.file);
          updateFile(file.id, { status: "done" });
          allImages.push(...images);
        } catch (err) {
          updateFile(file.id, {
            status: "error",
            error: (err as Error).message,
          });
        }
      }

      if (allImages.length === 0) {
        setError("No images could be extracted from the uploaded files.");
        setIsRunning(false);
        return;
      }

      // Step 2: Run OCR on all images
      const ocrResults = await ocrBatch(allImages);

      // Step 3: Map OCR results to voucher data
      const newVouchers = ocrResults
        .filter((r) => r.data !== null)
        .map((r) => {
          const dataUri = `data:image/jpeg;base64,${r.image.base64}`;
          return mapOcrToVoucher(
            r.data!,
            dataUri,
            r.image.sourceFileName,
            r.provider
          );
        });

      if (newVouchers.length > 0) {
        addVouchers(newVouchers);
      }

      const failedCount = ocrResults.filter((r) => r.error).length;
      if (failedCount > 0) {
        setError(
          `${failedCount} image(s) failed OCR. Successfully processed ${newVouchers.length}.`
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  }, [
    files,
    addVouchers,
    extractImages,
    ocrBatch,
    setProcessing,
    updateFile,
  ]);

  const handleStartFresh = useCallback(() => {
    clearFiles();
    clearAll();
    setError(null);
  }, [clearFiles, clearAll]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Cash Voucher Generator
            </h1>
            <p className="text-xs text-gray-500">
              Upload receipts &rarr; OCR &rarr; Edit &rarr; Download PDF
            </p>
          </div>
          {(files.length > 0 || vouchers.length > 0) && (
            <button
              onClick={handleStartFresh}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              Start Fresh
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Section */}
        {vouchers.length === 0 && (
          <section>
            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={isRunning}
            />
            <FileList files={files} onRemove={removeFile} />

            {files.some((f) => f.status === "pending") && !isRunning && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleProcess}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm"
                >
                  Process{" "}
                  {
                    files.filter((f: UploadedFile) => f.status === "pending")
                      .length
                  }{" "}
                  file(s)
                </button>
              </div>
            )}
          </section>
        )}

        {/* Processing Status */}
        {isRunning && processing.stage !== "done" && (
          <ProcessingStatus
            total={processing.total}
            completed={processing.completed}
            failed={processing.failed}
            stage={processing.stage}
          />
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-sm ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Voucher List */}
        <VoucherList
          vouchers={vouchers}
          onUpdate={updateVoucher}
          onRemove={removeVoucher}
          onClearAll={handleStartFresh}
        />

        {/* Upload more when vouchers exist */}
        {vouchers.length > 0 && !isRunning && (
          <section className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Add more receipts</p>
            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={isRunning}
            />
            <FileList files={files} onRemove={removeFile} />
            {files.some((f) => f.status === "pending") && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={handleProcess}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
                >
                  Process{" "}
                  {
                    files.filter((f: UploadedFile) => f.status === "pending")
                      .length
                  }{" "}
                  file(s)
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
