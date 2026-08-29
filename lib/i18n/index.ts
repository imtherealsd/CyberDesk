import { en } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
import { te } from "./te";
import { bn } from "./bn";
import type { SupportedLanguage, LanguageMeta, I18nDictionary } from "./types";

export * from "./types";
export { en, hi, ta, te, bn };

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "bn", label: "Bangla", nativeLabel: "বাংলা" },
];

export const translations: Record<SupportedLanguage, I18nDictionary> = {
  en,
  hi,
  ta,
  te,
  bn,
};

export function isValidLanguage(code: unknown): code is SupportedLanguage {
  return typeof code === "string" && code in translations;
}

export function getTranslation(lang?: string | null): I18nDictionary {
  if (lang && isValidLanguage(lang)) {
    return translations[lang];
  }
  return translations[DEFAULT_LANGUAGE];
}

export { I18nProvider, useI18n } from "./context";
