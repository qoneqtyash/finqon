"use client";

import { VoucherData } from "@/types/voucher";
import { ChangeEvent } from "react";

interface VoucherFormProps {
  voucher: VoucherData;
  onChange: (fields: Partial<VoucherData>) => void;
}

const FIELDS: {
  key: keyof VoucherData;
  label: string;
  blankByDefault?: boolean;
}[] = [
  { key: "voucherNo", label: "No.", blankByDefault: true },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount (₹)" },
  { key: "payTo", label: "Pay to" },
  { key: "rsInWords", label: "Rs. in Words" },
  { key: "being", label: "being", blankByDefault: true },
  { key: "andDebit", label: "and debit", blankByDefault: true },
  { key: "authorisedBy", label: "Authorised by" },
];

export default function VoucherForm({ voucher, onChange }: VoucherFormProps) {
  const handleChange = (key: keyof VoucherData) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange({ [key]: e.target.value });
  };

  return (
    <div className="space-y-3">
      {FIELDS.map(({ key, label, blankByDefault }) => {
        const value = voucher[key] as string;
        const isEmpty = !value || value.trim() === "";
        return (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">
              {label}
              {blankByDefault && isEmpty && (
                <span className="ml-1.5 text-amber-600 text-[10px] font-normal">
                  (fill manually)
                </span>
              )}
            </label>
            <input
              type="text"
              value={value}
              onChange={handleChange(key)}
              className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                blankByDefault && isEmpty
                  ? "bg-amber-50 border-amber-300"
                  : "bg-white border-gray-300"
              }`}
              placeholder={blankByDefault ? "Finance team fills in" : ""}
            />
          </div>
        );
      })}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-0.5">
          Paid by
        </label>
        <select
          value={voucher.paidByMethod}
          onChange={handleChange("paidByMethod")}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      <div className="pt-1 text-xs text-gray-400">
        OCR: {voucher.ocrProvider}
      </div>
    </div>
  );
}
