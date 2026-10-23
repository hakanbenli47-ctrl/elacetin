import { NextRequest, NextResponse } from "next/server";
import { allowedEvents, recordAnalyticsEvent, isConsented, sameOrigin, validId, validPath, validTarget } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics";
export const runtime="nodejs";export const dynamic="force-dynamic";
const bucket=new Map<string,{start:number,count:number}>();
export async function POST(request:NextRequest){
 if(!sameOrigin(request)||!isConsented(request))return NextResponse.json({error:"Analitik izni bulunmuyor."},{status:403});
 if(Number(request.headers.get("content-length")||0)>2500)return NextResponse.json({error:"İstek çok büyük."},{status:413});
 try{
  const data=await request.json() as Record<string,unknown>;
  if(!validId(data.visitorId)||!validId(data.sessionId)||!allowedEvents.includes(data.event as AnalyticsEvent)||!validPath(data.page)||!validTarget(data.target)||typeof data.durationSec!=="number"||!Number.isInteger(data.durationSec)||data.durationSec<0||data.durationSec>30)return NextResponse.json({error:"Geçersiz olay."},{status:400});
  if((data.event!=="active_time"&&data.durationSec!==0)||(data.event==="active_time"&&data.durationSec===0))return NextResponse.json({error:"Geçersiz süre."},{status:400});
  const now=Date.now();
  const key=data.sessionId;const old=bucket.get(key);
  const current=old&&now-old.start<3600000?old:{start:now,count:0};
  if(current.count>=500)return NextResponse.json({error:"Çok fazla olay."},{status:429});
  current.count++;bucket.set(key,current);
  if(bucket.size>2000){for(const [k,v] of bucket){if(now-v.start>3600000)bucket.delete(k)}}
  await recordAnalyticsEvent({visitorId:data.visitorId,sessionId:data.sessionId,event:data.event as AnalyticsEvent,page:data.page,target:data.target,durationSec:data.durationSec});
  return new NextResponse(null,{status:204,headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Olay kaydedilemedi."},{status:500});}
}
