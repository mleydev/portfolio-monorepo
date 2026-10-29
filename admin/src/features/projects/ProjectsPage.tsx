import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Code2,
  ExternalLink,
  FolderKanban,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import api from "../../lib/api";
import "./ProjectsPage.css";

type Language = "fa" | "en" | "tr" | "ar";

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

type Project = {
  id: string;
  slug: string;
  coverImage?: string | null;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
  technologies?: string[] | null;
  featured: boolean;
  published: boolean;
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

        if (Array.isArray(message)) {
          return message.join("، ");
        }

        if (typeof message === "string") {
          return message;
        }
      }
    }
  }

  return "عملیات انجام نشد. اتصال API و دسترسی حساب را بررسی کن.";
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.slug.toLocaleLowerCase().includes(normalizedSearch) ||
        project.translations.some((translation) =>
          translation.title.toLocaleLowerCase().includes(normalizedSearch),
        ) ||
        project.technologies?.some((technology) =>
          technology.toLocaleLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && project.published) ||
        (statusFilter === "draft" && !project.published);

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      sortOrder: Number(form.sortOrder),
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
    ) {
      return;
    }

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

        <button className="projects-primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          پروژه جدید
        </button>
      </header>

      {notice && (
        <div className="projects-notice" role="status">
          <span>{notice}</span>
          <button aria-label="بستن پیام" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="projects-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button aria-label="بستن خطا" onClick={() => setError("")}>
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
          />
        </label>

        <select
          className="projects-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as typeof statusFilter)
          }
          aria-label="فیلتر وضعیت انتشار">
          <option value="all">همه پروژه‌ها</option>
          <option value="published">منتشرشده</option>
          <option value="draft">پیش‌نویس‌ها</option>
        </select>

        <button
          className="projects-icon-button"
          onClick={() => void loadProjects()}
          disabled={loading}
          aria-label="بارگذاری مجدد"
          title="بارگذاری مجدد">
          <RefreshCw size={17} className={loading ? "projects-spin" : ""} />
        </button>
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
              : "عبارت جست‌وجو یا فیلتر وضعیت را تغییر بده."}
          </p>
          {projects.length === 0 && (
            <button
              className="projects-primary-button"
              onClick={openCreateModal}>
              <Plus size={17} />
              ایجاد اولین پروژه
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const translation =
              project.translations.find((item) => item.language === "fa") ??
              project.translations[0];

            return (
              <article className="project-card" key={project.id}>
                <div className="project-card-cover">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
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
                      <h2>{translation?.title ?? "بدون عنوان فارسی"}</h2>
                      <code>{project.slug}</code>
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
                        className="project-edit-button"
                        onClick={() => openEditModal(project)}>
                        <Pencil size={15} />
                        ویرایش
                      </button>
                      <button
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
      )}

      {modalOpen && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
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
                className="projects-icon-button"
                type="button"
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

                <label className="projects-field projects-field-wide">
                  <span>آدرس تصویر کاور</span>
                  <input
                    type="url"
                    value={form.coverImage}
                    onChange={(event) =>
                      updateField("coverImage", event.target.value)
                    }
                    placeholder="https://example.com/cover.webp"
                    dir="ltr"
                  />
                </label>

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
                  className="projects-secondary-button"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}>
                  انصراف
                </button>
                <button
                  className="projects-primary-button"
                  type="submit"
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
    </section>
  );
}

export default ProjectsPage;
