/**
 * Extract pages from a PDF as images.
 * Uses pdfjs-dist in Node.js to extract embedded images.
 * Raw pixel data from pdfjs is re-encoded to JPEG via sharp.
 *
 * NOTE: This runs on the server (Node.js runtime in /api/process).
 */
import sharp from "sharp";

export async function extractImagesFromPdf(
  buffer: ArrayBuffer
): Promise<{ name: string; data: Uint8Array }[]> {
  // Dynamic import to avoid bundling issues
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const results: { name: string; data: Uint8Array }[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    try {
      const ops = await page.getOperatorList();
      const pdfjsOps = pdfjsLib.OPS;
      let extractedFromPage = false;

      for (let i = 0; i < ops.fnArray.length; i++) {
        if (
          ops.fnArray[i] === pdfjsOps.paintImageXObject ||
          ops.fnArray[i] === pdfjsOps.paintXObject
        ) {
          try {
            const imgName = ops.argsArray[i][0];
            const img = await page.objs.get(imgName);
            if (!img?.data || !img.width || !img.height) continue;

            const name = `page_${pageNum.toString().padStart(2, "0")}_img_${i}.jpeg`;

            // pdfjs returns raw pixel data (RGBA or RGB).
            // Determine channels from data length.
            const pixelCount = img.width * img.height;
            const channels = Math.round(img.data.length / pixelCount) as 1 | 2 | 3 | 4;

            const encoded = await sharp(Buffer.from(img.data), {
              raw: {
                width: img.width,
                height: img.height,
                channels,
              },
            })
              .jpeg({ quality: 90 })
              .toBuffer();

            results.push({ name, data: new Uint8Array(encoded) });
            extractedFromPage = true;
          } catch {
            // Skip individual image extraction failures
          }
        }
      }

      if (!extractedFromPage) {
        console.warn(
          `Page ${pageNum}: No embedded images found. Install 'canvas' package for full page rendering.`
        );
      }
    } catch (err) {
      console.warn(`Failed to process page ${pageNum}:`, err);
    }

    page.cleanup();
  }

  return results;
}
