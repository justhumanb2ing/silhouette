import { normalizeLinkUrl } from "./utils/normalize-link-url";

export type OgMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

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
 * - Clerk 토큰을 Authorization Bearer로 전달한다.
 */
export async function fetchOgMetadataForUrl(input: {
  url: string;
  token: string;
}): Promise<{ ok: true; data: OgMetadata } | { ok: false; message: string }> {
  const crawlerBaseUrl =
    import.meta.env.RAILWAY_OG_CRAWLER_ENDPOINT ??
    process.env.RAILWAY_OG_CRAWLER_ENDPOINT;
  if (!crawlerBaseUrl) {
    return {
      ok: false,
      message: "OG 크롤러 엔드포인트가 설정되지 않았습니다.",
    };
  }

  const endpoint = new URL(
    "/crawl",
    crawlerBaseUrl
  ).toString();
  const response = await fetch("https://silhouette-crawler-server.up.railway.app/crawl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.token}`,
    },
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
