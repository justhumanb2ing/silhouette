import * as Sentry from "@sentry/react-router";
import { data } from "react-router";

import { getPrisma } from "../../../app/lib/get-prisma";

import { setLinkFavoriteForUser } from "../links.server";
import { isUuidish } from "../validations/common";

import type { IntentResult, LinksActionAuth } from "./types";

type ToggleFavoriteInput = {
  auth: LinksActionAuth;
  formData: FormData;
};

/**
 * 링크 즐겨찾기 상태를 변경한다.
 */
export async function handleToggleFavorite({
  auth,
  formData,
}: ToggleFavoriteInput) {
  const linkId = formData.get("linkId");
  const nextIsFavorite = formData.get("nextIsFavorite");

  if (
    typeof linkId !== "string" ||
    !isUuidish(linkId) ||
    (nextIsFavorite !== "true" && nextIsFavorite !== "false")
  ) {
    return data<IntentResult>(
      { ok: false, message: "요청이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const prisma = await getPrisma();
    const result = await setLinkFavoriteForUser(prisma, {
      userId: auth.userId!,
      linkId,
      isFavorite: nextIsFavorite === "true",
    });

    if (!result.updated) {
      return data<IntentResult>(
        { ok: false, message: "링크를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("feature", "links");
      scope.setTag("operation", "favorite.toggle");
      scope.setExtra("linkId", linkId);
      Sentry.captureException(error);
    });

    return data<IntentResult>(
      {
        ok: false,
        message:
          "즐겨찾기 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }

  return data<IntentResult>({ ok: true });
}
