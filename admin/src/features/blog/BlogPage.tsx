import { lazy, Suspense, useMemo, useState } from "react";
import {
  Search,
  Plus,
  FileText,
  Eye,
  Clock3,
  Archive,
  Star,
  Grid2X2,
  List,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  MessageCircle,
  Tag,
  Languages,
  AlertCircle,
} from "lucide-react";

const BlogFormModal = lazy(() => import("./BlogFormModal"));

import { useBlog } from "./hooks/useBlog";
import {
  BLOG_LANGUAGES,
  BLOG_STATUSES,
  filterBlogArticles,
  formatBlogDate,
  getArticleExcerpt,
  getArticleTitle,
  getStatusLabel,
} from "./utils/blog.utils";

import type {
  BlogArticle,
  BlogArticleStatus,
  BlogLanguage,
  CreateBlogArticlePayload,
} from "./types/blog.types";

import "./BlogPage.css";

import api from "../../lib/api";

type ViewMode = "grid" | "list";

const PAGE_SIZE = 9;

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return "";

  try {
    const baseUrl = api.defaults.baseURL ?? "http://localhost:4000/api/v1";

    return new URL(url, new URL(baseUrl).origin).toString();
  } catch {
    return url;
  }
};

const getStatusClass = (status: BlogArticleStatus) => {
  const classes: Record<BlogArticleStatus, string> = {
    DRAFT: "draft",
    SCHEDULED: "scheduled",
    PUBLISHED: "published",
    ARCHIVED: "archived",
  };

  return classes[status];
};

const getStatusIcon = (status: BlogArticleStatus) => {
  switch (status) {
    case "PUBLISHED":
      return <Eye size={14} />;
    case "SCHEDULED":
      return <Clock3 size={14} />;
    case "ARCHIVED":
      return <Archive size={14} />;
    default:
      return <FileText size={14} />;
  }
};

const BlogStats = ({ articles }: { articles: BlogArticle[] }) => {
  const stats = [
    {
      label: "تمام مقالات",
      value: articles.length,
      icon: <FileText size={21} />,
      color: "purple",
    },
    {
      label: "منتشر شده",
      value: articles.filter((item) => item.status === "PUBLISHED").length,
      icon: <Eye size={21} />,
      color: "green",
    },
    {
      label: "پیش‌نویس",
      value: articles.filter((item) => item.status === "DRAFT").length,
      icon: <Pencil size={21} />,
      color: "orange",
    },
    {
      label: "زمان‌بندی شده",
      value: articles.filter((item) => item.status === "SCHEDULED").length,
      icon: <Clock3 size={21} />,
      color: "blue",
    },
  ];

  return (
    <div className="blog-stats-grid">
      {stats.map((stat) => (
        <div className="blog-stat-card" key={stat.label}>
          <div className={`blog-stat-icon ${stat.color}`}>{stat.icon}</div>

          <div className="blog-stat-content">
            <span>{stat.label}</span>
            <strong>{stat.value.toLocaleString("fa-IR")}</strong>
          </div>
        </div>
      ))}
    </div>
  );
};

interface BlogFiltersProps {
  search: string;
  status: BlogArticleStatus | "ALL";
  language: BlogLanguage | "ALL";
  featured: "ALL" | "FEATURED" | "REGULAR";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: BlogArticleStatus | "ALL") => void;
  onLanguageChange: (value: BlogLanguage | "ALL") => void;
  onFeaturedChange: (value: "ALL" | "FEATURED" | "REGULAR") => void;
}

const BlogFilters = ({
  search,
  status,
  language,
  featured,
  onSearchChange,
  onStatusChange,
  onLanguageChange,
  onFeaturedChange,
}: BlogFiltersProps) => {
  return (
    <div className="blog-filters">
      <div className="blog-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="جست‌وجوی عنوان، اسلاگ یا توضیحات..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        {search && (
          <button
            type="button"
            className="blog-search-clear"
            onClick={() => onSearchChange("")}
            aria-label="پاک کردن جست‌وجو">
            ×
          </button>
        )}
      </div>

      <div className="blog-filter-selects">
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as BlogArticleStatus | "ALL")
          }
          aria-label="فیلتر وضعیت مقاله">
          <option value="ALL">تمام وضعیت‌ها</option>
          {BLOG_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={language}
          onChange={(event) =>
            onLanguageChange(event.target.value as BlogLanguage | "ALL")
          }
          aria-label="فیلتر زبان مقاله">
          <option value="ALL">تمام زبان‌ها</option>
          {BLOG_LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.nativeLabel}
            </option>
          ))}
        </select>

        <select
          value={featured}
          onChange={(event) =>
            onFeaturedChange(
              event.target.value as "ALL" | "FEATURED" | "REGULAR",
            )
          }
          aria-label="فیلتر مقالات ویژه">
          <option value="ALL">همه مقالات</option>
          <option value="FEATURED">مقالات ویژه</option>
          <option value="REGULAR">مقالات عادی</option>
        </select>
      </div>
    </div>
  );
};

interface BlogCardProps {
  article: BlogArticle;
  viewMode: ViewMode;
  onEdit: (article: BlogArticle) => void;
  onView: (article: BlogArticle) => void;
  onDelete: (article: BlogArticle) => void;
}

const BlogCard = ({
  article,
  viewMode,
  onEdit,
  onView,
  onDelete,
}: BlogCardProps) => {
  const title = getArticleTitle(article);
  const excerpt = getArticleExcerpt(article);
  const translation = article.translations[0];

  const categoryNames = article.categories
    .map((item) => item.category.translations[0]?.name)
    .filter(Boolean);

  return (
    <article className={`blog-article-card ${viewMode}`}>
      <div className="blog-card-cover">
        {article.coverMedia?.url ? (
          <img
            src={resolveMediaUrl(article.coverMedia.url)}
            alt={title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="blog-cover-placeholder">
            <FileText size={38} />
            <span>بدون تصویر کاور</span>
          </div>
        )}

        {article.featured && (
          <span className="blog-featured-badge">
            <Star size={13} fill="currentColor" />
            ویژه
          </span>
        )}

        <span className={`blog-status-badge ${getStatusClass(article.status)}`}>
          {getStatusIcon(article.status)}
          {getStatusLabel(article.status)}
        </span>
      </div>

      <div className="blog-card-body">
        <div className="blog-card-meta">
          <span>
            <CalendarDays size={14} />
            {formatBlogDate(article.createdAt)}
          </span>

          <span>
            <Languages size={14} />
            {article.translations.length} زبان
          </span>
        </div>

        <h3 className="blog-card-title">{title}</h3>

        <p className="blog-card-excerpt">{excerpt}</p>

        {categoryNames.length > 0 && (
          <div className="blog-card-categories">
            {categoryNames.slice(0, 3).map((name, index) => (
              <span key={`${name}-${index}`}>
                <Tag size={12} />
                {name}
              </span>
            ))}
          </div>
        )}

        <div className="blog-card-footer">
          <div className="blog-card-comments">
            <MessageCircle size={15} />
            {article.allowComments ? "نظرات فعال" : "نظرات غیرفعال"}
          </div>

          <div className="blog-card-actions">
            <button
              type="button"
              title="مشاهده جزئیات"
              onClick={() => onView(article)}>
              <Eye size={16} />
            </button>

            <button
              type="button"
              title="ویرایش مقاله"
              onClick={() => onEdit(article)}>
              <Pencil size={16} />
            </button>

            <button
              type="button"
              className="danger"
              title="حذف مقاله"
              onClick={() => onDelete(article)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {translation?.slug && (
          <div className="blog-card-slug" dir="ltr">
            /{translation.slug}
          </div>
        )}
      </div>
    </article>
  );
};

const BlogPage = () => {
  const {
    articles,
    loading,
    error,
    refresh,
    createArticle,
    updateArticle,
    deleteArticle,
  } = useBlog();

  const [articleToDelete, setArticleToDelete] = useState<BlogArticle | null>(
    null,
  );
  const [formMode, setFormMode] = useState<"create" | "edit" | "view" | null>(
    null,
  );

  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(
    null,
  );

  const openCreateForm = () => {
    setSelectedArticle(null);
    setFormMode("create");
  };

  const openEditForm = (article: BlogArticle) => {
    setSelectedArticle(article);
    setFormMode("edit");
  };

  const openViewForm = (article: BlogArticle) => {
    setSelectedArticle(article);
    setFormMode("view");
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedArticle(null);
  };

  const handleFormSubmit = async (payload: CreateBlogArticlePayload) => {
    if (formMode === "edit" && selectedArticle) {
      await updateArticle(selectedArticle.id, payload);
    } else {
      await createArticle(payload);
    }

    closeForm();
  };

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BlogArticleStatus | "ALL">("ALL");
  const [language, setLanguage] = useState<BlogLanguage | "ALL">("ALL");
  const [featured, setFeatured] = useState<"ALL" | "FEATURED" | "REGULAR">(
    "ALL",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    const result = filterBlogArticles(articles, {
      search,
      status,
      language,
      featured,
    });

    return [...result].sort((a, b) => {
      const firstDate = new Date(a.createdAt).getTime();
      const secondDate = new Date(b.createdAt).getTime();

      return sortOrder === "newest"
        ? secondDate - firstDate
        : firstDate - secondDate;
    });
  }, [articles, search, status, language, featured, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const visibleArticles = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredArticles.slice(start, start + PAGE_SIZE);
  }, [filteredArticles, safePage]);

  const handleDelete = (article: BlogArticle) => {
    setArticleToDelete(article);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;

    setDeletingId(articleToDelete.id);

    try {
      await deleteArticle(articleToDelete.id);
      setArticleToDelete(null);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "حذف مقاله با خطا مواجه شد.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setLanguage("ALL");
    setFeatured("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search !== "" ||
    status !== "ALL" ||
    language !== "ALL" ||
    featured !== "ALL";

  return (
    <div className="blog-page" dir="rtl">
      <div className="blog-page-header">
        <div>
          <div className="blog-breadcrumb">
            <span>مدیریت محتوا</span>
            <ChevronLeft size={14} />
            <strong>وبلاگ</strong>
          </div>

          <h1>مدیریت وبلاگ</h1>
          <p>مقالات، ترجمه‌ها و محتوای وب‌سایت خود را مدیریت کنید.</p>
        </div>

        <div className="blog-header-actions">
          <button
            type="button"
            className="blog-refresh-button"
            onClick={() => void refresh()}
            disabled={loading}>
            <RefreshCw size={17} className={loading ? "spinning" : ""} />
            بروزرسانی
          </button>

          <button
            type="button"
            className="blog-create-button"
            onClick={openCreateForm}>
            <Plus size={19} />
            مقاله جدید
          </button>
        </div>
      </div>

      <BlogStats articles={articles} />

      <section className="blog-content-panel">
        <div className="blog-panel-heading">
          <div>
            <h2>مقالات وبلاگ</h2>
            <span>
              {filteredArticles.length.toLocaleString("fa-IR")} مقاله یافت شد
            </span>
          </div>

          <div className="blog-view-switch">
            <button
              type="button"
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="نمایش شبکه‌ای"
              title="نمایش شبکه‌ای">
              <Grid2X2 size={17} />
            </button>

            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="نمایش لیستی"
              title="نمایش لیستی">
              <List size={18} />
            </button>
          </div>
        </div>

        <BlogFilters
          search={search}
          status={status}
          language={language}
          featured={featured}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          onStatusChange={(value) => {
            setStatus(value);
            setCurrentPage(1);
          }}
          onLanguageChange={(value) => {
            setLanguage(value);
            setCurrentPage(1);
          }}
          onFeaturedChange={(value) => {
            setFeatured(value);
            setCurrentPage(1);
          }}
        />

        <div className="blog-results-toolbar">
          <span>
            نمایش {visibleArticles.length.toLocaleString("fa-IR")} از{" "}
            {filteredArticles.length.toLocaleString("fa-IR")} مقاله
          </span>

          <div className="blog-sort-control">
            <label htmlFor="blog-sort">مرتب‌سازی:</label>
            <select
              id="blog-sort"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "newest" | "oldest")
              }>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="blog-reset-filters"
              onClick={resetFilters}>
              پاک کردن فیلترها
            </button>
          )}
        </div>

        {error && (
          <div className="blog-error-state">
            <AlertCircle size={19} />
            <span>{error}</span>
            <button type="button" onClick={() => void refresh()}>
              تلاش مجدد
            </button>
          </div>
        )}

        {loading ? (
          <div className="blog-loading-state">
            <div className="blog-loader" />
            <span>در حال دریافت مقالات...</span>
          </div>
        ) : visibleArticles.length > 0 ? (
          <div className={`blog-articles-container ${viewMode}`}>
            {visibleArticles.map((article) => (
              <div
                key={article.id}
                className={
                  deletingId === article.id ? "blog-card-deleting" : ""
                }>
                <BlogCard
                  article={article}
                  viewMode={viewMode}
                  onEdit={openEditForm}
                  onView={openViewForm}
                  onDelete={(item) => void handleDelete(item)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="blog-empty-state">
            <div className="blog-empty-icon">
              <FileText size={35} />
            </div>

            <h3>
              {articles.length === 0
                ? "هنوز مقاله‌ای ایجاد نشده است"
                : "مقاله‌ای پیدا نشد"}
            </h3>

            <p>
              {articles.length === 0
                ? "اولین مقاله وبلاگ خود را ایجاد کنید."
                : "عبارت جست‌وجو یا فیلترهای انتخاب‌شده را تغییر دهید."}
            </p>

            {articles.length === 0 ? (
              <button
                type="button"
                className="blog-create-button"
                onClick={openCreateForm}>
                <Plus size={18} />
                ایجاد اولین مقاله
              </button>
            ) : (
              <button
                type="button"
                className="blog-reset-filters"
                onClick={resetFilters}>
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}

        {!loading && filteredArticles.length > PAGE_SIZE && (
          <div className="blog-pagination">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
              <ChevronRight size={17} />
              قبلی
            </button>

            <div className="blog-page-numbers">
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safePage) <= 1,
                )
                .map((page, index, pages) => (
                  <span className="blog-page-number-wrap" key={page}>
                    {index > 0 && page - pages[index - 1] > 1 && (
                      <span className="blog-page-dots">...</span>
                    )}

                    <button
                      type="button"
                      className={safePage === page ? "active" : ""}
                      onClick={() => setCurrentPage(page)}>
                      {page.toLocaleString("fa-IR")}
                    </button>
                  </span>
                ))}
            </div>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }>
              بعدی
              <ChevronLeft size={17} />
            </button>
          </div>
        )}
      </section>
      {formMode && (
        <Suspense
          fallback={
            <div className="blog-modal-loading" role="status">
              در حال بارگذاری ویرایشگر...
            </div>
          }>
          <BlogFormModal
            mode={formMode}
            article={selectedArticle}
            onClose={closeForm}
            onSubmit={handleFormSubmit}
          />
        </Suspense>
      )}
      {articleToDelete && (
        <div
          className="blog-delete-backdrop"
          onMouseDown={() => {
            if (!deletingId) setArticleToDelete(null);
          }}>
          <section
            className="blog-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="blog-delete-title"
            onMouseDown={(event) => event.stopPropagation()}>
            <div className="blog-delete-icon">
              <Trash2 size={25} />
            </div>

            <h2 id="blog-delete-title">حذف مقاله</h2>

            <p>
              آیا از حذف مقاله{" "}
              <strong>«{getArticleTitle(articleToDelete)}»</strong> مطمئن هستید؟
            </p>

            <span className="blog-delete-warning">
              با حذف این مقاله، اطلاعات و محتوای مرتبط با آن از سیستم حذف خواهد
              شد. این عملیات قابل بازگشت نیست.
            </span>

            <div className="blog-delete-actions">
              <button
                type="button"
                className="blog-delete-cancel"
                onClick={() => setArticleToDelete(null)}
                disabled={!!deletingId}>
                لغو درخواست
              </button>

              <button
                type="button"
                className="blog-delete-confirm"
                onClick={() => void confirmDelete()}
                disabled={!!deletingId}>
                {deletingId ? "در حال حذف..." : "حذف مقاله"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
