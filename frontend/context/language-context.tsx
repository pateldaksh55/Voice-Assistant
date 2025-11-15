"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Language = "en" | "es" | "fr" | "de"

interface Translations {
  [key: string]: string
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Translations> = {
  en: {
    title: "Shopping List",
    subtitle: "Voice-powered shopping",
    voiceCommand: "Voice Command",
    startListening: "Start Voice Command",
    stopListening: "Stop Listening",
    listening: "Listening...",
    added: "Added",
    hearing: "Hearing",
    error: "Error",
    lastCommand: "Last command",
    searchPlaceholder: "Search or type items...",
    add: "Add",
    myItems: "My Items",
    completed: "completed",
    suggestedItems: "Suggested Items",
    startAdding: "Start adding items to your shopping list!",
    useVoice: "Use voice commands or search to add items",
    selectLanguage: "Select Language",
    quantity: "Qty",
    remove: "Remove",
  },
  es: {
    title: "Lista de Compras",
    subtitle: "Compras por voz",
    voiceCommand: "Comando de Voz",
    startListening: "Iniciar Comando de Voz",
    stopListening: "Detener Escucha",
    listening: "Escuchando...",
    added: "Agregado",
    hearing: "Escuchando",
    error: "Error",
    lastCommand: "Último comando",
    searchPlaceholder: "Buscar o escribir artículos...",
    add: "Agregar",
    myItems: "Mis Artículos",
    completed: "completado",
    suggestedItems: "Artículos Sugeridos",
    startAdding: "¡Comienza a agregar artículos a tu lista de compras!",
    useVoice: "Usa comandos de voz o busca para agregar artículos",
    selectLanguage: "Seleccionar Idioma",
    quantity: "Cant",
    remove: "Eliminar",
  },
  fr: {
    title: "Liste de Courses",
    subtitle: "Shopping par voix",
    voiceCommand: "Commande Vocale",
    startListening: "Démarrer la Commande Vocale",
    stopListening: "Arrêter l'Écoute",
    listening: "Écoute...",
    added: "Ajouté",
    hearing: "Écoute en cours",
    error: "Erreur",
    lastCommand: "Dernière commande",
    searchPlaceholder: "Rechercher ou taper des articles...",
    add: "Ajouter",
    myItems: "Mes Articles",
    completed: "complété",
    suggestedItems: "Articles Suggérés",
    startAdding: "Commencez à ajouter des articles à votre liste de courses!",
    useVoice: "Utilisez les commandes vocales ou la recherche pour ajouter des articles",
    selectLanguage: "Sélectionner la Langue",
    quantity: "Qté",
    remove: "Supprimer",
  },
  de: {
    title: "Einkaufsliste",
    subtitle: "Sprachgesteuertes Einkaufen",
    voiceCommand: "Sprachbefehl",
    startListening: "Sprachbefehl Starten",
    stopListening: "Überwachung Beenden",
    listening: "Abhören...",
    added: "Hinzugefügt",
    hearing: "Höre",
    error: "Fehler",
    lastCommand: "Letzter Befehl",
    searchPlaceholder: "Artikel suchen oder eingeben...",
    add: "Hinzufügen",
    myItems: "Meine Artikel",
    completed: "erledigt",
    suggestedItems: "Vorgeschlagene Artikel",
    startAdding: "Beginnen Sie, Artikel zu Ihrer Einkaufsliste hinzuzufügen!",
    useVoice: "Verwenden Sie Sprachbefehle oder suchen Sie, um Artikel hinzuzufügen",
    selectLanguage: "Sprache Auswählen",
    quantity: "Menge",
    remove: "Entfernen",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
