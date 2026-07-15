// Pure, browser-safe file-metadata constraints for the image upload
// (ADR-001 §3.2, PRD AC-06/AC-07). Operates on `File`-like metadata only
// (`type`, `size`) so it can run client-side before any upload; the server
// independently re-validates using content sniffing (ADR-001 §5), not just
// this metadata check.

/** Allowed upload MIME types (declared type on the client; content-sniffed on the server). */
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Maximum accepted upload size in bytes (10 MB). Single source of truth for the limit. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isFileSizeWithinLimit(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/** Minimal shape needed from a `File` (or multipart part) to run these checks. */
export interface FileMetadata {
  type: string;
  size: number;
}

export type FileConstraintErrorCode = "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE";

export interface FileConstraintError {
  code: FileConstraintErrorCode;
  message: string;
}

/**
 * Validates file metadata against the MIME allowlist and size limit.
 * Returns `null` when valid, otherwise a single {@link FileConstraintError}.
 * Checks MIME type first, then size (ADR-001 §5 validation order).
 */
export function validateFileMetadata(file: FileMetadata): FileConstraintError | null {
  if (!isAllowedMimeType(file.type)) {
    return {
      code: "UNSUPPORTED_FILE_TYPE",
      message: "Niedozwolony format pliku. Akceptowane formaty: JPEG, PNG, WebP.",
    };
  }

  if (!isFileSizeWithinLimit(file.size)) {
    return {
      code: "FILE_TOO_LARGE",
      message: "Plik jest zbyt duży. Maksymalny rozmiar to 10 MB.",
    };
  }

  return null;
}
