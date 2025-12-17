import type { Route } from "./+types/($lang)._index";
import { useIntlayer } from "react-intlayer";

import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/react-router";

import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { prisma } from "@/config/supabase/db";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const tasks = await prisma.tasks.findMany();
  return tasks;
}

export default function LandingRoute({ loaderData }: Route.ComponentProps) {
  console.log(loaderData);
  const {
    layout: {
      auth: { signIn, signUp },
      logo,
    },
  } = useIntlayer("landing-page");

  return (
    <main className="h-full px-12">
      <header className="flex justify-between items-center py-4">
        <Logo />
        {/* Show the sign-in button when the user is signed out */}
        <SignedOut>
          <aside className="flex items-center gap-4 font-black">
            <Button
              variant={"ghost"}
              render={
                <SignInButton>
                  <span>{signIn}</span>
                </SignInButton>
              }
            />
            <Button
              render={
                <SignUpButton>
                  <span>{signUp}</span>
                </SignUpButton>
              }
            />
          </aside>
        </SignedOut>
        {/* Show the user button when the user is signed in */}
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main>LandingRoute</main>
    </main>
  );
}
