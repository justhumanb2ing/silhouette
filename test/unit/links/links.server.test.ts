import { describe, expect, it } from "bun:test";

import type { PrismaClient } from "../../../app/generated/prisma/client";
import { createLinkForUser, listLinksForUser } from "../../../service/links/links.server";

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
          return [{ id: "link_1", url: "https://example.com/", created_at: now }];
        },
      },
    } as unknown as PrismaClient;

    const result = await listLinksForUser(prisma, "user_1");
    expect(result).toEqual([
      { id: "link_1", url: "https://example.com/", created_at: now },
    ]);
  });
});
