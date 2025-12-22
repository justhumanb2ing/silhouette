import { getAuth } from "@clerk/react-router/server";
import * as Sentry from "@sentry/react-router";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useIntlayer } from "react-intlayer";
import {
  type ShouldRevalidateFunctionArgs,
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from "react-router";

import type { Route } from "./+types/($lang)._auth.user.$id";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AddLinkCard } from "@/components/links/add-link-card";
import { LinkItemCard } from "@/components/links/link-item-card";
import { LinksToolbar } from "@/components/links/links-toolbar";

import { getPrisma } from "@/lib/get-prisma";

import { normalizeLinkUrl } from "../../service/links/utils/normalize-link-url";
import { fetchOgMetadataForUrl } from "../../service/links/fetch-og.server";
import {
  createLinkForUser,
  deleteLinkForUser,
  listLinksForUser,
  setLinkFavoriteForUser,
  updateLinkMetadataForUser,
} from "../../service/links/links.server";
import {
  getOrCreateCategoryForUser,
  listCategoriesForUser,
} from "../../service/categories/categories.server";

type ActionData = {
  fields?: {
    url?: string;
  };
  fieldErrors?: {
    url?: string;
  };
  formError?: string;
};

type IntentResult = { ok: true } | { ok: false; message: string };

type LinkView = "all" | "favorites";

type CreateLinkOgResult = Awaited<ReturnType<typeof fetchOgMetadataForUrl>>;

function isUuidish(input: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    input
  );
}

function normalizeOptionalTextField(
  input: FormDataEntryValue | null,
  options: { maxLength: number; label: string }
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (input === null) {
    return { ok: true, value: null };
  }

  if (typeof input !== "string") {
    return { ok: false, message: `${options.label} 값이 올바르지 않습니다.` };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }

  if (trimmed.length > options.maxLength) {
    return {
      ok: false,
      message: `${options.label}은 ${options.maxLength}자 이내로 입력해주세요.`,
    };
  }

  return { ok: true, value: trimmed };
}

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId || args.params.id !== auth.userId) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(args.request.url);
  const query = url.searchParams.get("q");

  const prisma = await getPrisma();
  const links = await listLinksForUser(prisma, auth.userId, { query });
  const categories = await listCategoriesForUser(prisma, auth.userId);
  return data({ links, categories });
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  const samePath = args.currentUrl.pathname === args.nextUrl.pathname;
  if (!samePath) {
    return args.defaultShouldRevalidate;
  }

  const stripTab = (url: URL) => {
    const params = new URLSearchParams(url.searchParams);
    params.delete("tab");
    params.delete("category");
    return params.toString();
  };

  const onlyTabChanged = stripTab(args.currentUrl) === stripTab(args.nextUrl);
  if (onlyTabChanged && args.formMethod == null) {
    return false;
  }

  return args.defaultShouldRevalidate;
}

export async function action(args: Route.ActionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (args.params.id !== auth.userId) {
    return data<ActionData>({ formError: "권한이 없습니다." }, { status: 403 });
  }

  const formData = await args.request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle-favorite") {
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
        userId: auth.userId,
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

  if (intent === "delete-link") {
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
        userId: auth.userId,
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
          message:
            "링크 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    return data<IntentResult>({ ok: true });
  }

  if (intent === "update-link") {
    const linkId = formData.get("linkId");
    const rawTitle = formData.get("title");
    const rawDescription = formData.get("description");
    const rawCategoryId = formData.get("categoryId");
    const rawCategoryName = formData.get("categoryName");
    const categoryMode = formData.get("categoryMode");

    if (typeof linkId !== "string" || !isUuidish(linkId)) {
      return data<IntentResult>(
        { ok: false, message: "요청이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const title = normalizeOptionalTextField(rawTitle, {
      maxLength: 200,
      label: "제목",
    });
    if (!title.ok) {
      return data<IntentResult>(
        { ok: false, message: title.message },
        { status: 400 }
      );
    }

    const description = normalizeOptionalTextField(rawDescription, {
      maxLength: 2000,
      label: "설명",
    });
    if (!description.ok) {
      return data<IntentResult>(
        { ok: false, message: description.message },
        { status: 400 }
      );
    }

    try {
      const prisma = await getPrisma();
      let resolvedCategoryId: string | null = null;

      if (categoryMode === "new") {
        if (typeof rawCategoryName !== "string" || !rawCategoryName.trim()) {
          return data<IntentResult>(
            { ok: false, message: "새 카테고리 이름을 입력해주세요." },
            { status: 400 }
          );
        }

        const name = rawCategoryName.trim();
        if (name.length > 50) {
          return data<IntentResult>(
            { ok: false, message: "카테고리 이름은 50자 이내로 입력해주세요." },
            { status: 400 }
          );
        }

        const category = await getOrCreateCategoryForUser(prisma, {
          userId: auth.userId,
          name,
        });
        resolvedCategoryId = category.id;
      } else {
        if (typeof rawCategoryId === "string") {
          if (!rawCategoryId) {
            resolvedCategoryId = null;
          } else {
            if (!isUuidish(rawCategoryId)) {
              return data<IntentResult>(
                { ok: false, message: "카테고리 값이 올바르지 않습니다." },
                { status: 400 }
              );
            }

            const category = await prisma.categories.findFirst({
              where: { id: rawCategoryId, user_id: auth.userId },
              select: { id: true },
            });
            if (!category) {
              return data<IntentResult>(
                { ok: false, message: "카테고리를 찾을 수 없습니다." },
                { status: 404 }
              );
            }
            resolvedCategoryId = category.id;
          }
        }
      }

      const result = await updateLinkMetadataForUser(prisma, {
        userId: auth.userId,
        linkId,
        title: title.value,
        description: description.value,
        categoryId: resolvedCategoryId,
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
        scope.setTag("operation", "update");
        scope.setExtra("linkId", linkId);
        scope.setExtra(
          "titleLength",
          typeof rawTitle === "string" ? rawTitle.length : null
        );
        scope.setExtra(
          "descriptionLength",
          typeof rawDescription === "string" ? rawDescription.length : null
        );
        Sentry.captureException(error);
      });

      return data<IntentResult>(
        {
          ok: false,
          message:
            "링크 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    return data<IntentResult>({ ok: true });
  }

  const rawUrl = formData.get("url");
  const normalizedUrl = normalizeLinkUrl(formData.get("url"));
  const rawCategoryId = formData.get("categoryId");
  const rawCategoryName = formData.get("categoryName");
  const categoryMode = formData.get("categoryMode");

  if (!normalizedUrl.ok) {
    return data<ActionData>(
      {
        fields: { url: typeof rawUrl === "string" ? rawUrl : undefined },
        fieldErrors: { url: normalizedUrl.message },
      },
      { status: 400 }
    );
  }

  try {
    const prisma = await getPrisma();
    let resolvedCategoryId: string | null = null;

    if (categoryMode === "new") {
      if (typeof rawCategoryName !== "string" || !rawCategoryName.trim()) {
        return data<ActionData>(
          {
            fields: { url: typeof rawUrl === "string" ? rawUrl : undefined },
            formError: "새 카테고리 이름을 입력해주세요.",
          },
          { status: 400 }
        );
      }

      const name = rawCategoryName.trim();
      if (name.length > 50) {
        return data<ActionData>(
          {
            fields: { url: typeof rawUrl === "string" ? rawUrl : undefined },
            formError: "카테고리 이름은 50자 이내로 입력해주세요.",
          },
          { status: 400 }
        );
      }

      const category = await getOrCreateCategoryForUser(prisma, {
        userId: auth.userId,
        name,
      });
      resolvedCategoryId = category.id;
    } else if (typeof rawCategoryId === "string" && rawCategoryId) {
      if (!isUuidish(rawCategoryId)) {
        return data<ActionData>(
          {
            fields: { url: typeof rawUrl === "string" ? rawUrl : undefined },
            formError: "카테고리 값이 올바르지 않습니다.",
          },
          { status: 400 }
        );
      }
      const category = await prisma.categories.findFirst({
        where: { id: rawCategoryId, user_id: auth.userId },
        select: { id: true },
      });

      if (!category) {
        return data<ActionData>(
          {
            fields: { url: typeof rawUrl === "string" ? rawUrl : undefined },
            formError: "카테고리를 찾을 수 없습니다.",
          },
          { status: 404 }
        );
      }

      resolvedCategoryId = category.id;
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
        ? fetchOgMetadataForUrl({ url: normalizedUrl.url, token })
        : Promise.resolve(
            createOgFailure("OG 요청 토큰을 가져오지 못했습니다.")
          );

      const ogResultPromise: Promise<CreateLinkOgResult> = ogPromise.catch(
        (error) => {
          Sentry.withScope((scope) => {
            scope.setLevel("error");
            scope.setTag("feature", "links");
            scope.setTag("operation", "create.fetch-og");
            scope.setExtra("url", normalizedUrl.url);
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
          scope.setExtra("url", normalizedUrl.url);
          scope.setExtra("message", message);
          Sentry.captureMessage("fetch-og failed");
        });
      }
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("feature", "links");
        scope.setTag("operation", "create.fetch-og");
        scope.setExtra("url", normalizedUrl.url);
        Sentry.captureException(error);
      });
    }

    await createLinkForUser(prisma, {
      userId: auth.userId,
      url: ogResult.ok ? ogResult.data.url : normalizedUrl.url,
      title: ogResult.ok ? ogResult.data.title : null,
      description: ogResult.ok ? ogResult.data.description : null,
      imageUrl: ogResult.ok ? ogResult.data.imageUrl : null,
      categoryId: resolvedCategoryId,
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
    return data<ActionData>(
      {
        fields: { url: typeof rawUrl === "string" ? rawUrl : undefined },
        formError:
          "링크 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }

  return redirect(new URL(args.request.url).pathname);
}

export default function UserRoute() {
  const { id } = useParams();
  const { links, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams] = useSearchParams();
  const { empty } = useIntlayer("links");

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categories]);

  const activeTab: LinkView =
    searchParams.get("tab") === "favorites" ? "favorites" : "all";

  const activeCategoryId = searchParams.get("category");
  const filteredLinks = links
    .filter((link) => (activeTab === "favorites" ? link.is_favorite : true))
    .filter((link) =>
      activeCategoryId ? link.category_id === activeCategoryId : true
    );

  const prevLinkCountRef = useRef(links.length);

  useEffect(() => {
    if (links.length > prevLinkCountRef.current) {
      formRef.current?.reset();
      document.getElementById("url")?.focus();
    }
    prevLinkCountRef.current = links.length;
  }, [links.length]);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="w-full max-w-7xl px-6 py-6">
      <AddLinkCard
        ref={formRef}
        userId={id}
        categories={categories}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />

      <div className="mt-8">
        <LinksToolbar categories={categories} />

        {filteredLinks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ExternalLink />
              </EmptyMedia>
              <EmptyTitle>
                {activeTab === "favorites"
                  ? empty.title.favorites
                  : empty.title.all}
              </EmptyTitle>
              <EmptyDescription>
                {activeTab === "favorites"
                  ? empty.description.favorites
                  : empty.description.all}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {filteredLinks.map((link) => (
              <LinkItemCard
                key={link.id}
                link={link}
                categories={categories}
                categoryName={
                  link.category_id
                    ? (categoryNameById.get(link.category_id) ?? null)
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
