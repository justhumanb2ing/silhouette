import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useIntlayer } from "react-intlayer";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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
import { Badge } from "../ui/badge";
import { ArrowSquareOutIcon, HeartIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type IntentResult = { ok: true } | { ok: false; message: string };

type CategoryListItem = { id: string; name: string };

function getUrlHostname(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
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
  const { common, item } = useIntlayer("links");
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

  const displayTitle = link.title?.trim()
    ? link.title
    : (getUrlHostname(link.url) ?? item.fallbackTitle);
  const displayDescription = link.description?.trim()
    ? link.description
    : item.noDescription;

  return (
    <Item
      size="sm"
      className="ring-0 flex flex-col items-stretch gap-2 overflow-hidden p-1 rounded-none"
    >
      <ItemMedia className="relative w-full">
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-block w-full overflow-hidden"
          aria-label={item.aria.open.value}
        >
          {link.image_url ? (
            <img
              src={link.image_url}
              alt={link.title ?? link.url}
              loading="lazy"
              decoding="async"
              className="h-40 w-full object-cover hover:scale-110 transition-all duration-500"
            />
          ) : (
            <div className="bg-muted/60 text-muted-foreground flex h-40 w-full items-center justify-center">
              <ArrowSquareOutIcon size={28} />
            </div>
          )}
        </a>
        <aside className="absolute right-2 top-2">
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
              className="size-8 bg-black/55 backdrop-blur-sm hover:bg-black/65 border-none rounded-full"
              disabled={isBusy}
              aria-label={
                optimisticIsFavorite
                  ? item.aria.favoriteRemove.value
                  : item.aria.favoriteAdd.value
              }
            >
              <HeartIcon
                size={56}
                weight={optimisticIsFavorite ? "fill" : "regular"}
                className={cn(
                  "text-lg",
                  optimisticIsFavorite
                    ? "text-red-500 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                    : "text-muted drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                )}
              />
            </Button>
          </favoriteFetcher.Form>
        </aside>
      </ItemMedia>
      <ItemContent className="relative">
        <ItemTitle className="line-clamp-2 wrap-break-word font-medium text-sm leading-snug">
          {displayTitle}
        </ItemTitle>
        <ItemDescription className="text-muted-foreground line-clamp-3 wrap-break-word text-sm leading-snug">
          {displayDescription}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="justify-between">
        {categoryName ? (
          <Badge variant={"secondary"}>{categoryName}</Badge>
        ) : null}
        <aside className="flex-1 flex items-center justify-end gap-1">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size={"sm"}
                  disabled={isBusy}
                  aria-label={item.aria.edit.value}
                  className={"text-muted-foreground"}
                >
                  {item.actions.edit}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{item.editDialog.title}</DialogTitle>
                <DialogDescription>
                  {item.editDialog.description}
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
                  placeholder={item.editDialog.placeholders.title.value}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
                <Textarea
                  name="description"
                  placeholder={item.editDialog.placeholders.description.value}
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  className="resize-none min-h-24 max-h-60"
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <NativeSelect
                    name="categoryId"
                    value={draftCategoryId}
                    disabled={isNewCategoryMode}
                    onChange={(event) => setDraftCategoryId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      {item.category.none}
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
                    {isNewCategoryMode
                      ? item.newCategory.cancel
                      : item.newCategory.add}
                  </Button>
                </div>

                {isNewCategoryMode ? (
                  <Input
                    name="categoryName"
                    type="text"
                    placeholder={item.newCategory.placeholder.value}
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
                    {common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateFetcher.state !== "idle"}
                  >
                    {updateFetcher.state !== "idle"
                      ? common.saving
                      : common.save}
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
                  size="sm"
                  disabled={isBusy}
                  aria-label={item.aria.delete.value}
                >
                  {item.actions.remove}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{item.deleteDialog.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {item.deleteDialog.description}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {deleteFetcher.data && !deleteFetcher.data.ok ? (
                <div className="text-sm text-destructive" role="alert">
                  {deleteFetcher.data.message}
                </div>
              ) : null}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteFetcher.state !== "idle"}>
                  {common.cancel}
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
                      ? common.deleting
                      : common.delete}
                  </Button>
                </deleteFetcher.Form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </aside>
      </ItemActions>
    </Item>
  );
}
