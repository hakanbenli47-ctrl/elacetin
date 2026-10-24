import type { Product,Category } from "./types";
import { calculatePrices } from "./pricing";

/**
 * 24.10.2026 tarihli kullanıcı yüklemesi: benli-urunler.csv
 * Fiyat, stok, ürün adı ve kategori birebir dosyadan alınmıştır.
 * Fotoğraflar Pexels temsilî stok fotoğraflarıdır, gerçek stok görselleri değildir.
 * Menü metinleri genel tanıtımdır; ürünün üretim koşulları veya kaynağı hakkında iddia içermez.
 */
type CatalogInput={id:string;name:string;category:Category;kg:number;imageId:number;gallery?:number[];description:string;cardNote:string;ingredients:string;allergens:string};
const photo=(id:number)=>`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=850`;
const items:CatalogInput[]=[
 {id:"antep-fistigi",name:"Antep Fıstığı",category:"Kuruyemiş",kg:1200,imageId:10111950,gallery:[5425015],description:"Antep fıstığının kendine has aroması ve çıtır dokusunu sevenler için klasik bir atıştırmalık. Çay saatlerinde, ikramlık tabaklarda ve kuruyemiş karışımlarında tercih edilebilir.",cardNote:"Klasik Antep fıstığı lezzeti",ingredients:"Antep fıstığı. Tuzlama ve diğer bileşen bilgileri işletme tarafından teyit edilmelidir.",allergens:"Antep fıstığı içerir (sert kabuklu yemiş)."},
 {id:"ay-cekirdegi",name:"Ay Çekirdeği",category:"Kuruyemiş",kg:130,imageId:10111951,gallery:[10111742],description:"Sohbetlerin, film akşamlarının ve keyifli molaların vazgeçilmez eşlikçisi ay çekirdeği. Gramaj seçenekleri arasından ihtiyacınıza uygun paketi seçebilirsiniz.",cardNote:"Sohbetlerin vazgeçilmezi",ingredients:"Ay çekirdeği. Tuz ve diğer bileşenler için ambalaj bilgisi teyit edilmelidir.",allergens:"Olası çapraz temas ve kesin alerjen bilgileri işletme tarafından kontrol edilmelidir."},
 {id:"tuzlu-iri-fistik",name:"Tuzlu İri Fıstık",category:"Kuruyemiş",kg:200,imageId:10111745,gallery:[35237494],description:"Tuzlu iri fıstık, belirgin fıstık tadını sevenlerin atıştırmalık seçeneği. Tek başına tüketim veya kuruyemiş tabağı hazırlamak için tercih edilebilir.",cardNote:"Tuzlu ve iri taneli fıstık",ingredients:"Yer fıstığı ve tuz (ürün bileşimi işletme tarafından teyit edilmelidir).",allergens:"Yer fıstığı içerir."},
 {id:"sari-uzum",name:"Sarı Üzüm",category:"Kuru Meyve",kg:200,imageId:31508567,gallery:[6086004],description:"Sarı kuru üzüm, kendine özgü tatlı aromasıyla günlük ara öğünlerde ve tariflerde kullanılabilir. Atıştırmalık tabaklarına ve farklı kuruyemiş kombinasyonlarına uyum sağlar.",cardNote:"Doğal meyve aromalı kuru üzüm",ingredients:"Kuru üzüm. Koruyucu ve diğer bileşen bilgileri ürün etiketinden teyit edilmelidir.",allergens:"Sülfit/kükürtdioksit kullanımı ve olası çapraz temas bilgisi işletme tarafından kontrol edilmelidir."},
 {id:"findik",name:"Fındık",category:"Kuruyemiş",kg:890,imageId:10111849,gallery:[13667596],description:"Fındık, yoğun aroması ve kendine has dokusuyla kuruyemiş tabağında ya da tatlı tariflerinde kullanılabilecek sevilen bir seçenektir. Farklı gramajlarda satışa sunulur.",cardNote:"Aromasıyla öne çıkan klasik lezzet",ingredients:"Fındık. Kavurma ve diğer bileşen bilgileri işletme tarafından teyit edilmelidir.",allergens:"Fındık içerir (sert kabuklu yemiş)."},
 {id:"kaju",name:"Kaju",category:"Kuruyemiş",kg:850,imageId:4663476,gallery:[5472144],description:"Kaju, kendine has kavisli şekli ve yumuşak-çıtır dokusuyla sevilen kuruyemiş çeşitlerinden biridir. Atıştırmalık veya farklı karışımlarda tercih edilebilir.",cardNote:"Özgün aromalı kaju",ingredients:"Kaju. Tuzlama ve işleme bilgileri işletme tarafından teyit edilmelidir.",allergens:"Kaju içerir (sert kabuklu yemiş)."},
 {id:"kudus-hurmasi",name:"Kudüs Hurması",category:"Kuru Meyve",kg:750,imageId:15913423,gallery:[20632756],description:"Hurma, kendine özgü yoğun ve tatlı meyve aromasıyla özellikle çay sofralarında ve ara öğünlerde tercih edilir. Ürün çeşidi ve menşei işletme tarafından ayrıca doğrulanmalıdır.",cardNote:"Tatlı aromalı hurma",ingredients:"Hurma. Ürünün tam çeşidi ve varsa diğer bileşenleri ambalajdan teyit edilmelidir.",allergens:"İşleme ve paketleme kaynaklı olası çapraz temas bilgisi teyit edilmelidir."},
 {id:"lux-karisik-cerez",name:"Lüx Karışık Çerez",category:"Karışık",kg:980,imageId:5472169,gallery:[86649],description:"Birden fazla kuruyemiş çeşidini bir arada sunan karışık çerez seçeneği. Misafir ikramları, aile sofraları ve farklı tatları bir arada denemek isteyenler için.",cardNote:"Farklı lezzetler bir arada",ingredients:"Karışım içeriği ve türlerin oranları işletme tarafından teyit edilmelidir.",allergens:"Yer fıstığı, sert kabuklu yemişler ve diğer alerjenleri içerebilir. Kesin liste doğrulanmalıdır."},
 {id:"orta-karisik-cerez",name:"Orta Karışık Çerez",category:"Karışık",kg:800,imageId:86649,gallery:[5507691],description:"Günlük atıştırmalıklar ve ikram tabakları için karışık kuruyemiş seçeneği. Karışımın içindeki türler ve oranları işletme tarafından doğrulanmalıdır.",cardNote:"Günlük ikramlar için karışık çerez",ingredients:"Karışım içeriği ve oranları işletme tarafından teyit edilmelidir.",allergens:"Yer fıstığı, sert kabuklu yemişler ve diğer alerjenleri içerebilir. Kesin liste doğrulanmalıdır."}
];
const slug=(name:string)=>name.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9 ]/g,"").trim().replace(/\s+/g,"-");
export const uploadedCatalog:Product[]=items.map((v,i)=>({
 id:v.id,name:v.name,slug:slug(v.name),category:v.category,
 description:v.description,cardNote:v.cardNote,
 image:photo(v.imageId),images:(v.gallery||[]).map(photo),
 prices:calculatePrices(v.kg,0),kgPrice:v.kg,discount5kg:0,
 stock:50,active:true,featured:i<4,unit:"g",badge:"",origin:"",roasting:"",
 storageTip:"Güneş ışığından uzak, serin ve kuru yerde, ağzı kapalı şekilde saklayınız.",
 ingredients:v.ingredients,allergens:v.allergens
}));
