import {NextResponse} from "next/server";
import {sessionCookie,cookieConfig} from "@/lib/google";
export async function POST(){const res=NextResponse.json({ok:true});res.cookies.set(sessionCookie,"",{...cookieConfig,maxAge:0});return res;}
