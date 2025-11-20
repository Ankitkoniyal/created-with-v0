import { en } from "./en"
import { fr } from "./fr"

export type Language = "en" | "fr"
export type TranslationKey = keyof typeof en

export const translations = {
  en,
  fr,
}

export function getTranslation(lang: Language) {
  return translations[lang]
}

export function t(lang: Language, key: string): string {
  const keys = key.split(".")
  let value: any = translations[lang]
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k as keyof typeof value]
    } else {
      return key // Return key if translation not found
    }
  }
  
  return typeof value === "string" ? value : key
}

