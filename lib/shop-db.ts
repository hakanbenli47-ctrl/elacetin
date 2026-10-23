import "server-only";
import { defaultShopSettings,validateShopSettings } from "./shop";
import type { ShopSettings } from "./shop";
import { getDb } from "./db";
import { dbRequest,isPersistent } from "./persistence";
export async function getShopSettings():Promise<ShopSettings>{
 if(isPersistent){
  const rows=await dbRequest<{value:ShopSettings}[]>("benli_config?key=eq.shop&select=value&limit=1");
  return rows[0]?validateShopSettings(rows[0].value)||defaultShopSettings:defaultShopSettings;
 }
 const db=getDb();
 db.exec("CREATE TABLE IF NOT EXISTS shop_config (id TEXT PRIMARY KEY,value TEXT NOT NULL)");
 const row=db.prepare("SELECT value FROM shop_config WHERE id='shop'").get() as {value:string}|undefined;
 return row?validateShopSettings(JSON.parse(row.value))||defaultShopSettings:defaultShopSettings;
}
export async function saveShopSettings(shop:ShopSettings):Promise<void>{
 if(isPersistent){
  await dbRequest("benli_config?on_conflict=key",{method:"POST",prefer:"resolution=merge-duplicates",body:[{key:"shop",value:shop}]});return;
 }
 const db=getDb();
 db.exec("CREATE TABLE IF NOT EXISTS shop_config (id TEXT PRIMARY KEY,value TEXT NOT NULL)");
 db.prepare("INSERT INTO shop_config(id,value) VALUES('shop',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").run(JSON.stringify(shop));
}
