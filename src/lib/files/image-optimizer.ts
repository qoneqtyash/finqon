import sharp from "sharp";

/**
 * Optimize an image for VLM processing:
 * - Resize to max 1536px on longest side
 * - Convert to JPEG at 85% quality
 * - Strip metadata
 */
export async function optimizeImage(data: Uint8Array): Promise<Uint8Array> {
  const result = await sharp(Buffer.from(data))
    .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  return new Uint8Array(result);
}
