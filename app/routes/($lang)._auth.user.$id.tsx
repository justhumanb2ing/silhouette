import { getAuth } from "@clerk/react-router/server";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useIntlayer } from "react-intlayer";
import {
  type ShouldRevalidateFunctionArgs,
  data,
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

import { listCategoriesForUser } from "../../service/categories/categories.server";
import { handleCreateLink } from "../../service/links/actions/create-link.server";
import { handleDeleteLink } from "../../service/links/actions/delete-link.server";
import { handleToggleFavorite } from "../../service/links/actions/toggle-favorite.server";
import { handleUpdateLink } from "../../service/links/actions/update-link.server";
import { listLinksForUser } from "../../service/links/links.server";

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

  switch (intent) {
    case "toggle-favorite":
      return handleToggleFavorite({ auth, formData });
    case "delete-link":
      return handleDeleteLink({ auth, formData });
    case "update-link":
      return handleUpdateLink({ auth, formData });
    default:
      return handleCreateLink({ auth, formData, request: args.request });
  }
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
