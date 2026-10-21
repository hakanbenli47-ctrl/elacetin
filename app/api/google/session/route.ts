import { NextRequest, NextResponse } from "next/server";
import { customerFromRequest, googleConfigured } from "@/lib/google";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){const session=customerFromRequest(req);return NextResponse.json({configured:googleConfigured,user:session?{name:session.name,email:session.email}:null},{headers:{"Cache-Control":"no-store"}});}
