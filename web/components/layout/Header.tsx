"use client";

import { useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";

const navigation = [
  { label: "خانه", href: "#home" },
  { label: "درباره من", href: "#about" },
  { label: "مهارت‌ها", href: "#skills" },
  { label: "تجربه کاری", href: "#experience" },
  { label: "پروژه‌ها", href: "#projects" },
  { label: "وبلاگ", href: "#blog" },
  { label: "تماس", href: "#contact" },
];

export default function Header() {
  const [isDark, setIsDark] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";

    document.documentElement.classList.toggle("light", nextTheme === "light");

    setIsDark(nextTheme === "dark");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a
          href="#home"
          className="flex shrink-0 items-center gap-2"
          aria-label="Mehdi Leilaei - Home">
          <span className="font-english text-2xl font-bold tracking-tighter text-primary-light">
            ML<span className="text-foreground">.</span>
          </span>

          <span className="hidden font-english text-[11px] font-semibold tracking-wide text-foreground sm:block">
            MEHDI LEILAEI
          </span>
        </a>

        <nav className="hidden items-center gap-5 xl:flex">
          {navigation.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              className={`relative py-2 text-xs transition-colors hover:text-primary-light ${
                index === 0 ? "text-primary-light" : "text-muted"
              }`}>
              {item.label}

              {index === 0 && (
                <span className="absolute inset-x-0 -bottom-[19px] h-0.5 rounded-full bg-primary" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-border bg-surface p-1 sm:flex">
            {["FA", "EN", "AR"].map((language) => (
              <button
                key={language}
                type="button"
                disabled={language !== "FA"}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  language === "FA" ? "bg-primary text-white" : "text-muted"
                }`}>
                {language}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:border-primary hover:text-primary-light">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <a
            href="#contact"
            className="hidden items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-light lg:flex">
            همکاری با من
            <ArrowUpRight size={14} />
          </a>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground xl:hidden">
            {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-border bg-background px-5 py-4 xl:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-muted transition hover:bg-surface hover:text-primary-light">
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
