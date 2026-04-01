"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

/* -------------------------------------------------- */
export type ThemeType = "luxury" | "dark" | "soft"

/* -------------------------------------------------- */
type ThemeSchema = {
  bg: string
  heroCard: string
  card: string
  input: string
  button: string
  softButton: string
  danger: string

  title: string
  subtitle: string

  header: string
  headerBg: string          // ✅ EKLENDİ
  headerText: string        // ✅ EKLENDİ

  heroOverlay: string
  heroText: string

  section: string
  sectionAlt: string
  sectionSoft: string       // ✅ EKLENDİ

  cta: string
  footer: string

  link: string

  soft: string              // ✅ EKLENDİ
  accentLine: string        // ✅ EKLENDİ
}

/* -------------------------------------------------- */
const themes: Record<ThemeType, ThemeSchema> = {

  /* ---------------- LUXURY ---------------- */
  luxury: {
    bg: "min-h-screen bg-gradient-to-br from-[#f3e8ec] via-[#f8f3f5] to-[#f1e4ea] text-gray-900",
heroCard: "bg-white/40 backdrop-blur-xl border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.15)]",
    card: "bg-white/40 backdrop-blur-xl border border-white/30 shadow-[0_20px_80px_rgba(0,0,0,0.12)] rounded-2xl",

    input: "bg-white border border-gray-200 focus:border-pink-500 outline-none",

    button: "bg-gradient-to-r from-pink-500 to-rose-400 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-[1.05] transition",

    softButton: "bg-pink-50 hover:bg-pink-100 text-pink-600",

    danger: "bg-gray-300 text-white cursor-not-allowed",

    title: "bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent font-bold",
    subtitle: "text-gray-500",

    header: "bg-white/60 backdrop-blur-xl border-b border-white/40",
    headerBg: "bg-white/60 backdrop-blur-xl",
    headerText: "text-gray-900",

    heroOverlay: "bg-gradient-to-b from-black/60 via-black/30 to-transparent",
    heroText: "text-white",

    section: "py-20 px-6",
    sectionAlt: "py-20 px-6 bg-gradient-to-b from-[#f3e8ec] to-[#f8f3f5]",
    sectionSoft: "py-20 px-6 bg-pink-50",

    cta: "bg-gradient-to-r from-pink-500 to-rose-400 text-white py-16 px-6 text-center rounded-2xl shadow-xl",

    footer: "bg-gradient-to-br from-[#0a0a0a] via-[#1a0f14] to-black text-white py-20 px-6",

    link: "bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent hover:opacity-70",

    soft: "bg-pink-50",
    accentLine: "h-[2px] bg-gradient-to-r from-pink-500 to-rose-400"
  },

  /* ---------------- DARK ---------------- */
  dark: {
    bg: "min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#1a0f14] text-white",
heroCard: "bg-white/5 backdrop-blur-xl border border-white/10",
    card: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl",

    input: "bg-zinc-900 border border-zinc-700 text-white",

    button: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg hover:scale-[1.05] transition",

    softButton: "bg-zinc-800 hover:bg-zinc-700",

    danger: "bg-red-600/60",

    title: "bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent font-bold",
    subtitle: "text-white/60",

    header: "bg-black/60 backdrop-blur-xl border-b border-white/10",
    headerBg: "bg-black/60",
    headerText: "text-white",

    heroOverlay: "bg-black/70",
    heroText: "text-white",

    section: "py-20 px-6",
    sectionAlt: "py-20 px-6 bg-gradient-to-b from-black to-[#0f0f0f]",
    sectionSoft: "py-20 px-6 bg-zinc-900",

    cta: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-16 px-6 text-center rounded-2xl",

    footer: "bg-gradient-to-br from-black via-[#1a0f14] to-black text-white py-20 px-6",

    link: "bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent hover:opacity-80",

    soft: "bg-zinc-800",
    accentLine: "h-[2px] bg-gradient-to-r from-yellow-400 to-yellow-600"
  },

  /* ---------------- SOFT ---------------- */
  soft: {
    bg: "min-h-screen bg-gradient-to-br from-[#fff5f7] via-white to-[#ffe4ec] text-gray-900",

    card: "bg-white border border-pink-100 shadow-xl rounded-2xl",

    input: "bg-white border border-pink-200",

    button: "bg-gradient-to-r from-pink-400 to-pink-600 text-white px-6 py-3 rounded-xl hover:scale-[1.05] transition",

    softButton: "bg-pink-100 hover:bg-pink-200 text-pink-600",
heroCard: "bg-white/70 backdrop-blur-md border border-pink-100",
    danger: "bg-gray-300",

    title: "bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent font-semibold",
    subtitle: "text-gray-500",

    header: "bg-white border-b",
    headerBg: "bg-white",
    headerText: "text-gray-900",

    heroOverlay: "bg-pink-900/30",
    heroText: "text-white",

    section: "py-20 px-6",
    sectionAlt: "py-20 px-6 bg-gradient-to-b from-[#fff5f7] to-white",
    sectionSoft: "py-20 px-6 bg-pink-50",

    cta: "bg-gradient-to-r from-pink-400 to-pink-600 text-white py-16 px-6 text-center",

    footer: "bg-gradient-to-br from-pink-600 via-pink-500 to-rose-500 text-white py-20 px-6",

    link: "bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent hover:opacity-80",

    soft: "bg-pink-50",
    accentLine: "h-[2px] bg-gradient-to-r from-pink-500 to-rose-400"
  }
}

/* -------------------------------------------------- */
type ThemeContextType = {
  theme: ThemeSchema
  activeTheme: ThemeType
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

/* -------------------------------------------------- */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemeType>("soft")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeType | null
    if (stored && themes[stored]) {
      setActiveTheme(stored)
    }
  }, [])

  const setTheme = (theme: ThemeType) => {
    localStorage.setItem("theme", theme)
    setActiveTheme(theme)
  }

  const value = useMemo(
    () => ({
      theme: themes[activeTheme],
      activeTheme,
      setTheme,
    }),
    [activeTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/* -------------------------------------------------- */
export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme ThemeProvider içinde kullanılmalı")
  }

  return context
}