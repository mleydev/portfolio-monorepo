import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  LoaderCircle,
  Save,
  UserRound,
  X,
} from "lucide-react";
import api from "../../lib/api";
import "./ProfilePage.css";

type Language = "fa" | "en" | "tr" | "ar";

type ProfileTranslation = {
  id?: string;
  language: Language;
  fullName: string;
  role: string;
  bio: string;
};

type Profile = {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  resumeUrl: string | null;
  translations: ProfileTranslation[];
};

type ProfileForm = {
  email: string;
  phone: string;
  location: string;
  avatar: string;
  resumeUrl: string;
  translations: Record<Language, ProfileTranslation>;
};

type UploadResponse = {
  url: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
  message?: string;
};

const LANGUAGES: {
  key: Language;
  label: string;
  direction: "rtl" | "ltr";
}[] = [
  { key: "fa", label: "فارسی", direction: "rtl" },
  { key: "en", label: "English", direction: "ltr" },
  { key: "tr", label: "Türkçe", direction: "ltr" },
  { key: "ar", label: "العربية", direction: "rtl" },
];

const createEmptyTranslation = (language: Language): ProfileTranslation => ({
  language,
  fullName: "",
  role: "",
  bio: "",
});

const createEmptyForm = (): ProfileForm => ({
  email: "",
  phone: "",
  location: "",
  avatar: "",
  resumeUrl: "",
  translations: {
    fa: createEmptyTranslation("fa"),
    en: createEmptyTranslation("en"),
    tr: createEmptyTranslation("tr"),
    ar: createEmptyTranslation("ar"),
  },
});

const profileToForm = (profile: Profile): ProfileForm => {
  const translations = createEmptyForm().translations;

  for (const translation of profile.translations ?? []) {
    translations[translation.language] = {
      ...translations[translation.language],
      ...translation,
    };
  }

  return {
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    avatar: profile.avatar ?? "",
    resumeUrl: profile.resumeUrl ?? "",
    translations,
  };
};

const getErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;
  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join("، ");
  }

  return message ?? apiError.message ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
};

const resolveMediaUrl = (url: string | null): string => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

  const apiOrigin = new URL(apiBaseUrl).origin;

  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const ProfilePage = () => {
  const [form, setForm] = useState<ProfileForm>(createEmptyForm);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Profile[] | Profile>("/admin/profile");

      const profiles = Array.isArray(response.data)
        ? response.data
        : [response.data];

      const profile = profiles[0];

      if (!profile) {
        setProfileId(null);
        setForm(createEmptyForm());
        setError("اطلاعات پروفایل پیدا نشد.");
        return;
      }

      setProfileId(profile.id);
      setForm(profileToForm(profile));
      setAvatarPreviewError(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = (
    field: "email" | "phone" | "location" | "avatar" | "resumeUrl",
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateTranslation = (
    field: keyof ProfileTranslation,
    value: string,
  ) => {
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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("فرمت تصویر باید JPG، PNG، WebP یا GIF باشد.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "IMAGE");

      const response = await api.post<UploadResponse>(
        "/admin/media/upload",
        formData,
      );

      // Convert relative media paths into absolute URLs.
      const absoluteAvatarUrl = normalizeMediaUrl(response.data.url);

      if (!absoluteAvatarUrl) {
        throw new Error("آدرس تصویر از سرور دریافت نشد.");
      }

      setForm((previous) => ({
        ...previous,
        avatar: absoluteAvatarUrl,
      }));

      setAvatarPreviewError(false);
      setSuccess("تصویر با موفقیت آپلود شد.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setForm((previous) => ({
      ...previous,
      avatar: "",
    }));

    setAvatarPreviewError(false);
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileId || saving || uploading) return;

    setError("");
    setSuccess("");

    const email = form.email.trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("لطفاً یک آدرس ایمیل معتبر وارد کنید.");
      return;
    }

    const optionalUrls = [{ label: "لینک رزومه", value: form.resumeUrl }];

    for (const item of optionalUrls) {
      if (!item.value.trim()) continue;

      try {
        const url = new URL(item.value.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        setError(`${item.label} معتبر نیست.`);
        return;
      }
    }

    for (const language of LANGUAGES) {
      const translation = form.translations[language.key];

      if (
        !translation.fullName.trim() ||
        !translation.role.trim() ||
        !translation.bio.trim()
      ) {
        setActiveLanguage(language.key);
        setError(`لطفاً تمام فیلدهای بخش ${language.label} را تکمیل کنید.`);
        return;
      }
    }

    const payload = {
      email: email || null,
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      avatar: form.avatar.trim() || null,
      resumeUrl: form.resumeUrl.trim() || null,
      translations: LANGUAGES.map(({ key }) => ({
        language: key,
        fullName: form.translations[key].fullName.trim(),
        role: form.translations[key].role.trim(),
        bio: form.translations[key].bio.trim(),
      })),
    };

    try {
      setSaving(true);

      await api.patch(`/admin/profile/${profileId}`, payload);

      setSuccess("اطلاعات پروفایل با موفقیت ذخیره شد.");

      await loadProfile();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-state">
        <LoaderCircle className="profile-spinner" size={28} />
        <span>در حال دریافت اطلاعات پروفایل...</span>
      </div>
    );
  }

  const currentTranslation = form.translations[activeLanguage];

  const currentLanguage = LANGUAGES.find(
    (language) => language.key === activeLanguage,
  );

  const avatarUrl = resolveMediaUrl(form.avatar);

  const normalizeMediaUrl = (url: string | null): string => {
    if (!url) return "";

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

      const apiOrigin = new URL(apiBaseUrl).origin;

      return new URL(url, apiOrigin).toString();
    } catch {
      return url;
    }
  };

  return (
    <div className="profile-page" dir="rtl">
      <div className="profile-heading">
        <div>
          <span className="profile-eyebrow">PERSONAL INFORMATION</span>

          <h1>مدیریت پروفایل</h1>

          <p>اطلاعات شخصی و محتوای چندزبانه پروفایل خود را مدیریت کنید.</p>
        </div>
      </div>

      {error && (
        <div className="profile-message profile-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="profile-message profile-success" role="status">
          <CheckCircle2 size={19} />
          <span>{success}</span>
        </div>
      )}

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>تصویر پروفایل</h2>
              <p>تصویر موردنظر خود را از کامپیوتر انتخاب و آپلود کنید.</p>
            </div>
          </div>

          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {avatarUrl && !avatarPreviewError ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  onError={() => setAvatarPreviewError(true)}
                />
              ) : (
                <UserRound size={42} />
              )}
            </div>

            <div className="profile-avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                hidden
              />

              <button
                type="button"
                className="profile-upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}>
                {uploading ? (
                  <LoaderCircle size={18} className="profile-spinner" />
                ) : (
                  <Camera size={18} />
                )}

                <span>
                  {uploading ? "در حال آپلود تصویر..." : "انتخاب و آپلود تصویر"}
                </span>
              </button>

              <span className="profile-avatar-hint">
                JPG، PNG، WebP یا GIF — حداکثر ۵ مگابایت
              </span>

              {form.avatar && (
                <button
                  type="button"
                  className="profile-remove-avatar-button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}>
                  <X size={16} />
                  حذف تصویر انتخاب‌شده
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>اطلاعات عمومی</h2>
              <p>راه‌های ارتباطی و اطلاعات پایه شما</p>
            </div>
          </div>

          <div className="profile-fields-grid">
            <label className="profile-field">
              <span>ایمیل</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="mehdi@example.com"
                dir="ltr"
              />
            </label>

            <label className="profile-field">
              <span>شماره تماس</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+98 900 000 0000"
                dir="ltr"
              />
            </label>

            <label className="profile-field">
              <span>موقعیت مکانی</span>
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="Baku"
              />
            </label>

            <label className="profile-field">
              <span>لینک رزومه</span>
              <input
                type="url"
                value={form.resumeUrl}
                onChange={(event) =>
                  updateField("resumeUrl", event.target.value)
                }
                placeholder="https://example.com/resume.pdf"
                dir="ltr"
              />
            </label>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>اطلاعات چندزبانه</h2>
              <p>نام، عنوان شغلی و معرفی خود را برای هر زبان تنظیم کنید.</p>
            </div>
          </div>

          <div className="profile-language-tabs">
            {LANGUAGES.map((language) => (
              <button
                key={language.key}
                type="button"
                className={
                  activeLanguage === language.key
                    ? "profile-language-tab active"
                    : "profile-language-tab"
                }
                onClick={() => setActiveLanguage(language.key)}>
                {language.label}
              </button>
            ))}
          </div>

          <div
            className="profile-translation-fields"
            dir={currentLanguage?.direction ?? "ltr"}>
            <label className="profile-field">
              <span>نام و نام خانوادگی</span>
              <input
                type="text"
                value={currentTranslation.fullName}
                onChange={(event) =>
                  updateTranslation("fullName", event.target.value)
                }
                placeholder="Mehdi Leilaei"
              />
            </label>

            <label className="profile-field">
              <span>عنوان شغلی</span>
              <input
                type="text"
                value={currentTranslation.role}
                onChange={(event) =>
                  updateTranslation("role", event.target.value)
                }
                placeholder="Web Developer"
              />
            </label>

            <label className="profile-field profile-bio-field">
              <span>معرفی کوتاه</span>
              <textarea
                rows={5}
                value={currentTranslation.bio}
                onChange={(event) =>
                  updateTranslation("bio", event.target.value)
                }
                placeholder="Write a short introduction about yourself..."
              />
            </label>
          </div>
        </section>

        <div className="profile-form-actions">
          <button
            type="submit"
            className="profile-save-button"
            disabled={saving || uploading || !profileId}>
            {saving ? (
              <LoaderCircle size={18} className="profile-spinner" />
            ) : (
              <Save size={18} />
            )}

            <span>{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
