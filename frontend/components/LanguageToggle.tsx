"use client";

import { useLanguageStore } from "@/store/languageStore";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage("es")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === "es"
            ? "bg-indigo-600 text-white dark:bg-indigo-700"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === "en"
            ? "bg-indigo-600 text-white dark:bg-indigo-700"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}

