"use client";
import {useEffect,useMemo,useState} from "react";
import type {Product} from "@/lib/types";
import type {Review,ReviewStatus} from "@/lib/reviews";
import "./reviews.css";
const pretty:Record<ReviewStatus,string>={pending:"Onay bekliyor",approved:"Yayında",rejected:"Reddedildi"};
export default function AdminReviews({products}:{products:Product[]}){
 const [reviews,setReviews]=useState<Review[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [filter,setFilter]=useState<ReviewStatus|"all">("all");
 const [replies,setReplies]=useState<Record<string,string>>({});
 const [saving,setSaving]=useState("");
 async function refresh(){
  setError("");
  try{const r=await fetch("/api/admin/reviews",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Yorumlar alınamadı");setReviews(d.reviews||[]);setReplies(Object.fromEntries((d.reviews||[]).map((r:Review)=>[r.id,r.reply])))}catch(e){setError(e instanceof Error?e.message:"Yorumlar alınamadı")}finally{setLoaded(true)}
 }
 useEffect(()=>{refresh()},[]);
 const visible=useMemo(()=>reviews.filter(r=>filter==="all"||r.status===filter),[reviews,filter]);
 const pending=reviews.filter(r=>r.status==="pending").length;
 async function save(id:string,patch:{status?:ReviewStatus;reply?:string}){
  setSaving(id);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/reviews",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,...patch})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Güncellenemedi");
   setReviews(old=>old.map(x=>x.id===id?d.review:x));setNotice("Değerlendirme kaydedildi.");
  }catch(e){setError(e instanceof Error?e.message:"Güncelleme başarısız")}finally{setSaving("")}
 }
 return <div className="ar-root">
  <div className="adm-section-head"><div><span>MÜŞTERİ GÖRÜŞLERİ</span><h2>Yorum ve puan yönetimi</h2><p>Gelen değerlendirmeleri onaylayın, reddedin ve müşterilere mağaza adına yanıt verin.</p></div><button className="adm-secondary" onClick={refresh} type="button">Yenile ↻</button></div>
  <div className="ar-stats"><div><strong>{reviews.length}</strong><span>Toplam yorum</span></div><div><strong>{pending}</strong><span>Onay bekleyen</span></div><div><strong>{reviews.filter(x=>x.status==="approved").length}</strong><span>Yayında</span></div></div>
  <div className="ar-filters">{([{id:"all",name:"Tümü"},{id:"pending",name:"Bekleyen"},{id:"approved",name:"Yayındakiler"},{id:"rejected",name:"Reddedilenler"}] as {id:ReviewStatus|"all";name:string}[]).map(t=><button type="button" key={t.id} className={filter===t.id?"active":""} onClick={()=>setFilter(t.id)}>{t.name}</button>)}</div>
  {error&&<div className="adm-error" role="alert">{error}</div>}{notice&&<div className="adm-success">{notice}</div>}
  {!loaded?<div className="adm-empty">Yorumlar yükleniyor...</div>:visible.length===0?<div className="adm-panel adm-empty">Bu kategoride henüz yorum yok.</div>:<div className="ar-list">{visible.map(r=>{
   const product=products.find(p=>p.id===r.productId);
   return <article className="ar-card" key={r.id}>
    <div className="ar-card-head"><span className={"ar-status "+r.status}>{pretty[r.status]}</span><small>{new Date(r.createdAt).toLocaleString("tr-TR")}</small></div>
    <h3>{product?.name||"Ürün silinmiş"}</h3>
    <div className="ar-rating">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)} <strong>{r.name}</strong></div><p>{r.text}</p>
    <label>İşletme yanıtı<textarea value={replies[r.id]??""} onChange={e=>setReplies(v=>({...v,[r.id]:e.target.value}))} maxLength={800} rows={3} placeholder="Müşteriye yanıt yazın..."/></label>
    <div className="ar-actions"><button type="button" disabled={saving===r.id} onClick={()=>save(r.id,{status:"approved",reply:replies[r.id]??""})}>{r.status==="approved"?"Yayında · Kaydet":"Onayla ve yayımla"}</button><button type="button" disabled={saving===r.id} onClick={()=>save(r.id,{reply:replies[r.id]??""})}>Yanıtı kaydet</button><button type="button" disabled={saving===r.id} onClick={()=>save(r.id,{status:"rejected",reply:replies[r.id]??""})}>Reddet / Gizle</button></div>
   </article>
  })}</div>}
 </div>;
}
