import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
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
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import type { LinkListItem } from "../../../service/links/links.server";

type IntentResult = { ok: true } | { ok: false; message: string };

type CategoryListItem = { id: string; name: string };

function getUrlLabel(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "링크";
  }
}

export function LinkItemCard({
  link,
  categories,
  categoryName,
}: {
  link: LinkListItem;
  categories: CategoryListItem[];
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

  const displayTitle = link.title?.trim() ? link.title : getUrlLabel(link.url);
  const displayDescription = link.description?.trim()
    ? link.description
    : "설명이 없습니다.";

  return (
    <Item
      size="sm"
      className="ring-0 flex flex-col items-stretch gap-2 overflow-hidden p-1"
    >
      <div className="relative">
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl"
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

              <updateFetcher.Form method="post" className="flex flex-col gap-3">
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
                  onChange={(event) => setDraftDescription(event.target.value)}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <NativeSelect
                    name="categoryId"
                    value={draftCategoryId}
                    disabled={isNewCategoryMode}
                    onChange={(event) => setDraftCategoryId(event.target.value)}
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
      </div>

      <div className="flex grow flex-col gap-1">
        <div className="line-clamp-2 break-words font-medium leading-snug">
          {displayTitle}
        </div>
        <div className="text-muted-foreground line-clamp-3 break-words text-sm leading-snug">
          {displayDescription}
        </div>
      </div>

      {categoryName ? (
        <div className="text-muted-foreground mt-auto text-xs">
          {categoryName}
        </div>
      ) : null}
    </Item>
  );
}
