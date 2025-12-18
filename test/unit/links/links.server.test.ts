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
      data: { user_id: "user_1", url: "https://example.com/" },
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
              is_favorite: false,
            },
          ];
        },
      },
    } as unknown as PrismaClient;

    const result = await listLinksForUser(prisma, "user_1");
    expect(result).toEqual([
      {
        id: "link_1",
        url: "https://example.com/",
        title: "Example",
        description: "Hello",
        image_url: "https://cdn.example.com/image.png",
        is_favorite: false,
      },
    ]);
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
    });

    expect(result).toEqual({ updated: true });
    expect(received).toEqual({
      where: { id: "link_1", user_id: "user_1" },
      data: {
        title: "Updated",
        description: "New description",
        updated_at: expect.any(Date),
      },
    });
  });
});
