import { NextRequest,NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getShopSettings,saveShopSettings } from "@/lib/shop-db";
import { validateShopSettings } from "@/lib/shop";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{return NextResponse.json({settings:await getShopSettings()},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"Kampanya ayarları yüklenemedi."},{status:500})}
}
export async function PUT(request:NextRequest){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{
  const data=await request.json(),settings=validateShopSettings(data);
  if(!settings)return NextResponse.json({error:"Ayarları, görsel bağlantısını ve kampanya tarihlerini kontrol edin."},{status:400});
  await saveShopSettings(settings);
  return NextResponse.json({settings},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Kampanya ayarları kaydedilemedi."},{status:500})}
}
