import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { removeProduct } from "@/lib/db";
export const runtime="nodejs";
export async function DELETE(request:NextRequest, ctx:{params:Promise<{id:string}>}){
 if(!isAdmin(request))return NextResponse.json({error:"Yetkisiz."},{status:401});
 const {id}=await ctx.params;if(!id)return NextResponse.json({error:"Geçersiz kimlik."},{status:400});
 try{await removeProduct(id);return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Silme işlemi başarısız."},{status:500});}
}
