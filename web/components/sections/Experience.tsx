import { BriefcaseBusiness, CalendarDays } from "lucide-react";

import type {
  Experience as ExperienceItem,
  HomeSectionTranslation,
} from "@/lib/api";

interface ExperienceProps {
  experiences: ExperienceItem[];
  content?: HomeSectionTranslation;
  index?: number;
  sectionId?: string;
}

function formatDate(date: string | null): string {
  if (!date) return "اکنون";

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
  }).format(new Date(date));
}

export default function Experience({
  experiences,
  content,
  index = 0,
  sectionId = "experience",
}: ExperienceProps) {
  const sortedExperiences = experiences
    .filter((item) => item.enabled)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return new Date(b.startDate).getTime() -
        new Date(a.startDate).getTime();
    });

  return (
    <section
      id={sectionId}
      className={`scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 ${
        index % 2 === 1 ? "bg-background-secondary" : "bg-background"
      }`}
    >
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-14 text-center">
          <span className="text-sm font-semibold text-primary-light">
            Career
          </span>

          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {content?.title || "تجربه‌های کاری"}
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

        {sortedExperiences.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/60 px-6 py-14 text-center">
            <BriefcaseBusiness
              size={38}
              className="mx-auto text-primary-light"
              strokeWidth={1.4}
            />
            <p className="mt-4 text-sm text-muted">
              هنوز تجربه کاری برای نمایش ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="relative space-y-6 before:absolute before:right-[19px] before:top-5 before:h-[calc(100%-40px)] before:w-px before:bg-border sm:before:right-6">
            {sortedExperiences.map((experience) => {
              const translation =
                experience.translations.find((item) => item.language === "fa") ??
                experience.translations[0];

              return (
                <article
                  key={experience.id}
                  className="relative pr-12 sm:pr-16"
                >
                  <span className="absolute right-2 top-6 flex size-6 items-center justify-center rounded-full border-4 border-background bg-primary shadow-[0_0_15px_rgba(113,56,245,0.4)] sm:right-3" />

                  <div className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card transition hover:border-primary/40 sm:p-7">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {translation?.title || experience.position}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-primary-light">
                          {experience.organization}
                        </p>
                      </div>

                      <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-xs text-muted">
                        <CalendarDays size={14} />
                        <span>
                          {formatDate(experience.startDate)}
                          {" — "}
                          {experience.current
                            ? "اکنون"
                            : formatDate(experience.endDate)}
                        </span>
                      </div>
                    </div>

                    {translation?.description && (
                      <p className="mt-5 whitespace-pre-line text-sm leading-8 text-muted">
                        {translation.description}
                      </p>
                    )}
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
