"use client"

import { Button } from "@/components/ui/button"
import { Plus, Sparkles, Repeat } from "lucide-react"

interface SuggestionsProps {
  suggestions: string[]
  substitutes: string[]
  onSuggestionClick: (suggestion: string) => void
}

export default function Suggestions({ suggestions, substitutes, onSuggestionClick }: SuggestionsProps) {
  return (
    <div className="space-y-6">
      {/* History & Seasonal */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Recommended for You</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                variant="outline"
                className="group relative justify-start capitalize h-auto py-3.5 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2 w-full">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors duration-300">
                    <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                    {suggestion}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/30">
              <Repeat className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Alternatives</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {substitutes.map((sub) => (
              <Button
                key={sub}
                onClick={() => onSuggestionClick(sub)}
                variant="outline"
                className="group relative justify-start capitalize h-auto py-3.5 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2 w-full">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors duration-300">
                    <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                    {sub}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}