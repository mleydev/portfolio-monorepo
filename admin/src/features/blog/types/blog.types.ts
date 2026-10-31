export type BlogLanguage = "fa" | "en" | "tr" | "ar";

export type BlogArticleStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface BlogTranslation {
  id?: string;
  language: BlogLanguage;
  title: string;
  slug: string;
  excerpt?: string;
  content: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export interface BlogCategoryTranslation {
  id?: string;
  language: BlogLanguage;
  name: string;
  slug: string;
  description?: string;
}

export interface BlogTagTranslation {
  id?: string;
  language: BlogLanguage;
  name: string;
  slug: string;
}

export interface BlogCategory {
  id: string;
  enabled: boolean;
  sortOrder: number;
  translations: BlogCategoryTranslation[];
}

export interface BlogTag {
  id: string;
  enabled: boolean;
  translations: BlogTagTranslation[];
}

export interface BlogMedia {
  id: string;
  url: string;
  filename?: string;
  alt?: string;
  type?: string;
}

export interface BlogArticleCategory {
  category: BlogCategory;
}

export interface BlogArticleTag {
  tag: BlogTag;
}

export interface BlogArticle {
  id: string;
  status: BlogArticleStatus;
  featured: boolean;
  allowComments: boolean;
  coverMediaId?: string | null;
  coverMedia?: BlogMedia | null;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  translations: BlogTranslation[];
  categories: BlogArticleCategory[];
  tags: BlogArticleTag[];
}

export interface CreateBlogArticlePayload {
  status?: BlogArticleStatus;
  featured?: boolean;
  allowComments?: boolean;
  coverMediaId?: string;
  publishedAt?: string;
  scheduledAt?: string;
  translations: BlogTranslation[];
  categoryIds?: string[];
  tagIds?: string[];
}

export type UpdateBlogArticlePayload = Partial<CreateBlogArticlePayload>;

export interface BlogCategoryPayload {
  enabled?: boolean;
  sortOrder?: number;
  translations: BlogCategoryTranslation[];
}

export interface BlogTagPayload {
  enabled?: boolean;
  translations: BlogTagTranslation[];
}

export interface BlogFilters {
  search: string;
  status: BlogArticleStatus | "ALL";
  language: BlogLanguage | "ALL";
  featured: "ALL" | "FEATURED" | "REGULAR";
}
