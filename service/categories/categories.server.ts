import type { PrismaClient } from "../../app/generated/prisma/client";

export type CategoryListItem = { id: string; name: string };

/**
 * 특정 사용자의 카테고리 목록을 가져온다.
 * 정렬/관리 UI 요구가 없으므로 별도 orderBy는 두지 않는다.
 */
export async function listCategoriesForUser(
  prisma: PrismaClient,
  userId: string
): Promise<CategoryListItem[]> {
  return prisma.categories.findMany({
    where: { user_id: userId },
    select: { id: true, name: true },
  });
}

/**
 * 카테고리를 생성한다. (같은 user_id + name 조합은 유니크)
 */
export async function createCategoryForUser(
  prisma: PrismaClient,
  input: { userId: string; name: string }
): Promise<{ id: string }> {
  const created = await prisma.categories.create({
    data: { user_id: input.userId, name: input.name },
    select: { id: true },
  });

  return { id: created.id };
}

/**
 * 카테고리를 삭제하고 연결된 링크의 카테고리를 해제한다.
 */
export async function deleteCategoryForUser(
  prisma: PrismaClient,
  input: { userId: string; categoryId: string }
): Promise<{ deleted: boolean }> {
  const result = await prisma.$transaction(async (tx) => {
    await tx.links.updateMany({
      where: { user_id: input.userId, category_id: input.categoryId },
      data: { category_id: null, updated_at: new Date() },
    });

    const deleted = await tx.categories.deleteMany({
      where: { id: input.categoryId, user_id: input.userId },
    });

    return { deleted: deleted.count === 1 };
  });

  return result;
}

/**
 * 입력된 이름으로 카테고리를 가져오거나(존재하면) 생성한다.
 * - 이름은 trim 후 저장한다.
 * - 유니크 충돌은 "이미 생성됨"으로 처리한다.
 */
export async function getOrCreateCategoryForUser(
  prisma: PrismaClient,
  input: { userId: string; name: string }
): Promise<{ id: string }> {
  const name = input.name.trim();

  const existing = await prisma.categories.findFirst({
    where: { user_id: input.userId, name },
    select: { id: true },
  });
  if (existing) {
    return { id: existing.id };
  }

  try {
    const created = await prisma.categories.create({
      data: { user_id: input.userId, name },
      select: { id: true },
    });
    return { id: created.id };
  } catch (error) {
    const concurrent = await prisma.categories.findFirst({
      where: { user_id: input.userId, name },
      select: { id: true },
    });
    if (concurrent) {
      return { id: concurrent.id };
    }
    throw error;
  }
}
