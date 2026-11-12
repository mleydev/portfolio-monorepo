import type { HomeSectionTranslation, LanguageSkill } from "@/lib/api";

interface LanguageSkillsProps {
  languages: LanguageSkill[];
  content?: HomeSectionTranslation;
  index?: number;
  sectionId?: string;
}

// Renders spoken languages and their stored proficiency levels.
export default function LanguageSkills({
  languages,
  content,
  index = 0,
  sectionId = "language-skills",
}: LanguageSkillsProps) {
  const enabledLanguages = languages
    .filter((language) => language.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section
      id={sectionId}
      className={`relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-8 lg:px-12 ${
        index % 2 === 1 ? "bg-background-secondary" : "bg-background"
      }`}
    >
      <div className="pointer-events-none absolute -left-40 top-10 size-[400px] rounded-full bg-primary/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mb-14 text-center">
          <span className="text-sm font-semibold text-primary-light">
            Languages
          </span>

          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {content?.title || "زبان‌ها"}
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

        {enabledLanguages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/60 px-6 py-16 text-center text-sm text-muted">
            هنوز زبانی برای نمایش ثبت نشده است.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enabledLanguages.map((language) => {
              const translation = language.translations.find(
                (item) => item.language === "fa",
              );

              const proficiency = Math.min(
                100,
                Math.max(0, Number(language.proficiency) || 0),
              );

              return (
                <article
                  key={language.id}
                  className="rounded-2xl border border-border bg-surface/70 p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {translation?.title || language.name}
                      </h3>

                      <p className="mt-1 text-xs text-muted">
                        {language.name}
                      </p>
                    </div>

                    <span className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary-light">
                      {language.level}
                    </span>
                  </div>

                  {translation?.description && (
                    <p className="mt-5 text-sm leading-7 text-muted">
                      {translation.description}
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-between text-xs">
                    <span className="text-muted">درصد تسلط ثبت‌شده</span>
                    <span className="font-semibold tabular-nums text-primary-light">
                      {proficiency}%
                    </span>
                  </div>

                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-background-secondary"
                    role="progressbar"
                    aria-label={translation?.title || language.name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={proficiency}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-primary to-purple-500 transition-all"
                      style={{ width: `${proficiency}%` }}
                    />
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
