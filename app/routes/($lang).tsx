import { Outlet } from "react-router";
import { IntlayerProvider } from "react-intlayer";
import { useI18nHTMLAttributes } from "@/hooks/use-i18n-html-attributes";
import LocaleSwitcher from "@/components/locale-switcher";
import UserButton from "@/components/user-button";
import { LocalizedLink } from "@/components/localized-link";

export default function RootLayout() {
  useI18nHTMLAttributes();

  return (
    <IntlayerProvider>
      <main className="relative h-full max-w-7xl mx-auto bg-white">
        <header className="sticky top-0 z-50 w-full bg-white">
          <div className="w-full px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LocalizedLink
                to={"/"}
                className="font-anton text-xl uppercase tracking-tighter"
              >
                로고
              </LocalizedLink>
            </div>

            <div className="flex items-center gap-4">
              <LocaleSwitcher />
            </div>
          </div>
        </header>
        <Outlet />
        <UserButton />
      </main>
    </IntlayerProvider>
  );
}
