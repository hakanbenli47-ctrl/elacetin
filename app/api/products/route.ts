import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listProducts, saveProduct } from "@/lib/db";
import { parseProduct } from "@/lib/validate";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{const admin=isAdmin(request);return NextResponse.json({products:listProducts(admin && request.nextUrl.searchParams.get("all")==="1"),ephemeral:!!process.env.VERCEL},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"Ürünler yüklenemedi."},{status:500});}
}
export async function POST(request:NextRequest){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{
 const data=await request.json();const p=parseProduct(data);
 if(!p)return NextResponse.json({error:"Ürün bilgilerini ve fiyatları kontrol edin."},{status:400});
 if(listProducts(true).some(x=>x.slug===p.slug&&x.id!==p.id))return NextResponse.json({error:"Bu URL kısa adı kullanılıyor."},{status:409});
 saveProduct(p);return NextResponse.json({product:p});
 }catch{return NextResponse.json({error:"Ürün kaydedilemedi."},{status:500});}
}
