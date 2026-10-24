"use client";
import {useEffect,useMemo,useState} from "react";
import type {Product} from "@/lib/types";
import {quoteCart,defaultShopSettings,campaignActive} from "@/lib/shop";
import type {ShopSettings,CheckoutQuote} from "@/lib/shop";
import {priceFor,roundMoney,weightLabel,weightOptions,discountedProductPrice} from "@/lib/pricing";
import "./sepet.css";
type Line={productId:string;weight:string;qty:number};
const money=(n:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(n);
const Icon=({name}:{name:"cart"|"arrow"|"trash"|"plus"|"minus"|"check"|"truck"|"star"})=>{
 const shapes={cart:<><path d="M6 7h14l-1.5 13h-13L4 3H1"/><path d="M8 11h10"/><circle cx="8" cy="22" r="1"/><circle cx="17" cy="22" r="1"/></>,arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,trash:<><path d="M4 7h16M9 7v12m6-12v12M7 7l1 14h8l1-14M9 7V4h6v3"/></>,plus:<path d="M12 5v14M5 12h14"/>,minus:<path d="M5 12h14"/>,check:<path d="m4 12 5 5 11-11"/>,truck:<><path d="M2 5h13v12H2zM15 9h4l3 4v4h-7"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,star:<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>};
 return <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
};
export default function CartPage(){
 const [products,setProducts]=useState<Product[]>([]),[shop,setShop]=useState<ShopSettings>(defaultShopSettings),[cart,setCart]=useState<Line[]>([]);
 const [ready,setReady]=useState(false),[loaded,setLoaded]=useState(false),[shopLoaded,setShopLoaded]=useState(false),[error,setError]=useState(""),[tip,setTip]=useState("");
 const [coupon,setCoupon]=useState(""),[serverQuote,setServerQuote]=useState<{key:string;quote:CheckoutQuote}|null>(null),[checking,setChecking]=useState(false),[stockError,setStockError]=useState("");
 useEffect(()=>{
  try{
   const lines=JSON.parse(localStorage.getItem("benli-cart")||"[]");
   if(Array.isArray(lines))setCart(lines.filter((l:Line)=>l&&typeof l.productId==="string"&&weightOptions.includes(l.weight as typeof weightOptions[number])&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<100));
   setCoupon(localStorage.getItem("benli-coupon")||"");
  }catch{}
  setLoaded(true);
  Promise.all([fetch("/api/products",{cache:"no-store"}),fetch("/api/shop",{cache:"no-store"})]).then(async([p,s])=>{
   if(!p.ok||!s.ok)throw Error("Mağaza bilgileri yüklenemedi, lütfen tekrar deneyin.");
   const pr=await p.json(),sh=await s.json();setProducts(pr.products||[]);setShop(sh.settings||defaultShopSettings);setShopLoaded(true);
  }).catch(e=>setError(e.message)).finally(()=>setReady(true));
 },[]);
 useEffect(()=>{if(loaded)localStorage.setItem("benli-cart",JSON.stringify(cart))},[cart,loaded]);
 useEffect(()=>{if(loaded)localStorage.setItem("benli-coupon",coupon)},[coupon,loaded]);
 const quoteKey=JSON.stringify({cart,coupon});
 const localQuote=useMemo(()=>quoteCart(cart,products,shop),[cart,products,shop]);
 const quote=serverQuote?.key===quoteKey?serverQuote.quote:localQuote;
 useEffect(()=>{
  if(!shopLoaded||!cart.length){setServerQuote(null);setStockError("");setChecking(false);return}
  const abort=new AbortController();setChecking(true);setStockError("");
  const delay=setTimeout(()=>{fetch("/api/shop/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart,couponCode:coupon}),signal:abort.signal})
   .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Sepet hesaplanamadı.");setServerQuote({key:quoteKey,quote:d.quote})})
   .catch(e=>{if(!abort.signal.aborted){setServerQuote(null);setStockError(e.message)}})
   .finally(()=>{if(!abort.signal.aborted)setChecking(false)})},240);
  return()=>{clearTimeout(delay);abort.abort()};
 },[quoteKey,shopLoaded,cart,coupon]);
 const count=cart.reduce((a,l)=>a+l.qty,0);
 const items=cart.map(l=>({line:l,p:products.find(p=>p.id===l.productId),quote:quote.items.find(q=>q.productId===l.productId&&q.weight===l.weight)}));
 const inCart=new Set(cart.map(x=>x.productId));
 const recommendations=products.filter(p=>p.active&&p.stock>0&&!inCart.has(p.id)&&priceFor(p,"1000")!==null).sort((a,b)=>Number(b.featured)-Number(a.featured)).slice(0,6);
 const productSubtotal=quote.subtotal===null?null:Math.max(0,roundMoney(quote.subtotal-quote.basketDiscount));
 const threshold=shop.freeShippingThreshold;const remaining=productSubtotal===null?null:Math.max(0,roundMoney(threshold-productSubtotal));
 const free=shop.shippingFee===0||(threshold>0&&remaining===0);
 const progress=threshold>0&&productSubtotal!==null?Math.min(100,productSubtotal/threshold*100):0;
 const realSavings=quote.packageDiscount+quote.campaignDiscount+quote.basketDiscount;
 function mutate(id:string,w:string,delta:number){
  const product=products.find(p=>p.id===id);
  if(delta>0&&(!product||cart.filter(l=>l.productId===id).reduce((a,l)=>a+l.qty,0)>=product.stock)){setTip("Bu ürünün stok sınırına ulaştınız.");return}
  setCart(a=>a.map(l=>l.productId===id&&l.weight===w?{...l,qty:l.qty+delta}:l).filter(l=>l.qty>0));
 }
 function add(p:Product){
  if(cart.filter(l=>l.productId===p.id).reduce((a,l)=>a+l.qty,0)>=p.stock){setTip("Bu ürünün stoğu tükendi.");return}
  setCart(a=>{const e=a.find(x=>x.productId===p.id&&x.weight==="1000");return e?a.map(x=>x===e?{...x,qty:x.qty+1}:x):[...a,{productId:p.id,weight:"1000",qty:1}]});setTip(p.name+" sepete eklendi.");
 }
 function updateWeight(id:string,w:string,next:string){
  if(w===next)return;setCart(a=>{const active=a.find(l=>l.productId===id&&l.weight===w);if(!active)return a;const same=a.find(l=>l.productId===id&&l.weight===next);const amount=active.qty+(same?.qty||0);return [...a.filter(l=>!(l.productId===id&&(l.weight===w||l.weight===next))),{productId:id,weight:next,qty:Math.min(99,amount)}]});
 }
 return <main className="sc"><header className="sc-head"><a href="/" className="sc-brand"><span className="sc-brand-symbol">B</span><strong>BENLİ <small>KURUYEMİŞ</small></strong></a><a href="/#urunler" className="sc-back">← ALIŞVERİŞE DEVAM ET</a></header>
 <div className="sc-hero"><div><span>✳ BENLİ KURUYEMİŞ · ALIŞVERİŞ SEPETİ</span><h1>Sepetin,<br/><em>keyfinin adresi.</em></h1><p>Seçtiğin lezzetlere göz at, gramajları değiştir, yeni ürünler keşfet.</p></div><div className="sc-bag"><Icon name="cart"/><strong>{count}</strong><span>PAKET</span></div></div>
 <div className="sc-layout">
 <div className="sc-left">
 {tip&&<div className="sc-info" role="status">{tip}<button onClick={()=>setTip("")}>×</button></div>}
 {error&&<div className="sc-error" role="alert">{error}</div>}
 <section className="sc-items"><div className="sc-section-title"><h2>Sepetindeki ürünler</h2><span>{count} paket</span></div>
 {!loaded||!ready?<div className="sc-loading">Ürünleriniz hazırlanıyor...</div>:items.length===0?<div className="sc-empty"><span>✳</span><h3>Sepetin henüz boş</h3><p>Güzel lezzetler seni bekliyor.</p><a href="/#urunler">ÜRÜNLERE GÖZ AT →</a></div>:items.map(({line,p,quote:item})=><div className="sc-item" key={line.productId+line.weight}>
  {p?<><img src={p.image||"/favicon.svg"} alt={p.name} className="sc-item-photo"/><div className="sc-item-detail"><div className="sc-item-category">{p.category}</div><strong>{p.name}</strong><div className="sc-item-adjust"><label>Gramaj <select aria-label={p.name+" gramajı"} value={line.weight} onChange={e=>updateWeight(line.productId,line.weight,e.target.value)}>{weightOptions.map(w=><option key={w} value={w}>{weightLabel(w)}</option>)}</select></label><div className="sc-counter"><button type="button" aria-label="Adet azalt" onClick={()=>mutate(line.productId,line.weight,-1)}><Icon name="minus"/></button><b>{line.qty}</b><button type="button" aria-label="Adet artır" onClick={()=>mutate(line.productId,line.weight,1)} disabled={cart.filter(l=>l.productId===p.id).reduce((a,l)=>a+l.qty,0)>=p.stock}><Icon name="plus"/></button></div></div>{item?.discountAmount? <small className="sc-item-saving">{item.discountType==="package"?"5 kg paket fiyatı":"Kampanya"}: −{money(item.discountAmount)}</small>:null}</div><div className="sc-item-right"><button type="button" className="sc-trash" aria-label={p.name+" kaldır"} onClick={()=>setCart(a=>a.filter(l=>l!==line))}><Icon name="trash"/></button>{item?.discountAmount&&item.originalUnitPrice!==null&&item.originalUnitPrice!==undefined?<del>{money(item.originalUnitPrice*line.qty)}</del>:null}<strong>{item?.subtotal===null||!item?"Fiyat teyidi":money(item.subtotal)}</strong></div></>:<div className="sc-item-missing">Satıştan kaldırılmış bir ürün. <button onClick={()=>setCart(a=>a.filter(l=>l!==line))}>Kaldır</button></div>}
 </div>)}</section>
 {recommendations.length>0&&<section className="sc-recommend"><div className="sc-section-title"><div><small>✳ BİRLİKTE DAHA GÜZEL</small><h2>Bunları da sevebilirsin!</h2></div><a href="/#urunler">Tüm ürünler ↗</a></div><div className="sc-recommend-grid">{recommendations.map(p=><article key={p.id} className="sc-reco-card"><img src={p.image||"/favicon.svg"} alt={p.name}/><div><span>{p.category}</span><h3>{p.name}</h3><strong>{money(priceFor(p,"1000")!)} <small>/ 1 kg</small></strong><button type="button" onClick={()=>add(p)}><Icon name="plus"/> SEPETE EKLE</button></div></article>)}</div></section>}
 </div>
 <aside className="sc-right"><section className="sc-summary"><h2>Sipariş özeti</h2><div className={"sc-shipping "+(free?"free":"")}><div className="sc-shipping-text"><Icon name={free?"check":"truck"}/><strong>{free?"Harika! Kargon ücretsiz":threshold>0&&remaining!==null?money(remaining)+" daha alışveriş yap, kargo bedava!":"PTT kargo"}</strong></div>{threshold>0&&<><div className="sc-progress"><span style={{width:progress+"%"}}/></div><small>{free?"Ücretsiz kargo hakkını kazandın.":"Hedef: "+money(threshold)}</small></>}</div>
 <div className="sc-summary-lines"><div><span>Ürünler</span><strong>{quote.originalSubtotal===null?"—":money(quote.originalSubtotal)}</strong></div>{quote.packageDiscount>0&&<div className="saving"><span>5 kg paket avantajı</span><strong>−{money(quote.packageDiscount)}</strong></div>}{quote.campaignDiscount>0&&<div className="saving"><span>Seçili ürün kampanyası</span><strong>−{money(quote.campaignDiscount)}</strong></div>}{quote.basketDiscount>0&&<div className="saving"><span>Kupon</span><strong>−{money(quote.basketDiscount)}</strong></div>}<div><span>PTT Kargo</span><strong>{free?"ÜCRETSİZ":quote.shippingFee===null?"—":money(quote.shippingFee)}</strong></div></div>
 <label className="sc-coupon">Kupon kodun varsa<input value={coupon} onChange={e=>setCoupon(e.target.value.toLocaleUpperCase("tr-TR"))} placeholder="Kupon kodu"/></label>{coupon&&<small className="sc-coupon-state">{checking?"Kupon kontrol ediliyor...":quote.couponApplied?"Kupon uygulandı.":"Geçerli kupon bulunamadı."}</small>}
 {stockError&&<div className="sc-error" role="alert">{stockError}</div>}
 <div className="sc-total"><span>GENEL TOPLAM</span><strong>{quote.total===null?"—":money(quote.total)}</strong></div>
 <button className="sc-checkout-button" type="button" disabled={!items.length||!shopLoaded||!loaded||checking||!!stockError||quote.total===null} onClick={()=>{localStorage.setItem("benli-cart",JSON.stringify(cart));localStorage.setItem("benli-coupon",coupon);window.location.assign("/?checkout=1")}}>SİPARİŞE DEVAM ET <Icon name="arrow"/></button><small className="sc-privacy">Güvenli sipariş talebi · WhatsApp üzerinden teyit.</small>
 </section><div className="sc-benefits"><span><Icon name="check"/> İstediğin gramajı seç</span><span><Icon name="truck"/> PTT kargo bedeli sepette</span><span><Icon name="star"/> Gerçek müşteri değerlendirmeleri</span></div></aside>
 </div>
 <footer className="sc-footer"><a href="/">BENLİ KURUYEMİŞ</a><span>Sevdiğin lezzetler hep bir arada.</span></footer></main>;
}
