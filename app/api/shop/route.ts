import { NextResponse } from "next/server";
import { getShopSettings } from "@/lib/shop-db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({settings:await getShopSettings()},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"Mağaza ayarları yüklenemedi."},{status:503})}
}
