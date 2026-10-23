import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { analyticsReport } from "@/lib/analytics";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 const days=Number(request.nextUrl.searchParams.get("days")||7);
 if(![7,30,90].includes(days))return NextResponse.json({error:"Geçersiz tarih aralığı."},{status:400});
 try{return NextResponse.json({report:analyticsReport(days),ephemeral:!!process.env.VERCEL},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"Analitik verileri okunamadı."},{status:500});}
}
