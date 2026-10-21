import "server-only";
import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { Product, Order, OrderStatus } from "./types";
import { defaultProducts } from "./seed";

let instance: DatabaseSync | null = null;
export const ephemeral = Boolean(process.env.VERCEL);
export function getDb(): DatabaseSync {
  if (instance) return instance;
  const basePath = process.env.BENLI_DB_PATH || (ephemeral ? "/tmp/benli-kuruyemis.sqlite" : path.join(process.cwd(), ".data", "benli.sqlite"));
  fs.mkdirSync(path.dirname(basePath), { recursive: true });
  const db = new DatabaseSync(basePath, { timeout: 5000 });
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const n = db.prepare("SELECT COUNT(*) AS count FROM products").get() as {count:number};
  if (!n.count) {
    const insert = db.prepare("INSERT INTO products (id,payload) VALUES (?,?)");
    for (const p of defaultProducts) insert.run(p.id, JSON.stringify(p));
  }
  instance = db;
  return db;
}
export function listProducts(includeInactive = false): Product[] {
  const rows = getDb().prepare("SELECT payload FROM products ORDER BY rowid ASC").all() as {payload:string}[];
  const all = rows.map(r => JSON.parse(r.payload) as Product);
  return includeInactive ? all : all.filter(p => p.active);
}
export function productById(id: string): Product | null {
  const row = getDb().prepare("SELECT payload FROM products WHERE id=?").get(id) as {payload:string}|undefined;
  return row ? JSON.parse(row.payload) as Product : null;
}
export function saveProduct(p: Product): void {
  getDb().prepare("INSERT INTO products (id,payload,updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP").run(p.id,JSON.stringify(p));
}
export function removeProduct(id:string):void { getDb().prepare("DELETE FROM products WHERE id=?").run(id); }
export function listOrders():Order[] {
  return (getDb().prepare("SELECT payload FROM orders ORDER BY created_at DESC").all() as {payload:string}[]).map(r=>JSON.parse(r.payload) as Order);
}
export function findOrder(id:string):Order|null{
  const row=getDb().prepare("SELECT payload FROM orders WHERE id=?").get(id) as {payload:string}|undefined;
  return row?JSON.parse(row.payload) as Order:null;
}
export function saveOrder(o:Order):void{
  getDb().prepare("INSERT INTO orders (id,payload,created_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(o.id,JSON.stringify(o),o.createdAt);
}
export const orderStatuses: OrderStatus[]=["whatsapp_bekleniyor","yeni","onaylandi","hazirlaniyor","kargoda","tamamlandi","iptal"];
