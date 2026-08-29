"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { SupportedLanguage, LanguageMeta, I18nDictionary } from "./types";
import { translations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isValidLanguage } from "./index";

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: I18nDictionary;
  languages: LanguageMeta[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "cyberdesk_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage / cookies on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidLanguage(stored)) {
        setLanguageState(stored);
        document.documentElement.lang = stored;
        return;
      }

      // Check cookie fallback
      const match = document.cookie.match(/(?:^|; )cyberdesk_language=([^;]+)/);
      if (match && isValidLanguage(match[1])) {
        setLanguageState(match[1]);
        document.documentElement.lang = match[1];
      }
    } catch {
      // Storage unavailable in private browsing mode
    }
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!isValidLanguage(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `cyberdesk_language=${newLang};path=/;max-age=31536000;SameSite=Lax`;
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLang;
      }
    } catch {
      // Ignore storage write error
    }
  }, []);

  const t = useMemo(() => {
    return translations[language] || translations[DEFAULT_LANGUAGE];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider (e.g. unit tests / static wrappers)
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: translations[DEFAULT_LANGUAGE],
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
