"use client";
import {useEffect,useState} from "react";
import type {Review} from "@/lib/reviews";
import "./reviews.css";
export type ReviewSummary={count:number;average:number};
const DATE=(s:string)=>new Date(s).toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"});
export function RatingBadge({summary,large=false}:{summary?:ReviewSummary;large?:boolean}){
 return <span className={"rv-rating "+(large?"large":"")} title={summary?.count?`${summary.average} / 5 · ${summary.count} yorum`:"Henüz puanlama yok"}>
  <span className="rv-rating-stars" aria-hidden="true">{summary?.count?"★".repeat(Math.max(0,Math.min(5,Math.round(summary.average))))+"☆".repeat(5-Math.max(0,Math.min(5,Math.round(summary.average)))):"☆☆☆☆☆"}</span>
  {summary?.count?<><strong>{summary.average.toLocaleString("tr-TR")}</strong><small>({summary.count} yorum)</small></>:<small>İlk değerlendiren sen ol</small>}
 </span>;
}
export default function ProductReviews({productId,productName,onPosted}:{productId:string;productName:string;onPosted?:()=>void}){
 const [reviews,setReviews]=useState<Review[]>([]),[summary,setSummary]=useState<ReviewSummary>();
 const [rating,setRating]=useState(5),[name,setName]=useState(""),[comment,setComment]=useState("");
 const [company,setCompany]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState("");
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let alive=true;setReady(false);
  fetch("/api/reviews?productId="+encodeURIComponent(productId),{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Yorumlar yüklenemedi.");return r.json()}).then(d=>{if(alive){setReviews(d.reviews||[]);setSummary(d.summaries?.[productId]);setReady(true)}}).catch(()=>{if(alive){setReady(true);setError("Yorumlar şu an yüklenemiyor.")}});
  return()=>{alive=false};
 },[productId]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setStatus("");setError("");
  if(name.trim().length<2||comment.trim().length<15){setError("Adınızı ve en az 15 karakterlik bir yorum yazın.");return}
  setBusy(true);
  try{
   const r=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,name,rating,text:comment,company})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Yorum gönderilemedi.");
   setStatus("Değerlendirmeniz yayımlandı. Teşekkürler!");
   setComment("");setRating(5);
   // Refresh the public list immediately instead of waiting for a page reload.
   const latest=await fetch("/api/reviews?productId="+encodeURIComponent(productId),{cache:"no-store"});
   if(latest.ok){const next=await latest.json();setReviews(next.reviews||[]);setSummary(next.summaries?.[productId]);}
   window.dispatchEvent(new Event("benli:reviews-updated"));onPosted?.();
  }catch(e){setError(e instanceof Error?e.message:"Yorum gönderilemedi.")}finally{setBusy(false)}
 }
 return <section className="rv-section" id="urun-yorumlari">
  <div className="rv-section-head"><span>★ MÜŞTERİ DENEYİMLERİ</span><h3>{productName} yorumları</h3><RatingBadge summary={summary} large/></div>
  <div className="rv-reviews">
   {!ready?<p className="rv-empty">Değerlendirmeler yükleniyor...</p>:reviews.length===0?<p className="rv-empty">Henüz yayımlanmış bir yorum yok. İlk değerlendirmeyi siz bırakabilirsiniz.</p>:reviews.map(r=><article className="rv-review" key={r.id}>
    <div className="rv-review-top"><div><strong>{r.name}</strong><small>{DATE(r.createdAt)}</small></div><span className="rv-review-stars" aria-label={r.rating+" / 5 yıldız"}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span></div>
    <p>{r.text}</p>{r.reply&&<div className="rv-owner-reply"><strong>Benli Kuruyemiş yanıtladı</strong><p>{r.reply}</p></div>}
   </article>)}
  </div>
  <form onSubmit={submit} className="rv-form"><h4>Ürünü değerlendir</h4><p>Ürünle ilgili deneyimini paylaş. Yorumun gönderir göndermez ürün sayfasında görünür.</p>
   <label>Puanın <span className="rv-star-input">{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={n+" yıldız"} aria-pressed={rating===n} className={n<=rating?"selected":""} onClick={()=>setRating(n)}>★</button>)}</span></label>
   <label>Adın<input required minLength={2} maxLength={55} value={name} onChange={e=>setName(e.target.value)} placeholder="Adınız" autoComplete="name"/></label>
   <label>Yorumun<textarea required minLength={15} maxLength={1000} rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Ürün hakkında neler düşünüyorsunuz?"/></label>
   <label className="rv-hidden-field" aria-hidden="true">Şirket<input tabIndex={-1} value={company} autoComplete="off" onChange={e=>setCompany(e.target.value)}/></label>
   {error&&<div className="rv-error" role="alert">{error}</div>}{status&&<div className="rv-success" role="status">{status}</div>}
   <button className="rv-submit" type="submit" disabled={busy}>{busy?"GÖNDERİLİYOR":"YORUMU GÖNDER →"}</button>
  </form>
 </section>;
}
