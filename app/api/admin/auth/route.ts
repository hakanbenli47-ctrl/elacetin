import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, cookieName, cookieOptions, isAdmin, signAdminSession, verifyCredentials } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const failed = new Map<string,{count:number;start:number}>();
export async function GET(request:NextRequest){return NextResponse.json({authenticated:isAdmin(request),configured:adminConfigured,ephemeral:!!process.env.VERCEL});}
export async function POST(request:NextRequest){
 const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const recent=failed.get(ip);if(recent&&Date.now()-recent.start<15*60*1000&&recent.count>=6)return NextResponse.json({error:"Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin."},{status:429});
 try{
 const data=await request.json();
 if(typeof data.username!=="string"||typeof data.password!=="string"||!verifyCredentials(data.username,data.password)){
   const item=(recent&&Date.now()-recent.start<15*60*1000)?recent:{count:0,start:Date.now()};
   item.count++;failed.set(ip,item);
   return NextResponse.json({error:adminConfigured?"Kullanıcı adı veya şifre hatalı.":"Sunucuda yönetici giriş bilgileri tanımlanmamış."},{status:401});
 }
 failed.delete(ip);const res=NextResponse.json({ok:true});res.cookies.set(cookieName(),signAdminSession(),cookieOptions());return res;
 }catch{return NextResponse.json({error:"Geçersiz istek."},{status:400});}
}
export async function DELETE(){const res=NextResponse.json({ok:true});res.cookies.set(cookieName(),"",{...cookieOptions(),maxAge:0});return res;}
