import * as Sentry from "@sentry/react-router";
import { data, redirect } from "react-router";

import { getPrisma } from "../../../app/lib/get-prisma";

type FetchOgEdgeResult =
  | {
      ok: true;
      data: {
        url: string;
        title: string | null;
        description: string | null;
        imageUrl: string | null;
      };
    }
  | { ok: false; message: string };

async function fetchOgViaEdgeFunction({
  url,
  token,
}: {
  url: string;
  token: string;
}): Promise<FetchOgEdgeResult> {
  const response = await fetch(
    "https://louogijoxoorskrvzvei.supabase.co/functions/v1/fetch-og",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      message: `Edge function error (${response.status})`,
    };
  }

  return response.json();
}

import { createLinkForUser } from "../links.server";
import { parseCreateLinkInput } from "../validations/create-link";

import { resolveCategory } from "./resolve-category.server";
import type { LinksActionAuth } from "./types";
import { fetchOgMetadataForUrl } from "../fetch-og.server";

type CreateLinkInput = {
  auth: LinksActionAuth;
  formData: FormData;
  request: Request;
};

type CreateLinkOgResult = FetchOgEdgeResult;

/**
 * 새로운 링크를 생성한다.
 */
export async function handleCreateLink({
  auth,
  formData,
  request,
}: CreateLinkInput) {
  const parsed = parseCreateLinkInput(formData);
  if (!parsed.ok) {
    return data(
      {
        fields: { url: parsed.rawUrl },
        fieldErrors: { url: parsed.message },
      },
      { status: 400 }
    );
  }

  const { url, rawUrl, categoryId, categoryName, categoryMode } = parsed.data;

  try {
    const prisma = await getPrisma();
    const resolvedCategory = await resolveCategory({
      prisma,
      userId: auth.userId!,
      categoryId,
      categoryName,
      categoryMode,
    });

    if (!resolvedCategory.ok) {
      return data(
        {
          fields: { url: rawUrl },
          formError: resolvedCategory.message,
        },
        { status: resolvedCategory.status }
      );
    }

    const createOgFailure = (message: string): CreateLinkOgResult => ({
      ok: false,
      message,
    });

    let ogResult: CreateLinkOgResult = createOgFailure(
      "OG 데이터를 가져오지 못했습니다."
    );

    try {
      const token = await auth.getToken();

      const ogPromise: Promise<CreateLinkOgResult> = token
        ? fetchOgViaEdgeFunction({ url, token })
        : Promise.resolve(
            createOgFailure("OG 요청 토큰을 가져오지 못했습니다.")
          );

      const ogResultPromise: Promise<CreateLinkOgResult> = ogPromise.catch(
        (error) => {
          Sentry.withScope((scope) => {
            scope.setLevel("error");
            scope.setTag("feature", "links");
            scope.setTag("operation", "create.fetch-og");
            scope.setExtra("url", url);
            Sentry.captureException(error);
          });

          return createOgFailure("OG 데이터를 가져오지 못했습니다.");
        }
      );

      ogResult = await ogResultPromise;

      if (!ogResult.ok) {
        const message = ogResult.message;
        Sentry.withScope((scope) => {
          scope.setLevel("warning");
          scope.setTag("feature", "links");
          scope.setTag("operation", "create.fetch-og");
          scope.setExtra("url", url);
          scope.setExtra("message", message);
          Sentry.captureMessage("fetch-og failed");
        });
      }
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("feature", "links");
        scope.setTag("operation", "create.fetch-og");
        scope.setExtra("url", url);
        Sentry.captureException(error);
      });
    }

    await createLinkForUser(prisma, {
      userId: auth.userId!,
      url: ogResult.ok ? ogResult.data.url : url,
      title: ogResult.ok ? ogResult.data.title : null,
      description: ogResult.ok ? ogResult.data.description : null,
      imageUrl: ogResult.ok ? ogResult.data.imageUrl : null,
      categoryId: resolvedCategory.categoryId,
    });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("feature", "links");
      scope.setTag("operation", "create");
      scope.setExtra(
        "urlLength",
        typeof rawUrl === "string" ? rawUrl.length : null
      );
      Sentry.captureException(error);
    });
    return data(
      {
        fields: { url: rawUrl },
        formError:
          "링크 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }

  return redirect(new URL(request.url).pathname);
}
