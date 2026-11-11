import { Suspense } from "react";

import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";

import {
  getHomeSections,
  getSectionTranslation,
  getSocialLinks,
  type HomeSection,
} from "@/lib/api";

// Displays a fallback while dynamic homepage data is loading.
function SectionFallback() {
  return (
    <div className="flex min-h-[300px] items-center justify-center bg-background text-muted">
      در حال بارگذاری محتوا...
    </div>
  );
}

// Renders a generic homepage section using CMS translations.
function HomeSectionRenderer({
  section,
  index,
}: {
  section: HomeSection;
  index: number;
}) {
  const content = getSectionTranslation(section, "fa");

  // The hero section has its own dedicated component.
  if (section.key === "hero" || section.type === "hero") {
    return null;
  }

  return (
    <section
      id={section.key}
      className={`min-h-[300px] px-5 py-24 text-center ${
        index % 2 === 1 ? "bg-background-secondary" : "bg-background"
      }`}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-foreground">
          {content?.title || section.key}
        </h2>

        {content?.subtitle && (
          <h3 className="mt-4 text-lg font-semibold text-primary-light">
            {content.subtitle}
          </h3>
        )}

        {content?.description && (
          <p className="mt-5 text-sm leading-8 text-muted">
            {content.description}
          </p>
        )}
      </div>
    </section>
  );
}

// Fetches homepage sections and social links from the backend.
async function HomeContent() {
  const [sectionsResponse, socialResponse] = await Promise.all([
    getHomeSections("fa"),
    getSocialLinks(),
  ]);

  // Keeps enabled sections in their configured display order.
  const sections = sectionsResponse
    .filter((section) => section.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Separates the hero section from the remaining homepage sections.
  const heroSection = sections.find(
    (section) => section.key === "hero" || section.type === "hero",
  );

  const otherSections = sections.filter(
    (section) => section.id !== heroSection?.id,
  );

  return (
    <>
      {/* Renders the hero section with CMS content and social links. */}
      {heroSection && (
        <Hero
          content={getSectionTranslation(heroSection, "fa")}
          socialLinks={socialResponse}
        />
      )}

      {/* Renders all remaining enabled sections dynamically. */}
      {otherSections.map((section, index) => (
        <HomeSectionRenderer key={section.id} section={section} index={index} />
      ))}
    </>
  );
}

// Defines the homepage layout and loading boundary.
export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <Suspense fallback={<SectionFallback />}>
          <HomeContent />
        </Suspense>
      </main>
    </>
  );
}
