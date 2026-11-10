import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  Check,
  Globe,
  Code2,
  Camera,
  BriefcaseBusiness,
  Link2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import api from "../../lib/api";
import "./SocialLinksPage.css";

interface SocialLink {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  icon: string | null;
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SocialLinkForm {
  platform: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
  sortOrder: number;
}

interface ApiErrorResponse {
  message?: string | string[];
}

const INITIAL_FORM: SocialLinkForm = {
  platform: "github",
  label: "",
  url: "",
  icon: "github",
  enabled: true,
  sortOrder: 0,
};

const PLATFORMS = [
  { value: "github", label: "GitHub", icon: "github" },
  { value: "linkedin", label: "LinkedIn", icon: "linkedin" },
  { value: "instagram", label: "Instagram", icon: "instagram" },
  { value: "telegram", label: "Telegram", icon: "telegram" },
  { value: "twitter", label: "X / Twitter", icon: "twitter" },
  { value: "youtube", label: "YouTube", icon: "youtube" },
  { value: "website", label: "وب‌سایت", icon: "globe" },
  { value: "email", label: "ایمیل", icon: "mail" },
  { value: "other", label: "سایر", icon: "link" },
];

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message.join("، ");
    if (typeof message === "string") return message;
  }

  return "عملیات انجام نشد. لطفاً دوباره تلاش کن.";
};

const getPlatformLabel = (platform: string): string =>
  PLATFORMS.find((item) => item.value === platform)?.label ?? platform;

const getPlatformIcon = (platform: string) => {
  const iconProps = { size: 21, strokeWidth: 1.8 };

  switch (platform.toLowerCase()) {
    case "github":
      return <Code2 {...iconProps} />;
    case "linkedin":
      return <Camera {...iconProps} />;
    case "instagram":
      return <BriefcaseBusiness {...iconProps} />;
    case "telegram":
      return <MessageCircle {...iconProps} />;
    case "email":
      return <Mail {...iconProps} />;
    case "website":
      return <Globe {...iconProps} />;
    default:
      return <Link2 {...iconProps} />;
  }
};

function SocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [form, setForm] = useState<SocialLinkForm>(INITIAL_FORM);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<SocialLink[]>("/admin/social-links");
      setLinks(response.data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLinks();
  }, [fetchLinks]);

  const stats = useMemo(
    () => ({
      total: links.length,
      enabled: links.filter((item) => item.enabled).length,
      disabled: links.filter((item) => !item.enabled).length,
      platforms: new Set(links.map((item) => item.platform)).size,
    }),
    [links],
  );

  const sortedLinks = useMemo(
    () =>
      [...links].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.platform.localeCompare(b.platform),
      ),
    [links],
  );

  const openCreateModal = () => {
    setEditingLink(null);
    setForm({ ...INITIAL_FORM, sortOrder: links.length });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (link: SocialLink) => {
    setEditingLink(link);
    setForm({
      platform: link.platform,
      label: link.label ?? "",
      url: link.url,
      icon: link.icon ?? link.platform,
      enabled: link.enabled,
      sortOrder: link.sortOrder,
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingLink(null);
    setForm(INITIAL_FORM);
  };

  const updateForm = <K extends keyof SocialLinkForm>(
    key: K,
    value: SocialLinkForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePlatformChange = (platform: string) => {
    const selected = PLATFORMS.find((item) => item.value === platform);

    setForm((current) => ({
      ...current,
      platform,
      icon: selected?.icon ?? platform,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUrl = form.url.trim();

    if (!normalizedUrl) {
      setError("وارد کردن آدرس شبکه اجتماعی الزامی است.");
      return;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("آدرس واردشده معتبر نیست. آدرس باید با https:// شروع شود.");
      return;
    }

    const payload = {
      platform: form.platform,
      label: form.label.trim() || undefined,
      url: normalizedUrl,
      icon: form.icon.trim() || undefined,
      enabled: form.enabled,
      sortOrder: Math.max(0, Number(form.sortOrder) || 0),
    };

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingLink) {
        await api.patch(`/admin/social-links/${editingLink.id}`, payload);
        setNotice("لینک شبکه اجتماعی با موفقیت ویرایش شد.");
      } else {
        await api.post("/admin/social-links", payload);
        setNotice("لینک شبکه اجتماعی با موفقیت اضافه شد.");
      }

      setModalOpen(false);
      setEditingLink(null);
      setForm(INITIAL_FORM);

      await fetchLinks();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (link: SocialLink) => {
    setError("");
    setNotice("");

    try {
      await api.patch(`/admin/social-links/${link.id}`, {
        enabled: !link.enabled,
      });

      setLinks((current) =>
        current.map((item) =>
          item.id === link.id ? { ...item, enabled: !item.enabled } : item,
        ),
      );

      setNotice(
        !link.enabled
          ? "لینک با موفقیت فعال شد."
          : "لینک با موفقیت غیرفعال شد.",
      );
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleDelete = async (link: SocialLink) => {
    const confirmed = window.confirm(
      `آیا از حذف لینک «${link.label || getPlatformLabel(link.platform)}» مطمئن هستی؟`,
    );

    if (!confirmed) return;

    setDeletingId(link.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/social-links/${link.id}`);

      setLinks((current) => current.filter((item) => item.id !== link.id));
      setNotice("لینک شبکه اجتماعی حذف شد.");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="social-page">
      <header className="social-heading">
        <div>
          <span className="social-eyebrow">
            <Share2 size={15} />
            مدیریت ارتباطات
          </span>

          <h1>شبکه‌های اجتماعی</h1>

          <p>لینک شبکه‌های اجتماعی و راه‌های ارتباطی خودت را مدیریت کن.</p>
        </div>

        <div className="social-heading-actions">
          <button
            type="button"
            className="social-secondary-button"
            onClick={() => void fetchLinks()}
            disabled={loading}>
            <RefreshCw size={16} className={loading ? "social-spinning" : ""} />
            بروزرسانی
          </button>

          <button
            type="button"
            className="social-primary-button"
            onClick={openCreateModal}>
            <Plus size={17} />
            افزودن لینک
          </button>
        </div>
      </header>

      {notice && (
        <div className="social-notice">
          <Check size={17} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="social-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="social-stats">
        <article className="social-stat">
          <span className="social-stat-icon purple">
            <Share2 size={20} />
          </span>
          <div>
            <small>تمام لینک‌ها</small>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="social-stat">
          <span className="social-stat-icon green">
            <Check size={20} />
          </span>
          <div>
            <small>لینک‌های فعال</small>
            <strong>{stats.enabled}</strong>
          </div>
        </article>

        <article className="social-stat">
          <span className="social-stat-icon orange">
            <Activity size={20} />
          </span>
          <div>
            <small>لینک‌های غیرفعال</small>
            <strong>{stats.disabled}</strong>
          </div>
        </article>

        <article className="social-stat">
          <span className="social-stat-icon blue">
            <Globe size={20} />
          </span>
          <div>
            <small>پلتفرم‌ها</small>
            <strong>{stats.platforms}</strong>
          </div>
        </article>
      </section>

      <section className="social-info-panel">
        <div className="social-info-icon">
          <Share2 size={22} />
        </div>
        <div>
          <strong>نمایش در وب‌سایت</strong>
          <p>
            فقط لینک‌هایی که وضعیت فعال دارند از طریق API عمومی در وب‌سایت نمایش
            داده می‌شوند.
          </p>
        </div>
      </section>

      <div className="social-results-heading">
        <div>
          <h2>لینک‌های ثبت‌شده</h2>
          <span>{links.length} لینک</span>
        </div>
      </div>

      {loading ? (
        <div className="social-state">
          <LoaderCircle size={25} className="social-spinning" />
          <span>در حال دریافت لینک‌ها...</span>
        </div>
      ) : links.length === 0 ? (
        <div className="social-state">
          <span className="social-empty-icon">
            <Share2 size={29} />
          </span>
          <strong>هنوز لینکی ثبت نشده است.</strong>
          <p>
            اولین شبکه اجتماعی خودت را اضافه کن تا در وب‌سایت نمایش داده شود.
          </p>
          <button
            type="button"
            className="social-primary-button"
            onClick={openCreateModal}>
            <Plus size={16} />
            افزودن اولین لینک
          </button>
        </div>
      ) : (
        <div className="social-grid">
          {sortedLinks.map((link) => (
            <article className="social-card" key={link.id}>
              <div className="social-card-top">
                <span className="social-platform-icon">
                  {getPlatformIcon(link.platform)}
                </span>

                <span
                  className={`social-status ${link.enabled ? "enabled" : "disabled"}`}>
                  <span />
                  {link.enabled ? "فعال" : "غیرفعال"}
                </span>
              </div>

              <div className="social-card-content">
                <strong>{link.label || getPlatformLabel(link.platform)}</strong>
                <small>{getPlatformLabel(link.platform)}</small>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="social-url"
                  dir="ltr"
                  title={link.url}>
                  <span>{link.url}</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>

              <div className="social-card-footer">
                <span className="social-sort-order">
                  ترتیب نمایش: {link.sortOrder}
                </span>

                <div className="social-card-actions">
                  <button
                    type="button"
                    onClick={() => void handleToggle(link)}
                    title={link.enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}
                    aria-label={link.enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}>
                    <Activity size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(link)}
                    title="ویرایش"
                    aria-label="ویرایش">
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    className="social-delete-button"
                    onClick={() => void handleDelete(link)}
                    disabled={deletingId === link.id}
                    title="حذف"
                    aria-label="حذف">
                    {deletingId === link.id ? (
                      <LoaderCircle size={15} className="social-spinning" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="social-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}>
          <section
            className="social-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-modal-title">
            <header className="social-modal-header">
              <div>
                <span className="social-eyebrow">
                  <Share2 size={14} />
                  مدیریت لینک
                </span>
                <h2 id="social-modal-title">
                  {editingLink ? "ویرایش لینک" : "افزودن شبکه اجتماعی"}
                </h2>
              </div>

              <button
                type="button"
                className="social-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="social-modal-body">
                {error && (
                  <div className="social-error">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن پیام">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <label className="social-field">
                  <span>پلتفرم</span>
                  <select
                    value={form.platform}
                    onChange={(event) =>
                      handlePlatformChange(event.target.value)
                    }
                    required>
                    {PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="social-field">
                  <span>عنوان نمایشی</span>
                  <input
                    value={form.label}
                    onChange={(event) =>
                      updateForm("label", event.target.value)
                    }
                    placeholder="مثلاً پروفایل گیت‌هاب"
                    maxLength={100}
                  />
                  <small>
                    اختیاری؛ در صورت خالی بودن نام پلتفرم نمایش داده می‌شود.
                  </small>
                </label>

                <label className="social-field">
                  <span>آدرس لینک</span>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(event) => updateForm("url", event.target.value)}
                    placeholder="https://example.com/username"
                    dir="ltr"
                    required
                  />
                </label>

                <label className="social-field">
                  <span>نام آیکون</span>
                  <input
                    value={form.icon}
                    onChange={(event) => updateForm("icon", event.target.value)}
                    placeholder="github"
                    dir="ltr"
                  />
                  <small>
                    یک شناسه متنی برای آیکون؛ مثلاً github یا linkedin.
                  </small>
                </label>

                <label className="social-field">
                  <span>ترتیب نمایش</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateForm("sortOrder", Number(event.target.value))
                    }
                  />
                </label>

                <label className="social-toggle">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(event) =>
                      updateForm("enabled", event.target.checked)
                    }
                  />
                  <span className="social-toggle-track" />
                  <span>
                    <strong>فعال‌سازی لینک</strong>
                    <small>لینک فعال در وب‌سایت عمومی نمایش داده می‌شود.</small>
                  </span>
                </label>
              </div>

              <footer className="social-modal-footer">
                <button
                  type="button"
                  className="social-secondary-button"
                  onClick={closeModal}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="social-primary-button"
                  disabled={saving}>
                  {saving ? (
                    <LoaderCircle size={16} className="social-spinning" />
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

export default SocialLinksPage;
