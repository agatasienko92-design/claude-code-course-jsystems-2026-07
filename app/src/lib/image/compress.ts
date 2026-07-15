// Sharp-based image compression pipeline (ADR-001 D-103, §3.3, TAC-001-02).
// Every accepted upload is re-encoded before any LLM submission: JPEG
// output, longest edge capped, fixed quality, all metadata (EXIF/GPS/ICC)
// stripped. Constants are defined once here and reused wherever the
// compression contract needs to be referenced (e.g. tests, prompts).

import sharp from "sharp";

/** Longest-edge cap in pixels for the compressed output (ADR-001 D-103). */
export const MAX_LONGEST_EDGE_PX = 1024;

/** JPEG quality used for the compressed output (ADR-001 D-103, "quality ~80"). */
export const JPEG_QUALITY = 80;

/** Media type of the compressed output. Always JPEG, regardless of input format. */
export const OUTPUT_MEDIA_TYPE = "image/jpeg" as const;

export interface CompressedImage {
  buffer: Buffer;
  mediaType: typeof OUTPUT_MEDIA_TYPE;
}

/**
 * Compresses an uploaded image buffer for LLM submission (ADR-001 D-103):
 * - re-encodes to JPEG at {@link JPEG_QUALITY},
 * - caps the longest edge at {@link MAX_LONGEST_EDGE_PX}px, never upscaling,
 * - strips all metadata (EXIF/GPS/ICC) — sharp's default behavior for any
 *   output that does not call `withMetadata()`/`keepMetadata()`.
 *
 * Auto-orients the pixel data using the input's EXIF orientation tag
 * *before* that metadata is discarded, so photos taken in portrait/rotated
 * orientation are not left sideways once the tag is stripped.
 */
export async function compressImage(input: Buffer): Promise<CompressedImage> {
  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_LONGEST_EDGE_PX,
      height: MAX_LONGEST_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return { buffer, mediaType: OUTPUT_MEDIA_TYPE };
}
