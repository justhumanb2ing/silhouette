import { describe, expect, it } from "bun:test";

import { normalizeLinkUrl } from "../../../service/links/utils/normalize-link-url";

describe("normalizeLinkUrl", () => {
  it("rejects non-string inputs", () => {
    expect(normalizeLinkUrl(null).ok).toBe(false);
    expect(normalizeLinkUrl(undefined).ok).toBe(false);
    expect(normalizeLinkUrl(new File(["x"], "x")).ok).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(normalizeLinkUrl("").ok).toBe(false);
    expect(normalizeLinkUrl("   ").ok).toBe(false);
  });

  it("adds https scheme when missing", () => {
    const result = normalizeLinkUrl("example.com");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe("https://example.com/");
    }
  });

  it("accepts http/https urls", () => {
    const http = normalizeLinkUrl("http://example.com");
    expect(http.ok).toBe(true);

    const https = normalizeLinkUrl("https://example.com/path?q=1#hash");
    expect(https.ok).toBe(true);
  });

  it("rejects non http/https protocols", () => {
    const result = normalizeLinkUrl("ftp://example.com");
    expect(result.ok).toBe(false);
  });

  it("rejects obviously unsafe schemes", () => {
    expect(normalizeLinkUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeLinkUrl("data:text/plain;base64,SGVsbG8=").ok).toBe(false);
  });

  it("rejects overly long urls", () => {
    const tooLong = `https://example.com/${"a".repeat(3000)}`;
    const result = normalizeLinkUrl(tooLong);
    expect(result.ok).toBe(false);
  });
});
