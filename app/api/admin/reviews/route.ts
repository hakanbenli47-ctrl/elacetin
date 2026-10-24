import { NextRequest,NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listReviews,saveReview } from "@/lib/reviews";
import type {ReviewStatus} from "@/lib/reviews";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!isAdmin(req))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{return NextResponse.json({reviews:await listReviews(true)},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Yorumlar yüklenemedi."},{status:500})}
}
export async function PATCH(req:NextRequest){
 if(!isAdmin(req))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{
  const data=await req.json() as Record<string,unknown>;
  const id=typeof data.id==="string"?data.id:"";
  const existing=(await listReviews(true)).find(x=>x.id===id);
  if(!existing)return NextResponse.json({error:"Yorum bulunamadı."},{status:404});
  const status=data.status===undefined?existing.status:data.status;
  if(status!=="pending"&&status!=="approved"&&status!=="rejected")return NextResponse.json({error:"Geçersiz durum."},{status:400});
  const reply=data.reply===undefined?existing.reply:typeof data.reply==="string"?data.reply.trim():"";
  if(reply.length>800)return NextResponse.json({error:"Yanıt en fazla 800 karakter olabilir."},{status:400});
  const review={...existing,status:status as ReviewStatus,reply,updatedAt:new Date().toISOString()};
  await saveReview(review);
  return NextResponse.json({review});
 }catch{return NextResponse.json({error:"Yorum güncellenemedi."},{status:500})}
}
