import { forwardRef, useEffect, useState } from "react";
import { Form } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

type ActionDataLike = {
  fields?: { url?: string };
  fieldErrors?: { url?: string };
  formError?: string;
};

type CategoryListItem = { id: string; name: string };

type AddLinkCardProps = {
  userId: string | undefined;
  categories: CategoryListItem[];
  actionData: ActionDataLike | undefined;
  isSubmitting: boolean;
};

export const AddLinkCard = forwardRef<HTMLFormElement, AddLinkCardProps>(
  function AddLinkCard({ userId, categories, actionData, isSubmitting }, ref) {
    const hasErrors = Boolean(
      actionData?.fieldErrors?.url || actionData?.formError
    );
    const [open, setOpen] = useState(hasErrors);
    const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
      if (hasErrors) {
        setOpen(true);
      }
    }, [hasErrors]);

    useEffect(() => {
      if (!open) {
        setIsCreatingNewCategory(false);
        setNewCategoryName("");
      }
    }, [open]);

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className="w-full" size="lg">
            Add Link
          </Button>
        </DrawerTrigger>

        <DrawerContent className="rounded-lg">
          <div className="mx-auto w-full max-w-sm py-2 lg:py-6">
            <Form ref={ref} method="post" className="flex flex-col gap-4">
              <DrawerHeader className="pb-2 md:text-left">
                <DrawerTitle className="font-medium text-xl">
                  Add Link
                </DrawerTitle>
                <DrawerDescription></DrawerDescription>
              </DrawerHeader>

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
                  <FieldDescription></FieldDescription>
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
                  <div className="flex gap-2 flex-row items-center">
                    <NativeSelect
                      name="categoryId"
                      defaultValue=""
                      disabled={isCreatingNewCategory}
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
                      onChange={(event) =>
                        setNewCategoryName(event.target.value)
                      }
                      required
                    />
                  ) : null}
                  <FieldDescription></FieldDescription>
                </FieldContent>
              </Field>

              {actionData?.formError ? (
                <div className="text-sm text-destructive" role="alert">
                  {actionData.formError}
                </div>
              ) : null}

              <DrawerFooter className="p-0 pt-2">
                <div className="flex items-center gap-2">
                  <DrawerClose asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSubmitting}
                    >
                      Close
                    </Button>
                  </DrawerClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DrawerFooter>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
);
