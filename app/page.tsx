"use client";

import { useEffect, useMemo, useState } from "react";

type Category = "Tümü" | "Kuruyemiş" | "Leblebi" | "Çekirdek" | "Karışık";
type CartLine = { key: string; productId: string; gramaj: string; adet: number };
type Product = { id: string; name: string; category: Exclude<Category, "Tümü">; tagline: string; image: string; position?: string; label?: string };

const store = {
  name: "Benli Kuruyemiş",
  // WhatsApp numarasını Vercel'de NEXT_PUBLIC_WHATSAPP_NUMBER olarak tanımlayın.
  // Örnek: 905XXXXXXXXX. Numara girilene kadar gerçek siparişe yönlendirme yapılmaz.
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
};

const photos = {
  mix: "https://images.unsplash.com/photo-1600189020840-e9918c25269d?auto=format&fit=crop&w=1600&q=85",
  almond: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=950&q=85",
  pistachio: "https://images.unsplash.com/photo-1645291787539-ac637edb7fa5?auto=format&fit=crop&w=950&q=85",
  cashew: "https://images.unsplash.com/photo-1769255484443-50e4e3e2bbdb?auto=format&fit=crop&w=950&q=85",
  grain: "https://images.unsplash.com/photo-1573936001854-de71ea654bf3?auto=format&fit=crop&w=1100&q=85",
};

const products: Product[] = [
  { id: "antep-fistigi", name: "Antep Fıstığı", category: "Kuruyemiş", tagline: "Her tanesinde tanıdık bir lezzet.", image: photos.pistachio, label: "Çok sevilen" },
  { id: "kaju", name: "Kaju", category: "Kuruyemiş", tagline: "Yumuşak dokulu, doyumsuz lezzet.", image: photos.cashew },
  { id: "cig-badem", name: "Çiğ Badem", category: "Kuruyemiş", tagline: "Sade ve lezzetli bir tercih.", image: photos.almond },
  { id: "karisik-kuruyemis", name: "Karışık Kuruyemiş", category: "Karışık", tagline: "Sevilen lezzetler bir arada.", image: photos.mix, label: "Koleksiyon" },
  { id: "findik", name: "Fındık", category: "Kuruyemiş", tagline: "Geleneksel sofraların vazgeçilmezi.", image: photos.grain },
  { id: "tuzlu-fistik", name: "Tuzlu Fıstık", category: "Kuruyemiş", tagline: "Keyifli molalara eşlik eder.", image: photos.mix },
  { id: "citir-leblebi", name: "Çıtır Leblebi", category: "Leblebi", tagline: "Çıtır dokusu ile ayrı bir keyif.", image: photos.grain },
  { id: "ay-cekirdegi", name: "Ay Çekirdeği", category: "Çekirdek", tagline: "Sohbetlerin klasik eşlikçisi.", image: photos.almond },
];

const weights = ["250 g", "500 g", "1 kg"];
const tabs: Category[] = ["Tümü", "Kuruyemiş", "Leblebi", "Çekirdek", "Karışık"];
const formatter = new Intl.NumberFormat("tr-TR");

function Icon({ name, size = 21 }: { name: "bag" | "arrow" | "up" | "menu" | "close" | "plus" | "minus" | "search" | "leaf" | "check" | "trash"; size?: number }) {
  const shared = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<typeof name, React.ReactNode> = {
    bag: <><path d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    up: <><path d="M5 19 19 5" /><path d="M9 5h10v10" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="M5 5 19 19M19 5 5 19" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    leaf: <><path d="M21 3C9 3 4 8 4 15a6 6 0 0 0 6 6c7 0 11-6 11-18Z" /><path d="M4 21c4-7 7-10 13-14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6m4-6v6" /></>,
  };
  return <svg {...shared}>{paths[name]}</svg>;
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className={`brand ${inverse ? "brand-inverse" : ""}`} href="#ust" aria-label="Benli Kuruyemiş ana sayfa">
      <span className="brand-mark"><span>B</span><i><Icon name="leaf" size={14}/></i></span>
      <span className="brand-copy"><strong>benli</strong><small>KURUYEMİŞ</small></span>
    </a>
  );
}

function SectionTitle({ eyebrow, title, accent, desc }: { eyebrow: string; title: string; accent?: string; desc?: string }) {
  return (
    <div className="section-title">
      <div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div>
      <h2>{title} {accent && <em>{accent}</em>}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

function ProductImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} loading="lazy" onError={(event) => { const target = event.currentTarget; target.style.opacity = "0"; target.parentElement?.classList.add("image-unavailable"); }} />;
}

function ProductCard({ product, add }: { product: Product; add: (productId: string, gramaj: string) => void }) {
  const [weight, setWeight] = useState("500 g");
  return (
    <article className="product-card">
      <div className="product-image">
        <ProductImage src={product.image} alt={product.name} />
        {product.label && <span className="product-label">{product.label}</span>}
        <div className="image-fallback" aria-hidden="true"><Icon name="leaf" size={50} /></div>
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.tagline}</p>
        <div className="weight-row" role="group" aria-label={`${product.name} gramaj seçimi`}>
          {weights.map((gramaj) => <button key={gramaj} className={`weight ${weight === gramaj ? "selected" : ""}`} type="button" onClick={() => setWeight(gramaj)} aria-pressed={weight === gramaj}>{gramaj}</button>)}
        </div>
        <div className="product-bottom">
          <span>Fiyat için bilgi alın</span>
          <button className="add-button" type="button" aria-label={`${product.name} ${weight} talep sepetine ekle`} title="Talep sepetine ekle" onClick={() => add(product.id, weight)}><Icon name="plus" size={19}/></button>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<Category>("Tümü");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("benli-talep-sepeti") || "[]");
      if (Array.isArray(saved)) {
        setCart(saved.filter((line) => line && typeof line.productId === "string" && typeof line.gramaj === "string" && Number.isInteger(line.adet) && line.adet > 0 && line.adet < 1000 && products.some((p) => p.id === line.productId)).map((line) => ({ key: `${line.productId}:${line.gramaj}`, productId: line.productId, gramaj: line.gramaj, adet: line.adet })));
      }
    } catch { /* Bozuk kayıt durumunda boş sepetle başla. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("benli-talep-sepeti", JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);

  const count = cart.reduce((sum, line) => sum + line.adet, 0);
  const visibleProducts = useMemo(() => products.filter((p) => (filter === "Tümü" || p.category === filter) && `${p.name} ${p.category}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR").trim())), [filter, search]);

  function add(productId: string, gramaj: string) {
    const key = `${productId}:${gramaj}`;
    setCart((prev) => {
      const exists = prev.find((line) => line.key === key);
      return exists ? prev.map((line) => line.key === key ? { ...line, adet: Math.min(line.adet + 1, 999) } : line) : [...prev, { key, productId, gramaj, adet: 1 }];
    });
    setToast("Ürün talep sepetine eklendi.");
  }

  function changeAmount(key: string, delta: number) {
    setCart((prev) => prev.map((line) => line.key === key ? { ...line, adet: line.adet + delta } : line).filter((line) => line.adet > 0));
  }

  function requestOffer() {
    if (!store.whatsapp) {
      setToast("WhatsApp sipariş numarası henüz tanımlanmadı.");
      return;
    }
    if (cart.length === 0) return;
    const lines = cart.map((line, index) => {
      const product = products.find((p) => p.id === line.productId);
      return `${index + 1}. ${product?.name ?? "Ürün"} — ${line.gramaj} × ${line.adet}`;
    });
    const message = ["Merhaba Benli Kuruyemiş, aşağıdaki ürünler için fiyat ve sipariş bilgisi almak istiyorum:", "", ...lines, "", "Ürünlerin güncel fiyatını ve kargo koşullarını paylaşabilir misiniz?"].join("\n");
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function chooseCategory(category: Category) {
    setFilter(category);
    document.getElementById("urunler")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div id="ust" className="site">
      <div className="announcement">TOPTAN TİCARETİN TECRÜBESİ · LEZZETİN YENİ ADRESİ <span>✦</span> BENLİ KURUYEMİŞ</div>

      <header className="header">
        <div className="header-inner container">
          <Brand />
          <nav className="desktop-nav" aria-label="Ana menü">
            <a href="#ust">Ana Sayfa</a><a href="#kategoriler">Kategoriler</a><a href="#urunler">Ürünlerimiz</a><a href="#hikayemiz">Hikâyemiz</a>
          </nav>
          <div className="header-actions">
            <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Talep sepetini aç, ${count} ürün`}>
              <Icon name="bag" size={21}/><span className="cart-text">Talep Sepeti</span>{count > 0 && <b>{formatter.format(count)}</b>}
            </button>
            <button className="mobile-toggle" type="button" aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? "close" : "menu"} size={25}/></button>
          </div>
        </div>
        {mobileOpen && <nav className="mobile-nav" aria-label="Mobil menü">
          {[["Ana Sayfa","#ust"],["Kategoriler","#kategoriler"],["Ürünlerimiz","#urunler"],["Hikâyemiz","#hikayemiz"]].map(([label,href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)}>{label}<Icon name="up" size={17}/></a>)}
        </nav>}
      </header>

      <main>
        <section className="hero">
          <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
          <div className="hero-content container">
            <div className="hero-copy">
              <p className="hero-overline"><span />KURUYEMİŞİN BENLİ HÂLİ</p>
              <h1>Lezzetin<br/><em>en doğal</em><br/>hâli.</h1>
              <p className="hero-description">Toptan kuruyemiş ticaretindeki birikimimiz, şimdi sizin için hazırladığımız yepyeni bir vitrinde. Her avuçta iyi bir mola.</p>
              <div className="hero-buttons"><a className="button button-gold" href="#urunler">Lezzetleri keşfet <Icon name="arrow"/></a><a className="hero-link" href="#hikayemiz">Hikâyemizi oku <Icon name="up" size={18}/></a></div>
              <div className="hero-foot"><span className="hero-foot-icon"><Icon name="leaf" size={23}/></span><span>Tanıdık lezzetler.<br/>Yeni bir alışveriş deneyimi.</span></div>
            </div>
          </div>
          <div className="hero-photo"><ProductImage src={photos.mix} alt="Kâsede sunulan çeşitli kuruyemişler" className="hero-photo-img"/><div className="hero-photo-cover"/><span className="hero-stamp">BENLİ <i>✦</i><br/>KURUYEMİŞ</span><div className="hero-photo-caption"><em>Bir avuç mutluluk.</em><span>01 / 03 — LEZZET KOLEKSİYONU</span></div></div>
        </section>

        <section className="values"><div className="container values-inner">
          {[["01","Toptan ticaret tecrübesi"],["02","Özenle seçilmiş lezzetler"],["03","Tanıdık kuruyemiş çeşitleri"],["04","Benli Kuruyemiş vitrini"]].map(([num,text]) => <div className="value" key={num}><span>{num}</span><p>{text}</p></div>)}
        </div></section>

        <section className="section categories-section" id="kategoriler"><div className="container">
          <div className="section-top"><SectionTitle eyebrow="KOLEKSİYONUMUZ" title="Her damak tadına" accent="bir lezzet." desc="Paylaştıkça çoğalan keyifli anlar için sevilen kuruyemiş çeşitlerini bir araya getiriyoruz."/><a href="#urunler" className="text-link">Bütün ürünleri gör <Icon name="up" size={18}/></a></div>
          <div className="category-grid">
            {[{title:"Kuruyemiş",tag:"KLASİK LEZZETLER",image:photos.pistachio,type:"Kuruyemiş" as Category,cls:"category-wide"},
            {title:"Leblebi",tag:"HER MOLAYA EŞLİK",image:photos.grain,type:"Leblebi" as Category,cls:""},
            {title:"Karışık",tag:"BİR ARADA DAHA GÜZEL",image:photos.mix,type:"Karışık" as Category,cls:""}].map((cat) => (
              <button key={cat.title} className={`category-tile ${cat.cls}`} type="button" onClick={() => chooseCategory(cat.type)}>
                <ProductImage src={cat.image} alt={cat.title} /><span className="category-shade"/><span className="category-content"><small>{cat.tag}</small><strong>{cat.title}</strong></span><span className="category-arrow"><Icon name="up" size={21}/></span>
              </button>
            ))}
          </div>
        </div></section>

        <section className="section products-section" id="urunler"><div className="container">
          <div className="section-top"><SectionTitle eyebrow="ÜRÜNLERİMİZ" title="Sevilen tatlar," accent="tek çatı altında." desc="Aşağıdaki katalog önizlemedir. Ürün, fiyat ve stok bilgileri yayına alınmadan önce kesinleştirilecektir."/></div>
          <div className="products-toolbar"><div className="tabs" role="group" aria-label="Ürün kategorileri">{tabs.map((category) => <button key={category} type="button" className={filter === category ? "active" : ""} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}</div><label className="search"><Icon name="search" size={19}/><input aria-label="Ürün ara" type="search" value={search} placeholder="Ürün ara..." onChange={(e) => setSearch(e.target.value)}/></label></div>
          {visibleProducts.length === 0 ? <div className="empty-products"><p>Aradığınız ürün bu listede bulunamadı.</p><button type="button" onClick={() => {setFilter("Tümü");setSearch("");}}>Filtreyi temizle</button></div> : <div className="products-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} add={add}/>)}</div>}
          <div className="products-note"><Icon name="leaf" size={22}/><p><strong>Henüz sipariş almıyoruz.</strong> Bu sürüm, Benli Kuruyemiş&apos;in yeni mağaza tasarımıdır. Sepete ürün ekleyebilirsiniz; sipariş hattı ve fiyatlar tanımlanınca WhatsApp talep sistemi kullanılabilecektir.</p></div>
        </div></section>

        <section className="story-section" id="hikayemiz"><div className="container story-grid">
          <div className="story-art"><ProductImage src={photos.almond} alt="Doğal kuruyemişlerden bir detay" /><div className="story-badge"><Icon name="leaf" size={26}/><span>Benli&apos;nin<br/>lezzet dünyası</span></div></div>
          <div className="story-copy"><SectionTitle eyebrow="BİZİ TANIYIN" title="Bu işin" accent="özünde lezzet var."/><p>Benli Kuruyemiş olarak kuruyemişin toptan ticaretindeki birikimimizi, şimdi kendi dijital vitrinimize taşıyoruz. Ürünlerimizi tanıtabileceğimiz, sade ve güven veren bir alışveriş deneyimi oluşturuyoruz.</p><div className="story-points"><div><span><Icon name="leaf" size={21}/></span><strong>Ticaretin içinden</strong><p>Sektördeki deneyimimizi dijital dünyaya taşıyoruz.</p></div><div><span><Icon name="check" size={21}/></span><strong>Açık ve anlaşılır</strong><p>Ürün bilgilerini kolayca inceleyebileceğiniz bir mağaza.</p></div></div><a href="#urunler" className="text-link">Koleksiyona göz atın <Icon name="arrow" size={19}/></a></div>
        </div></section>

        <section className="cta-section"><div className="container cta-content"><p>BENLİ KURUYEMİŞ</p><h2>Lezzetli molaların<br/><em>yeni adresi.</em></h2><span>Ürünlerimizi keşfedin, talep sepetinizi oluşturun.</span><a className="button button-green" href="#urunler">Ürünlerimize göz at <Icon name="arrow"/></a></div></section>
      </main>

      <footer className="footer"><div className="container"><div className="footer-grid"><div><Brand inverse/><p>Toptan kuruyemiş ticaretindeki deneyimimizle, tanıdık lezzetleri dijital dünyaya taşıyoruz.</p></div><div><h3>Keşfet</h3><a href="#ust">Ana Sayfa</a><a href="#kategoriler">Kategoriler</a><a href="#urunler">Ürünlerimiz</a><a href="#hikayemiz">Hikâyemiz</a></div><div><h3>İletişim</h3><p>İşletme adresi, telefon ve sipariş hattı yayına geçiş öncesinde eklenecektir.</p><p className="footer-small">Ürün fotoğrafları temsilidir; fiyat ve stok bilgisi sunulmamaktadır.</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Benli Kuruyemiş. Tüm hakları saklıdır.</span><a href="#ust">Yukarı dön ↑</a></div></div></footer>

      {toast && <div className="toast" role="status"><Icon name="check" size={18}/>{toast}</div>}
      {cartOpen && <div className="cart-modal" role="presentation"><button className="cart-backdrop" type="button" aria-label="Sepeti kapat" onClick={() => setCartOpen(false)}/><aside className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="cart-header"><div><span className="eyebrow">BENLİ KURUYEMİŞ</span><h2 id="cart-title">Talep Sepetim <small>({count})</small></h2></div><button type="button" className="round-button" aria-label="Sepeti kapat" onClick={() => setCartOpen(false)}><Icon name="close"/></button></div><div className="cart-list">{cart.length === 0 ? <div className="empty-cart"><Icon name="bag" size={48}/><h3>Sepetiniz boş</h3><p>Beğendiğiniz ürünleri sepete ekleyerek başlayın.</p><button className="button button-green" type="button" onClick={() => setCartOpen(false)}>Ürünlere dön <Icon name="arrow"/></button></div> : cart.map((line) => {const product = products.find((p) => p.id === line.productId);if (!product) return null;return <div className="cart-line" key={line.key}><div className="cart-line-image"><ProductImage src={product.image} alt={product.name}/></div><div className="cart-line-info"><strong>{product.name}</strong><small>{line.gramaj} · Fiyat sorunuz</small><div className="quantity"><button type="button" aria-label={`${product.name} adedini azalt`} onClick={() => changeAmount(line.key, -1)}><Icon name="minus" size={15}/></button><b>{line.adet}</b><button type="button" aria-label={`${product.name} adedini artır`} onClick={() => changeAmount(line.key, 1)}><Icon name="plus" size={15}/></button></div></div><button className="remove" type="button" title="Ürünü kaldır" aria-label={`${product.name} ürünü kaldır`} onClick={() => setCart((prev) => prev.filter((item) => item.key !== line.key))}><Icon name="trash" size={19}/></button></div>})}</div>{cart.length > 0 && <div className="cart-bottom"><p><strong>Fiyat ve kargo bilgisi</strong><br/>Bu aşamada görüntülenmiyor; satıcı tarafından teyit edilecek.</p><button className="button button-green checkout" type="button" onClick={requestOffer}>WhatsApp ile fiyat sor <Icon name="arrow"/></button>{!store.whatsapp && <small>WhatsApp hattı henüz bağlanmadı. Sipariş alınmıyor.</small>}</div>}</aside></div>}
    </div>
  );
}
