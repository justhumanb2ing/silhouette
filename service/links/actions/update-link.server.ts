import * as Sentry from "@sentry/react-router";
import { data } from "react-router";

import { getPrisma } from "../../../app/lib/get-prisma";

import { updateLinkMetadataForUser } from "../links.server";
import { parseUpdateLinkInput } from "../validations/update-link";

import { resolveCategory } from "./resolve-category.server";
import type { IntentResult, LinksActionAuth } from "./types";

type UpdateLinkInput = {
  auth: LinksActionAuth;
  formData: FormData;
};

/**
 * 링크 메타데이터를 수정한다.
 */
export async function handleUpdateLink({ auth, formData }: UpdateLinkInput) {
  const parsed = parseUpdateLinkInput(formData);
  if (!parsed.ok) {
    return data<IntentResult>({ ok: false, message: parsed.message }, { status: 400 });
  }

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");

  try {
    const prisma = await getPrisma();
    const { linkId, title, description, categoryId, categoryName, categoryMode } =
      parsed.data;

    const resolvedCategory = await resolveCategory({
      prisma,
      userId: auth.userId!,
      categoryId,
      categoryName,
      categoryMode,
    });

    if (!resolvedCategory.ok) {
      return data<IntentResult>(
        { ok: false, message: resolvedCategory.message },
        { status: resolvedCategory.status }
      );
    }

    const result = await updateLinkMetadataForUser(prisma, {
      userId: auth.userId!,
      linkId,
      title,
      description,
      categoryId: resolvedCategory.categoryId,
    });

    if (!result.updated) {
      return data<IntentResult>(
        { ok: false, message: "링크를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return data<IntentResult>({ ok: true });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("feature", "links");
      scope.setTag("operation", "update");
      scope.setExtra("linkId", parsed.data.linkId);
      scope.setExtra(
        "titleLength",
        typeof rawTitle === "string" ? rawTitle.length : null
      );
      scope.setExtra(
        "descriptionLength",
        typeof rawDescription === "string" ? rawDescription.length : null
      );
      Sentry.captureException(error);
    });

    return data<IntentResult>(
      {
        ok: false,
        message: "링크 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
