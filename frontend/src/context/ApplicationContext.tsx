import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ApiError, ApplicationState, LoanApplication, PredictionResponse, ProcessingState, ReviewRequired } from "@/api/types";
import type { Language } from "@/lib/i18n";

type Theme = "dark" | "light";
interface AppContextValue extends ApplicationState {
  language: Language; theme: Theme;
  setLanguage: (language: Language) => void; toggleTheme: () => void;
  setFile: (file: File | null) => void; setApplicationId: (id: string) => void;
  setProcessingState: (state: ProcessingState) => void;
  setExtraction: (fields: LoanApplication, review: ReviewRequired[]) => void;
  setConfirmedFields: (fields: LoanApplication) => void; setPrediction: (result: PredictionResponse) => void;
  setError: (error: ApiError | null) => void; reset: () => void;
}

const initial: ApplicationState = { uploadedFile: null, previewUrl: null, applicationId: null, processingState: "idle", extractedFields: null, reviewRequired: [], confirmedFields: null, prediction: null, confidence: null, errorState: null };
const AppContext = createContext<AppContextValue | null>(null);

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ApplicationState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("mustawfi-app-state");
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...initial, ...parsed, uploadedFile: null, previewUrl: null };
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    return initial;
  });

  const [language, setLanguageState] = useState<Language>("ar");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("mustawfi-theme") as Theme | null;
    const savedLanguage = localStorage.getItem("mustawfi-language") as Language | null;
    
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else {
      setTheme("light");
      localStorage.setItem("mustawfi-theme", "light");
    }

    if (savedLanguage === "en" || savedLanguage === "ar") {
      setLanguageState(savedLanguage);
    } else {
      setLanguageState("ar");
      localStorage.setItem("mustawfi-language", "ar");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { uploadedFile, previewUrl, errorState, ...persistedState } = state;
      sessionStorage.setItem("mustawfi-app-state", JSON.stringify(persistedState));
    }
  }, [state]);

  useEffect(() => { document.documentElement.classList.toggle("light", theme === "light"); localStorage.setItem("mustawfi-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; localStorage.setItem("mustawfi-language", language); }, [language]);
  useEffect(() => () => { if (state.previewUrl) URL.revokeObjectURL(state.previewUrl); }, [state.previewUrl]);

  const value = useMemo<AppContextValue>(() => ({ ...state, language, theme,
    setLanguage: setLanguageState, toggleTheme: () => setTheme((v) => v === "dark" ? "light" : "dark"),
    setFile: (file) => setState((s) => { if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); return { ...initial, uploadedFile: file, previewUrl: file ? URL.createObjectURL(file) : null }; }),
    setApplicationId: (applicationId) => setState((s) => ({ ...s, applicationId })),
    setProcessingState: (processingState) => setState((s) => ({ ...s, processingState })),
    setExtraction: (extractedFields, reviewRequired) => setState((s) => ({ ...s, extractedFields, reviewRequired, processingState: "review" })),
    setConfirmedFields: (confirmedFields) => setState((s) => ({ ...s, confirmedFields })),
    setPrediction: (prediction) => setState((s) => ({ ...s, prediction, confidence: prediction.confidence, processingState: "success" })),
    setError: (errorState) => setState((s) => ({ ...s, errorState, processingState: errorState ? "error" : s.processingState })),
    reset: () => setState((s) => { 
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); 

      sessionStorage.removeItem("mustawfi-app-state"); 
      return initial; 
    }),
  }), [state, language, theme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApplication() { const value = useContext(AppContext); if (!value) throw new Error("useApplication must be inside ApplicationProvider"); return value; }