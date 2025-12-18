import type { Route } from "./+types/($lang)._index";
import { useIntlayer } from "react-intlayer";

import LocaleSwitcher from "@/components/locale-switcher";
import UserButton from "@/components/user-button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Silhouette - Industrial Archive" },
    {
      name: "description",
      content: "Capture and organize your digital world.",
    },
  ];
}

export default function LandingRoute() {
  const {
    layout: {
      auth: { signIn, signUp },
      logo,
    },
    hero: { subtitle, primaryCta, secondaryCta },
    features,
    footer,
  } = useIntlayer("landing-page");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full">
        <div className="w-full px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-anton text-xl uppercase tracking-tighter">
              {logo}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <UserButton />
          </div>
        </div>
      </header>
    </div>
  );
}
