"use client";

import { VoucherData } from "@/types/voucher";
import VoucherCard from "./VoucherCard";
import PdfDownloadButton from "./PdfDownloadButton";

interface VoucherListProps {
  vouchers: VoucherData[];
  onUpdate: (id: string, fields: Partial<VoucherData>) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function VoucherList({
  vouchers,
  onUpdate,
  onRemove,
  onClearAll,
}: VoucherListProps) {
  if (vouchers.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header with batch actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Cash Vouchers ({vouchers.length})
        </h2>
        <div className="flex items-center gap-2">
          <PdfDownloadButton
            vouchers={vouchers}
            label="Download All PDFs"
            batch
          />
          <button
            onClick={onClearAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Voucher cards */}
      <div className="space-y-4">
        {vouchers.map((v, i) => (
          <VoucherCard
            key={v.id}
            voucher={v}
            index={i}
            onChange={(fields) => onUpdate(v.id, fields)}
            onRemove={() => onRemove(v.id)}
          />
        ))}
      </div>
    </div>
  );
}
