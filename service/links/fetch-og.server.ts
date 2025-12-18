import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeLinkUrl } from "./utils/normalize-link-url";

export type OgMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

type FetchOgEdgeResponse = {
  url?: unknown;
  title?: unknown;
  description?: unknown;
  image?: unknown;
};

function coerceOptionalText(
  input: unknown,
  options: { maxLength: number }
): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= options.maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, options.maxLength);
}

function coerceOptionalHttpUrl(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const normalized = normalizeLinkUrl(input);
  if (!normalized.ok) {
    return null;
  }

  return normalized.url;
}

/**
 * Supabase Edge Function(fetch-og)을 호출해 OG 메타데이터를 가져온다.
 * - 네트워크/페이지 상태에 따라 실패할 수 있으므로 caller에서 graceful fallback을 준비한다.
 * - 반환 데이터는 DB/UX 안정성을 위해 길이 및 포맷을 보정한다.
 */
export async function fetchOgMetadataForUrl(
  supabase: SupabaseClient,
  input: { url: string }
): Promise<{ ok: true; data: OgMetadata } | { ok: false; message: string }> {
  const { data, error } = await supabase.functions.invoke("fetch-og", {
    body: { url: input.url },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "OG 데이터를 가져오지 못했습니다." };
  }

  const payload = data as FetchOgEdgeResponse;
  const normalizedUrl = normalizeLinkUrl(payload.url);

  return {
    ok: true,
    data: {
      url: normalizedUrl.ok ? normalizedUrl.url : input.url,
      title: coerceOptionalText(payload.title, { maxLength: 200 }),
      description: coerceOptionalText(payload.description, { maxLength: 2000 }),
      imageUrl: coerceOptionalHttpUrl(payload.image),
    },
  };
}

