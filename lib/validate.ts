import { randomUUID } from "node:crypto";
import type { Product,Category } from "./types";
import { calculatePrices } from "./pricing";
const categories:Category[]=["Kuruyemiş","Leblebi","Çekirdek","Kuru Meyve","Karışık"];
export function parseProduct(raw:unknown):Product|null{
 if(!raw||typeof raw!=="object")return null;
 const d=raw as Record<string,unknown>;
 const str=(x:unknown,max:number)=>typeof x==="string"?x.trim().slice(0,max):"";
 const id=str(d.id,90),name=str(d.name,100),slug=str(d.slug,120).toLowerCase();
 if(!name||!slug||!/^[-a-z0-9]+$/.test(slug)||!categories.includes(d.category as Category))return null;
 const image=str(d.image,1500000);
 const validImage=(x:string)=>!x||/^https:\/\//.test(x)||x.startsWith("/")||/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(x);
 if(!validImage(image))return null;
 const extra=Array.isArray(d.images)?d.images:[];
 if(extra.length>3)return null;
 const images=extra.map(x=>str(x,1500000));
 if(images.some(x=>!x||!validImage(x)))return null;
 const rawPrices=d.prices&&typeof d.prices==="object"?d.prices as Record<string,unknown>:{};
 const kgRaw=d.kgPrice!==undefined?d.kgPrice:rawPrices["1000"];
 const kgPrice=kgRaw===""||kgRaw===null||kgRaw===undefined?null:Number(kgRaw);
 if(kgPrice!==null&&(!Number.isFinite(kgPrice)||kgPrice<0||kgPrice>10000000))return null;
 const percent= d.discount5kg===undefined?0:Number(d.discount5kg);
 if(!Number.isFinite(percent)||percent<0||percent>90)return null;
 const prices=calculatePrices(kgPrice,percent);
 const stock=Number(d.stock);
 if(!Number.isSafeInteger(stock)||stock<0||stock>1000000000)return null;
 return {id:id||randomUUID(),name,slug,category:d.category as Category,description:str(d.description,6000),image,images,unit:"g",prices,kgPrice,discount5kg:percent,stock,active:Boolean(d.active),featured:Boolean(d.featured),badge:str(d.badge,26),cardNote:str(d.cardNote,100),origin:str(d.origin,90),roasting:str(d.roasting,90),storageTip:str(d.storageTip,220),ingredients:str(d.ingredients,5000),allergens:str(d.allergens,5000)};
}
