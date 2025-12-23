import * as Sentry from "@sentry/react-router";
import type { getAuth } from "@clerk/react-router/server";
import { data } from "react-router";

import { getPrisma } from "../../../app/lib/get-prisma";
import { deleteCategoryForUser } from "../categories.server";
import { isUuidish } from "../../links/validations/common";

type CategoriesActionAuth = Awaited<ReturnType<typeof getAuth>>;

type IntentResult = { ok: true } | { ok: false; message: string };

type DeleteCategoryInput = {
  auth: CategoriesActionAuth;
  formData: FormData;
};

/**
 * 사용자의 카테고리를 삭제한다.
 */
export async function handleDeleteCategory({
  auth,
  formData,
}: DeleteCategoryInput) {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !isUuidish(categoryId)) {
    return data<IntentResult>(
      { ok: false, message: "요청이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const prisma = await getPrisma();
    const result = await deleteCategoryForUser(prisma, {
      userId: auth.userId!,
      categoryId,
    });

    if (!result.deleted) {
      return data<IntentResult>(
        { ok: false, message: "카테고리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("feature", "categories");
      scope.setTag("operation", "delete");
      scope.setExtra("categoryId", categoryId);
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

  return data<IntentResult>({ ok: true });
}
