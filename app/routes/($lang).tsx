import { Outlet } from "react-router";
import { IntlayerProvider } from "react-intlayer";
import { useI18nHTMLAttributes } from "@/hooks/use-i18n-html-attributes";

export default function RootLayout() {
  useI18nHTMLAttributes();

  return (
    <IntlayerProvider>
      <main className="relative h-full bg-white">
        <Outlet />
      </main>
    </IntlayerProvider>
  );
}
