import { t, type Dictionary } from "intlayer";

const userButtonContent = {
  key: "user-button",
  content: {
    profile: t({ en: "Profile", ko: "프로필" }),
    signOut: t({ en: "Sign out", ko: "로그아웃" }),
  },
} satisfies Dictionary;

export default userButtonContent;

