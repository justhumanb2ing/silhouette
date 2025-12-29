import { getAuth } from "@clerk/react-router/server";
import { useEffect, useMemo, useState } from "react";
import {
  data,
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "react-router";
import { useIntlayer } from "react-intlayer";

import type { Route } from "./+types/($lang)._auth.user.$id.settings";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";

import { getPrisma } from "@/lib/get-prisma";

import { handleDeleteCategories } from "../../service/categories/actions/delete-categories.server";
import { listCategoriesForUser } from "../../service/categories/categories.server";

type IntentResult =
  | { ok: true; deletedCount: number }
  | { ok: false; message: string };

type CategoryListItem = { id: string; name: string };

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId || args.params.id !== auth.userId) {
    throw new Response("Forbidden", { status: 403 });
  }

  const prisma = await getPrisma();
  const categories = await listCategoriesForUser(prisma, auth.userId);
  return data({ categories });
}

export async function action(args: Route.ActionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (args.params.id !== auth.userId) {
    return data<IntentResult>({ ok: false, message: "권한이 없습니다." }, { status: 403 });
  }

  const formData = await args.request.formData();
  const intent = formData.get("intent");

  if (intent === "delete-categories") {
    return handleDeleteCategories({ auth, formData });
  }

  return data<IntentResult>(
    { ok: false, message: "요청이 올바르지 않습니다." },
    { status: 400 }
  );
}

export default function UserSettingsRoute() {
  const { categories } = useLoaderData<typeof loader>();
  const { title, description, categories: categoryCopy, common } =
    useIntlayer("settings");
  const deleteFetcher = useFetcher<IntentResult>();
  const revalidator = useRevalidator();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const categoryIds = useMemo(
    () => categories.map((category) => category.id),
    [categories]
  );
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const totalCategories = categories.length;
  const hasSelection = selectedIds.length > 0;
  const isAllSelected =
    totalCategories > 0 && selectedIds.length === totalCategories;
  const isPartiallySelected =
    selectedIds.length > 0 && selectedIds.length < totalCategories;
  const isDeleting = deleteFetcher.state !== "idle";
  const isDeleteSuccess =
    deleteFetcher.state === "idle" && deleteFetcher.data?.ok === true;

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => categories.some((category) => category.id === id))
    );
  }, [categories]);

  useEffect(() => {
    if (!isDeleteSuccess) return;
    setIsDeleteDialogOpen(false);
    setSelectedIds([]);
    revalidator.revalidate();
  }, [isDeleteSuccess, revalidator]);

  useEffect(() => {
    if (hasSelection || !isDeleteDialogOpen) return;
    setIsDeleteDialogOpen(false);
  }, [hasSelection, isDeleteDialogOpen]);

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }
      return Array.from(next);
    });
  };

  const toggleAllCategories = (checked: boolean) => {
    setSelectedIds(checked ? categoryIds : []);
  };

  return (
    <section className="w-full max-w-4xl px-6 py-6">
      <header className="mb-6 space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{categoryCopy.title}</CardTitle>
          <CardDescription>{categoryCopy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{categoryCopy.emptyTitle}</EmptyTitle>
                <EmptyDescription>{categoryCopy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <Label className="gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isPartiallySelected}
                    disabled={isDeleting}
                    onCheckedChange={(value) => {
                      toggleAllCategories(value === true);
                    }}
                  />
                  <span className="text-sm">{categoryCopy.selectAll}</span>
                </Label>
              </div>
              {categories.map((category: CategoryListItem) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between pb-2"
                >
                  <Label className="gap-2">
                    <Checkbox
                      checked={selectedIdsSet.has(category.id)}
                      disabled={isDeleting}
                      onCheckedChange={(value) => {
                        toggleCategory(category.id, value === true);
                      }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {categoryCopy.selectedLabel} {selectedIds.length}
          </div>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!hasSelection || isDeleting}
                >
                  {categoryCopy.deleteTrigger}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{categoryCopy.deleteDialog.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {categoryCopy.deleteDialog.description}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {deleteFetcher.data && !deleteFetcher.data.ok ? (
                <div className="text-sm text-destructive" role="alert">
                  {deleteFetcher.data.message}
                </div>
              ) : null}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  {common.cancel}
                </AlertDialogCancel>
                <deleteFetcher.Form method="post">
                  <input type="hidden" name="intent" value="delete-categories" />
                  {selectedIds.map((categoryId) => (
                    <input
                      key={categoryId}
                      type="hidden"
                      name="categoryIds"
                      value={categoryId}
                    />
                  ))}
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={!hasSelection || isDeleting}
                  >
                    {isDeleting ? common.deleting : common.delete}
                  </Button>
                </deleteFetcher.Form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </section>
  );
}
