import type { Prisma, PrismaClient } from "../../app/generated/prisma/client";

export type LinkListItem = Prisma.linksGetPayload<{
  select: { id: true; url: true; created_at: true };
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
    select: { id: true, url: true, created_at: true },
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
