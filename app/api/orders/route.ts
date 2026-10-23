import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listOrders, productById, saveOrder, ephemeral } from "@/lib/db";
import type { Order, OrderItem } from "@/lib/types";
export const runtime="nodejs";export const dynamic="force-dynamic";
const rate=new Map<string,{count:number;time:number}>();
export async function GET(request:NextRequest){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 try{return NextResponse.json({orders:await listOrders(),ephemeral},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Siparişler yüklenemedi."},{status:500})}
}
export async function POST(request:NextRequest){
 const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";const now=Date.now();
 const prev=rate.get(ip);const curr=prev&&now-prev.time<3600000?prev:{count:0,time:now};
 if(curr.count>=12)return NextResponse.json({error:"Çok sık sipariş talebi gönderildi."},{status:429});
 try{
 const data=await request.json() as {name?:unknown;phone?:unknown;email?:unknown;address?:unknown;note?:unknown;items?:unknown;payment?:unknown};
 const str=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
 const name=str(data.name,90);const phone=str(data.phone,30);const email=str(data.email,140);const address=str(data.address,500);const note=str(data.note,400);const payment=str(data.payment,50);
 if(name.length<2||!/^[+0-9\s()-]{10,20}$/.test(phone)||!Array.isArray(data.items)||data.items.length<1||data.items.length>35)return NextResponse.json({error:"Ad, telefon ve sepet bilgilerini kontrol edin."},{status:400});
 const items:OrderItem[]=[];
 for(const raw of data.items){
 if(!raw||typeof raw!=="object")return NextResponse.json({error:"Geçersiz sepet."},{status:400});
 const line=raw as {productId?:unknown;weight?:unknown;qty?:unknown};
 if(typeof line.productId!=="string"||!["250","500","1000"].includes(String(line.weight))||!Number.isInteger(line.qty)||Number(line.qty)<1||Number(line.qty)>99)return NextResponse.json({error:"Gramaj veya adet geçersiz."},{status:400});
 const product=await productById(line.productId);if(!product||!product.active)return NextResponse.json({error:"Sepette bulunamayan veya satış dışı ürün var."},{status:400});
 if(product.stock < Number(line.qty))return NextResponse.json({error:product.name+" için yeterli stok yok."},{status:400});
 const unitPrice=product.prices[String(line.weight)]??null;
 items.push({productId:product.id,name:product.name,weight:String(line.weight),qty:Number(line.qty),unitPrice,subtotal:unitPrice===null?null:Math.round(unitPrice*Number(line.qty)*100)/100});
 }
 const total=items.every(i=>i.subtotal!==null)?Math.round(items.reduce((sum,i)=>sum+(i.subtotal||0),0)*100)/100:null;
 const order:Order={id:"BN-"+crypto.randomUUID().slice(0,8).toUpperCase(),createdAt:new Date().toISOString(),name,phone,email,address,note,status:"whatsapp_bekleniyor",items,total,carrier:"",trackingNo:"",payment:payment||"WhatsApp ile görüşülecek",source:"web"};
 await saveOrder(order);curr.count++;rate.set(ip,curr);
 return NextResponse.json({orderId:order.id,total,ephemeral},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Talep oluşturulamadı. Daha sonra tekrar deneyin."},{status:500});}
}
