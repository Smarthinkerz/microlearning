/**
 * I18n React Context
 * 
 * Provides locale state and translation function to all components.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { t as translate, setLocale, getLocale, isRTL, type Locale, LOCALE_NAMES, getAvailableLocales } from "@/lib/i18n";

type I18nContextType = {
  locale: Locale;
  changeLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRTL: boolean;
  availableLocales: Array<{ code: Locale; name: string; rtl: boolean }>;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem("learnshift_locale") as Locale;
    if (saved && LOCALE_NAMES[saved]) return saved;
    
    // Try browser language
    const browserLang = navigator.language.split("-")[0] as Locale;
    if (LOCALE_NAMES[browserLang]) return browserLang;
    
    return "en";
  });

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
    localStorage.setItem("learnshift_locale", newLocale);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    return translate(key, vars);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <I18nContext.Provider value={{
      locale,
      changeLocale,
      t,
      isRTL: isRTL(locale),
      availableLocales: getAvailableLocales(),
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback for components outside provider
    return {
      locale: "en" as Locale,
      changeLocale: () => {},
      t: (key: string) => key,
      isRTL: false,
      availableLocales: getAvailableLocales(),
    };
  }
  return context;
}
