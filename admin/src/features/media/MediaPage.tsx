import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  FileImage,
  FileText,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Search,
  Upload,
  RefreshCw,
  Trash2,
  X,
  Eye,
  Copy,
  Check,
  HardDrive,
  CalendarDays,
  Maximize2,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";

import api from "../../lib/api";

import "./MediaPage.css";

type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";
type MediaFilter = "ALL" | MediaType;

interface Media {
  id: string;
  type: MediaType;
  url: string;
  storageKey: string | null;
  originalName: string | null;
  alt: string | null;
  mimeType: string | null;
  sizeBytes: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface ApiErrorResponse {
  message?: string | string[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

const PAGE_SIZE = 12;

const getMediaUrl = (url: string): string => {
  try {
    return new URL(url, new URL(API_BASE_URL).origin).toString();
  } catch {
    return url;
  }
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message.join("، ");
    if (typeof message === "string") return message;
  }

  return "عملیات انجام نشد. لطفاً دوباره تلاش کن.";
};

const formatFileSize = (size: string | null): string => {
  if (!size) return "نامشخص";

  const bytes = Number(size);

  if (!Number.isFinite(bytes) || bytes < 0) return "نامشخص";
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
};

const formatDate = (date: string): string =>
  new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

const getTypeLabel = (type: MediaType): string => {
  const labels: Record<MediaType, string> = {
    IMAGE: "تصویر",
    VIDEO: "ویدئو",
    DOCUMENT: "سند",
  };

  return labels[type];
};

const getFileName = (media: Media): string =>
  media.originalName || media.storageKey || "فایل بدون نام";

function MediaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("ALL");
  const [selectedType, setSelectedType] = useState<MediaType>("IMAGE");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Media[]>("/admin/media");
      setMedia(response.data);
      setCurrentPage(1);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMedia = async () => {
      try {
        const response = await api.get<Media[]>("/admin/media");

        if (isMounted) {
          setMedia(response.data);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadMedia();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: media.length,
      images: media.filter((item) => item.type === "IMAGE").length,
      videos: media.filter((item) => item.type === "VIDEO").length,
      documents: media.filter((item) => item.type === "DOCUMENT").length,
    }),
    [media],
  );

  const filteredMedia = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return media.filter((item) => {
      const matchesType = activeFilter === "ALL" || item.type === activeFilter;

      const matchesSearch =
        !normalizedSearch ||
        [
          item.originalName ?? "",
          item.mimeType ?? "",
          item.alt ?? "",
          item.storageKey ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [media, activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedMedia = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredMedia.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMedia, safeCurrentPage]);

  const paginationPages = useMemo(() => {
    const maxVisiblePages = 5;
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, safeCurrentPage - half);

    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safeCurrentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", selectedType);

    setUploading(true);
    setError("");
    setNotice("");

    try {
      await api.post<Media>("/admin/media/upload", formData);

      setNotice("فایل با موفقیت آپلود شد.");
      await fetchMedia();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (item: Media) => {
    const confirmed = window.confirm(
      `آیا از حذف فایل «${getFileName(item)}» مطمئن هستی؟`,
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/media/${item.id}`);

      setMedia((current) => current.filter((file) => file.id !== item.id));

      if (selectedMedia?.id === item.id) {
        setSelectedMedia(null);
      }

      setNotice("فایل با موفقیت حذف شد.");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = async (item: Media) => {
    try {
      await navigator.clipboard.writeText(getMediaUrl(item.url));
      setCopiedId(item.id);

      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 1800);
    } catch {
      setError("کپی آدرس فایل انجام نشد.");
    }
  };

  const handleDownload = async (item: Media) => {
    try {
      setDownloadingId(item.id);
      setError("");

      const response = await fetch(getMediaUrl(item.url), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getFileName(item);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch {
      setError("دانلود فایل انجام نشد. لطفاً دوباره تلاش کن.");
    } finally {
      setDownloadingId(null);
    }
  };

  const openUploadDialog = () => {
    fileInputRef.current?.click();
  };

  const renderMediaPreview = (item: Media, large = false) => {
    const url = getMediaUrl(item.url);

    if (item.type === "IMAGE") {
      return (
        <img
          src={url}
          alt={item.alt || getFileName(item)}
          className={large ? "media-preview-large" : "media-card-image"}
          loading="lazy"
        />
      );
    }

    if (item.type === "VIDEO") {
      return (
        <video
          src={url}
          className={large ? "media-preview-large" : "media-card-image"}
          controls={large}
          preload="metadata"
        />
      );
    }

    return (
      <div className={large ? "media-document-large" : "media-document-icon"}>
        <FileText size={large ? 48 : 34} />
        <span>PDF</span>
      </div>
    );
  };

  const startItem = filteredMedia.length
    ? (safeCurrentPage - 1) * PAGE_SIZE + 1
    : 0;

  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filteredMedia.length);

  return (
    <div className="media-page">
      <div className="media-heading">
        <div>
          <span className="media-eyebrow">
            <FolderOpen size={15} />
            مدیریت فایل‌ها
          </span>

          <h1>کتابخانه رسانه</h1>

          <p>
            تصاویر، ویدئوها و اسناد مورد استفاده در وب‌سایت را از این بخش مدیریت
            کن.
          </p>
        </div>

        <div className="media-heading-actions">
          <button
            type="button"
            className="media-secondary-button"
            onClick={() => void fetchMedia()}
            disabled={loading}>
            <RefreshCw size={16} className={loading ? "media-spinning" : ""} />
            بروزرسانی
          </button>

          <button
            type="button"
            className="media-primary-button"
            onClick={openUploadDialog}
            disabled={uploading}>
            <Upload size={17} />
            {uploading ? "در حال آپلود..." : "آپلود فایل"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={
            selectedType === "IMAGE"
              ? "image/jpeg,image/png,image/webp,image/gif"
              : selectedType === "VIDEO"
                ? "video/mp4,video/webm"
                : "application/pdf"
          }
          onChange={(event) => void handleUpload(event)}
        />
      </div>

      {notice && (
        <div className="media-notice">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="media-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="media-stats">
        <article className="media-stat">
          <span className="media-stat-icon purple">
            <HardDrive size={20} />
          </span>
          <div>
            <small>تمام فایل‌ها</small>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="media-stat">
          <span className="media-stat-icon blue">
            <ImageIcon size={20} />
          </span>
          <div>
            <small>تصاویر</small>
            <strong>{stats.images}</strong>
          </div>
        </article>

        <article className="media-stat">
          <span className="media-stat-icon orange">
            <Film size={20} />
          </span>
          <div>
            <small>ویدئوها</small>
            <strong>{stats.videos}</strong>
          </div>
        </article>

        <article className="media-stat">
          <span className="media-stat-icon green">
            <FileText size={20} />
          </span>
          <div>
            <small>اسناد</small>
            <strong>{stats.documents}</strong>
          </div>
        </article>
      </section>

      <section className="media-upload-panel">
        <div className="media-upload-copy">
          <span className="media-upload-icon">
            <Upload size={22} />
          </span>

          <div>
            <strong>افزودن فایل جدید</strong>
            <p>
              تصاویر، ویدئوها و فایل‌های PDF را با حداکثر حجم ۱۰ مگابایت آپلود
              کن.
            </p>
          </div>
        </div>

        <div className="media-upload-controls">
          <select
            value={selectedType}
            onChange={(event) =>
              setSelectedType(event.target.value as MediaType)
            }
            aria-label="نوع فایل">
            <option value="IMAGE">تصویر</option>
            <option value="VIDEO">ویدئو</option>
            <option value="DOCUMENT">سند PDF</option>
          </select>

          <button
            type="button"
            className="media-primary-button"
            onClick={openUploadDialog}
            disabled={uploading}>
            <Plus size={16} />
            انتخاب فایل
          </button>
        </div>
      </section>

      <section className="media-toolbar">
        <label className="media-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="جست‌وجوی نام فایل یا فرمت..."
          />
        </label>

        <div className="media-filters">
          {(
            [
              ["ALL", "همه فایل‌ها"],
              ["IMAGE", "تصاویر"],
              ["VIDEO", "ویدئوها"],
              ["DOCUMENT", "اسناد"],
            ] as [MediaFilter, string][]
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={activeFilter === value ? "active" : ""}
              onClick={() => {
                setActiveFilter(value);
                setCurrentPage(1);
              }}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="media-results-heading">
        <div>
          <h2>فایل‌های ذخیره‌شده</h2>
          <span>{filteredMedia.length} فایل</span>
        </div>
      </div>

      {loading ? (
        <div className="media-state">
          <RefreshCw size={23} className="media-spinning" />
          <span>در حال دریافت فایل‌ها...</span>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="media-state">
          <span className="media-empty-icon">
            <FolderOpen size={29} />
          </span>

          <strong>
            {media.length === 0
              ? "هنوز فایلی آپلود نشده است."
              : "فایلی با این مشخصات پیدا نشد."}
          </strong>

          <p>
            {media.length === 0
              ? "اولین فایل خودت را آپلود کن تا در کتابخانه نمایش داده شود."
              : "عبارت جست‌وجو یا فیلتر انتخاب‌شده را تغییر بده."}
          </p>

          {media.length === 0 && (
            <button
              type="button"
              className="media-primary-button"
              onClick={openUploadDialog}>
              <Upload size={16} />
              آپلود اولین فایل
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="media-grid">
            {paginatedMedia.map((item) => (
              <article className="media-card" key={item.id}>
                <div className="media-card-preview">
                  {renderMediaPreview(item)}

                  <span
                    className={`media-type-badge ${item.type.toLowerCase()}`}>
                    {item.type === "IMAGE" ? (
                      <FileImage size={12} />
                    ) : item.type === "VIDEO" ? (
                      <Film size={12} />
                    ) : (
                      <FileText size={12} />
                    )}
                    {getTypeLabel(item.type)}
                  </span>

                  <button
                    type="button"
                    className="media-preview-button"
                    onClick={() => setSelectedMedia(item)}
                    title="مشاهده فایل"
                    aria-label="مشاهده فایل">
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div className="media-card-content">
                  <strong title={getFileName(item)}>{getFileName(item)}</strong>

                  <div className="media-card-meta">
                    <span>
                      <HardDrive size={12} />
                      {formatFileSize(item.sizeBytes)}
                    </span>

                    <span>
                      <CalendarDays size={12} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.width && item.height && (
                    <small className="media-dimensions">
                      {item.width} × {item.height} پیکسل
                    </small>
                  )}

                  <div className="media-card-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedMedia(item)}
                      title="مشاهده جزئیات">
                      <Eye size={15} />
                      مشاهده
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      title="دانلود فایل"
                      disabled={downloadingId === item.id}>
                      {downloadingId === item.id ? (
                        <RefreshCw size={15} className="media-spinning" />
                      ) : (
                        <Download size={15} />
                      )}
                      دانلود
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCopyUrl(item)}
                      title="کپی آدرس فایل">
                      {copiedId === item.id ? (
                        <Check size={15} />
                      ) : (
                        <Copy size={15} />
                      )}
                      {copiedId === item.id ? "کپی شد" : "کپی لینک"}
                    </button>

                    <button
                      type="button"
                      className="media-delete-button"
                      onClick={() => void handleDelete(item)}
                      disabled={deletingId === item.id}
                      title="حذف فایل">
                      {deletingId === item.id ? (
                        <RefreshCw size={15} className="media-spinning" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="media-pagination" aria-label="صفحه‌بندی رسانه‌ها">
              <div className="media-pagination-info">
                نمایش {startItem} تا {endItem} از {filteredMedia.length} فایل
              </div>

              <div className="media-pagination-controls">
                <button
                  type="button"
                  className="media-pagination-arrow"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  aria-label="صفحه قبلی"
                  title="صفحه قبلی">
                  <ChevronRight size={18} />
                </button>

                {paginationPages[0] > 1 && (
                  <>
                    <button
                      type="button"
                      className="media-pagination-number"
                      onClick={() => handlePageChange(1)}>
                      ۱
                    </button>
                    {paginationPages[0] > 2 && (
                      <span className="media-pagination-dots">...</span>
                    )}
                  </>
                )}

                {paginationPages.map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`media-pagination-number ${
                      safeCurrentPage === page ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                    aria-current={
                      safeCurrentPage === page ? "page" : undefined
                    }>
                    {new Intl.NumberFormat("fa-IR").format(page)}
                  </button>
                ))}

                {paginationPages[paginationPages.length - 1] < totalPages && (
                  <>
                    {paginationPages[paginationPages.length - 1] <
                      totalPages - 1 && (
                      <span className="media-pagination-dots">...</span>
                    )}
                    <button
                      type="button"
                      className="media-pagination-number"
                      onClick={() => handlePageChange(totalPages)}>
                      {new Intl.NumberFormat("fa-IR").format(totalPages)}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="media-pagination-arrow"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="صفحه بعدی"
                  title="صفحه بعدی">
                  <ChevronLeft size={18} />
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {selectedMedia && (
        <div
          className="media-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMedia(null);
            }
          }}>
          <section
            className="media-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-modal-title">
            <header className="media-modal-header">
              <div>
                <span className="media-eyebrow">
                  <FolderOpen size={14} />
                  جزئیات رسانه
                </span>
                <h2 id="media-modal-title">{getFileName(selectedMedia)}</h2>
              </div>

              <button
                type="button"
                className="media-modal-close"
                onClick={() => setSelectedMedia(null)}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <div className="media-modal-body">
              <div className="media-modal-preview">
                {selectedMedia.type === "DOCUMENT" ? (
                  <iframe
                    src={getMediaUrl(selectedMedia.url)}
                    title={getFileName(selectedMedia)}
                  />
                ) : (
                  renderMediaPreview(selectedMedia, true)
                )}
              </div>

              <div className="media-details">
                <div>
                  <small>نام فایل</small>
                  <strong>{getFileName(selectedMedia)}</strong>
                </div>

                <div>
                  <small>نوع فایل</small>
                  <strong>{getTypeLabel(selectedMedia.type)}</strong>
                </div>

                <div>
                  <small>فرمت</small>
                  <strong>{selectedMedia.mimeType || "نامشخص"}</strong>
                </div>

                <div>
                  <small>حجم فایل</small>
                  <strong>{formatFileSize(selectedMedia.sizeBytes)}</strong>
                </div>

                <div>
                  <small>تاریخ آپلود</small>
                  <strong>{formatDate(selectedMedia.createdAt)}</strong>
                </div>

                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <small>ابعاد</small>
                    <strong>
                      {selectedMedia.width} × {selectedMedia.height}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <footer className="media-modal-footer">
              <button
                type="button"
                className="media-secondary-button"
                onClick={() => void handleCopyUrl(selectedMedia)}>
                {copiedId === selectedMedia.id ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {copiedId === selectedMedia.id ? "کپی شد" : "کپی آدرس فایل"}
              </button>

              <button
                type="button"
                className="media-primary-button"
                onClick={() => handleDownload(selectedMedia)}
                disabled={downloadingId === selectedMedia.id}>
                <Download size={16} />
                {downloadingId === selectedMedia.id
                  ? "در حال آماده‌سازی..."
                  : "دانلود فایل"}
              </button>

              <a
                href={getMediaUrl(selectedMedia.url)}
                target="_blank"
                rel="noreferrer"
                className="media-secondary-button">
                <Eye size={16} />
                باز کردن فایل
              </a>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default MediaPage;
