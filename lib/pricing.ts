import type { Product } from "./types";
export const weightOptions=["250","500","1000","5000"] as const;
export function weightLabel(weight:string){return weight==="5000"?"5 kg":weight==="1000"?"1 kg":weight+" g"}
export function roundMoney(v:number){return Math.round((v+Number.EPSILON)*100)/100}
export function baseKgPrice(p:Product):number|null{
 const kg=p.kgPrice??p.prices?.["1000"]??null;
 return typeof kg==="number"&&Number.isFinite(kg)&&kg>=0?kg:null;
}
export function calculatePrices(kg:number|null,discount5=0):Record<string,number|null>{
 if(kg===null)return {"250":null,"500":null,"1000":null,"5000":null};
 const d=Math.max(0,Math.min(90,discount5));
 return {"250":roundMoney(kg/4),"500":roundMoney(kg/2),"1000":roundMoney(kg),"5000":roundMoney(kg*5*(1-d/100))};
}
export function priceFor(p:Product,weight:string):number|null{
 if(weight==="5000"){const kg=baseKgPrice(p);return kg===null?null:calculatePrices(kg,p.discount5kg||0)["5000"];}
 return p.prices?.[weight]??null;
}
export function undiscountedFiveKg(p:Product):number|null{const kg=baseKgPrice(p);return kg===null?null:roundMoney(kg*5)}

/** Shopper-facing price must match the server quote: a discounted 5 kg pack
 * never receives the monthly campaign discount a second time. */
export function discountedProductPrice(p:Product,weight:string,campaignPercent=0):number|null{
 const packagePrice=priceFor(p,weight);
 if(packagePrice===null)return null;
 const hasPackageDiscount=weight==="5000"&&undiscountedFiveKg(p)!==null&&(undiscountedFiveKg(p) as number)>packagePrice;
 const percent=hasPackageDiscount?0:Math.max(0,Math.min(90,campaignPercent));
 return roundMoney(packagePrice*(1-percent/100));
}
