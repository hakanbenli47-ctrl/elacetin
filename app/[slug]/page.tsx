"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/app/theme/theme"
export default function SalonPage() {
  const { theme } = useTheme()
 const params = useParams()
const slug = Array.isArray(params?.slug)
  ? params?.slug[0]
  : params?.slug

  const [hizmetler, setHizmetler] = useState<any[]>([])
  const [salon, setSalon] = useState<any>(null)
  const [loading, setLoading] = useState(true)
const [uygunGunler, setUygunGunler] = useState<any[]>([])
  const [seciliHizmet, setSeciliHizmet] = useState<any>(null)
  const [tarih, setTarih] = useState("")
  const [musteriAd, setMusteriAd] = useState("")
  const [musteriTel, setMusteriTel] = useState("")
  const [doluSaatler, setDoluSaatler] = useState<string[]>([])
  const [seciliSaat, setSeciliSaat] = useState("")
  const [calisanlar, setCalisanlar] = useState<any[]>([])
const [seciliCalisan, setSeciliCalisan] = useState<any>(null)
function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

  // 1️⃣ Haftayı üret
  
useEffect(() => {
  if (!salon) return

  async function getCalisanlar() {
    const { data, error } = await supabase
      .from("calisanlar")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("aktif", true)

console.log("CALISAN DATA:", data)
console.log("CALISAN ERROR:", error)
    if (data) setCalisanlar(data)
  }

  getCalisanlar()
}, [salon])
  // Salon çek
  useEffect(() => { 
    if (!slug) return

   async function getSalon() {
  console.log("SLUG:", slug)

  const { data, error } = await supabase
    .from("salonlar")
    .select("*")
    .eq("slug", slug)
    .single()

  console.log("SALON DATA:", data)
  console.log("SALON ERROR:", error)

  if (data) setSalon(data)
  setLoading(false)
}

    getSalon()
  }, [slug])
  useEffect(() => {
  if (!salon) return

  async function getHizmetler() {
    const { data } = await supabase
      .from("hizmetler")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("aktif", true)

    if (data) setHizmetler(data)
  }

  getHizmetler()
}, [salon])
useEffect(() => {
  if (!salon) return

  async function gunleriFiltrele() {
  const bugun = new Date()
  const tumSaatler = saatleriUret()
  const aktifGunler: any[] = []

  // 🔥 7 günlük tarih listesi oluştur
  const tarihListesi: string[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(bugun.getDate() + i)
    tarihListesi.push(formatLocalDate(d))
  }

  // 🔥 Kapalı günleri tek sorguda çek
  const { data: tumKapaliGunler } = await supabase
    .from("salon_kapali_gunler")
    .select("tarih, aciklama")
    .eq("salon_id", salon.id)
    .in("tarih", tarihListesi)

  // 🔥 Randevuları tek sorguda çek
 let randevuQuery = supabase
  .from("randevular")
  .select("tarih, saat, sure, calisan_id")
  .eq("salon_id", salon.id)
  .in("tarih", tarihListesi)

if (seciliCalisan) {
  randevuQuery = randevuQuery.eq(
    "calisan_id",
    seciliCalisan.id
  )
}

const { data: tumRandevular } = await randevuQuery
  for (let i = 0; i < 7; i++) {
    const tarihObj = new Date()
    tarihObj.setDate(bugun.getDate() + i)

    const iso = formatLocalDate(tarihObj)
    const gunIndex = tarihObj.getDay()

    let kapaliMi = false
    let kapaliMesaj = ""

    // 🔥 Çalışan izin günü
    if (
      seciliCalisan &&
      seciliCalisan.izinli_gun !== null &&
      seciliCalisan.izinli_gun === gunIndex
    ) {
      kapaliMi = true
      kapaliMesaj = "Çalışan izinli"
    }

    // 🔥 Salon sabit kapalı gün
    if (
      salon.sabit_kapali_gun !== null &&
      salon.sabit_kapali_gun === gunIndex
    ) {
      kapaliMi = true
      kapaliMesaj = "Kapalı"
    }

    // 🔥 Özel tatil kontrolü (tek sorgudan)
    const kapali = tumKapaliGunler?.find(
      (k) => k.tarih === iso
    )

    if (kapali) {
      kapaliMi = true
      kapaliMesaj = kapali.aciklama || "Tatil"
    }

    // 🔥 O güne ait dolu saatler (tek sorgudan)
  const dolu: string[] = []

tumRandevular
  ?.filter((r) => r.tarih === iso)
  .forEach((r) => {

    const [hour, minute] = r.saat.split(":").map(Number)
    const slotSayisi = r.sure / 30

    for (let i = 0; i < slotSayisi; i++) {
      const toplamDakika = hour * 60 + minute + (i * 30)

      const yeniSaat = Math.floor(toplamDakika / 60)
      const yeniDakika = toplamDakika % 60

      const h = yeniSaat.toString().padStart(2, "0")
      const m = yeniDakika.toString().padStart(2, "0")

      dolu.push(`${h}:${m}`)
    }
  })

    const now = new Date()

    const bosSlotVar = tumSaatler.some((s) => {
      const [h, m] = s.split(":").map(Number)

      const slotDate = new Date(tarihObj)
      slotDate.setHours(h)
      slotDate.setMinutes(m)
      slotDate.setSeconds(0)

      const doluMu = dolu.includes(s)

      const saatGectiMi =
        i === 0 && slotDate <= now

      return !doluMu && !saatGectiMi
    })

    aktifGunler.push({
      label: tarihObj.toLocaleDateString("tr-TR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      value: iso,
      kapali: kapaliMi,
      mesaj: kapaliMesaj,
      bos: kapaliMi ? false : bosSlotVar,
    })
  }

  setUygunGunler(aktifGunler)
}

  gunleriFiltrele()
}, [salon, seciliCalisan])

  // Saat üret
function saatleriUret() {
  const saatler: string[] = []

  for (let i = 8; i <= 22; i++) {
    if (i === 22) {
      saatler.push("22:00")
    } else {
      saatler.push(`${i.toString().padStart(2, "0")}:00`)
      saatler.push(`${i.toString().padStart(2, "0")}:30`)
    }
  }

  return saatler
}


  // Dolu saatleri çek
useEffect(() => {
  if (!tarih || !salon || !seciliCalisan) return

  async function doluSaatleriGetir() {
    const { data } = await supabase
      .from("randevular")
      .select("saat, sure")
      .eq("salon_id", salon.id)
      .eq("calisan_id", seciliCalisan.id)
      .eq("tarih", tarih)

    if (!data) return

    const doluSlotlar: string[] = []

 data.forEach((r) => {
  const [hour, minute] = r.saat.split(":").map(Number)
  const slotSayisi = r.sure / 30

  for (let i = 0; i < slotSayisi; i++) {
    const toplamDakika = hour * 60 + minute + (i * 30)

    const yeniSaat = Math.floor(toplamDakika / 60)
    const yeniDakika = toplamDakika % 60

    const h = yeniSaat.toString().padStart(2, "0")
    const m = yeniDakika.toString().padStart(2, "0")

    doluSlotlar.push(`${h}:${m}`)
  }
})

    setDoluSaatler(doluSlotlar)
  }

  doluSaatleriGetir()
}, [tarih, salon, seciliCalisan])
async function randevuKaydet() {
  if (!seciliHizmet || !seciliCalisan || !tarih || !seciliSaat || !musteriAd || !musteriTel) {
    alert("Tüm alanları doldurun")
    return
  }

  // 🔒 ÇAKIŞMA KONTROLÜ
 // 🔥 O gün ve o çalışan için tüm randevuları çek
const { data: mevcutlar } = await supabase
  .from("randevular")
  .select("saat, sure")
  .eq("salon_id", salon.id)
  .eq("calisan_id", seciliCalisan.id)
  .eq("tarih", tarih)

if (!mevcutlar) return

// 🔥 Yeni randevu başlangıç ve bitiş hesapla
const [yHour, yMinute] = seciliSaat.split(":").map(Number)
const yeniStart = yHour * 60 + yMinute
const yeniEnd = yeniStart + seciliHizmet.sure

// 🔥 Çakışma kontrolü
for (let r of mevcutlar) {

  const [mHour, mMinute] = r.saat.split(":").map(Number)
  const mevcutStart = mHour * 60 + mMinute
  const mevcutEnd = mevcutStart + r.sure

  const cakisma =
    yeniStart < mevcutEnd &&
    yeniEnd > mevcutStart

  if (cakisma) {
    alert("Bu saat aralığı dolu")
    return
  }
}

  // ✅ INSERT
const { error } = await supabase.rpc(
  "randevu_ekle_guvenli",
  {
    p_salon_id: salon.id,
    p_calisan_id: seciliCalisan.id,
    p_calisan_ad: seciliCalisan.ad,
    p_musteri_ad: musteriAd,
    p_musteri_tel: musteriTel,
    p_hizmet: seciliHizmet.ad,
    p_sure: seciliHizmet.sure,
    p_tarih: tarih,
    p_saat: seciliSaat,
  }
)

if (error) {
  alert(error.message)
  return
}

alert("Randevunuz oluşturuldu")

// 🔥 SAATLERİ YENİDEN ÇEK
const { data } = await supabase
  .from("randevular")
  .select("saat, sure")
  .eq("salon_id", salon.id)
  .eq("calisan_id", seciliCalisan.id)
  .eq("tarih", tarih)

if (data) {
  const doluSlotlar: string[] = []

  data.forEach((r) => {
    const [hour, minute] = r.saat.split(":").map(Number)
    const baslangic = new Date()
    baslangic.setHours(hour)
    baslangic.setMinutes(minute)

    const slotSayisi = r.sure / 30

    for (let i = 0; i < slotSayisi; i++) {
      const slot = new Date(baslangic)
      slot.setMinutes(slot.getMinutes() + i * 30)

      const h = slot.getHours().toString().padStart(2, "0")
      const m = slot.getMinutes().toString().padStart(2, "0")

      doluSlotlar.push(`${h}:${m}`)
    }
  })

  setDoluSaatler(doluSlotlar)
}

// seçili saati temizle
setSeciliSaat("")

}

  if (loading) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        Yükleniyor...
      </main>
    )
  }
{/* Background Pattern */}

  if (!salon) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        Salon bulunamadı
      </main>
    )
  }

  return (
  
   <main className={`${theme.bg} flex flex-col items-center`}>

      {/* HERO */}
      <div className="text-center pt-24 pb-14 px-6">

  <div className={`inline-block px-10 py-6 rounded-[40px] ${theme.heroCard}`}>
    
   <h1 className={`text-4xl md:text-6xl font-semibold tracking-wide ${theme.title}`}>
      {salon.ad}
    </h1>

   <div className={`mt-3 w-16 h-[2px] mx-auto ${theme.accentLine}`} />

    <p className={`mt-3 text-xs tracking-[4px] uppercase ${theme.subtitle}`}>
      Hair & Beauty Studio
    </p>

  </div>

</div>
      {/* FORM */}
      <div className="max-w-xl mx-auto px-4 pb-20">

<div className={`${theme.card} rounded-3xl p-6 md:p-8 space-y-6 relative z-10`}>

          <input
            placeholder="Ad Soyad"
            value={musteriAd}
            onChange={(e) => setMusteriAd(e.target.value)}
           className={`w-full p-4 rounded-xl ${theme.input}`}
          />

          <input
            placeholder="Telefon"
            value={musteriTel}
            onChange={(e) => setMusteriTel(e.target.value)}
           className={`w-full p-4 rounded-xl ${theme.input}`}
          />

          <select
            onChange={(e) => {
              const h = hizmetler.find((x) => x.ad === e.target.value)
              setSeciliHizmet(h)
            }}
            className={`w-full p-4 rounded-xl ${theme.input}`}
          >
            <option value="">Hizmet Seçiniz</option>
            {hizmetler.map((h, i) => (
              <option key={i} value={h.ad}>
    {h.ad} - {h.sure} dk
   </option>
            ))}
          </select>
         
    <select
    value={seciliCalisan?.id || ""}
    onChange={(e) => {
    const c = calisanlar.find(
      (x) => x.id === Number(e.target.value)
    )
    setSeciliCalisan(c || null)
   }}
   disabled={!seciliHizmet}
  className={`w-full p-4 rounded-xl ${theme.input}`}
   >
   <option value="">
    {seciliHizmet ? "Çalışan Seçiniz" : "Önce hizmet seçiniz"}
   </option>

   {calisanlar.map((c) => (
    <option key={c.id} value={c.id}>
      {c.ad}
    </option>
   ))}
   </select>
          {/* 1 HAFTALIK TARİH SEÇİMİ */}
          <div className="grid grid-cols-3 gap-3">
        {uygunGunler.map((g, i) => (
   <button
    key={i}
    disabled={g.kapali || !g.bos}
    onClick={() => {
      if (!g.kapali && g.bos) {
        setTarih(g.value)
      }
    }}
    className={`py-3 rounded-xl text-sm font-medium transition ${
      g.kapali
        ? "bg-red-600/50 cursor-not-allowed"
        : tarih === g.value
       ? theme.button
        :theme.soft
    }`}
  >
    <div>{g.label}</div>

    {g.kapali && (
      <div className="text-xs mt-1">
        {g.mesaj}
      </div>
    )}
  </button>
))}

          </div>

          {/* SAATLER */}
          {tarih && seciliCalisan && (
            <div className="grid grid-cols-4 gap-3">
              {saatleriUret().map((s, i) => (
                <button
                  key={i}
       disabled={(() => {

  if (!seciliHizmet || !seciliCalisan) return true

  const yeniBaslangic = s
  const yeniSure = seciliHizmet.sure

  const [yHour, yMinute] = yeniBaslangic.split(":").map(Number)
  const yeniStart = yHour * 60 + yMinute
  const yeniEnd = yeniStart + yeniSure

  for (let dolu of doluSaatler) {

    const [dHour, dMinute] = dolu.split(":").map(Number)
    const doluStart = dHour * 60 + dMinute
    const doluEnd = doluStart + 30

    const cakisma =
      yeniStart < doluEnd &&
      yeniEnd > doluStart

    if (cakisma) return true
  }

  if (
    tarih === formatLocalDate(new Date()) &&
    s < new Date().toTimeString().slice(0,5)
  ) {
    return true
  }

  return false
})()}

                  onClick={() => setSeciliSaat(s)}
                  className={`py-3 rounded-xl text-sm font-medium transition ${
  (() => {

   if (!seciliHizmet) return theme.soft

    const slotSayisi = seciliHizmet.sure / 30

    const [hour, minute] = s.split(":").map(Number)
    const baslangic = new Date()
    baslangic.setHours(hour)
    baslangic.setMinutes(minute)

    for (let i = 0; i < slotSayisi; i++) {
      const kontrol = new Date(baslangic)
      kontrol.setMinutes(kontrol.getMinutes() + i * 30)

      const h = kontrol.getHours().toString().padStart(2, "0")
      const m = kontrol.getMinutes().toString().padStart(2, "0")

      if (doluSaatler.includes(`${h}:${m}`)) {
       return theme.danger
      }
    }

   if (seciliSaat === s) {
  return theme.button
}
   return theme.soft
  })()
}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={randevuKaydet}
           className={`w-full mt-6 py-4 rounded-xl font-bold ${theme.button}`}
          >
            Randevuyu Oluştur
          </button>

        </div>
      </div>
    </main>
  )
}
