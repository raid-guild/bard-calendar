const INLINE_IMAGE_TYPES = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function artifactResponseHeaders(
  upstreamHeaders: Headers,
  storedMimeType: string | null,
) {
  const contentType =
    upstreamHeaders.get("content-type") ??
    storedMimeType ??
    "application/octet-stream";
  const normalizedContentType = contentType.split(";", 1)[0].trim().toLowerCase();
  const headers = new Headers({
    "cache-control": "private, max-age=300",
    "content-disposition": INLINE_IMAGE_TYPES.has(normalizedContentType)
      ? "inline"
      : "attachment",
    "content-type": contentType,
    "x-content-type-options": "nosniff",
  });
  const contentLength = upstreamHeaders.get("content-length");

  if (contentLength) {
    headers.set("content-length", contentLength);
  }

  return headers;
}
