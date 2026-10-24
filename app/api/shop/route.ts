import { NextResponse } from "next/server";
import { getShopSettings } from "@/lib/shop-db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const settings=await getShopSettings();{
  // A published coupon is deliberately visible: shoppers need the actual
  // code, rate and minimum spend to redeem an advertised offer.
  const live=settings.coupon.enabled&&!!settings.coupon.code&&settings.coupon.percent>0;
  const publicCoupon=live?settings.coupon:{enabled:false,code:"",percent:0,minSubtotal:0};
  return NextResponse.json({settings:{...settings,coupon:publicCoupon}},{headers:{"Cache-Control":"no-store"}});
 }}
 catch{return NextResponse.json({error:"Mağaza ayarları yüklenemedi."},{status:503})}
}
