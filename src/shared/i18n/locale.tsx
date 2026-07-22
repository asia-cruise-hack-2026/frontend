import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { type Locale, type StringKey, strings } from "./strings";

const DEFAULT_LOCALE: Locale = "ko";

export const LOCALES: readonly Locale[] = ["ko", "en", "zh", "ja"];

/** 언어 선택/표시용 메타 (code=칩, label=자기 언어명, sub=영문명) */
export const LOCALE_META: Record<Locale, { code: string; label: string; sub: string }> = {
  ko: { code: "KO", label: "한국어", sub: "Korean" },
  en: { code: "EN", label: "English", sub: "English" },
  zh: { code: "ZH", label: "简体中文", sub: "Chinese" },
  ja: { code: "JA", label: "日本語", sub: "Japanese" },
};

interface I18nValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  /** UI 문자열 조회 */
  t: (key: StringKey) => string;
  /** 통화 표기 (ko: "1,000원" / 그 외: "₩1,000") */
  money: (amount: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => strings[key][locale],
      money: (amount) =>
        locale === "ko" ? `${amount.toLocaleString()}원` : `₩${amount.toLocaleString()}`,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
