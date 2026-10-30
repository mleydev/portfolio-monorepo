import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  FolderKanban,
  LayoutGrid,
  List,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UploadCloud,
  Star,
  Trash2,
  X,
} from "lucide-react";
import api from "../../lib/api";
import "./ProjectsPage.css";

type Language = "fa" | "en" | "tr" | "ar";
type ProjectView = "grid" | "list";
type ProjectSort =
  | "newest"
  | "oldest"
  | "title"
  | "sortOrder"
  | "publishedNewest";
type FeaturedFilter = "all" | "featured" | "regular";
type DateFilter = "all" | "7days" | "30days" | "thisYear";

type ProjectTranslation = {
  id?: string;
  language: Language;
  title: string;
  summary?: string | null;
  description: string;
  content?: string | null;
  role?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

type MediaUploadResponse = {
  url: string;
  storageKey?: string;
};

type Project = {
  id: string;
  slug: string;
  coverImage?: string | null;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
  technologies?: string[] | null;
  featured: boolean;
  published: boolean;
  publishedAt?: string | null;
  sortOrder: number;
  createdAt: string;
  translations: ProjectTranslation[];
};

type TranslationForm = {
  title: string;
  summary: string;
  description: string;
  content: string;
  role: string;
  metaTitle: string;
  metaDescription: string;
};

type ProjectForm = {
  slug: string;
  coverImage: string;
  demoUrl: string;
  repositoryUrl: string;
  technologies: string;
  featured: boolean;
  published: boolean;
  sortOrder: string;
  translations: Record<Language, TranslationForm>;
};

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "fa", label: "فارسی" },
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
];

const emptyTranslation = (): TranslationForm => ({
  title: "",
  summary: "",
  description: "",
  content: "",
  role: "",
  metaTitle: "",
  metaDescription: "",
});

const createEmptyForm = (): ProjectForm => ({
  slug: "",
  coverImage: "",
  demoUrl: "",
  repositoryUrl: "",
  technologies: "",
  featured: false,
  published: false,
  sortOrder: "0",
  translations: {
    fa: emptyTranslation(),
    en: emptyTranslation(),
    tr: emptyTranslation(),
    ar: emptyTranslation(),
  },
});

function projectToForm(project: Project): ProjectForm {
  const form = createEmptyForm();

  for (const translation of project.translations) {
    form.translations[translation.language] = {
      title: translation.title ?? "",
      summary: translation.summary ?? "",
      description: translation.description ?? "",
      content: translation.content ?? "",
      role: translation.role ?? "",
      metaTitle: translation.metaTitle ?? "",
      metaDescription: translation.metaDescription ?? "",
    };
  }

  return {
    slug: project.slug,
    coverImage: project.coverImage ?? "",
    demoUrl: project.demoUrl ?? "",
    repositoryUrl: project.repositoryUrl ?? "",
    technologies: project.technologies?.join(", ") ?? "",
    featured: project.featured,
    published: project.published,
    sortOrder: String(project.sortOrder),
    translations: form.translations,
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;

    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      const data = response.data;

      if (typeof data === "object" && data !== null && "message" in data) {
        const message = data.message;
        if (Array.isArray(message)) return message.join("، ");
        if (typeof message === "string") return message;
      }
    }
  }

  return "عملیات انجام نشد. اتصال API و دسترسی حساب را بررسی کن.";
}

function resolveMediaUrl(value?: string | null): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const baseUrl = api.defaults.baseURL ?? "http://localhost:4000/api/v1";
  try {
    const apiOrigin = new URL(baseUrl, window.location.origin).origin;
    return new URL(value, apiOrigin).toString();
  } catch {
    return value;
  }
}

function formatPublishedDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(createEmptyForm);
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");

  const [view, setView] = useState<ProjectView>("grid");
  const [languageFilter, setLanguageFilter] = useState<"all" | Language>("all");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<ProjectSort>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [detailsLanguage, setDetailsLanguage] = useState<Language>("fa");

  function openDetailsModal(project: Project) {
    setDetailsProject(project);

    const preferredLanguage: Language = project.translations.some(
      (item) => item.language === "fa",
    )
      ? "fa"
      : (project.translations[0]?.language ?? "en");

    setDetailsLanguage(preferredLanguage);
  }

  function closeDetailsModal() {
    setDetailsProject(null);
  }

  useEffect(() => {
    if (!detailsProject) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDetailsModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailsProject]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Project[]>("/admin/projects");
      setProjects(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const now = new Date();

    const matchesDate = (project: Project) => {
      if (dateFilter === "all") return true;
      if (!project.published || !project.publishedAt) return false;

      const publishedDate = new Date(project.publishedAt);
      if (Number.isNaN(publishedDate.getTime()) || publishedDate > now)
        return false;

      if (dateFilter === "7days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return publishedDate >= start;
      }

      if (dateFilter === "30days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return publishedDate >= start;
      }

      return publishedDate.getFullYear() === now.getFullYear();
    };

    const result = projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.slug.toLocaleLowerCase().includes(normalizedSearch) ||
        project.translations.some((translation) =>
          translation.title.toLocaleLowerCase().includes(normalizedSearch),
        ) ||
        (project.technologies ?? []).some((technology) =>
          technology.toLocaleLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && project.published) ||
        (statusFilter === "draft" && !project.published);

      const matchesLanguage =
        languageFilter === "all" ||
        project.translations.some(
          (translation) => translation.language === languageFilter,
        );

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && project.featured) ||
        (featuredFilter === "regular" && !project.featured);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLanguage &&
        matchesFeatured &&
        matchesDate(project)
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "title") {
        const titleA =
          a.translations.find((item) => item.language === "fa")?.title ??
          a.slug;
        const titleB =
          b.translations.find((item) => item.language === "fa")?.title ??
          b.slug;
        return titleA.localeCompare(titleB, "fa");
      }
      if (sortBy === "sortOrder") return a.sortOrder - b.sortOrder;

      // Keep projects without a publication date at the end.
      const dateA = a.publishedAt
        ? new Date(a.publishedAt).getTime()
        : -Infinity;
      const dateB = b.publishedAt
        ? new Date(b.publishedAt).getTime()
        : -Infinity;
      return dateB - dateA;
    });
  }, [
    projects,
    search,
    statusFilter,
    languageFilter,
    featuredFilter,
    dateFilter,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const rangeStart =
    filteredProjects.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredProjects.length);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    languageFilter,
    featuredFilter,
    dateFilter,
    sortBy,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const publishedCount = projects.filter((project) => project.published).length;
  const draftCount = projects.length - publishedCount;
  const featuredCount = projects.filter((project) => project.featured).length;

  function openCreateModal() {
    setEditingProject(null);
    setForm(createEmptyForm());
    setActiveLanguage("fa");
    setNotice("");
    setError("");
    setModalOpen(true);
  }

  function openEditModal(project: Project) {
    setEditingProject(project);
    setForm(projectToForm(project));
    setActiveLanguage("fa");
    setNotice("");
    setError("");
    setModalOpen(true);
  }

  function updateField<K extends keyof ProjectForm>(
    field: K,
    value: ProjectForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTranslation(field: keyof TranslationForm, value: string) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLanguage]: {
          ...current.translations[activeLanguage],
          [field]: value,
        },
      },
    }));
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow choosing the same file again after a failed upload.
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("فرمت تصویر باید JPG، PNG، WEBP یا GIF باشد.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    setUploadingCover(true);
    setError("");
    setNotice("");

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("type", "IMAGE");

      const response = await api.post<MediaUploadResponse>(
        "/admin/media/upload",
        data,
      );

      if (!response.data?.url) {
        throw new Error("Upload response did not include a URL.");
      }

      // Keep the API-provided path in the database; resolve it to an absolute
      // URL only when rendering the image in the browser.
      const baseUrl = api.defaults.baseURL ?? "http://localhost:4000/api/v1";

      const coverImageUrl = new URL(
        response.data.url,
        `${new URL(baseUrl).origin}/`,
      ).toString();

      updateField("coverImage", coverImageUrl);
      setNotice("تصویر کاور با موفقیت آپلود شد.");

      console.log("Uploaded image URL:", response.data.url);
      console.log("Final coverImage URL:", coverImageUrl);

      updateField("coverImage", coverImageUrl);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const translations = LANGUAGES.map(({ value }) => ({
      language: value,
      ...form.translations[value],
    })).filter(
      (translation) =>
        translation.title.trim() || translation.description.trim(),
    );

    if (
      !translations.some(
        (translation) =>
          translation.language === "fa" &&
          translation.title.trim() &&
          translation.description.trim(),
      )
    ) {
      setError("عنوان و توضیحات فارسی الزامی است.");
      setActiveLanguage("fa");
      setSaving(false);
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("ترتیب نمایش باید یک عدد صحیح و صفر یا بیشتر باشد.");
      setSaving(false);
      return;
    }

    const payload = {
      slug: form.slug.trim(),
      coverImage: form.coverImage.trim() || undefined,
      demoUrl: form.demoUrl.trim() || undefined,
      repositoryUrl: form.repositoryUrl.trim() || undefined,
      technologies: form.technologies
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean),
      featured: form.featured,
      published: form.published,
      sortOrder,
      translations: translations.map((translation) => ({
        ...translation,
        title: translation.title.trim(),
        description: translation.description.trim(),
        summary: translation.summary.trim() || undefined,
        content: translation.content.trim() || undefined,
        role: translation.role.trim() || undefined,
        metaTitle: translation.metaTitle.trim() || undefined,
        metaDescription: translation.metaDescription.trim() || undefined,
      })),
    };

    try {
      if (editingProject) {
        await api.patch(`/admin/projects/${editingProject.id}`, payload);
        setNotice("پروژه با موفقیت ویرایش شد.");
      } else {
        await api.post("/admin/projects", payload);
        setNotice("پروژه جدید با موفقیت ایجاد شد.");
      }
      setModalOpen(false);
      await loadProjects();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    const title =
      project.translations.find((translation) => translation.language === "fa")
        ?.title ?? project.slug;
    if (
      !window.confirm(`پروژه «${title}» حذف شود؟ این عملیات قابل بازگشت نیست.`)
    )
      return;

    setError("");
    setNotice("");
    try {
      await api.delete(`/admin/projects/${project.id}`);
      setNotice("پروژه حذف شد.");
      await loadProjects();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setLanguageFilter("all");
    setFeaturedFilter("all");
    setDateFilter("all");
    setSortBy("newest");
    setPage(1);
  }

  return (
    <section className="projects-page" dir="rtl">
      <header className="projects-heading">
        <div>
          <span className="projects-eyebrow">
            <FolderKanban size={15} />
            مدیریت محتوا
          </span>
          <h1>پروژه‌ها</h1>
          <p>
            نمونه‌کارها را مدیریت کن، ترجمه‌ها را ویرایش کن و وضعیت انتشار را
            کنترل کن.
          </p>
        </div>
        <button
          className="projects-primary-button"
          type="button"
          onClick={openCreateModal}>
          <Plus size={18} />
          پروژه جدید
        </button>
      </header>

      {notice && (
        <div className="projects-notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="بستن پیام"
            onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="projects-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="بستن خطا"
            onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="projects-stats">
        <article className="projects-stat">
          <span className="projects-stat-icon purple">
            <FolderKanban size={20} />
          </span>
          <span className="projects-stat-copy">
            <small>کل پروژه‌ها</small>
            <strong>{projects.length}</strong>
          </span>
        </article>
        <article className="projects-stat">
          <span className="projects-stat-icon green">
            <ArrowUpRight size={20} />
          </span>
          <span className="projects-stat-copy">
            <small>منتشرشده</small>
            <strong>{publishedCount}</strong>
          </span>
        </article>
        <article className="projects-stat">
          <span className="projects-stat-icon orange">
            <Pencil size={20} />
          </span>
          <span className="projects-stat-copy">
            <small>پیش‌نویس</small>
            <strong>{draftCount}</strong>
          </span>
        </article>
        <article className="projects-stat">
          <span className="projects-stat-icon blue">
            <Star size={20} />
          </span>
          <span className="projects-stat-copy">
            <small>پروژه ویژه</small>
            <strong>{featuredCount}</strong>
          </span>
        </article>
      </div>

      <div className="projects-toolbar">
        <label className="projects-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجوی عنوان، اسلاگ یا فناوری..."
            aria-label="جست‌وجوی پروژه‌ها"
          />
          {search && (
            <button
              type="button"
              className="projects-clear-search"
              onClick={() => setSearch("")}
              aria-label="پاک کردن جست‌وجو">
              <X size={15} />
            </button>
          )}
        </label>

        <select
          className="projects-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as typeof statusFilter)
          }
          aria-label="فیلتر وضعیت انتشار">
          <option value="all">همه وضعیت‌ها</option>
          <option value="published">منتشرشده</option>
          <option value="draft">پیش‌نویس</option>
        </select>

        <select
          className="projects-filter projects-sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as ProjectSort)}
          aria-label="مرتب‌سازی پروژه‌ها">
          <option value="newest">جدیدترین ثبت‌شده</option>
          <option value="oldest">قدیمی‌ترین ثبت‌شده</option>
          <option value="publishedNewest">جدیدترین انتشار</option>
          <option value="title">عنوان (الفبا)</option>
          <option value="sortOrder">ترتیب نمایش</option>
        </select>

        <button
          type="button"
          className={`projects-icon-button ${filtersOpen ? "active" : ""}`}
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-label="فیلترهای بیشتر"
          title="فیلترهای بیشتر">
          <SlidersHorizontal size={17} />
        </button>

        <div
          className="projects-view-toggle"
          role="group"
          aria-label="نحوه نمایش">
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            onClick={() => setView("grid")}
            aria-label="نمایش شبکه‌ای"
            title="نمایش شبکه‌ای">
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-label="نمایش فهرستی"
            title="نمایش فهرستی">
            <List size={17} />
          </button>
        </div>

        <button
          type="button"
          className="projects-icon-button"
          onClick={() => void loadProjects()}
          disabled={loading}
          aria-label="بارگذاری مجدد"
          title="بارگذاری مجدد">
          <RefreshCw size={17} className={loading ? "projects-spin" : ""} />
        </button>
      </div>

      {filtersOpen && (
        <div className="projects-advanced-filters">
          <label className="projects-filter-field">
            <span>زبان محتوا</span>
            <select
              className="projects-filter"
              value={languageFilter}
              onChange={(event) =>
                setLanguageFilter(event.target.value as "all" | Language)
              }>
              <option value="all">همه زبان‌ها</option>
              {LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="projects-filter-field">
            <span>نوع پروژه</span>
            <select
              className="projects-filter"
              value={featuredFilter}
              onChange={(event) =>
                setFeaturedFilter(event.target.value as FeaturedFilter)
              }>
              <option value="all">همه پروژه‌ها</option>
              <option value="featured">فقط ویژه</option>
              <option value="regular">غیر ویژه</option>
            </select>
          </label>
          <label className="projects-filter-field">
            <span>
              <CalendarDays size={13} /> تاریخ انتشار
            </span>
            <select
              className="projects-filter"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DateFilter)
              }>
              <option value="all">همه تاریخ‌ها</option>
              <option value="7days">۷ روز اخیر</option>
              <option value="30days">۳۰ روز اخیر</option>
              <option value="thisYear">سال جاری</option>
            </select>
          </label>
          <button
            type="button"
            className="projects-secondary-button projects-reset-filters"
            onClick={resetFilters}>
            پاک کردن فیلترها
          </button>
        </div>
      )}

      <div className="projects-results-bar">
        <span>
          نمایش{" "}
          <strong>
            {rangeStart} تا {rangeEnd}
          </strong>{" "}
          از <strong>{filteredProjects.length}</strong> پروژه
        </span>
        <label>
          تعداد در صفحه
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            aria-label="تعداد پروژه در صفحه">
            <option value={8}>۸</option>
            <option value={12}>۱۲</option>
            <option value={24}>۲۴</option>
            <option value={48}>۴۸</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="projects-state">
          <LoaderCircle className="projects-spin" size={30} />
          <p>در حال دریافت پروژه‌ها...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="projects-state">
          <FolderKanban size={34} />
          <h2>
            {projects.length === 0
              ? "هنوز پروژه‌ای ثبت نشده"
              : "نتیجه‌ای پیدا نشد"}
          </h2>
          <p>
            {projects.length === 0
              ? "اولین پروژه را ثبت کن تا در این فهرست نمایش داده شود."
              : "عبارت جست‌وجو یا فیلترها را تغییر بده."}
          </p>
          {projects.length === 0 ? (
            <button
              type="button"
              className="projects-primary-button"
              onClick={openCreateModal}>
              <Plus size={17} />
              ایجاد اولین پروژه
            </button>
          ) : (
            <button
              type="button"
              className="projects-secondary-button"
              onClick={resetFilters}>
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`projects-grid ${view === "list" ? "projects-list" : ""}`}>
            {paginatedProjects.map((project) => {
              const translation =
                project.translations.find((item) => item.language === "fa") ??
                project.translations[0];

              return (
                <article className="project-card" key={project.id}>
                  <div
                    className="project-card-cover project-card-cover-clickable"
                    onClick={() => openDetailsModal(project)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDetailsModal(project);
                      }
                    }}
                    aria-label={`مشاهده جزئیات ${translation?.title ?? project.slug}`}>
                    {project.coverImage ? (
                      <img
                        src={resolveMediaUrl(project.coverImage)}
                        alt={translation?.title ?? project.slug}
                        loading="lazy"
                      />
                    ) : (
                      <div className="project-cover-placeholder">
                        <Code2 size={35} />
                        <span>MEHDI LEILAEI</span>
                      </div>
                    )}
                    <span
                      className={`project-status ${project.published ? "published" : "draft"}`}>
                      {project.published ? "منتشرشده" : "پیش‌نویس"}
                    </span>
                    {project.featured && (
                      <span className="project-featured">
                        <Star size={13} fill="currentColor" />
                        ویژه
                      </span>
                    )}
                  </div>

                  <div className="project-card-body">
                    <div className="project-card-title">
                      <div>
                        <h2>
                          <button
                            type="button"
                            className="project-details-trigger"
                            onClick={() => openDetailsModal(project)}>
                            {translation?.title ?? "بدون عنوان فارسی"}
                          </button>
                        </h2>
                        <code>{project.slug}</code>
                        {project.publishedAt && (
                          <span className="project-published-date">
                            <CalendarDays size={12} />
                            {formatPublishedDate(project.publishedAt)}
                          </span>
                        )}
                      </div>
                      <span className="project-order">{project.sortOrder}</span>
                    </div>

                    <p className="project-summary">
                      {translation?.summary ||
                        translation?.description ||
                        "توضیحاتی برای این پروژه ثبت نشده است."}
                    </p>

                    <div className="project-technologies">
                      {(project.technologies ?? [])
                        .slice(0, 5)
                        .map((technology) => (
                          <span key={technology}>{technology}</span>
                        ))}
                      {(project.technologies?.length ?? 0) > 5 && (
                        <span>+{project.technologies!.length - 5}</span>
                      )}
                    </div>

                    <div className="project-languages">
                      {LANGUAGES.map(({ value, label }) => {
                        const exists = project.translations.some(
                          (item) => item.language === value,
                        );
                        return (
                          <span
                            key={value}
                            className={exists ? "language-exists" : ""}
                            title={`${label}: ${exists ? "ثبت شده" : "ثبت نشده"}`}>
                            {value.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>

                    <div className="project-card-footer">
                      <div className="project-links">
                        {project.demoUrl && (
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="مشاهده دمو"
                            title="مشاهده دمو">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        {project.repositoryUrl && (
                          <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="مشاهده مخزن"
                            title="مشاهده مخزن">
                            <Code2 size={16} />
                          </a>
                        )}
                      </div>
                      <div className="project-card-actions">
                        <button
                          type="button"
                          className="project-edit-button"
                          onClick={() => openEditModal(project)}>
                          <Pencil size={15} />
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="project-delete-button"
                          onClick={() => void handleDelete(project)}
                          aria-label={`حذف ${translation?.title ?? project.slug}`}
                          title="حذف پروژه">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              className="projects-pagination"
              aria-label="صفحه‌بندی پروژه‌ها">
              <button
                type="button"
                className="projects-icon-button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                aria-label="صفحه قبلی">
                <ChevronRight size={17} />
              </button>
              <span>
                صفحه <strong>{page}</strong> از {totalPages}
              </span>
              <button
                type="button"
                className="projects-icon-button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages}
                aria-label="صفحه بعدی">
                <ChevronLeft size={17} />
              </button>
            </nav>
          )}
        </>
      )}

      {modalOpen && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving)
              setModalOpen(false);
          }}>
          <section
            className="projects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-form-title"
            dir="rtl">
            <header className="projects-modal-header">
              <div>
                <span className="projects-eyebrow">
                  <FolderKanban size={15} />
                  مدیریت نمونه‌کار
                </span>
                <h2 id="project-form-title">
                  {editingProject ? "ویرایش پروژه" : "ایجاد پروژه جدید"}
                </h2>
              </div>
              <button
                type="button"
                className="projects-icon-button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="بستن فرم">
                <X size={19} />
              </button>
            </header>

            <form className="projects-form" onSubmit={handleSubmit}>
              <div className="projects-form-grid">
                <label className="projects-field">
                  <span>اسلاگ یکتا *</span>
                  <input
                    required
                    maxLength={100}
                    value={form.slug}
                    onChange={(event) =>
                      updateField("slug", event.target.value)
                    }
                    placeholder="my-react-dashboard"
                    dir="ltr"
                  />
                  <small>برای آدرس پروژه استفاده می‌شود.</small>
                </label>
                <label className="projects-field">
                  <span>ترتیب نمایش</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateField("sortOrder", event.target.value)
                    }
                  />
                </label>
                <div className="projects-field projects-field-wide projects-cover-upload-field">
                  <span>تصویر کاور پروژه</span>
                  <label className="projects-upload-button">
                    {uploadingCover ? (
                      <LoaderCircle size={17} className="projects-spin" />
                    ) : (
                      <UploadCloud size={17} />
                    )}
                    {uploadingCover
                      ? "در حال آپلود تصویر..."
                      : "انتخاب و آپلود تصویر"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover || saving}
                    />
                  </label>
                  <small>
                    فرمت‌های JPG، PNG، WEBP و GIF؛ حداکثر ۱۰ مگابایت.
                  </small>
                  {form.coverImage && (
                    <div className="projects-cover-preview">
                      <img
                        src={resolveMediaUrl(form.coverImage)}
                        alt="پیش‌نمایش تصویر کاور"
                      />
                      <div className="projects-cover-preview-info">
                        <span>تصویر انتخاب‌شده</span>
                        <code dir="ltr">{form.coverImage}</code>
                        <button
                          type="button"
                          className="projects-secondary-button"
                          onClick={() => updateField("coverImage", "")}>
                          حذف تصویر
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <label className="projects-field">
                  <span>لینک دمو</span>
                  <input
                    type="url"
                    value={form.demoUrl}
                    onChange={(event) =>
                      updateField("demoUrl", event.target.value)
                    }
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </label>
                <label className="projects-field">
                  <span>لینک مخزن کد</span>
                  <input
                    type="url"
                    value={form.repositoryUrl}
                    onChange={(event) =>
                      updateField("repositoryUrl", event.target.value)
                    }
                    placeholder="https://github.com/..."
                    dir="ltr"
                  />
                </label>
                <label className="projects-field projects-field-wide">
                  <span>فناوری‌ها</span>
                  <input
                    value={form.technologies}
                    onChange={(event) =>
                      updateField("technologies", event.target.value)
                    }
                    placeholder="React, TypeScript, NestJS, PostgreSQL"
                    dir="ltr"
                  />
                  <small>نام فناوری‌ها را با کاما از هم جدا کن.</small>
                </label>
              </div>

              <div className="projects-switches">
                <label>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                  />
                  <span>پروژه ویژه</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) =>
                      updateField("published", event.target.checked)
                    }
                  />
                  <span>انتشار پروژه</span>
                </label>
              </div>

              <div className="projects-translation-section">
                <div className="projects-translation-heading">
                  <div>
                    <h3>محتوای ترجمه‌شده</h3>
                    <p>
                      عنوان و توضیحات فارسی الزامی است؛ زبان‌های دیگر
                      اختیاری‌اند.
                    </p>
                  </div>
                </div>

                <div
                  className="projects-language-tabs"
                  role="tablist"
                  aria-label="زبان ترجمه">
                  {LANGUAGES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={activeLanguage === value}
                      className={activeLanguage === value ? "active" : ""}
                      onClick={() => setActiveLanguage(value)}>
                      {label}
                      {value === "fa" && <span>*</span>}
                    </button>
                  ))}
                </div>

                <div className="projects-form-grid">
                  <label className="projects-field projects-field-wide">
                    <span>عنوان {activeLanguage === "fa" ? "*" : ""}</span>
                    <input
                      required={activeLanguage === "fa"}
                      maxLength={150}
                      value={form.translations[activeLanguage].title}
                      onChange={(event) =>
                        updateTranslation("title", event.target.value)
                      }
                    />
                  </label>
                  <label className="projects-field projects-field-wide">
                    <span>خلاصه</span>
                    <textarea
                      rows={2}
                      value={form.translations[activeLanguage].summary}
                      onChange={(event) =>
                        updateTranslation("summary", event.target.value)
                      }
                    />
                  </label>
                  <label className="projects-field projects-field-wide">
                    <span>توضیحات {activeLanguage === "fa" ? "*" : ""}</span>
                    <textarea
                      rows={4}
                      required={activeLanguage === "fa"}
                      value={form.translations[activeLanguage].description}
                      onChange={(event) =>
                        updateTranslation("description", event.target.value)
                      }
                    />
                  </label>
                  <label className="projects-field projects-field-wide">
                    <span>محتوای کامل (اختیاری)</span>
                    <textarea
                      rows={4}
                      value={form.translations[activeLanguage].content}
                      onChange={(event) =>
                        updateTranslation("content", event.target.value)
                      }
                    />
                  </label>
                  <label className="projects-field">
                    <span>نقش من در پروژه</span>
                    <input
                      value={form.translations[activeLanguage].role}
                      onChange={(event) =>
                        updateTranslation("role", event.target.value)
                      }
                    />
                  </label>
                  <label className="projects-field">
                    <span>عنوان سئو</span>
                    <input
                      value={form.translations[activeLanguage].metaTitle}
                      onChange={(event) =>
                        updateTranslation("metaTitle", event.target.value)
                      }
                    />
                  </label>
                  <label className="projects-field projects-field-wide">
                    <span>توضیحات سئو</span>
                    <textarea
                      rows={2}
                      value={form.translations[activeLanguage].metaDescription}
                      onChange={(event) =>
                        updateTranslation("metaDescription", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="projects-error" role="alert">
                  <AlertCircle size={17} />
                  <span>{error}</span>
                </div>
              )}

              <footer className="projects-form-footer">
                <button
                  type="button"
                  className="projects-secondary-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}>
                  انصراف
                </button>
                <button
                  type="submit"
                  className="projects-primary-button"
                  disabled={saving}>
                  {saving ? (
                    <LoaderCircle size={17} className="projects-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  {saving ? "در حال ذخیره..." : "ذخیره پروژه"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {detailsProject &&
        (() => {
          const translation =
            detailsProject.translations.find(
              (item) => item.language === detailsLanguage,
            ) ?? null;

          const isRtl = detailsLanguage === "fa" || detailsLanguage === "ar";

          return (
            <div
              className="project-details-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeDetailsModal();
                }
              }}>
              <section
                className="project-details-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-details-title"
                dir={isRtl ? "rtl" : "ltr"}>
                <header className="project-details-header">
                  <div>
                    <span className="projects-eyebrow">
                      <FolderKanban size={15} />
                      جزئیات نمونه‌کار
                    </span>
                    <h2 id="project-details-title">
                      {translation?.title ?? detailsProject.slug}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="projects-icon-button"
                    onClick={closeDetailsModal}
                    aria-label="بستن جزئیات">
                    <X size={19} />
                  </button>
                </header>

                <div className="project-details-content">
                  <div className="project-details-cover">
                    {detailsProject.coverImage ? (
                      <img
                        src={resolveMediaUrl(detailsProject.coverImage)}
                        alt={translation?.title ?? detailsProject.slug}
                      />
                    ) : (
                      <div className="project-cover-placeholder">
                        <Code2 size={40} />
                        <span>MEHDI LEILAEI</span>
                      </div>
                    )}

                    <div className="project-details-badges">
                      <span
                        className={`project-status ${detailsProject.published ? "published" : "draft"}`}>
                        {detailsProject.published ? "منتشرشده" : "پیش‌نویس"}
                      </span>

                      {detailsProject.featured && (
                        <span className="project-featured">
                          <Star size={13} fill="currentColor" />
                          ویژه
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="project-details-language-tabs">
                    {LANGUAGES.map(({ value, label }) => {
                      const exists = detailsProject.translations.some(
                        (item) => item.language === value,
                      );

                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!exists}
                          className={detailsLanguage === value ? "active" : ""}
                          onClick={() => setDetailsLanguage(value)}>
                          {label}
                          {!exists && <span> — ثبت نشده</span>}
                        </button>
                      );
                    })}
                  </div>

                  {translation ? (
                    <div
                      className="project-details-information"
                      dir={isRtl ? "rtl" : "ltr"}>
                      <div className="project-details-title-row">
                        <div>
                          <span className="project-details-label">
                            عنوان پروژه
                          </span>
                          <h3>{translation.title}</h3>
                          <code dir="ltr">{detailsProject.slug}</code>
                        </div>

                        <span className="project-details-order">
                          #{detailsProject.sortOrder}
                        </span>
                      </div>

                      {translation.summary && (
                        <section className="project-details-section">
                          <h4>خلاصه پروژه</h4>
                          <p>{translation.summary}</p>
                        </section>
                      )}

                      <section className="project-details-section">
                        <h4>توضیحات پروژه</h4>
                        <p>{translation.description}</p>
                      </section>

                      {translation.content && (
                        <section className="project-details-section">
                          <h4>محتوای کامل</h4>
                          <div className="project-details-content-text">
                            {translation.content}
                          </div>
                        </section>
                      )}

                      {translation.role && (
                        <section className="project-details-section">
                          <h4>نقش من در پروژه</h4>
                          <p>{translation.role}</p>
                        </section>
                      )}

                      <section className="project-details-section">
                        <h4>فناوری‌های استفاده‌شده</h4>
                        <div className="project-technologies">
                          {(detailsProject.technologies ?? []).map(
                            (technology) => (
                              <span key={technology}>{technology}</span>
                            ),
                          )}
                          {detailsProject.technologies?.length === 0 && (
                            <span>فناوری‌ای ثبت نشده است.</span>
                          )}
                        </div>
                      </section>

                      <section className="project-details-section">
                        <h4>اطلاعات انتشار</h4>
                        <div className="project-details-meta">
                          <div>
                            <span>تاریخ ایجاد</span>
                            <strong>
                              {formatPublishedDate(detailsProject.createdAt)}
                            </strong>
                          </div>
                          <div>
                            <span>تاریخ انتشار</span>
                            <strong>
                              {formatPublishedDate(
                                detailsProject.publishedAt,
                              ) || "منتشر نشده"}
                            </strong>
                          </div>
                          <div>
                            <span>ترتیب نمایش</span>
                            <strong>{detailsProject.sortOrder}</strong>
                          </div>
                          <div>
                            <span>وضعیت</span>
                            <strong>
                              {detailsProject.published
                                ? "منتشرشده"
                                : "پیش‌نویس"}
                            </strong>
                          </div>
                        </div>
                      </section>

                      {(detailsProject.demoUrl ||
                        detailsProject.repositoryUrl) && (
                        <section className="project-details-section">
                          <h4>لینک‌های پروژه</h4>
                          <div className="project-details-links">
                            {detailsProject.demoUrl && (
                              <a
                                href={detailsProject.demoUrl}
                                target="_blank"
                                rel="noreferrer">
                                <ExternalLink size={16} />
                                مشاهده دمو
                              </a>
                            )}

                            {detailsProject.repositoryUrl && (
                              <a
                                href={detailsProject.repositoryUrl}
                                target="_blank"
                                rel="noreferrer">
                                <Code2 size={16} />
                                مشاهده مخزن کد
                              </a>
                            )}
                          </div>
                        </section>
                      )}

                      {(translation.metaTitle ||
                        translation.metaDescription) && (
                        <section className="project-details-section">
                          <h4>اطلاعات سئو</h4>
                          {translation.metaTitle && (
                            <p>
                              <strong>عنوان:</strong> {translation.metaTitle}
                            </p>
                          )}
                          {translation.metaDescription && (
                            <p>
                              <strong>توضیحات:</strong>{" "}
                              {translation.metaDescription}
                            </p>
                          )}
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className="projects-state">
                      <AlertCircle size={25} />
                      <p>برای این پروژه ترجمه‌ای در این زبان ثبت نشده است.</p>
                    </div>
                  )}
                </div>

                <footer className="project-details-footer">
                  <button
                    type="button"
                    className="projects-secondary-button"
                    onClick={closeDetailsModal}>
                    بستن
                  </button>

                  <button
                    type="button"
                    className="projects-primary-button"
                    onClick={() => {
                      closeDetailsModal();
                      openEditModal(detailsProject);
                    }}>
                    <Pencil size={15} />
                    ویرایش پروژه
                  </button>
                </footer>
              </section>
            </div>
          );
        })()}
    </section>
  );
}

export default ProjectsPage;
