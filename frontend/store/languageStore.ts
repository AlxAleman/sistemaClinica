import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "es" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "es", // Español por defecto
      setLanguage: (language) => {
        set({ language });
      },
    }),
    {
      name: "language-storage",
      // Asegurar que el valor por defecto sea español si no hay valor guardado
      onRehydrateStorage: () => (state) => {
        if (state && !state.language) {
          state.language = "es";
        }
      },
    }
  )
);

