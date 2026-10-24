"use client";
import {useEffect,useMemo,useState} from "react";
import type {Product} from "@/lib/types";
import type {Review} from "@/lib/reviews";
import "./reviews.css";

export default function AdminReviews({products}:{products:Product[]}){
 const [reviews,setReviews]=useState<Review[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [filter,setFilter]=useState<"all"|"answered"|"unanswered">("all");
 const [replies,setReplies]=useState<Record<string,string>>({});
 const [saving,setSaving]=useState("");
 async function refresh(){
  setError("");
  try{
   const r=await fetch("/api/admin/reviews",{cache:"no-store"}),d=await r.json();
   if(!r.ok)throw Error(d.error||"Yorumlar alınamadı");
   const published:Review[]=(d.reviews||[]).filter((review:Review)=>review.status!=="rejected");
   setReviews(published);
   setReplies(Object.fromEntries(published.map(review=>[review.id,review.reply])));
  }catch(e){setError(e instanceof Error?e.message:"Yorumlar alınamadı")}finally{setLoaded(true)}
 }
 useEffect(()=>{refresh()},[]);
 const visible=useMemo(()=>reviews.filter(r=>filter==="all"||(filter==="answered"?!!r.reply:!r.reply)),[reviews,filter]);
 const replied=reviews.filter(r=>!!r.reply).length;

 async function saveReply(id:string){
  setSaving(id);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/reviews",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,reply:replies[id]??""})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Yanıt kaydedilemedi.");
   setReviews(old=>old.map(x=>x.id===id?d.review:x));setNotice("İşletme yanıtı kaydedildi ve mağazada görünüyor.");
  }catch(e){setError(e instanceof Error?e.message:"Yanıt kaydedilemedi.")}finally{setSaving("")}
 }
 async function removeReview(id:string){
  if(!window.confirm("Bu müşteri yorumunu kalıcı olarak kaldırmak istiyor musunuz?"))return;
  setSaving(id);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/reviews",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Yorum kaldırılamadı.");
   setReviews(old=>old.filter(x=>x.id!==id));setNotice("Yorum mağazadan kaldırıldı.");
  }catch(e){setError(e instanceof Error?e.message:"Yorum kaldırılamadı.")}finally{setSaving("")}
 }
 return <div className="ar-root">
  <div className="adm-section-head"><div><span>MÜŞTERİ GÖRÜŞLERİ</span><h2>Yorum ve puan yönetimi</h2><p>Yorumlar anında yayımlanır. Buradan yalnızca yorumları kaldırabilir veya müşterilere yanıt verebilirsiniz.</p></div><button className="adm-secondary" onClick={refresh} type="button">Yenile ↻</button></div>
  <div className="ar-stats"><div><strong>{reviews.length}</strong><span>Yayımlanan yorum</span></div><div><strong>{reviews.length-replied}</strong><span>Yanıt bekleyen</span></div><div><strong>{replied}</strong><span>Yanıtlanan</span></div></div>
  <div className="ar-filters">{([{id:"all",name:"Tüm yorumlar"},{id:"unanswered",name:"Yanıt bekleyenler"},{id:"answered",name:"Yanıtlananlar"}] as {id:"all"|"answered"|"unanswered";name:string}[]).map(t=><button type="button" key={t.id} className={filter===t.id?"active":""} onClick={()=>setFilter(t.id)}>{t.name}</button>)}</div>
  {error&&<div className="adm-error" role="alert">{error}</div>}{notice&&<div className="adm-success" role="status">{notice}</div>}
  {!loaded?<div className="adm-empty">Yorumlar yükleniyor...</div>:visible.length===0?<div className="adm-panel adm-empty">Bu kategoride henüz yorum yok.</div>:<div className="ar-list">{visible.map(r=>{
   const product=products.find(p=>p.id===r.productId);
   return <article className="ar-card" key={r.id}>
    <div className="ar-card-head"><span className="ar-status approved">Yayında</span><small>{new Date(r.createdAt).toLocaleString("tr-TR")}</small></div>
    <h3>{product?.name||"Ürün silinmiş"}</h3>
    <div className="ar-rating">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)} <strong>{r.name}</strong></div><p>{r.text}</p>
    <label>İşletme yanıtı<textarea value={replies[r.id]??""} onChange={e=>setReplies(v=>({...v,[r.id]:e.target.value}))} maxLength={800} rows={3} placeholder="Müşteriye yanıt yazın..."/></label>
    <div className="ar-actions"><button type="button" disabled={saving===r.id} onClick={()=>saveReply(r.id)}>{r.reply?"Yanıtı güncelle":"Yanıtı yayımla"}</button><button type="button" className="ar-delete-review" disabled={saving===r.id} onClick={()=>removeReview(r.id)}>Yorumu kaldır</button></div>
   </article>
  })}</div>}
 </div>;
}
