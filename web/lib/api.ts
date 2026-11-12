const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

export interface HomeSectionTranslation {
  id: string;
  sectionId: string;
  language: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: unknown;
}

export interface HomeSection {
  id: string;
  key: string;
  type: string;
  enabled: boolean;
  sortOrder: number;
  settings: Record<string, unknown> | null;
  translations: HomeSectionTranslation[];
}

export interface CollectionResponse<T> {
  value: T[];
  Count: number;
}

// Defines the translated content of a portfolio project.
export interface ProjectTranslation {
  id: string;
  language: string;
  title: string;
  summary: string | null;
  description: string;
  content: string | null;
  role: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Defines a published portfolio project returned by the API.
export interface Project {
  id: string;
  slug: string;
  coverImage: string | null;
  demoUrl: string | null;
  repositoryUrl: string | null;
  technologies: string[];
  featured: boolean;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  translations: ProjectTranslation[];
}

// Defines the paginated projects API response.
export interface ProjectsResponse {
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SiteSettings {
  site: {
    title: string;
    description: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  footer: {
    copyright: string;
    description: string;
  };
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string | null;
  sortOrder: number;
}

// Defines a translated skill.
export interface SkillTranslation {
  id: string;
  skillId: string;
  language: string;
  title: string;
  description: string | null;
}

// Defines a technical skill returned by the API.
export interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  level: number;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
  translations: SkillTranslation[];
}

// Defines a translated language skill.
export interface LanguageSkillTranslation {
  id: string;
  languageSkillId: string;
  language: string;
  title: string;
  description: string | null;
}

// Defines a spoken language and its proficiency.
export interface LanguageSkill {
  id: string;
  name: string;
  level: string;
  proficiency: number;
  enabled: boolean;
  sortOrder: number;
  translations: LanguageSkillTranslation[];
}
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} (${endpoint})`,
    );
  }

  return response.json() as Promise<T>;
}

// Fetches technical skills in the requested language.
export async function getSkills(language = "fa"): Promise<Skill[]> {
  return fetchApi<Skill[]>(`/skills?lang=${encodeURIComponent(language)}`);
}

// Fetches spoken language skills in the requested language.
export async function getLanguageSkills(
  language = "fa",
): Promise<LanguageSkill[]> {
  return fetchApi<LanguageSkill[]>(
    `/language-skills?lang=${encodeURIComponent(language)}`,
  );
}
export async function getHomeSections(language = "fa"): Promise<HomeSection[]> {
  // Fetches homepage sections as a direct array from the API.
  return fetchApi<HomeSection[]>(
    `/site/home-sections?lang=${encodeURIComponent(language)}`,
  );
}
export async function getSiteSettings(language = "fa"): Promise<SiteSettings> {
  return fetchApi<SiteSettings>(
    `/site/settings?lang=${encodeURIComponent(language)}`,
  );
}

// Fetches and validates social links from the API.
export async function getSocialLinks(): Promise<SocialLink[]> {
  const response = await fetchApi<SocialLink | null>("/site/social-links");

  // Normalizes the API response and removes invalid entries.
  return response?.id ? [response] : [];
}

// Defines the translated public profile content.
export interface ProfileTranslation {
  id: string;
  language: string;
  fullName: string;
  role: string;
  bio: string;
  profileId: string;
}

// Defines the public profile returned by the API.
export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
  translations: ProfileTranslation[];
}

// Fetches the public profile in the requested language.
export async function getProfile(language = "fa"): Promise<Profile> {
  return fetchApi<Profile>(`/profile?lang=${encodeURIComponent(language)}`);
}

// Returns the translation matching the requested language.
export function getSectionTranslation(
  section: HomeSection,
  language = "fa",
): HomeSectionTranslation | undefined {
  return section.translations.find(
    (translation) => translation.language === language,
  );
}

// Fetches published projects in the requested language.
export async function getProjects(
  language = "fa",
  page = 1,
  limit = 50,
): Promise<ProjectsResponse> {
  return fetchApi<ProjectsResponse>(
    `/projects?lang=${encodeURIComponent(language)}&page=${page}&limit=${limit}`,
  );
}

// Fetches a published project by its unique slug.
export async function getProjectBySlug(
  slug: string,
  language = "fa",
): Promise<Project | null> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(slug)}?lang=${encodeURIComponent(language)}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  // Returns null when the project does not exist for the requested language.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<Project>;
}

// Defines the paginated API response.
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Defines translated professional experience content.
export interface ExperienceTranslation {
  id: string;
  experienceId: string;
  language: string;
  title: string;
  description: string;
}

// Defines a professional experience entry.
export interface Experience {
  id: string;
  organization: string;
  position: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  enabled: boolean;
  sortOrder: number;
  translations: ExperienceTranslation[];
}

// Defines translated blog article content.
export interface BlogTranslation {
  id: string;
  articleId: string;
  language: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
}

// Defines a blog category or tag.
export interface BlogTaxonomy {
  id: string;
  name: string;
  slug: string;
}

// Defines a published blog article.
export interface BlogArticle {
  id: string;
  status: string;
  featured: boolean;
  allowComments: boolean;
  coverMediaId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translations: BlogTranslation[];
  coverMedia: {
    id: string;
    type: string;
    url: string;
    originalName: string;
    alt: string | null;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
  } | null;
  categories: Array<{
    category: BlogTaxonomy;
  }>;
  tags: Array<{
    tag: BlogTaxonomy;
  }>;
}

// Converts API media paths into absolute URLs.
export function resolveMediaUrl(
  path: string | null | undefined,
): string | null {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiOrigin = new URL(API_BASE_URL).origin;
  return `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

// Fetches professional experience entries.
export async function getExperiences(
  language = "fa",
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<Experience>> {
  return fetchApi<PaginatedResponse<Experience>>(
    `/experience?lang=${encodeURIComponent(language)}&page=${page}&limit=${limit}`,
  );
}

// Fetches published blog articles.
export async function getBlogArticles(
  language = "fa",
  page = 1,
  limit = 6,
): Promise<PaginatedResponse<BlogArticle>> {
  return fetchApi<PaginatedResponse<BlogArticle>>(
    `/blog?lang=${encodeURIComponent(language)}&page=${page}&limit=${limit}`,
  );
}

// Returns the translation matching the requested language.
export function getBlogTranslation(
  article: BlogArticle,
  language = "fa",
): BlogTranslation | undefined {
  return article.translations.find(
    (translation) => translation.language === language,
  );
}
