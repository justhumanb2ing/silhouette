import type { Prisma, PrismaClient } from "../../app/generated/prisma/client";

export type LinkListItem = Prisma.linksGetPayload<{
  select: {
    id: true;
    url: true;
    title: true;
    description: true;
    image_url: true;
    category_id: true;
    is_favorite: true;
  };
}>;

/**
 * 특정 사용자의 최근 링크 목록을 가져온다.
 */
export async function listLinksForUser(
  prisma: PrismaClient,
  userId: string
): Promise<LinkListItem[]> {
  return prisma.links.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      url: true,
      title: true,
      description: true,
      image_url: true,
      category_id: true,
      is_favorite: true,
    },
  });
}

/**
 * 사용자의 링크를 생성한다.
 * 최소 필드만 select하여 불필요한 데이터 로드를 피한다.
 */
export async function createLinkForUser(
  prisma: PrismaClient,
  input: { userId: string; url: string; categoryId?: string | null }
): Promise<{ id: string }> {
  const created = await prisma.links.create({
    data: {
      user_id: input.userId,
      url: input.url,
      category_id: input.categoryId ?? null,
    },
    select: { id: true },
  });

  return { id: created.id };
}

/**
 * 특정 링크의 즐겨찾기 여부를 설정한다.
 * 링크 소유자(user_id)가 아닌 경우 갱신되지 않는다.
 */
export async function setLinkFavoriteForUser(
  prisma: PrismaClient,
  input: { userId: string; linkId: string; isFavorite: boolean }
): Promise<{ updated: boolean }> {
  const result = await prisma.links.updateMany({
    where: { id: input.linkId, user_id: input.userId },
    data: { is_favorite: input.isFavorite, updated_at: new Date() },
  });

  return { updated: result.count === 1 };
}

/**
 * 특정 링크를 삭제한다.
 * 링크 소유자(user_id)가 아닌 경우 삭제되지 않는다.
 */
export async function deleteLinkForUser(
  prisma: PrismaClient,
  input: { userId: string; linkId: string }
): Promise<{ deleted: boolean }> {
  const result = await prisma.links.deleteMany({
    where: { id: input.linkId, user_id: input.userId },
  });

  return { deleted: result.count === 1 };
}

/**
 * 특정 링크의 메타데이터(title/description)를 수정한다.
 * 링크 소유자(user_id)가 아닌 경우 갱신되지 않는다.
 */
export async function updateLinkMetadataForUser(
  prisma: PrismaClient,
  input: {
    userId: string;
    linkId: string;
    title: string | null;
    description: string | null;
    categoryId: string | null;
  }
): Promise<{ updated: boolean }> {
  const result = await prisma.links.updateMany({
    where: { id: input.linkId, user_id: input.userId },
    data: {
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      updated_at: new Date(),
    },
  });

  return { updated: result.count === 1 };
}
