import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { debounce } from "es-toolkit";

type LinkView = "all" | "favorites";

type CategoryListItem = { id: string; name: string };

export function LinksToolbar({ categories }: { categories: CategoryListItem[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const searchParamsRef = useRef(searchParams);

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

  return (
    <div className="mb-4 flex flex-col gap-3">
      <Input
        placeholder="제목 또는 링크로 검색"
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
  );
}
