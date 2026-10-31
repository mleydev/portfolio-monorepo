import type {
  BlogArticle,
  BlogArticleStatus,
  BlogLanguage,
} from "../types/blog.types";

export const BLOG_LANGUAGES: {
  value: BlogLanguage;
  label: string;
  nativeLabel: string;
}[] = [
  { value: "fa", label: "Persian", nativeLabel: "فارسی" },
  { value: "en", label: "English", nativeLabel: "انگلیسی" },
  { value: "tr", label: "Turkish", nativeLabel: "ترکی" },
  { value: "ar", label: "Arabic", nativeLabel: "عربی" },
];

export const BLOG_STATUSES: {
  value: BlogArticleStatus;
  label: string;
}[] = [
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "SCHEDULED", label: "زمان‌بندی‌شده" },
  { value: "PUBLISHED", label: "منتشرشده" },
  { value: "ARCHIVED", label: "بایگانی‌شده" },
];

export const getArticleTranslation = (
  article: BlogArticle,
  language: BlogLanguage = "fa",
) => {
  return (
    article.translations.find(
      (translation) => translation.language === language,
    ) ?? article.translations[0]
  );
};

export const getArticleTitle = (article: BlogArticle) => {
  return getArticleTranslation(article)?.title || "بدون عنوان";
};

export const getArticleExcerpt = (article: BlogArticle) => {
  return getArticleTranslation(article)?.excerpt || "بدون توضیحات";
};

export const getStatusLabel = (status: BlogArticleStatus) => {
  return BLOG_STATUSES.find((item) => item.value === status)?.label ?? status;
};

export const formatBlogDate = (date?: string | null) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export const filterBlogArticles = (
  articles: BlogArticle[],
  filters: {
    search: string;
    status: BlogArticleStatus | "ALL";
    language: BlogLanguage | "ALL";
    featured: "ALL" | "FEATURED" | "REGULAR";
  },
) => {
  const search = filters.search.trim().toLocaleLowerCase();

  return articles.filter((article) => {
    const matchesStatus =
      filters.status === "ALL" || article.status === filters.status;

    const matchesFeatured =
      filters.featured === "ALL" ||
      (filters.featured === "FEATURED" ? article.featured : !article.featured);

    const matchesLanguage =
      filters.language === "ALL" ||
      article.translations.some(
        (translation) => translation.language === filters.language,
      );

    const matchesSearch =
      !search ||
      article.translations.some(
        (translation) =>
          translation.title.toLocaleLowerCase().includes(search) ||
          translation.slug.toLocaleLowerCase().includes(search) ||
          translation.excerpt?.toLocaleLowerCase().includes(search),
      );

    return matchesStatus && matchesFeatured && matchesLanguage && matchesSearch;
  });
};
