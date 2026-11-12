import Image from "next/image";
import { ArrowUpRight, ExternalLink, Layers3 } from "lucide-react";

import { siGithub } from "simple-icons";

import type { HomeSectionTranslation, Project } from "@/lib/api";

interface ProjectsProps {
  projects: Project[];
  content?: HomeSectionTranslation;
  index?: number;
}

// Renders published portfolio projects using their translated content.
export default function Projects({
  projects,
  content,
  index = 0,
}: ProjectsProps) {
  return (
    <section
      id="projects"
      className={`relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 ${
        index % 2 === 1 ? "bg-background-secondary" : "bg-background"
      }`}>
      {/* Adds subtle background decoration. */}
      <div className="pointer-events-none absolute -left-40 top-20 size-[400px] rounded-full bg-primary/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px]">
        {/* Introduces the projects section using CMS content. */}
        <div className="mb-14 text-center">
          <span className="text-sm font-semibold text-primary-light">
            Portfolio
          </span>

          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {content?.title || "پروژه‌های من"}
          </h2>

          {content?.subtitle && (
            <p className="mt-4 text-sm font-semibold text-primary-light sm:text-base">
              {content.subtitle}
            </p>
          )}

          {content?.description && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-muted">
              {content.description}
            </p>
          )}
        </div>

        {/* Displays a message when no published projects are available. */}
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/60 px-6 py-16 text-center">
            <Layers3
              size={40}
              strokeWidth={1.3}
              className="mx-auto text-primary-light"
            />

            <p className="mt-5 text-sm text-muted">
              در حال حاضر پروژه‌ای برای نمایش وجود ندارد.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 md:grid-cols-2">
            {projects.map((project) => {
              const translation = project.translations[0];

              // Skips projects without a translation for the selected language.
              if (!translation) {
                return null;
              }

              const isFeatured = project.featured;

              return (
                <article
                  key={project.id}
                  className={`group overflow-hidden rounded-2xl border border-border bg-surface/70 shadow-card transition duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_20px_55px_rgba(113,56,245,0.12)] ${
                    isFeatured
                      ? "md:col-span-2 md:grid md:grid-cols-[1.05fr_0.95fr]"
                      : ""
                  }`}>
                  {/* Displays the project cover or a visual placeholder. */}
                  <div
                    className={`relative overflow-hidden bg-gradient-to-br from-primary/20 via-surface to-purple-500/10 ${
                      isFeatured
                        ? "aspect-video md:aspect-auto md:min-h-[320px]"
                        : "aspect-[16/9]"
                    }`}>
                    {project.coverImage ? (
                      <Image
                        src={project.coverImage}
                        alt={translation.title}
                        fill
                        unoptimized
                        sizes={
                          isFeatured
                            ? "(max-width: 768px) 100vw, 50vw"
                            : "(max-width: 768px) 100vw, 50vw"
                        }
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Layers3
                          size={64}
                          strokeWidth={1}
                          className="text-primary-light/50"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />

                    {/* Highlights projects selected as featured in the admin panel. */}
                    {isFeatured && (
                      <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                        پروژه منتخب
                      </span>
                    )}
                  </div>

                  {/* Displays project information and available actions. */}
                  <div className="flex flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground transition group-hover:text-primary-light sm:text-2xl">
                          {translation.title}
                        </h3>

                        {translation.role && (
                          <p className="mt-2 text-xs font-medium text-primary-light">
                            {translation.role}
                          </p>
                        )}
                      </div>

                      <ArrowUpRight
                        size={22}
                        className="shrink-0 text-muted transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary-light"
                      />
                    </div>

                    {/* Shows the short project summary. */}
                    <p className="mt-5 line-clamp-3 text-sm leading-8 text-muted">
                      {translation.summary || translation.description}
                    </p>

                    {/* Lists the technologies used in the project. */}
                    {project.technologies.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {project.technologies.map((technology) => (
                          <span
                            key={technology}
                            className="rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-xs text-muted">
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Renders only the external links available for this project. */}
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-primary to-purple-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-1">
                          مشاهده دمو
                          <ExternalLink size={15} />
                        </a>
                      )}

                      {project.repositoryUrl && (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary-light">
                          سورس کد
                          <svg
                            viewBox="0 0 24 24"
                            className="size-[15px] fill-current"
                            aria-hidden="true">
                            <path d={siGithub.path} />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
