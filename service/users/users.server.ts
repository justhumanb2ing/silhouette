import type { PrismaClient } from "../../app/generated/prisma/client";

export type DeleteUserDataResult = {
  deletedLinks: number;
  deletedCategories: number;
  deletedUser: boolean;
};

/**
 * 사용자 계정 삭제 시 연관 데이터를 제거한다.
 * Clerk 계정 삭제는 별도 처리한다.
 */
export async function deleteUserDataForAccount(
  prisma: PrismaClient,
  userId: string
): Promise<DeleteUserDataResult> {
  const result = await prisma.$transaction(async (tx) => {
    const deletedLinks = await tx.links.deleteMany({
      where: { user_id: userId },
    });
    const deletedCategories = await tx.categories.deleteMany({
      where: { user_id: userId },
    });
    const deletedUser = await tx.users.deleteMany({
      where: { id: userId },
    });

    return {
      deletedLinks: deletedLinks.count,
      deletedCategories: deletedCategories.count,
      deletedUser: deletedUser.count > 0,
    };
  });

  return result;
}
