import type { Product,OrderItem } from "./types";
import { priceFor,undiscountedFiveKg,roundMoney } from "./pricing";
export type ShopSettings={
 shippingFee:number;freeShippingThreshold:number;
 basketDiscountThreshold:number;basketDiscountPercent:number;
 coupon:{enabled:boolean;code:string;percent:number;minSubtotal:number};
 campaign:{enabled:boolean;title:string;subtitle:string;eyebrow:string;image:string;startDate:string;endDate:string;percent:number;productIds:string[]};
};
export const defaultShopSettings:ShopSettings={
 shippingFee:0,freeShippingThreshold:0,
 basketDiscountThreshold:0,basketDiscountPercent:0,
 coupon:{enabled:false,code:"",percent:0,minSubtotal:0},
 campaign:{enabled:false,title:"AYIN FIRSATLARI",subtitle:"Bu aya özel seçili lezzetler.",eyebrow:"AYLIK KAMPANYA",image:"",startDate:"",endDate:"",percent:0,productIds:[]}
};
const numeric=(x:unknown,max:number)=>typeof x==="number"&&Number.isFinite(x)?Math.max(0,Math.min(max,x)):0;
const s=(x:unknown,n:number)=>typeof x==="string"?x.trim().slice(0,n):"";
const date=(x:unknown)=>{const v=s(x,10);return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))?v:""};
export function validateShopSettings(raw:unknown):ShopSettings|null{
 if(!raw||typeof raw!=="object")return null;
 const v=raw as Record<string,unknown>,c=(v.coupon||{}) as Record<string,unknown>,m=(v.campaign||{}) as Record<string,unknown>;
 const image=s(m.image,700);
 if(image&&!/^https:\/\//.test(image)&&!image.startsWith("/"))return null;
 const startDate=date(m.startDate),endDate=date(m.endDate);
 if((startDate&&!endDate)||(!startDate&&endDate)||(startDate&&endDate&&startDate>endDate))return null;
 const productIds=Array.isArray(m.productIds)?[...new Set(m.productIds.filter((a):a is string=>typeof a==="string"&&a.length<=90))].slice(0,300):[];
 return {shippingFee:roundMoney(numeric(v.shippingFee,100000)),freeShippingThreshold:roundMoney(numeric(v.freeShippingThreshold,100000000)),
 basketDiscountThreshold:roundMoney(numeric(v.basketDiscountThreshold,100000000)),basketDiscountPercent:roundMoney(numeric(v.basketDiscountPercent,90)),
 coupon:{enabled:Boolean(c.enabled),code:s(c.code,25).toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9_-]/g,""),percent:roundMoney(numeric(c.percent,90)),minSubtotal:roundMoney(numeric(c.minSubtotal,100000000))},
 campaign:{enabled:Boolean(m.enabled),title:s(m.title,90),subtitle:s(m.subtitle,220),eyebrow:s(m.eyebrow,35),image,startDate,endDate,percent:roundMoney(numeric(m.percent,90)),productIds}};
}
export function istanbulDate(){return new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Europe/Istanbul"}).format(new Date()).replace(/\//g,"-")}
export function campaignActive(shop:ShopSettings){const m=shop.campaign,now=istanbulDate();return m.enabled&&!!m.startDate&&!!m.endDate&&m.startDate<=now&&now<=m.endDate}
export type QuoteInput={productId:string;weight:string;qty:number};
export type CheckoutQuote={
 items:OrderItem[];subtotal:number|null;originalSubtotal:number|null;packageDiscount:number;campaignDiscount:number;basketDiscount:number;discountReason:string;
 shippingFee:number|null;total:number|null;freeShipping:boolean;couponApplied:boolean;
};
export function quoteCart(lines:QuoteInput[],products:Product[],shop:ShopSettings,couponCode=""):CheckoutQuote{
 const campaign=campaignActive(shop)?shop.campaign:null;
 let packageDiscount=0,campaignDiscount=0,eligibleSubtotal=0;
 // One product-level discount per line. In particular, the 5 kg package price is
 // already reduced; never apply the monthly campaign or basket/coupon twice to it.
 const items:OrderItem[]=lines.flatMap((l):OrderItem[]=>{
  const p=products.find(x=>x.id===l.productId);if(!p)return [];
  const packagePrice=priceFor(p,l.weight);
  const original=l.weight==="5000"?undiscountedFiveKg(p):packagePrice;
  if(packagePrice===null||original===null){
   return [{productId:p.id,name:p.name,weight:l.weight,qty:l.qty,unitPrice:null,subtotal:null,originalUnitPrice:null,discountType:null,discountAmount:0}];
  }
  const packageReduction=roundMoney(Math.max(0,original-packagePrice));
  const campaignReduction=packageReduction===0&&campaign&&campaign.productIds.includes(p.id)
   ?roundMoney(packagePrice*campaign.percent/100):0;
  const reduction=packageReduction||campaignReduction;
  packageDiscount=roundMoney(packageDiscount+packageReduction*l.qty);
  campaignDiscount=roundMoney(campaignDiscount+campaignReduction*l.qty);
  if(reduction===0)eligibleSubtotal=roundMoney(eligibleSubtotal+packagePrice*l.qty);
  const unit=roundMoney(Math.max(0,packagePrice-campaignReduction));
  return [{productId:p.id,name:p.name,weight:l.weight,qty:l.qty,unitPrice:unit,
   subtotal:roundMoney(unit*l.qty),originalUnitPrice:original,
   discountType:packageReduction>0?"package":campaignReduction>0?"campaign":null,
   discountAmount:roundMoney(reduction*l.qty)}];
 });
 const subtotal=items.length>0&&items.every(i=>i.subtotal!==null)?roundMoney(items.reduce((n,i)=>n+(i.subtotal||0),0)):null;
 const originalSubtotal=items.length>0&&items.every(i=>i.originalUnitPrice!==null)
  ?roundMoney(items.reduce((n,i)=>n+(i.originalUnitPrice||0)*i.qty,0)):null;
 let basketDiscount=0,discountReason="",couponApplied=false;
 if(subtotal!==null&&eligibleSubtotal>0){
  // Thresholds use the payable product subtotal. Discount percentages apply only
  // to otherwise full-price items; already-discounted 5 kg packs are excluded.
  const eligible=shop.basketDiscountPercent>0&&shop.basketDiscountThreshold>0&&subtotal>=shop.basketDiscountThreshold;
  if(eligible){basketDiscount=roundMoney(eligibleSubtotal*shop.basketDiscountPercent/100);discountReason="Sepet indirimi"}
  const validCoupon=shop.coupon.enabled&&shop.coupon.percent>0&&!!shop.coupon.code&&couponCode.trim().toLocaleUpperCase("tr-TR")===shop.coupon.code&&subtotal>=shop.coupon.minSubtotal;
  const couponDiscount=validCoupon?roundMoney(eligibleSubtotal*shop.coupon.percent/100):0;
  if(couponDiscount>basketDiscount){basketDiscount=couponDiscount;discountReason="Kupon indirimi";couponApplied=true}
  else if(validCoupon&&couponDiscount===basketDiscount&&couponDiscount>0){discountReason="Kupon indirimi";couponApplied=true}
 }
 const amount=subtotal===null?null:Math.max(0,roundMoney(subtotal-basketDiscount));
 const freeShipping=amount!==null&&shop.freeShippingThreshold>0&&amount>=shop.freeShippingThreshold;
 const shippingFee=amount===null?null:freeShipping?0:shop.shippingFee;
 const total=amount===null||shippingFee===null?null:roundMoney(amount+shippingFee);
 return {items,subtotal,originalSubtotal,packageDiscount,campaignDiscount,basketDiscount,discountReason,shippingFee,total,freeShipping,couponApplied};
}
