import * as Sentry from "@sentry/react-router";
import { data } from "react-router";

import { getPrisma } from "../../../app/lib/get-prisma";

import { deleteLinkForUser } from "../links.server";
import { isUuidish } from "../validations/common";

import type { IntentResult, LinksActionAuth } from "./types";

type DeleteLinkInput = {
  auth: LinksActionAuth;
  formData: FormData;
};

/**
 * 사용자의 링크를 삭제한다.
 */
export async function handleDeleteLink({
  auth,
  formData,
}: DeleteLinkInput) {
  const linkId = formData.get("linkId");
  if (typeof linkId !== "string" || !isUuidish(linkId)) {
    return data<IntentResult>(
      { ok: false, message: "요청이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const prisma = await getPrisma();
    const result = await deleteLinkForUser(prisma, {
      userId: auth.userId!,
      linkId,
    });

    if (!result.deleted) {
      return data<IntentResult>(
        { ok: false, message: "링크를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("feature", "links");
      scope.setTag("operation", "delete");
      scope.setExtra("linkId", linkId);
      Sentry.captureException(error);
    });

    return data<IntentResult>(
      {
        ok: false,
        message: "링크 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }

  return data<IntentResult>({ ok: true });
}
