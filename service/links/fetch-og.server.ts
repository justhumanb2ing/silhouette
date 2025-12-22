import { normalizeLinkUrl } from "./utils/normalize-link-url";

export type OgMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

const OG_CRAWLER_ENDPOINT =
  "https://silhouette-crawler-server.up.railway.app/crawl";

type FetchOgCrawlerResponse = {
  success?: unknown;
  data?: {
    url?: unknown;
    title?: unknown;
    description?: unknown;
    image?: unknown;
    site_name?: unknown;
  } | null;
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
 * 외부 크롤러 서버를 호출해 OG 메타데이터를 가져온다.
 * - 네트워크/페이지 상태에 따라 실패할 수 있으므로 caller에서 graceful fallback을 준비한다.
 * - 반환 데이터는 DB/UX 안정성을 위해 길이 및 포맷을 보정한다.
 */
export async function fetchOgMetadataForUrl(input: {
  url: string;
}): Promise<{ ok: true; data: OgMetadata } | { ok: false; message: string }> {
  const response = await fetch(OG_CRAWLER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input.url }),
  });

  if (!response.ok) {
    return {
      ok: false,
      message: `OG 요청에 실패했습니다. (status: ${response.status})`,
    };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      message: "OG 응답을 파싱하지 못했습니다.",
    };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "OG 데이터를 가져오지 못했습니다." };
  }

  const payload = data as FetchOgCrawlerResponse;
  if (payload.success !== true || !payload.data) {
    return { ok: false, message: "OG 데이터를 가져오지 못했습니다." };
  }

  const normalizedUrl = normalizeLinkUrl(payload.data.url);
  return {
    ok: true,
    data: {
      url: normalizedUrl.ok ? normalizedUrl.url : input.url,
      title: coerceOptionalText(payload.data.title, { maxLength: 200 }),
      description: coerceOptionalText(payload.data.description, {
        maxLength: 2000,
      }),
      imageUrl: coerceOptionalHttpUrl(payload.data.image),
    },
  };
}
