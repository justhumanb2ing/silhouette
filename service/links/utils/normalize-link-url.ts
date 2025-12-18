export type NormalizeLinkUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * 입력받은 URL을 안전하게 정규화/검증한다.
 * - 공백 제거
 * - 스킴이 없으면 https://를 기본으로 보정
 * - http/https 프로토콜만 허용
 */
export function normalizeLinkUrl(input: unknown): NormalizeLinkUrlResult {
  if (typeof input !== "string") {
    return { ok: false, message: "URL을 입력해주세요." };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, message: "URL을 입력해주세요." };
  }

  if (/^(javascript|data|vbscript|file|mailto):/i.test(trimmed)) {
    return { ok: false, message: "http/https 링크만 저장할 수 있습니다." };
  }

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, message: "올바른 URL 형식이 아닙니다." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "http/https 링크만 저장할 수 있습니다." };
  }

  if (!parsed.hostname) {
    return { ok: false, message: "올바른 URL 형식이 아닙니다." };
  }

  const normalized = parsed.toString();
  if (normalized.length > 2048) {
    return { ok: false, message: "URL이 너무 깁니다." };
  }

  return { ok: true, url: normalized };
}
