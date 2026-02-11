"use client";

import { VoucherData } from "@/types/voucher";
import VoucherForm from "./VoucherForm";
import VoucherPreview from "./VoucherPreview";
import PdfDownloadButton from "./PdfDownloadButton";
import { useState } from "react";

interface VoucherCardProps {
  voucher: VoucherData;
  index: number;
  onChange: (fields: Partial<VoucherData>) => void;
  onRemove: () => void;
}

export default function VoucherCard({
  voucher,
  index,
  onChange,
  onRemove,
}: VoucherCardProps) {
  const [showSource, setShowSource] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">
          Voucher #{index + 1}
          <span className="ml-2 text-xs font-normal text-gray-400">
            {voucher.sourceFileName}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSource(!showSource)}
            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600"
          >
            {showSource ? "Hide" : "Show"} Source
          </button>
          <PdfDownloadButton vouchers={[voucher]} label="PDF" />
          <button
            onClick={onRemove}
            className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Source image comparison */}
        {showSource && (
          <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Source Receipt Image</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={voucher.sourceImageUrl}
              alt="Source receipt"
              className="max-h-64 rounded border border-gray-300 object-contain"
            />
          </div>
        )}

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Left: Edit form */}
          <div className="flex-1 min-w-0 lg:max-w-xs">
            <VoucherForm voucher={voucher} onChange={onChange} />
          </div>

          {/* Right: Live preview */}
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1">Preview</p>
            <VoucherPreview voucher={voucher} />
          </div>
        </div>
      </div>
    </div>
  );
}
