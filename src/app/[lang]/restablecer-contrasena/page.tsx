import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordPage, resetPasswordMetadata } from "@/components/AccountPages";
import { isLocale } from "@/i18n";

// Only in the language whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/restablecer-contrasena">): Promise<Metadata> {
  const { lang } = await params;
  return lang === "es" ? resetPasswordMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/restablecer-contrasena">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang !== "es") notFound();
  return <ResetPasswordPage locale={lang} />;
}
