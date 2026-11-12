import { Suspense } from "react";

import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import LanguageSkills from "@/components/sections/LanguageSkills";
import Experience from "@/components/sections/Experience";
import Blog from "@/components/sections/Blog";

import {
  getHomeSections,
  getProfile,
  getProjects,
  getSkills,
  getLanguageSkills,
  getExperiences,
  getBlogArticles,
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
      className={`min-h-[300px] scroll-mt-24 px-5 py-24 text-center ${
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
  const [
    sectionsResponse,
    socialResponse,
    profile,
    projectsResponse,
    skillsResponse,
    languagesResponse,
    experiencesResponse,
    blogResponse,
  ] = await Promise.all([
    getHomeSections("fa"),
    getSocialLinks(),
    getProfile("fa"),
    getProjects("fa", 1, 50),
    getSkills("fa"),
    getLanguageSkills("fa"),
    getExperiences("fa", 1, 50),
    getBlogArticles("fa", 1, 6),
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
      <Header navigation={navigation} contactHref={contactHref} />

      <main>
        {heroSection && (
          <Hero
            content={getSectionTranslation(heroSection, "fa")}
            socialLinks={socialResponse}
          />
        )}

        {otherSections.map((section, index) => {
          const content = getSectionTranslation(section, "fa");

          if (section.key === "about" || section.type === "about") {
            return (
              <About
                key={section.id}
                profile={profile}
                content={content}
                index={index}
              />
            );
          }

          if (section.key === "projects" || section.type === "projects") {
            return (
              <Projects
                key={section.id}
                projects={projectsResponse.data}
                content={content}
                index={index}
              />
            );
          }

          if (section.key === "skills" || section.type === "skills") {
            return (
              <Skills
                key={section.id}
                skills={skillsResponse}
                content={content}
                index={index}
                sectionId={section.key}
              />
            );
          }

          if (
            ["language-skills", "languages"].includes(section.key) ||
            ["language-skills", "languages"].includes(section.type)
          ) {
            return (
              <LanguageSkills
                key={section.id}
                languages={languagesResponse}
                content={content}
                index={index}
                sectionId={section.key}
              />
            );
          }

          if (section.key === "experience" || section.type === "experience") {
            return (
              <Experience
                key={section.id}
                experiences={experiencesResponse.data}
                content={content}
                index={index}
                sectionId={section.key}
              />
            );
          }

          if (section.key === "blog" || section.type === "blog") {
            return (
              <Blog
                key={section.id}
                articles={blogResponse.data}
                content={content}
                index={index}
                sectionId={section.key}
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
