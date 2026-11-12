import Image from "next/image";
import {
  ArrowUpLeft,
  CalendarDays,
  Tag,
  Star,
} from "lucide-react";

import type {
  BlogArticle,
  HomeSectionTranslation,
} from "@/lib/api";

import {
  getBlogTranslation,
  resolveMediaUrl,
} from "@/lib/api";

interface BlogProps {
  articles: BlogArticle[];
  content?: HomeSectionTranslation;
  index?: number;
  sectionId?: string;
}

function formatDate(date: string | null): string {
  if (!date) return "";

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export default function Blog({
  articles,
  content,
  index = 0,
  sectionId = "blog",
}: BlogProps) {
  const publishedArticles = articles
    .filter((article) => article.status === "PUBLISHED")
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return Number(b.featured) - Number(a.featured);
      }

      return (
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
      );
    });

  if (publishedArticles.length === 0) return null;

  return (
    <section
      id={sectionId}
      className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="mb-12 max-w-2xl"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Tag size={15} />
            وبلاگ و مقالات
          </span>

          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {content?.title || "آخرین مقالات"}
          </h2>

          {content?.subtitle && (
            <p className="mt-3 text-lg text-muted-foreground">
              {content.subtitle}
            </p>
          )}

          {content?.description && (
            <p className="mt-4 leading-8 text-muted-foreground">
              {content.description}
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {publishedArticles.map((article) => {
            const translation = getBlogTranslation(article, "fa");
            if (!translation) return null;

            const imageUrl = resolveMediaUrl(
              article.coverMedia?.url
            );

            const categories = article.categories
              .map((item) => item.category.name)
              .filter(Boolean);

            return (
              <article
                key={article.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={
                        article.coverMedia?.alt ||
                        translation.title
                      }
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Tag size={36} />
                    </div>
                  )}

                  {article.featured && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                      <Star size={13} />
                      ویژه
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {formatDate(article.publishedAt)}
                    </span>

                    {categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-primary/10 px-3 py-1 text-primary"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <h3 className="line-clamp-2 text-xl font-bold leading-8 text-foreground transition-colors group-hover:text-primary">
                    {translation.title}
                  </h3>

                  {translation.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                      {translation.excerpt}
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm font-medium text-primary">
                      مقاله منتشر شده
                    </span>

                    <ArrowUpLeft
                      size={19}
                      className="text-muted-foreground transition-all group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-primary"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
