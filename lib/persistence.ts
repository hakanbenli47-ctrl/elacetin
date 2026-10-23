import "server-only";

const PROJECT = "gdhdfooixtbviilwkxlv";
const KEY = process.env.SUPABASE_SECRET_KEY?.trim() || "";
const PROJECT_URL = `https://${PROJECT}.supabase.co`;
export const isPersistent = Boolean(KEY);
export const isEphemeral = !isPersistent && Boolean(process.env.VERCEL);

type QueryOptions = {method?:"GET"|"POST"|"PATCH"|"DELETE";body?:unknown;prefer?:string};
export async function dbRequest<T>(resource:string,options:QueryOptions={}):Promise<T>{
 if(!KEY)throw Error("Kalıcı veritabanı henüz yapılandırılmadı.");
 if(!/^[a-z_]+(?:\?[a-zA-Z0-9_.!%,*=-]+(?:&[a-zA-Z0-9_.!%,*=-]+)*)?$/.test(resource))throw Error("Veritabanı sorgusu geçersiz.");
 const response=await fetch(`${PROJECT_URL}/rest/v1/${resource}`,{
   method:options.method||"GET",cache:"no-store",headers:{
    "apikey":KEY,
    "Accept":"application/json",
    "Content-Type":"application/json",
    ...(options.prefer?{"Prefer":options.prefer}:{}),
   },
   ...(options.body!==undefined?{body:JSON.stringify(options.body)}:{}),
 });
 if(!response.ok){
  // Secrets and row contents must not appear in user-facing errors.
  throw Error(`Supabase veritabanı hatası (HTTP ${response.status}). Lütfen tabloları ve Vercel SUPABASE_SECRET_KEY ayarını kontrol edin.`);
 }
 if(response.status===204||response.status===205)return undefined as T;
 const raw=await response.text();
 return raw?JSON.parse(raw) as T:undefined as T;
}
