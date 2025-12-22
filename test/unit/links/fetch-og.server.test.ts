import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { fetchOgMetadataForUrl } from "../../../service/links/fetch-og.server";

const originalFetch = globalThis.fetch;

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

function mockFetch(response: {
  ok: boolean;
  status?: number;
  body?: unknown;
  jsonError?: boolean;
}): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });

    if (response.jsonError) {
      return {
        ok: response.ok,
        status: response.status ?? 200,
        json: async () => {
          throw new Error("invalid json");
        },
      } as Response;
    }

    return {
      ok: response.ok,
      status: response.status ?? 200,
      json: async () => response.body,
    } as Response;
  }) as typeof fetch;

  return calls;
}

describe("fetch-og.server", () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("maps crawler response fields to OgMetadata", async () => {
    const calls = mockFetch({
      ok: true,
      body: {
        success: true,
        data: {
          url: "https://example.com/",
          title: "Example",
          description: "Hello",
          image: "https://cdn.example.com/image.png",
        },
      },
    });

    const result = await fetchOgMetadataForUrl({
      url: "https://input.example/",
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.input).toBe(
      "https://silhouette-crawler-server.up.railway.app/crawl"
    );
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(calls[0]?.init?.body).toBe(
      JSON.stringify({ url: "https://input.example/" })
    );

    expect(result).toEqual({
      ok: true,
      data: {
        url: "https://example.com/",
        title: "Example",
        description: "Hello",
        imageUrl: "https://cdn.example.com/image.png",
      },
    });
  });

  it("falls back to input url when response url is invalid", async () => {
    mockFetch({
      ok: true,
      body: {
        success: true,
        data: { url: "javascript:alert(1)", title: "X", image: null },
      },
    });

    const result = await fetchOgMetadataForUrl({
      url: "https://input.example/",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        url: "https://input.example/",
        title: "X",
        description: null,
        imageUrl: null,
      },
    });
  });

  it("trims and truncates long fields for DB/UX safety", async () => {
    mockFetch({
      ok: true,
      body: {
        success: true,
        data: {
          url: "https://example.com/",
          title: ` ${"t".repeat(300)} `,
          description: ` ${"d".repeat(2500)} `,
          image: "https://cdn.example.com/image.png",
        },
      },
    });

    const result = await fetchOgMetadataForUrl({
      url: "https://input.example/",
    });

    if (!result.ok) {
      throw new Error("expected ok");
    }

    expect(result.data.title?.length).toBe(200);
    expect(result.data.description?.length).toBe(2000);
  });
});
