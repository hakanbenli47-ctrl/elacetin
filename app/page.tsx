"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { defaultProducts } from "@/lib/seed";
import { weightLabel,weightOptions,priceFor,undiscountedFiveKg,roundMoney } from "@/lib/pricing";
import { defaultShopSettings,quoteCart,campaignActive } from "@/lib/shop";
import type { ShopSettings,CheckoutQuote } from "@/lib/shop";
import "./store.css";
const PHONE="905515550302";
const categories = ["Tümü", "Kuruyemiş", "Leblebi", "Çekirdek", "Kuru Meyve", "Karışık"] as const;
type CartLine = {productId:string;weight:string;qty:number};
const amounts=weightOptions;
const img="https://images.unsplash.com/photo-1600189020840-e9918c25269d?auto=format&fit=crop&w=1750&q=88";
const track=(event:string,target="")=>{if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("benli:track",{detail:{event,target}}));};
const format=(value:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format(value);
function Icon({type,size=21}:{type:string;size?:number}){
 const p:Record<string,React.ReactNode>={
  bag:<><path d="M4 8h16l-1.5 12H5.5L4 8Z"/><path d="M9 9V6a3 3 0 016 0v3"/></>,
  arrow:<><path d="M4 12h16m-7-6 6 6-6 6"/></>,up:<><path d="M5 19 19 5M9 5h10v10"/></>,
  search:<><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/></>,
  menu:<path d="M4 7h16M4 12h16M4 17h16"/>,x:<path d="M5 5 19 19M19 5 5 19"/>,
  plus:<path d="M5 12h14M12 5v14"/>,minus:<path d="M5 12h14"/>,user:<><circle cx="12" cy="8" r="4"/><path d="M4 21c1-8 15-8 16 0"/></>,
  leaf:<><path d="M21 3C9 3 4 8 4 15a6 6 0 006 6c7 0 11-6 11-18Z"/><path d="M4 21c4-7 7-10 13-14"/></>,
  truck:<><path d="M2 7h12v11H2zM14 11h4l4 4v3h-8"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
  check:<path d="m4 12 5 5L20 6"/>,chat:<path d="M20 11.5a8.5 8.5 0 01-8.5 8.5c-1.5 0-2.5-.3-3.7-.9L3 21l1.7-4.7a8.5 8.5 0 1115.3-4.8Z"/>,
  package:<><rect x="3" y="6" width="18" height="15" rx="2"/><path d="m3 9 9 5 9-5M12 14v7"/></>,
  shield:<><path d="m12 2 8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/></>,
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[type]}</svg>;
}
function Logo(){return <a href="/" className="bm-logo"><span className="bm-symbol">B<em>✦</em></span><span className="bm-logotext"><strong>BENLİ</strong><small>KURUYEMİŞ</small></span></a>}
function SafeImage({src,alt,className="",priority=false}:{src:string;alt:string;className?:string;priority?:boolean}){return <img src={src||"/images/nuts-fallback.svg"} alt={alt} className={className} loading={priority?"eager":"lazy"} fetchPriority={priority?"high":"auto"} onError={e=>{const image=e.currentTarget;if(image.dataset.fallback)return;image.dataset.fallback="1";image.src="/images/nuts-fallback.svg";}}/>}
function Money({price}:{price:number|null}){return <>{price===null?"Fiyat sorunuz":format(price)}</>}
function InfoTitle({eyebrow,title,sub}:{eyebrow:string;title:React.ReactNode;sub?:string}){return <div className="bm-heading"><span>{eyebrow}</span><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>}

export default function Home(){
 const [products,setProducts]=useState<Product[]>([]);
 const [productsLoaded,setProductsLoaded]=useState(false);
 const [productsError,setProductsError]=useState("");
 const [searchOpen,setSearchOpen]=useState(false);
 const [searchIndex,setSearchIndex]=useState(0);
 const [spotlightIndex,setSpotlightIndex]=useState(0);
 const searchRef=useRef<HTMLDivElement>(null);
 const [category,setCategory]=useState<string>("Tümü");
 const [search,setSearch]=useState("");
 const [cart,setCart]=useState<CartLine[]>([]);
 const [shop,setShop]=useState<ShopSettings>(defaultShopSettings);
 const [shopLoaded,setShopLoaded]=useState(false);
 const [shopError,setShopError]=useState(false);
 const [couponCode,setCouponCode]=useState("");
 const [verifiedQuote,setVerifiedQuote]=useState<{key:string;quote:CheckoutQuote}|null>(null);
 const [couponChecking,setCouponChecking]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [drawer,setDrawer]=useState(false);
 const [menu,setMenu]=useState(false);
 const [detail,setDetail]=useState<Product|null>(null);
 const [selectedWeight,setSelectedWeight]=useState("500");
 const [checkout,setCheckout]=useState(false);
 const [customer,setCustomer]=useState({name:"",phone:"",email:"",address:"",note:""});
 const [google,setGoogle]=useState<{name:string;email:string}|null>(null);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 useEffect(()=>{
  fetch("/api/products",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Ürünler yüklenemedi.");if(!Array.isArray(d.products))throw Error("Ürün listesi alınamadı.");setProducts(d.products);}).catch(e=>setProductsError(e instanceof Error?e.message:"Ürünler yüklenemedi.")).finally(()=>setProductsLoaded(true));
  fetch("/api/shop",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Mağaza ayarları okunamadı.");setShop(d.settings)}).then(()=>setShopLoaded(true)).catch(()=>setShopError(true));
  fetch("/api/google/session",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.user){setGoogle(d.user);setCustomer(s=>({...s,email:d.user.email,name:d.user.name}));}}).catch(()=>{});
  try{const saved=JSON.parse(localStorage.getItem("benli-cart")||"[]");if(Array.isArray(saved))setCart(saved.filter((x:any)=>x&&typeof x.productId==="string"&&amounts.includes(String(x.weight) as typeof amounts[number])&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<100));}catch{}
  setLoaded(true);
 },[]);
 useEffect(()=>{if(loaded)localStorage.setItem("benli-cart",JSON.stringify(cart))},[cart,loaded]);
 useEffect(()=>{document.body.style.overflow=(drawer||detail||checkout)?"hidden":"";return()=>{document.body.style.overflow=""}},[drawer,detail,checkout]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(""),3000);return()=>clearTimeout(t)},[notice]);
 const show=useMemo(()=>products.filter(p=>p.active&&(category==="Tümü"||p.category===category)&&`${p.name} ${p.category} ${p.description}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR").trim())),[products,category,search]);
 const suggestions=useMemo(()=>products.filter(p=>p.active&&(!search.trim()||`${p.name} ${p.category} ${p.description}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR").trim()))).slice(0,6),[products,search]);
 const featuredProducts=useMemo(()=>{const active=products.filter(p=>p.active);const choices=active.filter(p=>p.featured);return (choices.length?choices:active).slice(0,6)},[products]);
 const spotlight=featuredProducts[spotlightIndex%Math.max(1,featuredProducts.length)]||null;
 useEffect(()=>{if(featuredProducts.length<2)return;const t=setInterval(()=>setSpotlightIndex(i=>(i+1)%featuredProducts.length),6500);return()=>clearInterval(t)},[featuredProducts.length]);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(searchRef.current&&!searchRef.current.contains(e.target as Node))setSearchOpen(false)};const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setSearchOpen(false)};document.addEventListener("pointerdown",close);window.addEventListener("keydown",esc);return()=>{document.removeEventListener("pointerdown",close);window.removeEventListener("keydown",esc)}},[]);
 function selectSearchProduct(p:Product){setSearch(p.name);setSearchOpen(false);openDetail(p)}
 function onSearchKeyDown(e:React.KeyboardEvent<HTMLInputElement>){
  if(e.key==="ArrowDown"){e.preventDefault();setSearchOpen(true);setSearchIndex(i=>(i+1)%Math.max(suggestions.length,1))}
  if(e.key==="ArrowUp"){e.preventDefault();setSearchOpen(true);setSearchIndex(i=>(i+Math.max(suggestions.length,1)-1)%Math.max(suggestions.length,1))}
  if(e.key==="Enter"){e.preventDefault();if(searchOpen&&suggestions.length){selectSearchProduct(suggestions[Math.min(searchIndex,suggestions.length-1)])}else{setSearchOpen(false);document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}}
 }
 const count=cart.reduce((s,x)=>s+x.qty,0);
 const quoteKey=JSON.stringify({cart,couponCode});
 const baseQuote=useMemo(()=>quoteCart(cart,products,shop),[cart,products,shop]);
 const quote=verifiedQuote?.key===quoteKey?verifiedQuote.quote:baseQuote;
 useEffect(()=>{
  if(!couponCode.trim()||!shopLoaded||!cart.length){setVerifiedQuote(null);setCouponChecking(false);return}
  const controller=new AbortController();setCouponChecking(true);
  const t=setTimeout(()=>{
   fetch("/api/shop/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart,couponCode}),signal:controller.signal})
     .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Kupon doğrulanamadı.");setVerifiedQuote({key:quoteKey,quote:d.quote})})
     .catch(()=>setVerifiedQuote(null)).finally(()=>{if(!controller.signal.aborted)setCouponChecking(false)});
  },350);
  return()=>{clearTimeout(t);controller.abort()};
 },[quoteKey,couponCode,cart,shopLoaded]);
 const expanded=cart.map(l=>{const p=products.find(x=>x.id===l.productId);const item=quote.items.find(q=>q.productId===l.productId&&q.weight===l.weight);return p?{...l,p,unit:item?.unitPrice??null}:null}).filter((x):x is NonNullable<typeof x>=>x!==null);
 const total=quote.total;
 const activeCampaign=campaignActive(shop)?shop.campaign:null;
 const campaignProducts=activeCampaign?products.filter(p=>p.active&&activeCampaign.productIds.includes(p.id)):[];
 function add(id:string,weight:string){
  const p=products.find(x=>x.id===id);if(!p||!p.active||p.stock<1){setNotice("Bu ürün stokta bulunmuyor.");return}
  setCart(a=>{const exists=a.find(x=>x.productId===id&&x.weight===weight);return exists?a.map(x=>x===exists?{...x,qty:Math.min(x.qty+1,Math.min(99,p.stock))}:x):[...a,{productId:id,weight,qty:1}]});
  track("add_to_cart",p.slug);
  setNotice("Ürün sepete eklendi");
 }
 function changeQty(id:string,weight:string,by:number){setCart(a=>a.map(l=>{const p=products.find(x=>x.id===id);return l.productId===id&&l.weight===weight?{...l,qty:Math.min(l.qty+by,p?.stock||99)}:l}).filter(l=>l.qty>0));}
 function chooseCategory(cat:string){setCategory(cat);const target:Record<string,string>={"Tümü":"tumu","Kuruyemiş":"kuruyemis","Leblebi":"leblebi","Çekirdek":"cekirdek","Kuru Meyve":"kuru_meyve","Karışık":"karisik"};track("category_view",target[cat]||"tumu");document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}
 function openDetail(p:Product){track("product_view",p.slug);setDetail(p);setSelectedWeight("500")}
 async function sendOrder(){
  if(sending)return;
  if(!customer.name.trim()||customer.phone.replace(/\D/g,"").length<10){setError("Ad soyad ve geçerli telefon numaranızı girin.");return}
  if(expanded.length===0){setError("Sepetiniz boş.");return}
  if(!shopLoaded||quote.total===null){setError("Tüm fiyat ve kargo bilgileri yüklenemedi. Daha sonra tekrar deneyin.");return}
  setSending(true);setError("");
  try{
   const resp=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...customer,items:cart,couponCode,payment:"WhatsApp görüşmesi"})});
   const result=await resp.json();
   if(!resp.ok)throw Error(result.error||"Sipariş talebi oluşturulamadı.");
   const serverQuote=result.quote as typeof quote;
   const lineText=serverQuote.items.map((line,i)=>`${i+1}) ${line.name} — ${weightLabel(line.weight)} x ${line.qty} — ${line.subtotal===null?"Fiyat sorulacak":format(line.subtotal)}`).join("\n");
   const message=`Merhaba Benli Kuruyemiş, ürünler için sipariş talebi göndermek istiyorum.\n\nTalep No: ${result.orderId}\n${lineText}\n\nÜrün tutarı: ${serverQuote.subtotal===null?"Fiyat teyidi gerekli":format(serverQuote.subtotal)}\n${serverQuote.basketDiscount>0?"Sepet/kupon indirimi: -"+format(serverQuote.basketDiscount)+"\n":""}PTT kargo: ${serverQuote.freeShipping?"ÜCRETSİZ":format(serverQuote.shippingFee||0)}\nGENEL TOPLAM: ${serverQuote.total===null?"Fiyat teyidi gerekli":format(serverQuote.total)}\n\nAd Soyad: ${customer.name}\nTelefon: ${customer.phone}\n${customer.address?"Adres: "+customer.address+"\n":""}${customer.note?"Not: "+customer.note+"\n":""}Lütfen siparişimi ve ödeme koşullarını teyit edin.`;
   track("order_requested","checkout");
   const url="https://wa.me/"+PHONE+"?text="+encodeURIComponent(message);
   track("whatsapp_click","checkout");
   window.location.href=url;
  }catch(e){setError(e instanceof Error?e.message:"Talep oluşturulamadı");setSending(false)}
 }
 return <div className="bm">
  <div className="bm-topline"><span><Icon type="leaf" size={14}/> BENLİ KURUYEMİŞ · LEZZETİN ADRESİ</span><a data-track="whatsapp_contact" href="https://wa.me/905515550302" target="_blank" rel="noreferrer"><Icon type="chat" size={15}/> 0551 555 03 02 • WhatsApp</a></div>
  <header className="bm-header">
   <div className="bm-mainnav"><Logo/>
    <div className="bm-search-shell" ref={searchRef}><div className={`bm-search ${searchOpen?"bm-search-active":""}`}><Icon type="search" size={22}/><input value={search} autoComplete="off" onFocus={()=>{setSearchOpen(true);setSearchIndex(0)}} onChange={e=>{setSearch(e.target.value);setSearchIndex(0);setSearchOpen(true);if(e.target.value.trim())track("search","search");}} onKeyDown={onSearchKeyDown} placeholder="Ne arıyorsunuz? Badem, fıstık, leblebi..." aria-label="Mağazada ürün ara" aria-expanded={searchOpen} aria-controls="bm-live-search"/> {search&&<button className="bm-search-clear" type="button" aria-label="Aramayı sil" onClick={()=>{setSearch("");setSearchOpen(true)}}>×</button>}<button className="bm-search-submit" data-track="search_button" onClick={()=>{setSearchOpen(false);document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}} type="button">Ürün Ara <Icon type="arrow" size={16}/></button></div>
    {searchOpen&&<div className="bm-search-results" id="bm-live-search" role="region" aria-label="Canlı ürün arama sonuçları"><div className="bm-search-results-head"><span>{search.trim()?"ARAMA SONUÇLARI":"MAĞAZADAN ÖNERİLER"}</span><small>{suggestions.length?search.trim()?"En ilgili ürünler":"Ürünleri keşfet":""}</small></div>
     {!productsLoaded?<div className="bm-search-empty">Ürünler yükleniyor...</div>:productsError?<div className="bm-search-empty">Ürünler şu anda gösterilemiyor.</div>:suggestions.length?suggestions.map((p,i)=><button type="button" key={p.id} className={`bm-search-result ${i===searchIndex?"selected":""}`} onClick={()=>selectSearchProduct(p)}><span className="bm-search-thumb"><SafeImage src={p.image} alt={p.name}/></span><span className="bm-search-result-info"><strong>{p.name}</strong><small>{p.category}{p.badge?" • "+p.badge:""}</small></span><span className="bm-search-result-price">{p.prices["500"]!==null&&p.prices["500"]!==undefined?format(p.prices["500"]):"Fiyat sorunuz"}<small>500 g</small></span><Icon type="arrow" size={15}/></button>):<div className="bm-search-empty">{search.trim()?"Bu aramayla eşleşen ürün bulunamadı.":"Henüz ürün eklenmedi."}</div>}
     {suggestions.length>0&&<button className="bm-search-showall" type="button" onClick={()=>{setSearchOpen(false);document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}}>Tüm uygun ürünleri görüntüle <Icon type="arrow" size={16}/></button>}</div>}
   </div>
    <div className="bm-main-actions">
     <a href="/giris" data-track="login" className="bm-account"><Icon type="user"/><span>{google?google.name.split(" ")[0]:"Google ile"}<strong>{google?"Hesabım":"Giriş Yap"}</strong></span></a>
     <button data-track="cart_open" className="bm-cartbtn" onClick={()=>setDrawer(true)} type="button"><Icon type="bag" size={25}/><span>Sepetim<strong>{count} ürün</strong></span>{count>0&&<b>{count}</b>}</button>
     <button className="bm-mobmenu" aria-label="Menüyü aç" onClick={()=>setMenu(!menu)} type="button"><Icon type={menu?"x":"menu"} size={25}/></button>
    </div>
   </div>
   <nav className={`bm-categories ${menu?"open":""}`}>
    <button data-track="category_nav" type="button" className="bm-catall" onClick={()=>chooseCategory("Tümü")}><Icon type="menu" size={18}/> TÜM ÜRÜNLER</button>
    {categories.slice(1).map(c=><button data-track="category_nav" key={c} type="button" onClick={()=>{chooseCategory(c);setMenu(false)}}>{c}</button>)}
    <a href="#hikayemiz">Hakkımızda</a><a data-track="bulk_order" className="bm-bulk" href="https://wa.me/905515550302?text=Toptan%20kuruyemi%C5%9F%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer">TOPTAN SİPARİŞ ↗</a>
   </nav>
  </header>
  <main>
   <section className="bm-hero"><div className="bm-hero-copy"><p className="bm-overline">✦ BENLİ KURUYEMİŞ</p><h1>Lezzetin<br/><em>en güzel</em><br/>hâli.</h1><p className="bm-hero-desc">Kuruyemişin en sevilen çeşitleri, Benli kalitesiyle.</p><div className="bm-hero-buttons"><a href="#urunler" data-track="hero_products" className="bm-btn primary">ÜRÜNLERİ KEŞFET <Icon type="arrow"/></a><a href="#hikayemiz" data-track="hero_about" className="bm-btn outline">BİZİ TANIYIN <Icon type="up"/></a></div><div className="bm-hero-hint"><Icon type="leaf" size={18}/><small>Toptan tecrübesi, sofraların lezzeti.</small></div></div><div className="bm-hero-image"><SafeImage src={spotlight?.image||img} alt={spotlight?spotlight.name:"Benli Kuruyemiş kuruyemiş koleksiyonu"} priority/><div className="bm-hero-photo-overlay"/>{spotlight&&<div className="bm-spotlight"><span className="bm-spotlight-kicker">{spotlight.badge||"VİTRİNDEN SEÇTİK"}</span><button type="button" onClick={()=>openDetail(spotlight)}><strong>{spotlight.name}</strong><span>Ürünü incele <Icon type="arrow" size={17}/></span></button></div>}{featuredProducts.length>1&&<div className="bm-spotlight-dots" aria-label="Vitrin ürününü değiştir">{featuredProducts.map((p,i)=><button type="button" key={p.id} className={i===spotlightIndex?"active":""} aria-label={p.name+" ürününü göster"} onClick={()=>setSpotlightIndex(i)}/>)}</div>}</div><div className="bm-seal"><span>BENLİ</span><strong>✦</strong><span>KURUYEMİŞ</span></div></section>
   <div className="bm-features"><div><Icon type="package" size={26}/><p><strong>Özenle seçilen lezzetler</strong><span>Benli Kuruyemiş</span></p></div><div><Icon type="truck" size={28}/><p><strong>Kargo seçenekleri</strong><span>Siparişte bilgi alın</span></p></div><div><Icon type="chat" size={26}/><p><strong>WhatsApp sipariş</strong><span>Hızlı iletişim</span></p></div><div><Icon type="shield" size={27}/><p><strong>Kolay sipariş</strong><span>Sepete ekle, görüş</span></p></div></div>
   <section className="bm-section bm-category-wrap" id="kategoriler"><div className="bm-titlebar"><InfoTitle eyebrow="BİRBİRİNDEN LEZZETLİ" title={<>Aradığınız <em>lezzet burada.</em></>} sub="Favori kuruyemişinizi seçin."/><a href="#urunler">TÜM ÜRÜNLER <Icon type="arrow" size={18}/></a></div><div className="bm-category-grid">
    {[{name:"Kuruyemiş",pic:defaultProducts[0].image,note:"KLASİKLER"},{name:"Leblebi",pic:defaultProducts[6].image,note:"ÇITIR ATIŞTIRMALIKLAR"},{name:"Çekirdek",pic:defaultProducts[7].image,note:"SOHBETLERİN VAZGEÇİLMEZİ"},{name:"Karışık",pic:defaultProducts[3].image,note:"SEVİLEN KARIŞIMLAR"}].map((c,i)=><button data-track="category_nav" type="button" key={c.name} className="bm-category" onClick={()=>chooseCategory(c.name)}><SafeImage src={c.pic} alt={c.name}/><span className="bm-category-text"><small>{c.note}</small><strong>{c.name}</strong></span><span className="bm-category-icon"><Icon type="up" size={18}/></span></button>)}
   </div></section>
   {activeCampaign&&<section className="bm-monthly-section" id="aylik-kampanya"><div className="bm-monthly-banner"><div className="bm-monthly-copy"><span className="bm-monthly-top">✦ {activeCampaign.eyebrow||"AYIN KAMPANYASI"}</span><h2>{activeCampaign.title||"Ayın özel fırsatları"}</h2><p>{activeCampaign.subtitle||"Seçili ürünlerde avantajlı alışveriş."}</p><div className="bm-monthly-tags"><span>{activeCampaign.percent>0?"SEÇİLİ ÜRÜNLERDE %"+activeCampaign.percent+" İNDİRİM":"BU AYA ÖZEL SEÇİMLER"}</span><small>{activeCampaign.endDate} tarihine kadar</small></div><a href={campaignProducts.length?"#aylik-urunler":"#urunler"} className="bm-btn primary">KAMPANYAYI KEŞFET <Icon type="arrow" size={17}/></a></div><div className="bm-monthly-art"><SafeImage src={activeCampaign.image||campaignProducts[0]?.image||img} alt="Benli Kuruyemiş aylık kampanya"/></div></div>{campaignProducts.length>0&&<div className="bm-monthly-products" id="aylik-urunler"><div className="bm-monthly-product-title"><h3>Kampanyadaki ürünler</h3><span>{campaignProducts.length} özel seçim</span></div><div className="bm-monthly-product-grid">{campaignProducts.slice(0,6).map(p=><ProductCard key={p.id} p={p} campaignPercent={activeCampaign.percent} add={add} showDetails={openDetail}/>)}</div></div>}</section>}
   <section className="bm-promo-row"><div className="bm-promo-light"><span>KEYİFLİ ANLARIN TADI</span><h3>Günün <em>lezzeti.</em></h3><p>Favorinizi hemen seçin.</p><a href="#urunler">ÜRÜNLERE BAKIN <Icon type="arrow" size={17}/></a></div><div className="bm-promo-dark"><span>İŞLETMELERE ÖZEL</span><h3>Toptan alımda<br/><em>yanınızdayız.</em></h3><p>Toptan fiyat için bize yazın.</p><a href="https://wa.me/905515550302?text=Merhaba%2C%20toptan%20kuruyemi%C5%9F%20i%C3%A7in%20fiyat%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer">TEKLİF ALIN <Icon type="up" size={17}/></a></div></section>
   <section className="bm-section bm-products-wrap" id="urunler"><div className="bm-titlebar"><InfoTitle eyebrow="SİZİN İÇİN SEÇTİK" title={<>Benli <em>ürün vitrini.</em></>} sub="Vitrinimize yalnızca mağaza yönetiminden eklenen ürünler gelir."/><span className="bm-display-count">{show.length} ürün</span></div><div className="bm-filterrow">{categories.map(c=><button data-track="category_filter" type="button" key={c} onClick={()=>{setCategory(c);track("category_view",({"Tümü":"tumu","Kuruyemiş":"kuruyemis","Leblebi":"leblebi","Çekirdek":"cekirdek","Kuru Meyve":"kuru_meyve","Karışık":"karisik"} as Record<string,string>)[c]||"tumu")}} className={category===c?"active":""}>{c}</button>)}</div>
    {!productsLoaded?<div className="bm-noresults"><strong>Ürünler yükleniyor...</strong><p>Mağaza vitrini hazırlanıyor.</p></div>:productsError?<div className="bm-noresults bm-load-error"><strong>Ürünler şu anda gösterilemiyor.</strong><p>Veritabanı bağlantısını kontrol edip sayfayı yenileyin.</p><button type="button" onClick={()=>window.location.reload()}>Tekrar dene</button></div>:show.length===0?<div className="bm-noresults"><strong>{products.length===0?"Mağazamızın vitrini hazırlanıyor.":"Bu seçimde ürün bulunamadı."}</strong><p>{products.length===0?"Yeni ürünler yakında burada yer alacak.":"Aramanızı değiştirin veya diğer kategorilere göz atın."}</p>{products.length>0&&<button onClick={()=>{setCategory("Tümü");setSearch("")}} type="button">Tüm ürünleri göster</button>}</div>:<div className="bm-products-grid">{show.map(p=><ProductCard key={p.id} p={p} campaignPercent={activeCampaign?.productIds.includes(p.id)?activeCampaign.percent:0} add={add} showDetails={openDetail}/>)}</div>}
   </section>
   <section className="bm-story" id="hikayemiz"><div className="bm-story-photo"><SafeImage src={defaultProducts[2].image} alt="Benli Kuruyemiş ürünlerinden bir görünüm"/></div><div className="bm-story-copy"><InfoTitle eyebrow="BENLİ HİKÂYESİ" title={<>Kuruyemişi <em>iyi tanıyoruz.</em></>} /><p>Toptan kuruyemiş ticaretindeki deneyimimizi şimdi evlerinize taşıyoruz. En sevilen lezzetleri kolayca keşfedin.</p><div className="bm-story-badges"><span><Icon type="check" size={18}/> Toptan satış deneyimi</span><span><Icon type="check" size={18}/> WhatsApp sipariş</span></div><a data-track="story_contact" href="https://wa.me/905515550302" target="_blank" rel="noreferrer" className="bm-btn dark">BİZE ULAŞIN <Icon type="up"/></a></div></section>
   <section className="bm-newsletter"><span>GÜZEL BİR MOLA VERİN</span><h2>Keyfiniz <em>yerinde olsun.</em></h2><p>Sepetinizi hazırlayın, bize yazın.</p><a data-track="newsletter_products" href="#urunler" className="bm-btn primary">ÜRÜNLERİ İNCELEYİN <Icon type="arrow"/></a></section>
  </main>
  <footer className="bm-footer"><div className="bm-footer-cols"><div><Logo/><p>Lezzetin Benli hâli.</p></div><div><h4>HIZLI ERİŞİM</h4><a href="#urunler" data-track="footer_products">Ürünlerimiz</a><a href="#kategoriler">Kategoriler</a><a href="#hikayemiz">Hakkımızda</a><a href="/giris">Google ile giriş</a></div><div><h4>KATEGORİLER</h4>{categories.slice(1,5).map(c=><a href="#urunler" key={c} onClick={()=>setCategory(c)}>{c}</a>)}</div><div><h4>İLETİŞİM</h4><a href="tel:+905515550302">0551 555 03 02</a><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">WhatsApp ile yazın ↗</a><p>İşletme adresi ve yasal satış bilgileri yayına alınmadan önce tamamlanmalıdır.</p></div></div><div className="bm-footer-bottom"><span>© {new Date().getFullYear()} BENLİ KURUYEMİŞ</span><span>Siparişler WhatsApp ile teyit edilir.</span><a data-track="privacy" href="/cerez-politikasi">Çerez ve Gizlilik Politikası</a><button data-track="cookie_settings" className="bm-cookie-link" type="button" onClick={()=>window.dispatchEvent(new Event("benli:cookie-settings"))}>Çerez Ayarları</button><a href="/admin">Yönetim</a></div></footer>
  {notice&&<div className="bm-toast" role="status"><Icon type="check" size={17}/>{notice}</div>}
  {detail&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDetail(null)}/><section className="bm-detail bm-modal" role="dialog" aria-modal="true" aria-label={detail.name}><button type="button" className="bm-close" onClick={()=>setDetail(null)} aria-label="Kapat"><Icon type="x"/></button><div className="bm-detail-image"><SafeImage src={detail.image} alt={detail.name}/></div><div className="bm-detail-copy"><span className="bm-overline">{detail.category}</span><h2>{detail.name}</h2><p>{detail.description}</p>{detail.badge&&<div className="bm-detail-promo">{detail.badge}</div>}{detail.discount5kg&&detail.discount5kg>0&&<p className="bm-detail-bulk">5 kg alımında %{detail.discount5kg} paket indirimi!</p>}{activeCampaign&&activeCampaign.productIds.includes(detail.id)&&activeCampaign.percent>0&&<p className="bm-detail-bulk">Aylık kampanya: %{activeCampaign.percent} ek indirim.</p>}<h4>GRAMAJ SEÇİN</h4><div className="bm-weight-options">{amounts.map(w=><button type="button" className={selectedWeight===w?"active":""} key={w} onClick={()=>setSelectedWeight(w)}>{weightLabel(w)}</button>)}</div><div className="bm-pricebig"><Money price={priceFor(detail,selectedWeight)===null?null:roundMoney((priceFor(detail,selectedWeight)||0)*(1-(activeCampaign?.productIds.includes(detail.id)?activeCampaign.percent:0)/100))}/></div>{selectedWeight==="5000"&&(detail.discount5kg||0)>0&&<p className="bm-detail-bulk">5 kg normal fiyat: {format(undiscountedFiveKg(detail)||0)} · %{detail.discount5kg} indirim</p>}<button type="button" disabled={detail.stock<1} className="bm-btn dark" onClick={()=>{add(detail.id,selectedWeight);setDetail(null);setDrawer(true)}}>{detail.stock<1?"STOKTA YOK":"SEPETE EKLE"} <Icon type="bag"/></button><div className="bm-detail-extra"><h4>Ürün açıklaması</h4><p>{detail.description||"Ürün bilgileri hazırlanıyor."}</p><h4>İçindekiler</h4><p>{detail.ingredients||"Ürün içerik bilgisi eklenecek."}</p><h4>Alerjen bilgisi</h4><p>{detail.allergens||"Alerjen bilgisi doğrulanacak."}</p></div></div></section></div>}
  {drawer&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDrawer(false)}/><aside role="dialog" aria-modal="true" aria-labelledby="bm-cart-title" className="bm-drawer"><div className="bm-drawer-header"><div><span>BENLİ KURUYEMİŞ</span><h2 id="bm-cart-title">Sepetim ({count})</h2></div><button type="button" className="bm-close" onClick={()=>setDrawer(false)} aria-label="Kapat"><Icon type="x"/></button></div><div className="bm-cart-lines">{!expanded.length?<div className="bm-emptycart"><Icon type="bag" size={49}/><h3>Sepetiniz henüz boş.</h3><p>Sevdiğiniz lezzetleri eklemek için ürünlere göz atın.</p><button type="button" className="bm-btn dark" onClick={()=>setDrawer(false)}>ALIŞVERİŞE DEVAM</button></div>:expanded.map(l=><div className="bm-cart-line" key={l.productId+":"+l.weight}><div className="bm-cart-thumb"><SafeImage src={l.p.image} alt={l.p.name}/></div><div><strong>{l.p.name}</strong><small>{weightLabel(l.weight)}</small><span><Money price={l.unit}/></span><div className="bm-qty"><button type="button" onClick={()=>changeQty(l.productId,l.weight,-1)}><Icon type="minus" size={16}/></button>{l.qty}<button type="button" onClick={()=>changeQty(l.productId,l.weight,1)}><Icon type="plus" size={16}/></button></div></div><button type="button" className="bm-remove" onClick={()=>setCart(a=>a.filter(x=>x.productId!==l.productId||x.weight!==l.weight))}>Sil</button></div>)}</div>{expanded.length>0&&<div className="bm-cart-summary">{shopError&&<div className="bm-cart-load-error">Kargo ve kampanya bilgilerine erişilemiyor. Sipariş şu an oluşturulamaz.</div>}<div><span>Ürün tutarı (kampanya dahil)</span><strong>{quote.subtotal===null?"Fiyat sorunuz":format(quote.subtotal)}</strong></div>{quote.campaignDiscount>0&&<div className="bm-cart-saving"><span>Aylık kampanya kazancınız</span><strong>{format(quote.campaignDiscount)}</strong></div>}{quote.basketDiscount>0&&<div className="bm-cart-saving"><span>{quote.discountReason}</span><strong>−{format(quote.basketDiscount)}</strong></div>}<div><span>PTT Kargo</span><strong>{quote.freeShipping?"BEDAVA":quote.shippingFee===null?"—":format(quote.shippingFee)}</strong></div>{shop.freeShippingThreshold>0&&!quote.freeShipping&&quote.subtotal!==null&&<div className="bm-free-shipping-hint">{format(shop.freeShippingThreshold)} ve üzeri net sepette kargo ücretsiz.</div>}<label className="bm-coupon">İndirim kuponu<input value={couponCode} maxLength={25} placeholder="Kupon kodunuz" onChange={e=>setCouponCode(e.target.value.toLocaleUpperCase("tr-TR"))}/>{couponCode&&<small>{couponChecking||verifiedQuote?.key!==quoteKey?"Kupon kontrol ediliyor...":quote.couponApplied?"Kupon uygulandı.":"Kupon geçersiz veya otomatik indirim daha avantajlı."}</small>}</label><div className="bm-cart-grand"><span>GENEL TOPLAM</span><strong>{total===null?"Fiyat sorunuz":format(total)}</strong></div><p>Sepet tutarı ve PTT kargo bedeli yönetici ayarlarına göre hesaplanır. Sipariş WhatsApp ile teyit edilir.</p><button data-track="checkout" className="bm-btn dark" type="button" onClick={()=>{track("checkout_started","checkout");setDrawer(false);setCheckout(true)}}>SİPARİŞ TALEBİ OLUŞTUR <Icon type="arrow"/></button></div>}</aside></div>}
  {checkout&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setCheckout(false)}/><section className="bm-checkout bm-modal" role="dialog" aria-modal="true" aria-label="Sipariş talebi"><button className="bm-close" onClick={()=>setCheckout(false)} type="button" aria-label="Kapat"><Icon type="x"/></button><span className="bm-overline">WHATSAPP İLE SİPARİŞ</span><h2>Sipariş talebiniz</h2><p>Bilgilerinizi girin. Talebiniz oluşturulduktan sonra WhatsApp&apos;a yönlendirileceksiniz. <strong>WhatsApp mesajını göndermeden sipariş kesinleşmez.</strong></p>{google&&<div className="bm-user-chip"><Icon type="check" size={17}/> Google ile giriş yapıldı: {google.email}</div>}<div className="bm-formgrid"><label>Ad Soyad *<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Adınız soyadınız"/></label><label>Telefon *<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label><label>E-posta<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} placeholder="ornek@gmail.com"/></label><label>Teslimat adresi (opsiyonel)<input value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="İl / ilçe / adres"/></label><label className="wide">Sipariş notu<textarea rows={3} value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Varsa özel talebiniz..."/></label></div><div className="bm-checkout-breakdown">{shopError&&<p className="bm-cart-load-error">Kargo ayarları yüklenemedi. Sipariş şu an oluşturulamaz.</p>}<div><span>Ürün tutarı</span><strong>{quote.subtotal===null?"Fiyat sorunuz":format(quote.subtotal)}</strong></div>{quote.basketDiscount>0&&<div><span>{quote.discountReason}</span><strong>−{format(quote.basketDiscount)}</strong></div>}<div><span>PTT kargo</span><strong>{quote.freeShipping?"ÜCRETSİZ":quote.shippingFee===null?"—":format(quote.shippingFee)}</strong></div><div className="bm-checkout-total"><span>Genel toplam</span><strong>{total===null?"Fiyat sorunuz":format(total)}</strong></div></div><p className="bm-privacy-note">Bilgileriniz sipariş görüşmesi için kullanılacaktır. Bu aşamada online ödeme alınmaz.</p>{error&&<div className="bm-form-error" role="alert">{error}</div>}<button data-track="send_order" className="bm-btn dark" type="button" disabled={sending||!shopLoaded||quote.total===null||couponChecking} onClick={sendOrder}>{sending?"HAZIRLANIYOR...":"WHATSAPP'A DEVAM ET"} <Icon type="arrow"/></button></section></div>}
 </div>
}
function ProductCard({p,add,showDetails,campaignPercent=0}:{p:Product;add:(id:string,weight:string)=>void;showDetails:(p:Product)=>void;campaignPercent?:number}){
 const [weight,setWeight]=useState("500");
 const base=priceFor(p,weight);
 const price=base===null?null:roundMoney(base*(1-campaignPercent/100));
 return <article className="bm-product"><div className="bm-product-image"><button data-track="product_open" type="button" onClick={()=>showDetails(p)} aria-label={p.name+" detaylarını görüntüle"}><SafeImage src={p.image} alt={p.name}/></button>{(p.badge||p.featured)&&<span className={`bm-product-badge ${p.badge?"bm-badge-promo":""}`}>{p.badge||"ÖNE ÇIKAN"}</span>}{p.stock<1&&<span className="bm-outofstock">STOKTA YOK</span>}</div><div className="bm-product-body"><small>{p.category}</small><button data-track="product_open" className="bm-product-title" onClick={()=>showDetails(p)} type="button">{p.name}</button><p>{p.description}</p>{p.cardNote&&<span className="bm-card-note">{p.cardNote}</span>}{campaignPercent>0&&<span className="bm-card-campaign">AYLIK KAMPANYA %{campaignPercent}</span>}<div className="bm-packs">{amounts.map(w=><button type="button" aria-pressed={weight===w} className={weight===w?"active":""} key={w} onClick={()=>setWeight(w)}>{weightLabel(w)}</button>)}</div><div className="bm-product-footer"><div><span>{weightLabel(weight)}</span>{base!==null&&(campaignPercent>0||(weight==="5000"&&(p.discount5kg||0)>0))&&<del className="bm-old-price">{format(weight==="5000"?(undiscountedFiveKg(p)||base):base)}</del>}<strong><Money price={price}/></strong></div><button data-track="product_add" type="button" disabled={p.stock<1} onClick={()=>add(p.id,weight)} aria-label={p.name+" sepete ekle"}><Icon type="plus" size={22}/></button></div></div></article>
}
