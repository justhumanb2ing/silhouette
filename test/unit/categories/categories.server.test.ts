import { describe, expect, it } from "bun:test";

import type { PrismaClient } from "../../../app/generated/prisma/client";
import {
  createCategoryForUser,
  deleteCategoriesForUser,
  deleteCategoryForUser,
  getOrCreateCategoryForUser,
  listCategoriesForUser,
} from "../../../service/categories/categories.server";

describe("categories.server", () => {
  it("listCategoriesForUser returns prisma-selected shape", async () => {
    const prisma = {
      categories: {
        async findMany() {
          return [{ id: "cat_1", name: "Work" }];
        },
      },
    } as unknown as PrismaClient;

    const result = await listCategoriesForUser(prisma, "user_1");
    expect(result).toEqual([{ id: "cat_1", name: "Work" }]);
  });

  it("createCategoryForUser writes user_id + name", async () => {
    let received: unknown = undefined;

    const prisma = {
      categories: {
        async create(args: unknown) {
          received = args;
          return { id: "cat_1" };
        },
      },
    } as unknown as PrismaClient;

    const result = await createCategoryForUser(prisma, {
      userId: "user_1",
      name: "Work",
    });

    expect(result).toEqual({ id: "cat_1" });
    expect(received).toEqual({
      data: { user_id: "user_1", name: "Work" },
      select: { id: true },
    });
  });

  it("getOrCreateCategoryForUser returns existing category id", async () => {
    let createCalled = 0;

    const prisma = {
      categories: {
        async findFirst() {
          return { id: "cat_1" };
        },
        async create() {
          createCalled += 1;
          return { id: "cat_2" };
        },
      },
    } as unknown as PrismaClient;

    const result = await getOrCreateCategoryForUser(prisma, {
      userId: "user_1",
      name: " Work ",
    });

    expect(result).toEqual({ id: "cat_1" });
    expect(createCalled).toBe(0);
  });

  it("getOrCreateCategoryForUser creates when missing", async () => {
    let findCount = 0;

    const prisma = {
      categories: {
        async findFirst() {
          findCount += 1;
          return null;
        },
        async create() {
          return { id: "cat_1" };
        },
      },
    } as unknown as PrismaClient;

    const result = await getOrCreateCategoryForUser(prisma, {
      userId: "user_1",
      name: "Work",
    });

    expect(result).toEqual({ id: "cat_1" });
    expect(findCount).toBe(1);
  });

  it("getOrCreateCategoryForUser handles concurrent creation", async () => {
    let findCount = 0;
    let createCount = 0;

    const prisma = {
      categories: {
        async findFirst() {
          findCount += 1;
          return findCount === 1 ? null : { id: "cat_1" };
        },
        async create() {
          createCount += 1;
          throw new Error("unique violation");
        },
      },
    } as unknown as PrismaClient;

    const result = await getOrCreateCategoryForUser(prisma, {
      userId: "user_1",
      name: "Work",
    });

    expect(result).toEqual({ id: "cat_1" });
    expect(createCount).toBe(1);
  });

  it("deleteCategoryForUser clears links and deletes category", async () => {
    let receivedLinksArgs: unknown = undefined;
    let receivedCategoriesArgs: unknown = undefined;

    const prisma = {
      $transaction: async (runner: (tx: PrismaClient) => Promise<unknown>) =>
        runner({
          links: {
            async updateMany(args: unknown) {
              receivedLinksArgs = args;
              return { count: 2 };
            },
          },
          categories: {
            async deleteMany(args: unknown) {
              receivedCategoriesArgs = args;
              return { count: 1 };
            },
          },
        } as PrismaClient),
    } as unknown as PrismaClient;

    const result = await deleteCategoryForUser(prisma, {
      userId: "user_1",
      categoryId: "cat_1",
    });

    expect(result).toEqual({ deleted: true });
    expect(receivedLinksArgs).toEqual({
      where: { user_id: "user_1", category_id: "cat_1" },
      data: { category_id: null, updated_at: expect.any(Date) },
    });
    expect(receivedCategoriesArgs).toEqual({
      where: { id: "cat_1", user_id: "user_1" },
    });
  });

  it("deleteCategoryForUser returns deleted false when missing", async () => {
    const prisma = {
      $transaction: async (runner: (tx: PrismaClient) => Promise<unknown>) =>
        runner({
          links: {
            async updateMany() {
              return { count: 0 };
            },
          },
          categories: {
            async deleteMany() {
              return { count: 0 };
            },
          },
        } as PrismaClient),
    } as unknown as PrismaClient;

    const result = await deleteCategoryForUser(prisma, {
      userId: "user_1",
      categoryId: "cat_1",
    });

    expect(result).toEqual({ deleted: false });
  });

  it("deleteCategoriesForUser clears links and deletes categories", async () => {
    let receivedLinksArgs: unknown = undefined;
    let receivedCategoriesArgs: unknown = undefined;

    const prisma = {
      $transaction: async (runner: (tx: PrismaClient) => Promise<unknown>) =>
        runner({
          links: {
            async updateMany(args: unknown) {
              receivedLinksArgs = args;
              return { count: 2 };
            },
          },
          categories: {
            async deleteMany(args: unknown) {
              receivedCategoriesArgs = args;
              return { count: 2 };
            },
          },
        } as PrismaClient),
    } as unknown as PrismaClient;

    const result = await deleteCategoriesForUser(prisma, {
      userId: "user_1",
      categoryIds: ["cat_1", "cat_2"],
    });

    expect(result).toEqual({ deletedCount: 2 });
    expect(receivedLinksArgs).toEqual({
      where: { user_id: "user_1", category_id: { in: ["cat_1", "cat_2"] } },
      data: { category_id: null, updated_at: expect.any(Date) },
    });
    expect(receivedCategoriesArgs).toEqual({
      where: { id: { in: ["cat_1", "cat_2"] }, user_id: "user_1" },
    });
  });
});
