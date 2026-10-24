"use client";
import {useEffect,useMemo,useState} from "react";
import type {Product,Category} from "@/lib/types";
import {calculatePrices,baseKgPrice} from "@/lib/pricing";
import {prepareProductImage} from "@/lib/client-image";
import type {ShopSettings} from "@/lib/shop";
import {defaultShopSettings} from "@/lib/shop";
import "./commerce-admin.css";
type Props={products:Product[];mode:"bulk"|"settings";onChange:()=>Promise<void>};
type QuickRow={key:number;name:string;kg:string;stock:string;category:Category;discount5kg:string;image:string};
const newQuickRow=(key:number):QuickRow=>({key,name:"",kg:"",stock:"0",category:"Kuruyemiş",discount5kg:"0",image:""});
const categories:Category[]=["Kuruyemiş","Leblebi","Çekirdek","Kuru Meyve","Karışık"];
const format=(n:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(n);
function slugify(value:string){return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9 ]/g,"").trim().replace(/\s+/g,"-")}
function readNumber(value:string):number{
 const x=value.trim().replace(/\s/g,"");
 if(!x)return Number.NaN;
 if(x.includes(",")&&x.includes("."))return Number(x.replace(/\./g,"").replace(",","."));
 if(/^\d{1,3}(\.\d{3})+$/.test(x))return Number(x.replace(/\./g,""));
 return Number(x.replace(",","."));
}
function csvRows(value:string){
 const first=value.split(/\r?\n/)[0]||"";
 const sep=first.includes("\t")?"\t":first.includes(";")?";":",";
 const rows:string[][]=[];let row:string[]=[],item="",quoted=false;
 for(let i=0;i<value.length;i++){
  const ch=value[i];
  if(ch==='"'){
   if(quoted&&value[i+1]==='"'){item+='"';i++}else quoted=!quoted;
  }else if(ch===sep&&!quoted){row.push(item.trim());item=""}
  else if((ch==="\n"||ch==="\r")&&!quoted){
   if(ch==="\r"&&value[i+1]==="\n")i++;
   row.push(item.trim());if(row.some(Boolean))rows.push(row);row=[];item="";
  }else item+=ch;
 }
 row.push(item.trim());if(row.some(Boolean))rows.push(row);
 return rows;
}
function numberField(label:string,value:number,onChange:(n:number)=>void,max=10000000,step="0.01"){
 return <label className="commerce-number">{label}<input type="number" min={0} max={max} step={step} value={value} onChange={e=>onChange(Math.max(0,Number(e.target.value)||0))}/></label>
}
export default function AdminCommerceTools({products,mode,onChange}:Props){
 const [settings,setSettings]=useState<ShopSettings>(defaultShopSettings);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState(""),[error,setError]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const [scope,setScope]=useState("Tümü");
 const [bulkAction,setBulkAction]=useState("pricePercent");
 const [bulkValue,setBulkValue]=useState(0);
 const [priceDraft,setPriceDraft]=useState<Record<string,{kg:string;discount:string}>>({});
 useEffect(()=>setPriceDraft(Object.fromEntries(products.map(p=>[p.id,{kg:baseKgPrice(p)===null?"":String(baseKgPrice(p)),discount:String(p.discount5kg||0)}]))),[products]);
 const [bulkText,setBulkText]=useState("ŞOK FİYAT");
 const [bulkEnabled,setBulkEnabled]=useState(true);
 const [quickRows,setQuickRows]=useState<QuickRow[]>(()=>[newQuickRow(1),newQuickRow(2),newQuickRow(3)]);
 const [quickNext,setQuickNext]=useState(4);
 const [paste,setPaste]=useState("");
 const [preview,setPreview]=useState<{rows:Record<string,unknown>[];errors:string[]} >({rows:[],errors:[]});
 useEffect(()=>{
  fetch("/api/admin/shop",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Ayarlar okunamadı.");setSettings(d.settings)}).catch(e=>setError(e instanceof Error?e.message:"Ayarlar okunamadı")).finally(()=>setLoading(false));
 },[]);
 const visible=useMemo(()=>products.filter(p=>scope==="Tümü"||p.category===scope),[products,scope]);
 const set=(patch:Partial<ShopSettings>)=>setSettings(s=>({...s,...patch}));
 const changeCampaign=(patch:Partial<ShopSettings["campaign"]>)=>setSettings(s=>({...s,campaign:{...s.campaign,...patch}}));
 const changeCoupon=(patch:Partial<ShopSettings["coupon"]>)=>setSettings(s=>({...s,coupon:{...s.coupon,...patch}}));
 const checked=(id:string)=>selected.includes(id);
 function toggle(id:string){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 function selectVisible(){setSelected(prev=>[...new Set([...prev,...visible.map(x=>x.id)])])}
 async function saveSettings(){
  setSaving(true);setError("");setMessage("");
  try{const r=await fetch("/api/admin/shop",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(settings)});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Ayarlar kaydedilemedi.");
   setSettings(d.settings);setMessage("Kampanya ve kargo ayarları kalıcı kaydedildi.");await onChange();
  }catch(e){setError(e instanceof Error?e.message:"Ayarlar kaydedilemedi")}finally{setSaving(false)}
 }
 async function savePriceMatrix(){
  const changes=products.filter(p=>{
   const row=priceDraft[p.id];if(!row)return false;
   const kg=row.kg===""?null:readNumber(row.kg),d=readNumber(row.discount);
   return kg!==baseKgPrice(p)||d!==(p.discount5kg||0);
  }).map(p=>({id:p.id,kgPrice:priceDraft[p.id].kg===""?null:readNumber(priceDraft[p.id].kg),discount5kg:readNumber(priceDraft[p.id].discount)}));
  if(!changes.length){setMessage("Fiyat değişikliği bulunmadı.");return}
  if(changes.some(p=>(p.kgPrice!==null&&(!Number.isFinite(p.kgPrice)||p.kgPrice<0||p.kgPrice>10000000))||!Number.isFinite(p.discount5kg)||p.discount5kg<0||p.discount5kg>90)){setError("Geçersiz kg fiyatı veya 5 kg indirimi var.");return}
  if(!confirm(changes.length+" ürünün kg fiyatı / 5 kg indirimi kaydedilecek. Devam edilsin mi?"))return;
  setSaving(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin/products/bulk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"priceMatrix",rows:changes})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Fiyatlar kaydedilemedi.");
   setMessage(d.updated+" ürünün fiyatları güncellendi.");await onChange();
  }catch(e){setError(e instanceof Error?e.message:"Fiyatlar kaydedilemedi")}finally{setSaving(false)}
 }
 async function applyBulk(){
  if(!selected.length){setError("Önce ürün seçin.");return}
  if(!confirm(selected.length+" ürüne toplu işlem uygulanacak. Devam edilsin mi?"))return;
  setSaving(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin/products/bulk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:bulkAction,ids:selected,value:bulkValue,text:bulkText,enabled:bulkEnabled})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Toplu işlem başarısız.");
   setMessage(d.updated+" ürüne uygulandı."+ (d.skipped?" "+d.skipped+" üründe kg fiyatı olmadığı için atlandı.":""));await onChange();
  }catch(e){setError(e instanceof Error?e.message:"Toplu işlem başarısız")}finally{setSaving(false)}
 }
 function parsePaste(value:string){
  setPaste(value);
  const rows=csvRows(value);
  if(!rows.length){setPreview({rows:[],errors:[]});return}
  const hasHeader=/ürün|urun|name|kg fiyat|fiyat/i.test(rows[0][0]||"");
  const data=(hasHeader?rows.slice(1):rows);
  const result:Record<string,unknown>[]=[],errors:string[]=[];
  data.forEach((x,i)=>{
   const [name,kgStr,stockStr,categoryStr,discountStr,badge,description,image,cardNote]=x;
   if(!name||name.length<2){errors.push((i+1)+". satır: Ürün adı gerekli.");return}
   const kgPrice=readNumber(kgStr||"");
   if(!Number.isFinite(kgPrice)||kgPrice<0){errors.push((i+1)+". satır: Kg fiyatı geçersiz.");return}
   const stock=stockStr?readNumber(stockStr):0;
   if(!Number.isSafeInteger(stock)||stock<0){errors.push((i+1)+". satır: Stok geçersiz.");return}
   const category=categories.includes(categoryStr as Category)?categoryStr as Category:"Kuruyemiş";
   const discount5kg=discountStr?readNumber(discountStr):0;
   if(!Number.isFinite(discount5kg)||discount5kg<0||discount5kg>90){errors.push((i+1)+". satır: 5 kg indirimi %0-90 olmalı.");return}
   result.push({id:"",name:name.trim(),slug:slugify(name),category,kgPrice,discount5kg,prices:calculatePrices(kgPrice,discount5kg),stock,active:true,featured:false,badge:badge||"",description:description||"",image:image||"",cardNote:cardNote||"",ingredients:"",allergens:""});
  });
  if(data.length>150)errors.push("Tek seferde en fazla 150 ürün aktarılabilir.");
  setPreview({rows:result,errors});
 }
 function updateQuickRow(key:number,patch:Partial<QuickRow>){setQuickRows(rows=>rows.map(row=>row.key===key?{...row,...patch}:row))}
 async function addQuickPhoto(key:number,file?:File){
  if(!file)return;
  setError("");
  try{
   const image=await prepareProductImage(file,600,115000);
   updateQuickRow(key,{image});
  }catch(err){setError(err instanceof Error?err.message:"Fotoğraf eklenemedi.")}
 }
 async function saveQuickRows(){
  const rows=quickRows.filter(row=>row.name.trim()||row.kg.trim());
  if(!rows.length){setError("Önce en az bir ürün adı ve kilo fiyatı girin.");return}
  const errors=rows.flatMap((row,index)=>{
   const msgs:string[]=[];
   const price=readNumber(row.kg),stock=Number(row.stock),discount=Number(row.discount5kg);
   if(row.name.trim().length<2)msgs.push("ürün adı");
   if(!Number.isFinite(price)||price<0||price>10000000)msgs.push("kg fiyatı");
   if(!Number.isSafeInteger(stock)||stock<0)msgs.push("stok");
   if(!Number.isFinite(discount)||discount<0||discount>90)msgs.push("5 kg indirimi");
   return msgs.length?[(index+1)+". satır: "+msgs.join(", ")+" kontrol edin."]:[];
  });
  const slugs=rows.map(row=>slugify(row.name));
  if(new Set(slugs).size!==slugs.length)errors.push("Aynı isimli ürünleri iki defa yazdınız.");
  if(errors.length){setError(errors.slice(0,5).join(" "));return}
  if(!confirm(rows.length+" ürün kaydedilecek. Aynı isimli mevcut ürünler varsa güncellenecek. Devam edilsin mi?"))return;
  setSaving(true);setError("");setMessage("");
  try{
   const payload=rows.map(row=>{const kg=readNumber(row.kg),discount=Number(row.discount5kg);return {id:"",name:row.name.trim(),slug:slugify(row.name),category:row.category,kgPrice:kg,discount5kg:discount,prices:calculatePrices(kg,discount),stock:Number(row.stock),active:true,featured:false,badge:"",description:"",image:row.image,cardNote:"",ingredients:"",allergens:""}});
   // Büyük fotoğrafları tek istekte göndermek Vercel'in istek boyutu sınırını aşabilir.
   // Her partinin boyutunu sınırlayarak fotoğrafları ürünlerle birlikte kaydediyoruz.
   let batch:typeof payload=[];let bytes=0;
   const groups:(typeof payload)[]=[];
   for(const product of payload){
    const size=JSON.stringify(product).length;
    if(batch.length&&(batch.length>=12||bytes+size>1_650_000)){groups.push(batch);batch=[];bytes=0}
    batch.push(product);bytes+=size;
   }
   if(batch.length)groups.push(batch);
   let saved=0;
   for(const items of groups){
    const response=await fetch("/api/admin/products/bulk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"import",products:items})});
    const body=await response.json();
    if(!response.ok)throw Error(saved+" ürün kaydedildi; kalanlar kaydedilemedi. "+(body.error||"İşlem başarısız."));
    saved+=body.updated||items.length;
   }
   setMessage(saved+" ürün fotoğraflarıyla birlikte kaydedildi.");
   setQuickRows([newQuickRow(1),newQuickRow(2),newQuickRow(3)]);setQuickNext(4);
   await onChange();
  }catch(e){setError(e instanceof Error?e.message:"Ürünler kaydedilemedi.")}finally{setSaving(false)}
 }
 async function importProducts(){
  if(!preview.rows.length||preview.errors.length){setError("Liste hatalarını giderin.");return}
  if(!confirm(preview.rows.length+" ürün aktarılacak. Aynı URL adına sahip ürünlerin bilgileri güncellenecek. Devam edilsin mi?"))return;
  setSaving(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin/products/bulk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"import",products:preview.rows})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Ürünler aktarılamadı.");
   setMessage(d.updated+" ürün eklendi/güncellendi.");setPaste("");setPreview({rows:[],errors:[]});await onChange();
  }catch(e){setError(e instanceof Error?e.message:"Ürünler aktarılamadı")}finally{setSaving(false)}
 }
 const camp=settings.campaign;
 if(loading)return <div className="commerce-panel">Mağaza ayarları yükleniyor...</div>;
 return <div className="commerce-admin">
  {error&&<div className="commerce-alert error" role="alert">{error}<button type="button" onClick={()=>setError("")}>×</button></div>}
  {message&&<div className="commerce-alert success">{message}</div>}
  {mode==="bulk"?<>
   <div className="commerce-banner"><span>KOLAY TOPLU ÜRÜN EKLEME</span><h2>Ürünleri alt alta yazın, tek seferde kaydedin.</h2><p>Excel dosyası veya özel kod bilmeniz gerekmiyor. Ürün adı, kilogram fiyatı ve stok yeterli.</p></div>
   <section className="commerce-panel commerce-quick-add">
     <div className="commerce-quick-heading"><div><h3>1. Kolay toplu ürün ekle</h3><p>Fotoğrafı seç, ürün adını ve kilogram fiyatını gir. Boş satırlar kaydedilmez; istersen yeni satır ekle.</p></div><span>250 g · 500 g · 5 kg otomatik</span></div>
     <div className="commerce-quick-scroll"><table className="commerce-quick-table"><thead><tr><th>Fotoğraf</th><th>Ürün adı *</th><th>1 kg fiyatı (TL) *</th><th>Stok</th><th>Kategori</th><th>5 kg indirim</th><th></th></tr></thead><tbody>{quickRows.map((row,index)=><tr key={row.key}>
      <td><div className="commerce-quick-photo">{row.image?<><img src={row.image} alt={row.name||"Ürün fotoğrafı"}/><button type="button" className="commerce-photo-remove" aria-label="Fotoğrafı kaldır" title="Kaldır" onClick={()=>updateQuickRow(row.key,{image:""})}>×</button></>:<span className="commerce-photo-placeholder">📷</span>}<label className="commerce-quick-photo-button" title="Ürün fotoğrafı seç">{row.image?"Değiştir":"Ekle"}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label={(index+1)+". ürünün fotoğrafını yükle"} onChange={async e=>{const f=e.target.files?.[0];await addQuickPhoto(row.key,f);e.target.value=""}}/></label></div></td>
      <td><input type="text" aria-label={(index+1)+". ürünün adı"} maxLength={100} placeholder="Örn. Tuzlu Fıstık" value={row.name} onChange={e=>updateQuickRow(row.key,{name:e.target.value})}/></td>
      <td><input type="text" inputMode="decimal" aria-label={(index+1)+". ürünün kg fiyatı"} placeholder="Örn. 800" value={row.kg} onChange={e=>updateQuickRow(row.key,{kg:e.target.value})}/></td>
      <td><input type="number" min={0} aria-label={(index+1)+". ürünün stoğu"} value={row.stock} onChange={e=>updateQuickRow(row.key,{stock:e.target.value})}/></td>
      <td><select aria-label={(index+1)+". ürünün kategorisi"} value={row.category} onChange={e=>updateQuickRow(row.key,{category:e.target.value as Category})}>{categories.map(cat=><option key={cat}>{cat}</option>)}</select></td>
      <td><div className="commerce-discount-field"><input type="number" aria-label={(index+1)+". ürünün 5 kg indirim yüzdesi"} min={0} max={90} value={row.discount5kg} onChange={e=>updateQuickRow(row.key,{discount5kg:e.target.value})}/><span>%</span></div></td>
      <td><button type="button" className="commerce-remove-row" title="Satırı sil" aria-label={(index+1)+". satırı sil"} onClick={()=>setQuickRows(rows=>rows.length===1?[newQuickRow(row.key)]:rows.filter(r=>r.key!==row.key))}>×</button></td>
     </tr>)}</tbody></table></div>
     <div className="commerce-quick-actions"><button type="button" className="commerce-add-row" disabled={quickRows.length>=150} onClick={()=>{setQuickRows(rows=>[...rows,newQuickRow(quickNext)]);setQuickNext(n=>n+1)}}>+ Yeni ürün satırı ekle</button><span>{quickRows.filter(r=>r.name.trim()||r.kg.trim()).length} ürün dolduruldu</span></div>
     <div className="commerce-quick-save"><p>Örneğin kg fiyatı 800 TL → 250 g: 200 TL, 500 g: 400 TL.</p><button type="button" className="commerce-button" disabled={saving||!quickRows.some(r=>r.name.trim()||r.kg.trim())} onClick={saveQuickRows}>{saving?"Kaydediliyor...":"TÜM ÜRÜNLERİ KAYDET"}</button></div>
   </section>
   <details className="commerce-optional-import"><summary>Excel / CSV dosyasından ürün aktarmak istiyorum <small>Gelişmiş alternatif</small></summary>
    <section className="commerce-panel">
    <h3>Excel / CSV ile toplu ürün ekle</h3>
    <p>Excel&apos;de sütun sırası: <b>Ürün adı · Kg fiyatı · Stok · Kategori · 5 kg indirim (%) · Etiket · Açıklama · Görsel URL · Kart kısa notu</b></p>
    <p>Örnek: <code>Kaju;800;35;Kuruyemiş;10;ÇOK SATAN;Taze kavrulmuş kaju;https://...</code></p>
    <div className="commerce-import-actions"><label className="commerce-upload">CSV veya TXT seç<input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>500000){setError("Dosya en fazla 500 KB olabilir.");return}parsePaste(await f.text())}}/></label><button type="button" onClick={()=>parsePaste("")}>Temizle</button></div>
    <textarea className="commerce-paste" value={paste} onChange={e=>parsePaste(e.target.value)} rows={7} placeholder={"Ürün adı;Kg fiyatı;Stok;Kategori;5 kg indirim;Etiket;Açıklama;Görsel URL;Kart kısa notu\nKaju;800;35;Kuruyemiş;10;ÇOK SATAN;Taze kaju;https://...\nÇiğ Badem;700;25;Kuruyemiş;5;FIRSAT ÜRÜNÜ;...;..."}/>
    {!!preview.errors.length&&<div className="commerce-preview-errors">{preview.errors.slice(0,8).map((x,i)=><p key={i}>{x}</p>)}</div>}
    {preview.rows.length>0&&<div className="commerce-preview"><b>{preview.rows.length} ürün hazır.</b><span>250 g, 500 g ve 5 kg fiyatları otomatik hesaplanır.</span><ul>{preview.rows.slice(0,5).map((x,i)=><li key={i}>{String(x.name)} — {format(Number(x.kgPrice))}/kg</li>)}</ul></div>}
    <button className="commerce-button" type="button" disabled={saving||!preview.rows.length||!!preview.errors.length} onClick={importProducts}>{saving?"Kaydediliyor...":"Ürünleri topluca kaydet"}</button>
   </section></details>
   <section className="commerce-panel">
    <h3>2. Mevcut ürünlerin fiyatlarını topluca değiştir</h3>
    <p>Ürünlerin 1 kg fiyatını ve 5 kg indirimini ayrı ayrı değiştirin. Tek bir kaydetme işlemiyle hepsi kalıcı kaydedilir.</p>
    {products.length===0?<p>Henüz ürün eklenmedi.</p>:<div className="commerce-table-scroller"><table className="commerce-price-table"><thead><tr><th>Ürün</th><th>1 kg satış (₺)</th><th>5 kg indirim (%)</th><th>5 kg yeni fiyat</th></tr></thead><tbody>{products.map(p=>{const row=priceDraft[p.id]||{kg:"",discount:"0"};const kg=row.kg===""?null:readNumber(row.kg);const discount=readNumber(row.discount);const value=kg!==null&&Number.isFinite(kg)&&Number.isFinite(discount)?calculatePrices(kg,discount)["5000"]:null;return <tr key={p.id}><td><strong>{p.name}</strong><small>{p.category}</small></td><td><input type="number" min={0} step=".01" value={row.kg} placeholder="Kg fiyatı" onChange={e=>setPriceDraft(s=>({...s,[p.id]:{...row,kg:e.target.value}}))}/></td><td><input type="number" min={0} max={90} step=".5" value={row.discount} onChange={e=>setPriceDraft(s=>({...s,[p.id]:{...row,discount:e.target.value}}))}/></td><td><b>{value===null?"—":format(value)}</b></td></tr>})}</tbody></table></div>}
    <button className="commerce-button" type="button" disabled={saving||!products.length} onClick={savePriceMatrix}>Tüm fiyat değişikliklerini kaydet</button>
   </section>
   <section className="commerce-panel">
    <h3>3. Seçili ürünlere toplu işlem</h3><p>İstediğiniz ürünleri işaretleyin; fiyat, 5 kg indirimi, etiket, vitrin veya satış durumunu tek işlemde değiştirin.</p>
    <div className="commerce-toolbar"><select value={scope} onChange={e=>setScope(e.target.value)}><option>Tümü</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button onClick={selectVisible} type="button">Görünenleri seç</button><button onClick={()=>setSelected([])} type="button">Seçimi temizle</button><strong>{selected.length} seçili</strong></div>
    <div className="commerce-select-grid">{visible.map(p=><label key={p.id} className={checked(p.id)?"checked":""}><input type="checkbox" checked={checked(p.id)} onChange={()=>toggle(p.id)}/><span><b>{p.name}</b><small>{p.category} · {baseKgPrice(p)===null?"Kg fiyatı yok":format(baseKgPrice(p)!)+" / kg"}</small></span></label>)}</div>
    <div className="commerce-action-line"><label>Yapılacak işlem<select value={bulkAction} onChange={e=>setBulkAction(e.target.value)}>
      <option value="pricePercent">Kg fiyatını yüzde artır / azalt</option><option value="fiveKgDiscount">5 kg paket indirimi belirle (%)</option><option value="badge">Ürün etiketini değiştir</option><option value="featured">Vitrinde öne çıkar</option><option value="active">Satışa aç / kapat</option>
     </select></label>
     {["pricePercent","fiveKgDiscount"].includes(bulkAction)?<label>Yüzde<input type="number" value={bulkValue} min={bulkAction==="fiveKgDiscount"?0:-90} max={bulkAction==="fiveKgDiscount"?90:500} step=".5" onChange={e=>setBulkValue(Number(e.target.value))}/></label>:bulkAction==="badge"?<label>Etiket<input maxLength={26} value={bulkText} placeholder="ŞOK FİYAT" onChange={e=>setBulkText(e.target.value)}/></label>:<label>Durum<select value={bulkEnabled?"yes":"no"} onChange={e=>setBulkEnabled(e.target.value==="yes")}><option value="yes">Evet</option><option value="no">Hayır</option></select></label>}
    </div>
    <button type="button" className="commerce-button" disabled={saving||!selected.length} onClick={applyBulk}>{selected.length} ürüne uygula</button>
   </section>
  </>:<>
   <div className="commerce-banner"><span>BENLİ KURUYEMİŞ KAMPANYA MERKEZİ</span><h2>Kampanyayı siz belirleyin, mağaza otomatik uygulasın.</h2><p>Aylık fırsatlar, PTT kargo, sepet indirimleri ve kuponlar tek merkezden yönetilir.</p></div>
   <section className="commerce-panel"><h3>1. Bu ayın kampanya köşesi</h3><p>Başlangıç ve bitiş günleri içinde otomatik yayına girer, tarih geçince otomatik kapanır. Seçtiğiniz ürünlere kampanya indirimi uygulanır.</p>
    <label className="commerce-check"><input type="checkbox" checked={camp.enabled} onChange={e=>changeCampaign({enabled:e.target.checked})}/> Aylık kampanya aktif</label>
    <div className="commerce-fields"><label>Başlık<input value={camp.title} maxLength={90} onChange={e=>changeCampaign({title:e.target.value})}/></label><label>Üst etiket<input value={camp.eyebrow} maxLength={35} onChange={e=>changeCampaign({eyebrow:e.target.value})}/></label><label className="commerce-wide">Kampanya açıklaması<input value={camp.subtitle} maxLength={220} onChange={e=>changeCampaign({subtitle:e.target.value})}/></label><label>Başlangıç<input type="date" value={camp.startDate} onChange={e=>changeCampaign({startDate:e.target.value})}/></label><label>Bitiş<input type="date" value={camp.endDate} onChange={e=>changeCampaign({endDate:e.target.value})}/></label>{numberField("Seçili ürünlerde indirim (%)",camp.percent,n=>changeCampaign({percent:n}),90)}<label className="commerce-wide">Kampanya görseli (isteğe bağlı, https URL)<input value={camp.image} placeholder="https://..." onChange={e=>changeCampaign({image:e.target.value})}/></label></div>
    <div className="commerce-month-actions"><button type="button" onClick={()=>{const now=new Date();const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,"0");changeCampaign({startDate:`${y}-${m}-01`,endDate:`${y}-${m}-${String(new Date(y,now.getMonth()+1,0).getDate()).padStart(2,"0")}`})}}>Bu ayın tarihlerini doldur</button><button type="button" onClick={()=>changeCampaign({productIds:products.map(p=>p.id)})}>Tüm ürünleri dahil et</button><button type="button" onClick={()=>changeCampaign({productIds:[]})}>Ürünleri temizle</button></div>
    <p><b>{camp.productIds.length} ürün</b> kampanyaya dahil. Hiç ürün seçilmezse veya kampanya kapalıysa <b>fırsat köşesinde normal fiyatlar gösterilir, indirim yapılmaz.</b> İndirim yalnızca işaretlediğiniz ürünlerde geçerlidir.</p>
    <div className="commerce-select-grid">{products.map(p=><label key={p.id} className={camp.productIds.includes(p.id)?"checked":""}><input type="checkbox" checked={camp.productIds.includes(p.id)} onChange={()=>changeCampaign({productIds:camp.productIds.includes(p.id)?camp.productIds.filter(x=>x!==p.id):[...camp.productIds,p.id]})}/><span><b>{p.name}</b><small>{p.category}</small></span></label>)}</div>
   </section>
   <section className="commerce-panel"><h3>2. PTT Kargo</h3><p>Buraya PTT&apos;nin size verdiği sabit gönderi tutarını girin. Sitede otomatik eklenir. Ücretsiz kargo eşiği indirimlerden sonra hesaplanır.</p>
    <div className="commerce-fields">{numberField("PTT sabit kargo ücreti (₺)",settings.shippingFee,n=>set({shippingFee:n}))}{numberField("Kaç TL üzeri kargo ücretsiz? (₺)",settings.freeShippingThreshold,n=>set({freeShippingThreshold:n}))}</div>
    <p className="commerce-small">Ücretsiz kargo istemiyorsanız eşik tutarını 0 yapın. Kargo bedeli 0 ise ücretsiz gönderim uygulanır.</p>
   </section>
   <section className="commerce-panel"><h3>3. Otomatik sepet indirimi kapalı</h3>
    <p>Birden çok 1 kg paket veya yüksek tutarlı sepetler için otomatik indirim yapılmaz. Yalnızca müşterinin özellikle <b>5 kg</b> seçtiği ürünlerde, ürün yönetiminden girdiğiniz 5 kg indirimi uygulanır. 2 adet 5 kg alan müşteriye de her paketin indirimi ayrı hesaplanır.</p>
    <p>Fırsat köşesindeki ürünler normal fiyatla görünür. <b>Aylık Kampanya</b> bölümünden indirim oranını belirleyip indirimli ürünleri tek tek seçerek kampanyayı açarsanız sadece o ürünler indirimli olur.</p>
   </section>
   <section className="commerce-panel"><h3>4. İndirim kuponu</h3><p>İndirim yalnızca sizin açtığınız kuponu müşteri sepetinde doğru kodla girerse uygulanır. 5 kg indirimi veya aylık kampanya uygulanmış ürünlere ayrıca kupon indirimi eklenmez.</p>
    <label className="commerce-check"><input type="checkbox" checked={settings.coupon.enabled} onChange={e=>changeCoupon({enabled:e.target.checked})}/> Kupon kullanımı aktif</label>
    <div className="commerce-fields"><label>Kupon kodu<input value={settings.coupon.code} maxLength={25} placeholder="BENLI10" onChange={e=>changeCoupon({code:e.target.value.toLocaleUpperCase("tr-TR")})}/></label>{numberField("Kupon indirimi (%)",settings.coupon.percent,n=>changeCoupon({percent:n}),90)}{numberField("Minimum sepet (₺)",settings.coupon.minSubtotal,n=>changeCoupon({minSubtotal:n}))}</div>
   </section>
   <div className="commerce-save-bar"><span>Değişiklikler yayınlanmadan önce kaydedilmelidir.</span><button type="button" className="commerce-button" disabled={saving} onClick={saveSettings}>{saving?"Kaydediliyor...":"TÜM KAMPANYA VE KARGO AYARLARINI KAYDET"}</button></div>
  </>}
 </div>;
}
