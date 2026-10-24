import { NextRequest,NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listProducts } from "@/lib/db";
import { listReviews,saveReview,newReview,summariesFor } from "@/lib/reviews";
export const runtime="nodejs";export const dynamic="force-dynamic";
const attempts=new Map<string,{time:number;count:number}>();
export async function GET(req:NextRequest){
 try{
  const reviews=await listReviews(false);
  const productId=req.nextUrl.searchParams.get("productId")||"";
  return NextResponse.json({reviews:productId?reviews.filter(r=>r.productId===productId).slice(0,100):[],summaries:summariesFor(reviews)},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Yorumlar yüklenemedi."},{status:500})}
}
export async function POST(req:NextRequest){
 try{
  const raw=await req.json() as Record<string,unknown>;
  if(raw.company)return NextResponse.json({ok:true});
  const productId=typeof raw.productId==="string"?raw.productId.trim():"";
  const name=typeof raw.name==="string"?raw.name.trim().replace(/\s+/g," "):"";
  const comment=typeof raw.text==="string"?raw.text.trim():"";
  const rating=Number(raw.rating);
  if(!productId||name.length<2||name.length>55||comment.length<15||comment.length>1000||!Number.isInteger(rating)||rating<1||rating>5)
   return NextResponse.json({error:"Ad (2-55 karakter), puan (1-5) ve yorum (15-1000 karakter) gerekli."},{status:400});
  const products=await listProducts(false);
  if(!products.some(p=>p.id===productId))return NextResponse.json({error:"Ürün bulunamadı."},{status:404});
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const key=ip+"|"+productId;
  const current=attempts.get(key);
  const now=Date.now();
  if(current&&now-current.time<3600000&&current.count>=2)return NextResponse.json({error:"Bu ürüne kısa sürede çok fazla yorum gönderdiniz. Daha sonra deneyin."},{status:429});
  if(attempts.size>6000){for(const [k,v] of attempts)if(now-v.time>3600000)attempts.delete(k)}
  const entry=current&&now-current.time<3600000?{time:current.time,count:current.count+1}:{time:now,count:1};
  attempts.set(key,entry);
  await saveReview(newReview(productId,name,rating,comment));
  return NextResponse.json({ok:true,message:"Yorumunuz yönetici onayına gönderildi."},{status:201});
 }catch{return NextResponse.json({error:"Yorum kaydedilemedi."},{status:500})}
}
