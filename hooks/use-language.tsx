"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Language, getTranslation } from "@/lib/translations"

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  translations: ReturnType<typeof getTranslation>
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always use English - language toggle is disabled
  // Use constant instead of state to avoid hydration mismatches
  const language: Language = "en"
  
  useEffect(() => {
    // Always set to English and clear any saved French preference
    if (typeof window !== "undefined") {
      // Clear any saved language preference
      localStorage.removeItem("preferred_language")
      // Always set to English
      document.documentElement.lang = "en"
    }
  }, [])

  // Language switching is disabled - always returns English
  const setLanguage = (_lang: Language) => {
    // No-op: language switching is disabled
  }

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = getTranslation(language)
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k as keyof typeof value]
      } else {
        return key // Return key if translation not found
      }
    }
    
    return typeof value === "string" ? value : key
  }

  // Always provide context, even before mounting, to avoid errors
  const contextValue: LanguageContextValue = {
    language,
    setLanguage,
    t,
    translations: getTranslation(language),
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

