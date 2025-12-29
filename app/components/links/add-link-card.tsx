import { forwardRef, useEffect, useState } from "react";
import { Form } from "react-router";
import { useIntlayer } from "react-intlayer";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PlusIcon } from "@phosphor-icons/react";

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
  onCreateStart?: () => void;
};

export const AddLinkCard = forwardRef<HTMLFormElement, AddLinkCardProps>(
  function AddLinkCard(
    { userId, categories, actionData, isSubmitting, onCreateStart },
    ref
  ) {
    const {
      common,
      addLink: { trigger, title, fields, category, newCategory },
    } = useIntlayer("links");

    const hasErrors = Boolean(
      actionData?.fieldErrors?.url || actionData?.formError
    );
  const [open, setOpen] = useState(hasErrors);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (isSubmitting) {
      setOpen(false);
      return;
    }

    if (hasErrors) {
      setOpen(true);
    }
  }, [hasErrors, isSubmitting]);

    useEffect(() => {
      if (!open) {
        setIsCreatingNewCategory(false);
        setNewCategoryName("");
      }
    }, [open]);

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className={"size-10 z-50 hover:bg-primary/80"}>
            {/* {trigger} */}
            <PlusIcon />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="rounded-lg mb-8 px-4">
          <div className="mx-auto w-full max-w-lg py-2">
            <Form
              ref={ref}
              method="post"
              className="flex flex-col gap-4"
              onSubmit={() => {
                setOpen(false);
                onCreateStart?.();
              }}
            >
              <DrawerHeader className="pb-2 md:text-left">
                <DrawerTitle hidden className="font-medium text-xl">
                  {title}
                </DrawerTitle>
              </DrawerHeader>

              <Field>
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
                  <FieldError>{actionData?.fieldErrors?.url}</FieldError>
                </FieldContent>
              </Field>

              <Field>
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
                        {category.none}
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
                      className={"text-xs"}
                      onClick={() => {
                        setIsCreatingNewCategory((prev) => !prev);
                        setNewCategoryName("");
                      }}
                    >
                      {isCreatingNewCategory
                        ? newCategory.cancel
                        : newCategory.add}
                    </Button>
                  </div>
                  {isCreatingNewCategory ? (
                    <Input
                      name="categoryName"
                      type="text"
                      placeholder={newCategory.placeholder.value}
                      autoComplete="off"
                      value={newCategoryName}
                      onChange={(event) =>
                        setNewCategoryName(event.target.value)
                      }
                      required
                    />
                  ) : null}
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
                      {common.close}
                    </Button>
                  </DrawerClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? common.saving : common.save}
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
