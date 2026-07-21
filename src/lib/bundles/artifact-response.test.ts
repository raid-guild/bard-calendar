import { describe, expect, it } from "vitest";
import { artifactResponseHeaders } from "@/lib/bundles/artifact-response";

describe("artifact response headers", () => {
  it("allows raster image previews and disables MIME sniffing", () => {
    const headers = artifactResponseHeaders(
      new Headers({
        "content-type": "image/png",
        "content-length": "123",
      }),
      null,
    );

    expect(headers.get("content-disposition")).toBe("inline");
    expect(headers.get("content-type")).toBe("image/png");
    expect(headers.get("content-length")).toBe("123");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
  });

  it.each(["text/html", "image/svg+xml", "application/octet-stream"])(
    "forces %s artifacts to download",
    (contentType) => {
      const headers = artifactResponseHeaders(
        new Headers({ "content-type": contentType }),
        null,
      );

      expect(headers.get("content-disposition")).toBe("attachment");
      expect(headers.get("x-content-type-options")).toBe("nosniff");
    },
  );

  it("uses the persisted MIME type when Prism omits one", () => {
    const headers = artifactResponseHeaders(new Headers(), "image/webp");

    expect(headers.get("content-disposition")).toBe("inline");
    expect(headers.get("content-type")).toBe("image/webp");
  });
});
