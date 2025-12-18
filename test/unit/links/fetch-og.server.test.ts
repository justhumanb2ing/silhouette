import { describe, expect, it } from "bun:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchOgMetadataForUrl } from "../../../service/links/fetch-og.server";

describe("fetch-og.server", () => {
  it("maps edge response fields to OgMetadata", async () => {
    const supabase = {
      functions: {
        async invoke() {
          return {
            data: {
              url: "https://example.com/",
              title: "Example",
              description: "Hello",
              image: "https://cdn.example.com/image.png",
            },
            error: null,
          };
        },
      },
    } as unknown as SupabaseClient;

    const result = await fetchOgMetadataForUrl(supabase, {
      url: "https://input.example/",
    });

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
    const supabase = {
      functions: {
        async invoke() {
          return {
            data: { url: "javascript:alert(1)", title: "X", image: null },
            error: null,
          };
        },
      },
    } as unknown as SupabaseClient;

    const result = await fetchOgMetadataForUrl(supabase, {
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
    const supabase = {
      functions: {
        async invoke() {
          return {
            data: {
              url: "https://example.com/",
              title: ` ${"t".repeat(300)} `,
              description: ` ${"d".repeat(2500)} `,
              image: "https://cdn.example.com/image.png",
            },
            error: null,
          };
        },
      },
    } as unknown as SupabaseClient;

    const result = await fetchOgMetadataForUrl(supabase, {
      url: "https://input.example/",
    });

    if (!result.ok) {
      throw new Error("expected ok");
    }

    expect(result.data.title?.length).toBe(200);
    expect(result.data.description?.length).toBe(2000);
  });
});

