import { normalizeLinkUrl } from "../utils/normalize-link-url";

type CreateLinkInputData = {
  url: string;
  rawUrl: string | undefined;
  categoryId: FormDataEntryValue | null;
  categoryName: FormDataEntryValue | null;
  categoryMode: FormDataEntryValue | null;
};

type ParseCreateLinkInputResult =
  | { ok: true; data: CreateLinkInputData }
  | { ok: false; message: string; rawUrl: string | undefined };

export function parseCreateLinkInput(
  formData: FormData
): ParseCreateLinkInputResult {
  const rawUrl = formData.get("url");
  const normalizedUrl = normalizeLinkUrl(rawUrl);
  if (!normalizedUrl.ok) {
    return {
      ok: false,
      message: normalizedUrl.message,
      rawUrl: typeof rawUrl === "string" ? rawUrl : undefined,
    };
  }

  return {
    ok: true,
    data: {
      url: normalizedUrl.url,
      rawUrl: typeof rawUrl === "string" ? rawUrl : undefined,
      categoryId: formData.get("categoryId"),
      categoryName: formData.get("categoryName"),
      categoryMode: formData.get("categoryMode"),
    },
  };
}
