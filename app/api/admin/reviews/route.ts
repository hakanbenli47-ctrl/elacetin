import { NextRequest,NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listReviews,saveReview,deleteReview } from "@/lib/reviews";
export const runtime="nodejs";export const dynamic="force-dynamic";

export async function GET(req:NextRequest){
 if(!isAdmin(req))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{return NextResponse.json({reviews:await listReviews(true)},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"Yorumlar yüklenemedi."},{status:500})}
}

/** Admin can answer reviews but cannot control whether a new review gets published. */
export async function PATCH(req:NextRequest){
 if(!isAdmin(req))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{
  const data=await req.json() as Record<string,unknown>;
  const id=typeof data.id==="string"?data.id:"";
  if(typeof data.reply!=="string")return NextResponse.json({error:"Yanıt metni gerekli."},{status:400});
  const reply=data.reply.trim();
  if(reply.length>800)return NextResponse.json({error:"Yanıt en fazla 800 karakter olabilir."},{status:400});
  const existing=(await listReviews(true)).find(x=>x.id===id&&x.status!=="rejected");
  if(!existing)return NextResponse.json({error:"Yorum bulunamadı."},{status:404});
  const review={...existing,reply,updatedAt:new Date().toISOString()};
  await saveReview(review);
  return NextResponse.json({review},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Yanıt kaydedilemedi."},{status:500})}
}

/** Removal is explicit, permanent, and restricted to signed-in administrators. */
export async function DELETE(req:NextRequest){
 if(!isAdmin(req))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{
  const data=await req.json() as Record<string,unknown>;
  const id=typeof data.id==="string"?data.id:"";
  if(!id||(await listReviews(true)).every(x=>x.id!==id))return NextResponse.json({error:"Yorum bulunamadı."},{status:404});
  await deleteReview(id);
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Yorum kaldırılamadı."},{status:500})}
}
