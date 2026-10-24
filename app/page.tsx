"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { defaultProducts } from "@/lib/seed";
import { weightLabel,weightOptions,priceFor,undiscountedFiveKg,roundMoney,discountedProductPrice } from "@/lib/pricing";
import { defaultShopSettings,quoteCart,campaignActive } from "@/lib/shop";
import type { ShopSettings,CheckoutQuote } from "@/lib/shop";
import "./store.css";
import "./rev.css";
import "./hero-v3.css";
import "./hero-v4.css";
import "./colorful.css";
import "./cart-experience.css";
import ProductReviews,{RatingBadge} from "@/components/ProductReviews";
import DailyCouponOffer from "@/components/DailyCouponOffer";
import type {ReviewSummary} from "@/components/ProductReviews";
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
function CampaignCountdown({endDate}:{endDate:string}){
 const [remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{
  const end=new Date(endDate+"T23:59:59+03:00").getTime();
  const update=()=>setRemaining(Math.max(0,Math.floor((end-Date.now())/1000)));
  update();const timer=setInterval(update,1000);return()=>clearInterval(timer);
 },[endDate]);
 const pad=(n:number)=>String(n).padStart(2,"0");
 const days=remaining===null?"--":pad(Math.floor(remaining/86400));
 const hours=remaining===null?"--":pad(Math.floor((remaining%86400)/3600));
 const mins=remaining===null?"--":pad(Math.floor((remaining%3600)/60));
 const secs=remaining===null?"--":pad(remaining%60);
 return <div className="rev-offer-time" role="timer" aria-label="Kampanyanın bitmesine kalan süre"><span><strong>{days}</strong><small>GÜN</small></span><b>:</b><span><strong>{hours}</strong><small>SAAT</small></span><b>:</b><span><strong>{mins}</strong><small>DAKİKA</small></span><b>:</b><span><strong>{secs}</strong><small>SANİYE</small></span></div>
}
function Money({price}:{price:number|null}){return <>{price===null?"Fiyat sorunuz":format(price)}</>}
function InfoTitle({eyebrow,title,sub}:{eyebrow:string;title:React.ReactNode;sub?:string}){return <div className="bm-heading"><span>{eyebrow}</span><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>}

/** Tutar hesaplamasını yalnızca sunucuyla aynı sepet teklifinden yapar. */
function ShippingProgress({shop,quote,compact=false}:{shop:ShopSettings;quote:CheckoutQuote;compact?:boolean}){
 if(quote.items.length===0)return null;
 const net=quote.subtotal===null?null:Math.max(0,roundMoney(quote.subtotal-quote.basketDiscount));
 const threshold=shop.freeShippingThreshold;
 const progress=threshold>0&&net!==null?Math.min(100,Math.round(net/threshold*100)):0;
 const remaining=net===null?null:Math.max(0,roundMoney(threshold-net));
 const free=net!==null&&(shop.shippingFee===0||(threshold>0&&remaining===0));
 if(threshold<=0){
  return <div className={`bx-ship-progress ${compact?"compact":""} ${shop.shippingFee===0?"complete":""}`}>
   <span className="bx-ship-icon"><Icon type="truck" size={compact?16:20}/></span>
   <span className="bx-ship-info"><strong>{shop.shippingFee===0?"Kargon ücretsiz!":"PTT kargo ücreti"}</strong><small>{shop.shippingFee===0?"Bu siparişte kargo bedava.":format(shop.shippingFee)+" · Sepette hesaplandı"}</small></span>
  </div>
 }
 return <div className={`bx-ship-progress ${compact?"compact":""} ${free?"complete":""}`}>
  <span className="bx-ship-icon"><Icon type={free?"check":"truck"} size={compact?17:22}/></span>
  <div className="bx-ship-progress-main">
   <strong>{net===null?"Kargo bedeli hesaplanıyor":free?"Harika! Kargon ücretsiz!":<>{format(remaining!)} daha alışveriş yap, <em>kargo bedava!</em></>}</strong>
   {!compact&&<small>{free?"Kargo ücretini biz karşılıyoruz.":"Ücretsiz kargo sınırı: "+format(threshold)}</small>}
   <div className="bx-ship-meter" role="progressbar" aria-label="Ücretsiz kargo ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:progress+"%"}}/></div>
  </div>
  {!compact&&<span className="bx-ship-percentage">{progress}%</span>}
 </div>
}
function AddToCartCelebration({name}:{name:string}){
 return <div className="bx-added-celebration" role="status" aria-live="polite">
  <div className="bx-celebration-particles" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>
  <div className="bx-gift" aria-hidden="true"><span className="bx-gift-bow">✦</span><span className="bx-gift-lid"/><span className="bx-gift-box"/></div>
  <div className="bx-celebration-text"><strong>Sepete eklendi!</strong><span>{name}</span><small>Bir avuç keyif daha ✳</small></div>
 </div>
}
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
 const [reviewsSummary,setReviewsSummary]=useState<Record<string,ReviewSummary>>({});
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
 const [giftPop,setGiftPop]=useState<{id:number;name:string}|null>(null);

 useEffect(()=>{
  fetch("/api/products",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Ürünler yüklenemedi.");if(!Array.isArray(d.products))throw Error("Ürün listesi alınamadı.");setProducts(d.products);}).catch(e=>setProductsError(e instanceof Error?e.message:"Ürünler yüklenemedi.")).finally(()=>setProductsLoaded(true));
  fetch("/api/shop",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Mağaza ayarları okunamadı.");setShop(d.settings)}).then(()=>setShopLoaded(true)).catch(()=>setShopError(true));
  fetch("/api/google/session",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.user){setGoogle(d.user);setCustomer(s=>({...s,email:d.user.email,name:d.user.name}));}}).catch(()=>{});
  try{const saved=JSON.parse(localStorage.getItem("benli-cart")||"[]");if(Array.isArray(saved))setCart(saved.filter((x:any)=>x&&typeof x.productId==="string"&&amounts.includes(String(x.weight) as typeof amounts[number])&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<100));}catch{}
  setLoaded(true);
 },[]);
 useEffect(()=>{if(loaded)localStorage.setItem("benli-cart",JSON.stringify(cart))},[cart,loaded]);
 useEffect(()=>{
  const refresh=()=>{fetch("/api/reviews",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>setReviewsSummary(d.summaries||{})).catch(()=>{})};
  refresh();
  window.addEventListener("benli:reviews-updated",refresh);
  return()=>window.removeEventListener("benli:reviews-updated",refresh);
 },[]);
 useEffect(()=>{
  if(!loaded||!shopLoaded)return;
  const wantsCheckout=new URLSearchParams(window.location.search).get("checkout")==="1";
  if(wantsCheckout){if(cart.length)setCheckout(true);else setNotice("Sepetiniz boş. Önce ürün ekleyin.");window.history.replaceState(null,"","/");}
 },[loaded,shopLoaded]);
 useEffect(()=>{if(!loaded)return;const code=localStorage.getItem("benli-coupon");if(code)setCouponCode(code)},[loaded]);
 useEffect(()=>{if(loaded)localStorage.setItem("benli-coupon",couponCode)},[couponCode,loaded]);

 useEffect(()=>{document.body.style.overflow=(drawer||detail||checkout)?"hidden":"";return()=>{document.body.style.overflow=""}},[drawer,detail,checkout]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(""),3000);return()=>clearTimeout(t)},[notice]);
 useEffect(()=>{if(!giftPop)return;const t=setTimeout(()=>setGiftPop(null),2100);return()=>clearTimeout(t)},[giftPop]);
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
 const expanded=cart.map(l=>{const p=products.find(x=>x.id===l.productId);const item=quote.items.find(q=>q.productId===l.productId&&q.weight===l.weight);return p?{...l,p,unit:item?.unitPrice??null,originalUnit:item?.originalUnitPrice??item?.unitPrice??null,discountType:item?.discountType??null,discountAmount:item?.discountAmount??0}:null}).filter((x):x is NonNullable<typeof x>=>x!==null);
 const recommendations=useMemo(()=>{
  const inCart=new Set(cart.map(l=>l.productId));
  const alreadyCategories=new Set(products.filter(p=>inCart.has(p.id)).map(p=>p.category));
  return products.filter(p=>p.active&&p.stock>0&&!inCart.has(p.id)&&priceFor(p,"1000")!==null)
   .sort((a,b)=>Number(!alreadyCategories.has(b.category))-Number(!alreadyCategories.has(a.category))||Number(b.featured)-Number(a.featured)||a.name.localeCompare(b.name,"tr"))
   .slice(0,5);
 },[products,cart]);
  const total=quote.total;
 const activeCampaign=campaignActive(shop)?shop.campaign:null;
 const campaignProducts=activeCampaign?products.filter(p=>p.active&&activeCampaign.productIds.includes(p.id)):[];
 function add(id:string,weight:string){
  const p=products.find(x=>x.id===id);
  if(!p||!p.active||p.stock<1){setNotice("Bu ürün stokta bulunmuyor.");return}
  const inCart=cart.filter(l=>l.productId===id).reduce((n,l)=>n+l.qty,0);
  if(inCart>=p.stock){setNotice(p.name+" için stok sınırına ulaştınız.");return}
  setCart(lines=>{const exists=lines.find(x=>x.productId===id&&x.weight===weight);return exists?lines.map(x=>x===exists?{...x,qty:Math.min(99,x.qty+1)}:x):[...lines,{productId:id,weight,qty:1}]});
  track("add_to_cart",p.slug);setNotice("Ürün sepete eklendi");setGiftPop(previous=>({id:(previous?.id||0)+1,name:p.name}));
 }
 function changeQty(id:string,weight:string,by:number){
  const p=products.find(x=>x.id===id);
  if(by>0&&cart.filter(x=>x.productId===id).reduce((n,l)=>n+l.qty,0)>=(p?.stock||0)){setNotice((p?.name||"Ürün")+" için stok sınırına ulaştınız.");return}
  setCart(lines=>lines.map(l=>l.productId===id&&l.weight===weight?{...l,qty:Math.max(0,Math.min(99,l.qty+by))}:l).filter(l=>l.qty>0));
 }
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
   if(!resp.ok){if(resp.status===409){fetch("/api/products",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(Array.isArray(d.products))setProducts(d.products)}).catch(()=>{})}throw Error(result.error||"Sipariş talebi oluşturulamadı.");}
   const serverQuote=result.quote as typeof quote;
   const lineText=serverQuote.items.map((line,i)=>`${i+1}) ${line.name} — ${weightLabel(line.weight)} x ${line.qty} — ${line.originalUnitPrice===null||line.originalUnitPrice===undefined?"Fiyat sorulacak":format(roundMoney(line.originalUnitPrice*line.qty))}`).join("\n");
   const message=`Merhaba Benli Kuruyemiş, ürünler için sipariş talebi göndermek istiyorum.\n\nTalep No: ${result.orderId}\n${lineText}\n\n${serverQuote.packageDiscount+serverQuote.campaignDiscount+serverQuote.basketDiscount>0?"Ürünlerin indirimsiz toplamı":"Ürünler toplamı"}: ${serverQuote.originalSubtotal===null?"Fiyat teyidi gerekli":format(serverQuote.originalSubtotal)}\n${serverQuote.packageDiscount>0?"5 kg paket indirimi: -"+format(serverQuote.packageDiscount)+"\n":""}${serverQuote.campaignDiscount>0?"Aylık kampanya indirimi: -"+format(serverQuote.campaignDiscount)+"\n":""}${serverQuote.basketDiscount>0?"Sepet/kupon indirimi: -"+format(serverQuote.basketDiscount)+"\n":""}${serverQuote.packageDiscount+serverQuote.campaignDiscount+serverQuote.basketDiscount>0?"İndirim sonrası ürün tutarı":"Ürünler toplamı"}: ${serverQuote.subtotal===null?"Fiyat teyidi gerekli":format(roundMoney(serverQuote.subtotal-serverQuote.basketDiscount))}\nPTT kargo: ${serverQuote.freeShipping?"ÜCRETSİZ":format(serverQuote.shippingFee||0)}\nGENEL TOPLAM: ${serverQuote.total===null?"Fiyat teyidi gerekli":format(serverQuote.total)}\n\nAd Soyad: ${customer.name}\nTelefon: ${customer.phone}\n${customer.address?"Adres: "+customer.address+"\n":""}${customer.note?"Not: "+customer.note+"\n":""}Lütfen siparişimi ve ödeme koşullarını teyit edin.`;
   track("order_requested","checkout");
   const url="https://wa.me/"+PHONE+"?text="+encodeURIComponent(message);
   track("whatsapp_click","checkout");
   window.location.href=url;
  }catch(e){setError(e instanceof Error?e.message:"Talep oluşturulamadı");setSending(false)}
 }

 return <div className="bm rev" id="sayfa-basi">
  <div className="rev-announcement"><span>✦</span> BENLİ KURUYEMİŞ <i/> SEVDİĞİN LEZZETLER, BİRLİKTE <span>✦</span><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">SİPARİŞ DESTEĞİ <Icon type="arrow" size={14}/></a></div>
  <header className="rev-header">
   <div className="rev-header-main">
    <Logo/>
    <nav className="rev-desktop-links" aria-label="Ana menü"><a href="#urunler">Ürünler</a><a href="#koleksiyon">Koleksiyon</a><a href="#nasil-calisir">Nasıl sipariş verilir?</a><a href="#hakkimizda">Hakkımızda</a></nav>
    <div className="rev-header-actions">
     <button type="button" className="rev-icon-button rev-search-toggle" aria-label="Ürün arama alanına git" onClick={()=>document.getElementById("rev-search")?.focus()}><Icon type="search" size={21}/></button>
     <a className="rev-login" href="/giris"><Icon type="user" size={19}/><span>{google?google.name.split(" ")[0]:"Giriş"}</span></a>
     <button type="button" className="rev-basket-button" data-track="cart_open" onClick={()=>window.location.assign("/sepet")}><Icon type="bag" size={20}/> <span>Sepetim</span><b>{count}</b></button>
     <button type="button" className="rev-menu-button" aria-label={menu?"Menüyü kapat":"Menüyü aç"} aria-expanded={menu} onClick={()=>setMenu(v=>!v)}><Icon type={menu?"x":"menu"} size={24}/></button>
    </div>
   </div>
   <div className="rev-search-row"><div className="rev-search-box" ref={searchRef}>
    <div className="rev-search-input-wrap"><Icon type="search" size={21}/><input id="rev-search" value={search} autoComplete="off" type="search" onFocus={()=>{setSearchOpen(true);setSearchIndex(0)}} onChange={e=>{setSearch(e.target.value);setSearchIndex(0);setSearchOpen(true);if(e.target.value.trim())track("search","search")}} onKeyDown={onSearchKeyDown} placeholder="Bugün ne canınız çekiyor? Kaju, fıstık, hurma..." aria-label="Ürün ara" aria-controls="rev-search-results" aria-expanded={searchOpen}/>{search&&<button type="button" className="rev-clear-search" aria-label="Aramayı sil" onClick={()=>{setSearch("");setSearchOpen(true)}}>×</button>}<button type="button" className="rev-search-submit" onClick={()=>{setSearchOpen(false);document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}}>ARA <Icon type="arrow" size={16}/></button></div>
    {searchOpen&&<div className="rev-search-dropdown" id="rev-search-results" role="region" aria-label="Arama sonuçları"><div className="rev-search-dropdown-top"><strong>{search.trim()?"ARAMA SONUÇLARI":"BU ÜRÜNLERE BAKIN"}</strong><span>{suggestions.length} sonuç</span></div>{!productsLoaded?<div className="rev-search-empty">Ürünler hazırlanıyor...</div>:productsError?<div className="rev-search-empty">Ürünler şu anda görüntülenemiyor.</div>:suggestions.length?suggestions.map((p,i)=><button key={p.id} type="button" className={"rev-search-hit "+(i===searchIndex?"active":"")} onClick={()=>selectSearchProduct(p)}><SafeImage src={p.image} alt={p.name}/><span><b>{p.name}</b><small>{p.category} · 1 kg</small></span><strong>{priceFor(p,"1000")===null?"Fiyat sorunuz":format(priceFor(p,"1000")!)}</strong><Icon type="arrow" size={16}/></button>):<div className="rev-search-empty">Bu arama için ürün bulunamadı.</div>}{suggestions.length>0&&<button type="button" className="rev-search-all" onClick={()=>{setSearchOpen(false);document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}}>TÜM ÜRÜNLERE GİT <Icon type="arrow" size={15}/></button>}</div>}
   </div><div className="rev-search-note">KOLAY SİPARİŞ <span>·</span> İLK SEÇİM 1 KG <span>·</span> PTT KARGO</div></div>
   {menu&&<nav className="rev-mobile-links" aria-label="Mobil menü"><a onClick={()=>setMenu(false)} href="#urunler">Ürünlerimiz <Icon type="arrow" size={17}/></a><a onClick={()=>setMenu(false)} href="#koleksiyon">Koleksiyon <Icon type="arrow" size={17}/></a><a onClick={()=>setMenu(false)} href="#nasil-calisir">Nasıl alışveriş yapılır? <Icon type="arrow" size={17}/></a><a onClick={()=>setMenu(false)} href="#hakkimizda">Hakkımızda <Icon type="arrow" size={17}/></a><a onClick={()=>setMenu(false)} href="/giris">Giriş yap <Icon type="arrow" size={17}/></a></nav>}
  </header>
  <main>
   <DailyCouponOffer coupon={shop.coupon} variant="home" onApply={()=>{try{localStorage.setItem("benli-coupon",shop.coupon.code)}catch{}window.location.assign("/sepet")}}/>
   <section className="bn-hero" aria-label="Benli Kuruyemiş ana vitrin">
     <div className="bn-hero-backdrop"><SafeImage src="https://images.pexels.com/photos/36285399/pexels-photo-36285399.jpeg?auto=compress&cs=tinysrgb&w=1800" alt="Ahşap kaselerde kuruyemiş çeşitleri" priority/></div>
     <div className="bn-hero-shade" aria-hidden="true"/>
     <div className="bn-hero-content">
       <div className="bn-hero-label"><span className="bn-hero-label-star">✦</span> BENLİ KURUYEMİŞ <span className="bn-hero-label-line"/> HER AVUÇTA KEYİF</div>
       <h1>Çıtır bir<br/><em>mutluluk</em><br/>molası<span>.</span></h1>
       <p>Fıstık, kaju, fındık ve daha fazlası. Sevdiğin kuruyemişi seç, gramajını belirle, keyfine bak.</p>
       <div className="bn-hero-buttons">
         <a href="#urunler" data-track="hero_products" className="bn-hero-cta">ALIŞVERİŞE BAŞLA <Icon type="arrow" size={21}/></a>
         <a href="#firsatlar" className="bn-hero-cta-secondary"><span className="bn-hero-cta-secondary-icon"><Icon type="up" size={16}/></span> Öne çıkanları keşfet</a>
       </div>
       <div className="bn-hero-trust"><span><Icon type="check" size={16}/> 1 kg seçili fiyat</span><i/><span><Icon type="package" size={17}/> 4 gramaj seçeneği</span><i/><span><Icon type="truck" size={18}/> PTT Kargo</span></div>
     </div>
     <div className="bn-hero-feature">
       <div className="bn-hero-feature-top"><span><b/> VİTRİNDEN SEÇTİK</span><small>{productsLoaded?String(products.filter(p=>p.active).length).padStart(2,"0")+" ÜRÜN":"BENLİ SEÇKİSİ"}</small></div>
       {spotlight&&<><button type="button" className="bn-hero-feature-body" onClick={()=>openDetail(spotlight)}>
         <span className="bn-hero-feature-thumb"><SafeImage src={spotlight.image} alt={spotlight.name}/></span>
         <span className="bn-hero-feature-detail"><small>{spotlight.category.toLocaleUpperCase("tr-TR")}</small><strong>{spotlight.name}</strong><span>1 KG · {priceFor(spotlight,"1000")===null?"Fiyat bilgisi için incele":format(priceFor(spotlight,"1000")!)}</span></span>
         <Icon type="arrow" size={19}/>
       </button>
       <div className="bn-hero-feature-foot"><span>ŞİMDİ SEPETİNE EKLE</span><button type="button" onClick={()=>add(spotlight.id,"1000")} disabled={spotlight.stock<1||priceFor(spotlight,"1000")===null}><Icon type="bag" size={18}/> 1 KG EKLE</button></div></>}
     </div>
     {activeCampaign&&activeCampaign.percent>0&&<a href="#firsatlar" className="bn-hero-live-campaign"><span>BU AYA ÖZEL</span><strong>%{activeCampaign.percent}</strong><small>SEÇİLİ ÜRÜNLERDE</small></a>}
     <div className="bn-hero-bottomline"><span>BENLİ / TAZE BİR ALIŞVERİŞ DENEYİMİ</span><span className="bn-hero-bottomline-scroll">AŞAĞI KAYDIR <span>↓</span></span></div>
   </section>
   <div className="rev-marquee" aria-hidden="true"><div className="rev-marquee-track">{Array.from({length:2}).map((_,i)=><span key={i}>ANTEP FISTIĞI <b>✳</b> KAJU <b>✳</b> FINDIK <b>✳</b> KURU MEYVE <b>✳</b> KARIŞIK ÇEREZ <b>✳</b> BİR AVUÇ KEYİF <b>✳</b> </span>)}</div></div>
   <div className="rev-advantages"><div><span className="rev-adv-icon"><Icon type="package" size={22}/></span><div><strong>DİLEDİĞİNİZ GRAMAJ</strong><small>250 g, 500 g, 1 kg ve 5 kg seçenekleri</small></div></div><div><span className="rev-adv-icon"><Icon type="truck" size={24}/></span><div><strong>PTT KARGO</strong><small>Kargo ücreti sepette hesaplanır</small></div></div><div><span className="rev-adv-icon"><Icon type="chat" size={23}/></span><div><strong>WHATSAPP İLE TAMAMLA</strong><small>Siparişinizi mesajla teyit edin</small></div></div></div>
   <section className="bn-flavor-nav" aria-label="Hızlı kategori keşfi"><div className="bn-flavor-heading"><span>NEYE KEYFİN VAR?</span><strong>Bir tıkla lezzete git <Icon type="arrow" size={17}/></strong></div><div className="bn-flavor-pills"><button type="button" className="bn-flavor-pill bn-flavor-all" onClick={()=>chooseCategory("Tümü")}><span className="bn-flavor-all-icon">✳</span><span>Hepsine bak</span><Icon type="arrow" size={17}/></button>{categoryTiles.map((tile,i)=><button type="button" key={tile.name} className={"bn-flavor-pill bn-flavor-"+(i%5)} onClick={()=>chooseCategory(tile.name)}><span className="bn-flavor-img"><SafeImage src={tile.photo} alt=""/></span><span>{tile.name}</span><Icon type="arrow" size={16}/></button>)}</div></section>
   <section className="rev-offer-zone" id="firsatlar">
    <div className="rev-offer-topline"><span><i/> {activeCampaign?"BENLİ’NİN KAMPANYASI":"BENLİ’NİN SEÇKİSİ"}</span><a href="#urunler">TÜM LEZZETLERE BAK <Icon type="arrow" size={16}/></a></div>
    <div className="rev-offer-body">
      <div className="rev-offer-intro">
        <span className="rev-offer-eyebrow">{activeCampaign?(activeCampaign.eyebrow||"AYIN KAMPANYASI"):"BU AY BENLİ'DE"}</span>
        <h2>{activeCampaign?(activeCampaign.title||"Bu ayın fırsatları") : <>Lezzet dolu<br/><em>seçimler!</em></>}</h2>
        <p>{activeCampaign?(activeCampaign.subtitle||"Bu aya özel ürünlerimizi keşfedin."):"Sevdiğin lezzetleri bir arada keşfet. Buradaki ürünleri doğrudan sepetine ekleyebilirsin."}</p>
        {activeCampaign?<div className="rev-offer-clock"><span>KAMPANYA BİTİŞİNE KALAN</span><CampaignCountdown endDate={activeCampaign.endDate}/></div>:<div className="rev-offer-bubble"><span>✳</span><strong>İlk seçiminiz<br/>her zaman 1 kg!</strong></div>}
        <a className="rev-offer-link" href={activeCampaign&&campaignProducts.length?"#kampanyali-urunler":"#urunler"}>{activeCampaign?"KAMPANYALI ÜRÜNLERE GİT":"ÜRÜNLERE GÖZ AT"} <Icon type="arrow" size={17}/></a>
      </div>
      <div className="rev-offer-cards">
        {(activeCampaign&&campaignProducts.length?campaignProducts:featuredProducts).slice(0,3).map((p,i)=>{
          const isDeal=Boolean(activeCampaign&&activeCampaign.productIds.includes(p.id)&&activeCampaign.percent>0);
          const full=priceFor(p,"1000");
          const sale=full===null?null:Math.round(full*(1-(isDeal?activeCampaign!.percent:0)/100)*100)/100;
          return <article className="rev-offer-card" key={p.id}>
            <div className="rev-offer-photo"><button type="button" onClick={()=>openDetail(p)} aria-label={p.name+" ayrıntılarını görüntüle"}><SafeImage src={p.image} alt={p.name}/></button><span className="rev-offer-badge">{isDeal?"%"+activeCampaign!.percent+" FIRSAT":"BENLİ SEÇKİSİ"}</span></div>
            <div className="rev-offer-card-info"><span className="rev-offer-card-category">{p.category.toLocaleUpperCase("tr-TR")}</span><button type="button" onClick={()=>openDetail(p)} className="rev-offer-card-name">{p.name}</button><div className="rev-offer-card-bottom"><div><small>1 KG FİYATI</small>{isDeal&&full!==null&&<del>{format(full)}</del>}<strong>{sale===null?"Fiyat sorunuz":format(sale)}</strong></div><button className="rev-offer-add" type="button" onClick={()=>add(p.id,"1000")} disabled={p.stock<1||sale===null} aria-label={p.name+" 1 kg sepete ekle"}><Icon type="bag" size={18}/></button></div></div>
          </article>;
        })}
      </div>
    </div>
    <div className="rev-offer-footer"><span>✳ HER LEZZET BİR MOLAYA DEĞER.</span><span>SEÇ · SEPETE EKLE · WHATSAPP'TA TAMAMLA</span></div>
   </section>
   <section className="rev-discover" id="koleksiyon"><div className="rev-section-header"><div><span className="rev-kicker">✳  BENLİ KOLEKSİYONU  /  01</span><h2>Canın ne <em>çekti?</em></h2><p>Birini seçmek zor. Biz de seçmenizi kolaylaştıralım dedik.</p></div><a href="#urunler" className="rev-text-link">TÜM ÜRÜNLER <Icon type="arrow" size={20}/></a></div><div className="rev-discover-grid">{featuredProducts.slice(0,3).map((p,i)=><button key={p.id} type="button" className={"rev-discover-card rev-discover-"+i} onClick={()=>openDetail(p)}><div className="rev-discover-picture"><SafeImage src={p.image} alt={p.name}/></div><span className="rev-discover-number">0{i+1}</span><span className="rev-discover-copy"><small>{p.category.toLocaleUpperCase("tr-TR")}</small><strong>{p.name}</strong><span>{priceFor(p,"1000")!==null?format(priceFor(p,"1000")!)+" / 1 kg":"Fiyatı incele"} <Icon type="arrow" size={16}/></span></span></button>)}</div></section>

   {activeCampaign&&campaignProducts.length>0&&<section id="kampanyali-urunler" className="rev-campaign-products"><div className="rev-section-header"><div><span className="rev-kicker">BU AYA ÖZEL</span><h2>Kampanyalı <em>lezzetler.</em></h2></div></div><div className="rev-product-grid">{campaignProducts.slice(0,3).map(p=><ProductCard key={p.id} p={p} summary={reviewsSummary[p.id]} campaignPercent={activeCampaign.percent} add={add} showDetails={openDetail}/>)}</div></section>}
   {featuredProducts.length>=2&&<section className="bn-pair" aria-label="Günün lezzet eşleşmesi">
    <div className="bn-pair-intro"><span className="bn-small-kicker">✺ BENLİ İKİLİSİ</span><h2>Birini seçmek<br/><em>zorunda değilsin!</em></h2><p>İki ayrı lezzet, iki ayrı keyif. İstersen favorilerini tek tek sepete ekle.</p><a href="#urunler" className="bn-pair-link">DAHA FAZLA LEZZET KEŞFET <Icon type="arrow" size={18}/></a></div>
    <div className="bn-pair-items">{featuredProducts.slice(0,2).map((p,i)=><article key={p.id} className={"bn-pair-item bn-pair-item-"+i}><button className="bn-pair-image" type="button" onClick={()=>openDetail(p)} aria-label={p.name+" detaylarını incele"}><SafeImage src={p.image} alt={p.name}/></button><span className="bn-pair-category">{p.category}</span><h3>{p.name}</h3><p>1 kg · {priceFor(p,"1000")!==null?format(priceFor(p,"1000")!):"Fiyat bilgisi için inceleyin"}</p><button type="button" className="bn-pair-add" onClick={()=>add(p.id,"1000")} disabled={p.stock<1||priceFor(p,"1000")===null}>SEPETE EKLE <Icon type="bag" size={17}/></button></article>)}</div>
   </section>}
   <section className="rev-products-section" id="urunler"><div className="rev-section-header rev-shop-title"><div><span className="rev-kicker">✳  MAĞAZAMIZ  /  02</span><h2>Birini seç. <em>Keyfine bak.</em></h2><p>Fiyatlar ilk olarak <b>1 kg</b> için gösterilir. Dilerseniz gramajı anında değiştirebilirsiniz.</p></div><div className="rev-product-count"><strong>{productsLoaded?show.length:"—"}</strong><span>ÜRÜN</span></div></div>
    <div className="rev-controls"><div className="rev-category-chips">{catalogCategories.map(cat=><button key={cat} type="button" data-track="category_filter" onClick={()=>{setCategory(cat);track("category_view",cat)}} className={category===cat?"active":""}>{cat}</button>)}</div><label className="rev-sort-label"><span>SIRALA</span><select value={sortMode} onChange={e=>setSortMode(e.target.value as typeof sortMode)} aria-label="Ürünleri sırala"><option value="featured">Önerilen</option><option value="priceLow">Fiyat: artan</option><option value="priceHigh">Fiyat: azalan</option><option value="name">İsme göre</option></select></label></div>
    {!productsLoaded?<div className="rev-state">Ürünler hazırlanıyor...</div>:productsError?<div className="rev-state rev-state-error">Ürünler yüklenemedi. <button onClick={()=>window.location.reload()} type="button">Tekrar dene</button></div>:sortedShow.length===0?<div className="rev-state">Bu kategoride eşleşen ürün bulunamadı. <button type="button" onClick={()=>{setCategory("Tümü");setSearch("")}}>Tüm ürünleri göster</button></div>:<div className="rev-product-grid">{sortedShow.map(p=><ProductCard key={p.id} p={p} summary={reviewsSummary[p.id]} campaignPercent={activeCampaign?.productIds.includes(p.id)?activeCampaign.percent:0} add={add} showDetails={openDetail}/>)}</div>}
   </section>
   {products.some(p=>p.active&&priceFor(p,"5000")!==null)&&<section className="bn-bulk-promo" aria-label="Büyük paket seçenekleri">
     <div className="bn-bulk-left"><span className="bn-small-kicker">✳  SOFRALAR KALABALIKSA</span><h2>Keyfin<br/><em>5 katı!</em></h2><p>Favori kuruyemişlerini 5 kg paket seçeneğiyle de alabilirsin. İstediğin paketi seç; fiyatlar seçimine göre güncellensin.</p><a href="#urunler" className="bn-bulk-link">TÜM GRAMAJLARI İNCELE <Icon type="arrow" size={18}/></a></div>
     {products.filter(p=>p.active&&p.stock>0&&priceFor(p,"5000")!==null).slice(0,2).map((p,i)=><article key={p.id} className={"bn-bulk-card bn-bulk-card-"+i}><button type="button" className="bn-bulk-photo" onClick={()=>openDetail(p)}><SafeImage src={p.image} alt={p.name}/></button><div className="bn-bulk-card-text"><small>5 KG PAKET</small><strong>{p.name}</strong><span>{format(priceFor(p,"5000")!)}</span>{(p.discount5kg||0)>0&&<em>%{p.discount5kg} paket avantajı</em>}<button type="button" onClick={()=>add(p.id,"5000")} disabled={p.stock<1}><Icon type="bag" size={17}/> 5 KG EKLE</button></div></article>)}
    </section>}
   {categoryTiles.length>0&&<section className="rev-categories" id="kategoriler"><div className="rev-section-header"><div><span className="rev-kicker">✳  KATEGORİLER  /  03</span><h2>Her damak tadına <em>bir şey var.</em></h2></div></div><div className="rev-category-grid">{categoryTiles.map((item,i)=><button key={item.name} type="button" onClick={()=>chooseCategory(item.name)} className={"rev-category-tile rev-category-tile-"+i}><SafeImage src={item.photo} alt={item.name}/><span className="rev-category-inner"><small>{item.count} ÜRÜN / {item.note}</small><strong>{item.name}</strong><em><Icon type="up" size={21}/></em></span></button>)}</div></section>}
   <section className="rev-how" id="nasil-calisir"><div className="rev-section-header"><div><span className="rev-kicker">✳  ÇOK KOLAY  /  04</span><h2>Üç adımda <em>bir avuç keyif.</em></h2><p>Farklı siteler, uzun işlemler yok. Sevdiğiniz lezzeti seçin, bizden haber bekleyin.</p></div></div><div className="rev-how-grid"><div><span>01</span><Icon type="search" size={28}/><h3>Lezzetini seç</h3><p>Ürünlere göz atın, dilediğinizi sepete ekleyin.</p></div><div><span>02</span><Icon type="bag" size={28}/><h3>Gramajını belirle</h3><p>İlk seçim 1 kg. İsterseniz paketi değiştirin.</p></div><div><span>03</span><Icon type="chat" size={28}/><h3>WhatsApp'ta tamamla</h3><p>Sipariş talebinizi gönderin, ayrıntıları birlikte teyit edelim.</p></div></div></section>
   <section className="bn-joy-banner"><span className="bn-joy-illustration" aria-hidden="true">✳</span><div><span>ÇAY HAZIRSA...</span><h2>Çerez de <em>hazır olsun!</em></h2><p>Çayın yanına, film gecesine, misafir sofrasına. Canın ne istiyorsa burada.</p></div><a href="#urunler">KEYFİNE GÖRE SEÇ <Icon type="arrow" size={23}/></a><span className="bn-joy-illustration last" aria-hidden="true">✳</span></section>
   <section className="rev-about" id="hakkimizda"><div className="rev-about-art"><SafeImage src={products.find(p=>p.name.toLocaleLowerCase("tr-TR").includes("kaju"))?.image||products[0]?.image||img} alt="Benli Kuruyemiş lezzetleri"/><span>BİR AVUÇ MUTLULUK ✳</span></div><div className="rev-about-copy"><span className="rev-kicker">✳  BİZ KİMİZ?</span><h2>Lezzeti tanıyoruz.<br/><em>Seçmeyi seviyoruz.</em></h2><p>Benli Kuruyemiş olarak kuruyemiş ticaretindeki deneyimimizi dijital mağazamıza taşıyoruz. Sevilen çeşitleri bir araya getiriyor, siparişinizi kolayca oluşturmanızı sağlıyoruz.</p><div className="rev-about-points"><div><Icon type="check" size={18}/> Seçilebilir paket gramajları</div><div><Icon type="check" size={18}/> Kolay WhatsApp siparişi</div><div><Icon type="check" size={18}/> Sepette görüntülenen kargo tutarı</div></div><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer" className="rev-button rev-button-dark">BİZE YAZIN <Icon type="up" size={18}/></a></div></section>
   <section className="rev-contact-banner"><div><span className="rev-kicker">İŞLETMELERE ÖZEL</span><h2>Toptan mı lazım?<br/><em>Konuşalım.</em></h2><p>İşletmeniz için kuruyemiş alımlarında teklif almak isterseniz bize yazabilirsiniz.</p></div><a href="https://wa.me/905515550302?text=Merhaba%2C%20toptan%20kuruyemi%C5%9F%20i%C3%A7in%20fiyat%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer" className="rev-button rev-button-light">TEKLİF AL <Icon type="up" size={18}/></a></section>
  </main>
  <footer className="rev-footer"><div className="rev-footer-top"><div className="rev-footer-brand"><Logo/><p>Bir avuç iyi şey.<br/>Bolca keyif.</p></div><div><strong>MAĞAZA</strong><a href="#urunler">Tüm ürünler</a><a href="#koleksiyon">Koleksiyon</a><a href="#kategoriler">Kategoriler</a><a href="#nasil-calisir">Sipariş rehberi</a></div><div><strong>İLETİŞİM</strong><a href="tel:+905515550302">0551 555 03 02</a><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">WhatsApp ↗</a><a href="/giris">Müşteri girişi</a></div><div className="rev-footer-cta"><span>KEYFİNİZ YERİNDE OLSUN.</span><a href="#urunler">Bir avuç mutluluk seç. <Icon type="arrow" size={22}/></a></div></div><div className="rev-footer-bottom"><span>© {new Date().getFullYear()} BENLİ KURUYEMİŞ · TÜM HAKLARI SAKLIDIR</span><div><span>Ödeme ve sipariş ayrıntıları WhatsApp üzerinden teyit edilir.</span><a href="/cerez-politikasi">Gizlilik & çerezler</a><button type="button" onClick={()=>window.dispatchEvent(new Event("benli:cookie-settings"))}>Çerez ayarları</button><a href="/admin">Yönetim</a></div></div></footer>
  {count>0&&!drawer&&!checkout&&!detail&&<aside key="floating-cart" className="bn-cart-float bx-float" aria-label="Sepet ve kargo özeti">
   <span className="bn-cart-float-icon bx-float-icon"><Icon type="bag" size={22}/><b>{count}</b></span>
   <div className="bx-float-copy"><strong>{quote.freeShipping||shop.shippingFee===0?"Kargo ücretsiz!":"Sepetin büyüyor!"}</strong><small>{quote.total===null?"Fiyat hesaplanıyor":format(quote.total)} · {count} paket</small><ShippingProgress shop={shop} quote={quote} compact/></div>
   <button type="button" className="bx-float-button" onClick={()=>window.location.assign("/sepet")} aria-label="Sepeti aç"><span>SEPETİ AÇ</span><Icon type="arrow" size={17}/></button>
  </aside>}
  <div className={`bm-mobile-dock ${drawer||detail||checkout?"hidden":""}`}><a href="#urunler" onClick={()=>setMenu(false)}><Icon type="search" size={18}/><span>Ürünler</span></a><button type="button" onClick={()=>window.location.assign("/sepet")}><Icon type="bag" size={18}/><span>Sepetim {count>0?`(${count})`:""}</span></button><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer"><Icon type="chat" size={18}/><span>Destek</span></a></div>
  {giftPop&&<AddToCartCelebration key={giftPop.id} name={giftPop.name}/>}
  {notice&&<div className="bm-toast" role="status"><Icon type="check" size={17}/>{notice}</div>}
  {detail&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDetail(null)}/>
     <ProductDetail product={detail} summary={reviewsSummary[detail.id]} campaignPercent={activeCampaign?.productIds.includes(detail.id)?activeCampaign.percent:0} onClose={()=>setDetail(null)} onAdd={weight=>{add(detail.id,weight);setDetail(null);setDrawer(true)}}/>
   </div>}
  {drawer&&<div className="bm-modal-root bx-cart-modal">
   <div className="bm-backdrop bx-cart-backdrop" onClick={()=>setDrawer(false)}/>
   <aside role="dialog" aria-modal="true" aria-labelledby="bm-cart-title" className="bm-drawer bx-cart-drawer">
    <div className="bm-drawer-header bx-cart-header">
     <div className="bx-header-title"><div className="bx-cart-header-kicker"><Icon type="bag" size={17}/> BENLİ KURUYEMİŞ · ALIŞVERİŞ SEPETİN</div><h2 id="bm-cart-title">Sepetim <span>{count} paket</span></h2><p>Sevdiğin lezzetler bir arada.</p></div>
     <button type="button" className="bm-close bx-cart-close" onClick={()=>setDrawer(false)} aria-label="Sepeti kapat"><Icon type="x" size={19}/></button>
    </div>
    {expanded.length>0&&<div className="bx-cart-shipping"><ShippingProgress shop={shop} quote={quote}/></div>}
    <div className="bm-cart-lines bx-cart-scroller">
     {!expanded.length?<div className="bm-emptycart bx-cart-empty"><span className="bx-empty-graphic"><Icon type="bag" size={45}/><i>✳</i></span><h3>Sepetin biraz sessiz...</h3><p>En sevilen lezzetlerden birini seç, keyifli alışveriş başlasın.</p><button type="button" onClick={()=>setDrawer(false)}>ÜRÜNLERİ KEŞFET <Icon type="arrow" size={16}/></button></div>:<div className="bx-cart-items"><div className="bx-cart-section-title"><span>SEÇTİĞİN LEZZETLER</span><small>{count} paket</small></div>{expanded.map(l=><div className="bm-cart-line bx-cart-item" key={l.productId+":"+l.weight}>
       <button type="button" className="bm-cart-thumb bx-cart-thumb" aria-label={l.p.name+" ürününü incele"} onClick={()=>{setDrawer(false);openDetail(l.p)}}><SafeImage src={l.p.image} alt={l.p.name}/></button>
       <div className="bx-cart-item-details"><strong>{l.p.name}</strong><small className="bx-cart-weight">{weightLabel(l.weight)} paket</small><span className="bm-cart-original-price"><Money price={l.originalUnit}/></span>{l.discountType==="package"&&<small className="bm-cart-item-discount">{format(roundMoney(l.discountAmount/l.qty))} × {l.qty} = −{format(l.discountAmount)} paket indirimi</small>}{l.discountType==="campaign"&&<small className="bm-cart-item-discount">Kampanya indirimi aşağıda düşülecek</small>}
        <div className="bm-qty bx-cart-qty"><button type="button" onClick={()=>changeQty(l.productId,l.weight,-1)} aria-label={l.p.name+" adedini azalt"}><Icon type="minus" size={15}/></button><span>{l.qty}</span><button type="button" onClick={()=>changeQty(l.productId,l.weight,1)} disabled={cart.filter(x=>x.productId===l.productId).reduce((n,x)=>n+x.qty,0)>=l.p.stock} aria-label={l.p.name+" adedini artır"}><Icon type="plus" size={15}/></button></div>
       </div><button type="button" className="bm-remove bx-cart-remove" onClick={()=>setCart(lines=>lines.filter(x=>x.productId!==l.productId||x.weight!==l.weight))} aria-label={l.p.name+" ürününü sepetten çıkar"}>Sil</button>
      </div>)}</div>}
     {recommendations.length>0&&<section className="bx-recommend" aria-label="Beğenebileceğiniz ürünler">
      <div className="bx-recommend-heading"><span className="bx-recommend-spark">✳</span><div><small>KEYİFLİ BİR ÖNERİ</small><h3>Bunlar da hoşuna gidebilir!</h3></div></div>
      <div className="bx-recommend-list">{recommendations.map(p=><article className="bx-recommend-item" key={p.id}>
       <button type="button" className="bx-recommend-photo" aria-label={p.name+" ürününü incele"} onClick={()=>{setDrawer(false);openDetail(p)}}><SafeImage src={p.image} alt={p.name}/></button>
       <div className="bx-recommend-info"><small>{p.category}</small><strong>{p.name}</strong><span>1 kg · {format(priceFor(p,"1000")!)}</span></div>
       <button type="button" className="bx-recommend-add" aria-label={p.name+" 1 kg sepete ekle"} onClick={()=>add(p.id,"1000")}><Icon type="plus" size={19}/></button>
      </article>)}</div><small className="bx-recommend-footnote">Tüm öneriler 1 kg seçili eklenir; gramajı ürün detayından değiştirebilirsin.</small>
     </section>}
    </div>
    {expanded.length>0&&<div className="bm-cart-summary bx-cart-summary">
     {shopError&&<div className="bm-cart-load-error">Kargo ve kampanya bilgileri yüklenemedi. Şimdilik sipariş oluşturulamaz.</div>}
     <div className="bx-cart-price-row"><span>{quote.packageDiscount+quote.campaignDiscount+quote.basketDiscount>0?"Ürünlerin indirimsiz toplamı":"Ürünler toplamı"}</span><strong>{quote.originalSubtotal===null?"Fiyat sorunuz":format(quote.originalSubtotal)}</strong></div>
     {quote.packageDiscount>0&&<div className="bm-cart-saving"><span>5 kg paket indirimi</span><strong>−{format(quote.packageDiscount)}</strong></div>}
     {quote.campaignDiscount>0&&<div className="bm-cart-saving"><span>Aylık kampanya indirimi</span><strong>−{format(quote.campaignDiscount)}</strong></div>}
     {quote.basketDiscount>0&&<div className="bm-cart-saving"><span>{quote.discountReason}</span><strong>−{format(quote.basketDiscount)}</strong></div>}
     <div className="bm-cart-net-subtotal"><span>{quote.packageDiscount+quote.campaignDiscount+quote.basketDiscount>0?"İndirim sonrası ürünler":"Ürünler toplamı"}</span><strong>{quote.subtotal===null?"Fiyat sorunuz":format(Math.max(0,roundMoney(quote.subtotal-quote.basketDiscount)))}</strong></div>
     <div className="bx-cart-price-row"><span>PTT kargo</span><strong className={quote.freeShipping?"bx-free-text":""}>{quote.freeShipping?"ÜCRETSİZ":quote.shippingFee===null?"—":format(quote.shippingFee)}</strong></div>
     <details className="bx-cart-coupon"><summary>İndirim kuponun var mı? <span>+</span></summary><label>Kupon kodu<input value={couponCode} maxLength={25} placeholder="Kupon kodunuz" onChange={e=>setCouponCode(e.target.value.toLocaleUpperCase("tr-TR"))}/></label>{couponCode&&<small>{couponChecking||verifiedQuote?.key!==quoteKey?"Kupon kontrol ediliyor...":quote.couponApplied?"Kupon uygulandı.":"Kupon geçersiz."}</small>}</details>
     <div className="bm-cart-grand bx-cart-grand"><span>GENEL TOPLAM</span><strong>{total===null?"Fiyat sorunuz":format(total)}</strong></div>
     <button data-track="checkout" className="bm-btn dark bx-checkout-button" type="button" disabled={!shopLoaded||quote.total===null||expanded.some(l=>!l.p.active||cart.filter(x=>x.productId===l.productId).reduce((n,x)=>n+x.qty,0)>l.p.stock)} onClick={()=>{track("checkout_started","checkout");setDrawer(false);setCheckout(true)}}>SİPARİŞE DEVAM ET <Icon type="arrow" size={20}/></button>
     <small className="bx-checkout-caption"><Icon type="check" size={13}/> Ödeme ve sipariş WhatsApp üzerinden teyit edilir.</small>
    </div>}
   </aside>
  </div>}
  {checkout&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setCheckout(false)}/><section className="bm-checkout bm-modal bx-checkout-enhanced" role="dialog" aria-modal="true" aria-label="Sipariş talebi"><button className="bm-close" onClick={()=>setCheckout(false)} type="button" aria-label="Kapat"><Icon type="x"/></button><span className="bm-overline">WHATSAPP İLE SİPARİŞ</span><h2>Sipariş talebiniz</h2><p>Bilgilerinizi girin. Talebiniz oluşturulduktan sonra WhatsApp&apos;a yönlendirileceksiniz. <strong>WhatsApp mesajını göndermeden sipariş kesinleşmez.</strong></p>{google&&<div className="bm-user-chip"><Icon type="check" size={17}/> Google ile giriş yapıldı: {google.email}</div>}<div className="bm-formgrid"><label>Ad Soyad *<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Adınız soyadınız"/></label><label>Telefon *<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label><label>E-posta<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} placeholder="ornek@gmail.com"/></label><label>Teslimat adresi (opsiyonel)<input value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="İl / ilçe / adres"/></label><label className="wide">Sipariş notu<textarea rows={3} value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Varsa özel talebiniz..."/></label></div><div className="bm-checkout-breakdown">{shopError&&<p className="bm-cart-load-error">Kargo ayarları yüklenemedi. Sipariş şu an oluşturulamaz.</p>}<div><span>{quote.packageDiscount+quote.campaignDiscount+quote.basketDiscount>0?"Ürünlerin indirimsiz toplamı":"Ürünler toplamı"}</span><strong>{quote.originalSubtotal===null?"Fiyat sorunuz":format(quote.originalSubtotal)}</strong></div>{quote.packageDiscount>0&&<div className="bm-cart-saving"><span>5 kg paket indirimi</span><strong>−{format(quote.packageDiscount)}</strong></div>}{quote.campaignDiscount>0&&<div className="bm-cart-saving"><span>Aylık kampanya indirimi</span><strong>−{format(quote.campaignDiscount)}</strong></div>}{quote.basketDiscount>0&&<div><span>{quote.discountReason}</span><strong>−{format(quote.basketDiscount)}</strong></div>}{quote.packageDiscount+quote.campaignDiscount+quote.basketDiscount>0&&<div className="bm-cart-net-subtotal"><span>İndirim sonrası ürün tutarı</span><strong>{quote.subtotal===null?"Fiyat sorunuz":format(Math.max(0,roundMoney(quote.subtotal-quote.basketDiscount)))}</strong></div>}<div><span>PTT kargo</span><strong>{quote.freeShipping?"ÜCRETSİZ":quote.shippingFee===null?"—":format(quote.shippingFee)}</strong></div><div className="bm-checkout-total"><span>Genel toplam</span><strong>{total===null?"Fiyat sorunuz":format(total)}</strong></div>
  <section className="bx-checkout-products" aria-label="Sipariş ürünlerinin detayları">
   <div className="bx-checkout-products-title"><span><Icon type="bag" size={18}/> SİPARİŞİNDEKİ ÜRÜNLER</span><button type="button" onClick={()=>window.location.assign("/sepet")}>SEPETİ DÜZENLE <Icon type="arrow" size={15}/></button></div>
   <div className="bx-checkout-product-list">{quote.items.map((item,index)=>{
    const p=products.find(p=>p.id===item.productId);
    return <div className="bx-checkout-product" key={item.productId+":"+item.weight+":"+index}>
     <span className="bx-checkout-product-photo">{p&&<SafeImage src={p.image} alt={item.name}/>}</span>
     <div className="bx-checkout-product-info"><strong>{item.name}</strong><span>{weightLabel(item.weight)} × {item.qty} paket</span>{(item.discountAmount||0)>0&&<small>{item.discountType==="package"?"5 kg paket indirimi":"Kampanya indirimi"}: −{format(item.discountAmount||0)}</small>}</div>
     <div className="bx-checkout-product-price">{item.originalUnitPrice!==null&&item.originalUnitPrice!==undefined&&(item.discountAmount||0)>0&&<del>{format(roundMoney(item.originalUnitPrice*item.qty))}</del>}<strong>{item.subtotal===null?"Fiyat sorunuz":format(item.subtotal)}</strong></div>
    </div>;
   })}</div>
   <p className="bx-checkout-products-note">{quote.packageDiscount+quote.campaignDiscount+quote.basketDiscount>0?"Uygulanan avantajlar toplam tutara yansıtılmıştır. ":""}Kargo bedeli ve genel toplam yukarıda gösterilir.</p>
  </section></div><p className="bm-privacy-note">Bilgileriniz sipariş görüşmesi için kullanılacaktır. Bu aşamada online ödeme alınmaz.</p>{error&&<div className="bm-form-error" role="alert">{error}</div>}<button data-track="send_order" className="bm-btn dark" type="button" disabled={sending||!shopLoaded||quote.total===null||couponChecking} onClick={sendOrder}>{sending?"HAZIRLANIYOR...":"WHATSAPP'A DEVAM ET"} <Icon type="arrow"/></button></section></div>}
 </div>
}
function ProductDetail({product:p,summary,campaignPercent,onClose,onAdd}:{product:Product;summary?:ReviewSummary;campaignPercent:number;onClose:()=>void;onAdd:(weight:string)=>void}){
 const pictures=[p.image,...(p.images||[])].filter(Boolean);
 const [photo,setPhoto]=useState(pictures[0]||"");
 const [weight,setWeight]=useState("1000");
 const base=priceFor(p,weight);
 const original=weight==="5000"?undiscountedFiveKg(p):base;
 const price=discountedProductPrice(p,weight,campaignPercent);
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
   <RatingBadge summary={summary} large/>
   <div className="bm-detail-highlight-row">{p.badge&&<span className="bm-detail-highlight-badge">{p.badge}</span>}{p.origin&&<span>{p.origin}</span>}{stockAvailable?<span className="bm-detail-available">● Stokta</span>:<span className="bm-detail-unavailable">Stokta yok</span>}</div>
   {(p.cardNote||p.description)&&<p className="bm-detail-intro">{p.cardNote||p.description}</p>}
   {(p.origin||p.roasting)&&<div className="bm-detail-specs">{p.origin&&<div><span>MENŞEİ</span><strong>{p.origin}</strong></div>}{p.roasting&&<div><span>ÜRÜN TÜRÜ</span><strong>{p.roasting}</strong></div>}</div>}
   {(campaignPercent>0||(p.discount5kg||0)>0)&&<div className="bm-detail-offer-row">{campaignPercent>0&&<div><strong>AYLIK FIRSAT</strong> %{campaignPercent} kampanya indirimi</div>}{(p.discount5kg||0)>0&&<div><strong>5 KG AVANTAJI</strong> %{p.discount5kg} paket indirimi</div>}</div>}
   <div className="bm-detail-select-title"><h3>Gramaj seçin</h3><small>Fiyatlar seçiminize göre güncellenir.</small></div>
   <div className="bm-detail-weight-cards">{amounts.map(w=>{
    const pkg=priceFor(p,w);
    const paid=discountedProductPrice(p,w,campaignPercent);
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
   <ProductReviews productId={p.id} productName={p.name}/>
  </div>
 </section>
}

function ProductCard({p,add,showDetails,summary,campaignPercent=0}:{p:Product;add:(id:string,weight:string)=>void;showDetails:(p:Product)=>void;summary?:ReviewSummary;campaignPercent?:number}){
 const [weight,setWeight]=useState("1000");
 const base=priceFor(p,weight);
 const price=discountedProductPrice(p,weight,campaignPercent);
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
   <button type="button" className="rv-card-rating-link" onClick={()=>showDetails(p)} aria-label={p.name+" müşteri puanları ve yorumları"}><RatingBadge summary={summary}/></button>
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
