import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  FileText,
  ImagePlus,
  LoaderCircle,
  Save,
  Upload,
  X,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import { createEditorExtensions } from "./extensions/blog-editor.extensions";

import api, { BASE_URL } from "../../lib/api";
import type {
  BlogArticle,
  BlogArticleStatus,
  BlogCategory,
  BlogLanguage,
  BlogTag,
  CreateBlogArticlePayload,
} from "./types/blog.types";

import "./BlogFormModal.css";
const BlogArticlePreview = lazy(() => import("./BlogArticlePreview"));

type FormMode = "create" | "edit" | "view";

interface BlogFormModalProps {
  mode: FormMode;
  article?: BlogArticle | null;
  onClose: () => void;
  onSubmit: (payload: CreateBlogArticlePayload) => Promise<void>;
}

interface TranslationForm {
  title: string;
  slug: string;
  excerpt: string;
  content: Record<string, unknown>;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

interface MediaItem {
  id: string;
  url: string;
  originalName?: string;
  filename?: string;
  mimeType?: string;
  alt?: string | null;
  type?: string;
}

interface DocumentConversionResponse {
  filename: string;
  format: string;
  html: string;
}

const LANGUAGES: {
  value: BlogLanguage;
  label: string;
  nativeLabel: string;
  direction: "rtl" | "ltr";
}[] = [
  { value: "fa", label: "فارسی", nativeLabel: "فارسی", direction: "rtl" },
  { value: "en", label: "انگلیسی", nativeLabel: "English", direction: "ltr" },
  { value: "tr", label: "ترکی", nativeLabel: "Türkçe", direction: "ltr" },
  { value: "ar", label: "عربی", nativeLabel: "العربية", direction: "rtl" },
];

const EMPTY_CONTENT: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const createEmptyTranslation = (): TranslationForm => ({
  title: "",
  slug: "",
  excerpt: "",
  content: EMPTY_CONTENT,
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
});

const createEmptyTranslations = (): Record<BlogLanguage, TranslationForm> => ({
  fa: createEmptyTranslation(),
  en: createEmptyTranslation(),
  tr: createEmptyTranslation(),
  ar: createEmptyTranslation(),
});

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoDate = (value: string) => {
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const resolveMediaUrl = (url: string) => {
  if (!url) return "";

  try {
    const baseUrl = api.defaults.baseURL ?? BASE_URL;
    return new URL(url, new URL(baseUrl).origin).toString();
  } catch {
    return url;
  }
};

const getInitialTranslations = (
  article?: BlogArticle | null,
): Record<BlogLanguage, TranslationForm> => {
  const result = createEmptyTranslations();

  article?.translations.forEach((translation) => {
    result[translation.language] = {
      title: translation.title ?? "",
      slug: translation.slug ?? "",
      excerpt: translation.excerpt ?? "",
      content:
        translation.content &&
        typeof translation.content === "object" &&
        Object.keys(translation.content).length > 0
          ? translation.content
          : EMPTY_CONTENT,
      metaTitle: translation.metaTitle ?? "",
      metaDescription: translation.metaDescription ?? "",
      canonicalUrl: translation.canonicalUrl ?? "",
    };
  });

  return result;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response as {
      data?: { message?: string | string[] };
    };

    const message = response.data?.message;

    if (Array.isArray(message)) return message.join("، ");
    if (typeof message === "string") return message;
  }

  return error instanceof Error
    ? error.message
    : "دریافت اطلاعات با خطا مواجه شد.";
};

const BlogFormModal = ({
  mode,
  article,
  onClose,
  onSubmit,
}: BlogFormModalProps) => {
  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";

  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [activeLanguage, setActiveLanguage] = useState<BlogLanguage>("fa");
  const [translations, setTranslations] = useState(
    getInitialTranslations(article),
  );

  const [previewOpen, setPreviewOpen] = useState(false);

  const [status, setStatus] = useState<BlogArticleStatus>(
    article?.status ?? "DRAFT",
  );
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [allowComments, setAllowComments] = useState(
    article?.allowComments ?? true,
  );

  const [publishedAt, setPublishedAt] = useState(
    toDateTimeLocal(article?.publishedAt),
  );
  const [scheduledAt, setScheduledAt] = useState(
    toDateTimeLocal(article?.scheduledAt),
  );

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    article?.categories.map((item) => item.category.id) ?? [],
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    article?.tags.map((item) => item.tag.id) ?? [],
  );

  const [coverMediaId, setCoverMediaId] = useState(article?.coverMediaId ?? "");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [convertingDocument, setConvertingDocument] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentTranslation = translations[activeLanguage];

  const selectedCover = useMemo(
    () => media.find((item) => item.id === coverMediaId) ?? article?.coverMedia,
    [media, coverMediaId, article?.coverMedia],
  );

  const editor = useEditor({
    extensions: createEditorExtensions("محتوای مقاله را اینجا بنویسید..."),
    content: translations.fa.content as never,
    editable: !isReadOnly,
    onUpdate: ({ editor: currentEditor }) => {
      const content = currentEditor.getJSON() as unknown as Record<
        string,
        unknown
      >;

      setTranslations((current) => ({
        ...current,
        [activeLanguage]: {
          ...current[activeLanguage],
          content,
        },
      }));
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [categoryResponse, tagResponse, mediaResponse] =
          await Promise.all([
            api.get<BlogCategory[]>("/admin/blog/categories"),
            api.get<BlogTag[]>("/admin/blog/tags"),
            api.get<MediaItem[]>("/admin/media", {
              params: { type: "IMAGE" },
            }),
          ]);

        if (cancelled) return;

        setCategories(categoryResponse.data);
        setTags(tagResponse.data);
        setMedia(mediaResponse.data);
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    editor.setEditable(!isReadOnly);
    editor.commands.setContent(translations[activeLanguage].content as never);
  }, [activeLanguage, editor, isReadOnly, translations]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mediaPickerOpen) {
          setMediaPickerOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [mediaPickerOpen, onClose]);

  const updateTranslation = (field: keyof TranslationForm, value: string) => {
    setTranslations((current) => ({
      ...current,
      [activeLanguage]: {
        ...current[activeLanguage],
        [field]: value,
      },
    }));
  };

  const toggleSelection = (
    id: string,
    selected: string[],
    setter: (value: string[]) => void,
  ) => {
    setter(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری قابل آپلود است.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "IMAGE");

    setUploading(true);
    setError("");

    try {
      const response = await api.post<MediaItem>(
        "/admin/media/upload",
        formData,
      );

      setMedia((current) => [response.data, ...current]);
      setCoverMediaId(response.data.id);
      setMediaPickerOpen(false);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const handleEditorImageUpload = async (file?: File) => {
    if (!file || !editor) return;

    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری قابل آپلود است.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "IMAGE");

    setUploading(true);
    setError("");

    try {
      const response = await api.post<MediaItem>(
        "/admin/media/upload",
        formData,
      );

      const uploadedMedia = response.data;
      const imageUrl = resolveMediaUrl(uploadedMedia.url);

      setMedia((current) => [uploadedMedia, ...current]);

      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt:
            uploadedMedia.alt ?? uploadedMedia.originalName ?? "Article image",
        })
        .run();
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentImport = async (file?: File) => {
    if (!file || !editor) return;

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (![".docx", ".pdf"].includes(extension)) {
      setError("فقط فایل‌های Word با فرمت DOCX و فایل PDF قابل تبدیل هستند.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setConvertingDocument(true);
    setError("");

    try {
      const response = await api.post<DocumentConversionResponse>(
        "/admin/media/convert-document",
        formData,
      );

      if (!response.data.html?.trim()) {
        throw new Error("محتوای قابل استفاده‌ای از فایل استخراج نشد.");
      }

      // Resolve relative media URLs before inserting the HTML.
      const parsedDocument = new DOMParser().parseFromString(
        response.data.html,
        "text/html",
      );

      parsedDocument.querySelectorAll("img[src]").forEach((image) => {
        const src = image.getAttribute("src");

        if (src) {
          image.setAttribute("src", resolveMediaUrl(src));
        }
      });

      const html = parsedDocument.body.innerHTML;

      if (!html.trim()) {
        throw new Error("محتوای قابل استفاده‌ای از فایل استخراج نشد.");
      }

      // Replace the current editor content with the imported document.
      editor.commands.setContent(html);

      setError("");
    } catch (conversionError) {
      setError(getErrorMessage(conversionError));
    } finally {
      setConvertingDocument(false);
    }
  };

  const handleOpenPreview = () => {
    if (!editor) return;

    setPreviewOpen(true);
  };

  const changeFontSize = (size: string) => {
    if (!editor) return;

    if (!size) {
      editor.chain().focus().setMark("textStyle", { fontSize: null }).run();

      return;
    }

    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
  };

  const changeFontFamily = (fontFamily: string) => {
    if (!editor) return;

    if (!fontFamily) {
      editor.chain().focus().setMark("textStyle", { fontFamily: null }).run();

      return;
    }

    editor.chain().focus().setMark("textStyle", { fontFamily }).run();
  };

  const changeTextColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
  };

  const changeHighlightColor = (color: string) => {
    if (!editor) return;

    if (!color) {
      editor.chain().focus().unsetHighlight().run();
      return;
    }

    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const clearFormatting = () => {
    editor?.chain().focus().unsetAllMarks().clearNodes().run();
  };

  const setParagraphAlignment = (
    alignment: "left" | "center" | "right" | "justify",
  ) => {
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  const increaseListIndent = () => {
    editor?.chain().focus().sinkListItem("listItem").run();
  };

  const decreaseListIndent = () => {
    editor?.chain().focus().liftListItem("listItem").run();
  };

  const insertCodeBlock = () => {
    if (!editor) return;

    editor.chain().focus().toggleCodeBlock().run();
  };

  const insertInlineCode = () => {
    editor?.chain().focus().toggleCode().run();
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isReadOnly) return;

    const faTranslation = translations.fa;

    if (!faTranslation.title.trim()) {
      setActiveLanguage("fa");
      setError("عنوان فارسی مقاله الزامی است.");
      return;
    }

    if (!faTranslation.slug.trim()) {
      setActiveLanguage("fa");
      setError("اسلاگ فارسی مقاله الزامی است.");
      return;
    }

    if (status === "SCHEDULED" && !scheduledAt) {
      setError("برای مقاله زمان‌بندی‌شده، تاریخ انتشار را مشخص کنید.");
      return;
    }

    const translationPayload = LANGUAGES.filter(({ value }) => {
      if (value === "fa") return true;

      const translation = translations[value];

      return translation.title.trim() !== "" && translation.slug.trim() !== "";
    }).map(({ value }) => {
      const translation = translations[value];

      return {
        language: value,
        title: translation.title.trim(),
        slug: translation.slug.trim(),
        excerpt: translation.excerpt.trim() || undefined,
        content: translation.content,
        metaTitle: translation.metaTitle.trim() || undefined,
        metaDescription: translation.metaDescription.trim() || undefined,
        canonicalUrl: translation.canonicalUrl.trim() || undefined,
      };
    });

    const payload: CreateBlogArticlePayload = {
      status,
      featured,
      allowComments,
      translations: translationPayload,
      categoryIds: selectedCategoryIds,
      tagIds: selectedTagIds,
      ...(coverMediaId ? { coverMediaId } : {}),
      ...(publishedAt ? { publishedAt: toIsoDate(publishedAt) } : {}),
      ...(scheduledAt ? { scheduledAt: toIsoDate(scheduledAt) } : {}),
    };

    setSaving(true);
    setError("");

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!editor || isReadOnly) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;

    const url = window.prompt(
      "آدرس لینک را وارد کنید:",
      previousUrl ?? "https://",
    );

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // const addImageToContent = () => {
  //   if (!editor || isReadOnly) return;

  //   const url = window.prompt("آدرس تصویر را وارد کنید:");

  //   if (url?.trim()) {
  //     editor.chain().focus().setImage({ src: url.trim() }).run();
  //   }
  // };

  const title = isReadOnly
    ? "مشاهده مقاله"
    : isEditing
      ? "ویرایش مقاله"
      : "ایجاد مقاله جدید";

  return (
    <div className="blog-modal-backdrop" onMouseDown={onClose}>
      <section
        className="blog-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-form-title"
        onMouseDown={(event) => event.stopPropagation()}>
        <header className="blog-modal-header">
          <div>
            <span className="blog-modal-eyebrow">BLOG MANAGEMENT</span>
            <h2 id="blog-form-title">{title}</h2>
            <p>
              {isReadOnly
                ? "اطلاعات و محتوای این مقاله"
                : "اطلاعات مقاله و ترجمه‌های آن را مدیریت کنید."}
            </p>
          </div>

          <button
            type="button"
            className="blog-modal-close"
            onClick={onClose}
            aria-label="بستن">
            <X size={20} />
          </button>
        </header>

        <form className="blog-form" onSubmit={handleSave}>
          <div className="blog-form-layout">
            <main className="blog-form-main">
              <section className="blog-form-section">
                <div className="blog-form-section-heading blog-content-heading">
                  <div>
                    <h3>محتوای مقاله</h3>
                    <p>عنوان، آدرس و محتوای هر زبان را وارد کنید.</p>
                  </div>

                  <button
                    type="button"
                    className="blog-preview-button"
                    onClick={handleOpenPreview}
                    disabled={!editor}>
                    <FileText size={16} />
                    پیش‌نمایش مقاله
                  </button>
                </div>

                <div className="blog-language-tabs">
                  {LANGUAGES.map((language) => {
                    const hasContent =
                      translations[language.value].title.trim().length > 0;

                    return (
                      <button
                        type="button"
                        key={language.value}
                        className={
                          activeLanguage === language.value ? "active" : ""
                        }
                        onClick={() => setActiveLanguage(language.value)}>
                        {language.nativeLabel}
                        {hasContent && <span className="blog-language-dot" />}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="blog-translation-fields"
                  dir={
                    LANGUAGES.find((item) => item.value === activeLanguage)
                      ?.direction
                  }>
                  <label className="blog-field">
                    <span>عنوان مقاله</span>
                    <input
                      value={currentTranslation.title}
                      onChange={(event) =>
                        updateTranslation("title", event.target.value)
                      }
                      placeholder="عنوان مقاله را وارد کنید"
                      maxLength={200}
                      required={activeLanguage === "fa" && !isReadOnly}
                      disabled={isReadOnly}
                    />
                  </label>

                  <label className="blog-field">
                    <span>Slug / آدرس مقاله</span>
                    <input
                      dir="ltr"
                      value={currentTranslation.slug}
                      onChange={(event) =>
                        updateTranslation("slug", event.target.value)
                      }
                      placeholder="article-url"
                      maxLength={200}
                      required={activeLanguage === "fa" && !isReadOnly}
                      disabled={isReadOnly}
                    />
                  </label>

                  <label className="blog-field">
                    <span>خلاصه مقاله</span>
                    <textarea
                      value={currentTranslation.excerpt}
                      onChange={(event) =>
                        updateTranslation("excerpt", event.target.value)
                      }
                      placeholder="توضیح کوتاهی درباره مقاله..."
                      rows={3}
                      disabled={isReadOnly}
                    />
                  </label>

                  <div className="blog-field">
                    <span>محتوای مقاله</span>

                    {!isReadOnly && editor && (
                      <div className="blog-editor-toolbar" dir="rtl">
                        {/* Font family */}
                        <select
                          title="نوع فونت"
                          defaultValue=""
                          onChange={(event) =>
                            changeFontFamily(event.target.value)
                          }>
                          <option value="">فونت</option>
                          <option value="Arial">Arial</option>
                          <option value="Tahoma">Tahoma</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Georgia">Georgia</option>
                          <option value="monospace">Monospace</option>
                        </select>

                        {/* Font size */}
                        <select
                          title="اندازه فونت"
                          defaultValue=""
                          onChange={(event) =>
                            changeFontSize(event.target.value)
                          }>
                          <option value="">اندازه</option>
                          <option value="12px">12</option>
                          <option value="14px">14</option>
                          <option value="16px">16</option>
                          <option value="18px">18</option>
                          <option value="20px">20</option>
                          <option value="24px">24</option>
                          <option value="28px">28</option>
                          <option value="32px">32</option>
                          <option value="36px">36</option>
                        </select>

                        <span className="blog-toolbar-divider" />

                        {/* Text formatting */}
                        <button
                          type="button"
                          title="ضخیم"
                          className={editor.isActive("bold") ? "active" : ""}
                          onClick={() =>
                            editor.chain().focus().toggleBold().run()
                          }>
                          <strong>B</strong>
                        </button>

                        <button
                          type="button"
                          title="ایتالیک"
                          className={editor.isActive("italic") ? "active" : ""}
                          onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                          }>
                          <em>I</em>
                        </button>

                        <button
                          type="button"
                          title="زیرخط"
                          className={
                            editor.isActive("underline") ? "active" : ""
                          }
                          onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                          }>
                          <u>U</u>
                        </button>

                        <button
                          type="button"
                          title="خط‌خورده"
                          className={editor.isActive("strike") ? "active" : ""}
                          onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                          }>
                          <s>S</s>
                        </button>

                        <button
                          type="button"
                          title="زیرنویس"
                          className={
                            editor.isActive("subscript") ? "active" : ""
                          }
                          onClick={() =>
                            editor.chain().focus().toggleSubscript().run()
                          }>
                          X₂
                        </button>

                        <button
                          type="button"
                          title="بالانویس"
                          className={
                            editor.isActive("superscript") ? "active" : ""
                          }
                          onClick={() =>
                            editor.chain().focus().toggleSuperscript().run()
                          }>
                          X²
                        </button>

                        <span className="blog-toolbar-divider" />

                        {/* Text color */}
                        <label className="blog-toolbar-color" title="رنگ متن">
                          <strong>A</strong>
                          <input
                            type="color"
                            defaultValue="#334155"
                            onChange={(event) =>
                              changeTextColor(event.target.value)
                            }
                          />
                        </label>

                        {/* Highlight */}
                        <label
                          className="blog-toolbar-color"
                          title="رنگ پس‌زمینه متن">
                          <span>▰</span>
                          <input
                            type="color"
                            defaultValue="#fff176"
                            onChange={(event) =>
                              changeHighlightColor(event.target.value)
                            }
                          />
                        </label>

                        <button
                          type="button"
                          title="حذف هایلایت"
                          onClick={() =>
                            editor.chain().focus().unsetHighlight().run()
                          }>
                          Hx
                        </button>

                        <button
                          type="button"
                          title="پاک کردن قالب‌بندی"
                          onClick={clearFormatting}>
                          Tx
                        </button>

                        <span className="blog-toolbar-divider" />

                        {/* Headings */}
                        <button
                          type="button"
                          className={
                            editor.isActive("heading", { level: 2 })
                              ? "active"
                              : ""
                          }
                          title="عنوان سطح ۲"
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .toggleHeading({ level: 2 })
                              .run()
                          }>
                          H2
                        </button>

                        <button
                          type="button"
                          className={
                            editor.isActive("heading", { level: 3 })
                              ? "active"
                              : ""
                          }
                          title="عنوان سطح ۳"
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .toggleHeading({ level: 3 })
                              .run()
                          }>
                          H3
                        </button>

                        <span className="blog-toolbar-divider" />

                        {/* Paragraph alignment */}
                        <button
                          type="button"
                          title="تراز راست"
                          className={
                            editor.isActive({ textAlign: "right" })
                              ? "active"
                              : ""
                          }
                          onClick={() => setParagraphAlignment("right")}>
                          ≡ راست
                        </button>

                        <button
                          type="button"
                          title="تراز وسط"
                          className={
                            editor.isActive({ textAlign: "center" })
                              ? "active"
                              : ""
                          }
                          onClick={() => setParagraphAlignment("center")}>
                          ≡ وسط
                        </button>

                        <button
                          type="button"
                          title="تراز چپ"
                          className={
                            editor.isActive({ textAlign: "left" })
                              ? "active"
                              : ""
                          }
                          onClick={() => setParagraphAlignment("left")}>
                          ≡ چپ
                        </button>

                        <button
                          type="button"
                          title="تراز دوطرفه"
                          className={
                            editor.isActive({ textAlign: "justify" })
                              ? "active"
                              : ""
                          }
                          onClick={() => setParagraphAlignment("justify")}>
                          ≡ دوطرفه
                        </button>

                        <span className="blog-toolbar-divider" />

                        {/* Lists */}
                        <button
                          type="button"
                          title="لیست نشانه‌دار"
                          className={
                            editor.isActive("bulletList") ? "active" : ""
                          }
                          onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                          }>
                          • لیست
                        </button>

                        <button
                          type="button"
                          title="لیست شماره‌دار"
                          className={
                            editor.isActive("orderedList") ? "active" : ""
                          }
                          onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                          }>
                          1. لیست
                        </button>

                        <button
                          type="button"
                          title="افزایش تورفتگی لیست"
                          onClick={increaseListIndent}>
                          ← تورفتگی
                        </button>

                        <button
                          type="button"
                          title="کاهش تورفتگی لیست"
                          onClick={decreaseListIndent}>
                          تورفتگی →
                        </button>

                        <span className="blog-toolbar-divider" />

                        {/* Code */}
                        <button
                          type="button"
                          title="کد داخل متن"
                          className={editor.isActive("code") ? "active" : ""}
                          onClick={insertInlineCode}>
                          {"</>"}
                        </button>

                        <button
                          type="button"
                          title="بلوک کد"
                          className={
                            editor.isActive("codeBlock") ? "active" : ""
                          }
                          onClick={insertCodeBlock}>
                          بلوک کد
                        </button>

                        <span className="blog-toolbar-divider" />

                        {/* Link */}
                        <button
                          type="button"
                          onClick={addLink}
                          title="افزودن لینک">
                          لینک
                        </button>

                        {/* Image upload */}
                        <button
                          type="button"
                          onClick={() => editorImageInputRef.current?.click()}
                          disabled={uploading || convertingDocument}
                          title="آپلود تصویر از کامپیوتر">
                          {uploading ? (
                            <LoaderCircle className="blog-spin" size={14} />
                          ) : (
                            <ImagePlus size={14} />
                          )}
                          تصویر
                        </button>

                        <input
                          ref={editorImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          hidden
                          disabled={uploading || convertingDocument}
                          onChange={(event) => {
                            void handleEditorImageUpload(
                              event.target.files?.[0],
                            );
                            event.currentTarget.value = "";
                          }}
                        />

                        {/* Word / PDF import */}
                        <button
                          type="button"
                          onClick={() => documentInputRef.current?.click()}
                          disabled={convertingDocument || uploading}
                          title="تبدیل فایل Word یا PDF به محتوای مقاله">
                          {convertingDocument ? (
                            <LoaderCircle className="blog-spin" size={14} />
                          ) : (
                            <FileText size={14} />
                          )}
                          {convertingDocument
                            ? "در حال تبدیل..."
                            : "واردکردن سند"}
                        </button>

                        <input
                          ref={documentInputRef}
                          type="file"
                          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          hidden
                          disabled={convertingDocument || uploading}
                          onChange={(event) => {
                            void handleDocumentImport(event.target.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />

                        {/* Horizontal rule */}
                        <button
                          type="button"
                          title="جداکننده"
                          onClick={() =>
                            editor.chain().focus().setHorizontalRule().run()
                          }>
                          جداکننده
                        </button>
                      </div>
                    )}

                    {convertingDocument && (
                      <div className="blog-form-error" role="status">
                        <LoaderCircle className="blog-spin" size={16} />
                        <span>در حال استخراج و تبدیل محتوای سند...</span>
                      </div>
                    )}

                    <div
                      className={`blog-editor-content ${isReadOnly ? "readonly" : ""}`}
                      dir={
                        LANGUAGES.find((item) => item.value === activeLanguage)
                          ?.direction
                      }>
                      <EditorContent editor={editor} />
                    </div>

                    {editor && (
                      <div className="blog-editor-count">
                        {editor.storage.characterCount.words()} کلمه
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="blog-form-section">
                <div className="blog-form-section-heading">
                  <div>
                    <h3>تنظیمات SEO</h3>
                    <p>اطلاعات موتورهای جست‌وجو برای زبان انتخاب‌شده</p>
                  </div>
                </div>

                <div
                  className="blog-seo-fields"
                  dir={
                    LANGUAGES.find((item) => item.value === activeLanguage)
                      ?.direction
                  }>
                  <label className="blog-field">
                    <span>عنوان SEO</span>
                    <input
                      value={currentTranslation.metaTitle}
                      onChange={(event) =>
                        updateTranslation("metaTitle", event.target.value)
                      }
                      maxLength={200}
                      disabled={isReadOnly}
                      placeholder="عنوان مناسب برای موتور جست‌وجو"
                    />
                  </label>

                  <label className="blog-field">
                    <span>توضیحات SEO</span>
                    <textarea
                      value={currentTranslation.metaDescription}
                      onChange={(event) =>
                        updateTranslation("metaDescription", event.target.value)
                      }
                      rows={3}
                      disabled={isReadOnly}
                      placeholder="توضیحات متای مقاله"
                    />
                  </label>

                  <label className="blog-field">
                    <span>Canonical URL</span>
                    <input
                      dir="ltr"
                      value={currentTranslation.canonicalUrl}
                      onChange={(event) =>
                        updateTranslation("canonicalUrl", event.target.value)
                      }
                      disabled={isReadOnly}
                      placeholder="https://example.com/article"
                    />
                  </label>
                </div>
              </section>
            </main>

            <aside className="blog-form-sidebar">
              <section className="blog-form-section">
                <h3>انتشار مقاله</h3>

                <label className="blog-field">
                  <span>وضعیت</span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as BlogArticleStatus)
                    }
                    disabled={isReadOnly}>
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="PUBLISHED">منتشر شده</option>
                    <option value="SCHEDULED">زمان‌بندی شده</option>
                    <option value="ARCHIVED">بایگانی شده</option>
                  </select>
                </label>

                <label className="blog-field">
                  <span>تاریخ انتشار</span>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    disabled={isReadOnly}
                  />
                </label>

                {status === "SCHEDULED" && (
                  <label className="blog-field">
                    <span>زمان‌بندی انتشار</span>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(event) => setScheduledAt(event.target.value)}
                      disabled={isReadOnly}
                    />
                  </label>
                )}

                <label className="blog-toggle-row">
                  <span>
                    <strong>مقاله ویژه</strong>
                    <small>نمایش در بخش مقالات ویژه</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                    disabled={isReadOnly}
                  />
                </label>

                <label className="blog-toggle-row">
                  <span>
                    <strong>امکان ثبت نظر</strong>
                    <small>کاربران بتوانند نظر ارسال کنند</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(event) => setAllowComments(event.target.checked)}
                    disabled={isReadOnly}
                  />
                </label>
              </section>

              <section className="blog-form-section">
                <div className="blog-form-section-heading">
                  <h3>تصویر کاور</h3>
                  <button
                    type="button"
                    className="blog-text-action"
                    onClick={() => setMediaPickerOpen(true)}
                    disabled={isReadOnly}>
                    <ImagePlus size={15} />
                    انتخاب تصویر
                  </button>
                </div>

                {selectedCover?.url ? (
                  <div className="blog-cover-preview">
                    <img
                      src={resolveMediaUrl(selectedCover.url)}
                      alt={selectedCover.alt ?? "تصویر کاور مقاله"}
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setCoverMediaId("")}
                        aria-label="حذف تصویر کاور">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="blog-cover-empty"
                    onClick={() => setMediaPickerOpen(true)}
                    disabled={isReadOnly}>
                    <ImagePlus size={25} />
                    <span>انتخاب تصویر کاور</span>
                    <small>JPG، PNG، WEBP · حداکثر ۱۰ مگابایت</small>
                  </button>
                )}
              </section>

              <section className="blog-form-section">
                <div className="blog-form-section-heading">
                  <h3>دسته‌بندی‌ها</h3>
                  {loadingOptions && (
                    <LoaderCircle className="blog-spin" size={16} />
                  )}
                </div>

                <div className="blog-check-list">
                  {categories
                    .filter((item) => item.enabled)
                    .map((category) => {
                      const name =
                        category.translations.find(
                          (item) => item.language === "fa",
                        )?.name ??
                        category.translations[0]?.name ??
                        "بدون عنوان";

                      return (
                        <label key={category.id}>
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.id)}
                            onChange={() =>
                              toggleSelection(
                                category.id,
                                selectedCategoryIds,
                                setSelectedCategoryIds,
                              )
                            }
                            disabled={isReadOnly}
                          />
                          <span>{name}</span>
                        </label>
                      );
                    })}

                  {!loadingOptions && categories.length === 0 && (
                    <p className="blog-no-options">
                      دسته‌بندی‌ای ثبت نشده است.
                    </p>
                  )}
                </div>
              </section>

              <section className="blog-form-section">
                <h3>تگ‌ها</h3>

                <div className="blog-check-list">
                  {tags
                    .filter((item) => item.enabled)
                    .map((tag) => {
                      const name =
                        tag.translations.find((item) => item.language === "fa")
                          ?.name ??
                        tag.translations[0]?.name ??
                        "بدون عنوان";

                      return (
                        <label key={tag.id}>
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={() =>
                              toggleSelection(
                                tag.id,
                                selectedTagIds,
                                setSelectedTagIds,
                              )
                            }
                            disabled={isReadOnly}
                          />
                          <span>{name}</span>
                        </label>
                      );
                    })}

                  {!loadingOptions && tags.length === 0 && (
                    <p className="blog-no-options">تگی ثبت نشده است.</p>
                  )}
                </div>
              </section>
            </aside>
          </div>

          {error && (
            <div className="blog-form-error" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <footer className="blog-modal-footer">
            <button
              type="button"
              className="blog-cancel-button"
              onClick={onClose}
              disabled={saving}>
              {isReadOnly ? "بستن" : "انصراف"}
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                className="blog-save-button"
                disabled={saving || uploading || convertingDocument}>
                {saving ? (
                  <LoaderCircle className="blog-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {saving
                  ? "در حال ذخیره..."
                  : isEditing
                    ? "ذخیره تغییرات"
                    : "ایجاد مقاله"}
              </button>
            )}
          </footer>
        </form>
        {previewOpen && (
          <Suspense
            fallback={
              <div className="blog-modal-loading" role="status">
                در حال بارگذاری پیش‌نمایش مقاله...
              </div>
            }>
            <BlogArticlePreview
              content={currentTranslation.content}
              title={currentTranslation.title}
              excerpt={currentTranslation.excerpt}
              direction={
                LANGUAGES.find((item) => item.value === activeLanguage)
                  ?.direction ?? "rtl"
              }
              languageLabel={
                LANGUAGES.find((item) => item.value === activeLanguage)
                  ?.label ?? ""
              }
              statusLabel={status === "PUBLISHED" ? "منتشر شده" : "پیش‌نویس"}
              featured={featured}
              coverUrl={selectedCover?.url}
              coverAlt={selectedCover?.alt ?? currentTranslation.title}
              onClose={() => setPreviewOpen(false)}
            />
          </Suspense>
        )}

        {mediaPickerOpen && (
          <div
            className="blog-media-backdrop"
            onMouseDown={() => setMediaPickerOpen(false)}>
            <section
              className="blog-media-picker"
              onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <h3>کتابخانه رسانه</h3>
                  <p>تصویر موردنظر را انتخاب یا تصویر جدیدی آپلود کنید.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(false)}
                  aria-label="بستن کتابخانه رسانه">
                  <X size={19} />
                </button>
              </header>

              <label className="blog-upload-button">
                {uploading ? (
                  <LoaderCircle className="blog-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {uploading ? "در حال آپلود..." : "آپلود تصویر جدید"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  disabled={uploading}
                  onChange={(event) => {
                    void handleUpload(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              <div className="blog-media-grid">
                {media.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={coverMediaId === item.id ? "selected" : ""}
                    onClick={() => {
                      setCoverMediaId(item.id);
                      setMediaPickerOpen(false);
                    }}>
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={item.alt ?? item.originalName ?? "تصویر"}
                    />
                    {coverMediaId === item.id && (
                      <span className="blog-media-selected">
                        <Check size={16} />
                      </span>
                    )}
                    <small>
                      {item.originalName ?? item.filename ?? "تصویر"}
                    </small>
                  </button>
                ))}

                {media.length === 0 && !loadingOptions && (
                  <p className="blog-no-options">
                    هنوز تصویری در کتابخانه رسانه وجود ندارد.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogFormModal;
