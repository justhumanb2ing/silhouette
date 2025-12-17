import type { FC } from "react";

import { getLocaleName, getLocalizedUrl, getPathWithoutLocale } from "intlayer";
import { useIntlayer, useLocale } from "react-intlayer";
import { useLocation, useNavigate } from "react-router";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const LocaleSwitcher: FC = () => {
  const { localeSwitcherLabel } = useIntlayer("locale-switcher");
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { availableLocales, locale, setLocale } = useLocale();

  const pathWithoutLocale = getPathWithoutLocale(pathname);

  return (
    <nav
      aria-label={localeSwitcherLabel.value}
      className="flex justify-end px-4 py-3 mb-4"
    >
      <ToggleGroup
        aria-label={localeSwitcherLabel.value}
        multiple={false}
        value={[locale]}
        variant="outline"
        size="sm"
        spacing={0}
        onValueChange={(groupValue) => {
          const nextLocale = groupValue[0] as string | undefined;
          if (!nextLocale || nextLocale === locale) return;

          setLocale(nextLocale);
          navigate(getLocalizedUrl(pathWithoutLocale, nextLocale));
        }}
      >
        {availableLocales.map((localeItem) => {
          const label = getLocaleName(localeItem);

          return (
            <ToggleGroupItem
              key={localeItem}
              value={localeItem}
              aria-label={`${localeSwitcherLabel.value}: ${label}`}
            >
              {label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </nav>
  );
};
