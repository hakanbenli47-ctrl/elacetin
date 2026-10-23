import { NextRequest, NextResponse } from "next/server";
import { googleConfigured, newChallenge, oauthCookie, cookieConfig, token } from "@/lib/google";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!googleConfigured)return NextResponse.redirect(new URL("/giris?error=kurulum",req.url));
 const t=newChallenge();const redirectUri=process.env.GOOGLE_REDIRECT_URI||new URL("/api/google/callback",req.nextUrl.origin).toString();
 const params=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,redirect_uri:redirectUri,response_type:"code",scope:"openid email profile",state:t.state,nonce:t.nonce,code_challenge:t.challenge,code_challenge_method:"S256",prompt:"select_account"});
 const res=NextResponse.redirect("https://accounts.google.com/o/oauth2/v2/auth?"+params.toString());res.cookies.set(oauthCookie,token({state:t.state,nonce:t.nonce,verifier:t.verifier,exp:Date.now()+10*60*1000}),{...cookieConfig,maxAge:600});return res;
}
