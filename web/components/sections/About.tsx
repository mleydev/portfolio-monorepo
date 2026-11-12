import Image from "next/image";
import { Download, Mail, MapPin, Phone, UserRound } from "lucide-react";

import type { HomeSectionTranslation, Profile } from "@/lib/api";

interface AboutProps {
  profile: Profile;
  content?: HomeSectionTranslation;
  index?: number;
}

// Renders the profile information retrieved from the backend.
export default function About({ profile, content, index = 0 }: AboutProps) {
  const translation = profile.translations[0];

  if (!translation) {
    return null;
  }

  const contactItems = [
    profile.location
      ? { label: "موقعیت مکانی", value: profile.location, icon: MapPin }
      : null,
    profile.email ? { label: "ایمیل", value: profile.email, icon: Mail } : null,
    profile.phone ? { label: "تلفن", value: profile.phone, icon: Phone } : null,
  ].filter((item) => item !== null);

  return (
    <section
      id="about"
      className={`relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 ${
        index % 2 === 1 ? "bg-background-secondary" : "bg-background"
      }`}>
      {/* Adds subtle background decoration matching the hero section. */}
      <div className="pointer-events-none absolute -right-40 top-10 size-[400px] rounded-full bg-primary/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px]">
        {/* Introduces the about section. */}
        <div className="mb-14 text-center">
          <span className="text-sm font-semibold text-primary-light">
            {translation.role}
          </span>

          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {content?.title || "درباره من"}
          </h2>

          {content?.subtitle && (
            <p className="mt-4 text-sm text-muted sm:text-base">
              {content.subtitle}
            </p>
          )}
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Displays the profile avatar with a decorative frame. */}
          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="absolute -inset-4 rounded-[2rem] border border-primary/20 rotate-3" />

            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-card">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={translation.fullName}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/10">
                  <UserRound
                    size={100}
                    strokeWidth={1}
                    className="text-primary-light/60"
                  />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-16">
                <p className="text-xl font-bold text-white">
                  {translation.fullName}
                </p>
                <p className="mt-1 text-sm text-white/70">{translation.role}</p>
              </div>
            </div>
          </div>

          {/* Displays the biography and available contact information. */}
          <div>
            <h3 className="text-2xl font-bold leading-relaxed text-foreground sm:text-3xl">
              {translation.fullName}
            </h3>

            <p className="mt-2 font-semibold text-primary-light">
              {translation.role}
            </p>

            <p className="mt-6 whitespace-pre-line text-sm leading-9 text-muted sm:text-base">
              {translation.bio}
            </p>

            {/* Renders only contact details available in the profile. */}
            {contactItems.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {contactItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-light">
                        <Icon size={19} />
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs text-muted">{item.label}</p>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shows the resume action only when a resume URL exists. */}
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-primary to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(113,56,245,0.25)] transition hover:-translate-y-1">
                دریافت رزومه
                <Download size={17} />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
