import { randomUUID } from "node:crypto";
import type { Product, Category } from "./types";
const categories:Category[]=["Kuruyemiş","Leblebi","Çekirdek","Kuru Meyve","Karışık"];
export function parseProduct(raw:unknown):Product|null{
 if(!raw||typeof raw!=="object")return null;
 const d=raw as Record<string,unknown>;
 const str=(x:unknown,max:number)=>typeof x==="string"?x.trim().slice(0,max):"";
 const id=str(d.id,90),name=str(d.name,100),slug=str(d.slug,120).toLowerCase();
 if(!name||!slug||!/^[-a-z0-9]+$/.test(slug)||!categories.includes(d.category as Category))return null;
 const image=str(d.image,1500000);
 const isDataImage=/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(image);
 if(image&&!/^https:\/\//.test(image)&&!isDataImage&&!image.startsWith("/"))return null;
 if(image.startsWith("data:")&&!isDataImage)return null;
 const prices:Record<string,number|null>={};
 for(const key of ["250","500","1000"]){
 const value=(d.prices as Record<string,unknown>|undefined)?.[key];
 if(value===null||value===undefined||value==="")prices[key]=null;
 else if(typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=10000000)prices[key]=Math.round(value*100)/100;
 else return null;
 }
 const stock=Number(d.stock);
 if(!Number.isSafeInteger(stock)||stock<0||stock>1000000000)return null;
 return {id:id||randomUUID(),name,slug,category:d.category as Category,description:str(d.description,6000),image,images:[],unit:"g",prices,stock,active:Boolean(d.active),featured:Boolean(d.featured),ingredients:str(d.ingredients,5000),allergens:str(d.allergens,5000)};
}
