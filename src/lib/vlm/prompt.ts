/**
 * OCR prompt — ported from config.py lines 31-66.
 * Asks the VLM for structured JSON extraction from a payment receipt image.
 */
export const OCR_PROMPT = `You are an expert document reader. Analyze this payment receipt/screenshot and extract ALL information with 100% accuracy.

RULES:
- Transcribe EXACTLY what you see — do not guess, infer, or approximate
- Preserve original script (Arabic, English, numbers, symbols) exactly as shown
- Mark any uncertain characters with [?]
- Capture EVERYTHING: headers, footers, timestamps, reference numbers, status text, logos text

Return your response as valid JSON with this structure:
{
  "company": "Company/app name shown on the receipt",
  "receipt_type": "Transfer / Payment / Top-up / etc.",
  "status": "Successful / Completed / Pending / etc.",
  "date": "Date as shown on receipt",
  "time": "Time as shown on receipt (if visible)",
  "amount": "Total amount with currency",
  "currency": "Currency code or symbol",
  "reference_number": "Transaction/reference number",
  "from_account": "Sender account/name if shown",
  "to_account": "Recipient account/name if shown",
  "line_items": [
    {"label": "Fee", "value": "0.00"},
    {"label": "description label", "value": "value"}
  ],
  "additional_fields": {
    "any_other_field_name": "its value"
  },
  "full_text_transcription": "Complete verbatim transcription of ALL text visible in the image, preserving layout with newlines"
}

Important:
- Include ALL visible fields, even small footer text or watermarks
- For Arabic text, include the original Arabic characters
- The line_items array should capture every labeled value pair on the receipt
- additional_fields should capture anything not covered by the standard fields above
- full_text_transcription must contain EVERY piece of text in the image, top to bottom`;
