import { isUuidish, normalizeOptionalText } from "./common";

type UpdateLinkInputData = {
  linkId: string;
  title: string | null;
  description: string | null;
  categoryId: FormDataEntryValue | null;
  categoryName: FormDataEntryValue | null;
  categoryMode: FormDataEntryValue | null;
};

type ParseUpdateLinkInputResult =
  | { ok: true; data: UpdateLinkInputData }
  | { ok: false; message: string };

export function parseUpdateLinkInput(
  formData: FormData
): ParseUpdateLinkInputResult {
  const linkId = formData.get("linkId");
  if (typeof linkId !== "string" || !isUuidish(linkId)) {
    return { ok: false, message: "링크 ID가 올바르지 않습니다." };
  }

  const title = normalizeOptionalText(formData.get("title"), {
    maxLength: 200,
    label: "제목",
  });
  if (!title.ok) return { ok: false, message: title.message };

  const description = normalizeOptionalText(formData.get("description"), {
    maxLength: 2000,
    label: "설명",
  });
  if (!description.ok) return { ok: false, message: description.message };

  return {
    ok: true,
    data: {
      linkId,
      title: title.value,
      description: description.value,
      categoryId: formData.get("categoryId"),
      categoryName: formData.get("categoryName"),
      categoryMode: formData.get("categoryMode"),
    },
  };
}
