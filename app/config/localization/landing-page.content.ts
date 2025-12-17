import { t, type Dictionary } from "intlayer";

const landingPageContent = {
  key: "landing-page",
  content: {
    layout: {
      auth: {
        signIn: t({
          en: "Sign in",
          ko: "로그인",
        }),
        signUp: t({
          en: "Start for free",
          ko: "무료로 시작",
        }),
      },
      logo: t({
        en: "Logo",
        ko: "로고",
      }),
    },
  },
} satisfies Dictionary;

export default landingPageContent;
