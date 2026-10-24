import "server-only";
import { randomUUID } from "node:crypto";
import { isPersistent,dbRequest } from "./persistence";
import { getDb } from "./db";
export type ReviewStatus="pending"|"approved"|"rejected";
export type Review={id:string;productId:string;name:string;rating:number;text:string;status:ReviewStatus;reply:string;createdAt:string;updatedAt:string};
type Row={key:string;value:Review};
export async function listReviews(admin=false):Promise<Review[]>{
 let rows:Review[];
 if(isPersistent){
  const data=await dbRequest<Row[]>("benli_config?key=like.review_*&select=key,value&limit=1500");
  rows=data.map(x=>x.value);
 }else{
  const db=getDb();
  db.exec("CREATE TABLE IF NOT EXISTS benli_reviews(id TEXT PRIMARY KEY,payload TEXT NOT NULL)");
  rows=(db.prepare("SELECT payload FROM benli_reviews ORDER BY id DESC").all() as {payload:string}[]).map(r=>JSON.parse(r.payload) as Review);
 }
 return rows.filter(r=>admin||r.status!=="rejected").sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function saveReview(r:Review):Promise<void>{
 if(isPersistent){
  await dbRequest("benli_config?on_conflict=key",{method:"POST",prefer:"resolution=merge-duplicates",body:[{key:"review_"+r.id,value:r}]});
 }else{
  const db=getDb();
  db.exec("CREATE TABLE IF NOT EXISTS benli_reviews(id TEXT PRIMARY KEY,payload TEXT NOT NULL)");
  db.prepare("INSERT INTO benli_reviews(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(r.id,JSON.stringify(r));
 }
}
export function newReview(productId:string,name:string,rating:number,text:string):Review{
 const now=new Date().toISOString();
 return {id:randomUUID(),productId,name,rating,text,status:"approved",reply:"",createdAt:now,updatedAt:now};
}
export function summariesFor(reviews:Review[]){
 const groups:Record<string,{count:number;average:number;total:number}>={};
 for(const r of reviews){
  if(r.status==="rejected")continue;
  const a=groups[r.productId]??{count:0,average:0,total:0};a.count++;a.total+=r.rating;groups[r.productId]=a;
 }
 return Object.fromEntries(Object.entries(groups).map(([id,g])=>[id,{count:g.count,average:Math.round(g.total/g.count*10)/10}]));
}

/** Permanently remove a customer comment from both the site and review summaries. */
export async function deleteReview(id:string):Promise<void>{
 if(isPersistent){
  await dbRequest(`benli_config?key=eq.review_${encodeURIComponent(id)}`,{method:"DELETE"});
 }else{
  const db=getDb();
  db.exec("CREATE TABLE IF NOT EXISTS benli_reviews(id TEXT PRIMARY KEY,payload TEXT NOT NULL)");
  db.prepare("DELETE FROM benli_reviews WHERE id=?").run(id);
 }
}
