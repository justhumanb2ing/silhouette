import * as Sentry from "@sentry/react-router";
import type { getAuth } from "@clerk/react-router/server";
import { data } from "react-router";

import { getPrisma } from "../../../app/lib/get-prisma";
import { deleteCategoriesForUser } from "../categories.server";
import { isUuidish } from "../../links/validations/common";

type CategoriesActionAuth = Awaited<ReturnType<typeof getAuth>>;

type IntentResult =
  | { ok: true; deletedCount: number }
  | { ok: false; message: string };

type DeleteCategoriesInput = {
  auth: CategoriesActionAuth;
  formData: FormData;
};

/**
 * 사용자의 카테고리를 여러 개 삭제한다.
 */
export async function handleDeleteCategories({
  auth,
  formData,
}: DeleteCategoriesInput) {
  const rawIds = formData.getAll("categoryIds");
  const categoryIds = Array.from(
    new Set(
      rawIds
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

  if (categoryIds.length === 0) {
    return data<IntentResult>(
      { ok: false, message: "삭제할 카테고리를 선택해주세요." },
      { status: 400 }
    );
  }

  if (categoryIds.some((categoryId) => !isUuidish(categoryId))) {
    return data<IntentResult>(
      { ok: false, message: "요청이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const prisma = await getPrisma();
    const result = await deleteCategoriesForUser(prisma, {
      userId: auth.userId!,
      categoryIds,
    });

    if (result.deletedCount === 0) {
      return data<IntentResult>(
        { ok: false, message: "카테고리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return data<IntentResult>({ ok: true, deletedCount: result.deletedCount });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("feature", "categories");
      scope.setTag("operation", "delete-many");
      scope.setExtra("categoryIds", categoryIds);
      scope.setExtra("categoryCount", categoryIds.length);
      Sentry.captureException(error);
    });

    return data<IntentResult>(
      {
        ok: false,
        message:
          "카테고리 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
