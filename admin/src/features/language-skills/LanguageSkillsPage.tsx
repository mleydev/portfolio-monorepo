import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Globe2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../../lib/api";
import "./LanguageSkillsPage.css";

type Language = "fa" | "en" | "tr" | "ar";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "NATIVE";

type Translation = {
  language: Language;
  title: string;
  description: string;
};

type LanguageSkill = {
  id: string;
  name: string;
  level: CEFRLevel;
  proficiency: number;
  enabled: boolean;
  sortOrder: number;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
};

type LanguageSkillForm = {
  name: string;
  level: CEFRLevel;
  proficiency: number;
  enabled: boolean;
  sortOrder: number;
  translations: Translation[];
};

const LANGUAGES: {
  code: Language;
  label: string;
  direction: "rtl" | "ltr";
}[] = [
  { code: "fa", label: "فارسی", direction: "rtl" },
  { code: "en", label: "English", direction: "ltr" },
  { code: "tr", label: "Türkçe", direction: "ltr" },
  { code: "ar", label: "العربية", direction: "rtl" },
];

const CEFR_LEVELS: {
  value: CEFRLevel;
  label: string;
  description: string;
}[] = [
  { value: "A1", label: "A1", description: "مبتدی" },
  { value: "A2", label: "A2", description: "پایه" },
  { value: "B1", label: "B1", description: "متوسط" },
  { value: "B2", label: "B2", description: "متوسط رو به بالا" },
  { value: "C1", label: "C1", description: "پیشرفته" },
  { value: "C2", label: "C2", description: "تسلط کامل" },
  { value: "NATIVE", label: "Native", description: "زبان مادری" },
];

const createEmptyForm = (): LanguageSkillForm => ({
  name: "",
  level: "A1",
  proficiency: 20,
  enabled: true,
  sortOrder: 0,
  translations: LANGUAGES.map(({ code }) => ({
    language: code,
    title: "",
    description: "",
  })),
});

const getErrorMessage = (error: unknown): string => {
  const response = (
    error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    }
  )?.response?.data?.message;

  if (Array.isArray(response)) return response.join("، ");
  if (typeof response === "string") return response;

  return "عملیات انجام نشد. لطفاً دوباره تلاش کنید.";
};

// const getLevelLabel = (level: CEFRLevel) =>
//   CEFR_LEVELS.find((item) => item.value === level)?.description ?? level;

function LanguageSkillsPage() {
  const [skills, setSkills] = useState<LanguageSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<LanguageSkill | null>(null);
  const [form, setForm] = useState<LanguageSkillForm>(createEmptyForm);
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const fetchSkills = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<LanguageSkill[]>("/admin/language-skills");

      setSkills(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSkills();
  }, []);

  const filteredSkills = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        !normalizedSearch ||
        skill.name.toLowerCase().includes(normalizedSearch) ||
        skill.translations.some((translation) =>
          translation.title.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" && skill.enabled) ||
        (statusFilter === "disabled" && !skill.enabled);

      const matchesLevel = levelFilter === "all" || skill.level === levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [skills, search, statusFilter, levelFilter]);

  const stats = useMemo(
    () => ({
      total: skills.length,
      enabled: skills.filter((skill) => skill.enabled).length,
      average: skills.length
        ? Math.round(
            skills.reduce((sum, skill) => sum + skill.proficiency, 0) /
              skills.length,
          )
        : 0,
      advanced: skills.filter((skill) =>
        ["C1", "C2", "NATIVE"].includes(skill.level),
      ).length,
    }),
    [skills],
  );

  const openCreateModal = () => {
    setEditingSkill(null);
    setForm(createEmptyForm());
    setActiveLanguage("fa");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (skill: LanguageSkill) => {
    setEditingSkill(skill);

    const translations = LANGUAGES.map(({ code }) => {
      const existing = skill.translations.find(
        (translation) => translation.language === code,
      );

      return {
        language: code,
        title: existing?.title ?? "",
        description: existing?.description ?? "",
      };
    });

    setForm({
      name: skill.name,
      level: skill.level,
      proficiency: skill.proficiency,
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
      translations: current.translations.map((translation) =>
        translation.language === activeLanguage
          ? { ...translation, [field]: value }
          : translation,
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const translations = form.translations
      .filter((translation) => translation.title.trim())
      .map((translation) => ({
        language: translation.language,
        title: translation.title.trim(),
        ...(translation.description.trim()
          ? { description: translation.description.trim() }
          : {}),
      }));

    if (translations.length === 0) {
      setError("حداقل ترجمه یک زبان را وارد کنید.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      level: form.level,
      proficiency: Number(form.proficiency),
      enabled: form.enabled,
      sortOrder: Number(form.sortOrder),
      translations,
    };

    try {
      if (editingSkill) {
        await api.patch(`/admin/language-skills/${editingSkill.id}`, payload);
        setNotice("اطلاعات زبان با موفقیت ویرایش شد.");
      } else {
        await api.post("/admin/language-skills", payload);
        setNotice("زبان جدید با موفقیت اضافه شد.");
      }

      setModalOpen(false);
      await fetchSkills();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill: LanguageSkill) => {
    const confirmed = window.confirm(
      `آیا از حذف زبان «${skill.name}» مطمئن هستید؟`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/language-skills/${skill.id}`);
      setNotice("زبان با موفقیت حذف شد.");
      await fetchSkills();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleEnabled = async (skill: LanguageSkill) => {
    setError("");
    setNotice("");

    try {
      await api.patch(`/admin/language-skills/${skill.id}`, {
        enabled: !skill.enabled,
      });

      setSkills((current) =>
        current.map((item) =>
          item.id === skill.id ? { ...item, enabled: !item.enabled } : item,
        ),
      );

      setNotice(skill.enabled ? "زبان غیرفعال شد." : "زبان فعال شد.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getTranslation = (skill: LanguageSkill) =>
    skill.translations.find((translation) => translation.language === "fa") ??
    skill.translations[0];

  const currentTranslation = form.translations.find(
    (translation) => translation.language === activeLanguage,
  );

  return (
    <div className="language-skills-page">
      <div className="language-skills-heading">
        <div>
          <span className="language-skills-eyebrow">
            <Globe2 size={14} />
            مدیریت توانایی‌های زبانی
          </span>
          <h1>زبان‌ها</h1>
          <p>
            زبان‌هایی که می‌دانی، سطح تسلط و توضیحات چندزبانه آن‌ها را مدیریت
            کن.
          </p>
        </div>

        <button
          className="language-skills-primary-button"
          onClick={openCreateModal}>
          <Plus size={17} />
          افزودن زبان
        </button>
      </div>

      {notice && (
        <div className="language-skills-notice">
          <Check size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="بستن">
            <X size={15} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="language-skills-error">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="بستن">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="language-skills-stats">
        <article className="language-skills-stat">
          <span className="language-skills-stat-icon purple">
            <Globe2 size={20} />
          </span>
          <div>
            <small>کل زبان‌ها</small>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="language-skills-stat">
          <span className="language-skills-stat-icon green">
            <Check size={20} />
          </span>
          <div>
            <small>زبان‌های فعال</small>
            <strong>{stats.enabled}</strong>
          </div>
        </article>

        <article className="language-skills-stat">
          <span className="language-skills-stat-icon blue">
            <Award size={20} />
          </span>
          <div>
            <small>میانگین تسلط</small>
            <strong>{stats.average}٪</strong>
          </div>
        </article>

        <article className="language-skills-stat">
          <span className="language-skills-stat-icon orange">
            <BookOpen size={20} />
          </span>
          <div>
            <small>سطوح پیشرفته</small>
            <strong>{stats.advanced}</strong>
          </div>
        </article>
      </section>

      <div className="language-skills-toolbar">
        <label className="language-skills-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجوی زبان..."
          />
        </label>

        <label className="language-skills-filter">
          <ChevronDown size={15} />
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="all">همه سطوح</option>
            {CEFR_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} - {level.description}
              </option>
            ))}
          </select>
        </label>

        <select
          className="language-skills-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">همه وضعیت‌ها</option>
          <option value="enabled">فعال</option>
          <option value="disabled">غیرفعال</option>
        </select>

        <button
          className="language-skills-refresh"
          onClick={() => void fetchSkills()}
          title="بارگذاری مجدد">
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="language-skills-results-heading">
        <h2>فهرست زبان‌ها</h2>
        <span>{filteredSkills.length} مورد</span>
      </div>

      {loading ? (
        <div className="language-skills-state">
          <LoaderCircle className="language-skills-spin" size={27} />
          <strong>در حال دریافت اطلاعات...</strong>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="language-skills-state">
          <span className="language-skills-empty-icon">
            <Globe2 size={25} />
          </span>
          <strong>
            {skills.length === 0
              ? "هنوز زبانی ثبت نشده است."
              : "زبانی با این فیلترها پیدا نشد."}
          </strong>
          <p>برای شروع، زبان جدیدی به فهرست اضافه کن.</p>
        </div>
      ) : (
        <div className="language-skills-grid">
          {filteredSkills.map((skill) => {
            const translation = getTranslation(skill);

            return (
              <article className="language-skill-card" key={skill.id}>
                <div className="language-skill-card-top">
                  <span className="language-skill-card-icon">
                    <Globe2 size={21} />
                  </span>

                  <div className="language-skill-card-actions">
                    <button
                      onClick={() => openEditModal(skill)}
                      title="ویرایش"
                      aria-label="ویرایش">
                      <Pencil size={15} />
                    </button>
                    <button
                      className="delete"
                      onClick={() => void handleDelete(skill)}
                      title="حذف"
                      aria-label="حذف">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="language-skill-card-title">
                  <div>
                    <h3>{translation?.title ?? skill.name}</h3>
                    <span>{skill.name}</span>
                  </div>
                  <span className="language-skill-level">{skill.level}</span>
                </div>

                <p className="language-skill-description">
                  {translation?.description || "توضیحی ثبت نشده است."}
                </p>

                <div className="language-skill-progress">
                  <div>
                    <span>درصد تسلط</span>
                    <strong>{skill.proficiency}٪</strong>
                  </div>
                  <div className="language-skill-progress-track">
                    <span style={{ width: `${skill.proficiency}%` }} />
                  </div>
                </div>

                <div className="language-skill-card-footer">
                  <span
                    className={`language-skill-status ${
                      skill.enabled ? "enabled" : "disabled"
                    }`}>
                    <i />
                    {skill.enabled ? "فعال" : "غیرفعال"}
                  </span>

                  <button
                    className="language-skill-toggle"
                    onClick={() => void toggleEnabled(skill)}>
                    {skill.enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="language-skills-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}>
          <section
            className="language-skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-skills-modal-title">
            <header className="language-skills-modal-header">
              <div>
                <span className="language-skills-eyebrow">
                  <Globe2 size={13} />
                  مدیریت زبان‌ها
                </span>
                <h2 id="language-skills-modal-title">
                  {editingSkill ? "ویرایش زبان" : "افزودن زبان جدید"}
                </h2>
                <p>اطلاعات زبان و ترجمه‌های آن را وارد کن.</p>
              </div>

              <button
                className="language-skills-modal-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="بستن">
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="language-skills-modal-body">
                {error && (
                  <div className="language-skills-error">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="language-skills-form-grid">
                  <label className="language-skills-field">
                    <span>نام زبان (انگلیسی)</span>
                    <input
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="مثلاً English"
                      dir="ltr"
                    />
                  </label>

                  <label className="language-skills-field">
                    <span>سطح زبان (CEFR)</span>
                    <select
                      value={form.level}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          level: event.target.value as CEFRLevel,
                        }))
                      }>
                      {CEFR_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="language-skills-field">
                    <span>ترتیب نمایش</span>
                    <input
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sortOrder: Number(event.target.value),
                        }))
                      }
                    />
                  </label>

                  <label className="language-skills-field">
                    <span>
                      درصد تسلط: <strong>{form.proficiency}٪</strong>
                    </span>
                    <input
                      className="language-skills-range"
                      type="range"
                      min={0}
                      max={100}
                      value={form.proficiency}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          proficiency: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>

                <label className="language-skills-switch">
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
                  <span className="language-skills-switch-ui" />
                  <span>
                    <strong>نمایش در سایت</strong>
                    <small>
                      در صورت فعال بودن، این زبان در سایت نمایش داده می‌شود.
                    </small>
                  </span>
                </label>

                <section className="language-skills-translations">
                  <div className="language-skills-section-heading">
                    <h3>ترجمه‌ها</h3>
                    <p>عنوان و توضیحات زبان را برای زبان‌های سایت وارد کن.</p>
                  </div>

                  <div className="language-skills-language-tabs">
                    {LANGUAGES.map((language) => {
                      const hasTitle = Boolean(
                        form.translations
                          .find((item) => item.language === language.code)
                          ?.title.trim(),
                      );

                      return (
                        <button
                          type="button"
                          key={language.code}
                          className={
                            activeLanguage === language.code ? "active" : ""
                          }
                          onClick={() => setActiveLanguage(language.code)}>
                          {language.label}
                          {hasTitle && <span />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="language-skills-translation-fields">
                    <label className="language-skills-field">
                      <span>عنوان</span>
                      <input
                        required={activeLanguage === "fa"}
                        maxLength={100}
                        value={currentTranslation?.title ?? ""}
                        onChange={(event) =>
                          updateTranslation("title", event.target.value)
                        }
                        placeholder="مثلاً زبان انگلیسی"
                        dir={
                          LANGUAGES.find((item) => item.code === activeLanguage)
                            ?.direction
                        }
                      />
                    </label>

                    <label className="language-skills-field">
                      <span>توضیحات</span>
                      <textarea
                        maxLength={1000}
                        rows={3}
                        value={currentTranslation?.description ?? ""}
                        onChange={(event) =>
                          updateTranslation("description", event.target.value)
                        }
                        placeholder="توضیح کوتاهی درباره سطح زبان..."
                        dir={
                          LANGUAGES.find((item) => item.code === activeLanguage)
                            ?.direction
                        }
                      />
                    </label>
                  </div>
                </section>
              </div>

              <footer className="language-skills-modal-footer">
                <button
                  type="button"
                  className="language-skills-secondary-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="language-skills-primary-button"
                  disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="language-skills-spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  {saving ? "در حال ذخیره..." : "ذخیره اطلاعات"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default LanguageSkillsPage;
