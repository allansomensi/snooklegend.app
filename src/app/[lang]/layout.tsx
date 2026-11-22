import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Document } from "@/components/Document";
import { isLocale } from "@/i18n";
import { buildMetadata, VIEWPORT } from "@/lib/metadata";

// English lives at "/", the other languages under their own path.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "pt" }, { lang: "es" }];
}

export const viewport = VIEWPORT;

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? buildMetadata(lang) : {};
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <Document locale={lang}>{children}</Document>;
}
