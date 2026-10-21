import { NextRequest, NextResponse } from "next/server";
import { cookieConfig, googleConfigured, oauthCookie, sessionCookie, token, untoken, verifyGoogleIdToken } from "@/lib/google";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const err=(code:string)=>{const r=NextResponse.redirect(new URL("/giris?error="+encodeURIComponent(code),req.url));r.cookies.set(oauthCookie,"",{...cookieConfig,maxAge:0});return r;};
 if(!googleConfigured)return err("kurulum");
 const code=req.nextUrl.searchParams.get("code"),state=req.nextUrl.searchParams.get("state");
 const csrf=untoken<{state:string;nonce:string;verifier:string;exp:number}>(req.cookies.get(oauthCookie)?.value);
 if(!code||!state||!csrf||state!==csrf.state||req.nextUrl.searchParams.get("error"))return err("dogrulama");
 try{
 const redirectUri=new URL("/api/google/callback",req.nextUrl.origin).toString();
 const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,redirect_uri:redirectUri,grant_type:"authorization_code",code_verifier:csrf.verifier}).toString(),cache:"no-store"});
 if(!response.ok)return err("google");
 const tokens=await response.json() as {id_token?:string};if(!tokens.id_token)return err("google");
 const identity=await verifyGoogleIdToken(tokens.id_token,csrf.nonce);
 const res=NextResponse.redirect(new URL("/",req.url));
 res.cookies.set(sessionCookie,token({sub:identity.sub,name:identity.name||identity.email,email:identity.email,exp:Date.now()+7*86400000}),{...cookieConfig,maxAge:7*86400});res.cookies.set(oauthCookie,"",{...cookieConfig,maxAge:0});return res;
 }catch{return err("google");}
}
