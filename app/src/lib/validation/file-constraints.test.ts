import { describe, expect, it } from "vitest";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  isAllowedMimeType,
  isFileSizeWithinLimit,
  validateFileMetadata,
} from "./file-constraints";

describe("file constraints constants", () => {
  it("allows exactly jpeg, png and webp", () => {
    expect(ALLOWED_MIME_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });

  it("caps size at 10 MB", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("isAllowedMimeType", () => {
  it.each(ALLOWED_MIME_TYPES)("accepts %s", (mime) => {
    expect(isAllowedMimeType(mime)).toBe(true);
  });

  it("rejects image/gif", () => {
    expect(isAllowedMimeType("image/gif")).toBe(false);
  });

  it("rejects application/pdf", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(false);
  });
});

describe("isFileSizeWithinLimit", () => {
  it("accepts exactly 10 MB", () => {
    expect(isFileSizeWithinLimit(MAX_FILE_SIZE_BYTES)).toBe(true);
  });

  it("rejects 10 MB + 1 byte", () => {
    expect(isFileSizeWithinLimit(MAX_FILE_SIZE_BYTES + 1)).toBe(false);
  });

  it("accepts a small file", () => {
    expect(isFileSizeWithinLimit(1024)).toBe(true);
  });

  it("rejects zero-and-negative sizes as not within a sane limit is out of scope; 0 bytes is size-valid", () => {
    // Zero-byte "file" is a size-limit pass (emptiness is a different concern).
    expect(isFileSizeWithinLimit(0)).toBe(true);
  });
});

describe("validateFileMetadata", () => {
  it("returns null for a valid jpeg within the size limit", () => {
    const result = validateFileMetadata({ type: "image/jpeg", size: 1024 });
    expect(result).toBeNull();
  });

  it("returns null for a file at exactly 10 MB", () => {
    const result = validateFileMetadata({ type: "image/png", size: MAX_FILE_SIZE_BYTES });
    expect(result).toBeNull();
  });

  it("returns FILE_TOO_LARGE for 10 MB + 1 byte", () => {
    const result = validateFileMetadata({
      type: "image/webp",
      size: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(result?.code).toBe("FILE_TOO_LARGE");
    expect(result?.message).toMatch(/10 MB/);
  });

  it("returns UNSUPPORTED_FILE_TYPE for image/gif", () => {
    const result = validateFileMetadata({ type: "image/gif", size: 1024 });
    expect(result?.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("checks MIME before size (disallowed type + oversized reports type error)", () => {
    const result = validateFileMetadata({
      type: "image/gif",
      size: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(result?.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("returns a Polish message for both error codes", () => {
    const typeError = validateFileMetadata({ type: "text/plain", size: 10 });
    const sizeError = validateFileMetadata({
      type: "image/jpeg",
      size: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(typeError?.message).toMatch(/format/i);
    expect(sizeError?.message).toMatch(/duż/i);
  });
});
