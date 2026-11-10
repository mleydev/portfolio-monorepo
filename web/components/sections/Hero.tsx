import { ArrowDown, ArrowLeft, Download, Mail, Send } from "lucide-react";

function GithubIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.51 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.56 0c2.11-1.44 3.04-1.14 3.04-1.14.61 1.53.23 2.67.12 2.95.71.78 1.14 1.78 1.14 3.01 0 4.28-2.61 5.22-5.1 5.5.4.35.76 1.02.76 2.06v3.06c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.554V9h3.565v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-background pt-24 lg:min-h-[760px]">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 top-20 size-[550px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute -left-40 bottom-0 size-[400px] rounded-full bg-purple-700/10 blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(113,56,245,0.10),transparent_38%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:px-12">
        {/* Introduction */}
        <div className="order-2 text-center lg:order-1 lg:text-right">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs text-primary-light">
            <span className="size-2 animate-pulse rounded-full bg-green-400" />
            آماده همکاری در پروژه‌های جدید
          </div>

          <h1 className="text-3xl font-bold leading-[1.7] tracking-tight text-foreground sm:text-4xl lg:text-[48px]">
            سلام، من{" "}
            <span className="bg-gradient-to-l from-primary-light to-purple-400 bg-clip-text text-transparent">
              مهدی لیلایی
            </span>{" "}
            هستم
          </h1>

          <h2 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
            توسعه‌دهنده وب با تخصص در{" "}
            <span className="text-primary-light">React</span>،{" "}
            <span className="text-primary-light">Next.js</span> و{" "}
            <span className="text-primary-light">NestJS</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-muted lg:mx-0">
            علاقه‌مند به ساخت تجربه‌های کاربری مدرن، سریع و کاربردی. از طراحی
            رابط کاربری تا توسعه بک‌اند، تلاش می‌کنم ایده‌ها را به محصولات
            دیجیتال باکیفیت تبدیل کنم.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-primary to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(113,56,245,0.3)] transition hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(113,56,245,0.45)]">
              مشاهده پروژه‌ها
              <ArrowLeft size={16} />
            </a>

            <a
              href="/resume.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary-light">
              دریافت رزومه
              <Download size={16} />
            </a>
          </div>

          <div className="mt-9 flex items-center justify-center gap-5 lg:justify-start">
            {[
              { icon: GithubIcon, href: "https://github.com", label: "GitHub" },
              {
                icon: LinkedInIcon,
                href: "https://linkedin.com",
                label: "LinkedIn",
              },
              { icon: Send, href: "https://t.me", label: "Telegram" },
              { icon: Mail, href: "mailto:mehdi@example.com", label: "Email" },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={label}
                className="text-muted transition hover:-translate-y-1 hover:text-primary-light">
                <Icon size={19} />
              </a>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="relative order-1 mx-auto flex aspect-square w-full max-w-[480px] items-center justify-center lg:order-2">
          <div className="absolute size-[78%] rounded-full border border-primary/20 shadow-[0_0_80px_rgba(113,56,245,0.2)]" />

          <div className="absolute size-[65%] rounded-full bg-gradient-to-br from-primary/40 via-blue-600/20 to-transparent blur-[55px]" />

          <div className="absolute size-[62%] rounded-full border border-purple-400/30 shadow-[0_0_45px_rgba(168,85,247,0.3)]" />

          <div className="relative z-10 flex size-[58%] items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-gradient-to-br from-[#21134e] via-[#101c46] to-[#071020] shadow-[0_0_70px_rgba(113,56,245,0.25)]">
            <span className="font-english text-8xl font-bold tracking-tighter text-white/10 sm:text-9xl">
              ML
            </span>
          </div>

          <div className="absolute bottom-[12%] left-[5%] rounded-xl border border-border bg-surface/80 px-4 py-3 shadow-card backdrop-blur-xl">
            <p className="font-english text-xs font-semibold text-primary-light">
              Web Developer
            </p>
            <p className="mt-1 text-[10px] text-muted">
              React · Next.js · NestJS
            </p>
          </div>

          <div className="absolute right-0 top-[35%] hidden font-english text-sm font-semibold leading-6 text-primary-light sm:block">
            Build
            <br />
            Better
            <br />
            Web
          </div>

          <div className="absolute right-[12%] top-[10%] size-3 rounded-full bg-purple-400 shadow-[0_0_20px_5px_rgba(168,85,247,0.6)]" />
          <div className="absolute bottom-[20%] right-[8%] size-2 rounded-full bg-blue-400 shadow-[0_0_20px_5px_rgba(96,165,250,0.5)]" />
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to about section"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 animate-bounce text-muted transition hover:text-primary-light lg:block">
        <ArrowDown size={20} />
      </a>
    </section>
  );
}
