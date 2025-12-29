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

export type LinkListPage = {
  links: LinkListItem[];
  nextCursor: string | null;
};

type LinkListOptions = {
  query?: string | null;
  cursor?: string | null;
  limit?: number | null;
  favoritesOnly?: boolean;
  categoryId?: string | null;
};

const DEFAULT_LINKS_PAGE_SIZE = 10;
const MAX_LINKS_PAGE_SIZE = 100;

/**
 * 특정 사용자의 최근 링크 목록을 페이지네이션 형태로 가져온다.
 * cursor가 제공되면 해당 커서 이후의 데이터를 이어서 조회한다.
 */
export async function listLinksForUser(
  prisma: PrismaClient,
  userId: string,
  options?: LinkListOptions
): Promise<LinkListPage> {
  const query = options?.query?.trim();
  const pageSizeInput = options?.limit ?? DEFAULT_LINKS_PAGE_SIZE;
  const pageSize = Number.isFinite(pageSizeInput)
    ? Math.max(1, Math.min(pageSizeInput, MAX_LINKS_PAGE_SIZE))
    : DEFAULT_LINKS_PAGE_SIZE;
  const cursor = options?.cursor ?? null;

  const where: Prisma.linksWhereInput = {
    user_id: userId,
    ...(options?.favoritesOnly ? { is_favorite: true } : {}),
    ...(options?.categoryId ? { category_id: options.categoryId } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            {
              AND: [
                { title: null },
                { url: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };

  const result = await prisma.links.findMany({
    where,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

  const hasMore = result.length > pageSize;
  const links = hasMore ? result.slice(0, pageSize) : result;
  const nextCursor = hasMore ? (links.at(-1)?.id ?? null) : null;

  return { links, nextCursor };
}

/**
 * 사용자의 링크를 생성한다.
 * 최소 필드만 select하여 불필요한 데이터 로드를 피한다.
 */
export async function createLinkForUser(
  prisma: PrismaClient,
  input: {
    userId: string;
    url: string;
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    categoryId?: string | null;
  }
): Promise<{ id: string }> {
  const created = await prisma.links.create({
    data: {
      user_id: input.userId,
      url: input.url,
      title: input.title ?? null,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
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
