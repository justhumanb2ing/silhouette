import { describe, expect, it } from "bun:test";

import type { PrismaClient } from "../../../app/generated/prisma/client";
import {
  createLinkForUser,
  listLinksForUser,
  setLinkFavoriteForUser,
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
    const now = new Date("2025-01-01T00:00:00.000Z");

    const prisma = {
      links: {
        async findMany() {
          return [
            {
              id: "link_1",
              url: "https://example.com/",
              is_favorite: false,
              created_at: now,
            },
          ];
        },
      },
    } as unknown as PrismaClient;

    const result = await listLinksForUser(prisma, "user_1");
    expect(result).toEqual([
      { id: "link_1", url: "https://example.com/", is_favorite: false, created_at: now },
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
});
