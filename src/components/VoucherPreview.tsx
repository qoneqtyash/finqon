"use client";

import { VoucherData } from "@/types/voucher";

interface VoucherPreviewProps {
  voucher: VoucherData;
}

/**
 * HTML/CSS replica of the Cash Voucher layout.
 * Matches the format from format.jpeg and generate_pdfs.py.
 * Landscape A5 proportions (210×148mm) rendered in CSS.
 */
export default function VoucherPreview({ voucher }: VoucherPreviewProps) {
  const isEmpty = (val: string) => !val || val.trim() === "";

  return (
    <div
      className="bg-white border-2 rounded select-none"
      style={{
        borderColor: "#b43232",
        width: "580px",
        height: "340px",
        fontSize: "10px",
        fontFamily: "'Noto Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* TOP SECTION */}
      <div
        className="flex justify-between"
        style={{
          height: "70px",
          borderBottom: "1.5px solid #b43232",
          padding: "6px 10px",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontWeight: 700,
            fontSize: "18px",
            color: "#000",
            paddingTop: "4px",
          }}
        >
          CASH VOUCHER
        </div>

        {/* Right-side fields */}
        <div className="flex flex-col gap-0.5" style={{ width: "45%" }}>
          {/* No. */}
          <div className="flex items-center gap-1">
            <span style={{ fontWeight: 700, fontSize: "8px", width: "28px" }}>
              No.
            </span>
            <div
              className={`flex-1 px-1 border ${
                isEmpty(voucher.voucherNo)
                  ? "bg-amber-50 border-amber-300"
                  : "border-[#b43232]"
              }`}
              style={{ minHeight: "16px", color: "#000096" }}
            >
              {voucher.voucherNo}
            </div>
          </div>
          {/* Date */}
          <div className="flex items-center gap-1">
            <span style={{ fontWeight: 700, fontSize: "8px", width: "28px" }}>
              Date
            </span>
            <div
              className="flex-1 px-1 border border-[#b43232]"
              style={{ minHeight: "16px", color: "#000096" }}
            >
              {voucher.date}
            </div>
          </div>
          {/* Amount */}
          <div className="flex items-center gap-1">
            <span
              style={{ fontWeight: 700, fontSize: "10px", width: "28px" }}
            >
              ₹
            </span>
            <div
              className="flex-1 px-1 border border-[#b43232] font-bold"
              style={{ minHeight: "16px", color: "#000096" }}
            >
              {voucher.amount}
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION — 4 field rows */}
      <div style={{ borderBottom: "1.5px solid #b43232" }}>
        {(
          [
            ["Pay to", voucher.payTo, false],
            ["Rs. in Words", voucher.rsInWords, false],
            ["being", voucher.being, true],
            ["and debit", voucher.andDebit, true],
          ] as [string, string, boolean][]
        ).map(([label, value, isBlank]) => (
          <div
            key={label}
            style={{
              height: "28px",
              borderBottom: "1px solid #b43232",
              padding: "1px 10px",
            }}
          >
            <div
              style={{
                fontSize: "6px",
                color: "#000",
                lineHeight: "8px",
              }}
            >
              {label}
            </div>
            <div
              style={{
                color: "#000096",
                fontSize: "10px",
                lineHeight: "16px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              className={isBlank && isEmpty(value) ? "bg-amber-50" : ""}
            >
              {value || "\u00A0"}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION */}
      <div
        style={{
          height: "calc(100% - 70px - 113px)",
          padding: "6px 10px 4px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {/* Authorised by — spans full width */}
        <div className="flex items-center gap-1">
          <span
            style={{ fontSize: "7px", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            Authorised by
          </span>
          <div
            className="border border-[#b43232] px-1 flex-1"
            style={{
              minHeight: "18px",
              color: "#000096",
              fontSize: "9px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {voucher.authorisedBy}
          </div>
        </div>

        {/* Center: Recd. amount — takes remaining space */}
        <div
          className="flex flex-col items-center justify-center flex-1"
        >
          <span
            className="font-bold underline"
            style={{ fontSize: "15px", color: "#000096" }}
          >
            {voucher.amount}
          </span>
          <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px" }}>
            Recd. above sum of ₹
          </span>
        </div>

        {/* Row: Paid by grid + Signature — at bottom */}
        <div className="flex items-end justify-between">
          {/* Paid by grid */}
          <div
            className="grid border border-[#b43232]"
            style={{
              gridTemplateColumns: "auto auto auto",
              fontSize: "9px",
              lineHeight: "16px",
              width: "fit-content",
            }}
          >
            <div
              className="border-r border-[#b43232] flex items-center px-1.5"
              style={{ gridRow: "1 / 4", fontWeight: 700 }}
            >
              Paid by
            </div>
            <div
              className={`border-b border-r border-[#b43232] px-1.5 ${
                voucher.paidByMethod === "cash" ? "bg-green-100 font-bold text-[#000096]" : ""
              }`}
            >
              Cash
            </div>
            <div
              className={`border-l border-[#b43232] px-1.5 ${
                voucher.paidByMethod === "bank" ? "bg-green-100 font-bold text-[#000096]" : ""
              }`}
              style={{ gridRow: "1 / 4", display: "flex", alignItems: "center" }}
            >
              Drawn on Bank
            </div>
            <div className="border-b border-r border-[#b43232] px-1.5">
              or
            </div>
            <div
              className={`border-r border-[#b43232] px-1.5 ${
                voucher.paidByMethod === "cheque" ? "bg-green-100 font-bold text-[#000096]" : ""
              }`}
            >
              Cheque
            </div>
          </div>

          {/* Right: Receiver&apos;s Signature */}
          <div
            className="flex flex-col items-center justify-center border border-[#b43232] rounded-sm"
            style={{
              width: "65px",
              height: "44px",
              backgroundColor: "#e6c8c8",
            }}
          >
            <span
              style={{
                fontSize: "6px",
                fontWeight: 700,
                color: "#965050",
              }}
            >
              Receiver&apos;s
            </span>
            <span
              style={{
                fontSize: "6px",
                fontWeight: 700,
                color: "#965050",
              }}
            >
              Signature
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
