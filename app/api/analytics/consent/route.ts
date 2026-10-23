import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_COOKIE, analyticsCookieOptions, removeVisitorAnalytics, consentToken, isConsented, sameOrigin, validId } from "@/lib/analytics";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 if(!sameOrigin(request))return NextResponse.json({error:"Kaynak doğrulanamadı."},{status:403});
 try{const res=NextResponse.json({ok:true});res.cookies.set(ANALYTICS_COOKIE,consentToken(),analyticsCookieOptions);return res;}
 catch{return NextResponse.json({error:"İzin ayarı tamamlanamadı."},{status:503});}
}
export async function DELETE(request:NextRequest){
 if(!sameOrigin(request))return NextResponse.json({error:"Kaynak doğrulanamadı."},{status:403});
 const approved=isConsented(request);
 try{
  const body=await request.json() as {visitorId?:unknown};
  if(approved&&validId(body?.visitorId))await removeVisitorAnalytics(body.visitorId);
 }catch{}
 const res=NextResponse.json({ok:true});
 res.cookies.set(ANALYTICS_COOKIE,"",{...analyticsCookieOptions,maxAge:0});
 return res;
}
