import type { Prisma, PrismaClient } from "../../app/generated/prisma/client";

export type LinkListItem = Prisma.linksGetPayload<{
  select: { id: true; url: true; is_favorite: true; created_at: true };
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
    select: { id: true, url: true, is_favorite: true, created_at: true },
  });
}

/**
 * 사용자의 링크를 생성한다.
 * 최소 필드만 select하여 불필요한 데이터 로드를 피한다.
 */
export async function createLinkForUser(
  prisma: PrismaClient,
  input: { userId: string; url: string }
): Promise<{ id: string }> {
  const created = await prisma.links.create({
    data: { user_id: input.userId, url: input.url },
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
