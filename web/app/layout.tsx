import type { Metadata } from "next";

import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "مهدی لیلایی | توسعه‌دهنده وب",
    template: "%s | مهدی لیلایی",
  },
  description:
    "مهدی لیلایی، توسعه‌دهنده فرانت‌اند با React و Next.js و توسعه‌دهنده بک‌اند با NestJS.",
  keywords: [
    "Mehdi Leilaei",
    "React Developer",
    "Next.js Developer",
    "NestJS Developer",
    "توسعه‌دهنده وب",
  ],
  applicationName: "Mehdi Leilaei Portfolio",
  openGraph: {
    title: "مهدی لیلایی | توسعه‌دهنده وب",
    description: "پورتفولیوی شخصی مهدی لیلایی",
    type: "website",
    locale: "fa_IR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
