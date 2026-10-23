import "server-only";
import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { Product,Order,OrderStatus } from "./types";
import { dbRequest,isPersistent,isEphemeral } from "./persistence";

let instance:DatabaseSync|null=null;
export const ephemeral=isEphemeral;
export function getDb():DatabaseSync{
 if(instance)return instance;
 const base=process.env.BENLI_DB_PATH||(Boolean(process.env.VERCEL)?"/tmp/benli-kuruyemis.sqlite":path.join(process.cwd(),".data","benli.sqlite"));
 fs.mkdirSync(path.dirname(base),{recursive:true});
 const db=new DatabaseSync(base,{timeout:5000});
 db.exec(`
 PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,payload TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 `);
 instance=db;return db;
}
type ProductRow={id:string;payload:Product};
type OrderRow={id:string;payload:Order};
export async function listProducts(includeInactive=false):Promise<Product[]>{
 if(isPersistent){
  const rows=await dbRequest<ProductRow[]>("benli_products?select=id,payload&order=updated_at.desc&limit=3000");
  const all=rows.map(r=>r.payload);
  return includeInactive?all:all.filter(p=>p.active);
 }
 const rows=getDb().prepare("SELECT payload FROM products ORDER BY updated_at DESC").all() as {payload:string}[];
 const all=rows.map(r=>JSON.parse(r.payload) as Product);
 return includeInactive?all:all.filter(p=>p.active);
}
export async function productById(id:string):Promise<Product|null>{
 if(isPersistent){
  const rows=await dbRequest<ProductRow[]>(`benli_products?id=eq.${encodeURIComponent(id)}&select=payload&limit=1`);
  return rows[0]?.payload||null;
 }
 const row=getDb().prepare("SELECT payload FROM products WHERE id=?").get(id) as {payload:string}|undefined;
 return row?JSON.parse(row.payload) as Product:null;
}
export async function saveProduct(p:Product):Promise<void>{
 if(isPersistent){
  await dbRequest("benli_products?on_conflict=id",{method:"POST",prefer:"resolution=merge-duplicates",body:[{id:p.id,payload:p,updated_at:new Date().toISOString()}]});return;
 }
 getDb().prepare("INSERT INTO products(id,payload,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP").run(p.id,JSON.stringify(p));
}
export async function removeProduct(id:string):Promise<void>{
 if(isPersistent){await dbRequest(`benli_products?id=eq.${encodeURIComponent(id)}`,{method:"DELETE"});return}
 getDb().prepare("DELETE FROM products WHERE id=?").run(id);
}
export async function listOrders():Promise<Order[]>{
 if(isPersistent){
  const rows=await dbRequest<OrderRow[]>("benli_orders?select=payload&order=created_at.desc&limit=3000");
  return rows.map(r=>r.payload);
 }
 return (getDb().prepare("SELECT payload FROM orders ORDER BY created_at DESC").all() as {payload:string}[]).map(r=>JSON.parse(r.payload) as Order);
}
export async function findOrder(id:string):Promise<Order|null>{
 if(isPersistent){
  const rows=await dbRequest<OrderRow[]>(`benli_orders?id=eq.${encodeURIComponent(id)}&select=payload&limit=1`);
  return rows[0]?.payload||null;
 }
 const row=getDb().prepare("SELECT payload FROM orders WHERE id=?").get(id) as {payload:string}|undefined;
 return row?JSON.parse(row.payload) as Order:null;
}
export async function saveOrder(o:Order):Promise<void>{
 if(isPersistent){
  await dbRequest("benli_orders?on_conflict=id",{method:"POST",prefer:"resolution=merge-duplicates",body:[{id:o.id,payload:o,created_at:o.createdAt}]});return;
 }
 getDb().prepare("INSERT INTO orders(id,payload,created_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(o.id,JSON.stringify(o),o.createdAt);
}
export const orderStatuses:OrderStatus[]=["whatsapp_bekleniyor","yeni","onaylandi","hazirlaniyor","kargoda","tamamlandi","iptal"];
