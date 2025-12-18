import { getAuth } from "@clerk/react-router/server";
import * as Sentry from "@sentry/react-router";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Form,
  data,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
} from "react-router";

import type { Route } from "./+types/($lang)._auth.user.$id";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import { Textarea } from "@/components/ui/textarea";

import { normalizeLinkUrl } from "../../service/links/utils/normalize-link-url";
import {
  createLinkForUser,
  type LinkListItem,
  deleteLinkForUser,
  listLinksForUser,
  setLinkFavoriteForUser,
  updateLinkMetadataForUser,
} from "../../service/links/links.server";
import { getPrisma } from "@/lib/get-prisma";

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

function LinkItemCard({ link }: { link: LinkListItem }) {
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
  const [draftDescription, setDraftDescription] = useState(link.description ?? "");

  useEffect(() => {
    if (isEditOpen) {
      setDraftTitle(link.title ?? "");
      setDraftDescription(link.description ?? "");
    }
  }, [isEditOpen, link.description, link.title]);

  useEffect(() => {
    if (updateFetcher.data?.ok) {
      setIsEditOpen(false);
    }
  }, [updateFetcher.data]);

  const isBusy =
    favoriteFetcher.state !== "idle" ||
    updateFetcher.state !== "idle" ||
    deleteFetcher.state !== "idle";

  return (
    <Card size="sm">
      <CardHeader className="gap-1">
        <CardTitle className="text-sm font-medium break-all">
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline underline-offset-4"
          >
            {link.url}
          </a>
        </CardTitle>
        <CardDescription className="font-mono">
          {new Date(link.created_at).toLocaleString()}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
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

                <updateFetcher.Form method="post" className="flex flex-col gap-3">
                  <input type="hidden" name="intent" value="update-link" />
                  <input type="hidden" name="linkId" value={link.id} />
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
                    onChange={(event) => setDraftDescription(event.target.value)}
                  />

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
                    <Button type="submit" disabled={updateFetcher.state !== "idle"}>
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
                      {deleteFetcher.state !== "idle" ? "Deleting..." : "Delete"}
                    </Button>
                  </deleteFetcher.Form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId || args.params.id !== auth.userId) {
    throw new Response("Forbidden", { status: 403 });
  }

  const prisma = await getPrisma();
  const links = await listLinksForUser(prisma, auth.userId);
  return data({ links });
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
      const result = await deleteLinkForUser(prisma, { userId: auth.userId, linkId });

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
      const result = await updateLinkMetadataForUser(prisma, {
        userId: auth.userId,
        linkId,
        title: title.value,
        description: description.value,
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
        scope.setExtra("titleLength", typeof rawTitle === "string" ? rawTitle.length : null);
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
    await createLinkForUser(prisma, {
      userId: auth.userId,
      url: normalizedUrl.url,
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
  const { links } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

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
        {links.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ExternalLink />
              </EmptyMedia>
              <EmptyTitle>저장된 링크가 없습니다</EmptyTitle>
              <EmptyDescription>
                위 입력창에 URL을 추가하면 여기에 표시됩니다.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <div className="gap-3 flex flex-col">
            {links.map((link) => (
              <LinkItemCard key={link.id} link={link} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
