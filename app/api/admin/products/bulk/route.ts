import { NextRequest,NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listProducts,saveProduct } from "@/lib/db";
import { parseProduct } from "@/lib/validate";
import { baseKgPrice,calculatePrices,roundMoney } from "@/lib/pricing";
import type { Product } from "@/lib/types";
export const runtime="nodejs";export const dynamic="force-dynamic";
const str=(a:unknown)=>typeof a==="string"?a.trim():"";
export async function POST(request:NextRequest){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{
  const body=await request.json() as Record<string,unknown>;
  const all=await listProducts(true);
  if(body.action==="import"){
   if(!Array.isArray(body.products)||body.products.length===0||body.products.length>150)return NextResponse.json({error:"Tek seferde 1-150 ürün aktarılabilir."},{status:400});
   const payload:Product[]=[];
   const slugIds=new Map(all.map(p=>[p.slug,p.id]));
   const seen=new Set<string>();
   for(const raw of body.products){
    if(!raw||typeof raw!=="object")return NextResponse.json({error:"Geçersiz satır."},{status:400});
    const input=raw as Record<string,unknown>;
    const slug=str(input.slug).toLowerCase();
    if(seen.has(slug))return NextResponse.json({error:slug+" kısa adı birden fazla kullanılıyor."},{status:400});
    seen.add(slug);
    const existing=all.find(p=>p.slug===slug);
    const parsed=parseProduct({...input,id:existing?.id||input.id||"",image:input.image||existing?.image||"",description:input.description||existing?.description||"",ingredients:input.ingredients||existing?.ingredients||"",allergens:input.allergens||existing?.allergens||"",prices:input.prices||existing?.prices||{},active:input.active===undefined?existing?.active??true:input.active,featured:input.featured===undefined?existing?.featured??false:input.featured,stock:input.stock===undefined?existing?.stock??0:input.stock,category:input.category||existing?.category||"Kuruyemiş"});
    if(!parsed)return NextResponse.json({error:"Geçersiz ürün: "+(str(input.name)||slug)},{status:400});
    if(slugIds.has(parsed.slug)&&existing?.id!==slugIds.get(parsed.slug))return NextResponse.json({error:"Ürün adı çakışması."},{status:409});
    payload.push(parsed);
   }
   for(const p of payload)await saveProduct(p);
   return NextResponse.json({updated:payload.length,skipped:0});
  }
  if(!Array.isArray(body.ids)||body.ids.length===0||body.ids.length>300)return NextResponse.json({error:"Önce işlem uygulanacak ürünleri seçin (en fazla 300)."}, {status:400});
  const ids=new Set(body.ids.filter((x):x is string=>typeof x==="string"));
  const targets=all.filter(p=>ids.has(p.id));
  if(!targets.length)return NextResponse.json({error:"Seçilen ürünler bulunamadı."},{status:404});
  const action=str(body.action),value=Number(body.value);
  let skipped=0;
  const update=(p:Product)=>{
   if(action==="pricePercent"){
    if(!Number.isFinite(value)||value<-90||value>500)throw Error("Fiyat değişim yüzdesi -90 ile +500 arasında olmalıdır.");
    const kg=baseKgPrice(p);if(kg===null){skipped++;return null}
    const next=roundMoney(Math.max(0,kg*(1+value/100)));
    return {...p,kgPrice:next,prices:calculatePrices(next,p.discount5kg||0)};
   }
   if(action==="fiveKgDiscount"){
    if(!Number.isFinite(value)||value<0||value>90)throw Error("5 kg indirimi %0-%90 arasında olmalıdır.");
    const kg=baseKgPrice(p);
    return {...p,discount5kg:value,prices:kg===null?p.prices:calculatePrices(kg,value)};
   }
   if(action==="badge")return {...p,badge:str(body.text).slice(0,26)};
   if(action==="featured")return {...p,featured:Boolean(body.enabled)};
   if(action==="active")return {...p,active:Boolean(body.enabled)};
   throw Error("Toplu işlem tanımlı değil.");
  };
  const changed:Product[]=[];
  for(const p of targets){const result=update(p);if(result)changed.push(result)}
  for(const p of changed)await saveProduct(p);
  return NextResponse.json({updated:changed.length,skipped});
 }catch(e){const msg=e instanceof Error?e.message:"Toplu işlem başarısız.";return NextResponse.json({error:msg},{status:500})}
}
