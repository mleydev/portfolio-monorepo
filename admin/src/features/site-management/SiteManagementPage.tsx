import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Eye,
  EyeOff,
  FileJson,
  Globe2,
  GripVertical,
  Layers3,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  X,
} from "lucide-react";

import api from "../../lib/api";
import "./SiteManagementPage.css";

type Language = "fa" | "en" | "tr" | "ar";
type Tab = "sections" | "settings";

type SectionTranslation = {
  language: Language;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  content?: Record<string, unknown> | null;
};

type HomeSection = {
  id: string;
  key: string;
  type: string;
  enabled: boolean;
  sortOrder: number;
  settings: Record<string, unknown> | null;
  translations: SectionTranslation[];
};

type SiteSettingTranslation = {
  language: Language;
  value: Record<string, unknown> | null;
};

type SiteSetting = {
  id: string;
  key: string;
  value: Record<string, unknown> | null;
  translations: SiteSettingTranslation[];
};

type TranslationForm = {
  title: string;
  subtitle: string;
  description: string;
  content: string;
};

type SectionForm = {
  key: string;
  type: string;
  enabled: boolean;
  sortOrder: number;
  settings: string;
  translations: Record<Language, TranslationForm>;
};

type SettingForm = {
  value: string;
  translations: Record<Language, string>;
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

const SETTING_KEYS = [
  { value: "site", label: "اطلاعات اصلی سایت" },
  { value: "contact", label: "اطلاعات تماس" },
  { value: "social-links", label: "شبکه‌های اجتماعی" },
  { value: "seo", label: "تنظیمات SEO" },
  { value: "footer", label: "پاورقی سایت" },
];

const SECTION_TYPES = [
  { value: "hero", label: "معرفی اصلی (Hero)" },
  { value: "about", label: "درباره من (About)" },
  { value: "projects", label: "پروژه‌ها (Projects)" },
  { value: "skills", label: "مهارت‌ها (Skills)" },
  { value: "language-skills", label: "مهارت‌های زبانی" },
  { value: "experience", label: "سوابق کاری (Experience)" },
  { value: "blog", label: "مقالات (Blog)" },
  { value: "contact", label: "ارتباط با من (Contact)" },
  { value: "custom", label: "بخش سفارشی (Custom)" },
];

const readJsonObject = (value: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Keep the editor usable while JSON is being edited.
  }

  return {};
};

const getSettingValue = (
  settings: string,
  key: string,
  fallback: string,
): string => {
  const value = readJsonObject(settings)[key];

  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
};

const getSettingBoolean = (
  settings: string,
  key: string,
  fallback: boolean,
): boolean => {
  const value = readJsonObject(settings)[key];

  return typeof value === "boolean" ? value : fallback;
};

const getTranslationContentValue = (content: string, key: string): string => {
  const value = readJsonObject(content)[key];

  return typeof value === "string" ? value : "";
};

const createEmptyTranslations = (): Record<Language, TranslationForm> => ({
  fa: { title: "", subtitle: "", description: "", content: "{}" },
  en: { title: "", subtitle: "", description: "", content: "{}" },
  tr: { title: "", subtitle: "", description: "", content: "{}" },
  ar: { title: "", subtitle: "", description: "", content: "{}" },
});

const EMPTY_SECTION_FORM: SectionForm = {
  key: "",
  type: "",
  enabled: true,
  sortOrder: 0,
  settings: "{}",
  translations: createEmptyTranslations(),
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

const formatJson = (value: unknown): string =>
  JSON.stringify(value ?? {}, null, 2);

const parseJson = (
  value: string,
  fieldName: string,
): Record<string, unknown> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`ساختار JSON مربوط به «${fieldName}» معتبر نیست.`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`مقدار «${fieldName}» باید یک آبجکت JSON باشد.`);
  }

  return parsed as Record<string, unknown>;
};

const createSettingForm = (
  settings: SiteSetting[],
  key: string,
): SettingForm => {
  const setting = settings.find((item) => item.key === key);

  const translations: Record<Language, string> = {
    fa: "{}",
    en: "{}",
    tr: "{}",
    ar: "{}",
  };

  setting?.translations.forEach((translation) => {
    translations[translation.language] = formatJson(translation.value);
  });

  return {
    value: formatJson(setting?.value),
    translations,
  };
};

function SiteManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sections");

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(
    null,
  );

  const [sectionForm, setSectionForm] =
    useState<SectionForm>(EMPTY_SECTION_FORM);

  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");

  const [selectedSetting, setSelectedSetting] = useState("site");

  const [settingForm, setSettingForm] = useState<SettingForm>({
    value: "{}",
    translations: {
      fa: "{}",
      en: "{}",
      tr: "{}",
      ar: "{}",
    },
  });

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [sectionsResponse, settingsResponse] = await Promise.all([
        api.get<HomeSection[]>("/admin/home-sections"),
        api.get<SiteSetting[]>("/admin/site-settings"),
      ]);

      setSections(sectionsResponse.data);
      setSettings(settingsResponse.data);

      setSettingForm(createSettingForm(settingsResponse.data, selectedSetting));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedSetting]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [sectionsResponse, settingsResponse] = await Promise.all([
          api.get<HomeSection[]>("/admin/home-sections"),
          api.get<SiteSetting[]>("/admin/site-settings"),
        ]);

        if (cancelled) return;

        setSections(sectionsResponse.data);
        setSettings(settingsResponse.data);
        setSettingForm(createSettingForm(settingsResponse.data, "site"));
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreateSection = () => {
    setEditingSection(null);

    setSectionForm({
      ...EMPTY_SECTION_FORM,
      translations: createEmptyTranslations(),
      sortOrder: sections.length,
    });

    setActiveLanguage("fa");
    setError("");
    setSectionModalOpen(true);
  };

  const openEditSection = (section: HomeSection) => {
    const translations = createEmptyTranslations();

    section.translations.forEach((translation) => {
      translations[translation.language] = {
        title: translation.title ?? "",
        subtitle: translation.subtitle ?? "",
        description: translation.description ?? "",
        content: formatJson(translation.content),
      };
    });

    setEditingSection(section);

    setSectionForm({
      key: section.key,
      type: section.type,
      enabled: section.enabled,
      sortOrder: section.sortOrder,
      settings: formatJson(section.settings),
      translations,
    });

    setActiveLanguage("fa");
    setError("");
    setSectionModalOpen(true);
  };

  const updateTranslation = (field: keyof TranslationForm, value: string) => {
    setSectionForm((current) => ({
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

  const updateSettingField = (
    key: string,
    value: string | number | boolean,
  ) => {
    setSectionForm((current) => {
      const currentSettings = readJsonObject(current.settings);

      return {
        ...current,
        settings: JSON.stringify(
          {
            ...currentSettings,
            [key]: value,
          },
          null,
          2,
        ),
      };
    });
  };

  const updateContentField = (key: string, value: string) => {
    setSectionForm((current) => {
      const translation = current.translations[activeLanguage];
      const content = readJsonObject(translation.content);

      return {
        ...current,
        translations: {
          ...current.translations,
          [activeLanguage]: {
            ...translation,
            content: JSON.stringify(
              {
                ...content,
                [key]: value,
              },
              null,
              2,
            ),
          },
        },
      };
    });
  };

  const handleSectionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!sectionForm.key.trim() || !sectionForm.type.trim()) {
      setError("کلید و نوع بخش الزامی هستند.");
      return;
    }

    try {
      const settingsValue = parseJson(sectionForm.settings, "تنظیمات بخش");

      const translations = LANGUAGES.map(({ value }) => {
        const translation = sectionForm.translations[value];

        return {
          language: value,
          title: translation.title.trim() || undefined,
          subtitle: translation.subtitle.trim() || undefined,
          description: translation.description.trim() || undefined,
          content: parseJson(translation.content, `محتوای زبان ${value}`),
        };
      }).filter(
        (translation) =>
          translation.title ||
          translation.subtitle ||
          translation.description ||
          Object.keys(translation.content ?? {}).length > 0,
      );

      if (translations.length === 0) {
        setError("حداقل اطلاعات یک ترجمه را وارد کن.");
        return;
      }

      const payload = {
        key: sectionForm.key.trim(),
        type: sectionForm.type.trim(),
        enabled: sectionForm.enabled,
        sortOrder: Number(sectionForm.sortOrder),
        settings: settingsValue,
        translations,
      };

      setSaving(true);

      if (editingSection) {
        await api.patch(`/admin/home-sections/${editingSection.id}`, payload);

        setNotice("بخش با موفقیت به‌روزرسانی شد.");
      } else {
        await api.post("/admin/home-sections", payload);

        setNotice("بخش جدید با موفقیت ایجاد شد.");
      }

      setSectionModalOpen(false);

      await fetchData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : getErrorMessage(requestError),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = async (section: HomeSection) => {
    setError("");
    setNotice("");

    try {
      await api.patch(`/admin/home-sections/${section.id}`, {
        enabled: !section.enabled,
      });

      setSections((current) =>
        current.map((item) =>
          item.id === section.id ? { ...item, enabled: !item.enabled } : item,
        ),
      );

      setNotice(section.enabled ? "بخش غیرفعال شد." : "بخش فعال شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const moveSection = async (section: HomeSection, direction: -1 | 1) => {
    const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

    const currentIndex = ordered.findIndex((item) => item.id === section.id);

    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    [ordered[currentIndex], ordered[targetIndex]] = [
      ordered[targetIndex],
      ordered[currentIndex],
    ];

    const reordered = ordered.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    setError("");
    setNotice("");

    try {
      await api.patch("/admin/home-sections/reorder", {
        sections: reordered.map(({ id }, index) => ({
          id,
          sortOrder: index,
        })),
      });

      setSections(reordered);
      setNotice("ترتیب بخش‌ها ذخیره شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const selectSetting = (key: string) => {
    setSelectedSetting(key);
    setSettingForm(createSettingForm(settings, key));
    setError("");
  };

  const handleSettingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setNotice("");

    try {
      const value = parseJson(settingForm.value, "تنظیمات اصلی");

      const translations = LANGUAGES.map(({ value: language }) => ({
        language,
        value: parseJson(
          settingForm.translations[language],
          `ترجمه ${language}`,
        ),
      }));

      setSaving(true);

      await api.patch(`/admin/site-settings/${selectedSetting}`, {
        value,
        translations,
      });

      setNotice("تنظیمات سایت ذخیره شد.");

      await fetchData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : getErrorMessage(requestError),
      );
    } finally {
      setSaving(false);
    }
  };

  const closeSectionModal = () => {
    if (saving) return;

    setSectionModalOpen(false);
    setEditingSection(null);
  };

  return (
    <div className="site-management-page">
      <div className="site-management-heading">
        <div>
          <span className="site-management-eyebrow">
            <Settings2 size={15} />
            پیکربندی پورتفولیو
          </span>

          <h1>مدیریت سایت</h1>

          <p>بخش‌های صفحه اصلی، ترجمه‌ها و تنظیمات عمومی سایت را مدیریت کن.</p>
        </div>

        <button
          type="button"
          className="site-management-refresh"
          onClick={() => void fetchData()}
          disabled={loading}>
          <RefreshCw size={17} />
          بروزرسانی
        </button>
      </div>

      {notice && (
        <div className="site-management-notice">
          <span>{notice}</span>

          <button type="button" onClick={() => setNotice("")} aria-label="بستن">
            <X size={16} />
          </button>
        </div>
      )}

      {error && !sectionModalOpen && (
        <div className="site-management-error">
          <span>{error}</span>

          <button type="button" onClick={() => setError("")} aria-label="بستن">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="site-management-tabs">
        <button
          type="button"
          className={activeTab === "sections" ? "active" : ""}
          onClick={() => setActiveTab("sections")}>
          <Layers3 size={17} />
          بخش‌های صفحه اصلی
          <span>{sections.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}>
          <Globe2 size={17} />
          تنظیمات سایت
        </button>
      </div>

      {loading ? (
        <div className="site-management-state">
          <RefreshCw size={22} className="site-management-loading" />
          <span>در حال دریافت اطلاعات سایت...</span>
        </div>
      ) : activeTab === "sections" ? (
        <>
          <div className="site-management-toolbar">
            <div>
              <h2>ساختار صفحه اصلی</h2>
              <p>
                بخش‌ها را فعال کن، ویرایش کن یا ترتیب نمایش آن‌ها را تغییر بده.
              </p>
            </div>

            <button
              type="button"
              className="site-management-primary"
              onClick={openCreateSection}>
              <Plus size={17} />
              افزودن بخش
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="site-management-state">
              <Layers3 size={28} />
              <strong>هنوز بخشی ثبت نشده است.</strong>

              <button
                type="button"
                className="site-management-primary"
                onClick={openCreateSection}>
                <Plus size={16} />
                ایجاد اولین بخش
              </button>
            </div>
          ) : (
            <div className="site-sections-list">
              {[...sections]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((section, index) => {
                  const fa = section.translations.find(
                    (item) => item.language === "fa",
                  );

                  return (
                    <article className="site-section-card" key={section.id}>
                      <div className="site-section-order">
                        <GripVertical size={19} />
                        <strong>{String(index + 1).padStart(2, "0")}</strong>
                      </div>

                      <div className="site-section-info">
                        <div className="site-section-title">
                          <h3>{fa?.title || section.key}</h3>

                          <span
                            className={
                              section.enabled
                                ? "site-status enabled"
                                : "site-status disabled"
                            }>
                            {section.enabled ? "فعال" : "غیرفعال"}
                          </span>
                        </div>

                        <p>
                          {fa?.description ||
                            fa?.subtitle ||
                            "برای این بخش توضیح فارسی ثبت نشده است."}
                        </p>

                        <div className="site-section-meta">
                          <span>Key: {section.key}</span>
                          <span>Type: {section.type}</span>
                          <span>{section.translations.length} زبان</span>
                          <span>ترتیب: {section.sortOrder}</span>
                        </div>
                      </div>

                      <div className="site-section-actions">
                        <button
                          type="button"
                          title="انتقال به بالا"
                          aria-label="انتقال به بالا"
                          disabled={index === 0}
                          onClick={() => void moveSection(section, -1)}>
                          <span>↑</span>
                        </button>

                        <button
                          type="button"
                          title="انتقال به پایین"
                          aria-label="انتقال به پایین"
                          disabled={index === sections.length - 1}
                          onClick={() => void moveSection(section, 1)}>
                          <span>↓</span>
                        </button>

                        <button
                          type="button"
                          title={section.enabled ? "غیرفعال کردن" : "فعال کردن"}
                          aria-label={
                            section.enabled ? "غیرفعال کردن" : "فعال کردن"
                          }
                          onClick={() => void handleToggleSection(section)}>
                          {section.enabled ? (
                            <Eye size={17} />
                          ) : (
                            <EyeOff size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="edit"
                          onClick={() => openEditSection(section)}>
                          ویرایش
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </>
      ) : (
        <div className="site-settings-layout">
          <aside className="site-settings-sidebar">
            <h2>دسته‌بندی تنظیمات</h2>

            {SETTING_KEYS.map((item) => (
              <button
                type="button"
                key={item.value}
                className={selectedSetting === item.value ? "active" : ""}
                onClick={() => selectSetting(item.value)}>
                <Settings2 size={16} />
                {item.label}
                <span>{item.value}</span>
              </button>
            ))}
          </aside>

          <form className="site-settings-editor" onSubmit={handleSettingSubmit}>
            <div className="site-settings-editor-heading">
              <div>
                <h2>
                  {SETTING_KEYS.find((item) => item.value === selectedSetting)
                    ?.label ?? selectedSetting}
                </h2>

                <p>مقادیر JSON و ترجمه‌های این تنظیم را ویرایش کن.</p>
              </div>

              <FileJson size={22} />
            </div>

            <label className="site-json-field">
              <span>مقدار اصلی (JSON)</span>

              <textarea
                dir="ltr"
                spellCheck={false}
                value={settingForm.value}
                onChange={(event) =>
                  setSettingForm((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
              />
            </label>

            <div className="site-json-translations">
              {LANGUAGES.map((language) => (
                <label className="site-json-field" key={language.value}>
                  <span>مقدار ترجمه - {language.label}</span>

                  <textarea
                    dir="ltr"
                    spellCheck={false}
                    value={settingForm.translations[language.value]}
                    onChange={(event) =>
                      setSettingForm((current) => ({
                        ...current,
                        translations: {
                          ...current.translations,
                          [language.value]: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="site-settings-footer">
              <button
                type="submit"
                className="site-management-primary"
                disabled={saving}>
                <Save size={17} />
                {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
              </button>
            </div>
          </form>
        </div>
      )}

      {sectionModalOpen && (
        <div
          className="site-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSectionModal();
            }
          }}>
          <section
            className="site-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-modal-title">
            <header className="site-modal-header">
              <div>
                <span className="site-management-eyebrow">
                  <Layers3 size={14} />
                  ساختار صفحه اصلی
                </span>

                <h2 id="site-modal-title">
                  {editingSection ? "ویرایش بخش" : "ایجاد بخش جدید"}
                </h2>

                <p>اطلاعات عمومی و ترجمه‌های بخش را مدیریت کن.</p>
              </div>

              <button
                type="button"
                onClick={closeSectionModal}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleSectionSubmit}>
              <div className="site-modal-body">
                {error && (
                  <div className="site-management-error">
                    <span>{error}</span>

                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="site-form-grid">
                  <label className="site-form-field">
                    <span>کلید یکتا *</span>

                    <input
                      dir="ltr"
                      value={sectionForm.key}
                      onChange={(event) =>
                        setSectionForm((current) => ({
                          ...current,
                          key: event.target.value,
                        }))
                      }
                      placeholder="مثلاً hero"
                      required
                      disabled={Boolean(editingSection)}
                    />
                  </label>

                  <label className="site-form-field">
                    <span>نوع بخش *</span>

                    <select
                      dir="rtl"
                      value={sectionForm.type}
                      onChange={(event) =>
                        setSectionForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      required>
                      <option value="" disabled>
                        انتخاب نوع بخش
                      </option>

                      {!SECTION_TYPES.some(
                        (item) => item.value === sectionForm.type,
                      ) &&
                        sectionForm.type && (
                          <option value={sectionForm.type}>
                            {sectionForm.type}
                          </option>
                        )}

                      {SECTION_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="site-form-field">
                    <span>ترتیب نمایش</span>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={sectionForm.sortOrder}
                      onChange={(event) =>
                        setSectionForm((current) => ({
                          ...current,
                          sortOrder: Math.max(0, Number(event.target.value)),
                        }))
                      }
                    />
                  </label>

                  <label className="site-form-switch">
                    <input
                      type="checkbox"
                      checked={sectionForm.enabled}
                      onChange={(event) =>
                        setSectionForm((current) => ({
                          ...current,
                          enabled: event.target.checked,
                        }))
                      }
                    />

                    <span>نمایش این بخش در سایت فعال باشد</span>
                  </label>
                </div>

                <section className="site-editor-section">
                  <div className="site-editor-section-heading">
                    <div>
                      <h3>تنظیمات نمایش</h3>
                      <p>چیدمان و ظاهر این بخش را مشخص کن.</p>
                    </div>

                    <Settings2 size={20} />
                  </div>

                  <div className="site-section-settings-grid">
                    <label className="site-form-field">
                      <span>نوع چیدمان</span>

                      <select
                        value={getSettingValue(
                          sectionForm.settings,
                          "layout",
                          "grid",
                        )}
                        onChange={(event) =>
                          updateSettingField("layout", event.target.value)
                        }>
                        <option value="grid">شبکه‌ای</option>
                        <option value="list">لیستی</option>
                        <option value="cards">کارت‌ها</option>
                        <option value="slider">اسلایدری</option>
                        <option value="centered">وسط‌چین</option>
                        <option value="split">دو ستونه</option>
                      </select>
                    </label>

                    <label className="site-form-field">
                      <span>تعداد ستون‌ها</span>

                      <select
                        value={getSettingValue(
                          sectionForm.settings,
                          "columns",
                          "3",
                        )}
                        onChange={(event) =>
                          updateSettingField(
                            "columns",
                            Number(event.target.value),
                          )
                        }>
                        <option value="1">یک ستون</option>
                        <option value="2">دو ستون</option>
                        <option value="3">سه ستون</option>
                        <option value="4">چهار ستون</option>
                      </select>
                    </label>

                    <label className="site-form-field">
                      <span>فاصله عمودی بخش (px)</span>

                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={getSettingValue(
                          sectionForm.settings,
                          "verticalSpacing",
                          "80",
                        )}
                        onChange={(event) =>
                          updateSettingField(
                            "verticalSpacing",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>

                    <label className="site-form-field">
                      <span>فاصله بین آیتم‌ها (px)</span>

                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={getSettingValue(
                          sectionForm.settings,
                          "gap",
                          "24",
                        )}
                        onChange={(event) =>
                          updateSettingField("gap", Number(event.target.value))
                        }
                      />
                    </label>

                    <label className="site-form-field">
                      <span>رنگ پس‌زمینه</span>

                      <div className="site-color-control">
                        <input
                          type="color"
                          value={getSettingValue(
                            sectionForm.settings,
                            "backgroundColor",
                            "#171522",
                          )}
                          onChange={(event) =>
                            updateSettingField(
                              "backgroundColor",
                              event.target.value,
                            )
                          }
                        />

                        <code>
                          {getSettingValue(
                            sectionForm.settings,
                            "backgroundColor",
                            "#171522",
                          )}
                        </code>
                      </div>
                    </label>

                    <label className="site-form-field">
                      <span>تصویر بخش (URL)</span>

                      <input
                        dir="ltr"
                        type="url"
                        value={getSettingValue(
                          sectionForm.settings,
                          "imageUrl",
                          "",
                        )}
                        onChange={(event) =>
                          updateSettingField("imageUrl", event.target.value)
                        }
                        placeholder="https://example.com/image.webp"
                      />
                    </label>
                  </div>

                  <div className="site-section-checkboxes">
                    {[
                      {
                        key: "showTitle",
                        label: "نمایش عنوان",
                      },
                      {
                        key: "showSubtitle",
                        label: "نمایش زیرعنوان",
                      },
                      {
                        key: "showDescription",
                        label: "نمایش توضیحات",
                      },
                      {
                        key: "showImage",
                        label: "نمایش تصویر",
                      },
                    ].map((item) => (
                      <label key={item.key}>
                        <input
                          type="checkbox"
                          checked={getSettingBoolean(
                            sectionForm.settings,
                            item.key,
                            true,
                          )}
                          onChange={(event) =>
                            updateSettingField(item.key, event.target.checked)
                          }
                        />

                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <div className="site-translation-editor">
                  <div className="site-translation-heading">
                    <div>
                      <h3>ترجمه‌های بخش</h3>
                      <p>حداقل یک ترجمه باید اطلاعات داشته باشد.</p>
                    </div>
                  </div>

                  <div className="site-language-tabs">
                    {LANGUAGES.map((language) => (
                      <button
                        type="button"
                        key={language.value}
                        className={
                          activeLanguage === language.value ? "active" : ""
                        }
                        onClick={() => setActiveLanguage(language.value)}>
                        {language.label}

                        {sectionForm.translations[
                          language.value
                        ].title.trim() && <span />}
                      </button>
                    ))}
                  </div>

                  <div
                    className="site-translation-fields"
                    dir={
                      LANGUAGES.find((item) => item.value === activeLanguage)
                        ?.direction
                    }>
                    <label className="site-form-field">
                      <span>عنوان</span>

                      <input
                        value={sectionForm.translations[activeLanguage].title}
                        onChange={(event) =>
                          updateTranslation("title", event.target.value)
                        }
                        placeholder="عنوان بخش"
                      />
                    </label>

                    <label className="site-form-field">
                      <span>زیرعنوان</span>

                      <input
                        value={
                          sectionForm.translations[activeLanguage].subtitle
                        }
                        onChange={(event) =>
                          updateTranslation("subtitle", event.target.value)
                        }
                        placeholder="زیرعنوان بخش"
                      />
                    </label>

                    <label className="site-form-field">
                      <span>توضیحات</span>

                      <textarea
                        rows={3}
                        value={
                          sectionForm.translations[activeLanguage].description
                        }
                        onChange={(event) =>
                          updateTranslation("description", event.target.value)
                        }
                        placeholder="توضیحات بخش"
                      />
                    </label>

                    <section className="site-editor-section">
                      <div className="site-editor-section-heading">
                        <div>
                          <h3>دکمه‌های بخش</h3>
                          <p>
                            متن و مقصد دکمه‌ها را برای زبان انتخاب‌شده تعیین کن.
                          </p>
                        </div>
                      </div>

                      <div className="site-form-grid">
                        <label className="site-form-field">
                          <span>متن دکمه اصلی</span>

                          <input
                            value={getTranslationContentValue(
                              sectionForm.translations[activeLanguage].content,
                              "primaryButtonLabel",
                            )}
                            onChange={(event) =>
                              updateContentField(
                                "primaryButtonLabel",
                                event.target.value,
                              )
                            }
                            placeholder="مشاهده پروژه‌ها"
                          />
                        </label>

                        <label className="site-form-field">
                          <span>لینک دکمه اصلی</span>

                          <input
                            dir="ltr"
                            value={getTranslationContentValue(
                              sectionForm.translations[activeLanguage].content,
                              "primaryButtonUrl",
                            )}
                            onChange={(event) =>
                              updateContentField(
                                "primaryButtonUrl",
                                event.target.value,
                              )
                            }
                            placeholder="/projects"
                          />
                        </label>

                        <label className="site-form-field">
                          <span>متن دکمه دوم</span>

                          <input
                            value={getTranslationContentValue(
                              sectionForm.translations[activeLanguage].content,
                              "secondaryButtonLabel",
                            )}
                            onChange={(event) =>
                              updateContentField(
                                "secondaryButtonLabel",
                                event.target.value,
                              )
                            }
                            placeholder="ارتباط با من"
                          />
                        </label>

                        <label className="site-form-field">
                          <span>لینک دکمه دوم</span>

                          <input
                            dir="ltr"
                            value={getTranslationContentValue(
                              sectionForm.translations[activeLanguage].content,
                              "secondaryButtonUrl",
                            )}
                            onChange={(event) =>
                              updateContentField(
                                "secondaryButtonUrl",
                                event.target.value,
                              )
                            }
                            placeholder="/contact"
                          />
                        </label>
                      </div>
                    </section>
                  </div>
                </div>

                <details className="site-advanced-settings">
                  <summary>
                    <FileJson size={17} />
                    تنظیمات پیشرفته JSON
                  </summary>

                  <label className="site-json-field">
                    <span>تنظیمات اختصاصی بخش</span>

                    <textarea
                      dir="ltr"
                      spellCheck={false}
                      value={sectionForm.settings}
                      onChange={(event) =>
                        setSectionForm((current) => ({
                          ...current,
                          settings: event.target.value,
                        }))
                      }
                    />
                  </label>
                </details>
              </div>

              <footer className="site-modal-footer">
                <button
                  type="button"
                  className="site-management-secondary"
                  onClick={closeSectionModal}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="site-management-primary"
                  disabled={saving}>
                  <Save size={16} />

                  {saving
                    ? "در حال ذخیره..."
                    : editingSection
                      ? "ذخیره تغییرات"
                      : "ایجاد بخش"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SiteManagementPage;
