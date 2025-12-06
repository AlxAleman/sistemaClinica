import { useLanguageStore } from "@/store/languageStore";
import esTranslations from "@/locales/es.json";
import enTranslations from "@/locales/en.json";

type TranslationKey = string;
type Translations = typeof esTranslations;

const translations: Record<"es" | "en", Translations> = {
  es: esTranslations,
  en: enTranslations,
};

export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== "string") {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Reemplazar parámetros en el texto
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return { t, language };
}

