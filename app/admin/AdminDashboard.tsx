"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function AdminDashboard({ user }: any) {
  const [randevular, setRandevular] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gunlukToplam, setGunlukToplam] = useState(0)
  const [salonId, setSalonId] = useState<number | null>(null)
const [kapaliGunler, setKapaliGunler] = useState<any[]>([])
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const [yeniTarih, setYeniTarih] = useState("")
const [hizmetler, setHizmetler] = useState<any[]>([])
const [yeniHizmetAd, setYeniHizmetAd] = useState("")
const [yeniHizmetSure, setYeniHizmetSure] = useState(30)
const [yeniAciklama, setYeniAciklama] = useState("")
const [lisansAktif, setLisansAktif] = useState(true)
  const [activeTab, setActiveTab] =
    useState<"randevular" | "calisanlar" | "tatil" | "hizmetler">("randevular")
const [izinliGun, setIzinliGun] = useState<number | null>(null)
  const [calisanlar, setCalisanlar] = useState<any[]>([])
  const [yeniCalisan, setYeniCalisan] = useState("")
  const [randevuFiltre, setRandevuFiltre] = useState<
  "bugun" | "hafta" | "ay" | "gecmis"
>("bugun")
const [sabitKapaliGun, setSabitKapaliGun] = useState<number | null>(null)
  useEffect(() => {
    if (user?.id) {
      getSalonId()
    }
  }, [user])
useEffect(() => {
  if (salonId) {
    fetchRandevular(salonId)
  }
}, [randevuFiltre])
useEffect(() => {
  if (!salonId) return

  const channel = supabase
    .channel("randevu-listener")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "randevular",
        filter: `salon_id=eq.${salonId}`,
      },
      () => {
        fetchRandevular(salonId)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [salonId, randevuFiltre])
 async function getSalonId() {
  const { data } = await supabase
    .from("admin_users")
    .select("salon_id")
    .eq("id", user.id)
    .single()

  if (!data?.salon_id) {
    setLoading(false)
    return
  }

  setSalonId(data.salon_id)

  fetchRandevular(data.salon_id)
  fetchCalisanlar(data.salon_id)
  fetchKapaliGunler(data.salon_id)
fetchHizmetler(data.salon_id)
  // 👇 SABİT KAPALI GÜNÜ BURADA ÇEK
 const { data: salonData } = await supabase
  .from("salonlar")
.select("sabit_kapali_gun, aktif, baslangic_tarihi, bitis_tarihi")
  .eq("id", data.salon_id)
  .single()

if (salonData) {
  setSabitKapaliGun(salonData.sabit_kapali_gun)

  const bugun = new Date()

  // 1️⃣ Aktif TRUE ve başlangıç yoksa → 30 gün başlat
  if (salonData.aktif && !salonData.baslangic_tarihi) {
    const bitis = new Date()
    bitis.setDate(bugun.getDate() + 30)

    await supabase
      .from("salonlar")
      .update({
        baslangic_tarihi: bugun,
        bitis_tarihi: bitis,
      })
      .eq("id", data.salon_id)

    setLisansAktif(true)
    return
  }

  // 2️⃣ Aktif FALSE ise direkt kilitle
  if (!salonData.aktif) {
    setLisansAktif(false)
    return
  }

  // 3️⃣ Süre dolmuşsa otomatik FALSE yap
  if (
    salonData.bitis_tarihi &&
    new Date() > new Date(salonData.bitis_tarihi)
  ) {
    await supabase
      .from("salonlar")
      .update({
        aktif: false,
        baslangic_tarihi: null,
        bitis_tarihi: null,
      })
      .eq("id", data.salon_id)

    setLisansAktif(false)
    return
  }

  // 4️⃣ Her şey normalse açık
  setLisansAktif(true)
}
}
async function fetchHizmetler(id: number) {
  const { data } = await supabase
    .from("hizmetler")
    .select("*")
    .eq("salon_id", id)

  if (data) setHizmetler(data)
}
async function fetchRandevular(id: number) {
  const bugun = formatLocalDate(new Date())

  let query = supabase
    .from("randevular")
    .select("*")
    .eq("salon_id", id)

  if (randevuFiltre === "bugun") {
    query = query.eq("tarih", bugun)
  }

  if (randevuFiltre === "hafta") {
    query = query.gte("tarih", bugun)
  }

  if (randevuFiltre === "ay") {
    const ayIlk = formatLocalDate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )
    query = query.gte("tarih", ayIlk)
  }

  if (randevuFiltre === "gecmis") {
    query = query.lt("tarih", bugun)
  }

  const { data } = await query.order("tarih", { ascending: true })

  if (data) {
    setRandevular(data)
    setGunlukToplam(
      data.filter((r) => r.tarih === bugun).length
    )
  }

  setLoading(false)
}
  async function fetchCalisanlar(id: number) {
    const { data } = await supabase
      .from("calisanlar")
      .select("*")
      .eq("salon_id", id)

    if (data) setCalisanlar(data)
  }
async function fetchKapaliGunler(id: number) {
  const { data } = await supabase
    .from("salon_kapali_gunler")
    .select("*")
    .eq("salon_id", id)
    .order("tarih", { ascending: true })

  if (data) setKapaliGunler(data)
}
  async function calisanEkle() {
    if (!yeniCalisan || !salonId) return

   const { data, error } = await supabase
  .from("calisanlar")
 .insert({
  ad: yeniCalisan,
  salon_id: salonId,
  aktif: true,
  izinli_gun: izinliGun
})

console.log("INSERT DATA:", data)
console.log("INSERT ERROR:", error)

if (error) {
  alert(error.message)
  return
}

    setYeniCalisan("")
    fetchCalisanlar(salonId)
  }

async function calisanSil(id: number) {
  if (!salonId) return

  const { error } = await supabase
    .from("calisanlar")
    .delete()
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  fetchCalisanlar(salonId)
}
async function calisanIzinGuncelle(
  id: number,
  gun: number | null
) {
  if (!salonId) return

  const { error } = await supabase
    .from("calisanlar")
    .update({ izinli_gun: gun })
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  fetchCalisanlar(salonId)
}async function kapaliGunEkle() {
  if (!salonId || !yeniTarih) return

  const { error } = await supabase
    .from("salon_kapali_gunler")
    .insert({
      salon_id: salonId,
      tarih: yeniTarih,
      aciklama: yeniAciklama,
    })

  if (error) {
    alert(error.message)
    return
  }

  setYeniTarih("")
  setYeniAciklama("")
  fetchKapaliGunler(salonId)
}
async function kapaliGunSil(id: number) {
  if (!salonId) return

  const { error } = await supabase
    .from("salon_kapali_gunler")
    .delete()
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  fetchKapaliGunler(salonId)
}
async function hizmetEkle() {
  if (!salonId || !yeniHizmetAd) return

  const { error } = await supabase
    .from("hizmetler")
    .insert({
      salon_id: salonId,
      ad: yeniHizmetAd,
      sure: yeniHizmetSure,
      aktif: true
    })

  if (error) {
    alert(error.message)
    return
  }

  setYeniHizmetAd("")
  fetchHizmetler(salonId)
}
async function hizmetSil(id: number) {
  if (!salonId) return

  const { error } = await supabase
    .from("hizmetler")
    .delete()
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  fetchHizmetler(salonId)
}
async function randevuSil(id: number) {
  if (!salonId) return

  const onay = confirm("Randevuyu silmek istediğinize emin misiniz?")
  if (!onay) return

  const { error } = await supabase
    .from("randevular")
    .delete()
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  fetchRandevular(salonId)
}
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Yükleniyor...
      </main>
    )
  }
if (!lisansAktif) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="bg-red-600/20 border border-red-600 p-8 rounded-xl text-center">
        Aylık bakım süreniz dolmuştur.
        <br />
        Lütfen ödeme yapınız.
      </div>
    </main>
  )
}
  return (
    <main className="min-h-screen bg-zinc-950 text-white md:flex relative">
      {/* SIDEBAR */}
      <aside
  className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 bg-zinc-900 border-r border-zinc-800 p-6 z-50 transform transition-transform duration-300
  ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
  md:translate-x-0 md:block`}
>
        
        <h2 className="text-xl font-bold mb-10">Admin Panel</h2>

        <nav className="space-y-4 text-sm">
          <div
            className={`cursor-pointer ${
              activeTab === "randevular"
                ? "text-yellow-500 font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("randevular")}
          >
            Randevular
          </div>
<div
  className={`cursor-pointer ${
    activeTab === "hizmetler"
      ? "text-yellow-500 font-semibold"
      : "text-gray-400 hover:text-white"
  }`}
  onClick={() => setActiveTab("hizmetler")}
>
  Hizmetler
</div>
          <div
            className={`cursor-pointer ${
              activeTab === "calisanlar"
                ? "text-yellow-500 font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("calisanlar")}
          >
            Çalışanlar
          </div>
          <div
  className={`cursor-pointer ${
    activeTab === "tatil"
      ? "text-yellow-500 font-semibold"
      : "text-gray-400 hover:text-white"
  }`}
  onClick={() => setActiveTab("tatil")}
>
  Tatil Günleri
</div>
        </nav>
      </aside>
{mobileMenuOpen && (
  <div
    onClick={() => setMobileMenuOpen(false)}
    className="fixed inset-0 bg-black/50 z-40 md:hidden"
  />
)}
      {/* CONTENT */}
      <div className="flex-1 p-8">
        {/* TOP BAR */}
        <button
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  className="md:hidden bg-zinc-800 px-3 py-2 rounded-lg mr-3"
>
  ☰
</button>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
           <h1 className="text-2xl font-bold">
  {activeTab === "randevular"
    ? "Randevular"
    : activeTab === "calisanlar"
    ? "Çalışanlar"
    : "Tatil Günleri"}
</h1>
            <p className="text-gray-400 text-sm">
              Bugün {gunlukToplam} müşteri
            </p>
            <div className="flex flex-wrap gap-3 mb-6 text-sm">
  {[
    { key: "bugun", label: "Bugün" },
    { key: "hafta", label: "Bu Hafta" },
    { key: "ay", label: "Bu Ay" },
    { key: "gecmis", label: "Geçmiş" },
  ].map((f: any) => (
    <button
      key={f.key}
      onClick={() => setRandevuFiltre(f.key)}
      className={`px-4 py-2 rounded-lg ${
        randevuFiltre === f.key
          ? "bg-yellow-500 text-black"
          : "bg-zinc-800 hover:bg-zinc-700"
      }`}
    >
      {f.label}
    </button>
  ))}
</div>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.reload()
            }}
            className="bg-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-700 transition self-start md:self-auto"
          >
            Çıkış
          </button>
        </div>

        {/* RANDEVULAR */}
        {activeTab === "randevular" && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
         <div className="hidden md:grid grid-cols-6 px-6 py-4 border-b border-zinc-800 text-sm text-gray-400 font-semibold">
  <div>Müşteri</div>
  <div>Hizmet</div>
  <div>Çalışan</div>
  <div>Tarih</div>
  <div>Durum</div>
  <div className="text-right">İşlem</div>
</div>

            {randevular.length === 0 && (
              <div className="p-6 text-gray-400">
                Henüz randevu yok.
              </div>
            )}

            {randevular.map((r) => (
              <div
                key={r.id}
               className="border-b border-zinc-800 p-4 md:grid md:grid-cols-6 md:px-6 md:py-5 md:items-center hover:bg-zinc-800/40 transition"
              >
                <div>
                  <p className="font-semibold">
                    {r.musteri_ad}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.musteri_tel}
                  </p>
                </div>

                <div className="text-sm">{r.hizmet}</div>
<div className="text-sm">
  {r.calisan_ad || "—"}
</div>
                <div className="text-sm">
                  {r.tarih}
                  <div className="text-xs text-gray-400">
                    {r.saat}
                  </div>
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      r.durum === "Bekliyor"
                        ? "bg-yellow-500 text-black"
                        : r.durum === "Onaylandı"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {r.durum}
                  </span>
                </div>

               <div className="text-right space-y-2">

  {r.durum !== "Onaylandı" && (
    <button
      onClick={async () => {
        await supabase
          .from("randevular")
          .update({ durum: "Onaylandı" })
          .eq("id", r.id)

        const mesaj = `Merhaba ${r.musteri_ad}, ${r.tarih} ${r.saat} tarihli randevunuz onaylanmıştır.`

        window.open(
          `https://wa.me/90${r.musteri_tel.replace(/^0/, "")}?text=${encodeURIComponent(mesaj)}`
        )

        if (salonId) fetchRandevular(salonId)
      }}
      className="bg-green-600 px-3 py-1 rounded text-xs"
    >
      Onayla
    </button>
  )}

  <button
    onClick={() => randevuSil(r.id)}
    className="bg-red-600 px-3 py-1 rounded text-xs"
  >
    Sil
  </button>

</div>
              </div>
            ))}
          </div>
        )}

        {/* CALISANLAR */}
        {activeTab === "calisanlar" && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <div className="mb-6 space-y-3">

  <input
    value={yeniCalisan}
    onChange={(e) => setYeniCalisan(e.target.value)}
    placeholder="Çalışan adı"
    className="bg-zinc-800 p-2 rounded w-full"
  />

  <select
    onChange={(e) => setIzinliGun(Number(e.target.value))}
    className="bg-zinc-800 p-2 rounded w-full"
  >
    <option value="">İzinli Gün</option>
    <option value={1}>Pazartesi</option>
    <option value={2}>Salı</option>
    <option value={3}>Çarşamba</option>
    <option value={4}>Perşembe</option>
    <option value={5}>Cuma</option>
    <option value={6}>Cumartesi</option>
    <option value={0}>Pazar</option>
  </select>

  <button
    onClick={calisanEkle}
    className="bg-yellow-500 px-4 py-2 rounded text-black w-full"
  >
    Ekle
  </button>

</div>

            {calisanlar.length === 0 && (
              <div className="text-gray-400">
                Henüz çalışan yok.
              </div>
            )}

          {calisanlar.map((c) => (
  <div
    key={c.id}
    className="p-3 bg-zinc-800 rounded mb-3 flex flex-col gap-2"
  >
    <div className="flex justify-between items-center">
      <span className="font-semibold">{c.ad}</span>

      <button
        onClick={() => calisanSil(c.id)}
        className="bg-red-600 px-3 py-1 rounded text-xs"
      >
        Sil
      </button>
    </div>

    <select
      value={c.izinli_gun ?? ""}
      onChange={(e) =>
        calisanIzinGuncelle(
          c.id,
          e.target.value === "" ? null : Number(e.target.value)
        )
      }
      className="bg-zinc-700 p-2 rounded text-sm"
    >
      <option value="">İzinli Gün Yok</option>
      <option value={1}>Pazartesi</option>
      <option value={2}>Salı</option>
      <option value={3}>Çarşamba</option>
      <option value={4}>Perşembe</option>
      <option value={5}>Cuma</option>
      <option value={6}>Cumartesi</option>
      <option value={0}>Pazar</option>
    </select>
  </div>
))}
          </div>
        )}
    {activeTab === "hizmetler" && (
  <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

    <div className="space-y-3 mb-6">

      <input
        placeholder="Hizmet adı"
        value={yeniHizmetAd}
        onChange={(e) => setYeniHizmetAd(e.target.value)}
        className="bg-zinc-800 p-2 rounded w-full"
      />

      <select
        value={yeniHizmetSure}
        onChange={(e) => setYeniHizmetSure(Number(e.target.value))}
        className="bg-zinc-800 p-2 rounded w-full"
      >
        <option value={30}>30 Dakika</option>
        <option value={60}>60 Dakika</option>
        <option value={90}>90 Dakika</option>
        <option value={120}>120 Dakika</option>
      </select>

      <button
        onClick={hizmetEkle}
        className="bg-yellow-500 px-4 py-2 rounded text-black w-full"
      >
        Hizmet Ekle
      </button>

    </div>

    {hizmetler.length === 0 && (
      <div className="text-gray-400">
        Henüz hizmet yok.
      </div>
    )}

  {hizmetler.map((h) => (
  <div
    key={h.id}
    className="p-3 bg-zinc-800 rounded mb-2 flex justify-between items-center"
  >
    <div>
      <div className="font-semibold">{h.ad}</div>
      <div className="text-xs text-gray-400">
        {h.sure} dakika
      </div>
    </div>

    <button
      onClick={() => hizmetSil(h.id)}
      className="bg-red-600 px-3 py-1 rounded text-xs"
    >
      Sil
    </button>
  </div>
))}

  </div>
)}
        {activeTab === "tatil" && (
  <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

    {/* ✅ SABİT KAPALI GÜN BURAYA EKLENDİ */}
    <div className="mb-6 p-4 bg-zinc-800 rounded">
      <div className="text-sm mb-2 font-semibold">
        Haftalık Sabit Kapalı Gün
      </div>

      <select
        value={sabitKapaliGun ?? ""}
        onChange={async (e) => {
          const value =
            e.target.value === "" ? null : Number(e.target.value)

          setSabitKapaliGun(value)

          if (!salonId) return

          await supabase
            .from("salonlar")
            .update({ sabit_kapali_gun: value })
            .eq("id", salonId)
        }}
        className="bg-zinc-700 p-2 rounded w-full"
      >
        <option value="">Sabit Kapalı Gün Yok</option>
        <option value={1}>Pazartesi</option>
        <option value={2}>Salı</option>
        <option value={3}>Çarşamba</option>
        <option value={4}>Perşembe</option>
        <option value={5}>Cuma</option>
        <option value={6}>Cumartesi</option>
        <option value={0}>Pazar</option>
      </select>
    </div>

    {/* 🔽 BURADAN SONRA ESKİ TARİH BAZLI TATİL DEVAM EDİYOR */}
    <div className="space-y-3 mb-6">
      <input
        type="date"
        value={yeniTarih}
        onChange={(e) => setYeniTarih(e.target.value)}
        className="bg-zinc-800 p-2 rounded w-full"
      />

      <input
        placeholder="Açıklama (örn: Bayram, Yıllık izin)"
        value={yeniAciklama}
        onChange={(e) => setYeniAciklama(e.target.value)}
        className="bg-zinc-800 p-2 rounded w-full"
      />

      <button
        onClick={kapaliGunEkle}
        className="bg-yellow-500 px-4 py-2 rounded text-black w-full"
      >
        Tatil Günü Ekle
      </button>
    </div>

    {kapaliGunler.map((g) => (
      <div
        key={g.id}
        className="p-3 bg-zinc-800 rounded mb-2 flex justify-between"
      >
        <div>
          <div>{g.tarih}</div>
          <div className="text-xs text-gray-400">{g.aciklama}</div>
        </div>

        <button
          onClick={() => kapaliGunSil(g.id)}
          className="bg-red-600 px-3 py-1 rounded text-xs"
        >
          Sil
        </button>
      </div>
    ))}

  </div>
)}
      </div>
    </main>
  )
}