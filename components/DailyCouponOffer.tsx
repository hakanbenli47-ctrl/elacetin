"use client";

import {useEffect,useState} from "react";
import type {ShopSettings} from "@/lib/shop";
import "./daily-coupon.css";

type Coupon=ShopSettings["coupon"];
const tl=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2});

/** Counts down to the next midnight in Türkiye (UTC+03:00).
 * The code is explicitly renewed daily, not deceptively advertised as ending forever.
 */
function untilTurkeyMidnight(){
 const now=new Date(Date.now()+3*60*60*1000);
 return 86400-(now.getUTCHours()*3600+now.getUTCMinutes()*60+now.getUTCSeconds());
}
function DailyRenewalClock(){
 const [seconds,setSeconds]=useState<number|null>(null);
 useEffect(()=>{
  const update=()=>setSeconds(untilTurkeyMidnight());
  update();
  const timer=setInterval(update,1000);
  return()=>clearInterval(timer);
 },[]);
 const value=(s:number)=>String(s).padStart(2,"0");
 const h=seconds===null?"--":value(Math.floor(seconds/3600));
 const m=seconds===null?"--":value(Math.floor(seconds%3600/60));
 const s=seconds===null?"--":value(seconds%60);
 return <div className="dc-clock-wrap">
  <span className="dc-clock-title">GÜNLÜK SAYACIN YENİLENMESİNE</span>
  <div className="dc-clock" role="timer" aria-label="Günlük kod sayacının yenilenmesine kalan süre"><span><b>{h}</b><small>SAAT</small></span><i>:</i><span><b>{m}</b><small>DAKİKA</small></span><i>:</i><span><b>{s}</b><small>SANİYE</small></span></div>
 </div>;
}

export default function DailyCouponOffer({coupon,variant,onApply,selected=false}:{coupon:Coupon;variant:"home"|"cart";onApply:()=>void;selected?:boolean}){
 const [copied,setCopied]=useState(false);
 if(!coupon.enabled||!coupon.code||coupon.percent<=0)return null;
 async function copy(){
  try{await navigator.clipboard.writeText(coupon.code);setCopied(true);setTimeout(()=>setCopied(false),1800)}
  catch{setCopied(false)}
 }
 return <section className={"dc-offer dc-"+variant} aria-label="Günlük kupon kodu">
  <div className="dc-graphic" aria-hidden="true"><span>✳</span><b>%{coupon.percent.toLocaleString("tr-TR")}</b><small>İNDİRİM</small></div>
  <div className="dc-copy">
   <span className="dc-eyebrow"><i/> GÜNÜN KUPONU · HER GÜN YENİLENİR</span>
   <h2>{variant==="home"?"Sepetinde küçük bir sürpriz var!":"Sepetinde kupon fırsatı!"}</h2>
   <p><strong>{coupon.code}</strong> koduyla indirimsiz ürünlerde <b>%{coupon.percent.toLocaleString("tr-TR")} indirim</b>{coupon.minSubtotal>0?<> · <b>{tl.format(coupon.minSubtotal)} ve üzeri</b> sepetlerde</>:null}.</p>
   <small>5 kg paket veya başka kampanya indirimi uygulanmış ürünlerle birleşmez.</small>
  </div>
  <div className="dc-right">
   <DailyRenewalClock/>
   <div className="dc-action-row">
    <button type="button" className="dc-code" onClick={copy} aria-label="Kupon kodunu kopyala"><span>{coupon.code}</span><small>{copied?"KOPYALANDI":"KOPYALA ↗"}</small></button>
    <button type="button" className="dc-apply" onClick={onApply}>{selected?"KOD GİRİLDİ ✓":variant==="home"?"SEPETTE KULLAN →":"KODU UYGULA →"}</button>
   </div>
   <small className="dc-renew-note">Sayaç her gün Türkiye saatiyle 00.00'da yenilenir; kupon yönetim panelinde açık kaldığı sürece kullanılabilir.</small>
  </div>
 </section>;
}
