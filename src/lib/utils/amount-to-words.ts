const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = tens[Math.floor(n / 10)];
  const o = ones[n % 10];
  return o ? `${t} ${o}` : t;
}

function threeDigits(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  const h = ones[Math.floor(n / 100)];
  const rest = n % 100;
  return rest ? `${h} Hundred ${twoDigits(rest)}` : `${h} Hundred`;
}

/**
 * Convert a number to Indian English words (uses lakh/crore system).
 * e.g. 1,23,456 → "One Lakh Twenty Three Thousand Four Hundred Fifty Six"
 */
export function amountToWords(amount: number | string): string {
  const num = typeof amount === "string"
    ? parseFloat(amount.replace(/[^\d.]/g, ""))
    : amount;

  if (isNaN(num) || num === 0) return "Zero";

  const whole = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - whole) * 100);

  if (whole === 0 && paise === 0) return "Zero";

  const parts: string[] = [];

  if (whole > 0) {
    // Indian numbering: crore, lakh, thousand, hundred
    let remaining = whole;

    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;

    if (crore > 0) parts.push(`${twoDigits(crore)} Crore`);
    if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
    if (remaining > 0) parts.push(threeDigits(remaining));

    parts.push("Rupees");
  }

  if (paise > 0) {
    parts.push(`and ${twoDigits(paise)} Paise`);
  }

  parts.push("Only");

  return parts.join(" ");
}
