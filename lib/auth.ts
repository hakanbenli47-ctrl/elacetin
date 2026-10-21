import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
const isProd = process.env.NODE_ENV === "production";
export const adminUser = process.env.ADMIN_USERNAME || (isProd ? "" : "benli kuruyemiş");
const adminPass = process.env.ADMIN_PASSWORD || (isProd ? "" : "123456");
const secret = process.env.AUTH_SECRET || (isProd ? "" : "benli-local-development-only-do-not-use-in-production");
const COOKIE = "benli_admin_session";
export const adminConfigured = Boolean(adminUser && adminPass && secret);
export function cookieName(){return COOKIE;}
export function verifyCredentials(user: string, pass: string):boolean {
 if (!adminConfigured) return false;
 return safeCompare(user.trim().toLocaleLowerCase("tr-TR"),adminUser.toLocaleLowerCase("tr-TR")) && safeCompare(pass,adminPass);
}
function safeCompare(a:string,b:string):boolean{
 const aa=crypto.createHash("sha256").update(a).digest();const bb=crypto.createHash("sha256").update(b).digest();
 return crypto.timingSafeEqual(aa,bb);
}
function hmac(message:string){return crypto.createHmac("sha256",secret).update(message).digest("base64url");}
export function signAdminSession(){
 if(!adminConfigured) throw new Error("Admin erişimi tanımlanmamış");
 const payload=Buffer.from(JSON.stringify({role:"admin",exp:Date.now()+12*60*60*1000})).toString("base64url");
 return payload+"."+hmac(payload);
}
export function isAdmin(request:NextRequest):boolean{
 if(!adminConfigured)return false;
 const token=request.cookies.get(COOKIE)?.value;if(!token)return false;
 const [payload,signature]=token.split(".");
 if(!payload||!signature||!safeCompare(signature,hmac(payload)))return false;
 try{const value=JSON.parse(Buffer.from(payload,"base64url").toString("utf-8")) as {role?:string;exp?:number};return value.role==="admin"&&typeof value.exp==="number"&&value.exp>Date.now();}catch{return false}
}
export function cookieOptions(){return {httpOnly:true,secure:isProd,sameSite:"lax" as const,path:"/",maxAge:12*3600};}
