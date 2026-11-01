import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Award,
  Code2,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
  Layers3,
  RefreshCw,
} from "lucide-react";

import api from "../../lib/api";
import IconPicker, { getSkillIcon } from "../../components/IconPicker";

import "./SkillsPage.css";

type Language = "fa" | "en" | "tr" | "ar";

type SkillTranslation = {
  language: Language;
  title: string;
  description?: string | null;
};

type Skill = {
  id: string;
  name: string;
  category: string | null;
  icon: string | null;
  level: number | null;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
  translations: SkillTranslation[];
  createdAt?: string;
  updatedAt?: string;
};

type SkillForm = {
  name: string;
  category: string;
  icon: string;
  level: number;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
  translations: Record<Language, { title: string; description: string }>;
};

const LANGUAGES: {
  value: Language;
  label: string;
  direction: "rtl" | "ltr";
}[] = [
  { value: "fa", label: "فارسی", direction: "rtl" },
  { value: "en", label: "English", direction: "ltr" },
  { value: "tr", label: "Türkçe", direction: "ltr" },
  { value: "ar", label: "العربية", direction: "rtl" },
];

const EMPTY_FORM: SkillForm = {
  name: "",
  category: "",
  icon: "",
  level: 80,
  featured: false,
  enabled: true,
  sortOrder: 0,
  translations: {
    fa: { title: "", description: "" },
    en: { title: "", description: "" },
    tr: { title: "", description: "" },
    ar: { title: "", description: "" },
  },
};

const getErrorMessage = (error: unknown): string => {
  const response = (
    error as {
      response?: { data?: { message?: string | string[] } };
    }
  )?.response;

  const message = response?.data?.message;

  if (Array.isArray(message)) return message.join("، ");
  if (typeof message === "string") return message;

  return "عملیات انجام نشد. لطفاً دوباره تلاش کن.";
};

function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [form, setForm] = useState<SkillForm>(EMPTY_FORM);
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Skill[]>("/admin/skills");
      setSkills(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSkills();
  }, [fetchSkills]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          skills
            .map((skill) => skill.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [skills],
  );

  const filteredSkills = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return skills.filter((skill) => {
      const searchableText = [
        skill.name,
        skill.category ?? "",
        skill.icon ?? "",
        ...skill.translations.flatMap((translation) => [
          translation.title,
          translation.description ?? "",
        ]),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || skill.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" && skill.enabled) ||
        (statusFilter === "disabled" && !skill.enabled) ||
        (statusFilter === "featured" && skill.featured);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [skills, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalLevel = skills.reduce(
      (total, skill) => total + (skill.level ?? 0),
      0,
    );

    return {
      total: skills.length,
      enabled: skills.filter((skill) => skill.enabled).length,
      featured: skills.filter((skill) => skill.featured).length,
      average: skills.length > 0 ? Math.round(totalLevel / skills.length) : 0,
    };
  }, [skills]);

  const openCreateModal = () => {
    setEditingSkill(null);
    setForm({
      ...EMPTY_FORM,
      translations: {
        fa: { title: "", description: "" },
        en: { title: "", description: "" },
        tr: { title: "", description: "" },
        ar: { title: "", description: "" },
      },
    });

    setActiveLanguage("fa");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (skill: Skill) => {
    const translations = { ...EMPTY_FORM.translations };

    skill.translations.forEach((translation) => {
      translations[translation.language] = {
        title: translation.title ?? "",
        description: translation.description ?? "",
      };
    });

    setEditingSkill(skill);

    setForm({
      name: skill.name,
      category: skill.category ?? "",
      icon: skill.icon ?? "",
      level: skill.level ?? 80,
      featured: skill.featured,
      enabled: skill.enabled,
      sortOrder: skill.sortOrder,
      translations,
    });

    setActiveLanguage("fa");
    setError("");
    setModalOpen(true);
  };

  const updateTranslation = (field: "title" | "description", value: string) => {
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
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const translations = LANGUAGES.map(({ value }) => ({
      language: value,
      title: form.translations[value].title.trim(),
      description: form.translations[value].description.trim() || undefined,
    })).filter((translation) => translation.title.length > 0);

    if (!form.name.trim()) {
      setError("نام مهارت الزامی است.");
      return;
    }

    if (translations.length === 0) {
      setError("حداقل عنوان ترجمه را برای یک زبان وارد کن.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      icon: form.icon.trim() || undefined,
      level: Number(form.level),
      featured: form.featured,
      enabled: form.enabled,
      sortOrder: Number(form.sortOrder),
      translations,
    };

    setSaving(true);

    try {
      if (editingSkill) {
        await api.patch(`/admin/skills/${editingSkill.id}`, payload);
        setNotice("مهارت با موفقیت به‌روزرسانی شد.");
      } else {
        await api.post("/admin/skills", payload);
        setNotice("مهارت جدید با موفقیت ایجاد شد.");
      }

      setModalOpen(false);
      await fetchSkills();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill: Skill) => {
    const confirmed = window.confirm(
      `آیا از حذف مهارت «${skill.name}» مطمئن هستی؟`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/skills/${skill.id}`);
      setNotice("مهارت حذف شد.");
      await fetchSkills();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleToggleEnabled = async (skill: Skill) => {
    setError("");

    try {
      await api.patch(`/admin/skills/${skill.id}`, {
        enabled: !skill.enabled,
      });

      setSkills((current) =>
        current.map((item) =>
          item.id === skill.id ? { ...item, enabled: !item.enabled } : item,
        ),
      );

      setNotice(skill.enabled ? "مهارت غیرفعال شد." : "مهارت فعال شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingSkill(null);
  };

  return (
    <div className="skills-page">
      <div className="skills-heading">
        <div>
          <span className="skills-eyebrow">
            <Code2 size={15} />
            مدیریت توانایی‌ها
          </span>

          <h1>مهارت‌ها</h1>

          <p>
            مهارت‌های تخصصی خودت را مدیریت کن و آن‌ها را در پورتفولیو نمایش بده.
          </p>
        </div>

        <button
          type="button"
          className="skills-primary-button"
          onClick={openCreateModal}>
          <Plus size={17} />
          افزودن مهارت
        </button>
      </div>

      {notice && (
        <div className="skills-notice">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="بستن پیام"
            onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="skills-error">
          <span>{error}</span>
          <button
            type="button"
            aria-label="بستن پیام"
            onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="skills-stats">
        <article className="skills-stat">
          <span className="skills-stat-icon purple">
            <Layers3 size={20} />
          </span>
          <div>
            <small>تمام مهارت‌ها</small>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="skills-stat">
          <span className="skills-stat-icon green">
            <Eye size={20} />
          </span>
          <div>
            <small>مهارت‌های فعال</small>
            <strong>{stats.enabled}</strong>
          </div>
        </article>

        <article className="skills-stat">
          <span className="skills-stat-icon orange">
            <Star size={20} />
          </span>
          <div>
            <small>مهارت‌های ویژه</small>
            <strong>{stats.featured}</strong>
          </div>
        </article>

        <article className="skills-stat">
          <span className="skills-stat-icon blue">
            <Award size={20} />
          </span>
          <div>
            <small>میانگین تسلط</small>
            <strong>{stats.average}٪</strong>
          </div>
        </article>
      </section>

      <section className="skills-toolbar">
        <label className="skills-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجوی مهارت، عنوان یا دسته‌بندی..."
          />
        </label>

        <label className="skills-filter">
          <Filter size={16} />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="فیلتر دسته‌بندی">
            <option value="all">همه دسته‌بندی‌ها</option>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <select
          className="skills-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="فیلتر وضعیت">
          <option value="all">همه وضعیت‌ها</option>
          <option value="enabled">فعال</option>
          <option value="disabled">غیرفعال</option>
          <option value="featured">ویژه</option>
        </select>

        <button
          type="button"
          className="skills-refresh-button"
          onClick={() => void fetchSkills()}
          title="بارگذاری مجدد"
          aria-label="بارگذاری مجدد">
          <RefreshCw size={17} />
        </button>
      </section>

      <div className="skills-results-heading">
        <div>
          <h2>فهرست مهارت‌ها</h2>
          <span>{filteredSkills.length} مهارت</span>
        </div>
      </div>

      {loading ? (
        <div className="skills-state">
          <RefreshCw size={22} className="skills-loading-icon" />
          <span>در حال دریافت مهارت‌ها...</span>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="skills-state">
          <span className="skills-empty-icon">
            <Code2 size={27} />
          </span>

          <strong>
            {skills.length === 0
              ? "هنوز مهارتی ثبت نشده است."
              : "مهارتی با این فیلترها پیدا نشد."}
          </strong>

          <p>
            {skills.length === 0
              ? "اولین مهارتت را اضافه کن تا در این بخش نمایش داده شود."
              : "عبارت جست‌وجو یا فیلترها را تغییر بده."}
          </p>

          {skills.length === 0 && (
            <button
              type="button"
              className="skills-primary-button"
              onClick={openCreateModal}>
              <Plus size={17} />
              افزودن اولین مهارت
            </button>
          )}
        </div>
      ) : (
        <div className="skills-grid">
          {filteredSkills.map((skill) => {
            const faTranslation = skill.translations.find(
              (translation) => translation.language === "fa",
            );

            const enTranslation = skill.translations.find(
              (translation) => translation.language === "en",
            );

            const SkillCardIcon = getSkillIcon(skill.icon ?? "");

            const level = skill.level ?? 0;

            return (
              <article className="skill-card" key={skill.id}>
                <div className="skill-card-top">
                  <span className="skill-card-icon">
                    <SkillCardIcon size={21} />
                  </span>

                  <div className="skill-card-actions">
                    <button
                      type="button"
                      onClick={() => void handleToggleEnabled(skill)}
                      title={skill.enabled ? "غیرفعال کردن" : "فعال کردن"}
                      aria-label={
                        skill.enabled ? "غیرفعال کردن مهارت" : "فعال کردن مهارت"
                      }>
                      {skill.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(skill)}
                      title="ویرایش"
                      aria-label="ویرایش مهارت">
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() => void handleDelete(skill)}
                      title="حذف"
                      aria-label="حذف مهارت">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="skill-card-title">
                  <div>
                    <h3>{faTranslation?.title || skill.name}</h3>
                    <span>{skill.name}</span>
                  </div>

                  {skill.featured && (
                    <span className="skill-featured">
                      <Star size={12} fill="currentColor" />
                      ویژه
                    </span>
                  )}
                </div>

                {faTranslation?.description && (
                  <p className="skill-description">
                    {faTranslation.description}
                  </p>
                )}

                <div className="skill-card-meta">
                  <span>{skill.category || "بدون دسته‌بندی"}</span>
                  <span>
                    {skill.translations.length} زبان
                    {enTranslation ? " · EN" : ""}
                  </span>
                </div>

                <div className="skill-level">
                  <div className="skill-level-heading">
                    <span>سطح تسلط</span>
                    <strong>{level}٪</strong>
                  </div>

                  <div
                    className="skill-progress-track"
                    role="progressbar"
                    aria-label={`سطح تسلط ${skill.name}`}
                    aria-valuenow={level}
                    aria-valuemin={0}
                    aria-valuemax={100}>
                    <span style={{ width: `${level}%` }} />
                  </div>
                </div>

                <div className="skill-card-footer">
                  <span
                    className={
                      skill.enabled
                        ? "skill-status enabled"
                        : "skill-status disabled"
                    }>
                    <span />
                    {skill.enabled ? "فعال در سایت" : "غیرفعال"}
                  </span>

                  <small>ترتیب نمایش: {skill.sortOrder}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="skills-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}>
          <section
            className="skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="skills-modal-title">
            <header className="skills-modal-header">
              <div>
                <span className="skills-eyebrow">
                  <Sparkles size={14} />
                  مدیریت مهارت
                </span>

                <h2 id="skills-modal-title">
                  {editingSkill ? "ویرایش مهارت" : "افزودن مهارت جدید"}
                </h2>

                <p>اطلاعات مهارت و ترجمه‌های آن را وارد کن.</p>
              </div>

              <button
                type="button"
                className="skills-modal-close"
                onClick={closeModal}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="skills-modal-body">
                {error && (
                  <div className="skills-error">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن پیام">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="skills-form-grid">
                  <label className="skills-field skills-field-full">
                    <span>نام فنی مهارت *</span>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="مثلاً React.js"
                      required
                      maxLength={100}
                      dir="ltr"
                    />

                    <small>
                      نام اصلی مهارت برای شناسایی و جست‌وجو استفاده می‌شود.
                    </small>
                  </label>

                  <label className="skills-field">
                    <span>دسته‌بندی</span>

                    <input
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      placeholder="مثلاً Frontend"
                      maxLength={100}
                      dir="auto"
                    />
                  </label>

                  <div className="skills-field">
                    <span className="skills-field-label">آیکون مهارت</span>

                    <IconPicker
                      value={form.icon}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          icon: value,
                        }))
                      }
                    />
                  </div>

                  <label className="skills-field">
                    <span>سطح تسلط: {form.level}٪</span>

                    <input
                      className="skills-range"
                      type="range"
                      min={0}
                      max={100}
                      value={form.level}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          level: Number(event.target.value),
                        }))
                      }
                    />
                  </label>

                  <label className="skills-field">
                    <span>ترتیب نمایش</span>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.sortOrder}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sortOrder: Math.max(0, Number(event.target.value)),
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="skills-switches">
                  <label className="skills-switch">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          featured: event.target.checked,
                        }))
                      }
                    />

                    <span className="skills-switch-ui" />

                    <span>
                      <strong>مهارت ویژه</strong>
                      <small>در اولویت نمایش قرار بگیرد.</small>
                    </span>
                  </label>

                  <label className="skills-switch">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          enabled: event.target.checked,
                        }))
                      }
                    />

                    <span className="skills-switch-ui" />

                    <span>
                      <strong>فعال بودن</strong>
                      <small>در سایت عمومی نمایش داده شود.</small>
                    </span>
                  </label>
                </div>

                <div className="skills-translation-section">
                  <div className="skills-section-heading">
                    <div>
                      <h3>ترجمه‌ها</h3>
                      <p>حداقل یک عنوان ترجمه باید وارد شود.</p>
                    </div>
                  </div>

                  <div className="skills-language-tabs">
                    {LANGUAGES.map((language) => {
                      const hasTitle = Boolean(
                        form.translations[language.value].title.trim(),
                      );

                      return (
                        <button
                          type="button"
                          key={language.value}
                          className={
                            activeLanguage === language.value ? "active" : ""
                          }
                          onClick={() => setActiveLanguage(language.value)}>
                          {language.label}
                          {hasTitle && <span />}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="skills-translation-fields"
                    dir={
                      LANGUAGES.find(
                        (language) => language.value === activeLanguage,
                      )?.direction
                    }>
                    <label className="skills-field">
                      <span>
                        عنوان مهارت (
                        {
                          LANGUAGES.find(
                            (language) => language.value === activeLanguage,
                          )?.label
                        }
                        )
                      </span>

                      <input
                        value={form.translations[activeLanguage].title}
                        onChange={(event) =>
                          updateTranslation("title", event.target.value)
                        }
                        placeholder={
                          activeLanguage === "fa"
                            ? "مثلاً توسعه رابط کاربری"
                            : "Skill title"
                        }
                        maxLength={100}
                      />
                    </label>

                    <label className="skills-field">
                      <span>توضیحات</span>

                      <textarea
                        rows={3}
                        value={form.translations[activeLanguage].description}
                        onChange={(event) =>
                          updateTranslation("description", event.target.value)
                        }
                        placeholder="توضیح کوتاهی درباره این مهارت..."
                      />
                    </label>
                  </div>
                </div>
              </div>

              <footer className="skills-modal-footer">
                <button
                  type="button"
                  className="skills-secondary-button"
                  onClick={closeModal}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="skills-primary-button"
                  disabled={saving}>
                  {saving
                    ? "در حال ذخیره..."
                    : editingSkill
                      ? "ذخیره تغییرات"
                      : "ایجاد مهارت"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SkillsPage;
