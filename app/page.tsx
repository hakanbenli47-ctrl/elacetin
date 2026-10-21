"use client";

import { useState } from "react";

const images = {
  hero: "https://images.unsplash.com/photo-1600189020840-e9918c25269d?auto=format&fit=crop&w=1500&q=85",
  pistachio: "https://images.unsplash.com/photo-1645291787539-ac637edb7fa5?auto=format&fit=crop&w=900&q=85",
  almond: "https://images.unsplash.com/photo-1642337841034-249c5a21623c?auto=format&fit=crop&w=900&q=85",
  cashew: "https://images.unsplash.com/photo-1769255484443-50e4e3e2bbdb?auto=format&fit=crop&w=900&q=85",
  mixed: "https://images.unsplash.com/photo-1600189020840-e9918c25269d?auto=format&fit=crop&w=900&q=85",
  detail: "https://images.unsplash.com/photo-1573936001854-de71ea654bf3?auto=format&fit=crop&w=1200&q=85",
};

const categories = [
  {
    number: "01",
    name: "Kabuklu lezzetler",
    subtitle: "Her çıtırtıda ayrı keyif",
    image: images.pistachio,
    className: "md:col-span-2",
  },
  {
    number: "02",
    name: "Seçkin kuruyemişler",
    subtitle: "Günlük keyfin vazgeçilmezi",
    image: images.almond,
    className: "md:col-span-1",
  },
  {
    number: "03",
    name: "Karışık lezzetler",
    subtitle: "Bir arada daha güzel",
    image: images.mixed,
    className: "md:col-span-1",
  },
];

const products = [
  { name: "Antep Fıstığı", category: "Kuruyemiş", image: images.pistachio, description: "Çıtır çıtır, vazgeçilmez bir klasik." },
  { name: "Badem", category: "Kuruyemiş", image: images.almond, description: "Her avuçta sade bir lezzet." },
  { name: "Kaju", category: "Kuruyemiş", image: images.cashew, description: "Yumuşak dokusu, kendine özgü tadı." },
  { name: "Karışık Kuruyemiş", category: "Karışımlar", image: images.mixed, description: "Sevilen çeşitler bir arada." },
];

function ArrowIcon({ diagonal = false, className = "" }: { diagonal?: boolean; className?: string }) {
  return diagonal ? (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19 19 5M7 5h12v12" /></svg>
  ) : (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>
  );
}

function LeafIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 4C11 4 5 7 4 14c-.5 3 1.7 6 5 6 8 0 11-8 11-16Z"/><path d="M4 20c3-5 7-8 12-11"/></svg>;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#anasayfa" className="inline-flex items-center gap-3 group" aria-label="Benli Kuruyemiş ana sayfa">
      <span className={"relative grid size-11 shrink-0 place-items-center rounded-full border transition-transform duration-300 group-hover:rotate-[-8deg] " + (light ? "border-[#b6a16c] text-[#ead8aa]" : "border-[#34553d] text-[#34553d]")}>
        <span className="font-serif text-3xl italic leading-none -translate-y-px">B</span>
        <span className={"absolute -bottom-1 -right-1 rounded-full p-0.5 " + (light ? "bg-[#203d2d]" : "bg-[#f7f4ec]")}><LeafIcon className="size-3.5" /></span>
      </span>
      <span className="flex flex-col leading-none">
        <strong className={"font-serif text-[25px] font-semibold tracking-[-0.05em] " + (light ? "text-[#f8f5e9]" : "text-[#23402e]")}>benli</strong>
        <span className={"mt-1 text-[8px] font-bold uppercase tracking-[0.31em] " + (light ? "text-[#d1c3a4]" : "text-[#66806a]")}>kuruyemiş</span>
      </span>
    </a>
  );
}

function SectionHeading({ eyebrow, title, italic, description }: { eyebrow: string; title: string; italic?: string; description?: string }) {
  return (
    <div className="max-w-[630px]">
      <p className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#99804e]">
        <span className="h-px w-7 bg-[#ae9157]" />{eyebrow}
      </p>
      <h2 className="font-serif text-[clamp(2.7rem,5vw,4.7rem)] leading-[1.05] tracking-[-0.055em] text-[#213c2a]">
        {title} {italic && <em className="font-normal text-[#a5834c]">{italic}</em>}
      </h2>
      {description && <p className="mt-5 max-w-lg text-[15px] leading-8 text-[#6d746b]">{description}</p>}
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { label: "Ana Sayfa", href: "#anasayfa" },
    { label: "Kategoriler", href: "#kategoriler" },
    { label: "Ürünler", href: "#urunler" },
    { label: "Hikâyemiz", href: "#hikayemiz" },
  ];

  return (
    <main id="anasayfa" className="min-h-screen overflow-x-hidden bg-[#f8f6ef] text-[#23402e]">
      {/* Üst bilgi şeridi */}
      <div className="bg-[#1c3828] px-4 py-2.5 text-center text-[10px] font-medium tracking-[0.16em] text-[#e9dcc3] sm:text-[11px]">
        TOPTAN TİCARETİN TECRÜBESİ, BENLİ KURUYEMİŞ&apos;İN LEZZETİ
      </div>

      {/* Navigasyon */}
      <header className="relative z-40 border-b border-[#d9dfd3] bg-[#f8f6ef]/95">
        <div className="mx-auto flex h-[86px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16">
          <Logo />
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Ana menü">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="group relative py-2 text-[12px] font-semibold text-[#314936] transition-colors hover:text-[#b38b51]">
                {item.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-[#a68651] transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e978b]">Yeni dijital vitrinimiz</span>
            <a href="#urunler" className="inline-flex items-center gap-3 rounded-full bg-[#254831] px-6 py-3.5 text-xs font-semibold text-[#fffaf0] transition hover:bg-[#173321]">
              Koleksiyonu keşfet <ArrowIcon diagonal className="size-4" />
            </a>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-[#d1dacd] text-[#24452e] lg:hidden"
            aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19" /></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav id="mobile-navigation" aria-label="Mobil menü" className="border-t border-[#e0e4d9] bg-[#f8f6ef] px-7 py-5 lg:hidden">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between border-b border-[#e4e6dd] py-4 text-sm font-semibold">
                {item.label}<ArrowIcon diagonal className="size-4 text-[#b48a51]" />
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#203d2b]">
        <div className="pointer-events-none absolute -left-40 bottom-[-24rem] size-[37rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-28 bottom-[-21rem] size-[30rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-[-12rem] top-[-18rem] size-[36rem] rounded-full bg-[#446348]/25 blur-[100px]" />
        <div className="mx-auto grid min-h-[640px] max-w-[1440px] items-stretch lg:min-h-[690px] lg:grid-cols-[52%_48%]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-20 sm:px-12 lg:px-16 lg:py-28">
            <div className="mb-8 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d7c398]">
              <span className="h-px w-9 bg-[#d1b27c]" /> Benli Kuruyemiş&apos;e hoş geldiniz
            </div>
            <h1 className="max-w-[740px] font-serif text-[clamp(4rem,7.2vw,8rem)] leading-[0.97] tracking-[-0.068em] text-[#fffaf0]">
              Lezzetin<br />
              <em className="font-normal text-[#d4b580]">doğal</em><br />
              hâli.
            </h1>
            <p className="mt-8 max-w-[460px] text-sm leading-8 text-[#d4dfd2] sm:text-[16px]">
              Kuruyemiş ticaretindeki birikimimizi şimdi dijital dünyaya taşıyoruz. Her sofraya yakışan lezzetler, Benli dokunuşuyla.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#urunler" className="inline-flex min-h-14 items-center justify-center gap-5 rounded-full bg-[#e4c994] px-8 text-xs font-bold tracking-wide text-[#223a29] transition hover:-translate-y-0.5 hover:bg-[#f1d9ab]">
                Ürünleri keşfet <ArrowIcon />
              </a>
              <a href="#hikayemiz" className="inline-flex min-h-14 items-center gap-3 border-b border-[#a3b09f] text-xs font-semibold text-[#f4f2e7] transition hover:border-[#e4c994] hover:text-[#e4c994]">
                Bizi tanıyın <ArrowIcon diagonal className="size-4" />
              </a>
            </div>
            <div className="mt-16 flex items-center gap-4 border-t border-white/15 pt-7 text-xs text-[#d4dfd2] sm:mt-20">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#88a48b]/50 text-[#dec394]"><LeafIcon className="size-5" /></span>
              <span className="max-w-xs leading-6">Geleneksel kuruyemiş ticaretinden ilham alan yeni alışveriş deneyimi.</span>
            </div>
          </div>

          <div className="relative min-h-[410px] overflow-hidden lg:min-h-full">
            <img
              src={images.hero}
              alt="Farklı kuruyemişlerden yakın plan bir görünüm"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14271b]/50 via-transparent to-[#12281b]/10 lg:bg-gradient-to-r lg:from-[#203d2b]/30 lg:to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white sm:bottom-9 sm:left-9">
              <p className="max-w-[245px] font-serif text-[27px] italic leading-tight drop-shadow-lg sm:text-[34px]">Bir avuç mutluluk.</p>
              <div className="grid size-[94px] rotate-12 place-items-center rounded-full border border-[#fff7e4]/60 bg-[#fff7e4]/95 p-3 text-center text-[9px] font-bold uppercase leading-4 tracking-widest text-[#23432c] shadow-xl sm:size-[115px]">
                <span>Doğanın<br /><span className="font-serif text-2xl italic normal-case tracking-normal">lezzeti</span><br />sizinle</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kısa vurgu bandı */}
      <div className="border-b border-[#deded2] bg-[#eee9dd]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-[#d9d8cc] px-4 py-6 sm:px-10 lg:grid-cols-4 lg:px-16">
          {["Toptan ticaret tecrübesi", "Sevilen kuruyemiş çeşitleri", "Benli Kuruyemiş güvencesi", "Yeni dijital alışveriş deneyimi"].map((feature, index) => (
            <div key={feature} className="flex items-center gap-3 px-3 py-2 sm:px-6">
              <span className="font-serif text-2xl italic text-[#b39a6b]">{String(index + 1).padStart(2, "0")}</span>
              <span className="max-w-[160px] text-[11px] font-semibold leading-5 text-[#3f5644] sm:text-xs">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kategoriler */}
      <section id="kategoriler" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1312px]">
          <div className="mb-11 flex flex-col items-start justify-between gap-6 lg:mb-14 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="Koleksiyonumuz" title="Her damak tadına" italic="bir lezzet." description="Atıştırmalık molalarından kalabalık sofralara, kuruyemişin sevilen çeşitleri bir arada." />
            <a href="#urunler" className="inline-flex items-center gap-3 border-b border-[#ac925f] pb-2 text-xs font-bold text-[#31503a] transition hover:text-[#b18c55]">
              Tüm ürünleri gör <ArrowIcon diagonal className="size-4" />
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {categories.map((category) => (
              <a href="#urunler" key={category.number} className={"group relative isolate min-h-[355px] overflow-hidden rounded-[6px] sm:min-h-[425px] " + category.className}>
                <img src={category.image} alt={category.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#142318]/90 via-[#172b1a]/25 to-[#142318]/5" />
                <span className="relative z-10 flex h-full min-h-[355px] flex-col justify-between p-7 text-white sm:min-h-[425px] sm:p-9">
                  <span className="font-serif text-lg italic text-[#e1cfac]">{category.number} / Koleksiyon</span>
                  <span>
                    <span className="mb-2 block text-xs text-[#dcded4]">{category.subtitle}</span>
                    <span className="flex items-end justify-between gap-4">
                      <span className="max-w-[320px] font-serif text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">{category.name}</span>
                      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/70 transition group-hover:bg-white group-hover:text-[#233b29]"><ArrowIcon diagonal /></span>
                    </span>
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Ürün kartları: henüz yalnızca vitrin tasarımı */}
      <section id="urunler" className="scroll-mt-20 bg-[#eeefe6] px-5 py-24 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1312px]">
          <div className="mb-12 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <SectionHeading eyebrow="Ürün vitrini" title="Göz atmaya" italic="değer." description="Kuruyemiş severlerin yakından tanıdığı tatlardan bir seçki. Buradaki ürünler tasarım önizlemesi içindir." />
            <span className="w-fit rounded-full border border-[#b9c6b6] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#506d54]">Fiyatlar yakında eklenecek</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <article key={product.name} className="group overflow-hidden rounded-[5px] border border-[#dce1d5] bg-[#fbfaf4] shadow-[0_12px_35px_rgba(32,61,43,0.035)]">
                <div className="relative aspect-[1/1.02] overflow-hidden bg-[#e4e4da]">
                  <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#fffaf1]/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-[#37543c]">{index === 3 ? "Karışım" : "Kuruyemiş"}</span>
                </div>
                <div className="px-5 pb-6 pt-6">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#9d845c]">{product.category}</span>
                  <h3 className="mt-2 font-serif text-[26px] leading-tight tracking-[-0.04em] text-[#25422e]">{product.name}</h3>
                  <p className="mt-2 min-h-[42px] text-[12px] leading-5 text-[#768076]">{product.description}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#e2e5dc] pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#819081]">Ürün tanıtımı</span>
                    <span aria-label="Detaylar hazırlanıyor" className="grid size-9 place-items-center rounded-full border border-[#c8d3c4] text-[#56735a]"><ArrowIcon diagonal className="size-4" /></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col justify-between gap-4 rounded-[5px] border border-[#d4ddce] bg-[#f7f7ee] px-6 py-5 text-sm text-[#436049] sm:flex-row sm:items-center">
            <p className="font-medium">Online sipariş ve WhatsApp sepet deneyimi sonraki aşamada eklenecek.</p>
            <span className="w-fit rounded-full bg-[#e5ebdd] px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Tasarım önizlemesi</span>
          </div>
        </div>
      </section>

      {/* Marka hikayesi */}
      <section id="hikayemiz" className="scroll-mt-20 bg-[#f8f6ef] px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
        <div className="mx-auto grid max-w-[1312px] items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="relative min-h-[450px] lg:min-h-[630px]">
            <div className="absolute inset-0 rounded-t-[45%] bg-[#e4e0d2]" />
            <img src={images.detail} alt="Doğal yeşil tonlarıyla Antep fıstığı içleri" loading="lazy" className="absolute inset-4 h-[calc(100%-16px)] w-[calc(100%-32px)] rounded-t-[45%] object-cover" />
            <div className="absolute bottom-[-22px] right-[-5px] flex size-[140px] -rotate-12 flex-col items-center justify-center rounded-full border-[7px] border-[#f8f6ef] bg-[#bba073] text-center text-[#1b3b2a] shadow-lg sm:right-[-25px] sm:size-[164px]">
              <LeafIcon className="mb-1 size-6" />
              <span className="text-[9px] font-bold uppercase leading-4 tracking-[0.12em]">Benli&apos;nin<br />lezzet dünyası</span>
            </div>
          </div>
          <div className="pt-8 lg:pl-5">
            <p className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a58551]"><span className="h-px w-8 bg-[#bda170]" /> Bizi tanıyın</p>
            <h2 className="font-serif text-[clamp(3rem,5.2vw,5.6rem)] leading-[1.02] tracking-[-0.065em] text-[#203d2b]">
              İşin <em className="font-normal text-[#a58655]">özünde</em><br />lezzet var.
            </h2>
            <p className="mt-7 text-[15px] leading-8 text-[#697569]">
              Benli Kuruyemiş olarak kuruyemişin toptan ticaretindeki birikimimizi, şimdi kendimize ait bir dijital vitrinle buluşturuyoruz. Amacımız, ürünlerimizi daha yakından tanıtabildiğimiz, sade ve güven veren bir alışveriş deneyimi sunmak.
            </p>
            <div className="mt-9 grid gap-5 border-t border-[#d6ddcf] pt-8 sm:grid-cols-2">
              <div>
                <span className="mb-3 grid size-10 place-items-center rounded-full bg-[#e4e9dc] text-[#33573b]"><LeafIcon className="size-5" /></span>
                <h3 className="text-sm font-bold text-[#29482f]">Ticaretin içinden</h3>
                <p className="mt-2 text-xs leading-6 text-[#728072]">Sektördeki deneyimimiz, markamızın temelinde.</p>
              </div>
              <div>
                <span className="mb-3 grid size-10 place-items-center rounded-full bg-[#e4e9dc] font-serif text-xl italic text-[#33573b]">B</span>
                <h3 className="text-sm font-bold text-[#29482f]">Şimdi dijitalde</h3>
                <p className="mt-2 text-xs leading-6 text-[#728072]">Benli Kuruyemiş&apos;in yeni adresini birlikte keşfedin.</p>
              </div>
            </div>
            <a href="#kategoriler" className="mt-9 inline-flex items-center gap-3 border-b border-[#8b9b85] pb-3 text-xs font-bold text-[#294a33] transition hover:text-[#a1814b]">Koleksiyona göz atın <ArrowIcon /></a>
          </div>
        </div>
      </section>

      {/* Alt çağrı */}
      <section className="relative overflow-hidden bg-[#d7c096] px-6 py-20 text-center sm:px-8 lg:py-28">
        <div className="pointer-events-none absolute -left-36 -top-32 size-96 rounded-full border border-[#25462f]/15" />
        <div className="pointer-events-none absolute -right-28 -bottom-44 size-[30rem] rounded-full border border-[#25462f]/15" />
        <div className="relative mx-auto max-w-[770px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.29em] text-[#5f6949]">Benli Kuruyemiş</p>
          <h2 className="mt-5 font-serif text-[clamp(3.1rem,6vw,6.3rem)] leading-[1.06] tracking-[-0.07em] text-[#203b2a]">
            Güzel bir mola, <em className="font-normal">güzel bir lezzet.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[450px] text-sm leading-7 text-[#52604b]">Yeni ürün vitrinimizi keşfedin. Fiyatlar, sipariş ve iletişim bilgileri yakında eklenecek.</p>
          <a href="#urunler" className="mt-8 inline-flex min-h-14 items-center justify-center gap-4 rounded-full bg-[#23422e] px-9 text-xs font-bold text-[#fffaf0] transition hover:bg-[#112d1c]">Ürünlere göz at <ArrowIcon /></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#193323] px-6 pb-9 pt-16 text-[#eaf0e4] sm:px-8 lg:px-16 lg:pt-20">
        <div className="mx-auto grid max-w-[1312px] gap-12 border-b border-white/15 pb-14 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-7 max-w-[340px] text-sm leading-7 text-[#b7c7b8]">Toptan kuruyemiş tecrübemizle şekillenen yeni dijital dünyamız. Lezzeti birlikte keşfedelim.</p>
          </div>
          <div>
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.23em] text-[#d4bf91]">Hızlı bağlantılar</h3>
            <div className="flex flex-col items-start gap-3 text-sm text-[#d3ddd1]">
              {navigation.map((item) => <a key={item.href} href={item.href} className="hover:text-[#efd8a7]">{item.label}</a>)}
            </div>
          </div>
          <div>
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.23em] text-[#d4bf91]">İletişim</h3>
            <p className="max-w-xs text-sm leading-7 text-[#c1d1c1]">Sipariş hattı, işletme adresi ve diğer iletişim bilgileri hazırlık tamamlandığında burada yer alacak.</p>
            <a href="#anasayfa" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#e7d2a2]">Başa dön ↑</a>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1312px] flex-col justify-between gap-4 pt-7 text-[11px] text-[#acbfae] sm:flex-row">
          <span>© {new Date().getFullYear()} Benli Kuruyemiş. Tüm hakları saklıdır.</span>
          <span>Bu sayfa ana sayfa tasarım önizlemesidir.</span>
        </div>
      </footer>
    </main>
  );
}
