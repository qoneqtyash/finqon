"use client";

import { VoucherData } from "@/types/voucher";
import { generateVoucherPdf, generateBatchPdf } from "@/lib/pdf/voucher-pdf";
import { useState } from "react";

interface PdfDownloadButtonProps {
  vouchers: VoucherData[];
  label?: string;
  batch?: boolean;
}

export default function PdfDownloadButton({
  vouchers,
  label = "Download PDF",
  batch = false,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = batch
        ? await generateBatchPdf(vouchers)
        : await generateVoucherPdf(vouchers[0]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = batch
        ? `cash_vouchers_batch_${vouchers.length}.pdf`
        : `cash_voucher_${vouchers[0].payTo || "receipt"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const blob = batch
        ? await generateBatchPdf(vouchers)
        : await generateVoucherPdf(vouchers[0]);

      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          win.print();
        });
      }
    } catch (err) {
      console.error("PDF print failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleDownload}
        disabled={loading || vouchers.length === 0}
        className="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
      >
        {loading ? "..." : label}
      </button>
      <button
        onClick={handlePrint}
        disabled={loading || vouchers.length === 0}
        className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 disabled:opacity-50"
        title="Print"
      >
        🖨
      </button>
    </div>
  );
}
