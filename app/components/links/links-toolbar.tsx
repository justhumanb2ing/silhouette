import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useIntlayer } from "react-intlayer";

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

export function LinksToolbar({
  categories,
}: {
  categories: CategoryListItem[];
}) {
  const { toolbar } = useIntlayer("links");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryValue = searchParams.get(SEARCH_KEYS.query) ?? "";
  const [searchInput, setSearchInput] = useState(queryValue);
  const [isSearchDirty, setIsSearchDirty] = useState(false);

  const activeTab: LinkView =
    searchParams.get(SEARCH_KEYS.tab) === LINK_VIEW.favorites
      ? LINK_VIEW.favorites
      : LINK_VIEW.all;
  const activeCategoryId = searchParams.get(SEARCH_KEYS.category);

  const updateSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          updater(nextParams);
          return nextParams;
        },
        { replace: true }
      );
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
      </div>

      <div className="flex items-center gap-4 flex-row-reverse">
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
                value === LINK_VIEW.favorites
                  ? LINK_VIEW.favorites
                  : LINK_VIEW.all;
              setActiveTab(next);
            }}
          >
            <TabsList>
              <TabsTrigger value={LINK_VIEW.all}>
                {toolbar.tabs.all}
              </TabsTrigger>
              <TabsTrigger value={LINK_VIEW.favorites}>
                {toolbar.tabs.favorites}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
