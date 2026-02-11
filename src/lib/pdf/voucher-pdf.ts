import jsPDF from "jspdf";
import { VoucherData } from "@/types/voucher";

// Colors (RGB 0-255)
const BLACK: [number, number, number] = [0, 0, 0];
const DARK_RED: [number, number, number] = [180, 50, 50];
const BLUE_INK: [number, number, number] = [0, 0, 150];
const PINK_BG: [number, number, number] = [230, 200, 200];
const GREEN_HL: [number, number, number] = [220, 240, 220];

let fontsLoaded = false;

/**
 * Load NotoSans fonts into jsPDF's VFS.
 * Must be called once before generating PDFs.
 */
async function loadFonts(doc: jsPDF): Promise<void> {
  if (fontsLoaded) return;

  try {
    const [regularResp, boldResp] = await Promise.all([
      fetch("/fonts/NotoSans-Regular.ttf"),
      fetch("/fonts/NotoSans-Bold.ttf"),
    ]);

    const regularBuf = await regularResp.arrayBuffer();
    const boldBuf = await boldResp.arrayBuffer();

    // Convert to base64
    const regularB64 = btoa(
      String.fromCharCode(...new Uint8Array(regularBuf))
    );
    const boldB64 = btoa(String.fromCharCode(...new Uint8Array(boldBuf)));

    // Add to VFS
    doc.addFileToVFS("NotoSans-Regular.ttf", regularB64);
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");

    doc.addFileToVFS("NotoSans-Bold.ttf", boldB64);
    doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

    fontsLoaded = true;
  } catch (err) {
    console.warn("Could not load NotoSans fonts, using default:", err);
  }
}

/**
 * Draw a single Cash Voucher page on the given jsPDF doc.
 * Ported from generate_pdfs.py CashVoucherPDF._draw_voucher().
 *
 * Format: Landscape A5 (210mm × 148mm)
 */
function drawVoucher(doc: jsPDF, data: VoucherData): void {
  const pageW = 210; // A5 landscape width
  const pageH = 148; // A5 landscape height

  const mx = 8; // margin x
  const my = 8; // margin y
  const cw = pageW - 2 * mx; // content width
  const ch = pageH - 2 * my; // content height

  // ── Outer border ──
  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.4);
  doc.rect(mx, my, cw, ch);

  // ── Extract fields ──
  const voucherNo = data.voucherNo || "";
  const dateVal = data.date || "";
  const amountNum = data.amount || "";
  const payTo = data.payTo || "";
  const rsInWords = data.rsInWords || "";
  const being = data.being || "";
  const andDebit = data.andDebit || "";
  const authorisedBy = data.authorisedBy || "";
  const paidByMethod = data.paidByMethod || "cash";

  // ════════════════════════════════════════════════════
  // TOP SECTION: Title (left) + No./Date/₹ boxes (right)
  // ════════════════════════════════════════════════════
  const topH = 35;
  const topY = my;

  // "CASH VOUCHER" title
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text("CASH VOUCHER", mx + 5, topY + 14);

  // Right-side fields
  const rightLabelX = mx + cw * 0.55;
  const rightBoxX = mx + cw * 0.65;
  const rightBoxW = cw * 0.3;
  const rightBoxH = 9;

  // No.
  const r1Y = topY + 4;
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("No.", rightLabelX, r1Y + 6);
  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.3);
  doc.rect(rightBoxX, r1Y, rightBoxW, rightBoxH);
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLUE_INK);
  doc.text(voucherNo, rightBoxX + 2, r1Y + 6);

  // Date
  const r2Y = r1Y + rightBoxH + 1;
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("Date", rightLabelX, r2Y + 6);
  doc.setDrawColor(...DARK_RED);
  doc.rect(rightBoxX, r2Y, rightBoxW, rightBoxH);
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLUE_INK);
  doc.text(dateVal, rightBoxX + 2, r2Y + 6);

  // ₹ (Amount)
  const r3Y = r2Y + rightBoxH + 1;
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text("\u20B9", rightLabelX, r3Y + 6);
  doc.setDrawColor(...DARK_RED);
  doc.rect(rightBoxX, r3Y, rightBoxW, rightBoxH);
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLUE_INK);
  doc.text(amountNum, rightBoxX + 2, r3Y + 6);

  // ── Horizontal divider ──
  const div1Y = topY + topH;
  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.3);
  doc.line(mx, div1Y, mx + cw, div1Y);

  // ════════════════════════════════════════════════════
  // MIDDLE SECTION: Pay to / Rs. in Words / being / and debit
  // ════════════════════════════════════════════════════
  const fieldX = mx + 4;
  const rowH = 14;
  const labelSize = 7;
  const valueSize = 11;

  const fields: [string, string][] = [
    ["Pay to", payTo],
    ["Rs. in Words", rsInWords],
    ["being", being],
    ["and debit", andDebit],
  ];

  let curY = div1Y + 1;

  for (const [label, value] of fields) {
    // Small label
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(labelSize);
    doc.setTextColor(...BLACK);
    doc.text(label, fieldX, curY + 4);

    // Value (blue ink)
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(valueSize);
    doc.setTextColor(...BLUE_INK);
    doc.text(value, fieldX + 2, curY + 11);

    // Red line at bottom
    const lineY = curY + rowH - 2;
    doc.setDrawColor(...DARK_RED);
    doc.setLineWidth(0.3);
    doc.line(mx, lineY, mx + cw, lineY);

    curY += rowH;
  }

  // ════════════════════════════════════════════════════
  // BOTTOM SECTION
  // ════════════════════════════════════════════════════
  const bottomY = curY;
  const bottomEnd = my + ch;

  // Divider at start of bottom
  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.3);
  doc.line(mx, bottomY, mx + cw, bottomY);

  // ── Authorised by ──
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Authorised by", fieldX, bottomY + 5);

  const authBoxX = fieldX + 30;
  const authBoxY = bottomY + 1;
  const authBoxW = 35;
  const authBoxH = 12;
  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.3);
  doc.rect(authBoxX, authBoxY, authBoxW, authBoxH);

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLUE_INK);
  doc.text(authorisedBy, authBoxX + 3, authBoxY + 8);

  // ── Paid by grid ──
  const paidY = bottomY + 14;
  const paidX = fieldX;
  const cellH = 5;
  const col1W = 16;
  const col2W = 14;
  const col3W = 28;
  const gridH = cellH * 3;

  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.2);

  // "Paid by" column
  doc.rect(paidX, paidY, col1W, gridH);
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...BLACK);
  doc.text("Paid by", paidX + 1, paidY + gridH / 2 + 1);

  // Col 2: Cash / or / Cheque
  doc.rect(paidX + col1W, paidY, col2W, cellH);
  doc.rect(paidX + col1W, paidY + cellH, col2W, cellH);
  doc.rect(paidX + col1W, paidY + cellH * 2, col2W, cellH);

  // Col 3: Drawn on Bank
  doc.rect(paidX + col1W + col2W, paidY, col3W, gridH);

  // Highlight selected method
  if (paidByMethod === "cash") {
    doc.setFillColor(...GREEN_HL);
    doc.rect(paidX + col1W, paidY, col2W, cellH, "F");
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...BLUE_INK);
    doc.text("Cash", paidX + col1W + 2, paidY + 3.5);
  } else {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...BLACK);
    doc.text("Cash", paidX + col1W + 2, paidY + 3.5);
  }

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...BLACK);
  doc.text("or", paidX + col1W + 4, paidY + cellH + 3.5);

  if (paidByMethod === "cheque") {
    doc.setFillColor(...GREEN_HL);
    doc.rect(paidX + col1W, paidY + cellH * 2, col2W, cellH, "F");
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...BLUE_INK);
    doc.text("Cheque", paidX + col1W + 1, paidY + cellH * 2 + 3.5);
  } else {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...BLACK);
    doc.text("Cheque", paidX + col1W + 1, paidY + cellH * 2 + 3.5);
  }

  if (paidByMethod === "bank") {
    doc.setFillColor(...GREEN_HL);
    doc.rect(paidX + col1W + col2W, paidY, col3W, gridH, "F");
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...BLUE_INK);
    doc.text("Drawn on Bank", paidX + col1W + col2W + 2, paidY + gridH / 2 + 1);
  } else {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...BLACK);
    doc.text("Drawn on Bank", paidX + col1W + col2W + 2, paidY + gridH / 2 + 1);
  }

  // ── "Recd. above sum of ₹" ──
  const recdX = mx + cw * 0.38;
  const recdY = bottomY + (bottomEnd - bottomY) * 0.4;
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("Recd. above sum of  \u20B9", recdX, recdY);

  // Amount value
  const amtX = recdX + 48;
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLUE_INK);
  doc.text(amountNum, amtX, recdY);

  // Underline
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  const ulW = Math.max(doc.getTextWidth(amountNum) + 5, 30);
  doc.line(amtX, recdY + 1.5, amtX + ulW, recdY + 1.5);

  // ── Receiver's Signature box ──
  const sigW = 35;
  const sigH = 22;
  const sigX = mx + cw - sigW - 2;
  const sigY = bottomEnd - sigH - 2;

  doc.setFillColor(...PINK_BG);
  doc.setDrawColor(...DARK_RED);
  doc.setLineWidth(0.3);
  doc.rect(sigX, sigY, sigW, sigH, "DF");

  doc.setFont("NotoSans", "bold");
  doc.setFontSize(7);
  doc.setTextColor(150, 80, 80);
  const t1 = "Receiver's";
  const t2 = "Signature";
  const t1W = doc.getTextWidth(t1);
  const t2W = doc.getTextWidth(t2);
  doc.text(t1, sigX + (sigW - t1W) / 2, sigY + 9);
  doc.text(t2, sigX + (sigW - t2W) / 2, sigY + 15);
}

/**
 * Generate a single-voucher PDF and return the blob.
 */
export async function generateVoucherPdf(
  voucher: VoucherData
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a5",
  });

  await loadFonts(doc);
  drawVoucher(doc, voucher);

  return doc.output("blob");
}

/**
 * Generate a multi-page PDF with all vouchers, one per page.
 */
export async function generateBatchPdf(
  vouchers: VoucherData[]
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a5",
  });

  await loadFonts(doc);

  for (let i = 0; i < vouchers.length; i++) {
    if (i > 0) doc.addPage("a5", "landscape");
    drawVoucher(doc, vouchers[i]);
  }

  return doc.output("blob");
}
