import JSZip from "jszip";

/**
 * Extract embedded images from a DOCX file buffer.
 * Ported from extract_images.py — DOCX is a ZIP with images in word/media/.
 * Returns array of { name, data } where data is a Uint8Array.
 */
export async function extractImagesFromDocx(
  buffer: ArrayBuffer
): Promise<{ name: string; data: Uint8Array }[]> {
  const zip = await JSZip.loadAsync(buffer);

  // Collect all files in word/media/
  const mediaEntries: { path: string; sortKey: number }[] = [];
  zip.forEach((relativePath) => {
    if (relativePath.startsWith("word/media/")) {
      const match = relativePath.match(/(\d+)/);
      mediaEntries.push({
        path: relativePath,
        sortKey: match ? parseInt(match[1], 10) : 0,
      });
    }
  });

  // Sort numerically (image1, image2, ... image10, ...)
  mediaEntries.sort((a, b) => a.sortKey - b.sortKey);

  const results: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < mediaEntries.length; i++) {
    const entry = zip.file(mediaEntries[i].path);
    if (!entry) continue;

    const data = await entry.async("uint8array");
    const ext = mediaEntries[i].path.split(".").pop()?.toLowerCase() || "jpeg";
    const name = `image_${(i + 1).toString().padStart(2, "0")}.${ext}`;
    results.push({ name, data });
  }

  return results;
}
