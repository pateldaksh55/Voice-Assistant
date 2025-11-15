"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/language-context"
import axios from "axios"

interface VoiceInputProps {
  onResult: (text: string, quantity: number) => void
}

const languageCodeMap: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const { language, t } = useLanguage()
  const [isListening, setIsListening] = useState(false)
  const [feedback, setFeedback] = useState("")
  const recognitionRef = useRef<any>(null)

  // ✅ initialize speech recognition safely
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = languageCodeMap[language] || "en-US"

      recognition.onstart = () => {
        console.log("🎤 Recognition started")
        setFeedback(t("listening"))
      }

      recognition.onend = () => {
        console.log("🎤 Recognition ended")
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        console.error("⚠️ Recognition error:", event.error)
        setFeedback(`Error: ${event.error}`)
        setIsListening(false)
      }

      recognition.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }

        if (event.results[event.resultIndex].isFinal) {
          console.log("✅ Final transcript:", transcript)
          processVoiceCommand(transcript)
        } else {
          setFeedback(`${t("hearing")}: ${transcript}`)
        }
      }

      recognitionRef.current = recognition
    } else {
      console.warn("Speech recognition not supported")
    }
  }, [language, t])

 const processVoiceCommand = async (text: string) => {
  console.log("🎙️ Voice heard:", text);
  setFeedback(`Processing: "${text}"`);
  console.log("🎙️ Voice heard:", text, "Language from context:", language);  // Add this
  // ... rest of the code
  const res = await axios.post(`${base}/api/parse-command`, { text, language });  // Ensure 'language' is passed
  
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await axios.post(`${base}/api/parse-command`, { text, language });
    const data = res.data;
    console.log("🧠 Backend response:", data);
    if (data.item || data.action === "deleted" || data.action === "not_found") {
      onResult(data);  // Pass the full data object (not just data.item)
      setFeedback(`✅ ${data.message || "Processed"}: ${data.item?.name || "Unknown"}`);
      // If substitutes exist, show them
      if (data.substitutes && data.substitutes.length > 0) {
        setFeedback(prev => `${prev}. Alternatives: ${data.substitutes.join(', ')}`);
      }
    } else {
      setFeedback("⚠️ Could not understand your command");
    }
  } catch (err: any) {
    console.error("❌ Parse error:", err);
    setFeedback("Backend not responding");
  }
  setTimeout(() => setFeedback(""), 3000);
};


  // ✅ fixed toggleListening to avoid duplicate start
  const toggleListening = () => {
    const recognition = recognitionRef.current
    if (!recognition) {
      setFeedback("Speech recognition not supported in your browser")
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      console.log("🛑 Stopped listening")
    } else {
      try {
        recognition.start()
        setIsListening(true)
        console.log("🎧 Started listening")
      } catch (error: any) {
        if (error.message.includes("already started")) {
          console.warn("Speech recognition already active — ignoring duplicate start.")
        } else {
          console.error("Speech recognition start error:", error)
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button 
          onClick={toggleListening} 
          variant={isListening ? "destructive" : "default"}
          className={`group relative flex-1 py-6 rounded-xl font-semibold text-base shadow-xl overflow-hidden transition-all duration-300 ${
            isListening 
              ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/30 dark:shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/40 dark:hover:shadow-red-500/30 hover:scale-105 active:scale-95" 
              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 dark:shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/40 dark:hover:shadow-green-500/30 hover:scale-105 active:scale-95"
          }`}
        >
          <div className={`absolute inset-0 ${isListening ? 'bg-red-400' : 'bg-green-400'} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          
          {isListening ? (
            <div className="relative flex items-center justify-center gap-3">
              <div className="relative">
                <Square className="w-5 h-5" />
                <div className="absolute inset-0 animate-ping">
                  <Square className="w-5 h-5 opacity-75" />
                </div>
              </div>
              <span>{t("stopListening")}</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center gap-3">
              <Mic className="w-5 h-5" />
              <span>{t("startListening")}</span>
            </div>
          )}
        </Button>
      </div>

      {isListening && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="flex gap-1">
            <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-12 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-1 h-10 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
            <div className="w-1 h-7 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400 animate-pulse">
            Listening...
          </span>
        </div>
      )}

      {feedback && (
        <div
          className={`relative overflow-hidden p-4 rounded-xl border-2 text-sm font-medium transition-all duration-300 ${
            isListening
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-500/10"
              : feedback.includes("✅")
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 shadow-lg shadow-green-500/10"
              : feedback.includes("⚠️") || feedback.includes("❌")
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 shadow-lg shadow-red-500/10"
              : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600 shadow-lg"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              isListening
                ? "bg-blue-200 dark:bg-blue-800"
                : feedback.includes("✅")
                ? "bg-green-200 dark:bg-green-800"
                : feedback.includes("⚠️") || feedback.includes("❌")
                ? "bg-red-200 dark:bg-red-800"
                : "bg-gray-200 dark:bg-gray-700"
            }`}>
              {isListening ? (
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : feedback.includes("✅") ? (
                <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : feedback.includes("⚠️") || feedback.includes("❌") ? (
                <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="flex-1 pt-0.5">{feedback}</p>
          </div>
        </div>
      )}
    </div>
  )
}