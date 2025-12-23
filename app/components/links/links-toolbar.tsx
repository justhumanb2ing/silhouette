import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const LINK_VIEW = {
  all: "all",
  favorites: "favorites",
} as const;

const SEARCH_KEYS = {
  query: "q",
  tab: "tab",
  category: "category",
} as const;

type LinkView = (typeof LINK_VIEW)[keyof typeof LINK_VIEW];

type CategoryListItem = { id: string; name: string };

type IntentResult = { ok: true } | { ok: false; message: string };

export function LinksToolbar({
  categories,
}: {
  categories: CategoryListItem[];
}) {
  const { common, toolbar } = useIntlayer("links");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryValue = searchParams.get(SEARCH_KEYS.query) ?? "";
  const [searchInput, setSearchInput] = useState(queryValue);
  const [isSearchDirty, setIsSearchDirty] = useState(false);
  const deleteFetcher = useFetcher<IntentResult>();
  const revalidator = useRevalidator();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<
    string | null
  >(null);

  const activeTab: LinkView =
    searchParams.get(SEARCH_KEYS.tab) === LINK_VIEW.favorites
      ? LINK_VIEW.favorites
      : LINK_VIEW.all;
  const activeCategoryId = searchParams.get(SEARCH_KEYS.category);

  const updateSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      setSearchParams((prev) => {
        const nextParams = new URLSearchParams(prev);
        updater(nextParams);
        return nextParams;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const applySearchQuery = useCallback(
    (nextValue: string) => {
      updateSearchParams((params) => {
        const trimmed = nextValue.trim();
        if (trimmed) {
          params.set(SEARCH_KEYS.query, trimmed);
        } else {
          params.delete(SEARCH_KEYS.query);
        }
      });
    },
    [updateSearchParams]
  );

  const setActiveTab = useCallback(
    (nextTab: LinkView) => {
      updateSearchParams((params) => {
        if (nextTab === LINK_VIEW.favorites) {
          params.set(SEARCH_KEYS.tab, LINK_VIEW.favorites);
        } else {
          params.delete(SEARCH_KEYS.tab);
        }
      });
    },
    [updateSearchParams]
  );

  const setActiveCategoryId = useCallback(
    (nextCategoryId: string | null) => {
      updateSearchParams((params) => {
        if (nextCategoryId) {
          params.set(SEARCH_KEYS.category, nextCategoryId);
        } else {
          params.delete(SEARCH_KEYS.category);
        }
      });
    },
    [updateSearchParams]
  );

  const debouncedApplySearchQuery = useMemo(
    () => debounce(applySearchQuery, 250),
    [applySearchQuery]
  );

  useEffect(() => {
    setSearchInput(queryValue);
    setIsSearchDirty(false);
  }, [queryValue]);

  useEffect(() => {
    if (!isSearchDirty) return;
    debouncedApplySearchQuery(searchInput);
    return () => {
      debouncedApplySearchQuery.cancel();
    };
  }, [debouncedApplySearchQuery, isSearchDirty, searchInput]);

  const isDeletingCategory = deleteFetcher.state !== "idle";
  const canDeleteCategory = Boolean(activeCategoryId);
  const isDeleteSuccess =
    deleteFetcher.state === "idle" && deleteFetcher.data?.ok === true;

  useEffect(() => {
    if (!isDeleteSuccess) return;
    if (!pendingDeleteCategoryId) return;

    setIsDeleteDialogOpen(false);
    revalidator.revalidate();

    if (activeCategoryId === pendingDeleteCategoryId) {
      setActiveCategoryId(null);
    }
    setPendingDeleteCategoryId(null);
  }, [
    activeCategoryId,
    isDeleteSuccess,
    pendingDeleteCategoryId,
    revalidator,
    setActiveCategoryId,
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
            size={"lg"}
            variant={!activeCategoryId ? "secondary" : "ghost"}
            className={"text-sm"}
            aria-pressed={!activeCategoryId}
            onClick={() => {
              setActiveCategoryId(null);
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
                size={"lg"}
                variant={isActive ? "secondary" : "ghost"}
                className={"text-sm"}
                aria-pressed={isActive}
                onClick={() => {
                  setActiveCategoryId(category.id);
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
                  setPendingDeleteCategoryId(activeCategoryId ?? null);
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
          setSearchInput(event.target.value);
          setIsSearchDirty(true);
        }}
        onBlur={() => {
          debouncedApplySearchQuery.flush();
          setIsSearchDirty(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            debouncedApplySearchQuery.flush();
            setIsSearchDirty(false);
          }
        }}
      />

      <div className="flex gap-3 flex-row items-center">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const next =
              value === LINK_VIEW.favorites ? LINK_VIEW.favorites : LINK_VIEW.all;
            setActiveTab(next);
          }}
        >
          <TabsList>
            <TabsTrigger value={LINK_VIEW.all}>{toolbar.tabs.all}</TabsTrigger>
            <TabsTrigger value={LINK_VIEW.favorites}>
              {toolbar.tabs.favorites}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
