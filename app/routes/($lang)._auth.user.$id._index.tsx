import { getAuth } from "@clerk/react-router/server";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIntlayer } from "react-intlayer";
import {
  type ShouldRevalidateFunctionArgs,
  data,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from "react-router";

import type { Route } from "./+types/($lang)._auth.user.$id._index";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { AddLinkCard } from "@/components/links/add-link-card";
import { LinkItemCard } from "@/components/links/link-item-card";
import { LinksToolbar } from "@/components/links/links-toolbar";

import { getPrisma } from "@/lib/get-prisma";

import { listCategoriesForUser } from "../../service/categories/categories.server";
import { handleDeleteCategory } from "../../service/categories/actions/delete-category.server";
import { handleCreateLink } from "../../service/links/actions/create-link.server";
import { handleDeleteLink } from "../../service/links/actions/delete-link.server";
import { handleToggleFavorite } from "../../service/links/actions/toggle-favorite.server";
import { handleUpdateLink } from "../../service/links/actions/update-link.server";
import {
  listLinksForUser,
  type LinkListItem,
} from "../../service/links/links.server";

type ActionData = {
  fields?: {
    url?: string;
  };
  fieldErrors?: {
    url?: string;
  };
  formError?: string;
};

type LinkView = "all" | "favorites";

type LinksPaginationData = {
  links: LinkListItem[];
  nextCursor: string | null;
  listKey: string;
};

const CURSOR_PARAM = "cursor";
const LIST_KEY_PARAMS = new Set(["q", "tab", "category"]);

function getListKey(params: URLSearchParams) {
  const entries = Array.from(params.entries()).filter(([key]) =>
    LIST_KEY_PARAMS.has(key)
  );
  entries.sort(([aKey, aValue], [bKey, bValue]) => {
    if (aKey === bKey) {
      return aValue.localeCompare(bValue);
    }
    return aKey.localeCompare(bKey);
  });
  return new URLSearchParams(entries).toString();
}

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId || args.params.id !== auth.userId) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(args.request.url);
  const query = url.searchParams.get("q");
  const tab = url.searchParams.get("tab");
  const categoryId = url.searchParams.get("category");
  const cursorParam = url.searchParams.get(CURSOR_PARAM);
  const cursor = cursorParam?.trim() ? cursorParam : null;
  const favoritesOnly = tab === "favorites";
  const listKey = getListKey(url.searchParams);

  const prisma = await getPrisma();
  const { links, nextCursor } = await listLinksForUser(prisma, auth.userId, {
    query,
    cursor,
    favoritesOnly,
    categoryId,
  });
  const categories = cursor
    ? []
    : await listCategoriesForUser(prisma, auth.userId);
  return data({ links, categories, nextCursor, listKey });
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  const samePath = args.currentUrl.pathname === args.nextUrl.pathname;
  if (!samePath) {
    return args.defaultShouldRevalidate;
  }

  if (args.formMethod == null) {
    if (args.nextUrl.searchParams.has(CURSOR_PARAM)) {
      return true;
    }
    return getListKey(args.currentUrl.searchParams) !==
      getListKey(args.nextUrl.searchParams);
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

  switch (intent) {
    case "toggle-favorite":
      return handleToggleFavorite({ auth, formData });
    case "delete-link":
      return handleDeleteLink({ auth, formData });
    case "delete-category":
      return handleDeleteCategory({ auth, formData });
    case "update-link":
      return handleUpdateLink({ auth, formData });
    default:
      return handleCreateLink({ auth, formData, request: args.request });
  }
}

export default function UserRoute() {
  const { id } = useParams();
  const {
    links: initialLinks,
    categories,
    nextCursor: initialNextCursor,
    listKey,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const loadMoreFetcher = useFetcher<LinksPaginationData>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const wasSubmittingRef = useRef(false);
  const [searchParams] = useSearchParams();
  const { common, empty } = useIntlayer("links");
  const [links, setLinks] = useState(initialLinks);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);

  useEffect(() => {
    setLinks(initialLinks);
    setNextCursor(initialNextCursor);
  }, [initialLinks, initialNextCursor]);

  useEffect(() => {
    const fetcherData = loadMoreFetcher.data;
    if (!fetcherData) return;
    if (fetcherData.listKey !== listKey) return;

    setLinks((prev) => {
      const seen = new Set(prev.map((link) => link.id));
      const merged = [...prev];
      for (const link of fetcherData.links) {
        if (!seen.has(link.id)) {
          merged.push(link);
        }
      }
      return merged;
    });
    setNextCursor(fetcherData.nextCursor);
  }, [listKey, loadMoreFetcher.data]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categories]);

  const activeTab: LinkView =
    searchParams.get("tab") === "favorites" ? "favorites" : "all";

  useEffect(() => {
    if (navigation.state === "submitting") {
      wasSubmittingRef.current = true;
      return;
    }

    if (!wasSubmittingRef.current || navigation.state !== "idle") {
      return;
    }

    if (!actionData) {
      formRef.current?.reset();
      document.getElementById("url")?.focus();
    }
    wasSubmittingRef.current = false;
  }, [actionData, navigation.state]);

  const isSubmitting = navigation.state === "submitting";
  const isLoadingMore = loadMoreFetcher.state !== "idle";
  const canLoadMore = Boolean(nextCursor);
  const loadMoreParams = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of LIST_KEY_PARAMS) {
      const value = searchParams.get(key);
      if (value) {
        params.set(key, value);
      }
    }
    return Array.from(params.entries());
  }, [searchParams]);

  return (
    <div className="w-full px-6 py-6 h-full">
      <AddLinkCard
        ref={formRef}
        userId={id}
        categories={categories}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />

      <div className="mt-8">
        <LinksToolbar categories={categories} />

        {links.length === 0 ? (
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
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
              {links.map((link) => (
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
            {canLoadMore ? (
              <div className="mt-4 flex justify-center">
                <loadMoreFetcher.Form method="get" action=".">
                  {loadMoreParams.map(([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                  ))}
                  <input
                    type="hidden"
                    name={CURSOR_PARAM}
                    value={nextCursor ?? ""}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? common.loadingMore : common.loadMore}
                  </Button>
                </loadMoreFetcher.Form>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
