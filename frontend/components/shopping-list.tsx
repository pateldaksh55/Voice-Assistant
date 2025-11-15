"use client"

import { Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShoppingItem {
  id: string
  name: string
  quantity: number
  category: string
  completed: boolean
}

interface ShoppingListProps {
  items: ShoppingItem[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
  dairy: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: "🥛" },
  produce: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: "🥬" },
  meat: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: "🥩" },
  snacks: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: "🍿" },
  pantry: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", icon: "🍞" },
  other: { bg: "bg-gray-100 dark:bg-gray-700/30", text: "text-gray-700 dark:text-gray-300", icon: "📦" },
}

export default function ShoppingList({ items, onToggle, onRemove, onUpdateQuantity }: ShoppingListProps) {
  // Group items by category
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, ShoppingItem[]>,
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryColors[category]?.icon || "📦"}</span>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {category}
            </h3>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {categoryItems.length}
            </span>
          </div>
          <div className="space-y-2">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                  item.completed
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10"
                }`}
              >
                {/* Custom Checkbox */}
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggle(item.id)}
                    className="appearance-none w-6 h-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 checked:bg-gradient-to-br checked:from-green-400 checked:to-green-600 checked:border-green-500 cursor-pointer transition-all duration-300 hover:border-green-400 dark:hover:border-green-500"
                  />
                  {item.completed && (
                    <svg
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-base capitalize transition-all duration-300 ${
                      item.completed
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {item.name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-1.5 ${
                      categoryColors[item.category]?.bg
                    } ${categoryColors[item.category]?.text}`}
                  >
                    <span>{categoryColors[item.category]?.icon}</span>
                    {category}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold w-8 text-center text-gray-700 dark:text-gray-200">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Delete Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(item.id)}
                  className="h-9 w-9 p-0 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:scale-110 active:scale-95 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}