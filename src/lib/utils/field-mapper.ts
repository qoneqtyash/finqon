import { OcrData, VoucherData } from "@/types/voucher";
import { amountToWords } from "./amount-to-words";
import { v4 as uuidv4 } from "uuid";

/**
 * Extract a clean numeric amount string from the OCR amount field.
 * e.g. "₹ 500.00" → "500.00", "INR 1,234" → "1,234"
 */
function cleanAmount(amount: string): string {
  if (!amount) return "";
  return amount.replace(/[^\d.,/-]/g, "").trim();
}

/**
 * Try to build amount-in-words from OCR data.
 * First check additional_fields for explicit words, then generate from numeric.
 */
function getAmountInWords(data: OcrData): string {
  const additional = data.additional_fields || {};
  for (const [key, val] of Object.entries(additional)) {
    if (/word|written/i.test(key) && val) return val;
  }
  const numericAmount = cleanAmount(data.amount);
  if (numericAmount) {
    return amountToWords(numericAmount);
  }
  return data.amount || "";
}

/**
 * Extract the purpose/being field from OCR data.
 * Checks line_items labels, then additional_fields for purpose-related keys.
 */
function getBeing(data: OcrData): string {
  const lineItems = data.line_items || [];
  if (lineItems.length > 0) {
    const descriptions = lineItems
      .filter((item) => item.label)
      .map((item) => item.label);
    if (descriptions.length > 0) return descriptions.join(", ");
  }

  const additional = data.additional_fields || {};
  for (const [key, val] of Object.entries(additional)) {
    if (/purpose|description|being|reason|for/i.test(key) && val) return val;
  }

  return data.receipt_type || "";
}

/**
 * Extract the debit/expense category.
 */
function getDebit(data: OcrData): string {
  const additional = data.additional_fields || {};
  for (const [key, val] of Object.entries(additional)) {
    if (/debit|expense|category|account|head/i.test(key) && val) return val;
  }
  return "";
}

/**
 * Map raw OCR data to VoucherData fields.
 */
export function mapOcrToVoucher(
  data: OcrData,
  imageUrl: string,
  fileName: string,
  provider: "qwen" | "openai"
): VoucherData {
  return {
    id: uuidv4(),
    sourceImageUrl: imageUrl,
    sourceFileName: fileName,
    voucherNo: "", // Left blank — finance fills manually
    date: data.date || "",
    amount: cleanAmount(data.amount),
    payTo: data.to_account || "",
    rsInWords: getAmountInWords(data),
    being: "", // Left blank — finance fills manually
    andDebit: "", // Left blank — finance fills manually
    authorisedBy: data.from_account || "",
    paidByMethod: "cash",
    attachSource: false,
    ocrProvider: provider,
    rawOcrData: data,
  };
}
