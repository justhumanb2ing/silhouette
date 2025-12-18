import { getAuth } from "@clerk/react-router/server";
import * as Sentry from "@sentry/react-router";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Form,
  type ShouldRevalidateFunctionArgs,
  data,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from "react-router";

import type { Route } from "./+types/($lang)._auth.user.$id";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { debounce } from "es-toolkit";

import { useSupabaseServer } from "@/config/supabase/server";
import { getPrisma } from "@/lib/get-prisma";

import { normalizeLinkUrl } from "../../service/links/utils/normalize-link-url";
import { fetchOgMetadataForUrl } from "../../service/links/fetch-og.server";
import {
  createLinkForUser,
  type LinkListItem,
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

function LinkItemCard({
  link,
  categories,
  categoryName,
}: {
  link: LinkListItem;
  categories: { id: string; name: string }[];
  categoryName: string | null;
}) {
  const favoriteFetcher = useFetcher<IntentResult>();
  const updateFetcher = useFetcher<IntentResult>();
  const deleteFetcher = useFetcher<IntentResult>();

  const pendingFavorite = favoriteFetcher.formData?.get("nextIsFavorite");
  const optimisticIsFavorite =
    typeof pendingFavorite === "string"
      ? pendingFavorite === "true"
      : link.is_favorite;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(link.title ?? "");
  const [draftDescription, setDraftDescription] = useState(
    link.description ?? ""
  );
  const [draftCategoryId, setDraftCategoryId] = useState(
    link.category_id ?? ""
  );
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [draftNewCategoryName, setDraftNewCategoryName] = useState("");

  useEffect(() => {
    if (isEditOpen) {
      setDraftTitle(link.title ?? "");
      setDraftDescription(link.description ?? "");
      setDraftCategoryId(link.category_id ?? "");
      setIsNewCategoryMode(false);
      setDraftNewCategoryName("");
    }
  }, [isEditOpen, link.category_id, link.description, link.title]);

  useEffect(() => {
    if (updateFetcher.data?.ok) {
      setIsEditOpen(false);
    }
  }, [updateFetcher.data]);

  const isBusy =
    favoriteFetcher.state !== "idle" ||
    updateFetcher.state !== "idle" ||
    deleteFetcher.state !== "idle";

  const displayTitle = link.title?.trim() ? link.title : link.url;
  const displayDescription = link.description?.trim()
    ? link.description
    : "설명이 없습니다.";

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="relative">
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl ring-foreground/10 ring-1"
            aria-label="링크 열기"
          >
            {link.image_url ? (
              <img
                src={link.image_url}
                alt={displayTitle}
                loading="lazy"
                decoding="async"
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-40 w-full items-center justify-center">
                <ExternalLink />
              </div>
            )}
          </a>

          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-xl bg-background/80 p-1 ring-foreground/10 ring-1 backdrop-blur-sm">
            <favoriteFetcher.Form method="post">
              <input type="hidden" name="intent" value="toggle-favorite" />
              <input type="hidden" name="linkId" value={link.id} />
              <input
                type="hidden"
                name="nextIsFavorite"
                value={String(!optimisticIsFavorite)}
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                disabled={isBusy}
                aria-label={
                  optimisticIsFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"
                }
              >
                <Star
                  className={
                    optimisticIsFavorite
                      ? "fill-current text-amber-500"
                      : "text-muted-foreground"
                  }
                />
              </Button>
            </favoriteFetcher.Form>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isBusy}
                    aria-label="링크 수정"
                  >
                    <Pencil className="text-muted-foreground" />
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>링크 수정</DialogTitle>
                  <DialogDescription>
                    링크의 제목과 설명을 수정합니다.
                  </DialogDescription>
                </DialogHeader>

                <updateFetcher.Form
                  method="post"
                  className="flex flex-col gap-3"
                >
                  <input type="hidden" name="intent" value="update-link" />
                  <input type="hidden" name="linkId" value={link.id} />
                  <input
                    type="hidden"
                    name="categoryMode"
                    value={isNewCategoryMode ? "new" : "select"}
                  />
                  <Input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                  <Textarea
                    name="description"
                    placeholder="Description"
                    value={draftDescription}
                    onChange={(event) =>
                      setDraftDescription(event.target.value)
                    }
                  />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <NativeSelect
                      name="categoryId"
                      value={draftCategoryId}
                      disabled={isNewCategoryMode}
                      onChange={(event) =>
                        setDraftCategoryId(event.target.value)
                      }
                    >
                      <NativeSelectOption value="">
                        카테고리 없음
                      </NativeSelectOption>
                      {categories.map((category) => (
                        <NativeSelectOption
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>

                    <Button
                      type="button"
                      variant="ghost"
                      size={"sm"}
                      className={"rounded-md text-xs"}
                      onClick={() => {
                        setIsNewCategoryMode((prev) => !prev);
                        setDraftNewCategoryName("");
                      }}
                    >
                      {isNewCategoryMode ? "취소" : "+ 새 카테고리"}
                    </Button>
                  </div>

                  {isNewCategoryMode ? (
                    <Input
                      name="categoryName"
                      type="text"
                      placeholder="새 카테고리 이름"
                      autoComplete="off"
                      value={draftNewCategoryName}
                      onChange={(event) =>
                        setDraftNewCategoryName(event.target.value)
                      }
                      required
                    />
                  ) : null}

                  {updateFetcher.data && !updateFetcher.data.ok ? (
                    <div className="text-sm text-destructive" role="alert">
                      {updateFetcher.data.message}
                    </div>
                  ) : null}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditOpen(false)}
                      disabled={updateFetcher.state !== "idle"}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateFetcher.state !== "idle"}
                    >
                      {updateFetcher.state !== "idle" ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </updateFetcher.Form>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isBusy}
                    aria-label="링크 삭제"
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>링크를 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    삭제한 링크는 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {deleteFetcher.data && !deleteFetcher.data.ok ? (
                  <div className="text-sm text-destructive" role="alert">
                    {deleteFetcher.data.message}
                  </div>
                ) : null}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteFetcher.state !== "idle"}>
                    Cancel
                  </AlertDialogCancel>
                  <deleteFetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete-link" />
                    <input type="hidden" name="linkId" value={link.id} />
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={deleteFetcher.state !== "idle"}
                    >
                      {deleteFetcher.state !== "idle"
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </deleteFetcher.Form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {categoryName ? (
            <div className="text-muted-foreground text-xs">{categoryName}</div>
          ) : null}
          <div className="font-medium leading-snug">{displayTitle}</div>
          <div className="text-muted-foreground text-sm leading-snug">
            {displayDescription}
          </div>
        </div>

        <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
          <div className="font-mono break-all">{link.url}</div>
        </div>
      </CardContent>
    </Card>
  );
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

    let ogResult: CreateLinkOgResult = {
      ok: false,
      message: "OG 데이터를 가져오지 못했습니다.",
    };

    try {
      const supabase = await useSupabaseServer(args);
      const ogFallback: CreateLinkOgResult = {
        ok: false,
        message: "OG 요청 시간이 초과되었습니다.",
      };

      const ogPromise: Promise<CreateLinkOgResult> = fetchOgMetadataForUrl(
        supabase,
        { url: normalizedUrl.url }
      ).catch((error) => {
        Sentry.withScope((scope) => {
          scope.setLevel("error");
          scope.setTag("feature", "links");
          scope.setTag("operation", "create.fetch-og");
          scope.setExtra("url", normalizedUrl.url);
          Sentry.captureException(error);
        });

        return { ok: false, message: "OG 데이터를 가져오지 못했습니다." };
      });

      const timeoutPromise = new Promise<CreateLinkOgResult>((resolve) =>
        setTimeout(() => resolve(ogFallback), 3000)
      );

      ogResult = await Promise.race([ogPromise, timeoutPromise] as const);

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  const debouncedSetQuery = useMemo(
    () =>
      debounce((nextValue: string) => {
        const trimmed = nextValue.trim();
        const nextParams = new URLSearchParams(searchParamsRef.current);
        if (trimmed) {
          nextParams.set("q", trimmed);
        } else {
          nextParams.delete("q");
        }
        setSearchParams(nextParams, { replace: true });
      }, 250),
    [setSearchParams]
  );

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

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
    <div className="w-full max-w-xl px-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-anton tracking-tight uppercase">
            Add Link
          </CardTitle>
          <CardDescription>
            사용자({id})의 아카이브에 URL을 저장합니다.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form ref={formRef} method="post" className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="url">URL</FieldLabel>
              <FieldContent>
                <Input
                  id="url"
                  name="url"
                  type="text"
                  inputMode="url"
                  placeholder="https://example.com"
                  defaultValue={actionData?.fields?.url}
                  aria-invalid={Boolean(actionData?.fieldErrors?.url)}
                  required
                  autoFocus
                />
                <FieldDescription>
                  http 또는 https 링크만 저장할 수 있습니다.
                </FieldDescription>
                <FieldError>{actionData?.fieldErrors?.url}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Category</FieldLabel>
              <FieldContent className="flex flex-col gap-2">
                <input
                  type="hidden"
                  name="categoryMode"
                  value={isCreatingNewCategory ? "new" : "select"}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <NativeSelect
                    name="categoryId"
                    defaultValue=""
                    disabled={isCreatingNewCategory}
                  >
                    <NativeSelectOption value="">
                      카테고리 없음
                    </NativeSelectOption>
                    {categories.map((category) => (
                      <NativeSelectOption key={category.id} value={category.id}>
                        {category.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <Button
                    type="button"
                    variant="ghost"
                    size={"sm"}
                    className={"rounded-md text-xs"}
                    onClick={() => {
                      setIsCreatingNewCategory((prev) => !prev);
                      setNewCategoryName("");
                    }}
                  >
                    {isCreatingNewCategory ? "취소" : "+ 새 카테고리"}
                  </Button>
                </div>
                {isCreatingNewCategory ? (
                  <Input
                    name="categoryName"
                    type="text"
                    placeholder="새 카테고리 이름"
                    autoComplete="off"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    required
                  />
                ) : null}
                <FieldDescription>
                  기본은 기존 카테고리 선택이며, 새 카테고리 추가는 버튼을
                  눌렀을 때만 가능합니다.
                </FieldDescription>
              </FieldContent>
            </Field>

            {actionData?.formError ? (
              <div className="text-sm text-destructive" role="alert">
                {actionData.formError}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-3">
          <Input
            placeholder="검색 (title 기준, title이 없으면 url)"
            value={searchInput}
            onChange={(event) => {
              const next = event.target.value;
              setSearchInput(next);
              debouncedSetQuery(next);
            }}
            onBlur={() => debouncedSetQuery.flush()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                debouncedSetQuery.flush();
              }
            }}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              const next = value === "favorites" ? "favorites" : "all";
              const nextParams = new URLSearchParams(searchParams);
              if (next === "favorites") {
                nextParams.set("tab", "favorites");
              } else {
                nextParams.delete("tab");
              }
              setSearchParams(nextParams, { replace: true });
            }}
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="favorites">즐겨찾기</TabsTrigger>
            </TabsList>
          </Tabs>

          <NativeSelect
            aria-label="카테고리 필터"
            value={activeCategoryId ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              const nextParams = new URLSearchParams(searchParams);
              if (next) {
                nextParams.set("category", next);
              } else {
                nextParams.delete("category");
              }
              setSearchParams(nextParams, { replace: true });
            }}
          >
            <NativeSelectOption value="">전체 카테고리</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ExternalLink />
              </EmptyMedia>
              <EmptyTitle>
                {activeTab === "favorites"
                  ? "즐겨찾기한 링크가 없습니다"
                  : "저장된 링크가 없습니다"}
              </EmptyTitle>
              <EmptyDescription>
                {activeTab === "favorites"
                  ? "링크를 즐겨찾기하면 여기에 표시됩니다."
                  : "위 입력창에 URL을 추가하면 여기에 표시됩니다."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <div className="gap-3 flex flex-col">
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
