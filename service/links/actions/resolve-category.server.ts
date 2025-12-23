import type { PrismaClient } from "../../../app/generated/prisma/client";

import { getOrCreateCategoryForUser } from "../../categories/categories.server";
import { isUuidish } from "../validations/common";

type ResolveCategoryInput = {
  prisma: PrismaClient;
  userId: string;
  categoryId: FormDataEntryValue | null;
  categoryName: FormDataEntryValue | null;
  categoryMode: FormDataEntryValue | null;
};

type ResolveCategoryResult =
  | { ok: true; categoryId: string | null }
  | { ok: false; message: string; status: number };

/**
 * 카테고리 입력을 검증하고 필요한 경우 새 카테고리를 생성한다.
 */
export async function resolveCategory(
  input: ResolveCategoryInput
): Promise<ResolveCategoryResult> {
  const { prisma, userId, categoryId, categoryName, categoryMode } = input;

  if (categoryMode === "new") {
    if (typeof categoryName !== "string" || !categoryName.trim()) {
      return {
        ok: false,
        message: "새 카테고리 이름을 입력해주세요.",
        status: 400,
      };
    }

    const name = categoryName.trim();
    if (name.length > 50) {
      return {
        ok: false,
        message: "카테고리 이름은 50자 이내로 입력해주세요.",
        status: 400,
      };
    }

    const category = await getOrCreateCategoryForUser(prisma, {
      userId,
      name,
    });
    return { ok: true, categoryId: category.id };
  }

  if (typeof categoryId !== "string") {
    return { ok: true, categoryId: null };
  }

  if (!categoryId) {
    return { ok: true, categoryId: null };
  }

  if (!isUuidish(categoryId)) {
    return {
      ok: false,
      message: "카테고리 값이 올바르지 않습니다.",
      status: 400,
    };
  }

  const category = await prisma.categories.findFirst({
    where: { id: categoryId, user_id: userId },
    select: { id: true },
  });

  if (!category) {
    return { ok: false, message: "카테고리를 찾을 수 없습니다.", status: 404 };
  }

  return { ok: true, categoryId: category.id };
}
