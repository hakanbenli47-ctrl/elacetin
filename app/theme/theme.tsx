"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

/* -------------------------------------------------- */
/* 1️⃣ Tema isimleri (buraya yeni tema eklenebilir)  */
/* -------------------------------------------------- */
export type ThemeType = "pink" | "dark" | "gold"

/* -------------------------------------------------- */
/* 2️⃣ Her temada bulunması gereken alan şeması      */
/*    (TypeScript güvenliği için zorunlu alanlar)    */
/* -------------------------------------------------- */
type ThemeSchema = {
  bg: string              // Ana sayfa arka planı
  card: string            // Kart tasarımları
  input: string           // Input alanları
  soft: string            // Yumuşak buton / arka plan tonu
  button: string          // Ana buton rengi
  danger: string          // Pasif / dolu / hata butonu
  heroText: string        // Hero yazı rengi
  heroCard: string        // Hero içindeki kart tasarımı
  title: string           // Başlık stili
  subtitle: string        // Alt başlık stili
  headerBg: string        // Scroll sonrası header arka plan
  headerText: string      // Scroll sonrası header yazı rengi
  heroOverlay: string     // Hero görselinin üzerindeki koyuluk
  sectionAlt: string      // Alternatif section arka plan
  sectionSoft: string     // Daha yumuşak arka plan
  ctaBg: string           // Call-to-action arka plan
  ctaText: string         // CTA yazı rengi
  footerBg: string        // Footer arka plan
  footerText: string      // Footer yazı rengi
  link: string            // Link rengi
  accentLine: string      // Başlık altı çizgi rengi
}

/* -------------------------------------------------- */
/* 3️⃣ Tema renkleri                                  */
/* -------------------------------------------------- */
const themes: Record<ThemeType, ThemeSchema> = {

  /* ---------------- PINK THEME ---------------- */
  pink: {
    bg: "min-h-screen bg-[#f7edf2] text-gray-900", // Açık pembe zemin

    card: "bg-white border border-[#ead6dd] shadow-2xl", // Kart stili
    input: "bg-white border border-[#e8cfd8] text-gray-900 placeholder-gray-400 focus:border-[#c2185b]",
    soft: "bg-[#f2dfe7] hover:bg-[#e9cdd9] text-gray-800",
    button: "bg-[#c2185b] hover:bg-[#a3154c] text-white", // Ana buton
    danger: "bg-red-500/70 text-white cursor-not-allowed", // Pasif buton

    heroText: "text-white",
    heroCard: "bg-white border border-[#ead6dd] shadow-xl",

    title: "text-gray-900",
    subtitle: "text-gray-500",

    headerBg: "bg-white",
    headerText: "text-black",

    heroOverlay: "bg-black/60", // Hero görsel koyuluğu

    sectionAlt: "bg-gray-50",
    sectionSoft: "bg-gray-100",

    ctaBg: "bg-[#c2185b]",
    ctaText: "text-white",

    footerBg: "bg-black",
    footerText: "text-white",

    link: "text-[#c2185b] hover:text-[#a3154c]",

    accentLine: "bg-[#c2185b]" // Başlık alt çizgi
  },

  /* ---------------- DARK THEME ---------------- */
  dark: {
    bg: "min-h-screen bg-black text-white", // Siyah zemin

    card: "bg-zinc-900 border border-zinc-800 shadow-2xl",
    input: "bg-zinc-800 border border-zinc-700 text-white placeholder-white/40 focus:border-yellow-500",
    soft: "bg-zinc-800 hover:bg-zinc-700 text-white",
    button: "bg-yellow-500 hover:bg-yellow-600 text-black",
    danger: "bg-red-600/60 text-white cursor-not-allowed",

    heroText: "text-white",
    heroCard: "bg-zinc-900 border border-zinc-800 shadow-xl",

    title: "text-white",
    subtitle: "text-white/50",

    headerBg: "bg-black",
    headerText: "text-white",

    heroOverlay: "bg-black/70",

    sectionAlt: "bg-zinc-900",
    sectionSoft: "bg-zinc-800",

    ctaBg: "bg-yellow-500",
    ctaText: "text-black",

    footerBg: "bg-black",
    footerText: "text-white",

    link: "text-yellow-400 hover:text-yellow-300",

    accentLine: "bg-yellow-500"
  },

  /* ---------------- GOLD THEME ---------------- */
  gold: {
    bg: "min-h-screen bg-[#f6f1e7] text-gray-900", // Altın ton zemin

    card: "bg-white border border-yellow-200 shadow-2xl",
    input: "bg-white border border-yellow-300 text-gray-900 placeholder-gray-400 focus:border-[#b78b2e]",
    soft: "bg-yellow-100 hover:bg-yellow-200 text-gray-800",
    button: "bg-[#b78b2e] hover:bg-[#9c7425] text-white",
    danger: "bg-red-500/70 text-white cursor-not-allowed",

    heroText: "text-white",
    heroCard: "bg-white border border-yellow-200 shadow-xl",

    title: "bg-gradient-to-r from-[#b78b2e] via-[#e5c76b] to-[#a67c1b] bg-clip-text text-transparent",
    subtitle: "text-[#8c6b1f]",

    headerBg: "bg-white",
    headerText: "text-gray-900",

    heroOverlay: "bg-black/50",

    sectionAlt: "bg-[#f6f1e7]",
    sectionSoft: "bg-[#efe6d3]",

    ctaBg: "bg-[#b78b2e]",
    ctaText: "text-white",

    footerBg: "bg-[#1a1a1a]",
    footerText: "text-white",

    link: "text-[#b78b2e] hover:text-[#9c7425]",

    accentLine: "bg-[#b78b2e]"
  }
}

/* -------------------------------------------------- */
/* 4️⃣ Context tipi                                   */
/* -------------------------------------------------- */
type ThemeContextType = {
  theme: ThemeSchema          // Aktif temanın class'ları
  activeTheme: ThemeType      // Aktif tema adı
  setTheme: (theme: ThemeType) => void // Tema değiştirme fonksiyonu
}

const ThemeContext = createContext<ThemeContextType | null>(null)

/* -------------------------------------------------- */
/* 5️⃣ Provider                                       */
/* -------------------------------------------------- */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {

  // Varsayılan tema
  const [activeTheme, setActiveTheme] =
    useState<ThemeType>("pink")

  // Sayfa açıldığında localStorage'dan temayı yükler
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeType | null
    if (stored && themes[stored]) {
      setActiveTheme(stored)
    }
  }, [])

  // Tema değiştir ve localStorage'a kaydet
  const setTheme = (theme: ThemeType) => {
    localStorage.setItem("theme", theme)
    setActiveTheme(theme)
  }

  // Performans için memo
  const value = useMemo(
    () => ({
      theme: themes[activeTheme],
      activeTheme,
      setTheme,
    }),
    [activeTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/* -------------------------------------------------- */
/* 6️⃣ Hook                                           */
/* -------------------------------------------------- */
export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme, ThemeProvider içinde kullanılmalı")
  }

  return context
}