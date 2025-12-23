import { describe, expect, it } from "bun:test";

import type { PrismaClient } from "../../../app/generated/prisma/client";
import {
  createLinkForUser,
  deleteLinkForUser,
  listLinksForUser,
  setLinkFavoriteForUser,
  updateLinkMetadataForUser,
} from "../../../service/links/links.server";

describe("links.server", () => {
  it("createLinkForUser writes user_id + url", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async create(args: unknown) {
          received = args;
          return { id: "link_1" };
        },
      },
    } as unknown as PrismaClient;

    const result = await createLinkForUser(prisma, {
      userId: "user_1",
      url: "https://example.com/",
    });

    expect(result).toEqual({ id: "link_1" });
    expect(received).toEqual({
      data: {
        user_id: "user_1",
        url: "https://example.com/",
        title: null,
        description: null,
        image_url: null,
        category_id: null,
      },
      select: { id: true },
    });
  });

  it("listLinksForUser returns prisma-selected shape", async () => {
    const prisma = {
      links: {
        async findMany() {
          return [
            {
              id: "link_1",
              url: "https://example.com/",
              title: "Example",
              description: "Hello",
              image_url: "https://cdn.example.com/image.png",
              category_id: "cat_1",
              is_favorite: false,
            },
          ];
        },
      },
    } as unknown as PrismaClient;

    const result = await listLinksForUser(prisma, "user_1");
    expect(result).toEqual({
      links: [
        {
          id: "link_1",
          url: "https://example.com/",
          title: "Example",
          description: "Hello",
          image_url: "https://cdn.example.com/image.png",
          category_id: "cat_1",
          is_favorite: false,
        },
      ],
      nextCursor: null,
    });
  });

  it("listLinksForUser applies search where clause (title first, url only when title is null)", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async findMany(args: unknown) {
          received = args;
          return [];
        },
      },
    } as unknown as PrismaClient;

    await listLinksForUser(prisma, "user_1", { query: "hello" });

    expect(received).toEqual({
      where: {
        user_id: "user_1",
        OR: [
          { title: { contains: "hello", mode: "insensitive" } },
          {
            AND: [
              { title: null },
              { url: { contains: "hello", mode: "insensitive" } },
            ],
          },
        ],
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 6,
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
  });

  it("listLinksForUser applies cursor pagination", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async findMany(args: unknown) {
          received = args;
          return [];
        },
      },
    } as unknown as PrismaClient;

    await listLinksForUser(prisma, "user_1", {
      cursor: "link_10",
      limit: 10,
    });

    expect(received).toEqual({
      where: { user_id: "user_1" },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 11,
      cursor: { id: "link_10" },
      skip: 1,
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
  });

  it("listLinksForUser includes favorites/category filters", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async findMany(args: unknown) {
          received = args;
          return [];
        },
      },
    } as unknown as PrismaClient;

    await listLinksForUser(prisma, "user_1", {
      favoritesOnly: true,
      categoryId: "cat_1",
    });

    expect(received).toEqual({
      where: { user_id: "user_1", is_favorite: true, category_id: "cat_1" },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 6,
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
  });

  it("listLinksForUser returns nextCursor when more links remain", async () => {
    const prisma = {
      links: {
        async findMany() {
          return [
            {
              id: "link_2",
              url: "https://example.com/2",
              title: null,
              description: null,
              image_url: null,
              category_id: null,
              is_favorite: false,
            },
            {
              id: "link_1",
              url: "https://example.com/1",
              title: null,
              description: null,
              image_url: null,
              category_id: null,
              is_favorite: false,
            },
          ];
        },
      },
    } as unknown as PrismaClient;

    const result = await listLinksForUser(prisma, "user_1", { limit: 1 });

    expect(result).toEqual({
      links: [
        {
          id: "link_2",
          url: "https://example.com/2",
          title: null,
          description: null,
          image_url: null,
          category_id: null,
          is_favorite: false,
        },
      ],
      nextCursor: "link_2",
    });
  });

  it("setLinkFavoriteForUser updates only owned link", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async updateMany(args: unknown) {
          received = args;
          return { count: 1 };
        },
      },
    } as unknown as PrismaClient;

    const result = await setLinkFavoriteForUser(prisma, {
      userId: "user_1",
      linkId: "link_1",
      isFavorite: true,
    });

    expect(result).toEqual({ updated: true });
    expect(received).toEqual({
      where: { id: "link_1", user_id: "user_1" },
      data: { is_favorite: true, updated_at: expect.any(Date) },
    });
  });

  it("deleteLinkForUser deletes only owned link", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async deleteMany(args: unknown) {
          received = args;
          return { count: 1 };
        },
      },
    } as unknown as PrismaClient;

    const result = await deleteLinkForUser(prisma, {
      userId: "user_1",
      linkId: "link_1",
    });

    expect(result).toEqual({ deleted: true });
    expect(received).toEqual({
      where: { id: "link_1", user_id: "user_1" },
    });
  });

  it("updateLinkMetadataForUser updates only owned link", async () => {
    let received: unknown = undefined;

    const prisma = {
      links: {
        async updateMany(args: unknown) {
          received = args;
          return { count: 1 };
        },
      },
    } as unknown as PrismaClient;

    const result = await updateLinkMetadataForUser(prisma, {
      userId: "user_1",
      linkId: "link_1",
      title: "Updated",
      description: "New description",
      categoryId: "cat_1",
    });

    expect(result).toEqual({ updated: true });
    expect(received).toEqual({
      where: { id: "link_1", user_id: "user_1" },
      data: {
        title: "Updated",
        description: "New description",
        category_id: "cat_1",
        updated_at: expect.any(Date),
      },
    });
  });
});
