/**
 * Küçük, hızlı mağaza görselleri hazırla.
 * Ürün resimleri sunucu veritabanına kaydedildiğinden büyük dosyaları istemcide sıkıştırır.
 */
export async function prepareProductImage(file:File,maximum=900,maxEncoded=250000):Promise<string>{
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw Error("JPG, PNG veya WEBP fotoğraf seçin.");
 if(file.size>10_000_000)throw Error("Fotoğraf en fazla 10 MB olabilir.");
 const src=URL.createObjectURL(file);
 try{
  const img=new Image();
  img.src=src;
  await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("Fotoğraf okunamadı."))});
  if(!img.naturalWidth||!img.naturalHeight)throw Error("Fotoğraf açılamadı.");
  let dimension=maximum;
  for(let attempt=0;attempt<6;attempt++){
   const scale=Math.min(1,dimension/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw Error("Fotoğraf işlenemedi.");
   ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const quality=Math.max(0.46,0.82-attempt*0.07);
   const result=canvas.toDataURL("image/jpeg",quality);
   if(result.length<=maxEncoded)return result;
   dimension=Math.floor(dimension*0.8);
  }
  throw Error("Fotoğraf sıkıştırılamadı. Daha küçük bir fotoğraf seçin.");
 }finally{URL.revokeObjectURL(src)}
}
