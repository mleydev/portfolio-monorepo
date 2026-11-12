import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Layers3 } from "lucide-react";

import Header from "@/components/layout/Header";
import { getProjectBySlug } from "@/lib/api";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Displays a fallback while project details are loading.
function ProjectFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted">
      در حال بارگذاری اطلاعات پروژه...
    </div>
  );
}

// Renders the selected project's complete information.
async function ProjectDetails({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug, "fa");

  if (!project) {
    notFound();
  }

  const translation = project.translations.find(
    (item) => item.language === "fa",
  );

  if (!translation) {
    notFound();
  }

  return (
    <>
      <Header
        navigation={[
          { label: "خانه", href: "/#home" },
          { label: "درباره من", href: "/#about" },
          { label: "پروژه‌های من", href: "/#projects" },
        ]}
      />

      <main
        dir="rtl"
        className="min-h-screen bg-background px-5 pb-24 pt-32 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          {/* Back navigation */}
          <Link
            href="/#projects"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition hover:text-primary-light">
            <ArrowRight size={17} />
            بازگشت به پروژه‌ها
          </Link>

          {/* Project heading */}
          <div className="mb-10">
            {project.featured && (
              <span className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary-light">
                پروژه منتخب
              </span>
            )}

            <h1 className="text-3xl font-bold text-foreground sm:text-5xl">
              {translation.title}
            </h1>

            {translation.role && (
              <p className="mt-4 text-sm font-semibold text-primary-light sm:text-base">
                {translation.role}
              </p>
            )}

            {translation.summary && (
              <p className="mt-5 max-w-3xl text-sm leading-9 text-muted sm:text-base">
                {translation.summary}
              </p>
            )}
          </div>

          {/* Project cover */}
          <div className="relative mb-12 aspect-video overflow-hidden rounded-2xl border border-border bg-surface">
            {project.coverImage ? (
              <Image
                src={project.coverImage}
                alt={translation.title}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 1100px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Layers3
                  size={72}
                  strokeWidth={1}
                  className="text-primary-light/50"
                />
              </div>
            )}
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            {/* Project description */}
            <section>
              <h2 className="text-xl font-bold text-foreground">
                درباره پروژه
              </h2>

              <div className="mt-5 whitespace-pre-line text-sm leading-9 text-muted">
                {translation.description}
              </div>

              {translation.content && (
                <div className="mt-8 whitespace-pre-line text-sm leading-9 text-muted">
                  {translation.content}
                </div>
              )}
            </section>

            {/* Project information */}
            <aside className="h-fit rounded-2xl border border-border bg-surface/60 p-6">
              <h2 className="text-lg font-bold text-foreground">
                اطلاعات پروژه
              </h2>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">
                  تکنولوژی‌های استفاده‌شده
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-lg border border-border bg-background-secondary px-3 py-2 text-xs text-muted">
                      {technology}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-primary to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-1">
                    مشاهده دمو
                    <ExternalLink size={16} />
                  </a>
                )}

                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary-light">
                    مشاهده سورس کد
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// Defines the project detail page and its loading boundary.
export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <Suspense fallback={<ProjectFallback />}>
      <ProjectDetails params={params} />
    </Suspense>
  );
}
