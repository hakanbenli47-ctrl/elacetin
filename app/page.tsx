"use client";
import { useEffect, useMemo, useState } from "react";
import type { Product, Category } from "@/lib/types";
import { defaultProducts } from "@/lib/seed";
import "./store.css";
const PHONE="905515550302";
const categories = ["Tümü", "Kuruyemiş", "Leblebi", "Çekirdek", "Kuru Meyve", "Karışık"] as const;
type CartLine = {productId:string;weight:string;qty:number};
const amounts=["250","500","1000"] as const;
const img="https://images.unsplash.com/photo-1600189020840-e9918c25269d?auto=format&fit=crop&w=1750&q=88";
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
function SafeImage({src,alt,className=""}:{src:string;alt:string;className?:string}){return <img src={src||img} alt={alt} className={className} loading="lazy" onError={e=>{e.currentTarget.src=img;}}/>}
function Money({price}:{price:number|null}){return <>{price===null?"Fiyat sorunuz":format(price)}</>}
function InfoTitle({eyebrow,title,sub}:{eyebrow:string;title:React.ReactNode;sub?:string}){return <div className="bm-heading"><span>{eyebrow}</span><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>}

export default function Home(){
 const [products,setProducts]=useState<Product[]>(defaultProducts);
 const [category,setCategory]=useState<string>("Tümü");
 const [search,setSearch]=useState("");
 const [cart,setCart]=useState<CartLine[]>([]);
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
  fetch("/api/products",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(Array.isArray(d.products))setProducts(d.products);}).catch(()=>{});
  fetch("/api/google/session",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.user){setGoogle(d.user);setCustomer(s=>({...s,email:d.user.email,name:d.user.name}));}}).catch(()=>{});
  try{const saved=JSON.parse(localStorage.getItem("benli-cart")||"[]");if(Array.isArray(saved))setCart(saved.filter((x:any)=>x&&typeof x.productId==="string"&&amounts.includes(String(x.weight) as typeof amounts[number])&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<100));}catch{}
  setLoaded(true);
 },[]);
 useEffect(()=>{if(loaded)localStorage.setItem("benli-cart",JSON.stringify(cart))},[cart,loaded]);
 useEffect(()=>{document.body.style.overflow=(drawer||detail||checkout)?"hidden":"";return()=>{document.body.style.overflow=""}},[drawer,detail,checkout]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(""),3000);return()=>clearTimeout(t)},[notice]);
 const show=useMemo(()=>products.filter(p=>p.active&&(category==="Tümü"||p.category===category)&&`${p.name} ${p.category} ${p.description}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR").trim())),[products,category,search]);
 const featured=products.filter(p=>p.active&&p.featured).slice(0,4);
 const count=cart.reduce((s,x)=>s+x.qty,0);
 const expanded=cart.map(l=>{const p=products.find(x=>x.id===l.productId);return p?{...l,p,unit:p.prices[l.weight]??null}:null}).filter((x):x is NonNullable<typeof x>=>x!==null);
 const total=expanded.length>0&&expanded.every(x=>x.unit!==null)?expanded.reduce((s,x)=>s+Number(x.unit)*x.qty,0):null;
 function add(id:string,weight:string){
  const p=products.find(x=>x.id===id);if(!p||!p.active||p.stock<1){setNotice("Bu ürün stokta bulunmuyor.");return}
  setCart(a=>{const exists=a.find(x=>x.productId===id&&x.weight===weight);return exists?a.map(x=>x===exists?{...x,qty:Math.min(x.qty+1,Math.min(99,p.stock))}:x):[...a,{productId:id,weight,qty:1}]});
  setNotice("Ürün sepete eklendi");
 }
 function changeQty(id:string,weight:string,by:number){setCart(a=>a.map(l=>{const p=products.find(x=>x.id===id);return l.productId===id&&l.weight===weight?{...l,qty:Math.min(l.qty+by,p?.stock||99)}:l}).filter(l=>l.qty>0));}
 function chooseCategory(cat:string){setCategory(cat);document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})}
 function openDetail(p:Product){setDetail(p);setSelectedWeight("500")}
 async function sendOrder(){
  if(sending)return;
  if(!customer.name.trim()||customer.phone.replace(/\D/g,"").length<10){setError("Ad soyad ve geçerli telefon numaranızı girin.");return}
  if(expanded.length===0){setError("Sepetiniz boş.");return}
  setSending(true);setError("");
  try{
   const resp=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...customer,items:cart,payment:"WhatsApp görüşmesi"})});
   const result=await resp.json();
   if(!resp.ok)throw Error(result.error||"Sipariş talebi oluşturulamadı.");
   const lineText=expanded.map((line,i)=>`${i+1}) ${line.p.name} — ${line.weight==="1000"?"1 kg":line.weight+" g"} x ${line.qty} — ${line.unit===null?"Fiyat sorulacak":format(line.unit*line.qty)}`).join("\n");
   const message=`Merhaba Benli Kuruyemiş, ürünler için sipariş talebi göndermek istiyorum.\n\nTalep No: ${result.orderId}\n${lineText}\n\nÜrün toplamı: ${total===null?"Fiyat teyidi gerekli":format(total)}\nKargo: Satıcı tarafından teyit edilecek\n\nAd Soyad: ${customer.name}\nTelefon: ${customer.phone}\n${customer.address?"Adres: "+customer.address+"\n":""}${customer.note?"Not: "+customer.note+"\n":""}Lütfen siparişimi ve ödeme koşullarını teyit edin.`;
   const url="https://wa.me/"+PHONE+"?text="+encodeURIComponent(message);
   window.location.href=url;
  }catch(e){setError(e instanceof Error?e.message:"Talep oluşturulamadı");setSending(false)}
 }
 return <div className="bm">
  <div className="bm-topline"><span><Icon type="leaf" size={14}/> BENLİ KURUYEMİŞ • DOĞRU LEZZETİN ADRESİ</span><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer"><Icon type="chat" size={15}/> 0551 555 03 02 • WhatsApp</a></div>
  <header className="bm-header">
   <div className="bm-mainnav"><Logo/>
    <div className="bm-search"><Icon type="search" size={21}/><input value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>{}} placeholder="Hangi kuruyemişi arıyorsunuz?" aria-label="Ürün ara"/>{search&&<button type="button" aria-label="Aramayı sil" onClick={()=>setSearch("")}>×</button>}<button onClick={()=>document.getElementById("urunler")?.scrollIntoView({behavior:"smooth"})} type="button">ARA</button></div>
    <div className="bm-main-actions">
     <a href="/giris" className="bm-account"><Icon type="user"/><span>{google?google.name.split(" ")[0]:"Google ile"}<strong>{google?"Hesabım":"Giriş Yap"}</strong></span></a>
     <button className="bm-cartbtn" onClick={()=>setDrawer(true)} type="button"><Icon type="bag" size={25}/><span>Sepetim<strong>{count} ürün</strong></span>{count>0&&<b>{count}</b>}</button>
     <button className="bm-mobmenu" aria-label="Menüyü aç" onClick={()=>setMenu(!menu)} type="button"><Icon type={menu?"x":"menu"} size={25}/></button>
    </div>
   </div>
   <nav className={`bm-categories ${menu?"open":""}`}>
    <button type="button" className="bm-catall" onClick={()=>chooseCategory("Tümü")}><Icon type="menu" size={18}/> TÜM ÜRÜNLER</button>
    {categories.slice(1).map(c=><button key={c} type="button" onClick={()=>{chooseCategory(c);setMenu(false)}}>{c}</button>)}
    <a href="#hikayemiz">Hakkımızda</a><a className="bm-bulk" href="https://wa.me/905515550302?text=Toptan%20kuruyemi%C5%9F%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer">TOPTAN SİPARİŞ ↗</a>
   </nav>
  </header>
  <main>
   <section className="bm-hero"><div className="bm-hero-copy"><p className="bm-overline">✦ BENLİ KURUYEMİŞ</p><h1>Lezzetin<br/><em>en güzel</em><br/>hâli.</h1><p className="bm-hero-desc">Toptan ticaretin deneyiminden, evinizin en keyifli anlarına. Her avuçta özen, her lokmada lezzet.</p><div className="bm-hero-buttons"><a href="#urunler" className="bm-btn primary">ÜRÜNLERİ KEŞFET <Icon type="arrow"/></a><a href="#hikayemiz" className="bm-btn outline">BİZİ TANIYIN <Icon type="up"/></a></div><div className="bm-hero-hint"><span>01 / 03</span><div><span/></div><small>Benli&apos;nin lezzet dünyasına hoş geldiniz.</small></div></div><div className="bm-hero-image"><SafeImage src={img} alt="Benli Kuruyemiş kuruyemiş koleksiyonu"/><div className="bm-hero-photo-overlay"/></div><div className="bm-seal"><span>BENLİ</span><strong>✦</strong><span>KURUYEMİŞ</span></div></section>
   <div className="bm-features"><div><Icon type="package" size={26}/><p><strong>Özenli ürün seçimi</strong><span>Kuruyemişte deneyim</span></p></div><div><Icon type="truck" size={28}/><p><strong>Türkiye geneli gönderim</strong><span>Kargo koşulları siparişte teyit edilir</span></p></div><div><Icon type="chat" size={26}/><p><strong>Doğrudan iletişim</strong><span>WhatsApp üzerinden görüşme</span></p></div><div><Icon type="shield" size={27}/><p><strong>Şeffaf alışveriş</strong><span>Fiyat ve sipariş için onay</span></p></div></div>
   <section className="bm-section bm-category-wrap" id="kategoriler"><div className="bm-titlebar"><InfoTitle eyebrow="BİRBİRİNDEN LEZZETLİ" title={<>Lezzeti <em>kategorilere ayırdık.</em></>} sub="Aradığınız bütün kuruyemiş çeşitleri bir arada."/><a href="#urunler">TÜM ÜRÜNLER <Icon type="arrow" size={18}/></a></div><div className="bm-category-grid">
    {[{name:"Kuruyemiş",pic:defaultProducts[0].image,note:"KLASİKLER"},{name:"Leblebi",pic:defaultProducts[6].image,note:"ÇITIR ATIŞTIRMALIKLAR"},{name:"Çekirdek",pic:defaultProducts[7].image,note:"SOHBETLERİN VAZGEÇİLMEZİ"},{name:"Karışık",pic:defaultProducts[3].image,note:"SEVİLEN KARIŞIMLAR"},{name:"Kuru Meyve",pic:"https://images.unsplash.com/photo-1598371629575-9dbfc81d5c8e?auto=format&fit=crop&w=900&q=85",note:"ÖZEL SEÇKİ"}].map((c,i)=><button type="button" key={c.name} className="bm-category" onClick={()=>chooseCategory(c.name)}><SafeImage src={c.pic} alt={c.name}/><span className="bm-category-text"><small>{c.note}</small><strong>{c.name}</strong></span><span className="bm-category-icon"><Icon type="up" size={18}/></span></button>)}
   </div></section>
   <section className="bm-promo-row"><div className="bm-promo-light"><span>KEYİFLİ ANLARIN TADI</span><h3>Bir avuç <em>mutluluk.</em></h3><p>Sevdiğiniz lezzetleri keşfetmeye başlayın.</p><a href="#urunler">ÜRÜNLERE BAKIN <Icon type="arrow" size={17}/></a></div><div className="bm-promo-dark"><span>İŞLETMELERE ÖZEL</span><h3>Toptan kuruyemişte<br/><em>yanınızdayız.</em></h3><p>Toplu alımlar için doğrudan görüşelim.</p><a href="https://wa.me/905515550302?text=Merhaba%2C%20toptan%20kuruyemi%C5%9F%20i%C3%A7in%20fiyat%20teklifi%20almak%20istiyorum." target="_blank" rel="noreferrer">TEKLİF ALIN <Icon type="up" size={17}/></a></div></section>
   <section className="bm-section bm-products-wrap" id="urunler"><div className="bm-titlebar"><InfoTitle eyebrow="SİZİN İÇİN SEÇTİK" title={<>Kuruyemişin <em>en sevilenleri.</em></>} sub="Gramajınızı seçin, sepetinize ekleyin. Fiyatlar ürün yönetiminden girilebilir."/><span className="bm-display-count">{show.length} ürün</span></div><div className="bm-filterrow">{categories.map(c=><button type="button" key={c} onClick={()=>setCategory(c)} className={category===c?"active":""}>{c}</button>)}</div>
    {show.length===0?<div className="bm-noresults">Bu kategoride henüz ürün bulunmuyor. <button onClick={()=>{setCategory("Tümü");setSearch("")}} type="button">Tüm ürünleri göster</button></div>:<div className="bm-products-grid">{show.map(p=><ProductCard key={p.id} p={p} add={add} showDetails={openDetail}/>)}</div>}
   </section>
   <section className="bm-story" id="hikayemiz"><div className="bm-story-photo"><SafeImage src={defaultProducts[2].image} alt="Benli Kuruyemiş ürünlerinden bir görünüm"/></div><div className="bm-story-copy"><InfoTitle eyebrow="BENLİ HİKÂYESİ" title={<>Kuruyemişi <em>iyi tanıyoruz.</em></>} /><p>Benli Kuruyemiş&apos;te toptan ticaretin getirdiği deneyimimizi şimdi online satışa taşıyoruz. Ürünlerimizi yakından inceleyebileceğiniz, fiyatı açıkça görebileceğiniz ve sorularınızı doğrudan sorabileceğiniz bir alışveriş deneyimi tasarladık.</p><div className="bm-story-badges"><span><Icon type="check" size={18}/> Doğrudan tedarik tecrübesi</span><span><Icon type="check" size={18}/> WhatsApp üzerinden iletişim</span><span><Icon type="check" size={18}/> Gramaj seçimi</span></div><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer" className="bm-btn dark">BİZE ULAŞIN <Icon type="up"/></a></div></section>
   <section className="bm-newsletter"><span>GÜZEL BİR MOLA VERİN</span><h2>Keyfiniz <em>yerinde olsun.</em></h2><p>Beğendiğiniz ürünleri sepetinize ekleyin, WhatsApp üzerinden bizimle iletişime geçin.</p><a href="#urunler" className="bm-btn primary">ÜRÜNLERİ İNCELEYİN <Icon type="arrow"/></a></section>
  </main>
  <footer className="bm-footer"><div className="bm-footer-cols"><div><Logo/><p>Toptan kuruyemişin deneyimi, Benli&apos;nin lezzet dünyasıyla buluşuyor.</p></div><div><h4>HIZLI ERİŞİM</h4><a href="#urunler">Ürünlerimiz</a><a href="#kategoriler">Kategoriler</a><a href="#hikayemiz">Hakkımızda</a><a href="/giris">Google ile giriş</a></div><div><h4>KATEGORİLER</h4>{categories.slice(1,5).map(c=><a href="#urunler" key={c} onClick={()=>setCategory(c)}>{c}</a>)}</div><div><h4>İLETİŞİM</h4><a href="tel:+905515550302">0551 555 03 02</a><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">WhatsApp ile yazın ↗</a><p>İşletme adresi ve yasal satış bilgileri yayına alınmadan önce tamamlanmalıdır.</p></div></div><div className="bm-footer-bottom"><span>© {new Date().getFullYear()} BENLİ KURUYEMİŞ</span><span>Site önizlemesi • Siparişler WhatsApp ile teyit edilir.</span><a href="/admin">Yönetim</a></div></footer>
  {notice&&<div className="bm-toast" role="status"><Icon type="check" size={17}/>{notice}</div>}
  {detail&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDetail(null)}/><section className="bm-detail bm-modal" role="dialog" aria-modal="true" aria-label={detail.name}><button type="button" className="bm-close" onClick={()=>setDetail(null)} aria-label="Kapat"><Icon type="x"/></button><div className="bm-detail-image"><SafeImage src={detail.image} alt={detail.name}/></div><div className="bm-detail-copy"><span className="bm-overline">{detail.category}</span><h2>{detail.name}</h2><p>{detail.description}</p><h4>GRAMaj SEÇİN</h4><div className="bm-weight-options">{amounts.map(w=><button type="button" className={selectedWeight===w?"active":""} key={w} onClick={()=>setSelectedWeight(w)}>{w==="1000"?"1 kg":w+" g"}</button>)}</div><div className="bm-pricebig"><Money price={detail.prices[selectedWeight]??null}/></div><button type="button" disabled={detail.stock<1} className="bm-btn dark" onClick={()=>{add(detail.id,selectedWeight);setDetail(null);setDrawer(true)}}>{detail.stock<1?"STOKTA YOK":"SEPETE EKLE"} <Icon type="bag"/></button><div className="bm-detail-extra"><h4>Ürün açıklaması</h4><p>{detail.description||"Ürün bilgileri hazırlanıyor."}</p><h4>İçindekiler</h4><p>{detail.ingredients||"Ürün içerik bilgisi eklenecek."}</p><h4>Alerjen bilgisi</h4><p>{detail.allergens||"Alerjen bilgisi doğrulanacak."}</p></div></div></section></div>}
  {drawer&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setDrawer(false)}/><aside role="dialog" aria-modal="true" aria-labelledby="bm-cart-title" className="bm-drawer"><div className="bm-drawer-header"><div><span>BENLİ KURUYEMİŞ</span><h2 id="bm-cart-title">Sepetim ({count})</h2></div><button type="button" className="bm-close" onClick={()=>setDrawer(false)} aria-label="Kapat"><Icon type="x"/></button></div><div className="bm-cart-lines">{!expanded.length?<div className="bm-emptycart"><Icon type="bag" size={49}/><h3>Sepetiniz henüz boş.</h3><p>Sevdiğiniz lezzetleri eklemek için ürünlere göz atın.</p><button type="button" className="bm-btn dark" onClick={()=>setDrawer(false)}>ALIŞVERİŞE DEVAM</button></div>:expanded.map(l=><div className="bm-cart-line" key={l.productId+":"+l.weight}><div className="bm-cart-thumb"><SafeImage src={l.p.image} alt={l.p.name}/></div><div><strong>{l.p.name}</strong><small>{l.weight==="1000"?"1 kg":l.weight+" g"}</small><span><Money price={l.unit}/></span><div className="bm-qty"><button type="button" onClick={()=>changeQty(l.productId,l.weight,-1)}><Icon type="minus" size={16}/></button>{l.qty}<button type="button" onClick={()=>changeQty(l.productId,l.weight,1)}><Icon type="plus" size={16}/></button></div></div><button type="button" className="bm-remove" onClick={()=>setCart(a=>a.filter(x=>x.productId!==l.productId||x.weight!==l.weight))}>Sil</button></div>)}</div>{expanded.length>0&&<div className="bm-cart-summary"><div><span>Ürün toplamı</span><strong>{total===null?"Fiyat teyidi gerekli":format(total)}</strong></div><p>Kargo bedeli ve ödeme koşulları WhatsApp üzerinden teyit edilir.</p><button className="bm-btn dark" type="button" onClick={()=>{setDrawer(false);setCheckout(true)}}>SİPARİŞ TALEBİ OLUŞTUR <Icon type="arrow"/></button></div>}</aside></div>}
  {checkout&&<div className="bm-modal-root"><div className="bm-backdrop" onClick={()=>setCheckout(false)}/><section className="bm-checkout bm-modal" role="dialog" aria-modal="true" aria-label="Sipariş talebi"><button className="bm-close" onClick={()=>setCheckout(false)} type="button" aria-label="Kapat"><Icon type="x"/></button><span className="bm-overline">WHATSAPP İLE SİPARİŞ</span><h2>Sipariş talebiniz</h2><p>Bilgilerinizi girin. Talebiniz oluşturulduktan sonra WhatsApp&apos;a yönlendirileceksiniz. <strong>WhatsApp mesajını göndermeden sipariş kesinleşmez.</strong></p>{google&&<div className="bm-user-chip"><Icon type="check" size={17}/> Google ile giriş yapıldı: {google.email}</div>}<div className="bm-formgrid"><label>Ad Soyad *<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Adınız soyadınız"/></label><label>Telefon *<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label><label>E-posta<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} placeholder="ornek@gmail.com"/></label><label>Teslimat adresi (opsiyonel)<input value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="İl / ilçe / adres"/></label><label className="wide">Sipariş notu<textarea rows={3} value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Varsa özel talebiniz..."/></label></div><p className="bm-checkout-summary">Ürün toplamı: <strong>{total===null?"Fiyat teyidi gerekli":format(total)}</strong> • Kargo henüz eklenmedi.</p><p className="bm-privacy-note">Bilgileriniz sipariş görüşmesi için kullanılacaktır. Bu aşamada online ödeme alınmaz.</p>{error&&<div className="bm-form-error" role="alert">{error}</div>}<button className="bm-btn dark" type="button" disabled={sending} onClick={sendOrder}>{sending?"HAZIRLANIYOR...":"WHATSAPP'A DEVAM ET"} <Icon type="arrow"/></button></section></div>}
 </div>
}
function ProductCard({p,add,showDetails}:{p:Product;add:(id:string,weight:string)=>void;showDetails:(p:Product)=>void}){
 const [weight,setWeight]=useState("500");
 const price=p.prices[weight]??null;
 return <article className="bm-product"><div className="bm-product-image"><button type="button" onClick={()=>showDetails(p)} aria-label={p.name+" detaylarını görüntüle"}><SafeImage src={p.image} alt={p.name}/></button>{p.featured&&<span className="bm-product-badge">ÖNE ÇIKAN</span>}{p.stock<1&&<span className="bm-outofstock">STOKTA YOK</span>}</div><div className="bm-product-body"><small>{p.category}</small><button className="bm-product-title" onClick={()=>showDetails(p)} type="button">{p.name}</button><p>{p.description}</p><div className="bm-packs">{amounts.map(w=><button type="button" aria-pressed={weight===w} className={weight===w?"active":""} key={w} onClick={()=>setWeight(w)}>{w==="1000"?"1 kg":w+" g"}</button>)}</div><div className="bm-product-footer"><div><span>{weight==="1000"?"1 kg":weight+" g"}</span><strong><Money price={price}/></strong></div><button type="button" disabled={p.stock<1} onClick={()=>add(p.id,weight)} aria-label={p.name+" sepete ekle"}><Icon type="plus" size={22}/></button></div></div></article>
}
