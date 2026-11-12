import { Suspense } from "react";

import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";

import {
  getHomeSections,
  getProfile,
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

// Renders generic sections that do not have dedicated components.
function HomeSectionRenderer({
  section,
  index,
}: {
  section: HomeSection;
  index: number;
}) {
  const content = getSectionTranslation(section, "fa");

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

// Fetches homepage content and profile data in parallel.
async function HomeContent() {
  const [sectionsResponse, socialResponse, profile] = await Promise.all([
    getHomeSections("fa"),
    getSocialLinks(),
    getProfile("fa"),
  ]);

  // Keeps enabled sections in their configured display order.
  const sections = sectionsResponse
    .filter((section) => section.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Separates the hero section from the remaining sections.
  const heroSection = sections.find(
    (section) => section.key === "hero" || section.type === "hero",
  );

  const otherSections = sections.filter(
    (section) => section.id !== heroSection?.id,
  );

  // Builds navigation links from enabled CMS sections.
  const navigation = [
    { label: "خانه", href: "#home" },
    ...otherSections.map((section) => ({
      label: getSectionTranslation(section, "fa")?.title || section.key,
      href: `#${section.key}`,
    })),
  ];

  // Resolves the contact link only when a contact section is enabled.
  const contactSection = otherSections.find(
    (section) => section.key === "contact" || section.type === "contact",
  );

  const contactHref = contactSection ? `#${contactSection.key}` : undefined;

  return (
    <>
      {/* Renders the header with CMS-managed navigation. */}
      <Header navigation={navigation} contactHref={contactHref} />

      <main>
        {/* Renders the hero section with CMS content and social links. */}
        {heroSection && (
          <Hero
            content={getSectionTranslation(heroSection, "fa")}
            socialLinks={socialResponse}
          />
        )}

        {/* Renders dedicated and generic sections in CMS order. */}
        {otherSections.map((section, index) => {
          if (section.key === "about" || section.type === "about") {
            return (
              <About
                key={section.id}
                profile={profile}
                content={getSectionTranslation(section, "fa")}
                index={index}
              />
            );
          }

          return (
            <HomeSectionRenderer
              key={section.id}
              section={section}
              index={index}
            />
          );
        })}
      </main>
    </>
  );
}

// Defines the homepage loading boundary.
export default function HomePage() {
  return (
    <Suspense fallback={<SectionFallback />}>
      <HomeContent />
    </Suspense>
  );
}
