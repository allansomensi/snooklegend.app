import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordPage, resetPasswordMetadata } from "@/components/AccountPages";
import { isLocale } from "@/i18n";

// Only in the language whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "pt" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/redefinir-senha">): Promise<Metadata> {
  const { lang } = await params;
  return lang === "pt" ? resetPasswordMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/redefinir-senha">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang !== "pt") notFound();
  return <ResetPasswordPage locale={lang} />;
}
