import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { type Locale, type StringKey, strings } from "./strings";

const DEFAULT_LOCALE: Locale = "ko";

export const LOCALES: readonly Locale[] = ["ko", "en", "zh", "ja"];

/** 언어 선택 화면 라벨 (자기 언어로 표기) */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  zh: "简体中文",
  ja: "日本語",
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
