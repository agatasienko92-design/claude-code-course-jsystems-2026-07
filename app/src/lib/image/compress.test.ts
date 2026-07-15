// @vitest-environment node
// Tests for the sharp-based image compression pipeline (ADR-001 D-103,
// §3.3, TAC-001-02). Fixtures are generated with sharp itself so the suite
// has no binary test assets to maintain.

import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { compressImage, MAX_LONGEST_EDGE_PX, JPEG_QUALITY } from "./compress";

/** Builds a solid-color raw image buffer encoded in the given sharp format. */
async function makeImage(
  width: number,
  height: number,
  format: "png" | "webp" | "jpeg",
): Promise<Buffer> {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 150, b: 200 },
    },
  });

  if (format === "png") return image.png().toBuffer();
  if (format === "webp") return image.webp().toBuffer();
  return image.jpeg().toBuffer();
}

describe("compressImage", () => {
  it("compresses a large PNG to a JPEG capped at the longest-edge limit", async () => {
    const input = await makeImage(4000, 3000, "png");

    const result = await compressImage(input);

    expect(result.mediaType).toBe("image/jpeg");
    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.format).toBe("jpeg");
    expect(Math.max(outputMeta.width ?? 0, outputMeta.height ?? 0)).toBeLessThanOrEqual(
      MAX_LONGEST_EDGE_PX,
    );
    // Aspect ratio preserved (4000x3000 = 4:3).
    expect(outputMeta.width).toBe(MAX_LONGEST_EDGE_PX);
    expect(outputMeta.height).toBe(Math.round((3000 / 4000) * MAX_LONGEST_EDGE_PX));
  });

  it("re-encodes an already-small image to JPEG without upscaling it", async () => {
    const input = await makeImage(200, 200, "png");

    const result = await compressImage(input);

    expect(result.mediaType).toBe("image/jpeg");
    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.format).toBe("jpeg");
    expect(outputMeta.width).toBe(200);
    expect(outputMeta.height).toBe(200);
    expect(Math.max(outputMeta.width ?? 0, outputMeta.height ?? 0)).toBeLessThanOrEqual(
      MAX_LONGEST_EDGE_PX,
    );
  });

  it("converts a WebP input to JPEG output", async () => {
    const input = await makeImage(500, 400, "webp");
    const inputMeta = await sharp(input).metadata();
    expect(inputMeta.format).toBe("webp");

    const result = await compressImage(input);

    expect(result.mediaType).toBe("image/jpeg");
    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.format).toBe("jpeg");
  });

  it("strips EXIF metadata present on the input", async () => {
    const base = sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    });
    const input = await base
      .jpeg()
      .withExif({ IFD0: { Copyright: "Test Photographer", Make: "TestCam" } })
      .toBuffer();
    const inputMeta = await sharp(input).metadata();
    expect(inputMeta.exif).toBeDefined();

    const result = await compressImage(input);

    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.exif).toBeUndefined();
  });

  it("uses the configured JPEG quality constant (sanity check on the constant, not the exact byte output)", () => {
    expect(JPEG_QUALITY).toBeGreaterThanOrEqual(70);
    expect(JPEG_QUALITY).toBeLessThanOrEqual(90);
  });
});
