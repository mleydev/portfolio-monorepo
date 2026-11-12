import {
  siCss,
  siGit,
  siHtml5,
  siJavascript,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siReact,
  siTailwindcss,
  siTypescript,
} from "simple-icons";

import type { HomeSectionTranslation, Skill } from "@/lib/api";

interface SkillsProps {
  skills: Skill[];
  content?: HomeSectionTranslation;
  index?: number;
  sectionId?: string;
}

const skillIcons: Record<string, { path: string }> = {
  html: siHtml5,
  html5: siHtml5,
  css: siCss,
  css3: siCss,
  react: siReact,
  nextjs: siNextdotjs,
  nextdotjs: siNextdotjs,
  nodejs: siNodedotjs,
  nodedotjs: siNodedotjs,
  nestjs: siNestjs,
  typescript: siTypescript,
  javascript: siJavascript,
  tailwind: siTailwindcss,
  tailwindcss: siTailwindcss,
  git: siGit,
};

// Normalizes category names to avoid duplicate groups.
function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().replace(/[\s_-]/g, "");

  if (["frontend", "front"].includes(normalized)) return "Frontend";
  if (["backend", "back"].includes(normalized)) return "Backend";

  return category.trim();
}

// Resolves the icon associated with a skill.
function getSkillIcon(icon: string | null) {
  if (!icon) return null;

  const key = icon
    .toLowerCase()
    .replace(/^brand:/, "")
    .replace(/[\s_-]/g, "");

  return skillIcons[key] ?? null;
}

// Renders technical skills grouped by category.
export default function Skills({
  skills,
  content,
  index = 0,
  sectionId = "skills",
}: SkillsProps) {
  const enabledSkills = skills
    .filter((skill) => skill.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const groups = enabledSkills.reduce<
    { category: string; skills: Skill[] }[]
  >((result, skill) => {
    const category = normalizeCategory(skill.category || "Other");
    const group = result.find((item) => item.category === category);

    if (group) {
      group.skills.push(skill);
    } else {
      result.push({ category, skills: [skill] });
    }

    return result;
  }, []);

  return (
    <section
      id={sectionId}
      className={`relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-8 lg:px-12 ${
        index % 2 === 1 ? "bg-background-secondary" : "bg-background"
      }`}
    >
      <div className="pointer-events-none absolute -right-40 top-10 size-[400px] rounded-full bg-primary/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mb-14 text-center">
          <span className="text-sm font-semibold text-primary-light">
            Technical Expertise
          </span>

          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {content?.title || "مهارت‌های من"}
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

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/60 px-6 py-16 text-center text-sm text-muted">
            هنوز مهارتی برای نمایش ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <div key={group.category}>
                <h3 className="mb-6 text-xl font-bold text-foreground">
                  {group.category}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.skills.map((skill) => {
                    const translation = skill.translations.find(
                      (item) => item.language === "fa",
                    );
                    const icon = getSkillIcon(skill.icon);
                    const level = Math.min(
                      100,
                      Math.max(0, Number(skill.level) || 0),
                    );

                    return (
                      <article
                        key={skill.id}
                        className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary-light">
                            {icon ? (
                              <svg
                                viewBox="0 0 24 24"
                                className="size-6 fill-current"
                                aria-hidden="true"
                              >
                                <path d={icon.path} />
                              </svg>
                            ) : (
                              <span className="text-lg font-bold">
                                {skill.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-foreground">
                              {translation?.title || skill.name}
                            </h4>
                            <p className="mt-1 text-xs text-muted">
                              {skill.name}
                            </p>
                          </div>

                          <span className="text-sm font-semibold tabular-nums text-primary-light">
                            {level}%
                          </span>
                        </div>

                        <div
                          className="mt-5 h-1.5 overflow-hidden rounded-full bg-background-secondary"
                          role="progressbar"
                          aria-label={translation?.title || skill.name}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={level}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-primary to-purple-500 transition-all"
                            style={{ width: `${level}%` }}
                          />
                        </div>

                        {translation?.description && (
                          <p className="mt-4 text-xs leading-7 text-muted">
                            {translation.description}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
