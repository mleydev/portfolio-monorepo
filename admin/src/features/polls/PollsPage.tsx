import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Globe2,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../../lib/api";
import LocalizedDatePicker from "../../components/date-picker/LocalizedDatePicker";
import "./PollsPage.css";
import axios from "axios";

type Language = "fa" | "en" | "tr" | "ar";
type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
type PollStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface Translation {
  language: Language;
  title?: string;
  description?: string;
  label?: string;
}

interface PollOption {
  id: string;
  sortOrder: number;
  translations: Translation[];
  _count?: {
    votes: number;
  };
}

interface Poll {
  id: string;
  type: PollType;
  status: PollStatus;
  startsAt: string | null;
  endsAt: string | null;
  showResults: boolean;
  translations: Translation[];
  options: PollOption[];
  createdAt: string;
  updatedAt: string;
}

interface PollResultOption {
  id: string;
  sortOrder: number;
  translations: Translation[];
  votes: number;
  percentage: number;
}

interface PollResults {
  id: string;
  status: PollStatus;
  type: PollType;
  showResults: boolean;
  createdAt: string;
  translations: Translation[];
  totalVotes: number;
  options: PollResultOption[];
}

interface PollFormOption {
  id?: string;
  translations: Record<Language, string>;
}

interface PollForm {
  type: PollType;
  showResults: boolean;
  startsAt: string;
  startsAtTime: string;
  endsAt: string;
  endsAtTime: string;
  translations: Record<Language, { title: string; description: string }>;
  options: PollFormOption[];
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "fa", label: "فارسی" },
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
];

const STATUS_LABELS: Record<PollStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشرشده",
  ARCHIVED: "بایگانی‌شده",
};

const EMPTY_TRANSLATIONS = (): PollForm["translations"] => ({
  fa: { title: "", description: "" },
  en: { title: "", description: "" },
  tr: { title: "", description: "" },
  ar: { title: "", description: "" },
});

const createEmptyOption = (): PollFormOption => ({
  translations: {
    fa: "",
    en: "",
    tr: "",
    ar: "",
  },
});

const createEmptyForm = (): PollForm => ({
  type: "SINGLE_CHOICE",
  showResults: true,
  startsAt: "",
  startsAtTime: "00:00",
  endsAt: "",
  endsAtTime: "00:00",
  translations: EMPTY_TRANSLATIONS(),
  options: [createEmptyOption(), createEmptyOption()],
});

const toDateTimePickerValue = (date: string | null) => {
  if (!date) {
    return { date: "", time: "00:00" };
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return { date: "", time: "00:00" };
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

const combineDateTime = (date: string, time: string) => {
  if (!date) return null;

  return new Date(`${date}T${time || "00:00"}:00`).toISOString();
};

const getTranslation = (translations: Translation[], language: Language) =>
  translations.find((item) => item.language === language);

const getPollTitle = (poll: Poll) =>
  getTranslation(poll.translations, "fa")?.title ||
  getTranslation(poll.translations, "en")?.title ||
  "بدون عنوان";

const getPollDescription = (poll: Poll) =>
  getTranslation(poll.translations, "fa")?.description ||
  getTranslation(poll.translations, "en")?.description ||
  "";

const getTotalVotes = (poll: Poll) =>
  poll.options.reduce(
    (total, option) => total + (option._count?.votes ?? 0),
    0,
  );

const formatDate = (date: string | null) => {
  if (!date) return "بدون محدودیت";

  return new Date(date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (date: string | null) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface ApiErrorResponse {
  message?: string | string[];
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join("، ");
    }

    if (message) {
      return message;
    }
  }

  return fallback;
};

const PollsPage = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [form, setForm] = useState<PollForm>(createEmptyForm);
  const [activeLanguage, setActiveLanguage] = useState<Language>("fa");
  const [formError, setFormError] = useState("");

  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedResults, setSelectedResults] = useState<PollResults | null>(
    null,
  );
  const [resultsLoading, setResultsLoading] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Poll[]>("/admin/polls");
      setPolls(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "دریافت نظرسنجی‌ها با خطا مواجه شد."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPolls = async () => {
      try {
        const response = await api.get<Poll[]>("/admin/polls");

        if (isMounted) {
          setPolls(response.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(getErrorMessage(err, "دریافت نظرسنجی‌ها با خطا مواجه شد."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPolls();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPolls = useMemo(() => {
    return polls.filter((poll) => {
      const matchesSearch = [
        getPollTitle(poll),
        getPollDescription(poll),
        ...poll.translations.map((item) => item.title || ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || poll.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [polls, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: polls.length,
      published: polls.filter((poll) => poll.status === "PUBLISHED").length,
      drafts: polls.filter((poll) => poll.status === "DRAFT").length,
      votes: polls.reduce((total, poll) => total + getTotalVotes(poll), 0),
    }),
    [polls],
  );

  const openCreateModal = () => {
    setEditingPoll(null);
    setForm(createEmptyForm());
    setActiveLanguage("fa");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (poll: Poll) => {
    const translations = EMPTY_TRANSLATIONS();

    poll.translations.forEach((item) => {
      translations[item.language] = {
        title: item.title || "",
        description: item.description || "",
      };
    });

    const options = poll.options.map((option) => {
      const optionTranslations = createEmptyOption().translations;

      option.translations.forEach((item) => {
        if (item.label) {
          optionTranslations[item.language] = item.label;
        }
      });

      return {
        id: option.id,
        translations: optionTranslations,
      };
    });

    const startsAt = toDateTimePickerValue(poll.startsAt);
    const endsAt = toDateTimePickerValue(poll.endsAt);

    setEditingPoll(poll);
    setForm({
      type: poll.type,
      showResults: poll.showResults,
      startsAt: startsAt.date,
      startsAtTime: startsAt.time,
      endsAt: endsAt.date,
      endsAtTime: endsAt.time,
      translations,
      options:
        options.length >= 2
          ? options
          : [...options, createEmptyOption(), createEmptyOption()].slice(0, 2),
    });

    setActiveLanguage("fa");
    setFormError("");
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

  const updateOptionTranslation = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              translations: {
                ...option.translations,
                [activeLanguage]: value,
              },
            }
          : option,
      ),
    }));
  };

  const addOption = () => {
    setForm((current) => ({
      ...current,
      options: [...current.options, createEmptyOption()],
    }));
  };

  const removeOption = (index: number) => {
    const option = form.options[index];

    if (
      editingPoll &&
      option.id &&
      (editingPoll.options.find((item) => item.id === option.id)?._count
        ?.votes ?? 0) > 0
    ) {
      setFormError("این گزینه رأی ثبت‌شده دارد و امکان حذف آن وجود ندارد.");
      return;
    }

    if (form.options.length <= 2) {
      setFormError("هر نظرسنجی باید حداقل دو گزینه داشته باشد.");
      return;
    }

    setFormError("");
    setForm((current) => ({
      ...current,
      options: current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
  };

  const validateForm = () => {
    if (!form.translations.fa.title.trim()) {
      return "عنوان فارسی نظرسنجی الزامی است.";
    }

    if (form.options.length < 2) {
      return "حداقل دو گزینه برای نظرسنجی لازم است.";
    }

    if (form.options.some((option) => !option.translations.fa.trim())) {
      return "متن فارسی تمام گزینه‌ها الزامی است.";
    }

    const startsAt = form.startsAt
      ? new Date(`${form.startsAt}T${form.startsAtTime || "00:00"}:00`)
      : null;

    const endsAt = form.endsAt
      ? new Date(`${form.endsAt}T${form.endsAtTime || "00:00"}:00`)
      : null;

    if (startsAt && Number.isNaN(startsAt.getTime())) {
      return "تاریخ و ساعت شروع معتبر نیست.";
    }

    if (endsAt && Number.isNaN(endsAt.getTime())) {
      return "تاریخ و ساعت پایان معتبر نیست.";
    }

    if (startsAt && endsAt && endsAt <= startsAt) {
      return "تاریخ و ساعت پایان باید بعد از شروع باشد.";
    }

    return "";
  };

  const buildPayload = () => ({
    type: form.type,
    showResults: form.showResults,
    startsAt: combineDateTime(form.startsAt, form.startsAtTime),
    endsAt: combineDateTime(form.endsAt, form.endsAtTime),
    translations: LANGUAGES.filter(({ value }) =>
      form.translations[value].title.trim(),
    ).map(({ value }) => ({
      language: value,
      title: form.translations[value].title.trim(),
      description: form.translations[value].description.trim() || undefined,
    })),
    options: form.options.map((option, index) => ({
      ...(option.id ? { id: option.id } : {}),
      sortOrder: index,
      translations: LANGUAGES.filter(({ value }) =>
        option.translations[value].trim(),
      ).map(({ value }) => ({
        language: value,
        label: option.translations[value].trim(),
      })),
    })),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const payload = buildPayload();

      if (editingPoll) {
        await api.patch(`/admin/polls/${editingPoll.id}`, payload);
      } else {
        await api.post("/admin/polls", payload);
      }

      setModalOpen(false);
      await fetchPolls();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "ذخیره نظرسنجی با خطا مواجه شد."));
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (poll: Poll, status: PollStatus) => {
    try {
      await api.patch(`/admin/polls/${poll.id}/status`, { status });
      await fetchPolls();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "تغییر وضعیت نظرسنجی انجام نشد."));
    }
  };

  const deletePoll = async (poll: Poll) => {
    if (
      !window.confirm(
        `آیا از حذف نظرسنجی «${getPollTitle(poll)}» مطمئن هستید؟ تمام رأی‌های آن نیز حذف خواهند شد.`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/polls/${poll.id}`);
      await fetchPolls();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "حذف نظرسنجی با خطا مواجه نشد."));
    }
  };

  const openResults = async (poll: Poll) => {
    try {
      setResultsOpen(true);
      setResultsLoading(true);
      setSelectedResults(null);

      const response = await api.get<PollResults>(
        `/admin/polls/${poll.id}/results`,
        { params: { lang: "fa" } },
      );

      setSelectedResults(response.data);
    } catch (err: unknown) {
      setResultsOpen(false);
      setError(getErrorMessage(err, "دریافت نتایج نظرسنجی ممکن نشد."));
    } finally {
      setResultsLoading(false);
    }
  };

  return (
    <div className="polls-page">
      <div className="polls-header">
        <div>
          <div className="polls-breadcrumb">
            <span>مدیریت محتوا</span>
            <span>/</span>
            <span>نظرسنجی‌ها</span>
          </div>

          <h1>نظرسنجی‌ها</h1>
          <p>مدیریت نظرسنجی‌ها، گزینه‌ها و بررسی مشارکت کاربران</p>
        </div>

        <button className="polls-primary-btn" onClick={openCreateModal}>
          <Plus size={18} />
          ایجاد نظرسنجی
        </button>
      </div>

      {error && (
        <div className="polls-alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="بستن">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="polls-stats">
        <div className="polls-stat-card">
          <div className="polls-stat-icon purple">
            <FileText size={21} />
          </div>
          <div>
            <span>کل نظرسنجی‌ها</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="polls-stat-card">
          <div className="polls-stat-icon green">
            <Check size={21} />
          </div>
          <div>
            <span>منتشرشده</span>
            <strong>{stats.published}</strong>
          </div>
        </div>

        <div className="polls-stat-card">
          <div className="polls-stat-icon orange">
            <Clock3 size={21} />
          </div>
          <div>
            <span>پیش‌نویس</span>
            <strong>{stats.drafts}</strong>
          </div>
        </div>

        <div className="polls-stat-card">
          <div className="polls-stat-icon blue">
            <BarChart3 size={21} />
          </div>
          <div>
            <span>کل رأی‌ها</span>
            <strong>{stats.votes.toLocaleString("fa-IR")}</strong>
          </div>
        </div>
      </div>

      <div className="polls-toolbar">
        <div className="polls-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجوی نظرسنجی..."
          />
        </div>

        <div className="polls-filter">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشرشده</option>
            <option value="ARCHIVED">بایگانی‌شده</option>
          </select>
          <ChevronDown size={16} />
        </div>
      </div>

      {loading ? (
        <div className="polls-loading">
          <Loader2 className="polls-spinner" size={28} />
          <span>در حال دریافت نظرسنجی‌ها...</span>
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="polls-empty">
          <div className="polls-empty-icon">
            <BarChart3 size={30} />
          </div>
          <h3>نظرسنجی‌ای پیدا نشد</h3>
          <p>
            {search || statusFilter !== "ALL"
              ? "عبارت جست‌وجو یا فیلتر را تغییر دهید."
              : "هنوز نظرسنجی‌ای ایجاد نکرده‌اید."}
          </p>
          {!search && statusFilter === "ALL" && (
            <button className="polls-primary-btn" onClick={openCreateModal}>
              <Plus size={17} />
              ایجاد اولین نظرسنجی
            </button>
          )}
        </div>
      ) : (
        <div className="polls-grid">
          {filteredPolls.map((poll) => (
            <article className="polls-card" key={poll.id}>
              <div className="polls-card-top">
                <span className={`polls-status ${poll.status.toLowerCase()}`}>
                  {STATUS_LABELS[poll.status]}
                </span>

                <div className="polls-card-menu">
                  <button title="ویرایش" onClick={() => openEditModal(poll)}>
                    <Edit3 size={16} />
                  </button>
                  <button
                    title="حذف"
                    className="danger"
                    onClick={() => void deletePoll(poll)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3>{getPollTitle(poll)}</h3>

              {getPollDescription(poll) && (
                <p className="polls-card-description">
                  {getPollDescription(poll)}
                </p>
              )}

              <div className="polls-card-meta">
                <span>
                  <BarChart3 size={15} />
                  {poll.type === "SINGLE_CHOICE" ? "تک‌انتخابی" : "چندانتخابی"}
                </span>
                <span>
                  <Globe2 size={15} />
                  {poll.translations.length} زبان
                </span>
                <span>
                  <FileText size={15} />
                  {poll.options.length} گزینه
                </span>
              </div>

              <div className="polls-card-votes">
                <div>
                  <span>مجموع رأی‌ها</span>
                  <strong>{getTotalVotes(poll).toLocaleString("fa-IR")}</strong>
                </div>
                <div>
                  <span>نمایش نتایج</span>
                  <strong>{poll.showResults ? "فعال" : "غیرفعال"}</strong>
                </div>
              </div>

              <div className="polls-card-dates">
                <span>
                  <CalendarDays size={14} />
                  شروع: {formatDate(poll.startsAt)}
                  {poll.startsAt && ` - ${formatTime(poll.startsAt)}`}
                </span>
                <span>
                  <CalendarDays size={14} />
                  پایان: {formatDate(poll.endsAt)}
                  {poll.endsAt && ` - ${formatTime(poll.endsAt)}`}
                </span>
              </div>

              <div className="polls-card-actions">
                <button
                  className="polls-results-btn"
                  onClick={() => void openResults(poll)}>
                  <Eye size={16} />
                  مشاهده نتایج
                </button>

                <select
                  value={poll.status}
                  onChange={(event) =>
                    void changeStatus(poll, event.target.value as PollStatus)
                  }
                  aria-label="تغییر وضعیت نظرسنجی">
                  <option value="DRAFT">پیش‌نویس</option>
                  <option value="PUBLISHED">انتشار</option>
                  <option value="ARCHIVED">بایگانی</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="polls-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setModalOpen(false);
            }
          }}>
          <div className="polls-modal polls-form-modal">
            <div className="polls-modal-header">
              <div>
                <h2>{editingPoll ? "ویرایش نظرسنجی" : "ایجاد نظرسنجی"}</h2>
                <p>اطلاعات نظرسنجی و گزینه‌های پاسخ را وارد کنید.</p>
              </div>
              <button
                className="polls-close-btn"
                onClick={() => setModalOpen(false)}
                disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="polls-form-content">
                <div className="polls-form-section">
                  <h3>اطلاعات اصلی</h3>

                  <div className="polls-form-grid">
                    <label className="polls-field">
                      <span>نوع نظرسنجی</span>
                      <select
                        value={form.type}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            type: event.target.value as PollType,
                          }))
                        }>
                        <option value="SINGLE_CHOICE">تک‌انتخابی</option>
                        <option value="MULTIPLE_CHOICE">چندانتخابی</option>
                      </select>
                    </label>

                    <div className="polls-date-time-field">
                      <LocalizedDatePicker
                        label="تاریخ شروع"
                        language="fa"
                        value={form.startsAt || null}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            startsAt: value ?? "",
                          }))
                        }
                        placeholder="انتخاب تاریخ شروع"
                      />

                      <label className="polls-field">
                        <span>ساعت شروع</span>
                        <input
                          type="time"
                          value={form.startsAtTime}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              startsAtTime: event.target.value,
                            }))
                          }
                          disabled={!form.startsAt}
                        />
                      </label>
                    </div>

                    <div className="polls-date-time-field">
                      <LocalizedDatePicker
                        label="تاریخ پایان"
                        language="fa"
                        value={form.endsAt || null}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            endsAt: value ?? "",
                          }))
                        }
                        placeholder="انتخاب تاریخ پایان"
                      />

                      <label className="polls-field">
                        <span>ساعت پایان</span>
                        <input
                          type="time"
                          value={form.endsAtTime}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              endsAtTime: event.target.value,
                            }))
                          }
                          disabled={!form.endsAt}
                        />
                      </label>
                    </div>
                  </div>

                  <label className="polls-switch-row">
                    <span>
                      <strong>نمایش نتایج برای کاربران</strong>
                      <small>
                        کاربران پس از شرکت در نظرسنجی می‌توانند نتایج را ببینند.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.showResults}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          showResults: event.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="polls-form-section">
                  <div className="polls-section-heading">
                    <h3>ترجمه‌ها</h3>
                    <div className="polls-language-tabs">
                      {LANGUAGES.map((language) => (
                        <button
                          type="button"
                          key={language.value}
                          className={
                            activeLanguage === language.value ? "active" : ""
                          }
                          onClick={() => setActiveLanguage(language.value)}>
                          {language.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="polls-field">
                    <span>عنوان نظرسنجی</span>
                    <input
                      value={form.translations[activeLanguage].title}
                      onChange={(event) =>
                        updateTranslation("title", event.target.value)
                      }
                      placeholder="عنوان نظرسنجی را وارد کنید..."
                      required={activeLanguage === "fa"}
                      maxLength={200}
                    />
                  </label>

                  <label className="polls-field">
                    <span>توضیحات</span>
                    <textarea
                      value={form.translations[activeLanguage].description}
                      onChange={(event) =>
                        updateTranslation("description", event.target.value)
                      }
                      placeholder="توضیحات اختیاری..."
                      rows={3}
                      maxLength={5000}
                    />
                  </label>
                </div>

                <div className="polls-form-section">
                  <div className="polls-section-heading">
                    <div>
                      <h3>گزینه‌های پاسخ</h3>
                      <p>حداقل دو گزینه برای هر نظرسنجی لازم است.</p>
                    </div>

                    <button
                      type="button"
                      className="polls-add-option-btn"
                      onClick={addOption}>
                      <CirclePlus size={16} />
                      افزودن گزینه
                    </button>
                  </div>

                  <div className="polls-options-list">
                    {form.options.map((option, index) => {
                      const votes = option.id
                        ? (editingPoll?.options.find(
                            (item) => item.id === option.id,
                          )?._count?.votes ?? 0)
                        : 0;

                      return (
                        <div
                          className="polls-option-item"
                          key={option.id || index}>
                          <div className="polls-option-number">{index + 1}</div>

                          <div className="polls-option-input">
                            <label className="polls-field">
                              <span>گزینه {index + 1}</span>
                              <input
                                value={option.translations[activeLanguage]}
                                onChange={(event) =>
                                  updateOptionTranslation(
                                    index,
                                    event.target.value,
                                  )
                                }
                                placeholder={`متن گزینه به زبان ${LANGUAGES.find((item) => item.value === activeLanguage)?.label}`}
                                maxLength={300}
                              />
                            </label>

                            {votes > 0 && (
                              <small className="polls-option-votes">
                                {votes.toLocaleString("fa-IR")} رأی ثبت‌شده
                              </small>
                            )}
                          </div>

                          <button
                            type="button"
                            className="polls-remove-option-btn"
                            onClick={() => removeOption(index)}
                            title="حذف گزینه">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {formError && (
                  <div className="polls-form-error">{formError}</div>
                )}
              </div>

              <div className="polls-modal-footer">
                <button
                  type="button"
                  className="polls-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="polls-primary-btn"
                  disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="polls-spinner" size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  {editingPoll ? "ذخیره تغییرات" : "ایجاد نظرسنجی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resultsOpen && (
        <div
          className="polls-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setResultsOpen(false);
            }
          }}>
          <div className="polls-modal polls-results-modal">
            <div className="polls-modal-header">
              <div>
                <h2>نتایج نظرسنجی</h2>
                <p>
                  {selectedResults
                    ? getTranslation(selectedResults.translations, "fa")
                        ?.title || "گزارش نتایج"
                    : "در حال دریافت اطلاعات..."}
                </p>
              </div>
              <button
                className="polls-close-btn"
                onClick={() => setResultsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="polls-results-content">
              {resultsLoading ? (
                <div className="polls-loading">
                  <Loader2 className="polls-spinner" size={26} />
                  <span>در حال دریافت نتایج...</span>
                </div>
              ) : selectedResults ? (
                <>
                  <div className="polls-results-total">
                    <div className="polls-stat-icon purple">
                      <BarChart3 size={22} />
                    </div>
                    <div>
                      <span>مجموع رأی‌ها</span>
                      <strong>
                        {selectedResults.totalVotes.toLocaleString("fa-IR")}
                      </strong>
                    </div>
                  </div>

                  <div className="polls-results-list">
                    {selectedResults.options.map((option, index) => (
                      <div className="polls-result-item" key={option.id}>
                        <div className="polls-result-info">
                          <strong>
                            {getTranslation(option.translations, "fa")?.label ||
                              `گزینه ${index + 1}`}
                          </strong>
                          <span>
                            {option.votes.toLocaleString("fa-IR")} رأی ·{" "}
                            {option.percentage.toLocaleString("fa-IR")}٪
                          </span>
                        </div>

                        <div
                          className="polls-result-track"
                          role="progressbar"
                          aria-valuenow={option.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}>
                          <div
                            className="polls-result-progress"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollsPage;
