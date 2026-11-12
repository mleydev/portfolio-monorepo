import { useCallback, useEffect, useMemo, useState } from "react";
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
  ChevronUp,
  ChevronDown,
  Type,
  LayoutGrid,
} from "lucide-react";
import api from "../../lib/api";
import "./SiteManagementPage.css";

type Language = "fa" | "en" | "tr" | "ar";
type Tab = "sections" | "settings";
type JsonObject = Record<string, unknown>;

type Translation = {
  language: Language;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  content?: JsonObject | null;
};

type HomeSection = {
  id: string;
  key: string;
  type: string;
  enabled: boolean;
  sortOrder: number;
  settings: JsonObject | null;
  translations: Translation[];
};

type SettingTranslation = {
  language: Language;
  value: JsonObject | null;
};

type SiteSetting = {
  id: string;
  key: string;
  value: JsonObject | null;
  translations: SettingTranslation[];
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

const SECTION_TYPES = [
  {
    value: "hero",
    label: "معرفی اصلی (Hero)",
    description: "عنوان اصلی، معرفی کوتاه، تصویر و دکمه‌ها",
  },
  {
    value: "about",
    label: "درباره من",
    description: "معرفی، توضیحات و تصویر شخصی",
  },
  {
    value: "projects",
    label: "پروژه‌ها",
    description: "فهرست پروژه‌ها و نحوه نمایش آن‌ها",
  },
  {
    value: "skills",
    label: "مهارت‌ها",
    description: "مهارت‌های فنی و دسته‌بندی آن‌ها",
  },
  {
    value: "language-skills",
    label: "زبان‌ها",
    description: "زبان‌ها و سطح تسلط",
  },
  {
    value: "experience",
    label: "سوابق کاری",
    description: "تجربه‌ها و خط زمانی",
  },
  { value: "blog", label: "وبلاگ", description: "مقالات و نوشته‌ها" },
  {
    value: "contact",
    label: "ارتباط با من",
    description: "راه‌های ارتباطی و فرم تماس",
  },
  { value: "custom", label: "بخش سفارشی", description: "محتوای دلخواه" },
];

const SETTING_KEYS = [
  { value: "site", label: "اطلاعات اصلی سایت" },
  { value: "contact", label: "اطلاعات تماس" },
  { value: "social-links", label: "شبکه‌های اجتماعی" },
  { value: "seo", label: "تنظیمات SEO" },
  { value: "footer", label: "پاورقی سایت" },
];

const CONTENT_FIELDS: Record<
  string,
  {
    key: string;
    label: string;
    type?: "text" | "url" | "textarea" | "number";
    placeholder?: string;
  }[]
> = {
  hero: [
    {
      key: "primaryButtonLabel",
      label: "متن دکمه اصلی",
      placeholder: "مشاهده پروژه‌ها",
    },
    {
      key: "primaryButtonUrl",
      label: "لینک دکمه اصلی",
      type: "url",
      placeholder: "#projects",
    },
    {
      key: "secondaryButtonLabel",
      label: "متن دکمه دوم",
      placeholder: "ارتباط با من",
    },
    {
      key: "secondaryButtonUrl",
      label: "لینک دکمه دوم",
      type: "url",
      placeholder: "#contact",
    },
    {
      key: "availabilityLabel",
      label: "متن وضعیت همکاری",
      placeholder: "آماده همکاری در پروژه‌ها",
    },
    { key: "roleLabel", label: "عنوان تخصص", placeholder: "توسعه‌دهنده وب" },
  ],
  about: [
    {
      key: "primaryButtonLabel",
      label: "متن دکمه",
      placeholder: "بیشتر درباره من",
    },
    {
      key: "primaryButtonUrl",
      label: "لینک دکمه",
      type: "url",
      placeholder: "#contact",
    },
    {
      key: "paragraphs",
      label: "متن تکمیلی درباره من",
      type: "textarea",
      placeholder: "متن‌های تکمیلی را اینجا وارد کن.",
    },
  ],
  projects: [
    {
      key: "sectionButtonLabel",
      label: "متن دکمه مشاهده همه",
      placeholder: "مشاهده همه پروژه‌ها",
    },
    {
      key: "sectionButtonUrl",
      label: "لینک مشاهده همه",
      type: "url",
      placeholder: "/projects",
    },
    {
      key: "emptyStateLabel",
      label: "متن حالت بدون پروژه",
      placeholder: "هنوز پروژه‌ای ثبت نشده است.",
    },
  ],
  skills: [
    {
      key: "sectionButtonLabel",
      label: "متن دکمه",
      placeholder: "مشاهده مهارت‌ها",
    },
    {
      key: "sectionButtonUrl",
      label: "لینک دکمه",
      type: "url",
      placeholder: "/skills",
    },
    { key: "levelLabel", label: "عنوان سطح مهارت", placeholder: "سطح تسلط" },
  ],
  "language-skills": [
    { key: "levelLabel", label: "عنوان سطح تسلط", placeholder: "سطح تسلط" },
    { key: "beginnerLabel", label: "متن سطح مقدماتی", placeholder: "مقدماتی" },
    { key: "intermediateLabel", label: "متن سطح متوسط", placeholder: "متوسط" },
    { key: "advancedLabel", label: "متن سطح پیشرفته", placeholder: "پیشرفته" },
  ],
  experience: [
    {
      key: "sectionButtonLabel",
      label: "متن دکمه",
      placeholder: "مشاهده سوابق",
    },
    {
      key: "sectionButtonUrl",
      label: "لینک دکمه",
      type: "url",
      placeholder: "#experience",
    },
    {
      key: "currentLabel",
      label: "متن موقعیت فعلی",
      placeholder: "در حال حاضر",
    },
  ],
  blog: [
    {
      key: "sectionButtonLabel",
      label: "متن دکمه مشاهده همه",
      placeholder: "مشاهده همه مقالات",
    },
    {
      key: "sectionButtonUrl",
      label: "لینک مقالات",
      type: "url",
      placeholder: "/blog",
    },
    {
      key: "readMoreLabel",
      label: "متن ادامه مطلب",
      placeholder: "ادامه مطلب",
    },
  ],
  contact: [
    { key: "emailLabel", label: "عنوان ایمیل", placeholder: "ایمیل" },
    { key: "phoneLabel", label: "عنوان تلفن", placeholder: "تلفن" },
    {
      key: "locationLabel",
      label: "عنوان موقعیت مکانی",
      placeholder: "موقعیت مکانی",
    },
    { key: "formNameLabel", label: "برچسب نام در فرم", placeholder: "نام شما" },
    {
      key: "formEmailLabel",
      label: "برچسب ایمیل در فرم",
      placeholder: "ایمیل شما",
    },
    {
      key: "formMessageLabel",
      label: "برچسب پیام در فرم",
      placeholder: "پیام شما",
    },
    {
      key: "submitButtonLabel",
      label: "متن دکمه ارسال",
      placeholder: "ارسال پیام",
    },
    {
      key: "successMessage",
      label: "پیام موفقیت",
      placeholder: "پیام شما ارسال شد.",
    },
  ],
  custom: [
    { key: "eyebrow", label: "متن بالای عنوان", placeholder: "بیشتر بدانید" },
    {
      key: "body",
      label: "محتوای تکمیلی",
      type: "textarea",
      placeholder: "محتوای این بخش...",
    },
    { key: "primaryButtonLabel", label: "متن دکمه اصلی" },
    { key: "primaryButtonUrl", label: "لینک دکمه اصلی", type: "url" },
    { key: "secondaryButtonLabel", label: "متن دکمه دوم" },
    { key: "secondaryButtonUrl", label: "لینک دکمه دوم", type: "url" },
  ],
};

const DEFAULT_CONTENT: JsonObject = {
  primaryButtonLabel: "",
  primaryButtonUrl: "",
  secondaryButtonLabel: "",
  secondaryButtonUrl: "",
};

const emptyTranslation = (): TranslationForm => ({
  title: "",
  subtitle: "",
  description: "",
  content: JSON.stringify(DEFAULT_CONTENT, null, 2),
});

const emptyTranslations = (): Record<Language, TranslationForm> => ({
  fa: emptyTranslation(),
  en: emptyTranslation(),
  tr: emptyTranslation(),
  ar: emptyTranslation(),
});

const defaultSettings: JsonObject = {
  layout: "grid",
  columns: 3,
  verticalSpacing: 80,
  gap: 24,
  backgroundColor: "#171522",
  imageUrl: "",
  imageAlt: "",
  showTitle: true,
  showSubtitle: true,
  showDescription: true,
  showImage: true,
  showButton: true,
  itemLimit: 6,
  showFeaturedOnly: false,
  showDate: true,
  showTags: true,
  showLevel: true,
  showOrganization: true,
  showDuration: true,
};

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function parseJsonObject(value: string, label: string): JsonObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || "{}");
  } catch {
    throw new Error(`${label}: ساختار JSON معتبر نیست.`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} باید یک شیء JSON باشد.`);
  }
  return parsed as JsonObject;
}

function getResponseData<T>(response: unknown): T {
  const result = response as { data?: unknown };
  const first = result?.data;
  if (first && typeof first === "object" && "data" in (first as object)) {
    return (first as { data: T }).data;
  }
  return first as T;
}

function getErrorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { message?: string | string[]; error?: string } };
    message?: string;
  };
  const message = candidate?.response?.data?.message;
  if (Array.isArray(message)) return message.join("، ");
  return (
    message ||
    candidate?.response?.data?.error ||
    candidate?.message ||
    "خطایی هنگام ارتباط با سرور رخ داد."
  );
}

function makeSectionForm(section?: HomeSection | null): SectionForm {
  const translations = emptyTranslations();
  section?.translations?.forEach((item) => {
    translations[item.language] = {
      title: item.title ?? "",
      subtitle: item.subtitle ?? "",
      description: item.description ?? "",
      content: prettyJson(item.content ?? {}),
    };
  });
  return {
    key: section?.key ?? "",
    type: section?.type ?? "hero",
    enabled: section?.enabled ?? true,
    sortOrder: section?.sortOrder ?? 0,
    settings: prettyJson({
      ...defaultSettings,
      ...asObject(section?.settings),
    }),
    translations,
  };
}

function makeSettingForm(settings: SiteSetting[], key: string): SettingForm {
  const setting = settings.find((item) => item.key === key);
  const translations: Record<Language, string> = {
    fa: prettyJson({}),
    en: prettyJson({}),
    tr: prettyJson({}),
    ar: prettyJson({}),
  };
  setting?.translations?.forEach((item) => {
    translations[item.language] = prettyJson(item.value ?? {});
  });
  return {
    value: prettyJson(setting?.value ?? {}),
    translations,
  };
}

function readSetting(
  form: SectionForm,
  key: string,
  fallback: unknown,
): unknown {
  const settings = parseJsonObject(form.settings, "تنظیمات بخش");
  return settings[key] ?? fallback;
}

function updateJsonString(
  current: string,
  key: string,
  value: unknown,
  label: string,
): string {
  const parsed = parseJsonObject(current, label);
  return prettyJson({ ...parsed, [key]: value });
}

function readContent(content: string, key: string): string {
  try {
    const parsed = JSON.parse(content || "{}") as JsonObject;
    const value = parsed[key];
    if (Array.isArray(value)) return value.join("\n");
    return value === undefined || value === null ? "" : String(value);
  } catch {
    return "";
  }
}

const SETTING_FIELDS: Record<
  string,
  { key: string; label: string; type?: "text" | "url" | "textarea" | "email" }[]
> = {
  site: [
    { key: "siteName", label: "نام سایت" },
    { key: "title", label: "عنوان سایت" },
    { key: "description", label: "توضیحات سایت", type: "textarea" },
    { key: "logoUrl", label: "آدرس لوگو", type: "url" },
    { key: "faviconUrl", label: "آدرس فاوآیکن", type: "url" },
    { key: "defaultLanguage", label: "زبان پیش‌فرض" },
    { key: "theme", label: "قالب پیش‌فرض" },
  ],
  contact: [
    { key: "email", label: "ایمیل", type: "email" },
    { key: "phone", label: "شماره تماس" },
    { key: "location", label: "موقعیت مکانی" },
    { key: "address", label: "آدرس", type: "textarea" },
    { key: "availability", label: "وضعیت همکاری" },
  ],
  "social-links": [
    { key: "github", label: "GitHub", type: "url" },
    { key: "linkedin", label: "LinkedIn", type: "url" },
    { key: "instagram", label: "Instagram", type: "url" },
    { key: "telegram", label: "Telegram", type: "url" },
    { key: "website", label: "وب‌سایت", type: "url" },
  ],
  seo: [
    { key: "title", label: "عنوان SEO" },
    { key: "description", label: "توضیحات SEO", type: "textarea" },
    { key: "keywords", label: "کلمات کلیدی" },
    { key: "ogImage", label: "تصویر اشتراک‌گذاری", type: "url" },
    { key: "canonicalUrl", label: "Canonical URL", type: "url" },
  ],
  footer: [
    { key: "copyright", label: "متن کپی‌رایت" },
    { key: "description", label: "توضیحات پاورقی", type: "textarea" },
    { key: "builtWith", label: "متن ساخته‌شده با" },
    { key: "showSocialLinks", label: "نمایش شبکه‌های اجتماعی" },
  ],
};

export default function SiteManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sections");
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(
    null,
  );
  const [sectionForm, setSectionForm] = useState<SectionForm>(() =>
    makeSectionForm(),
  );
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");
  const [selectedSetting, setSelectedSetting] = useState("site");
  const [settingLanguage, setSettingLanguage] = useState<Language>("fa");
  const [settingForm, setSettingForm] = useState<SettingForm>(() =>
    makeSettingForm([], "site"),
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sectionResponse, settingResponse] = await Promise.all([
        api.get("/admin/home-sections"),
        api.get("/admin/site-settings"),
      ]);
      const sectionData = getResponseData<HomeSection[]>(sectionResponse);
      const settingData = getResponseData<SiteSetting[]>(settingResponse);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setSettings(Array.isArray(settingData) ? settingData : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSettingForm(makeSettingForm(settings, selectedSetting));
  }, [settings, selectedSetting]);

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections],
  );

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionForm(makeSectionForm());
    setActiveLanguage("fa");
    setError("");
    setSectionModalOpen(true);
  };

  const openEditSection = (section: HomeSection) => {
    setEditingSection(section);
    setSectionForm(makeSectionForm(section));
    setActiveLanguage("fa");
    setError("");
    setSectionModalOpen(true);
  };

  const updateTranslation = (
    field: keyof Omit<TranslationForm, "content">,
    value: string,
  ) => {
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

  const updateContentField = (key: string, value: unknown) => {
    setSectionForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLanguage]: {
          ...current.translations[activeLanguage],
          content: updateJsonString(
            current.translations[activeLanguage].content,
            key,
            value,
            `محتوای زبان ${activeLanguage}`,
          ),
        },
      },
    }));
  };

  const updateSectionSetting = (key: string, value: unknown) => {
    setSectionForm((current) => ({
      ...current,
      settings: updateJsonString(current.settings, key, value, "تنظیمات بخش"),
    }));
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
      const sectionSettings = parseJsonObject(
        sectionForm.settings,
        "تنظیمات بخش",
      );
      const translations = LANGUAGES.map(({ value }) => {
        const translation = sectionForm.translations[value];
        return {
          language: value,
          title: translation.title.trim() || null,
          subtitle: translation.subtitle.trim() || null,
          description: translation.description.trim() || null,
          content: parseJsonObject(translation.content, `محتوای زبان ${value}`),
        };
      }).filter((item) =>
        Boolean(
          item.title ||
          item.subtitle ||
          item.description ||
          Object.keys(item.content).length,
        ),
      );

      if (!translations.length) {
        setError("حداقل اطلاعات یک ترجمه را وارد کن.");
        return;
      }

      const payload = {
        key: sectionForm.key.trim(),
        type: sectionForm.type,
        enabled: sectionForm.enabled,
        sortOrder: Math.max(0, Number(sectionForm.sortOrder) || 0),
        settings: sectionSettings,
        translations,
      };

      setSaving(true);
      if (editingSection) {
        await api.patch(`/admin/home-sections/${editingSection.id}`, payload);
        setNotice("تغییرات بخش با موفقیت ذخیره شد.");
      } else {
        await api.post("/admin/home-sections", payload);
        setNotice("بخش جدید با موفقیت ایجاد شد.");
      }
      setSectionModalOpen(false);
      setEditingSection(null);
      await fetchData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
    const ordered = [...orderedSections];
    const index = ordered.findIndex((item) => item.id === section.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const reordered = ordered.map((item, sortOrder) => ({
      ...item,
      sortOrder,
    }));

    setError("");
    setNotice("");
    try {
      await api.patch("/admin/home-sections/reorder", {
        sections: reordered.map(({ id }, sortOrder) => ({ id, sortOrder })),
      });
      setSections(reordered);
      setNotice("ترتیب بخش‌ها ذخیره شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const selectSetting = (key: string) => {
    setSelectedSetting(key);
    setSettingLanguage("fa");
    setSettingForm(makeSettingForm(settings, key));
    setError("");
  };

  const updateSettingValue = (
    scope: "value" | "translation",
    key: string,
    value: unknown,
  ) => {
    if (scope === "value") {
      setSettingForm((current) => ({
        ...current,
        value: updateJsonString(current.value, key, value, "تنظیمات اصلی"),
      }));
      return;
    }
    setSettingForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [settingLanguage]: updateJsonString(
          current.translations[settingLanguage],
          key,
          value,
          `ترجمه ${settingLanguage}`,
        ),
      },
    }));
  };

  const handleSettingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const value = parseJsonObject(settingForm.value, "تنظیمات اصلی");
      const translations = LANGUAGES.map(({ value: language }) => ({
        language,
        value: parseJsonObject(
          settingForm.translations[language],
          `ترجمه ${language}`,
        ),
      }));
      setSaving(true);
      await api.patch(`/admin/site-settings/${selectedSetting}`, {
        value,
        translations,
      });
      setNotice("تنظیمات سایت با موفقیت ذخیره شد.");
      await fetchData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const closeSectionModal = () => {
    if (saving) return;
    setSectionModalOpen(false);
    setEditingSection(null);
    setError("");
  };

  const renderContentField = (field: {
    key: string;
    label: string;
    type?: string;
    placeholder?: string;
  }) => {
    const value = readContent(
      sectionForm.translations[activeLanguage].content,
      field.key,
    );
    return (
      <label
        className={`site-form-field ${field.type === "textarea" ? "full-width" : ""}`}
        key={field.key}>
        <span>{field.label}</span>
        {field.type === "textarea" ? (
          <textarea
            rows={3}
            dir="auto"
            value={value}
            onChange={(event) =>
              updateContentField(field.key, event.target.value)
            }
            placeholder={field.placeholder}
          />
        ) : (
          <input
            dir={field.type === "url" ? "ltr" : "auto"}
            type={
              field.type === "url"
                ? "url"
                : field.type === "number"
                  ? "number"
                  : "text"
            }
            value={value}
            onChange={(event) =>
              updateContentField(
                field.key,
                field.type === "number"
                  ? Number(event.target.value)
                  : event.target.value,
              )
            }
            placeholder={field.placeholder}
          />
        )}
      </label>
    );
  };

  const renderSettingField = (
    field: { key: string; label: string; type?: string },
    value: JsonObject,
    onChange: (key: string, next: unknown) => void,
  ) => {
    const current = value[field.key];
    if (field.key === "showSocialLinks") {
      return (
        <label className="site-form-switch" key={field.key}>
          <input
            type="checkbox"
            checked={Boolean(current)}
            onChange={(event) => onChange(field.key, event.target.checked)}
          />
          <span>{field.label}</span>
        </label>
      );
    }
    return (
      <label
        className={`site-form-field ${field.type === "textarea" ? "full-width" : ""}`}
        key={field.key}>
        <span>{field.label}</span>
        {field.type === "textarea" ? (
          <textarea
            rows={3}
            value={String(current ?? "")}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        ) : (
          <input
            dir={field.type === "url" ? "ltr" : "auto"}
            type={
              field.type === "url"
                ? "url"
                : field.type === "email"
                  ? "email"
                  : "text"
            }
            value={String(current ?? "")}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        )}
      </label>
    );
  };

  let settingsValue: JsonObject = {};
  let translationValue: JsonObject = {};
  try {
    settingsValue = parseJsonObject(settingForm.value, "تنظیمات اصلی");
    translationValue = parseJsonObject(
      settingForm.translations[settingLanguage],
      "ترجمه",
    );
  } catch {
    // Keep the editor responsive; validation is performed on submit.
  }

  const sectionContentFields =
    CONTENT_FIELDS[sectionForm.type] ?? CONTENT_FIELDS.custom;

  return (
    <main className="site-management-page" dir="rtl">
      <header className="site-management-heading">
        <div>
          <span className="site-management-eyebrow">
            <Settings2 size={15} /> پیکربندی پورتفولیو
          </span>
          <h1>مدیریت سایت</h1>
          <p>
            محتوای صفحه اصلی، ترجمه‌ها و تنظیمات عمومی سایت را از این قسمت
            مدیریت کن.
          </p>
        </div>
        <button
          type="button"
          className="site-management-refresh"
          onClick={() => void fetchData()}
          disabled={loading}>
          <RefreshCw
            size={17}
            className={loading ? "site-management-loading" : ""}
          />
          بروزرسانی
        </button>
      </header>

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

      <nav className="site-management-tabs">
        <button
          type="button"
          className={activeTab === "sections" ? "active" : ""}
          onClick={() => setActiveTab("sections")}>
          <Layers3 size={17} /> بخش‌های صفحه اصلی <span>{sections.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}>
          <Globe2 size={17} /> تنظیمات سایت
        </button>
      </nav>

      {loading ? (
        <div className="site-management-state">
          <RefreshCw size={24} className="site-management-loading" />
          <span>در حال دریافت اطلاعات سایت...</span>
        </div>
      ) : activeTab === "sections" ? (
        <>
          <div className="site-management-toolbar">
            <div>
              <h2>ساختار صفحه اصلی</h2>
              <p>
                بخش‌ها را ویرایش، فعال یا غیرفعال کن و ترتیب نمایش آن‌ها را
                تغییر بده.
              </p>
            </div>
            <button
              type="button"
              className="site-management-primary"
              onClick={openCreateSection}>
              <Plus size={17} /> افزودن بخش جدید
            </button>
          </div>

          {!orderedSections.length ? (
            <div className="site-management-state">
              <Layers3 size={28} />
              <strong>هنوز بخشی ثبت نشده است.</strong>
              <button
                type="button"
                className="site-management-primary"
                onClick={openCreateSection}>
                <Plus size={16} /> ایجاد اولین بخش
              </button>
            </div>
          ) : (
            <div className="site-sections-list">
              {orderedSections.map((section, index) => {
                const fa = section.translations.find(
                  (item) => item.language === "fa",
                );
                const typeLabel =
                  SECTION_TYPES.find((item) => item.value === section.type)
                    ?.label ?? section.type;
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
                        <span>کلید: {section.key}</span>
                        <span>نوع: {typeLabel}</span>
                        <span>{section.translations.length} ترجمه</span>
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
                        <ChevronUp size={17} />
                      </button>
                      <button
                        type="button"
                        title="انتقال به پایین"
                        aria-label="انتقال به پایین"
                        disabled={index === orderedSections.length - 1}
                        onClick={() => void moveSection(section, 1)}>
                        <ChevronDown size={17} />
                      </button>
                      <button
                        type="button"
                        title={section.enabled ? "غیرفعال کردن" : "فعال کردن"}
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
                <p>اطلاعات عمومی و مقادیر ترجمه‌شده این بخش را ویرایش کن.</p>
              </div>
              <Globe2 size={22} />
            </div>

            <section className="site-editor-section">
              <div className="site-editor-section-heading">
                <div>
                  <h3>مقادیر اصلی</h3>
                  <p>این مقادیر مستقل از زبان هستند.</p>
                </div>
                <Settings2 size={20} />
              </div>
              <div className="site-form-grid">
                {(SETTING_FIELDS[selectedSetting] ?? []).map((field) =>
                  renderSettingField(field, settingsValue, (key, value) =>
                    updateSettingValue("value", key, value),
                  ),
                )}
              </div>
              <details className="site-advanced-settings">
                <summary>
                  <FileJson size={16} /> ویرایش پیشرفته مقادیر اصلی (JSON)
                </summary>
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
              </details>
            </section>

            <section className="site-editor-section">
              <div className="site-editor-section-heading">
                <div>
                  <h3>ترجمه تنظیمات</h3>
                  <p>محتوای متنی هر زبان را جداگانه وارد کن.</p>
                </div>
                <Type size={20} />
              </div>
              <div className="site-language-tabs">
                {LANGUAGES.map((language) => (
                  <button
                    type="button"
                    key={language.value}
                    className={
                      settingLanguage === language.value ? "active" : ""
                    }
                    onClick={() => setSettingLanguage(language.value)}>
                    {language.label}
                  </button>
                ))}
              </div>
              <div
                className="site-form-grid"
                dir={
                  LANGUAGES.find((item) => item.value === settingLanguage)
                    ?.direction
                }>
                {(SETTING_FIELDS[selectedSetting] ?? [])
                  .filter(
                    (field) =>
                      ![
                        "showSocialLinks",
                        "defaultLanguage",
                        "theme",
                        "logoUrl",
                        "faviconUrl",
                        "github",
                        "linkedin",
                        "instagram",
                        "telegram",
                        "website",
                        "email",
                        "phone",
                      ].includes(field.key),
                  )
                  .map((field) =>
                    renderSettingField(field, translationValue, (key, value) =>
                      updateSettingValue("translation", key, value),
                    ),
                  )}
                <label className="site-form-field full-width">
                  <span>مقدار ترجمه تکمیلی (JSON)</span>
                  <textarea
                    dir="ltr"
                    spellCheck={false}
                    rows={5}
                    value={settingForm.translations[settingLanguage]}
                    onChange={(event) =>
                      setSettingForm((current) => ({
                        ...current,
                        translations: {
                          ...current.translations,
                          [settingLanguage]: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </section>
            <footer className="site-settings-footer">
              <button
                type="submit"
                className="site-management-primary"
                disabled={saving}>
                <Save size={17} />
                {saving ? "در حال ذخیره..." : "ثبت و ذخیره تنظیمات"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {sectionModalOpen && (
        <div
          className="site-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSectionModal();
          }}>
          <section
            className="site-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-modal-title">
            <header className="site-modal-header">
              <div>
                <span className="site-management-eyebrow">
                  <Layers3 size={14} /> مدیریت بخش صفحه اصلی
                </span>
                <h2 id="site-modal-title">
                  {editingSection ? "ویرایش بخش" : "ایجاد بخش جدید"}
                </h2>
                <p>
                  تمام اطلاعات و ترجمه‌ها را تکمیل کن و در پایان ثبت و ذخیره را
                  بزن.
                </p>
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

                <section className="site-editor-section">
                  <div className="site-editor-section-heading">
                    <div>
                      <h3>اطلاعات پایه بخش</h3>
                      <p>شناسه، نوع و وضعیت نمایش این بخش را مشخص کن.</p>
                    </div>
                    <LayoutGrid size={20} />
                  </div>
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
                        value={sectionForm.type}
                        onChange={(event) =>
                          setSectionForm((current) => ({
                            ...current,
                            type: event.target.value,
                          }))
                        }
                        required>
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
                            sortOrder: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
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
                  <div className="site-type-description">
                    {
                      SECTION_TYPES.find(
                        (item) => item.value === sectionForm.type,
                      )?.description
                    }
                  </div>
                </section>

                <section className="site-editor-section">
                  <div className="site-editor-section-heading">
                    <div>
                      <h3>طراحی و نحوه نمایش</h3>
                      <p>
                        چیدمان، فاصله‌ها، رنگ و گزینه‌های قابل نمایش را تنظیم
                        کن.
                      </p>
                    </div>
                    <Settings2 size={20} />
                  </div>
                  <div className="site-form-grid">
                    <label className="site-form-field">
                      <span>نوع چیدمان</span>
                      <select
                        value={String(
                          readSetting(sectionForm, "layout", "grid"),
                        )}
                        onChange={(event) =>
                          updateSectionSetting("layout", event.target.value)
                        }>
                        <option value="grid">شبکه‌ای</option>
                        <option value="list">لیستی</option>
                        <option value="cards">کارت‌ها</option>
                        <option value="slider">اسلایدر</option>
                        <option value="centered">وسط‌چین</option>
                        <option value="split">دو ستونه</option>
                      </select>
                    </label>
                    <label className="site-form-field">
                      <span>تعداد ستون‌ها</span>
                      <select
                        value={String(readSetting(sectionForm, "columns", 3))}
                        onChange={(event) =>
                          updateSectionSetting(
                            "columns",
                            Number(event.target.value),
                          )
                        }>
                        <option value="1">۱ ستون</option>
                        <option value="2">۲ ستون</option>
                        <option value="3">۳ ستون</option>
                        <option value="4">۴ ستون</option>
                      </select>
                    </label>
                    <label className="site-form-field">
                      <span>فاصله عمودی بخش (px)</span>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={String(
                          readSetting(sectionForm, "verticalSpacing", 80),
                        )}
                        onChange={(event) =>
                          updateSectionSetting(
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
                        value={String(readSetting(sectionForm, "gap", 24))}
                        onChange={(event) =>
                          updateSectionSetting(
                            "gap",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label className="site-form-field">
                      <span>تعداد آیتم قابل نمایش</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={String(readSetting(sectionForm, "itemLimit", 6))}
                        onChange={(event) =>
                          updateSectionSetting(
                            "itemLimit",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label className="site-form-field">
                      <span>رنگ پس‌زمینه</span>
                      <div className="site-color-control">
                        <input
                          type="color"
                          value={String(
                            readSetting(
                              sectionForm,
                              "backgroundColor",
                              "#171522",
                            ),
                          )}
                          onChange={(event) =>
                            updateSectionSetting(
                              "backgroundColor",
                              event.target.value,
                            )
                          }
                        />
                        <code>
                          {String(
                            readSetting(
                              sectionForm,
                              "backgroundColor",
                              "#171522",
                            ),
                          )}
                        </code>
                      </div>
                    </label>
                    <label className="site-form-field">
                      <span>آدرس تصویر بخش</span>
                      <input
                        dir="ltr"
                        type="url"
                        value={String(readSetting(sectionForm, "imageUrl", ""))}
                        onChange={(event) =>
                          updateSectionSetting("imageUrl", event.target.value)
                        }
                        placeholder="https://example.com/image.webp"
                      />
                    </label>
                    <label className="site-form-field">
                      <span>متن جایگزین تصویر (Alt)</span>
                      <input
                        value={String(readSetting(sectionForm, "imageAlt", ""))}
                        onChange={(event) =>
                          updateSectionSetting("imageAlt", event.target.value)
                        }
                        placeholder="توضیح تصویر برای دسترس‌پذیری"
                      />
                    </label>
                  </div>
                  <div className="site-section-checkboxes">
                    {[
                      ["showTitle", "نمایش عنوان"],
                      ["showSubtitle", "نمایش زیرعنوان"],
                      ["showDescription", "نمایش توضیحات"],
                      ["showImage", "نمایش تصویر"],
                      ["showButton", "نمایش دکمه"],
                      ["showFeaturedOnly", "فقط موارد ویژه"],
                      ["showDate", "نمایش تاریخ"],
                      ["showTags", "نمایش برچسب‌ها"],
                      ["showLevel", "نمایش سطح مهارت"],
                      ["showOrganization", "نمایش سازمان"],
                      ["showDuration", "نمایش بازه زمانی"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            readSetting(
                              sectionForm,
                              key,
                              defaultSettings[key] ?? false,
                            ),
                          )}
                          onChange={(event) =>
                            updateSectionSetting(key, event.target.checked)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="site-editor-section">
                  <div className="site-editor-section-heading">
                    <div>
                      <h3>محتوای چهارزبانه</h3>
                      <p>
                        برای هر زبان عنوان، زیرعنوان، توضیحات و فیلدهای اختصاصی
                        همان بخش را وارد کن.
                      </p>
                    </div>
                    <Globe2 size={20} />
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
                        ].title.trim() && <i />}
                      </button>
                    ))}
                  </div>
                  <div
                    className="site-translation-fields"
                    dir={
                      LANGUAGES.find((item) => item.value === activeLanguage)
                        ?.direction
                    }>
                    <div className="site-form-grid">
                      <label className="site-form-field">
                        <span>عنوان بخش</span>
                        <input
                          value={sectionForm.translations[activeLanguage].title}
                          onChange={(event) =>
                            updateTranslation("title", event.target.value)
                          }
                          placeholder="عنوان بخش"
                        />
                      </label>
                      <label className="site-form-field">
                        <span>زیرعنوان بخش</span>
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
                      <label className="site-form-field full-width">
                        <span>توضیحات اصلی</span>
                        <textarea
                          rows={4}
                          value={
                            sectionForm.translations[activeLanguage].description
                          }
                          onChange={(event) =>
                            updateTranslation("description", event.target.value)
                          }
                          placeholder="توضیحات این بخش را بنویس..."
                        />
                      </label>
                    </div>
                    <div className="site-subsection-heading">
                      <h4>
                        فیلدهای اختصاصی{" "}
                        {
                          SECTION_TYPES.find(
                            (item) => item.value === sectionForm.type,
                          )?.label
                        }
                      </h4>
                      <span>
                        محتوای این قسمت برای هر زبان جداگانه ذخیره می‌شود.
                      </span>
                    </div>
                    <div className="site-form-grid">
                      {sectionContentFields.map(renderContentField)}
                    </div>
                    <details className="site-advanced-settings">
                      <summary>
                        <FileJson size={16} /> فیلدهای تکمیلی ترجمه (JSON)
                      </summary>
                      <label className="site-form-field">
                        <span>محتوای تکمیلی این زبان</span>
                        <textarea
                          dir="ltr"
                          spellCheck={false}
                          rows={7}
                          value={
                            sectionForm.translations[activeLanguage].content
                          }
                          onChange={(event) =>
                            setSectionForm((current) => ({
                              ...current,
                              translations: {
                                ...current.translations,
                                [activeLanguage]: {
                                  ...current.translations[activeLanguage],
                                  content: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    </details>
                  </div>
                </section>
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
                  className="site-management-primary site-save-button"
                  disabled={saving}>
                  <Save size={17} />
                  {saving
                    ? "در حال ثبت و ذخیره..."
                    : editingSection
                      ? "ثبت و ذخیره تغییرات"
                      : "ثبت و ایجاد بخش"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
