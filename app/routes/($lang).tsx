import { Outlet } from "react-router";
import { IntlayerProvider } from "react-intlayer";
import { useI18nHTMLAttributes } from "@/hooks/use-i18n-html-attributes";
import LocaleSwitcher from "@/components/locale-switcher";
import { LocalizedLink } from "@/components/localized-link";
import StartButtonGroup from "@/components/start-button-group";

export default function RootLayout() {
  useI18nHTMLAttributes();

  return (
    <IntlayerProvider>
      <main className="relative h-full max-w-7xl mx-auto bg-white">
        <Outlet />
      </main>
    </IntlayerProvider>
  );
}
