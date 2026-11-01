import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Check,
  CheckCheck,
  Clock3,
  Eye,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";

import api from "../../lib/api";
import "./FeedbackPage.css";

type FeedbackStatus = "NEW" | "REVIEWED" | "ANSWERED" | "ARCHIVED";

type Feedback = {
  id: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  content: string;
  rating: number | null;
  status: FeedbackStatus;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type StatusFilter = "ALL" | FeedbackStatus;

const STATUS_OPTIONS: {
  value: FeedbackStatus;
  label: string;
}[] = [
  { value: "NEW", label: "جدید" },
  { value: "REVIEWED", label: "در حال بررسی" },
  { value: "ANSWERED", label: "پاسخ داده‌شده" },
  { value: "ARCHIVED", label: "بایگانی‌شده" },
];

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  NEW: "جدید",
  REVIEWED: "در حال بررسی",
  ANSWERED: "پاسخ داده‌شده",
  ARCHIVED: "بایگانی‌شده",
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

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Feedback[]>("/admin/feedback");
      setFeedbacks(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFeedbacks();
  }, [fetchFeedbacks]);

  const stats = useMemo(
    () => ({
      total: feedbacks.length,
      new: feedbacks.filter((item) => item.status === "NEW").length,
      reviewed: feedbacks.filter((item) => item.status === "REVIEWED").length,
      answered: feedbacks.filter((item) => item.status === "ANSWERED").length,
    }),
    [feedbacks],
  );

  const filteredFeedbacks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return feedbacks.filter((item) => {
      const searchableText = [
        item.name ?? "",
        item.email ?? "",
        item.subject ?? "",
        item.content,
        item.adminReply ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [feedbacks, search, statusFilter]);

  const handleStatusChange = async (
    feedback: Feedback,
    status: FeedbackStatus,
  ) => {
    if (feedback.status === status) return;

    setError("");
    setNotice("");

    try {
      const response = await api.patch<Feedback>(
        `/admin/feedback/${feedback.id}/status`,
        { status },
      );

      setFeedbacks((current) =>
        current.map((item) => (item.id === feedback.id ? response.data : item)),
      );

      setSelectedFeedback((current) =>
        current?.id === feedback.id ? response.data : current,
      );

      setNotice("وضعیت بازخورد به‌روزرسانی شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const openReplyModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.adminReply ?? "");
    setError("");
  };

  const closeReplyModal = () => {
    if (saving) return;
    setSelectedFeedback(null);
    setReplyText("");
  };

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFeedback || !replyText.trim()) {
      setError("متن پاسخ را وارد کن.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.patch<Feedback>(
        `/admin/feedback/${selectedFeedback.id}/reply`,
        { adminReply: replyText.trim() },
      );

      setFeedbacks((current) =>
        current.map((item) =>
          item.id === selectedFeedback.id ? response.data : item,
        ),
      );

      setSelectedFeedback(null);
      setReplyText("");
      setNotice("پاسخ با موفقیت ثبت شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feedback: Feedback) => {
    const confirmed = window.confirm(
      `آیا از حذف بازخورد «${feedback.subject || feedback.name || "بدون عنوان"}» مطمئن هستی؟`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/feedback/${feedback.id}`);

      setFeedbacks((current) =>
        current.filter((item) => item.id !== feedback.id),
      );

      if (selectedFeedback?.id === feedback.id) {
        setSelectedFeedback(null);
      }

      setNotice("بازخورد با موفقیت حذف شد.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-heading">
        <div>
          <span className="feedback-eyebrow">
            <MessageSquare size={15} />
            ارتباط با مخاطبان
          </span>

          <h1>نظرات و بازخوردها</h1>

          <p>
            پیام‌ها و نظرات دریافت‌شده از کاربران سایت را بررسی و مدیریت کن.
          </p>
        </div>

        <button
          type="button"
          className="feedback-refresh-button"
          onClick={() => void fetchFeedbacks()}
          disabled={loading}>
          <RefreshCw size={17} />
          به‌روزرسانی
        </button>
      </div>

      {notice && (
        <div className="feedback-notice">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      {error && !selectedFeedback && (
        <div className="feedback-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="feedback-stats">
        <article className="feedback-stat">
          <span className="feedback-stat-icon purple">
            <MessageSquare size={20} />
          </span>
          <div>
            <small>تمام بازخوردها</small>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="feedback-stat">
          <span className="feedback-stat-icon orange">
            <Clock3 size={20} />
          </span>
          <div>
            <small>بازخوردهای جدید</small>
            <strong>{stats.new}</strong>
          </div>
        </article>

        <article className="feedback-stat">
          <span className="feedback-stat-icon blue">
            <Eye size={20} />
          </span>
          <div>
            <small>در حال بررسی</small>
            <strong>{stats.reviewed}</strong>
          </div>
        </article>

        <article className="feedback-stat">
          <span className="feedback-stat-icon green">
            <CheckCheck size={20} />
          </span>
          <div>
            <small>پاسخ داده‌شده</small>
            <strong>{stats.answered}</strong>
          </div>
        </article>
      </section>

      <section className="feedback-toolbar">
        <label className="feedback-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو در نام، ایمیل، موضوع و متن..."
          />
        </label>

        <label className="feedback-filter">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            aria-label="فیلتر وضعیت">
            <option value="ALL">همه وضعیت‌ها</option>
            {STATUS_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="feedback-results-heading">
        <div>
          <h2>فهرست بازخوردها</h2>
          <span>{filteredFeedbacks.length} مورد</span>
        </div>
      </div>

      {loading ? (
        <div className="feedback-state">
          <RefreshCw size={23} className="feedback-loading-icon" />
          <span>در حال دریافت بازخوردها...</span>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="feedback-state">
          <span className="feedback-empty-icon">
            <MessageSquare size={27} />
          </span>
          <strong>
            {feedbacks.length === 0
              ? "هنوز بازخوردی ثبت نشده است."
              : "بازخوردی با این جست‌وجو پیدا نشد."}
          </strong>
          <p>
            {feedbacks.length === 0
              ? "پس از ارسال فرم بازخورد توسط کاربران، پیام‌ها در این قسمت نمایش داده می‌شوند."
              : "عبارت جست‌وجو یا فیلتر وضعیت را تغییر بده."}
          </p>
        </div>
      ) : (
        <div className="feedback-list">
          {filteredFeedbacks.map((feedback) => (
            <article className="feedback-card" key={feedback.id}>
              <div className="feedback-card-header">
                <div className="feedback-author">
                  <span className="feedback-avatar">
                    {(feedback.name || "م").charAt(0).toUpperCase()}
                  </span>

                  <div>
                    <strong>{feedback.name || "کاربر ناشناس"}</strong>
                    <span>{feedback.email || "ایمیل ثبت نشده"}</span>
                  </div>
                </div>

                <span
                  className={`feedback-status ${feedback.status.toLowerCase()}`}>
                  <span />
                  {STATUS_LABELS[feedback.status]}
                </span>
              </div>

              <div className="feedback-card-content">
                <div className="feedback-subject-row">
                  <h3>{feedback.subject || "بدون موضوع"}</h3>

                  {feedback.rating !== null && (
                    <span
                      className="feedback-rating"
                      title={`امتیاز ${feedback.rating} از ۵`}>
                      <Star size={14} fill="currentColor" />
                      {feedback.rating}/۵
                    </span>
                  )}
                </div>

                <p>{feedback.content}</p>
              </div>

              {feedback.adminReply && (
                <div className="feedback-reply-preview">
                  <span>
                    <Check size={14} />
                    پاسخ مدیر
                  </span>
                  <p>{feedback.adminReply}</p>
                </div>
              )}

              <div className="feedback-card-footer">
                <div className="feedback-date">
                  <Clock3 size={14} />
                  <time dateTime={feedback.createdAt}>
                    {formatDate(feedback.createdAt)}
                  </time>
                </div>

                <div className="feedback-card-actions">
                  <select
                    value={feedback.status}
                    onChange={(event) =>
                      void handleStatusChange(
                        feedback,
                        event.target.value as FeedbackStatus,
                      )
                    }
                    aria-label="تغییر وضعیت بازخورد"
                    title="تغییر وضعیت">
                    {STATUS_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => openReplyModal(feedback)}
                    title={feedback.adminReply ? "ویرایش پاسخ" : "ثبت پاسخ"}
                    aria-label="ثبت یا ویرایش پاسخ">
                    <Send size={16} />
                  </button>

                  <button
                    type="button"
                    className="feedback-delete-button"
                    onClick={() => void handleDelete(feedback)}
                    title="حذف بازخورد"
                    aria-label="حذف بازخورد">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedFeedback && (
        <div
          className="feedback-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReplyModal();
          }}>
          <section
            className="feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title">
            <header className="feedback-modal-header">
              <div>
                <span className="feedback-eyebrow">
                  <Send size={14} />
                  پاسخ به مخاطب
                </span>
                <h2 id="feedback-modal-title">
                  {selectedFeedback.adminReply
                    ? "ویرایش پاسخ"
                    : "ثبت پاسخ جدید"}
                </h2>
                <p>
                  پاسخ برای بازخورد «{selectedFeedback.subject || "بدون موضوع"}»
                </p>
              </div>

              <button
                type="button"
                className="feedback-modal-close"
                onClick={closeReplyModal}
                disabled={saving}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleReply}>
              <div className="feedback-modal-body">
                <div className="feedback-original-message">
                  <strong>
                    پیام {selectedFeedback.name || "کاربر ناشناس"}
                  </strong>
                  <p>{selectedFeedback.content}</p>
                </div>

                {error && (
                  <div className="feedback-error">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن پیام">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <label className="feedback-field">
                  <span>متن پاسخ مدیر *</span>
                  <textarea
                    rows={6}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="پاسخ خود را برای این بازخورد بنویس..."
                    maxLength={10000}
                    required
                  />
                  <small>
                    {replyText.length.toLocaleString("fa-IR")} / ۱۰۰۰۰
                  </small>
                </label>
              </div>

              <footer className="feedback-modal-footer">
                <button
                  type="button"
                  className="feedback-secondary-button"
                  onClick={closeReplyModal}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="feedback-primary-button"
                  disabled={saving || !replyText.trim()}>
                  <Send size={16} />
                  {saving ? "در حال ثبت..." : "ثبت پاسخ"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default FeedbackPage;
