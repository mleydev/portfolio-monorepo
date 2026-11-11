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

export async function getSocialLinks(): Promise<SocialLink[]> {
  // Fetches enabled social links as a direct array from the API.
  return fetchApi<SocialLink[]>("/site/social-links");
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
