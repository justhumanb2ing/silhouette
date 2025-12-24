import type { Route } from "./+types/($lang)._index";
import { useIntlayer } from "react-intlayer";

import LocaleSwitcher from "@/components/locale-switcher";
import StartButtonGroup from "@/components/start-button-group";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react-router";
import {
  DoodleCurly,
  DoodleLoop,
  DoodleSquiggle,
  DoodleStar,
} from "@/components/doodles";
import { GoogleChromeLogoIcon } from "@phosphor-icons/react";
import Footer from "@/components/footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Silhouette - Save links fast, find them faster" },
    {
      name: "description",
      content:
        "Silhouette keeps saving, organizing, searching, and sharing frictionless.",
    },
  ];
}

export default function LandingRoute() {
  const {
    title,
    layout: {
      auth: { signIn, signUp },
      logo,
    },
  } = useIntlayer("landing-page");

  const { isLoaded, user, isSignedIn } = useUser();

  if (!isLoaded) return null;

  const signedInHref = isSignedIn && user?.id ? `/user/${user.id}` : null;
  const signInHref = signedInHref ?? "/sign-in";
  const signUpHref = signedInHref ?? "/sign-up";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full bg-white">
        <div className="w-full px-6 h-16 flex justify-between items-center">
          <div className="flex items-center justify-start">
            <Logo />
          </div>
          <aside className="flex items-center gap-4">
            <StartButtonGroup />
            <LocaleSwitcher />
          </aside>
        </div>
      </header>
      <section className="relative w-full flex-1 flex items-center pt-12 pb-24 md:py-0 px-6 min-h-[calc(100vh-80px)]">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-20">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#FDE68A] blur-[100px] opacity-40 mix-blend-multiply animate-blob"></div>
          <div className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] bg-[#FDBA74] blur-[100px] opacity-40 mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-[#7DD3FC] blur-[100px] opacity-40 mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 h-full">
          {/* Left Side: Title and Description */}
          <div className="w-full md:w-3/5 text-left relative">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.1] z-10 relative mb-8 font-satoshi">
              Save links fast, find them
              <br className="hidden lg:block" />
              <span className="relative inline-block text-primary">
                faster
                {/* Underline Squiggle */}
                <div className="absolute -bottom-4 left-0 w-full text-[#F472B6] -z-10">
                  <svg
                    viewBox="0 0 200 20"
                    fill="none"
                    className="w-full h-auto"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M5,15 Q50,5 100,15 T195,5"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </span>
            </h1>

            {/* Floating Elements near Title */}
            <DoodleStar className="absolute -top-12 -left-12 w-16 h-16 text-[#FBBF24] hidden md:block animate-pulse" />

            <p className="text-xl md:text-2xl text-neutral-900 max-w-xl leading-relaxed font-light font-satoshi">
              Keeps saving and searching frictionless.
            </p>

            <DoodleLoop className="absolute bottom-0 right-10 w-24 h-24 text-[#A78BFA] hidden lg:block rotate-12 opacity-50" />
          </div>

          {/* Right Side: 2 Buttons */}
          <div className="w-full md:w-2/5 flex flex-col sm:flex-row md:flex-col lg:flex-row justify-end items-center md:items-end gap-6 relative">
            <div className="absolute -top-16 right-0 md:-right-8 text-[#34D399] w-20 h-20 -rotate-12 z-0 hidden md:block">
              <DoodleCurly />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <a href={signInHref}>
                  <Button
                    size={"lg"}
                    variant={"ghost"}
                    className={"px-6 py-6 text-lg font-bold"}
                  >
                    {signIn}
                  </Button>
                </a>
                <a href={signUpHref}>
                  <Button size={"lg"} className={"px-6 py-6 text-lg font-bold"}>
                    {signUp}
                  </Button>
                </a>
              </div>

              <Button
                size={"lg"}
                className={"w-full px-6 py-6 text-lg font-bold"}
              >
                <GoogleChromeLogoIcon className="size-5" />
                Install Extension
              </Button>
            </div>

            <div className="absolute -bottom-20 -left-10 text-slate-200 w-40 h-10 rotate-3 z-0 pointer-events-none hidden md:block">
              <DoodleSquiggle />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
