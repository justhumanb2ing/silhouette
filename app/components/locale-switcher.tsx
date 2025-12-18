import type { FC } from "react";

import { getLocaleName, getLocalizedUrl, getPathWithoutLocale } from "intlayer";
import { useIntlayer, useLocale } from "react-intlayer";
import { useLocation, useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LocaleSwitcher() {
  const { localeSwitcherLabel } = useIntlayer("locale-switcher");
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { availableLocales, locale, setLocale } = useLocale();

  const pathWithoutLocale = getPathWithoutLocale(pathname);

  return (
    <nav aria-label={localeSwitcherLabel} className="flex justify-end">
      <Select
        value={locale ?? null}
        onValueChange={(nextLocale) => {
          if (!nextLocale || nextLocale === locale) return;

          setLocale(nextLocale);
          navigate(getLocalizedUrl(pathWithoutLocale, nextLocale));
        }}
      >
        <SelectTrigger
          size="sm"
          aria-label={localeSwitcherLabel}
          className={"border-none bg-background hover:bg-muted rounded-md"}
        >
          <SelectValue>
            {(value) =>
              typeof value === "string"
                ? getLocaleName(value)
                : localeSwitcherLabel
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className={"p-2"}>
          {availableLocales.map((localeItem) => {
            const label = getLocaleName(localeItem);

            return (
              <SelectItem
                key={localeItem}
                value={localeItem}
                aria-label={`${localeSwitcherLabel}: ${label}`}
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </nav>
  );
}
