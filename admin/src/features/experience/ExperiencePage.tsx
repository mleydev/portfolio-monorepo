import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../../lib/api";
import "./ExperiencePage.css";
import LocalizedDatePicker from "../../components/date-picker/LocalizedDatePicker";

type Language = "fa" | "en" | "tr" | "ar";
type StatusFilter = "all" | "enabled" | "disabled";
type PeriodFilter = "all" | "current" | "past";

interface ExperienceTranslation {
  id?: string;
  language: Language;
  title: string;
  description: string;
}

interface Experience {
  id: string;
  organization: string;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  enabled: boolean;
  sortOrder: number;
  translations: ExperienceTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface TranslationForm {
  title: string;
  description: string;
}

interface ExperienceForm {
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  enabled: boolean;
  sortOrder: number;
  translations: Record<Language, TranslationForm>;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "fa", label: "فارسی" },
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
];

const EMPTY_FORM: ExperienceForm = {
  organization: "",
  position: "",
  startDate: "",
  endDate: "",
  current: false,
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
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response as {
      data?: { message?: string | string[] };
    };

    const message = response.data?.message;

    if (Array.isArray(message)) return message.join("، ");
    if (message) return message;
  }

  return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
};

const formatDate = (value: string | null): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
  }).format(date);
};

const toISOString = (value: string): string | null => {
  if (!value) return null;

  // Convert Persian and Arabic digits to English digits.
  const normalizedValue = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

  const [year, month, day] = normalizedValue
    .slice(0, 10)
    .split("-")
    .map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
};

const toDateInput = (value: string | null): string => {
  if (!value) return "";
  return value.slice(0, 10);
};

const createFormFromExperience = (experience: Experience): ExperienceForm => {
  const translations = { ...EMPTY_FORM.translations };

  experience.translations.forEach((translation) => {
    translations[translation.language] = {
      title: translation.title ?? "",
      description: translation.description ?? "",
    };
  });

  return {
    organization: experience.organization,
    position: experience.position ?? "",
    startDate: toDateInput(experience.startDate),
    endDate: toDateInput(experience.endDate),
    current: experience.current,
    enabled: experience.enabled,
    sortOrder: experience.sortOrder,
    translations,
  };
};

const getExperienceTitle = (experience: Experience): string => {
  const translation =
    experience.translations.find((item) => item.language === "fa") ??
    experience.translations[0];

  return translation?.title || experience.position || "بدون عنوان";
};

const getExperienceDescription = (experience: Experience): string => {
  const translation =
    experience.translations.find((item) => item.language === "fa") ??
    experience.translations[0];

  return translation?.description || "";
};

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null,
  );

  const [form, setForm] = useState<ExperienceForm>(EMPTY_FORM);
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Experience[]>("/admin/experience");
      setExperiences(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchExperiences();
  }, []);

  const stats = useMemo(
    () => ({
      total: experiences.length,
      enabled: experiences.filter((item) => item.enabled).length,
      current: experiences.filter((item) => item.current).length,
      disabled: experiences.filter((item) => !item.enabled).length,
    }),
    [experiences],
  );

  const filteredExperiences = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return experiences
      .filter((experience) => {
        const searchableText = [
          experience.organization,
          experience.position ?? "",
          ...experience.translations.flatMap((translation) => [
            translation.title,
            translation.description ?? "",
          ]),
        ]
          .join(" ")
          .toLocaleLowerCase();

        const matchesSearch =
          !normalizedSearch || searchableText.includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "enabled" && experience.enabled) ||
          (statusFilter === "disabled" && !experience.enabled);

        const matchesPeriod =
          periodFilter === "all" ||
          (periodFilter === "current" && experience.current) ||
          (periodFilter === "past" && !experience.current);

        return matchesSearch && matchesStatus && matchesPeriod;
      })
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          (b.startDate ?? "").localeCompare(a.startDate ?? ""),
      );
  }, [experiences, search, statusFilter, periodFilter]);

  const openCreateModal = () => {
    setEditingExperience(null);
    setForm({
      ...EMPTY_FORM,
      translations: {
        fa: { ...EMPTY_FORM.translations.fa },
        en: { ...EMPTY_FORM.translations.en },
        tr: { ...EMPTY_FORM.translations.tr },
        ar: { ...EMPTY_FORM.translations.ar },
      },
    });
    setActiveLanguage("fa");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (experience: Experience) => {
    setEditingExperience(experience);
    setForm(createFormFromExperience(experience));
    setActiveLanguage("fa");
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingExperience(null);
    setError("");
  };

  const updateField = <K extends keyof ExperienceForm>(
    field: K,
    value: ExperienceForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateTranslation = (field: keyof TranslationForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      translations: {
        ...previous.translations,
        [activeLanguage]: {
          ...previous.translations[activeLanguage],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.organization.trim()) {
      setError("نام سازمان یا شرکت الزامی است.");
      return;
    }

    if (!form.translations.fa.title.trim()) {
      setActiveLanguage("fa");
      setError("عنوان سابقه شغلی به زبان فارسی الزامی است.");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      return;
    }

    const payload = {
      organization: form.organization.trim(),
      position: form.position.trim() || null,
      startDate: toISOString(form.startDate),
      endDate: form.current ? null : toISOString(form.endDate),
      current: form.current,
      enabled: form.enabled,
      sortOrder: Math.max(0, Math.floor(form.sortOrder)),
      translations: LANGUAGES.map(({ value }) => ({
        language: value,
        title: form.translations[value].title.trim(),
        description: form.translations[value].description.trim(),
      })).filter((translation) => translation.title || translation.description),
    };

    console.log("DATE DEBUG:", {
      formStartDate: form.startDate,
      formEndDate: form.endDate,
      payloadStartDate: payload.startDate,
      payloadEndDate: payload.endDate,
      payload,
    });

    try {
      setSubmitting(true);

      if (editingExperience) {
        const response = await api.patch<Experience>(
          `/admin/experience/${editingExperience.id}`,
          payload,
        );

        setExperiences((previous) =>
          previous.map((item) =>
            item.id === editingExperience.id ? response.data : item,
          ),
        );

        setNotice("سابقه کاری با موفقیت ویرایش شد.");
      } else {
        const response = await api.post<Experience>(
          "/admin/experience",
          payload,
        );

        setExperiences((previous) => [response.data, ...previous]);
        setNotice("سابقه کاری جدید با موفقیت ثبت شد.");
      }

      setModalOpen(false);
      setEditingExperience(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (experience: Experience) => {
    setError("");
    setNotice("");

    try {
      const response = await api.patch<Experience>(
        `/admin/experience/${experience.id}`,
        { enabled: !experience.enabled },
      );

      setExperiences((previous) =>
        previous.map((item) =>
          item.id === experience.id ? response.data : item,
        ),
      );

      setNotice(
        response.data.enabled
          ? "سابقه کاری فعال شد."
          : "سابقه کاری غیرفعال شد.",
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (experience: Experience) => {
    const confirmed = window.confirm(
      `آیا از حذف سابقه «${getExperienceTitle(experience)}» مطمئن هستید؟`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/experience/${experience.id}`);

      setExperiences((previous) =>
        previous.filter((item) => item.id !== experience.id),
      );

      setNotice("سابقه کاری با موفقیت حذف شد.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="experience-page" dir="rtl">
      <header className="experience-header">
        <div>
          <div className="experience-eyebrow">
            <BriefcaseBusiness size={15} />
            مدیریت محتوای سایت
          </div>

          <h1>سوابق کاری</h1>
          <p>سوابق شغلی و تجربیات حرفه‌ای خود را مدیریت و به‌روزرسانی کنید.</p>
        </div>

        <button
          type="button"
          className="experience-primary-button"
          onClick={openCreateModal}>
          <Plus size={18} />
          افزودن سابقه کاری
        </button>
      </header>

      {notice && (
        <div className="experience-alert experience-alert--success">
          <Check size={17} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="experience-alert experience-alert--error">
          <CircleAlert size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="experience-stats">
        <div className="experience-stat-card">
          <div className="experience-stat-icon">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <span>تمام سوابق</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="experience-stat-card">
          <div className="experience-stat-icon experience-stat-icon--green">
            <Check size={20} />
          </div>
          <div>
            <span>سوابق فعال</span>
            <strong>{stats.enabled}</strong>
          </div>
        </div>

        <div className="experience-stat-card">
          <div className="experience-stat-icon experience-stat-icon--purple">
            <Clock3 size={20} />
          </div>
          <div>
            <span>در حال همکاری</span>
            <strong>{stats.current}</strong>
          </div>
        </div>

        <div className="experience-stat-card">
          <div className="experience-stat-icon experience-stat-icon--orange">
            <X size={20} />
          </div>
          <div>
            <span>سوابق غیرفعال</span>
            <strong>{stats.disabled}</strong>
          </div>
        </div>
      </section>

      <section className="experience-toolbar">
        <div className="experience-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="جست‌وجو در عنوان، سازمان یا توضیحات..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="پاک کردن جست‌وجو"
              onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <label className="experience-filter">
          <span>وضعیت انتشار</span>
          <div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }>
              <option value="all">همه وضعیت‌ها</option>
              <option value="enabled">فعال</option>
              <option value="disabled">غیرفعال</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </label>

        <label className="experience-filter">
          <span>وضعیت شغلی</span>
          <div>
            <select
              value={periodFilter}
              onChange={(event) =>
                setPeriodFilter(event.target.value as PeriodFilter)
              }>
              <option value="all">همه سوابق</option>
              <option value="current">در حال همکاری</option>
              <option value="past">پایان‌یافته</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </label>

        <button
          type="button"
          className="experience-refresh-button"
          onClick={() => void fetchExperiences()}
          disabled={loading}
          title="بارگذاری مجدد">
          <RefreshCw size={17} className={loading ? "is-spinning" : ""} />
        </button>
      </section>

      <div className="experience-results-heading">
        <h2>فهرست سوابق کاری</h2>
        <span>{filteredExperiences.length} مورد</span>
      </div>

      {loading ? (
        <div className="experience-state">
          <RefreshCw size={25} className="is-spinning" />
          <p>در حال دریافت سوابق کاری...</p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <div className="experience-empty">
          <div className="experience-empty-icon">
            <BriefcaseBusiness size={30} />
          </div>
          <h3>
            {experiences.length === 0
              ? "هنوز سابقه کاری ثبت نشده است"
              : "موردی پیدا نشد"}
          </h3>
          <p>
            {experiences.length === 0
              ? "اولین سابقه کاری خود را ثبت کنید."
              : "عبارت جست‌وجو یا فیلترها را تغییر دهید."}
          </p>
          {experiences.length === 0 && (
            <button
              type="button"
              className="experience-primary-button"
              onClick={openCreateModal}>
              <Plus size={17} />
              افزودن سابقه کاری
            </button>
          )}
        </div>
      ) : (
        <section className="experience-grid">
          {filteredExperiences.map((experience) => (
            <article className="experience-card" key={experience.id}>
              <div className="experience-card-top">
                <div className="experience-card-icon">
                  <BriefcaseBusiness size={22} />
                </div>

                <div className="experience-card-actions">
                  <button
                    type="button"
                    title="ویرایش"
                    onClick={() => openEditModal(experience)}>
                    <Edit3 size={17} />
                  </button>
                  <button
                    type="button"
                    title="حذف"
                    className="experience-delete-action"
                    onClick={() => void handleDelete(experience)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <div className="experience-card-content">
                <h3>{getExperienceTitle(experience)}</h3>
                <p className="experience-card-position">
                  {experience.position || "عنوان شغلی ثبت نشده"}
                </p>
                <p className="experience-card-organization">
                  {experience.organization}
                </p>

                {getExperienceDescription(experience) && (
                  <p className="experience-card-description">
                    {getExperienceDescription(experience)}
                  </p>
                )}
              </div>

              <div className="experience-card-date">
                <CalendarDays size={15} />
                <span>
                  {formatDate(experience.startDate)}
                  {" — "}
                  {experience.current
                    ? "اکنون"
                    : formatDate(experience.endDate)}
                </span>
              </div>

              <div className="experience-card-footer">
                <div className="experience-card-badges">
                  <span
                    className={
                      experience.enabled
                        ? "experience-badge experience-badge--enabled"
                        : "experience-badge experience-badge--disabled"
                    }>
                    {experience.enabled ? "فعال" : "غیرفعال"}
                  </span>

                  <span
                    className={
                      experience.current
                        ? "experience-badge experience-badge--current"
                        : "experience-badge experience-badge--past"
                    }>
                    {experience.current ? "در حال همکاری" : "پایان‌یافته"}
                  </span>
                </div>

                <button
                  type="button"
                  className="experience-toggle-button"
                  onClick={() => void handleToggleEnabled(experience)}>
                  {experience.enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}
                </button>
              </div>

              <div className="experience-card-order">
                ترتیب نمایش: {experience.sortOrder}
              </div>
            </article>
          ))}
        </section>
      )}

      {modalOpen && (
        <div
          className="experience-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}>
          <section
            className="experience-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="experience-modal-title">
            <header className="experience-modal-header">
              <div>
                <span>مدیریت سوابق کاری</span>
                <h2 id="experience-modal-title">
                  {editingExperience
                    ? "ویرایش سابقه کاری"
                    : "افزودن سابقه کاری"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="بستن">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="experience-modal-body">
                {error && (
                  <div className="experience-alert experience-alert--error">
                    <CircleAlert size={17} />
                    <span>{error}</span>
                  </div>
                )}

                <section className="experience-form-section">
                  <div className="experience-form-section-heading">
                    <BriefcaseBusiness size={17} />
                    <h3>اطلاعات شغلی</h3>
                  </div>

                  <div className="experience-form-grid">
                    <label className="experience-field">
                      <span>نام سازمان / شرکت *</span>
                      <input
                        type="text"
                        maxLength={200}
                        value={form.organization}
                        onChange={(event) =>
                          updateField("organization", event.target.value)
                        }
                        placeholder="مثلاً شرکت فناوری..."
                        required
                      />
                    </label>

                    <label className="experience-field">
                      <span>عنوان شغلی</span>
                      <input
                        type="text"
                        maxLength={200}
                        value={form.position}
                        onChange={(event) =>
                          updateField("position", event.target.value)
                        }
                        placeholder="مثلاً Frontend Developer"
                      />
                    </label>
                    <LocalizedDatePicker
                      label="تاریخ شروع"
                      language="fa"
                      value={form.startDate || null}
                      onChange={(value) => {
                        console.log("[ExperiencePage] Start date:", value);
                        updateField("startDate", value ?? "");
                      }}
                    />

                    <LocalizedDatePicker
                      label="تاریخ پایان"
                      language="fa"
                      value={form.endDate || null}
                      onChange={(value) => {
                        console.log("[ExperiencePage] End date:", value);
                        updateField("endDate", value ?? "");
                      }}
                      disabled={form.current}
                    />
                    <label className="experience-field">
                      <span>ترتیب نمایش</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={form.sortOrder}
                        onChange={(event) =>
                          updateField(
                            "sortOrder",
                            Math.max(0, Number(event.target.value) || 0),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="experience-form-options">
                    <label className="experience-check-option">
                      <input
                        type="checkbox"
                        checked={form.current}
                        onChange={(event) => {
                          updateField("current", event.target.checked);
                          if (event.target.checked) {
                            updateField("endDate", "");
                          }
                        }}
                      />
                      <span>
                        <strong>در حال حاضر در این موقعیت مشغول هستم</strong>
                        <small>تاریخ پایان برای این سابقه ثبت نمی‌شود.</small>
                      </span>
                    </label>

                    <label className="experience-check-option">
                      <input
                        type="checkbox"
                        checked={form.enabled}
                        onChange={(event) =>
                          updateField("enabled", event.target.checked)
                        }
                      />
                      <span>
                        <strong>نمایش در وب‌سایت</strong>
                        <small>
                          در صورت غیرفعال بودن، در بخش عمومی نمایش داده نمی‌شود.
                        </small>
                      </span>
                    </label>
                  </div>
                </section>

                <section className="experience-form-section">
                  <div className="experience-form-section-heading">
                    <span className="experience-translation-symbol">文</span>
                    <div>
                      <h3>محتوای چندزبانه</h3>
                      <p>
                        عنوان و توضیحات این سابقه را به زبان‌های مختلف وارد
                        کنید.
                      </p>
                    </div>
                  </div>

                  <div className="experience-language-tabs">
                    {LANGUAGES.map((language) => (
                      <button
                        type="button"
                        key={language.value}
                        className={
                          activeLanguage === language.value ? "active" : ""
                        }
                        onClick={() => setActiveLanguage(language.value)}>
                        {language.label}
                        {form.translations[language.value].title.trim() && (
                          <Check size={13} />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="experience-translation-fields">
                    <label className="experience-field">
                      <span>
                        عنوان سابقه
                        {activeLanguage === "fa" && " *"}
                      </span>
                      <input
                        type="text"
                        maxLength={200}
                        value={form.translations[activeLanguage].title}
                        onChange={(event) =>
                          updateTranslation("title", event.target.value)
                        }
                        placeholder="عنوان این سابقه به زبان انتخاب‌شده"
                        required={activeLanguage === "fa"}
                        dir={
                          activeLanguage === "fa" || activeLanguage === "ar"
                            ? "rtl"
                            : "ltr"
                        }
                      />
                    </label>

                    <label className="experience-field">
                      <span>توضیحات</span>
                      <textarea
                        rows={5}
                        value={form.translations[activeLanguage].description}
                        onChange={(event) =>
                          updateTranslation("description", event.target.value)
                        }
                        placeholder="توضیح کوتاهی درباره مسئولیت‌ها و دستاوردها..."
                        dir={
                          activeLanguage === "fa" || activeLanguage === "ar"
                            ? "rtl"
                            : "ltr"
                        }
                      />
                    </label>
                  </div>

                  <p className="experience-translation-hint">
                    حداقل وارد کردن عنوان فارسی الزامی است. زبان‌های دیگر
                    اختیاری هستند.
                  </p>
                </section>
              </div>

              <footer className="experience-modal-footer">
                <button
                  type="button"
                  className="experience-secondary-button"
                  onClick={closeModal}
                  disabled={submitting}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="experience-primary-button"
                  disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw size={17} className="is-spinning" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      {editingExperience ? "ذخیره تغییرات" : "ثبت سابقه کاری"}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
