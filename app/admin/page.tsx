"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import AdminDashboard from "./AdminDashboard"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [salonAd, setSalonAd] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
  }

  async function register() {
    if (!salonAd) return alert("Salon adı gerekli")

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return alert(error.message)

    const userId = authData.user?.id
    if (!userId) return alert("User oluşturulamadı")

    const { data: salonData } = await supabase
      .from("salonlar")
      .insert({ ad: salonAd })
      .select()
      .single()

    await supabase.from("admin_users").insert({
      id: userId,
      salon_id: salonData.id,
      email: email,
    })

    alert("Kayıt başarılı. Giriş yapabilirsiniz.")
    setMode("login")
  }

  if (user) {
    return <AdminDashboard user={user} />
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 p-8 rounded-xl w-96 space-y-4">

        {mode === "login" ? (
          <>
            <h1 className="text-2xl font-bold text-center">Admin Giriş</h1>

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-zinc-800 rounded"
            />

            <input
              placeholder="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-zinc-800 rounded"
            />

            <button
              onClick={login}
              className="w-full bg-white text-black py-2 rounded"
            >
              Giriş Yap
            </button>

            <p
              className="text-sm text-center cursor-pointer text-gray-400"
              onClick={() => setMode("register")}
            >
              Hesabın yok mu? Kayıt ol
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center">Admin Kayıt</h1>

            <input
              placeholder="Salon Adı"
              value={salonAd}
              onChange={(e) => setSalonAd(e.target.value)}
              className="w-full p-2 bg-zinc-800 rounded"
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-zinc-800 rounded"
            />

            <input
              placeholder="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-zinc-800 rounded"
            />

            <button
              onClick={register}
              className="w-full bg-white text-black py-2 rounded"
            >
              Kayıt Ol
            </button>

            <p
              className="text-sm text-center cursor-pointer text-gray-400"
              onClick={() => setMode("login")}
            >
              Zaten hesabın var mı? Giriş yap
            </p>
          </>
        )}
      </div>
    </main>
  )
}
