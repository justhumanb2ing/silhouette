import { t, type Dictionary } from "intlayer";

const localeSwitcherContent = {
  key: "locale-switcher",
  content: {
    localeSwitcherLabel: t({
      en: "Language",
      ko: "언어",
    }),
  },
} satisfies Dictionary;

export default localeSwitcherContent;
