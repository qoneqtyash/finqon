/**
 * Extract pages from a PDF as images.
 * Uses pdfjs-dist in Node.js to render pages to canvas via sharp.
 *
 * NOTE: This runs on the server (Node.js runtime in /api/process).
 */
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

    // Try to extract embedded images from the page operators
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
            if (img?.data) {
              const name = `page_${pageNum.toString().padStart(2, "0")}_img_${i}.jpeg`;
              results.push({ name, data: new Uint8Array(img.data) });
              extractedFromPage = true;
            }
          } catch {
            // Skip individual image extraction failures
          }
        }
      }

      // If no images extracted, the page might be text-only or a scanned page
      // In that case we'd need canvas rendering, which requires the `canvas` package
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
