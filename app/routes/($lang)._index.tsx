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

  return <div className="min-h-screen"></div>;
}
