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
        en: "Silhouette",
        ko: "Silhouette",
      }),
    },
    title: t({
      en: "Save links fast, find them faster",
      ko: "링크를 빠르게 저장하고 더 빠르게 찾으세요",
    }),
    description: t({
      en: "Keeps saving and searching frictionless.",
      ko: "저장·검색을 부드럽게 이어가세요.",
    }),
    aboutLink: t({
      en: "Product overview",
      ko: "제품 한눈에 보기",
    }),
    hero: {
      subtitle: t({
        en: "Save any link in seconds, keep it organized, and share the essentials with teammates.",
        ko: "몇 초 만에 링크를 저장하고 깔끔하게 정리해 필요한 것만 팀과 공유하세요.",
      }),
      primaryCta: t({
        en: "Start for free",
        ko: "무료로 시작하기",
      }),
      secondaryCta: t({
        en: "See how it works",
        ko: "어떻게 동작하는지 보기",
      }),
    },
    features: {
      title: t({
        en: "Core flows that stay simple",
        ko: "심플함을 유지하는 핵심 플로우",
      }),
      list: [
        {
          title: t({ en: "Save & edit", ko: "저장과 편집" }),
          desc: t({
            en: "Add links with title/URL in seconds, update or delete with one action.",
            ko: "제목·URL만으로 바로 저장하고, 수정·삭제도 한 번에 처리하세요.",
          }),
        },
        {
          title: t({ en: "Categories & favorites", ko: "카테고리와 즐겨찾기" }),
          desc: t({
            en: "Group links by category, mark favorites, and keep your top picks close.",
            ko: "카테고리로 묶고 즐겨찾기로 표시해 중요한 링크를 가까이에 두세요.",
          }),
        },
        {
          title: t({ en: "Fast search", ko: "빠른 검색" }),
          desc: t({
            en: "Search titles, URLs, and notes instantly with debounce for smooth typing.",
            ko: "제목·URL·메모를 지연 없이 검색하고, 디바운스로 타이핑을 부드럽게 유지합니다.",
          }),
        },
        {
          title: t({ en: "Preview & notes", ko: "미리보기와 메모" }),
          desc: t({
            en: "Get quick previews and attach concise notes to remember why it matters.",
            ko: "미리보기로 내용을 훑고, 짧은 메모로 왜 중요한지 기억하세요.",
          }),
        },
        {
          title: t({ en: "Share & export", ko: "공유와 내보내기" }),
          desc: t({
            en: "Create read-only share links, and import/export when you need to move fast.",
            ko: "읽기 전용 공유 링크를 만들고, 가져오기/내보내기로 빠르게 옮겨보세요.",
          }),
        },
      ]
    },
    workflow: {
      title: t({
        en: "From save to share in four steps",
        ko: "저장에서 공유까지 4단계",
      }),
      steps: [
        t({ en: "Drop a link with title", ko: "제목과 함께 링크를 추가" }),
        t({ en: "Auto preview & note", ko: "자동 미리보기 확인, 메모 작성" }),
        t({ en: "Category + favorite", ko: "카테고리 지정 및 즐겨찾기" }),
        t({ en: "Search or share instantly", ko: "즉시 검색하거나 공유" }),
      ],
    },
    usage: {
      title: t({
        en: "Use Silhouette your way",
        ko: "Silhouette를 이렇게 사용하세요",
      }),
      list: [
        {
          title: t({
            en: "Web app + Chrome extension",
            ko: "웹 앱 + 크롬 확장",
          }),
          desc: t({
            en: "Save from any tab with the extension and manage everything in the web app.",
            ko: "크롬 확장으로 어떤 탭에서도 저장하고, 웹 앱에서 모두 관리하세요.",
          }),
        },
        {
          title: t({
            en: "Browser PWA",
            ko: "브라우저 PWA",
          }),
          desc: t({
            en: "Install Silhouette as a PWA and keep your links a tap away on desktop and mobile.",
            ko: "Silhouette를 PWA로 설치해 데스크톱과 모바일에서 한 번의 탭으로 열어보세요.",
          }),
        },
      ],
    },
    footer: {
      copyright: t({
        en: "© 2025 Silhouette. Save simply, find instantly.",
        ko: "© 2025 Silhouette. 단순하게 저장하고, 즉시 찾으세요.",
      }),
    }
  },
} satisfies Dictionary;

export default landingPageContent;
