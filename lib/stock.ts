import "server-only";
import type { Product } from "./types";
import { dbRequest,isPersistent } from "./persistence";
import { getDb } from "./db";
import type {QuoteInput} from "./shop";

/** Stok, yönetim panelindeki "paket adedi" olarak tutulur. Gramaj farklı
 * olsa da aynı üründen alınan bütün paketlerin adedi birlikte değerlendirilir. */
export class StockUnavailable extends Error{
 constructor(message:string){super(message);this.name="StockUnavailable";}
}
export function groupCartQuantities(lines:QuoteInput[]){
 const count=new Map<string,number>();
 for(const line of lines){
  if(!Number.isSafeInteger(line.qty)||line.qty<1||line.qty>99)throw new StockUnavailable("Geçersiz ürün adedi.");
  count.set(line.productId,(count.get(line.productId)||0)+line.qty);
 }
 return count;
}
export function assertCartStock(lines:QuoteInput[],products:Product[]):void{
 const quantities=groupCartQuantities(lines);
 const productMap=new Map(products.map(p=>[p.id,p]));
 for(const [id,qty] of quantities){
  const p=productMap.get(id);
  if(!p||!p.active)throw new StockUnavailable("Sepetinizde satış dışı bir ürün var.");
  if(!Number.isFinite(p.stock)||p.stock<qty)throw new StockUnavailable(`${p.name} için yeterli stok yok. Mevcut stok: ${Math.max(0,p.stock)} paket.`);
 }
}
type StockRow={id:string;payload:Product;updated_at:string};
async function adjustStock(id:string,quantityDelta:number):Promise<Product>{
 if(!Number.isSafeInteger(quantityDelta)||quantityDelta===0)throw Error("Stok değişimi geçersiz.");
 if(isPersistent){
  for(let attempt=0;attempt<7;attempt++){
   const rows=await dbRequest<StockRow[]>(`benli_products?id=eq.${encodeURIComponent(id)}&select=id,payload,updated_at&limit=1`);
   const row=rows[0];if(!row)throw new StockUnavailable("Ürün artık satışta değil.");
   const p=row.payload;
   if(quantityDelta<0&&(!p.active||p.stock< -quantityDelta))throw new StockUnavailable(`${p.name} için yeterli stok kalmadı. Mevcut stok: ${Math.max(0,p.stock)} paket.`);
   const next=Math.max(0,p.stock+quantityDelta);
   const updated_at=new Date(Math.max(Date.now(),new Date(row.updated_at).getTime()+1)).toISOString();
   const patched=await dbRequest<{id:string}[]>(`benli_products?id=eq.${encodeURIComponent(id)}&updated_at=eq.${encodeURIComponent(row.updated_at)}&select=id`,{
    method:"PATCH",prefer:"return=representation",body:{payload:{...p,stock:next},updated_at}
   });
   if(patched.length===1)return {...p,stock:next};
  }
  throw new StockUnavailable("Ürün stoğu aynı anda değişti. Lütfen sepeti yenileyip yeniden deneyin.");
 }
 const db=getDb();
 for(let attempt=0;attempt<5;attempt++){
  const row=db.prepare("SELECT payload FROM products WHERE id=?").get(id) as {payload:string}|undefined;
  if(!row)throw new StockUnavailable("Ürün artık satışta değil.");
  const p=JSON.parse(row.payload) as Product;
  if(quantityDelta<0&&(!p.active||p.stock< -quantityDelta))throw new StockUnavailable(`${p.name} için yeterli stok kalmadı. Mevcut stok: ${Math.max(0,p.stock)} paket.`);
  const updated=JSON.stringify({...p,stock:Math.max(0,p.stock+quantityDelta)});
  const result=db.prepare("UPDATE products SET payload=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND payload=?").run(updated,id,row.payload);
  if(result.changes===1)return JSON.parse(updated) as Product;
 }
 throw new StockUnavailable("Ürün stoğu değişti. Lütfen yeniden deneyin.");
}
/** Stoku talep oluşturulurken ayır. Başarısız işlemde ayrılan ürünleri iade et. */
export async function reserveCartStock(lines:QuoteInput[]):Promise<{products:Product[];release:()=>Promise<void>}>{
 const quantities=groupCartQuantities(lines);
 const reserved:{id:string;qty:number}[]=[];
 const products:Product[]=[];
 const release=async()=>{for(const item of [...reserved].reverse())await adjustStock(item.id,item.qty)};
 try{
  for(const [id,qty] of [...quantities.entries()].sort(([a],[b])=>a.localeCompare(b))){
   const after=await adjustStock(id,-qty);
   products.push({...after,stock:after.stock+qty});
   reserved.push({id,qty});
  }
 }catch(e){
  try{await release()}catch{throw Error("Stok ayırma geri alınamadı. Yönetici stokları kontrol etmeli.")}
  throw e;
 }
 return {products,release};
}
