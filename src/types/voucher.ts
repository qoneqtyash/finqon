export interface LineItem {
  label: string;
  value: string;
}

export interface OcrData {
  company: string;
  receipt_type: string;
  status: string;
  date: string;
  time: string;
  amount: string;
  currency: string;
  reference_number: string;
  from_account: string;
  to_account: string;
  line_items: LineItem[];
  additional_fields: Record<string, string>;
  full_text_transcription: string;
}

export interface VoucherData {
  id: string;
  sourceImageUrl: string;
  sourceFileName: string;
  voucherNo: string;
  date: string;
  amount: string;
  payTo: string;
  rsInWords: string;
  being: string;
  andDebit: string;
  authorisedBy: string;
  paidByMethod: "cash" | "bank" | "cheque";
  ocrProvider: "qwen" | "openai" | "manual";
  rawOcrData: OcrData | null;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  status: "pending" | "uploading" | "uploaded" | "processing" | "done" | "error";
  blobUrl?: string;
  error?: string;
  /** Image URLs extracted from this file (for DOCX/PDF, multiple; for images, just one) */
  imageUrls?: string[];
}

export interface OcrResult {
  imageUrl: string;
  data: OcrData | null;
  provider: "qwen" | "openai";
  error?: string;
}

export type VoucherAction =
  | { type: "ADD_VOUCHERS"; vouchers: VoucherData[] }
  | { type: "UPDATE_VOUCHER"; id: string; fields: Partial<VoucherData> }
  | { type: "REMOVE_VOUCHER"; id: string }
  | { type: "CLEAR_ALL" };
