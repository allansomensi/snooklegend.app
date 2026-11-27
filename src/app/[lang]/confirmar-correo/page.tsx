import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmEmailPage, confirmEmailMetadata } from "@/components/AccountPages";
import { isLocale } from "@/i18n";

// Only in the language whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/confirmar-correo">): Promise<Metadata> {
  const { lang } = await params;
  return lang === "es" ? confirmEmailMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/confirmar-correo">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang !== "es") notFound();
  return <ConfirmEmailPage locale={lang} />;
}
