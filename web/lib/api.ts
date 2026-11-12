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
