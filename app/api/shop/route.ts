import { NextResponse } from "next/server";
import { getShopSettings } from "@/lib/shop-db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const settings=await getShopSettings();return NextResponse.json({settings:{...settings,coupon:{enabled:settings.coupon.enabled,code:"",percent:0,minSubtotal:0}}},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"Mağaza ayarları yüklenemedi."},{status:503})}
}
