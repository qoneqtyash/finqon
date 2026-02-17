"use client";

import { useCallback, useState } from "react";
import DropZone from "@/components/DropZone";
import FileList from "@/components/FileList";
import ProcessingStatus from "@/components/ProcessingStatus";
import VoucherList from "@/components/VoucherList";
import FailedImages, { FailedImage } from "@/components/FailedImages";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useOcrProcessing, ExtractedImage } from "@/hooks/useOcrProcessing";
import { useVoucherState } from "@/hooks/useVoucherState";
import { mapOcrToVoucher } from "@/lib/utils/field-mapper";
import { UploadedFile, VoucherData } from "@/types/voucher";
import { v4 as uuidv4 } from "uuid";

function createBlankVoucher(): VoucherData {
  return {
    id: uuidv4(),
    sourceImageUrl: "",
    sourceFileName: "",
    voucherNo: "",
    date: "",
    amount: "",
    payTo: "",
    rsInWords: "",
    being: "",
    andDebit: "",
    authorisedBy: "",
    paidByMethod: "cash",
    attachSource: false,
    ocrProvider: "manual",
    rawOcrData: null,
  };
}

export default function Home() {
  const { files, addFiles, removeFile, updateFile, clearFiles } =
    useFileUpload();
  const { processing, setProcessing, extractImages, ocrBatch, ocrSingleImage } =
    useOcrProcessing();
  const { vouchers, addVouchers, updateVoucher, removeVoucher, clearAll } =
    useVoucherState();

  const [isRunning, setIsRunning] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<FailedImage[]>([]);

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

      // Step 3: Separate successes and failures
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

      const newFailed = ocrResults
        .filter((r) => r.error)
        .map((r) => ({
          image: r.image,
          error: r.error || "Unknown error",
        }));

      if (newVouchers.length > 0) {
        addVouchers(newVouchers);
      }

      // Append to existing failed images (don't replace)
      if (newFailed.length > 0) {
        setFailedImages((prev) => [...prev, ...newFailed]);
      }

      if (newFailed.length > 0) {
        setError(
          `${newFailed.length} image(s) failed OCR. ${newVouchers.length} processed successfully.`
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

  // Retry a single failed image
  const handleRetrySingle = useCallback(
    async (image: ExtractedImage) => {
      setIsRetrying(true);
      try {
        const result = await ocrSingleImage(image.base64);

        if (result.data) {
          // Success — remove from failed, add voucher
          setFailedImages((prev) =>
            prev.filter((fi) => fi.image.name !== image.name)
          );
          const dataUri = `data:image/jpeg;base64,${image.base64}`;
          const voucher = mapOcrToVoucher(
            result.data,
            dataUri,
            image.sourceFileName,
            result.provider
          );
          addVouchers([voucher]);
        } else {
          // Still failed — update the error message
          setFailedImages((prev) =>
            prev.map((fi) =>
              fi.image.name === image.name
                ? { ...fi, error: result.error || "OCR failed again" }
                : fi
            )
          );
        }
      } catch (err) {
        setFailedImages((prev) =>
          prev.map((fi) =>
            fi.image.name === image.name
              ? { ...fi, error: (err as Error).message }
              : fi
          )
        );
      } finally {
        setIsRetrying(false);
      }
    },
    [ocrSingleImage, addVouchers]
  );

  // Retry all failed images
  const handleRetryAll = useCallback(async () => {
    if (failedImages.length === 0) return;

    setIsRetrying(true);
    setProcessing({
      total: failedImages.length,
      completed: 0,
      failed: 0,
      stage: "ocr",
    });

    const imagesToRetry = failedImages.map((fi) => fi.image);
    const results = await ocrBatch(imagesToRetry);

    const succeeded = results.filter((r) => r.data !== null);
    const stillFailed = results.filter((r) => r.error);

    // Add successful ones as vouchers
    if (succeeded.length > 0) {
      const newVouchers = succeeded.map((r) => {
        const dataUri = `data:image/jpeg;base64,${r.image.base64}`;
        return mapOcrToVoucher(
          r.data!,
          dataUri,
          r.image.sourceFileName,
          r.provider
        );
      });
      addVouchers(newVouchers);
    }

    // Update failed list
    const newFailedList = stillFailed.map((r) => ({
      image: r.image,
      error: r.error || "OCR failed again",
    }));
    setFailedImages(newFailedList);

    if (stillFailed.length > 0) {
      setError(
        `Retry: ${succeeded.length} succeeded, ${stillFailed.length} still failing.`
      );
    } else {
      setError(null);
    }

    setIsRetrying(false);
  }, [failedImages, ocrBatch, addVouchers, setProcessing]);

  const handleDismissFailedImage = useCallback((imageName: string) => {
    setFailedImages((prev) => prev.filter((fi) => fi.image.name !== imageName));
  }, []);

  const handleDismissAllFailed = useCallback(() => {
    setFailedImages([]);
    setError(null);
  }, []);

  const handleNewVoucher = useCallback(() => {
    addVouchers([createBlankVoucher()]);
  }, [addVouchers]);

  const handleStartFresh = useCallback(() => {
    clearFiles();
    clearAll();
    setError(null);
    setFailedImages([]);
  }, [clearFiles, clearAll]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="VoucherExtract" className="h-12" />
            <p className="text-xs text-gray-500">
              Upload receipts for OCR or create from scratch &rarr; Edit &rarr; Download PDF
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewVoucher}
              className="text-sm px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              + New Voucher
            </button>
            {(files.length > 0 || vouchers.length > 0 || failedImages.length > 0) && (
              <button
                onClick={handleStartFresh}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                Start Fresh
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Section */}
        {vouchers.length === 0 && failedImages.length === 0 && (
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

            {files.length === 0 && !isRunning && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-sm text-gray-400">or</span>
                <button
                  onClick={handleNewVoucher}
                  className="px-5 py-2 rounded-lg border-2 border-dashed border-green-400 hover:border-green-600 hover:bg-green-50 text-green-700 font-medium text-sm"
                >
                  Create Blank Voucher
                </button>
              </div>
            )}
          </section>
        )}

        {/* Processing Status */}
        {(isRunning || isRetrying) && processing.stage !== "done" && (
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

        {/* Failed Images with Retry */}
        <FailedImages
          failedImages={failedImages}
          onRetry={handleRetrySingle}
          onRetryAll={handleRetryAll}
          onDismiss={handleDismissFailedImage}
          onDismissAll={handleDismissAllFailed}
          isRetrying={isRetrying}
        />

        {/* Voucher List */}
        <VoucherList
          vouchers={vouchers}
          onUpdate={updateVoucher}
          onRemove={removeVoucher}
          onClearAll={handleStartFresh}
        />

        {/* Upload more / create new when vouchers exist */}
        {(vouchers.length > 0 || failedImages.length > 0) && !isRunning && (
          <section className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Add more</p>
            <div className="flex items-start gap-4">
              <div className="flex-1">
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
              </div>
              <button
                onClick={handleNewVoucher}
                className="px-4 py-2 rounded-lg border-2 border-dashed border-green-400 hover:border-green-600 hover:bg-green-50 text-green-700 font-medium text-sm whitespace-nowrap"
              >
                + Blank Voucher
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
