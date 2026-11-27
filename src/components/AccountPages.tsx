// The account pages the game's e-mails and its "Forgot your password?"
// open: choosing a new password and confirming the recovery e-mail. Not
// for search engines.
import type { Metadata } from "next";
import { getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { legalInfo } from "@/lib/legal";
import { pageMetadata } from "@/lib/metadata";
import { pagePath, pathsOf } from "@/lib/routes";
import { ConfirmEmailForm, ResetPasswordForm } from "./AccountForms";
import { PageHeader, SiteFrame } from "./SiteFrame";

export function resetPasswordMetadata(locale: Locale): Metadata {
  const t = getDict(locale).account.reset;
  return pageMetadata({ locale, pathOf: (l) => pagePath(l, "resetPassword"), title: t.title, description: t.description, index: false, image: false });
}

export function confirmEmailMetadata(locale: Locale): Metadata {
  const t = getDict(locale).account.confirm;
  return pageMetadata({ locale, pathOf: (l) => pagePath(l, "confirmEmail"), title: t.title, description: t.description, index: false, image: false });
}

export function ResetPasswordPage({ locale }: { locale: Locale }) {
  const t = getDict(locale).account;
  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "resetPassword"))}>
      <div className="container-page mt-10 pb-24">
        <PageHeader kicker={t.reset.kicker} title={t.reset.heading} sub={t.reset.sub} />
        <div className="mx-auto mt-10 max-w-md">
          <ResetPasswordForm t={t} lang={LOCALE_INFO[locale].htmlLang} support={legalInfo().contact} />
        </div>
      </div>
    </SiteFrame>
  );
}

export function ConfirmEmailPage({ locale }: { locale: Locale }) {
  const t = getDict(locale).account;
  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "confirmEmail"))}>
      <div className="container-page mt-10 pb-24">
        <PageHeader kicker={t.confirm.kicker} title={t.confirm.heading} />
        <div className="mx-auto mt-10 max-w-md">
          <ConfirmEmailForm t={t} />
        </div>
      </div>
    </SiteFrame>
  );
}
