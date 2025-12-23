import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useRevalidator, useSearchParams } from "react-router";
import { useIntlayer } from "react-intlayer";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { debounce } from "es-toolkit";

type LinkView = "all" | "favorites";

type CategoryListItem = { id: string; name: string };

type IntentResult = { ok: true } | { ok: false; message: string };

export function LinksToolbar({
  categories,
}: {
  categories: CategoryListItem[];
}) {
  const { common, toolbar } = useIntlayer("links");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const searchParamsRef = useRef(searchParams);
  const deleteFetcher = useFetcher<IntentResult>();
  const revalidator = useRevalidator();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const lastDeleteCategoryIdRef = useRef<string | null>(null);
  const handledDeleteCategoryIdRef = useRef<string | null>(null);

  const activeTab: LinkView =
    searchParams.get("tab") === "favorites" ? "favorites" : "all";
  const activeCategoryId = searchParams.get("category");

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
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  const isDeletingCategory = deleteFetcher.state !== "idle";
  const canDeleteCategory = Boolean(activeCategoryId);

  useEffect(() => {
    if (deleteFetcher.state !== "idle") return;
    if (!deleteFetcher.data?.ok) return;
    const deletedCategoryId = lastDeleteCategoryIdRef.current;
    if (!deletedCategoryId) return;
    if (handledDeleteCategoryIdRef.current === deletedCategoryId) {
      return;
    }

    handledDeleteCategoryIdRef.current = deletedCategoryId;
    setIsDeleteDialogOpen(false);
    revalidator.revalidate();

    const nextParams = new URLSearchParams(searchParams);
    if (nextParams.get("category") !== deletedCategoryId) {
      return;
    }

    nextParams.delete("category");
    setSearchParams(nextParams, { replace: true });
  }, [
    deleteFetcher.data,
    deleteFetcher.state,
    revalidator,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!activeCategoryId && isDeleteDialogOpen) {
      setIsDeleteDialogOpen(false);
    }
  }, [activeCategoryId, isDeleteDialogOpen]);

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label={toolbar.categoryFilterAriaLabel.value}
        >
          <Button
            type="button"
            size="sm"
            variant={!activeCategoryId ? "secondary" : "ghost"}
            aria-pressed={!activeCategoryId}
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete("category");
              setSearchParams(nextParams, { replace: true });
            }}
          >
            {toolbar.allCategories}
          </Button>
          {categories.map((category) => {
            const isActive = activeCategoryId === category.id;
            return (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
                aria-pressed={isActive}
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("category", category.id);
                  setSearchParams(nextParams, { replace: true });
                }}
              >
                {category.name}
              </Button>
            );
          })}
        </div>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ml-auto"
                disabled={!canDeleteCategory || isDeletingCategory}
                aria-label={toolbar.categoryDelete.ariaLabel.value}
              >
                <Trash2 className="text-destructive" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {toolbar.categoryDelete.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {toolbar.categoryDelete.description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteFetcher.data && !deleteFetcher.data.ok ? (
              <div className="text-sm text-destructive" role="alert">
                {deleteFetcher.data.message}
              </div>
            ) : null}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingCategory}>
                {common.cancel}
              </AlertDialogCancel>
              <deleteFetcher.Form
                method="post"
                onSubmit={() => {
                  lastDeleteCategoryIdRef.current = activeCategoryId ?? null;
                }}
              >
                <input type="hidden" name="intent" value="delete-category" />
                <input
                  type="hidden"
                  name="categoryId"
                  value={activeCategoryId ?? ""}
                />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!canDeleteCategory || isDeletingCategory}
                >
                  {isDeletingCategory ? common.deleting : common.delete}
                </Button>
              </deleteFetcher.Form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Input
        placeholder={toolbar.searchPlaceholder.value}
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

      <div className="flex gap-3 flex-row items-center">
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
            <TabsTrigger value="all">{toolbar.tabs.all}</TabsTrigger>
            <TabsTrigger value="favorites">
              {toolbar.tabs.favorites}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
