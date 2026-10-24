import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { findOrder, orderStatuses, saveOrder } from "@/lib/db";
import type {OrderStatus} from "@/lib/types";
import { releaseOrderStock } from "@/lib/stock";
export const runtime="nodejs";
export async function PATCH(request:NextRequest,ctx:{params:Promise<{id:string}>}){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 const {id}=await ctx.params;const existing=await findOrder(id);if(!existing)return NextResponse.json({error:"Talep bulunamadı."},{status:404});
 try{
 const data=await request.json() as {status?:unknown;carrier?:unknown;trackingNo?:unknown;payment?:unknown};
 if(data.status!==undefined){if(!orderStatuses.includes(data.status as OrderStatus))return NextResponse.json({error:"Geçersiz durum."},{status:400});existing.status=data.status as OrderStatus;}
 if(typeof data.carrier==="string")existing.carrier=data.carrier.slice(0,100);
 if(typeof data.trackingNo==="string")existing.trackingNo=data.trackingNo.slice(0,120);
 if(typeof data.payment==="string")existing.payment=data.payment.slice(0,100);
 // A cancelled reservation is returned to available stock only once.
 // Legacy orders without a reservation flag never increase inventory.
 if(existing.status==="iptal"&&existing.stockReserved){
  await releaseOrderStock(existing.items);
  existing.stockReserved=false;
 }
 await saveOrder(existing);return NextResponse.json({order:existing});
 }catch{return NextResponse.json({error:"Talep güncellenemedi."},{status:500});}
}
