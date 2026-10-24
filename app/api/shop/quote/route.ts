import { NextRequest,NextResponse } from "next/server";
import { getShopSettings } from "@/lib/shop-db";
import { listProducts } from "@/lib/db";
import { quoteCart } from "@/lib/shop";
import { weightOptions } from "@/lib/pricing";
import { assertCartStock,StockUnavailable } from "@/lib/stock";
export const runtime="nodejs";export const dynamic="force-dynamic";
const hits=new Map<string,{count:number;at:number}>();
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 if(origin!==new URL(request.url).origin)return NextResponse.json({error:"Kaynak doğrulanamadı."},{status:403});
 const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown",now=Date.now();
 const prev=hits.get(ip);const cur=prev&&now-prev.at<3600000?prev:{count:0,at:now};
 if(cur.count>=200)return NextResponse.json({error:"Çok fazla fiyat sorgusu."},{status:429});
 cur.count++;hits.set(ip,cur);
 if(hits.size>2000)for(const [key,val] of hits)if(now-val.at>3600000)hits.delete(key);
 if(Number(request.headers.get("content-length")||0)>12000)return NextResponse.json({error:"İstek çok büyük."},{status:413});
 try{
  const data=await request.json() as {items?:unknown;couponCode?:unknown};
  if(!Array.isArray(data.items)||data.items.length<1||data.items.length>35)return NextResponse.json({error:"Geçersiz sepet."},{status:400});
  const lines:{productId:string;weight:string;qty:number}[]=[];
  for(const raw of data.items){
   if(!raw||typeof raw!=="object")return NextResponse.json({error:"Geçersiz ürün."},{status:400});
   const r=raw as Record<string,unknown>;
   if(typeof r.productId!=="string"||r.productId.length>90||!weightOptions.includes(String(r.weight) as typeof weightOptions[number])||!Number.isInteger(r.qty)||Number(r.qty)<1||Number(r.qty)>99)return NextResponse.json({error:"Geçersiz ürün/gramaj."},{status:400});
   lines.push({productId:r.productId,weight:String(r.weight),qty:r.qty as number});
  }
  const products=await listProducts();
  const ids=new Set(products.map(p=>p.id));
  if(lines.some(l=>!ids.has(l.productId)))return NextResponse.json({error:"Satış dışı ürün mevcut."},{status:400});
  assertCartStock(lines,products);
  const settings=await getShopSettings();
  const couponCode=typeof data.couponCode==="string"?data.couponCode.slice(0,25):"";
  return NextResponse.json({quote:quoteCart(lines,products,settings,couponCode)},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(e instanceof StockUnavailable)return NextResponse.json({error:e.message},{status:409});return NextResponse.json({error:"Sepet fiyatı hesaplanamadı."},{status:500})}
}
