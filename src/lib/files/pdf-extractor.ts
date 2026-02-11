/**
 * Extract embedded images from a PDF.
 * Uses pdfjs-dist to parse PDF and extract image objects directly,
 * then converts raw pixel data to JPEG via sharp.
 *
 * No canvas/rendering needed — works on Vercel serverless.
 *
 * NOTE: This runs on the server (Node.js runtime in /api/process).
 */
import sharp from "sharp";

// pdfjs operator codes for image painting
const OPS_PAINT_IMAGE_XOBJECT = 85;
const OPS_PAINT_INLINE_IMAGE_XOBJECT = 86;

export async function extractImagesFromPdf(
  buffer: ArrayBuffer
): Promise<{ name: string; data: Uint8Array }[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Use module specifier so Node's import() resolves it correctly
  // (file paths get mangled by Turbopack/webpack bundlers)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "pdfjs-dist/legacy/build/pdf.worker.mjs";

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const results: { name: string; data: Uint8Array }[] = [];
  let imgIndex = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const ops = await page.getOperatorList();

      // Find all image paint operations on this page
      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        if (fn !== OPS_PAINT_IMAGE_XOBJECT && fn !== OPS_PAINT_INLINE_IMAGE_XOBJECT) {
          continue;
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let imgObj: any;

          if (fn === OPS_PAINT_IMAGE_XOBJECT) {
            // Named image object — fetch from page objects
            const imgName = ops.argsArray[i][0];
            imgObj = await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error("timeout")), 5000);
              page.objs.get(imgName, (obj: unknown) => {
                clearTimeout(timeout);
                if (obj) resolve(obj);
                else reject(new Error("null image object"));
              });
            });
          } else {
            // Inline image — data is in args directly
            imgObj = ops.argsArray[i][0];
          }

          if (!imgObj?.data || !imgObj.width || !imgObj.height) continue;

          // Skip tiny images (icons, decorations)
          if (imgObj.width < 50 || imgObj.height < 50) continue;

          const channels = Math.round(imgObj.data.length / (imgObj.width * imgObj.height));
          if (channels < 1 || channels > 4) continue;

          const jpegBuffer = await sharp(Buffer.from(imgObj.data), {
            raw: {
              width: imgObj.width,
              height: imgObj.height,
              channels: channels as 1 | 2 | 3 | 4,
            },
          })
            .jpeg({ quality: 90 })
            .toBuffer();

          imgIndex++;
          const name = `pdf_img_${imgIndex.toString().padStart(2, "0")}.jpeg`;
          results.push({ name, data: new Uint8Array(jpegBuffer) });
        } catch (err) {
          console.warn(`Failed to extract image from page ${pageNum}:`, err);
        }
      }

      page.cleanup();
    } catch (err) {
      console.warn(`Failed to process PDF page ${pageNum}:`, err);
    }
  }

  pdf.destroy();
  return results;
}
