import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Check } from "lucide-react";
import { createEditorExtensions } from "./extensions/blog-editor.extensions";

// Import the existing editor extensions from a shared module.

interface BlogArticlePreviewProps {
  content: Record<string, unknown>;
  title: string;
  excerpt: string;
  direction: "rtl" | "ltr";
  languageLabel: string;
  statusLabel: string;
  featured: boolean;
  coverUrl?: string;
  coverAlt?: string;
  onClose: () => void;
}

const BlogArticlePreview = ({
  content,
  title,
  excerpt,
  direction,
  languageLabel,
  statusLabel,
  featured,
  coverUrl,
  coverAlt,
  onClose,
}: BlogArticlePreviewProps) => {
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: content as never,
    editable: false,
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    editor.commands.setContent(content as never);
  }, [content, editor]);

  return (
    <div className="blog-preview-backdrop" onMouseDown={onClose}>
      <section
        className="blog-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label="پیش‌نمایش مقاله"
        onMouseDown={(event) => event.stopPropagation()}>
        {/* Keep the existing preview header, article and footer here. */}

        <div className="blog-preview-body" dir={direction}>
          {coverUrl && (
            <div className="blog-preview-cover">
              <img src={coverUrl} alt={coverAlt ?? title} />
            </div>
          )}

          <article className="blog-preview-article">
            <div className="blog-preview-meta">
              <span>{languageLabel}</span>
              <span>{statusLabel}</span>
              {featured && <span>مقاله ویژه</span>}
            </div>

            <h1 className="blog-preview-title">{title || "عنوان مقاله"}</h1>

            {excerpt && <p className="blog-preview-excerpt">{excerpt}</p>}

            <div className="blog-preview-divider" />

            <div className="blog-preview-content">
              {editor && <EditorContent editor={editor} />}
            </div>
          </article>
        </div>

        <footer className="blog-preview-footer">
          <span>
            <Check size={15} />
            حالت فقط‌خواندنی
          </span>

          <button type="button" className="blog-save-button" onClick={onClose}>
            بازگشت به ویرایشگر
          </button>
        </footer>
      </section>
    </div>
  );
};

export default BlogArticlePreview;
