import { t, type Dictionary } from "intlayer";

const settingsContent = {
  key: "settings",
  content: {
    title: t({ en: "Settings", ko: "설정" }),
    description: t({
      en: "Manage your categories and account preferences.",
      ko: "카테고리와 계정 설정을 관리합니다.",
    }),
    categories: {
      title: t({ en: "Category deletion", ko: "카테고리 삭제" }),
      description: t({
        en: "Select multiple categories to remove at once. Links will be moved to No category.",
        ko: "여러 카테고리를 선택해 한 번에 삭제할 수 있습니다. 포함된 링크는 카테고리 없음으로 이동합니다.",
      }),
      emptyTitle: t({ en: "No categories yet", ko: "카테고리가 없습니다" }),
      emptyDescription: t({
        en: "Create a category when saving a link and it will appear here.",
        ko: "링크를 저장할 때 카테고리를 만들면 여기에 표시됩니다.",
      }),
      selectAll: t({ en: "Select all", ko: "전체 선택" }),
      selectedLabel: t({ en: "Selected", ko: "선택됨" }),
      deleteTrigger: t({ en: "Delete selected", ko: "선택 삭제" }),
      deleteDialog: {
        title: t({
          en: "Delete selected categories?",
          ko: "선택한 카테고리를 삭제할까요?",
        }),
        description: t({
          en: "Links in these categories will be moved to No category.",
          ko: "해당 카테고리에 속한 링크는 카테고리 없음으로 이동합니다.",
        }),
      },
    },
    common: {
      cancel: t({ en: "Cancel", ko: "취소" }),
      delete: t({ en: "Delete", ko: "삭제" }),
      deleting: t({ en: "Deleting...", ko: "삭제 중..." }),
    },
  },
} satisfies Dictionary;

export default settingsContent;
