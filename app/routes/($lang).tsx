import { Outlet } from "react-router";
import { IntlayerProvider } from "react-intlayer";
import { useI18nHTMLAttributes } from "@/hooks/use-i18n-html-attributes";
import LocaleSwitcher from "@/components/locale-switcher";
import UserButton from "@/components/user-button";

export default function RootLayout() {
  useI18nHTMLAttributes();

  return (
    <IntlayerProvider>
      <main className="relative">
        <header className="sticky top-0 z-50 w-full">
          <div className="w-full px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-anton text-xl uppercase tracking-tighter">
                로고
              </span>
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
