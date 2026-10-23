import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb } from "./db";

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
let lastCleanup=0;
export function analyticsDb(){
 const db=getDb();
 db.exec(`
 CREATE TABLE IF NOT EXISTS analytics_events (
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
 CREATE INDEX IF NOT EXISTS analytics_visitor_idx ON analytics_events(visitor_id);
 `);
 if(Date.now()-lastCleanup>3600000){
   const cutoff=new Date(Date.now()-90*86400000).toISOString();
   db.prepare("DELETE FROM analytics_events WHERE created_at < ?").run(cutoff);
   lastCleanup=Date.now();
 }
 return db;
}
export type AnalyticsReport={
 totalViews:number; visitors:number; sessions:number; activeMinutes:number;
 productViews:number; cartAdds:number; checkouts:number; orderRequests:number;
 interactions:number;
 events: {event:string;page:string;target:string;durationSec:number;at:string;session:string}[];
 pages:{name:string;count:number}[]; products:{name:string;count:number}[];
 clicks:{name:string;count:number}[];
 daily:{day:string;views:number;visitors:number}[];
};
export function analyticsReport(days:number):AnalyticsReport{
 const db=analyticsDb();
 const from=new Date(Date.now()-days*86400000).toISOString();
 const scalar=(sql:string)=>Number((db.prepare(sql).get(from) as {n:number}|undefined)?.n||0);
 const totalViews=scalar("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at>=? AND event='page_view'");
 const visitors=scalar("SELECT COUNT(DISTINCT visitor_id) AS n FROM analytics_events WHERE created_at>=?");
 const sessions=scalar("SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events WHERE created_at>=?");
 const activeSeconds=scalar("SELECT COALESCE(SUM(duration_sec),0) AS n FROM analytics_events WHERE created_at>=? AND event='active_time'");
 const productViews=scalar("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at>=? AND event='product_view'");
 const cartAdds=scalar("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at>=? AND event='add_to_cart'");
 const checkouts=scalar("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at>=? AND event='checkout_started'");
 const orderRequests=scalar("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at>=? AND event='order_requested'");
 const interactions=scalar("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at>=? AND event='click'");
 const top=(event:string,key:"page"|"target",limit:number)=>(db.prepare("SELECT "+key+" AS name, COUNT(*) AS count FROM analytics_events WHERE created_at>=? AND event=? AND "+key+"!='' GROUP BY "+key+" ORDER BY count DESC LIMIT ?").all(from,event,limit) as {name:string;count:number}[]);
 const rows=db.prepare("SELECT event,page,target,duration_sec AS durationSec,created_at AS at,substr(session_id,1,8) AS session FROM analytics_events WHERE created_at>=? AND event!='active_time' ORDER BY id DESC LIMIT 60").all(from) as AnalyticsReport["events"];
 const daily=db.prepare("SELECT substr(created_at,1,10) AS day, SUM(CASE WHEN event='page_view' THEN 1 ELSE 0 END) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM analytics_events WHERE created_at>=? GROUP BY substr(created_at,1,10) ORDER BY day ASC").all(from) as AnalyticsReport["daily"];
 return {totalViews,visitors,sessions,activeMinutes:Math.round(activeSeconds/60),productViews,cartAdds,checkouts,orderRequests,interactions,events:rows,pages:top("page_view","page",12),products:top("product_view","target",15),clicks:top("click","target",15),daily};
}
