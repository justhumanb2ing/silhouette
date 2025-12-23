import type { getAuth } from "@clerk/react-router/server";

export type LinksActionAuth = Awaited<ReturnType<typeof getAuth>>;

export type IntentResult = { ok: true } | { ok: false; message: string };
