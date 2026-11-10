import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <Hero />

        {/* Upcoming homepage sections */}
        <section
          id="about"
          className="min-h-[300px] bg-background-secondary px-5 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">درباره من</h2>
          <p className="mt-4 text-sm text-muted">
            بخش معرفی و اطلاعات حرفه‌ای به‌زودی اضافه می‌شود.
          </p>
        </section>

        <section id="skills" className="min-h-[300px] px-5 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">مهارت‌ها</h2>
        </section>

        <section
          id="experience"
          className="min-h-[300px] bg-background-secondary px-5 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">تجربه کاری</h2>
        </section>

        <section id="projects" className="min-h-[300px] px-5 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">پروژه‌ها</h2>
        </section>

        <section
          id="blog"
          className="min-h-[300px] bg-background-secondary px-5 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">وبلاگ</h2>
        </section>

        <section id="contact" className="min-h-[300px] px-5 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">تماس با من</h2>
        </section>
      </main>
    </>
  );
}
