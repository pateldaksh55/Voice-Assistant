"use client"

import { useState, useEffect } from "react"
import { LanguageProvider, useLanguage } from "@/context/language-context"
import VoiceInput from "@/components/voice-input"
import ShoppingList from "@/components/shopping-list"
import Suggestions from "@/components/suggestions"
import SearchBar from "@/components/search-bar"
import LanguageSelector from "@/components/language-selector"
import { fetchItems, createItem, updateItem, deleteItem } from "@/lib/api"

interface ShoppingItem {
  id: string
  name: string
  quantity: number
  category: string
  completed: boolean
}

function HomeContent() {
  const { t } = useLanguage()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([
    "milk",
    "bread",
    "eggs",
    "organic apples",
    "almond milk",
  ])
  const [transcript, setTranscript] = useState("")
  const [loading, setLoading] = useState(false)

  const [smartSuggestions, setSmartSuggestions] = useState({
    history: [],
    seasonal: [],
    substitutes: []
  });

  // ✅ Fetch smart suggestions
  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/items/suggestions`);
      const data = await res.json();
      setSmartSuggestions(data);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [items]); // Refetch when items change

  // ✅ Load all items from backend
  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchItems()
      .then((res) => {
        if (!mounted) return
        const backendItems = (res.data || []).map((it: any) => ({
          id: it._id || it.id || Math.random().toString(36).substr(2, 9),
          name: it.name,
          quantity: typeof it.quantity === "number" ? it.quantity : 1,
          category: it.category ?? "other",
          completed: !!it.purchased,
        })) as ShoppingItem[]
        setItems(backendItems)
      })
      .catch((err) => console.error("Failed to fetch items:", err))
      .finally(() => setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  // ✅ Categorize item (for manual add)
  const categorizeItem = (itemName: string): string => {
    const categories: Record<string, string[]> = {
      dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
      produce: ["apples", "bananas", "oranges", "lettuce", "tomato", "carrot"],
      meat: ["chicken", "beef", "fish", "pork", "turkey"],
      snacks: ["chips", "cookies", "candy", "nuts", "granola"],
      pantry: ["bread", "rice", "pasta", "cereal", "flour"],
    }

    const lowerName = itemName.toLowerCase()
    for (const [category, items] of Object.entries(categories)) {
      if (items.some((item) => lowerName.includes(item))) {
        return category
      }
    }
    return "other"
  }

  const addItem = async (itemName: string, quantity = 1) => {
    const normalized = itemName.trim().toLowerCase();
    if (!normalized) return;

    const category = categorizeItem(normalized);

    try {
      const payload = { name: normalized, quantity, category };
      const res = await createItem(payload);

      const saved = res.data?.item || res.data || {};
      console.log("SERVER RESPONSE:", res.data);

      setItems((prev) => {
        const normalizedName = saved.name.trim().toLowerCase();
        const existing = prev.find((i) => i.name.toLowerCase() === normalizedName);

        if (existing) {
          // ✅ replace with backend merged quantity
          return prev.map((i) =>
            i.name.toLowerCase() === normalizedName
              ? {
                  ...i,
                  quantity: saved.quantity,
                  category: saved.category ?? i.category,
                  completed: saved.purchased ?? i.completed,
                }
              : i
          );
        }

        // New item
        return [
          ...prev,
          {
            id: saved._id || saved.id || crypto.randomUUID(),
            name: saved.name,
            quantity: saved.quantity ?? 1,
            category: saved.category ?? category,
            completed: saved.purchased ?? false,
          },
        ];
      });
    } catch (err) {
      console.error("❌ Failed to add item:", err);
    }

    const substitutes = smartSuggestions.substitutes[normalized] || [];
    setSmartSuggestions(prev => ({ ...prev, substitutes })); 
  };

  const removeItem = async (id: string) => {
    const prev = items
    setItems(items.filter((item) => item.id !== id))
    if (id.startsWith("tmp_")) return
    try {
      await deleteItem(id)
    } catch (err) {
      console.error("Delete failed:", err)
      setItems(prev)
    }
  }

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const prev = items
    const updated = { ...item, completed: !item.completed }
    setItems(items.map((i) => (i.id === id ? updated : i)))
    if (id.startsWith("tmp_")) return
    try {
      await updateItem(id, { purchased: updated.completed })
    } catch (err) {
      console.error("Toggle failed:", err)
      setItems(prev)
    }
  }

  const updateQuantity = async (id: string, quantity: number) => {
    const prev = items
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)))
    if (id.startsWith("tmp_")) return
    try {
      await updateItem(id, { quantity: Math.max(1, quantity) })
    } catch (err) {
      console.error("Update quantity failed:", err)
      setItems(prev)
    }
  }

  const handleVoiceResult = (data: any) => {
    const { action, item, message } = data;
    console.log("🎙️ Frontend received action:", action, "item:", item, "message:", message);  // Debugging log
    setTranscript(message || item?.name || "Unknown command");  // Update transcript with backend message

    if (action === "deleted") {
      console.log("🗑️ Removing item from list:", item?.name);  // Debugging log
      // Remove the item from the list
      setItems((prev) => prev.filter((i) => i.name.toLowerCase() !== item?.name?.toLowerCase()));
    } else if (action === "quantity_updated" || action === "updated" || action === "created") {
      console.log("➕ Adding/updating item in list:", item?.name);  // Debugging log
      // Add or update the item
      setItems((prev) => {
        const normalizedName = item?.name?.trim().toLowerCase() || "";
        const existing = prev.find((i) => i.name.toLowerCase() === normalizedName);

        if (existing) {
          // Update existing
          return prev.map((i) =>
            i.name.toLowerCase() === normalizedName
              ? {
                  ...i,
                  quantity: item?.quantity ?? i.quantity,
                  category: item?.category ?? i.category,
                  completed: item?.purchased ?? i.completed,
                }
              : i
          );
        }

        // Add new
        return [
          ...prev,
          {
            id: item?._id || item?.id || crypto.randomUUID(),
            name: item?.name || "",
            quantity: item?.quantity ?? 1,
            category: item?.category || "",
            completed: item?.purchased || false,
          },
        ];
      });
    } else if (action === "not_found") {
      // Handle not found (e.g., show a message, but don't change state)
      console.warn("⚠️ Item not found:", message);
    }

    // Update substitutes if provided
    if (data.substitutes) {
      setSmartSuggestions((prev) => ({ ...prev, substitutes: data.substitutes }));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addItem(suggestion)
  }

  const handleSearch = (query: string) => {
    if (query.trim()) {
      addItem(query)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-24">
      {/* Header with Glassmorphism */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Voice Input Section with Enhanced Design */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-2xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {t("voiceCommand")}
            </h2>
            <VoiceInput onResult={handleVoiceResult} />
            {transcript && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-sm text-white/90">
                  {t("lastCommand")}: <span className="font-semibold text-white">{transcript}</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Search Bar with Modern Design */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <SearchBar onSearch={handleSearch} />
        </section>

        {/* Shopping List with Card Design */}
        {loading ? (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading your items...</p>
            </div>
          </section>
        ) : (
          items.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t("myItems")} <span className="text-blue-500">({items.length})</span>
                </h2>
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    {items.filter((i) => i.completed).length} {t("completed")}
                  </span>
                </div>
              </div>
              <ShoppingList
                items={items}
                onToggle={toggleItem}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
              />
            </section>
          )
        )}

        {/* Suggestions with Modern Card */}
        {items.length < 5 && (
          <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-purple-200 dark:border-gray-600 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {t("suggestedItems")}
            </h2>
            <Suggestions 
              suggestions={smartSuggestions.history.concat(smartSuggestions.seasonal)} 
              substitutes={smartSuggestions.substitutes} 
              onSuggestionClick={handleSuggestionClick} 
            />
          </section>
        )}

        {/* Empty State with Beautiful Illustration */}
        {items.length === 0 && !loading && (
          <div className="text-center py-16 px-6">
            <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
              <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold mb-2">{t("startAdding")}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t("useVoice")}</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  )
}