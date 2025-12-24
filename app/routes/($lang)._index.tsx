import type { Route } from "./+types/($lang)._index";
import { useIntlayer } from "react-intlayer";

import LocaleSwitcher from "@/components/locale-switcher";
import StartButtonGroup from "@/components/start-button-group";
import Logo from "@/components/logo";

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
    </div>
  );
}
