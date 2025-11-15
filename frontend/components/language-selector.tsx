"use client"

import { useLanguage, type Language } from "@/context/language-context"
import { Button } from "@/components/ui/button"

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
]

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{t("selectLanguage")}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            variant={language === lang.code ? "default" : "outline"}
            size="sm"
            className={`
              text-xs font-medium px-4 py-2 rounded-full transition-all duration-300
              ${language === lang.code 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 scale-105 border-0" 
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:scale-105"
              }
            `}
          >
            <span className="mr-1.5">{lang.flag}</span>
            {lang.name}
          </Button>
        ))}
      </div>
    </div>
  )
}