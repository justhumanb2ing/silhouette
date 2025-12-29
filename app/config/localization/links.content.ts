import { t, type Dictionary } from "intlayer";

const linksContent = {
  key: "links",
  content: {
    common: {
      close: t({ en: "Close", ko: "닫기" }),
      cancel: t({ en: "Cancel", ko: "취소" }),
      save: t({ en: "Save", ko: "저장" }),
      saving: t({ en: "Saving...", ko: "저장 중..." }),
      delete: t({ en: "Delete", ko: "삭제" }),
      deleting: t({ en: "Deleting...", ko: "삭제 중..." }),
      loadMore: t({ en: "Load more", ko: "더보기" }),
      loadingMore: t({ en: "Loading...", ko: "불러오는 중..." }),
      tooltips: {
        addFromClipboard: t({
          en: "Add from clipboard",
          ko: "클립보드 링크 추가",
        }),
        settings: t({ en: "Settings", ko: "설정" }),
        signOut: t({ en: "Sign out", ko: "로그아웃" }),
      },
    },
    addLink: {
      trigger: t({ en: "Add link", ko: "링크 추가" }),
      title: t({ en: "Add link", ko: "링크 저장" }),
      fields: {
        urlLabel: t({ en: "URL", ko: "URL" }),
        categoryLabel: t({ en: "Category", ko: "카테고리" }),
      },
      category: {
        none: t({ en: "No category", ko: "카테고리 없음" }),
      },
      newCategory: {
        add: t({ en: "+ New category", ko: "+ 새 카테고리" }),
        cancel: t({ en: "Cancel", ko: "취소" }),
        placeholder: t({ en: "New category name", ko: "새 카테고리 이름" }),
      },
    },
    toolbar: {
      searchPlaceholder: t({
        en: "Search by title or link",
        ko: "제목 또는 링크로 검색",
      }),
      tabs: {
        all: t({ en: "All", ko: "전체" }),
        favorites: t({ en: "Favorites", ko: "즐겨찾기" }),
      },
      categoryFilterAriaLabel: t({
        en: "Category filter",
        ko: "카테고리 필터",
      }),
      allCategories: t({ en: "All categories", ko: "전체 카테고리" }),
      categoryDelete: {
        ariaLabel: t({ en: "Delete category", ko: "카테고리 삭제" }),
        title: t({ en: "Delete this category?", ko: "카테고리를 삭제할까요?" }),
        description: t({
          en: "Links in this category will be moved to No category.",
          ko: "이 카테고리에 속한 링크는 카테고리 없음으로 이동합니다.",
        }),
      },
    },
    empty: {
      title: {
        all: t({ en: "No saved links", ko: "저장된 링크가 없습니다" }),
        favorites: t({ en: "No favorite links", ko: "즐겨찾기한 링크가 없습니다" }),
      },
      description: {
        all: t({
          en: "Add a URL above and it will show up here.",
          ko: "링크를 저장하면 여기에 표시됩니다.",
        }),
        favorites: t({
          en: "Mark links as favorites and they will show up here.",
          ko: "링크를 즐겨찾기하면 여기에 표시됩니다.",
        }),
      },
    },
    item: {
      fallbackTitle: t({ en: "Link", ko: "링크" }),
      noDescription: t({ en: "No description.", ko: "설명이 없습니다." }),
      actions: {
        edit: t({ en: "Edit", ko: "수정" }),
        remove: t({ en: "Remove", ko: "삭제" }),
      },
      aria: {
        open: t({ en: "Open link", ko: "링크 열기" }),
        favoriteAdd: t({ en: "Add to favorites", ko: "즐겨찾기 추가" }),
        favoriteRemove: t({ en: "Remove from favorites", ko: "즐겨찾기 해제" }),
        edit: t({ en: "Edit link", ko: "링크 수정" }),
        delete: t({ en: "Delete link", ko: "링크 삭제" }),
      },
      editDialog: {
        title: t({ en: "Edit link", ko: "링크 수정" }),
        description: t({
          en: "Update the title, description, or category.",
          ko: "링크의 제목과 설명을 수정합니다.",
        }),
        placeholders: {
          title: t({ en: "Title", ko: "제목" }),
          description: t({ en: "Description", ko: "설명" }),
        },
      },
      deleteDialog: {
        title: t({ en: "Delete this link?", ko: "링크를 삭제할까요?" }),
        description: t({
          en: "This action cannot be undone.",
          ko: "삭제한 링크는 복구할 수 없습니다.",
        }),
      },
      category: {
        none: t({ en: "No category", ko: "카테고리 없음" }),
      },
      newCategory: {
        add: t({ en: "+ New category", ko: "+ 새 카테고리" }),
        cancel: t({ en: "Cancel", ko: "취소" }),
        placeholder: t({ en: "New category name", ko: "새 카테고리 이름" }),
      },
    },
  },
} satisfies Dictionary;

export default linksContent;
