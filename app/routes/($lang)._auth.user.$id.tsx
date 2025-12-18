import { getAuth } from "@clerk/react-router/server";
import * as Sentry from "@sentry/react-router";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  Form,
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from "react-router";

import type { Route } from "./+types/($lang)._auth.user.$id";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import { normalizeLinkUrl } from "../../service/links/utils/normalize-link-url";
import {
  createLinkForUser,
  listLinksForUser,
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
              <Card key={link.id} size="sm">
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
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
