import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb } from "./db";
import { dbRequest, isPersistent } from "./persistence";

export const ANALYTICS_COOKIE = "benli_analytics_consent";
const consentDuration = 180 * 24 * 60 * 60;
const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "benli-local-analytics-dev-secret-only" : "");

export type AnalyticsEvent = "page_view" | "click" | "product_view" | "category_view" | "search" | "add_to_cart" | "checkout_started" | "order_requested" | "whatsapp_click" | "active_time";
export const allowedEvents: AnalyticsEvent[] = ["page_view","click","product_view","category_view","search","add_to_cart","checkout_started","order_requested","whatsapp_click","active_time"];
const idRegex=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const targetRegex=/^[a-z0-9_-]{0,90}$/;
export function validId(v:unknown):v is string{return typeof v==="string"&&idRegex.test(v)}
export function validTarget(v:unknown):v is string{return typeof v==="string"&&targetRegex.test(v)}
export function validPath(v:unknown):v is string{return typeof v==="string"&&["/","/giris","/cerez-politikasi"].includes(v)}
export const analyticsCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge:consentDuration};
function sign(v:string){return crypto.createHmac("sha256",secret).update(v).digest("base64url")}
export function consentToken():string{
 if(!secret) throw Error("Analytics secret eksik");
 const exp=String(Math.floor(Date.now()/1000)+consentDuration);
 return exp+"."+sign(exp);
}
export function isConsented(request:NextRequest):boolean{
 if(!secret)return false;
 const value=request.cookies.get(ANALYTICS_COOKIE)?.value;
 if(!value)return false;
 const parts=value.split(".");
 if(parts.length!==2||!/^[0-9]{10}$/.test(parts[0]))return false;
 const expiration=Number(parts[0]);
 if(expiration<=Date.now()/1000||expiration>Date.now()/1000+consentDuration+300)return false;
 const expected=sign(parts[0]);
 const a=Buffer.from(parts[1]),b=Buffer.from(expected);
 return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
export function sameOrigin(request:NextRequest):boolean{
 const origin=request.headers.get("origin");
 return !!origin&&origin===new URL(request.url).origin;
}

type DbAnalyticsRow = {
 visitor_id:string;session_id:string;event:string;page:string;target:string;
 duration_sec:number;created_at:string
};
let lastCleanup = 0;
function localDb(){
 const db=getDb();
 db.exec(`CREATE TABLE IF NOT EXISTS analytics_events (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   visitor_id TEXT NOT NULL,
   session_id TEXT NOT NULL,
   event TEXT NOT NULL,
   page TEXT NOT NULL,
   target TEXT NOT NULL DEFAULT '',
   duration_sec INTEGER NOT NULL DEFAULT 0,
   created_at TEXT NOT NULL
 );
 CREATE INDEX IF NOT EXISTS analytics_created_idx ON analytics_events(created_at);
 CREATE INDEX IF NOT EXISTS analytics_visitor_idx ON analytics_events(visitor_id);`);
 return db;
}
export async function recordAnalyticsEvent(data:{
 visitorId:string;sessionId:string;event:AnalyticsEvent;page:string;target:string;durationSec:number
}):Promise<void>{
 const row:DbAnalyticsRow={visitor_id:data.visitorId,session_id:data.sessionId,event:data.event,page:data.page,target:data.target,duration_sec:data.durationSec,created_at:new Date().toISOString()};
 if(isPersistent){
  await dbRequest("benli_analytics_events",{method:"POST",body:[row]});
 }else{
  localDb().prepare("INSERT INTO analytics_events(visitor_id,session_id,event,page,target,duration_sec,created_at) VALUES(?,?,?,?,?,?,?)").run(
   row.visitor_id,row.session_id,row.event,row.page,row.target,row.duration_sec,row.created_at
  );
 }
 await cleanupOldEvents();
}
export async function removeVisitorAnalytics(visitorId:string):Promise<void>{
 if(isPersistent){
  await dbRequest(`benli_analytics_events?visitor_id=eq.${encodeURIComponent(visitorId)}`,{method:"DELETE"});
 }else{
  localDb().prepare("DELETE FROM analytics_events WHERE visitor_id=?").run(visitorId);
 }
}
async function cleanupOldEvents(){
 if(Date.now()-lastCleanup<3600000)return;
 const cutoff=new Date(Date.now()-90*86400000).toISOString();
 if(isPersistent){
  await dbRequest(`benli_analytics_events?created_at=lt.${encodeURIComponent(cutoff)}`,{method:"DELETE"});
 }else{
  localDb().prepare("DELETE FROM analytics_events WHERE created_at < ?").run(cutoff);
 }
 lastCleanup=Date.now();
}
export type AnalyticsReport={
 totalViews:number; visitors:number; sessions:number; activeMinutes:number;
 productViews:number; cartAdds:number; checkouts:number; orderRequests:number;
 interactions:number;
 events:{event:string;page:string;target:string;durationSec:number;at:string;session:string}[];
 pages:{name:string;count:number}[]; products:{name:string;count:number}[];
 clicks:{name:string;count:number}[];
 daily:{day:string;views:number;visitors:number}[];
};
function rank(rows:DbAnalyticsRow[],event:string,key:"page"|"target",limit:number){
 const counts=new Map<string,number>();
 for(const row of rows){
  if(row.event!==event||!row[key])continue;
  counts.set(row[key],(counts.get(row[key])||0)+1);
 }
 return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([name,count])=>({name,count}));
}
export async function analyticsReport(days:number):Promise<AnalyticsReport>{
 await cleanupOldEvents();
 const from=new Date(Date.now()-days*86400000).toISOString();
 let rows:DbAnalyticsRow[]=[];
 if(isPersistent){
  // Pages are read in descending order; the admin report is bounded for response safety.
  for(let offset=0;offset<50000;offset+=10000){
   const result=await dbRequest<DbAnalyticsRow[]>(`benli_analytics_events?select=visitor_id,session_id,event,page,target,duration_sec,created_at&created_at=gte.${encodeURIComponent(from)}&order=created_at.desc&limit=10000&offset=${offset}`);
   rows.push(...result);
   if(result.length<10000)break;
  }
 }else{
  const raw=localDb().prepare("SELECT visitor_id,session_id,event,page,target,duration_sec,created_at FROM analytics_events WHERE created_at >= ? ORDER BY created_at DESC LIMIT 50000").all(from);
  rows=raw as unknown as DbAnalyticsRow[];
 }
 const count=(event:string)=>rows.filter(row=>row.event===event).length;
 const visitors=new Set(rows.map(r=>r.visitor_id)).size;
 const sessions=new Set(rows.map(r=>r.session_id)).size;
 const activeMinutes=Math.round(rows.reduce((n,r)=>n+(r.event==="active_time"?r.duration_sec:0),0)/60);
 const dailyMap=new Map<string,{views:number;visitors:Set<string>}>();
 for(const row of rows){
  const day=row.created_at.slice(0,10);
  const entry=dailyMap.get(day)||{views:0,visitors:new Set<string>()};
  if(row.event==="page_view")entry.views++;
  entry.visitors.add(row.visitor_id);
  dailyMap.set(day,entry);
 }
 const daily=[...dailyMap].sort(([a],[b])=>a.localeCompare(b)).map(([day,e])=>({day,views:e.views,visitors:e.visitors.size}));
 return {totalViews:count("page_view"),visitors,sessions,activeMinutes,productViews:count("product_view"),cartAdds:count("add_to_cart"),checkouts:count("checkout_started"),orderRequests:count("order_requested"),interactions:count("click"),
  events:rows.filter(r=>r.event!=="active_time").slice(0,60).map(r=>({event:r.event,page:r.page,target:r.target,durationSec:r.duration_sec,at:r.created_at,session:r.session_id.slice(0,8)})),
  pages:rank(rows,"page_view","page",12),products:rank(rows,"product_view","target",15),clicks:rank(rows,"click","target",15),daily
 };
}
