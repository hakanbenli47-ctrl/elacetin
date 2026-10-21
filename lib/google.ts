import "server-only";
import { createHmac, createHash, createPublicKey, randomBytes, verify, timingSafeEqual } from "node:crypto";
import type { JsonWebKey } from "node:crypto";
import type { NextRequest } from "next/server";
export const googleConfigured=Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.AUTH_SECRET);
export const sessionCookie="benli_google";
export const oauthCookie="benli_oauth";
export const cookieConfig={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/"};
function signature(message:string){const secret=process.env.AUTH_SECRET;if(!secret)throw new Error("AUTH_SECRET tanımlanmamış");return createHmac("sha256",secret).update(message).digest("base64url");}
function safe(a:string,b:string){const aa=createHash("sha256").update(a).digest(),bb=createHash("sha256").update(b).digest();return timingSafeEqual(aa,bb);}
export function token(value:object){const body=Buffer.from(JSON.stringify(value)).toString("base64url");return body+"."+signature(body);}
export function untoken<T>(raw?:string):T|null{
 if(!raw||!process.env.AUTH_SECRET)return null;
 const [payload,sign]=raw.split(".");if(!payload||!sign||!safe(signature(payload),sign))return null;
 try{const d=JSON.parse(Buffer.from(payload,"base64url").toString("utf-8")) as {exp?:number};return typeof d.exp==="number"&&d.exp>Date.now()?d as T:null;}catch{return null;}
}
export type Customer={sub:string;name:string;email:string;exp:number};
export function customerFromRequest(req:NextRequest){return untoken<Customer>(req.cookies.get(sessionCookie)?.value);}
export function newChallenge(){const state=randomBytes(24).toString("base64url"),nonce=randomBytes(24).toString("base64url"),verifier=randomBytes(32).toString("base64url");const challenge=createHash("sha256").update(verifier).digest("base64url");return {state,nonce,verifier,challenge};}
type GoogleJWT={iss:string;aud:string;exp:number;iat:number;nonce?:string;sub:string;name?:string;email:string;email_verified?:boolean};
export async function verifyGoogleIdToken(jwt:string,nonce:string):Promise<GoogleJWT>{
 const parts=jwt.split(".");if(parts.length!==3)throw new Error("Google doğrulama yanıtı geçersiz");
 const header=JSON.parse(Buffer.from(parts[0],"base64url").toString()) as {alg:string;kid:string};
 if(header.alg!=="RS256"||!header.kid)throw new Error("Desteklenmeyen Google imzası");
 const result=await fetch("https://www.googleapis.com/oauth2/v3/certs",{cache:"no-store"});
 if(!result.ok)throw new Error("Google anahtarları alınamadı");
 const keys=await result.json() as {keys:Array<{kid:string;kty:string;[key:string]:unknown}>};
 const jwk=keys.keys.find(k=>k.kid===header.kid&&k.kty==="RSA");if(!jwk)throw new Error("Google imza anahtarı bulunamadı");
 const key=createPublicKey({key:jwk as unknown as JsonWebKey,format:"jwk"});
 if(!verify("RSA-SHA256",Buffer.from(parts[0]+"."+parts[1]),key,Buffer.from(parts[2],"base64url")))throw new Error("Google imzası geçersiz");
 const p=JSON.parse(Buffer.from(parts[1],"base64url").toString()) as GoogleJWT;
 if(!["https://accounts.google.com","accounts.google.com"].includes(p.iss)||p.aud!==process.env.GOOGLE_CLIENT_ID||p.exp*1000<Date.now()||p.iat*1000>Date.now()+60000||p.nonce!==nonce||!p.email_verified||!p.sub||!p.email)throw new Error("Google oturum bilgileri geçersiz");
 return p;
}
