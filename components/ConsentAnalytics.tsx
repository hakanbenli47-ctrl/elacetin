"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./consent.css";

type Choice = { analytics:boolean; at:number; version:number };
type EventKind = "page_view" | "click" | "product_view" | "category_view" | "search" | "add_to_cart" | "checkout_started" | "order_requested" | "whatsapp_click" | "active_time";
type EventInfo = { event:EventKind; target?:string };
const CHOICE_KEY="benli_cookie_choice_v1";
const VISITOR_KEY="benli_analytics_visitor_v1";
const SESSION_KEY="benli_analytics_session_v1";
const TTL=180*86400000;
function uuid(){
 if(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function")return crypto.randomUUID();
 const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 return [...b].map((n,i)=>([4,6,8,10].includes(i)?"-":"")+n.toString(16).padStart(2,"0")).join("");
}
function storedChoice():Choice|null{
 try{
  const choice=JSON.parse(localStorage.getItem(CHOICE_KEY)||"null") as Choice|null;
  return choice&&choice.version===1&&typeof choice.analytics==="boolean"&&Date.now()-choice.at<TTL?choice:null;
 }catch{return null;}
}
function currentPath(){
 const value=window.location.pathname;
 return ["/","/giris","/cerez-politikasi"].includes(value)?value:"/";
}
export default function ConsentAnalytics(){
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 const [customize,setCustomize]=useState(false);
 const [customAnalytics,setCustomAnalytics]=useState(false);
 const [saving,setSaving]=useState(false);
 const [selected,setSelected]=useState<Choice|null>(null);
 const consented=useRef(false);
 const visitor=useRef("");
 const session=useRef("");
 const lastInteraction=useRef(Date.now());
 const lastTick=useRef(Date.now());
 const lastSearch=useRef(0);

 const emitRef=useRef<(v:EventInfo,duration?:number)=>void>(()=>{});
 emitRef.current=(v,duration=0)=>{
  if(!consented.current||!visitor.current||!session.current||currentPath().startsWith("/admin"))return;
  const target=String(v.target||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,90);
  const body={visitorId:visitor.current,sessionId:session.current,event:v.event,page:currentPath(),target,durationSec:duration};
  void fetch("/api/analytics/events",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",keepalive:true,body:JSON.stringify(body)}).catch(()=>{});
 };
 function enable(){
  try{
   let v=localStorage.getItem(VISITOR_KEY);if(!v||!/^[a-f0-9-]{36}$/i.test(v)){v=uuid();localStorage.setItem(VISITOR_KEY,v)}
   visitor.current=v;
   let s=sessionStorage.getItem(SESSION_KEY);if(!s||!/^[a-f0-9-]{36}$/i.test(s)){s=uuid();sessionStorage.setItem(SESSION_KEY,s)}
   session.current=s;
   consented.current=true;
   lastTick.current=Date.now();lastInteraction.current=Date.now();
   emitRef.current({event:"page_view",target:currentPath()==="/"?"home":currentPath().slice(1).replace(/[^a-z0-9_-]/g,"")});
  }catch{}
 }
 async function permit(){
  const r=await fetch("/api/analytics/consent",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"});
  if(!r.ok)throw Error("Analitik izni kaydedilemedi.");
  enable();
 }
 async function saveChoice(granted:boolean){
  setSaving(true);
  try{
   if(granted){await permit();}
   else{
    consented.current=false;
    const id=visitor.current||localStorage.getItem(VISITOR_KEY)||"";
    await fetch("/api/analytics/consent",{method:"DELETE",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId:id})}).catch(()=>{});
    visitor.current="";session.current="";
    localStorage.removeItem(VISITOR_KEY);sessionStorage.removeItem(SESSION_KEY);
   }
   const value:Choice={analytics:granted,at:Date.now(),version:1};
   localStorage.setItem(CHOICE_KEY,JSON.stringify(value));
   setSelected(value);setOpen(false);setCustomize(false);
  }catch{
   setOpen(true);
  }finally{setSaving(false);}
 }
 useEffect(()=>{
  if(window.location.pathname.startsWith("/admin")){setReady(true);return}
  const saved=storedChoice();
  if(saved){setSelected(saved);if(saved.analytics)void permit().catch(()=>{consented.current=false;setOpen(true)});}
  else {try{localStorage.removeItem(VISITOR_KEY);sessionStorage.removeItem(SESSION_KEY)}catch{}setOpen(true);}
  setReady(true);
  const reopen=()=>{setOpen(true);setCustomize(true)};
  window.addEventListener("benli:cookie-settings",reopen);
  const onTrack=(e:Event)=>{
   const info=(e as CustomEvent<EventInfo>).detail;
   if(info&&typeof info.event==="string"){
    if(info.event==="search"){const now=Date.now();if(now-lastSearch.current<2000)return;lastSearch.current=now;}
    emitRef.current(info);
   }
  };
  window.addEventListener("benli:track",onTrack);
  const trackClick=(e:MouseEvent)=>{
   lastInteraction.current=Date.now();
   if(!consented.current)return;
   const el=e.target instanceof Element?e.target.closest("[data-track]"):null;
   if(!el)return;
   const value=el.getAttribute("data-track");
   if(value)emitRef.current({event:"click",target:value});
  };
  document.addEventListener("click",trackClick,{capture:true});
  const markActivity=()=>{lastInteraction.current=Date.now()};
  document.addEventListener("keydown",markActivity);
  document.addEventListener("scroll",markActivity,{passive:true});
  const timer=setInterval(()=>{
   const now=Date.now(),elapsed=now-lastTick.current;lastTick.current=now;
   if(consented.current&&document.visibilityState==="visible"&&document.hasFocus()&&now-lastInteraction.current<60000){
    const secs=Math.min(20,Math.max(0,Math.round(elapsed/1000)));
    if(secs>0)emitRef.current({event:"active_time",target:"visible"},secs);
   }
  },15000);
  const resetTick=()=>{lastTick.current=Date.now()};
  document.addEventListener("visibilitychange",resetTick);
  return ()=>{
   window.removeEventListener("benli:cookie-settings",reopen);
   window.removeEventListener("benli:track",onTrack);
   document.removeEventListener("click",trackClick,true);
   document.removeEventListener("keydown",markActivity);
   document.removeEventListener("scroll",markActivity);
   document.removeEventListener("visibilitychange",resetTick);
   clearInterval(timer);
  };
 },[]);
 if(!ready||typeof window==="undefined"||window.location.pathname.startsWith("/admin"))return null;
 return <>
 {open&&<div className="bn-consent" role="dialog" aria-modal="false" aria-label="Çerez tercihleri">
  <div className="bn-consent-header"><div className="bn-cookie-mark">✦</div><div><strong>Gizlilik tercihlerinizi siz seçin.</strong><p>Sitenin çalışması için gerekli kayıtları kullanıyoruz. İzin verirseniz hangi ürünlere bakıldığını, tıklamaları ve sitede geçirilen aktif süreyi anonim olarak ölçeriz. Reddetseniz de alışverişe devam edebilirsiniz.</p></div></div>
  {customize&&<div className="bn-consent-details">
   <label className="bn-consent-option"><span><b>Zorunlu</b><small>Oturum, sepet ve seçiminizi hatırlama.</small></span><strong>Her zaman açık</strong></label>
   <label className="bn-consent-option"><span><b>Anonim analiz</b><small>Sayfa/ürün görüntüleme, tıklamalar ve aktif süre; ad, e-posta ve yazdıklarınız kaydedilmez.</small></span><input type="checkbox" checked={customAnalytics} onChange={e=>setCustomAnalytics(e.target.checked)}/></label>
  </div>}
  <div className="bn-consent-actions">
   <button type="button" disabled={saving} onClick={()=>void saveChoice(false)}>Reddet</button>
   {customize?<button type="button" disabled={saving} onClick={()=>void saveChoice(customAnalytics)}>Tercihleri kaydet</button>:<button type="button" disabled={saving} onClick={()=>{setCustomize(true);setCustomAnalytics(Boolean(selected?.analytics))}}>Tercihler</button>}
   <button type="button" disabled={saving} onClick={()=>void saveChoice(true)}>Kabul et</button>
  </div>
  <div className="bn-consent-links"><Link href="/cerez-politikasi">Çerez ve gizlilik politikası</Link><span>• İzninizi istediğiniz an değiştirebilirsiniz.</span></div>
 </div>}
 {!open&&<button type="button" className="bn-consent-tab" onClick={()=>{setOpen(true);setCustomize(true);setCustomAnalytics(Boolean(selected?.analytics))}}>Çerez ayarları</button>}
 </>;
}
