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
 const [sortMode,setSortMode]=useState<"featured"|"priceLow"|"priceHigh"|"name">("featured");
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
 const catalogCategories=useMemo(()=>categories.filter(c=>c==="Tümü"||products.some(p=>p.active&&p.category===c)),[products]);
 const categoryTiles=useMemo(()=>catalogCategories.filter(c=>c!=="Tümü").map(cat=>{const members=products.filter(p=>p.active&&p.category===cat);return {name:cat,photo:members[0]?.image||"",count:members.length,note:cat==="Kuruyemiş"?"SEVİLEN KLASİKLER":cat==="Karışık"?"BİR ARADA LEZZET":cat==="Kuru Meyve"?"MEYVEDEN GELEN TAT":cat==="Çekirdek"?"SOHBETLİK LEZZETLER":"ÇITIR MOLALAR"}}),[catalogCategories,products]);
 const sortedShow=useMemo(()=>[...show].sort((a,b)=>sortMode==="priceLow"?(priceFor(a,"1000")??Infinity)-(priceFor(b,"1000")??Infinity):sortMode==="priceHigh"?(priceFor(b,"1000")??-Infinity)-(priceFor(a,"1000")??-Infinity):sortMode==="name"?a.name.localeCompare(b.name,"tr"):Number(b.featured)-Number(a.featured)),[show,sortMode]);
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
 function openDetail(p:Product){track("product_view",p.slug);setDetail(p)}
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
     {!productsLoaded?<div className="bm-search-empty">Ürünler yükleniyor...</div>:productsError?<div className="bm-search-empty">Ürünler şu anda gösterilemiyor.</div>:suggestions.length?suggestions.map((p,i)=><button type="button" key={p.id} className={`bm-search-result ${i===searchIndex?"selected":""}`} onClick={()=>selectSearchProduct(p)}><span className="bm-search-thumb"><SafeImage src={p.image} alt={p.name}/></span><span className="bm-search-result-info"><strong>{p.name}</strong><small>{p.category}{p.badge?" • "+p.badge:""}</small></span><span className="bm-search-result-price">{priceFor(p,"1000")!==null?format(priceFor(p,"1000")!):"Fiyat sorunuz"}<small>1 kg</small></span><Icon type="arrow" size={15}/></button>):<div className="bm-search-empty">{search.trim()?"Bu aramayla eşleşen ürün bulunamadı.":"Henüz ürün eklenmedi."}</div>}
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
    {catalogCategories.slice(1).map(c=><button data-track="category_nav" key={c} type="button" onClick={()=>{chooseCategory(c);setMenu(false)}}>{c}</button>)}
    <a href="#hikayemiz">Hakkımızda</a><a data-track="bulk_order" className="bm-bulk" href="https://wa.me/905515550302?text=Toptan%20kuruyemi%C5%9F%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer">TOPTAN SİPARİŞ ↗</a>
   </nav>
  </header>
  <main>
   <section className="bm-hero bm-hero-premium"><div className="bm-hero-copy"><div className="bm-hero-eyebrow"><span className="bm-hero-eyebrow-line"/>BENLİ KURUYEMİŞ KOLEKSİYONU</div><h1>Bir avuç<br/><em>lezzet.</em><br/>Bir sürü keyif.</h1><p className="bm-hero-desc">Antep fıstığından kajuya, kuruyemiş ve kuru meyvenin sevilen çeşitleri tek vitrinde. Beğendiğiniz lezzeti seçin, gramajınızı belirleyin.</p><div className="bm-hero-buttons"><a href="#urunler" data-track="hero_products" className="bm-btn primary">KOLEKSİYONU KEŞFET <Icon type="arrow"/></a><a href="https://wa.me/905515550302" data-track="hero_whatsapp" target="_blank" rel="noreferrer" className="bm-btn outline"><Icon type="chat" size={17}/> BİZE SORUN</a></div><div className="bm-hero-meta"><span><Icon type="package" size={18}/><strong>{products.filter(p=>p.active).length||"9"} çeşit</strong> lezzet</span><i/><span><Icon type="check" size={17}/> İlk seçim <strong>1 kg</strong></span></div></div><div className="bm-hero-image"><SafeImage src={spotlight?.image||img} alt={spotlight?spotlight.name:"Benli Kuruyemiş kuruyemiş koleksiyonu"} priority/><div className="bm-hero-photo-overlay"/>{spotlight&&<div className="bm-spotlight"><span className="bm-spotlight-kicker">{spotlight.badge||"VİTRİNDEN SEÇTİK"}</span><button type="button" onClick={()=>openDetail(spotlight)}><strong>{spotlight.name}</strong><span className="bm-spotlight-price">{priceFor(spotlight,"1000")!==null?format(priceFor(spotlight,"1000")!)+" / 1 kg":"Fiyat bilgisi için inceleyin"}</span><span>ÜRÜNÜ İNCELE <Icon type="arrow" size={17}/></span></button></div>}{featuredProducts.length>1&&<div className="bm-spotlight-dots" aria-label="Vitrin ürününü değiştir">{featuredProducts.map((p,i)=><button type="button" key={p.id} className={i===spotlightIndex?"active":""} aria-label={p.name+" ürününü göster"} onClick={()=>setSpotlightIndex(i)}/>)}</div>}</div><div className="bm-seal"><span>BENLİ</span><strong>✦</strong><span>KURUYEMİŞ</span></div></section>
   <div className="bm-features"><div><Icon type="package" size={26}/><p><strong>Gramaj size kalmış</strong><span>1 kg seçili, dilediğinizde değiştirin</span></p></div><div><Icon type="truck" size={28}/><p><strong>PTT kargo</strong><span>Ücretini sepette görün</span></p></div><div><Icon type="chat" size={26}/><p><strong>WhatsApp ile sipariş</strong><span>Siparişiniz birebir teyit edilir</span></p></div><div><Icon type="shield" size={27}/><p><strong>Kolay seçim</strong><span>Ürün, gramaj ve sepet</span></p></div></div>
   {activeCampaign&&<section className="bm-monthly-section" id="aylik-kampanya"><div className="bm-monthly-banner"><div className="bm-monthly-copy"><span className="bm-monthly-top">✦ {activeCampaign.eyebrow||"AYIN KAMPANYASI"}</span><h2>{activeCampaign.title||"Ayın özel fırsatları"}</h2><p>{activeCampaign.subtitle||"Seçili ürünlerde avantajlı alışveriş."}</p><div className="bm-monthly-tags"><span>{activeCampaign.percent>0?"SEÇİLİ ÜRÜNLERDE %"+activeCampaign.percent+" İNDİRİM":"BU AYA ÖZEL SEÇİMLER"}</span><small>{activeCampaign.endDate} tarihine kadar</small></div><a href={campaignProducts.length?"#aylik-urunler":"#urunler"} className="bm-btn primary">KAMPANYAYI KEŞFET <Icon type="arrow" size={17}/></a></div><div className="bm-monthly-art"><SafeImage src={activeCampaign.image||campaignProducts[0]?.image||img} alt="Benli Kuruyemiş aylık kampanya"/></div></div>{campaignProducts.length>0&&<div className="bm-monthly-products" id="aylik-urunler"><div className="bm-monthly-product-title"><h3>Kampanyadaki ürünler</h3><span>{campaignProducts.length} özel seçim</span></div><div className="bm-monthly-product-grid">{campaignProducts.slice(0,6).map(p=><ProductCard key={p.id} p={p} campaignPercent={activeCampaign.percent} add={add} showDetails={openDetail}/>)}</div></div>}</section>}
   <section className="bm-section bm-products-wrap" id="urunler"><div className="bm-products-collection-tag"><span className="bm-dot-live"/> BENLİ KURUYEMİŞ · ONLINE VİTRİN</div><div className="bm-titlebar"><InfoTitle eyebrow="ÜRÜNLERİMİZ" title={<>Lezzetini <em>kendin seç.</em></>} sub="Her ürün 1 kg seçili gelir. Dilerseniz 250 g, 500 g veya avantajlı 5 kg seçeneğine geçebilirsiniz."/><span className="bm-display-count">{show.length} ürün</span></div><div className="bm-shop-controls"><div className="bm-filterrow">{catalogCategories.map(c=><button data-track="category_filter" type="button" key={c} onClick={()=>{setCategory(c);track("category_view",({"Tümü":"tumu","Kuruyemiş":"kuruyemis","Leblebi":"leblebi","Çekirdek":"cekirdek","Kuru Meyve":"kuru_meyve","Karışık":"karisik"} as Record<string,string>)[c]||"tumu")}} className={category===c?"active":""}>{c}</button>)}</div><label className="bm-shop-sort">SIRALA <select aria-label="Ürünleri sırala" value={sortMode} onChange={e=>setSortMode(e.target.value as typeof sortMode)}><option value="featured">Önerilen</option><option value="priceLow">Fiyat: düşükten yükseğe</option><option value="priceHigh">Fiyat: yüksekten düşüğe</option><option value="name">Ürün adına göre</option></select></label></div>
    {!productsLoaded?<div className="bm-noresults"><strong>Ürünler yükleniyor...</strong><p>Mağaza vitrini hazırlanıyor.</p></div>:productsError?<div className="bm-noresults bm-load-error"><strong>Ürünler şu anda gösterilemiyor.</strong><p>Veritabanı bağlantısını kontrol edip sayfayı yenileyin.</p><button type="button" onClick={()=>window.location.reload()}>Tekrar dene</button></div>:show.length===0?<div className="bm-noresults"><strong>{products.length===0?"Mağazamızın vitrini hazırlanıyor.":"Bu seçimde ürün bulunamadı."}</strong><p>{products.length===0?"Yeni ürünler yakında burada yer alacak.":"Aramanızı değiştirin veya diğer kategorilere göz atın."}</p>{products.length>0&&<button onClick={()=>{setCategory("Tümü");setSearch("")}} type="button">Tüm ürünleri göster</button>}</div>:<div className="bm-products-grid">{sortedShow.map(p=><ProductCard key={p.id} p={p} campaignPercent={activeCampaign?.productIds.includes(p.id)?activeCampaign.percent:0} add={add} showDetails={openDetail}/>)}</div>}
   </section>
   {categoryTiles.length>0&&<section className="bm-section bm-category-wrap" id="kategoriler"><div className="bm-titlebar"><InfoTitle eyebrow="BENLİ KOLEKSİYONU" title={<>Her damak tadına <em>bir lezzet.</em></>} sub="Hangi lezzet size göre? Kategoriyi seçin, ürünlere doğrudan göz atın."/><a href="#urunler">TÜM ÜRÜNLER <Icon type="arrow" size={18}/></a></div><div className="bm-category-grid">{categoryTiles.map(tile=><button data-track="category_nav" type="button" key={tile.name} className="bm-category" onClick={()=>chooseCategory(tile.name)}><SafeImage src={tile.photo} alt={tile.name}/><span className="bm-category-top">{tile.count} ÇEŞİT</span><span className="bm-category-text"><small>{tile.note}</small><strong>{tile.name}</strong></span><span className="bm-category-icon"><Icon type="up" size={18}/></span></button>)}</div></section>}
   <section className="bm-promo-row"><div className="bm-promo-light"><span>KEYİFLİ ANLARIN TADI</span><h3>Günün <em>lezzeti.</em></h3><p>Favorinizi hemen seçin.</p><a href="#urunler">ÜRÜNLERE BAKIN <Icon type="arrow" size={17}/></a></div><div className="bm-promo-dark"><span>İŞLETMELERE ÖZEL</span><h3>Toptan alımda<br/><em>yanınızdayız.</em></h3><p>Toptan fiyat için bize yazın.</p><a href="https://wa.me/905515550302?text=Merhaba%2C%20toptan%20kuruyemi%C5%9F%20i%C3%A7in%20fiyat%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer">TEKLİF ALIN <Icon type="up" size={17}/></a></div></section>
   <section className="bm-story" id="hikayemiz"><div className="bm-story-photo"><SafeImage src={defaultProducts[2].image} alt="Benli Kuruyemiş ürünlerinden bir görünüm"/></div><div className="bm-story-copy"><InfoTitle eyebrow="BENLİ HİKÂYESİ" title={<>Kuruyemişi <em>iyi tanıyoruz.</em></>} /><p>Toptan kuruyemiş ticaretindeki deneyimimizi şimdi evlerinize taşıyoruz. En sevilen lezzetleri kolayca keşfedin.</p><div className="bm-story-badges"><span><Icon type="check" size={18}/> Toptan satış deneyimi</span><span><Icon type="check" size={18}/> WhatsApp sipariş</span></div><a data-track="story_contact" href="https://wa.me/905515550302" target="_blank" rel="noreferrer" className="bm-btn dark">BİZE ULAŞIN <Icon type="up"/></a></div></section>
   <section className="bm-newsletter"><span>GÜZEL BİR MOLA VERİN</span><h2>Keyfiniz <em>yerinde olsun.</em></h2><p>Sepetinizi hazırlayın, bize yazın.</p><a data-track="newsletter_products" href="#urunler" className="bm-btn primary">ÜRÜNLERİ İNCELEYİN <Icon type="arrow"/></a></section>
  </main>
  <footer className="bm-footer"><div className="bm-footer-cols"><div><Logo/><p>Lezzetin Benli hâli.</p></div><div><h4>HIZLI ERİŞİM</h4><a href="#urunler" data-track="footer_products">Ürünlerimiz</a><a href="#kategoriler">Kategoriler</a><a href="#hikayemiz">Hakkımızda</a><a href="/giris">Google ile giriş</a></div><div><h4>KATEGORİLER</h4>{categories.slice(1,5).map(c=><a href="#urunler" key={c} onClick={()=>setCategory(c)}>{c}</a>)}</div><div><h4>İLETİŞİM</h4><a href="tel:+905515550302">0551 555 03 02</a><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">WhatsApp ile yazın ↗</a><p>İşletme adresi ve yasal satış bilgileri yayına alınmadan önce tamamlanmalıdır.</p></div></div><div className="bm-footer-bottom"><span>© {new Date().getFullYear()} BENLİ KURUYEMİŞ</span><span>Siparişler WhatsApp ile teyit edilir.</span><a data-track="privacy" href="/cerez-politikasi">Çerez ve Gizlilik Politikası</a><button data-track="cookie_settings" className="bm-cookie-link" type="button" onClick={()=>window.dispatchEvent(new Event("benli:cookie-settings"))}>Çerez Ayarları</button><a href="/admin">Yönetim</a></div></footer>
  <div className={`bm-mobile-dock ${drawer||detail||checkout?"hidden":""}`}><a href="#urunler" onClick={()=>setMenu(false)}><Icon type="search" size={18}/><span>Ürünler</span></a><button type="button" onClick={()=>setDrawer(true)}><Icon type="bag" size={18}/><span>Sepetim {count>0?`(${count})`:""}</span></button><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer"><Icon type="chat" size={18}/><span>Destek</span></a></div>
  {notice&&<div className="bm-toast" role="status"><Icon type="check" size={17}/>{notice}</div>}
  {detail&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDetail(null)}/>
     <ProductDetail product={detail} campaignPercent={activeCampaign?.productIds.includes(detail.id)?activeCampaign.percent:0} onClose={()=>setDetail(null)} onAdd={weight=>{add(detail.id,weight);setDetail(null);setDrawer(true)}}/>
   </div>}
  {drawer&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDrawer(false)}/><aside role="dialog" aria-modal="true" aria-labelledby="bm-cart-title" className="bm-drawer"><div className="bm-drawer-header"><div><span>BENLİ KURUYEMİŞ</span><h2 id="bm-cart-title">Sepetim ({count})</h2></div><button type="button" className="bm-close" onClick={()=>setDrawer(false)} aria-label="Kapat"><Icon type="x"/></button></div><div className="bm-cart-lines">{!expanded.length?<div className="bm-emptycart"><Icon type="bag" size={49}/><h3>Sepetiniz henüz boş.</h3><p>Sevdiğiniz lezzetleri eklemek için ürünlere göz atın.</p><button type="button" className="bm-btn dark" onClick={()=>setDrawer(false)}>ALIŞVERİŞE DEVAM</button></div>:expanded.map(l=><div className="bm-cart-line" key={l.productId+":"+l.weight}><div className="bm-cart-thumb"><SafeImage src={l.p.image} alt={l.p.name}/></div><div><strong>{l.p.name}</strong><small>{weightLabel(l.weight)}</small><span><Money price={l.unit}/></span><div className="bm-qty"><button type="button" onClick={()=>changeQty(l.productId,l.weight,-1)}><Icon type="minus" size={16}/></button>{l.qty}<button type="button" onClick={()=>changeQty(l.productId,l.weight,1)}><Icon type="plus" size={16}/></button></div></div><button type="button" className="bm-remove" onClick={()=>setCart(a=>a.filter(x=>x.productId!==l.productId||x.weight!==l.weight))}>Sil</button></div>)}</div>{expanded.length>0&&<div className="bm-cart-summary">{shopError&&<div className="bm-cart-load-error">Kargo ve kampanya bilgilerine erişilemiyor. Sipariş şu an oluşturulamaz.</div>}<div><span>Ürün tutarı (kampanya dahil)</span><strong>{quote.subtotal===null?"Fiyat sorunuz":format(quote.subtotal)}</strong></div>{quote.campaignDiscount>0&&<div className="bm-cart-saving"><span>Aylık kampanya kazancınız</span><strong>{format(quote.campaignDiscount)}</strong></div>}{quote.basketDiscount>0&&<div className="bm-cart-saving"><span>{quote.discountReason}</span><strong>−{format(quote.basketDiscount)}</strong></div>}<div><span>PTT Kargo</span><strong>{quote.freeShipping?"BEDAVA":quote.shippingFee===null?"—":format(quote.shippingFee)}</strong></div>{shop.freeShippingThreshold>0&&!quote.freeShipping&&quote.subtotal!==null&&<div className="bm-free-shipping-hint">{format(shop.freeShippingThreshold)} ve üzeri net sepette kargo ücretsiz.</div>}<label className="bm-coupon">İndirim kuponu<input value={couponCode} maxLength={25} placeholder="Kupon kodunuz" onChange={e=>setCouponCode(e.target.value.toLocaleUpperCase("tr-TR"))}/>{couponCode&&<small>{couponChecking||verifiedQuote?.key!==quoteKey?"Kupon kontrol ediliyor...":quote.couponApplied?"Kupon uygulandı.":"Kupon geçersiz veya otomatik indirim daha avantajlı."}</small>}</label><div className="bm-cart-grand"><span>GENEL TOPLAM</span><strong>{total===null?"Fiyat sorunuz":format(total)}</strong></div><p>Sepet tutarı ve PTT kargo bedeli yönetici ayarlarına göre hesaplanır. Sipariş WhatsApp ile teyit edilir.</p><button data-track="checkout" className="bm-btn dark" type="button" onClick={()=>{track("checkout_started","checkout");setDrawer(false);setCheckout(true)}}>SİPARİŞ TALEBİ OLUŞTUR <Icon type="arrow"/></button></div>}</aside></div>}
  {checkout&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setCheckout(false)}/><section className="bm-checkout bm-modal" role="dialog" aria-modal="true" aria-label="Sipariş talebi"><button className="bm-close" onClick={()=>setCheckout(false)} type="button" aria-label="Kapat"><Icon type="x"/></button><span className="bm-overline">WHATSAPP İLE SİPARİŞ</span><h2>Sipariş talebiniz</h2><p>Bilgilerinizi girin. Talebiniz oluşturulduktan sonra WhatsApp&apos;a yönlendirileceksiniz. <strong>WhatsApp mesajını göndermeden sipariş kesinleşmez.</strong></p>{google&&<div className="bm-user-chip"><Icon type="check" size={17}/> Google ile giriş yapıldı: {google.email}</div>}<div className="bm-formgrid"><label>Ad Soyad *<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Adınız soyadınız"/></label><label>Telefon *<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label><label>E-posta<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} placeholder="ornek@gmail.com"/></label><label>Teslimat adresi (opsiyonel)<input value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="İl / ilçe / adres"/></label><label className="wide">Sipariş notu<textarea rows={3} value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Varsa özel talebiniz..."/></label></div><div className="bm-checkout-breakdown">{shopError&&<p className="bm-cart-load-error">Kargo ayarları yüklenemedi. Sipariş şu an oluşturulamaz.</p>}<div><span>Ürün tutarı</span><strong>{quote.subtotal===null?"Fiyat sorunuz":format(quote.subtotal)}</strong></div>{quote.basketDiscount>0&&<div><span>{quote.discountReason}</span><strong>−{format(quote.basketDiscount)}</strong></div>}<div><span>PTT kargo</span><strong>{quote.freeShipping?"ÜCRETSİZ":quote.shippingFee===null?"—":format(quote.shippingFee)}</strong></div><div className="bm-checkout-total"><span>Genel toplam</span><strong>{total===null?"Fiyat sorunuz":format(total)}</strong></div></div><p className="bm-privacy-note">Bilgileriniz sipariş görüşmesi için kullanılacaktır. Bu aşamada online ödeme alınmaz.</p>{error&&<div className="bm-form-error" role="alert">{error}</div>}<button data-track="send_order" className="bm-btn dark" type="button" disabled={sending||!shopLoaded||quote.total===null||couponChecking} onClick={sendOrder}>{sending?"HAZIRLANIYOR...":"WHATSAPP'A DEVAM ET"} <Icon type="arrow"/></button></section></div>}
 </div>
}
function ProductDetail({product:p,campaignPercent,onClose,onAdd}:{product:Product;campaignPercent:number;onClose:()=>void;onAdd:(weight:string)=>void}){
 const pictures=[p.image,...(p.images||[])].filter(Boolean);
 const [photo,setPhoto]=useState(pictures[0]||"");
 const [weight,setWeight]=useState("1000");
 const base=priceFor(p,weight);
 const original=weight==="5000"?undiscountedFiveKg(p):base;
 const price=base===null?null:roundMoney(base*(1-campaignPercent/100));
 const save=original!==null&&price!==null&&original>price?roundMoney(original-price):0;
 const stockAvailable=p.stock>0;
 return <section className="bm-detail bm-detail-v2 bm-modal" role="dialog" aria-modal="true" aria-label={p.name}>
  <button type="button" className="bm-close bm-detail-close" onClick={onClose} aria-label="Ürün ayrıntılarını kapat"><Icon type="x"/></button>
  <div className="bm-detail-gallery">
   <div className="bm-detail-main-photo"><SafeImage src={photo||p.image} alt={p.name}/>
    {p.badge&&<span className="bm-detail-photo-badge">{p.badge}</span>}
    {!stockAvailable&&<span className="bm-detail-photo-stock">STOKTA YOK</span>}
   </div>
   {pictures.length>1&&<div className="bm-detail-thumbnails">{pictures.map((picture,i)=><button key={i} type="button" className={(photo||pictures[0])===picture?"active":""} onClick={()=>setPhoto(picture)} aria-label={`${i+1}. fotoğrafı göster`} aria-pressed={(photo||pictures[0])===picture}><SafeImage src={picture} alt={`${p.name} - fotoğraf ${i+1}`}/></button>)}</div>}
   <div className="bm-detail-gallery-caption">BENLİ KURUYEMİŞ · ÖZENLE SEÇİLEN LEZZETLER</div>
  </div>
  <div className="bm-detail-copy bm-detail-content">
   <span className="bm-detail-kicker">BENLİ KURUYEMİŞ / {p.category.toLocaleUpperCase("tr-TR")}</span>
   <h2>{p.name}</h2>
   <div className="bm-detail-highlight-row">{p.badge&&<span className="bm-detail-highlight-badge">{p.badge}</span>}{p.origin&&<span>{p.origin}</span>}{stockAvailable?<span className="bm-detail-available">● Stokta</span>:<span className="bm-detail-unavailable">Stokta yok</span>}</div>
   {(p.cardNote||p.description)&&<p className="bm-detail-intro">{p.cardNote||p.description}</p>}
   {(p.origin||p.roasting)&&<div className="bm-detail-specs">{p.origin&&<div><span>MENŞEİ</span><strong>{p.origin}</strong></div>}{p.roasting&&<div><span>ÜRÜN TÜRÜ</span><strong>{p.roasting}</strong></div>}</div>}
   {(campaignPercent>0||(p.discount5kg||0)>0)&&<div className="bm-detail-offer-row">{campaignPercent>0&&<div><strong>AYLIK FIRSAT</strong> %{campaignPercent} kampanya indirimi</div>}{(p.discount5kg||0)>0&&<div><strong>5 KG AVANTAJI</strong> %{p.discount5kg} paket indirimi</div>}</div>}
   <div className="bm-detail-select-title"><h3>Gramaj seçin</h3><small>Fiyatlar seçiminize göre güncellenir.</small></div>
   <div className="bm-detail-weight-cards">{amounts.map(w=>{
    const pkg=priceFor(p,w);
    const paid=pkg===null?null:roundMoney(pkg*(1-campaignPercent/100));
    return <button type="button" key={w} aria-pressed={weight===w} className={`bm-detail-weight ${weight===w?"active":""}`} onClick={()=>setWeight(w)}>
     <span>{weightLabel(w)}</span><strong>{paid===null?"Fiyat sorunuz":format(paid)}</strong>{w==="5000"&&(p.discount5kg||0)>0&&<small>%{p.discount5kg} avantaj</small>}
    </button>
   })}</div>
   <div className="bm-detail-buy-row"><div className="bm-detail-buy-price"><span>SEÇİLEN PAKET · {weightLabel(weight)}</span>{save>0&&original!==null&&<del>{format(original)}</del>}<strong><Money price={price}/></strong>{save>0&&<small>{format(save)} avantaj</small>}</div><button type="button" disabled={!stockAvailable||price===null} className="bm-btn dark bm-detail-add" onClick={()=>onAdd(weight)}><Icon type="bag" size={19}/>{!stockAvailable?"STOKTA YOK":price===null?"FİYAT BEKLENİYOR":"SEPETE EKLE"}</button></div>
   {(p.description||p.ingredients||p.allergens||p.storageTip)&&<details className="bm-detail-more"><summary>Ürün hakkında detaylı bilgi <span>＋</span></summary>
      {p.description&&<div><h4>Ürün açıklaması</h4><p>{p.description}</p></div>}
      {p.ingredients&&<div><h4>İçindekiler</h4><p>{p.ingredients}</p></div>}
      {p.allergens&&<div><h4>Alerjenler</h4><p>{p.allergens}</p></div>}
      {p.storageTip&&<div><h4>Saklama önerisi</h4><p>{p.storageTip}</p></div>}
    </details>}
  </div>
 </section>
}

function ProductCard({p,add,showDetails,campaignPercent=0}:{p:Product;add:(id:string,weight:string)=>void;showDetails:(p:Product)=>void;campaignPercent?:number}){
 const [weight,setWeight]=useState("1000");
 const base=priceFor(p,weight);
 const price=base===null?null:roundMoney(base*(1-campaignPercent/100));
 const original=weight==="5000"?undiscountedFiveKg(p):base;
 const save=price!==null&&original!==null&&original>price?roundMoney(original-price):0;
 const available=p.stock>0;
 return <article className="bm-product bm-product-v2">
  <div className="bm-product-image bm-card-photo">
   <button data-track="product_open" type="button" className="bm-card-photo-btn" onClick={()=>showDetails(p)} aria-label={p.name+" ürününün ayrıntılarını aç"}><SafeImage src={p.image} alt={p.name}/><span className="bm-card-photo-overlay">Ürünü incele <Icon type="arrow" size={16}/></span></button>
   {p.badge&&<span className="bm-product-badge bm-badge-promo">{p.badge}</span>}
   {!p.badge&&p.featured&&<span className="bm-product-badge">ÖNE ÇIKAN</span>}
   {!available&&<span className="bm-outofstock">STOKTA YOK</span>}
   {campaignPercent>0&&<span className="bm-card-sale">-%{campaignPercent}</span>}
  </div>
  <div className="bm-product-body bm-card-info">
   <div className="bm-card-category"><span>{p.category}</span>{p.origin&&<small>{p.origin}</small>}</div>
   <button type="button" data-track="product_open" className="bm-product-title" onClick={()=>showDetails(p)}>{p.name}</button>
   {(p.cardNote||p.description)&&<p className="bm-card-subtitle">{p.cardNote||p.description}</p>}
   {(p.discount5kg||0)>0&&<div className="bm-card-deal" role="note">5 KG PAKETTE %{p.discount5kg} AVANTAJ</div>}
   <div className="bm-card-weight-label">PAKET SEÇİMİ</div>
   <div className="bm-packs bm-card-weights">{amounts.map(w=><button type="button" aria-pressed={weight===w} className={weight===w?"active":""} key={w} onClick={()=>setWeight(w)}>{weightLabel(w)}</button>)}</div>
   <div className="bm-card-checkout">
    <div className="bm-card-cost"><small>{weightLabel(weight)} fiyatı</small>{save>0&&original!==null&&<del>{format(original)}</del>}<strong><Money price={price}/></strong></div>
    <button type="button" className="bm-card-add" data-track="product_add" disabled={!available||price===null} onClick={()=>add(p.id,weight)}><Icon type="bag" size={17}/><span>{!available?"Tükendi":price===null?"Fiyat bekleniyor":"Sepete ekle"}</span></button>
   </div>
  </div>
 </article>
}
