"use client";
import {useEffect,useState} from "react";
import type {Product} from "@/lib/types";
import "./analytics-admin.css";
type Count={name:string;count:number};
type Report={
 totalViews:number;visitors:number;sessions:number;activeMinutes:number;
 productViews:number;cartAdds:number;checkouts:number;orderRequests:number;interactions:number;
 events:{event:string;page:string;target:string;durationSec:number;at:string;session:string}[];
 pages:Count[];products:Count[];clicks:Count[];daily:{day:string;views:number;visitors:number}[];
};
const actionNames:Record<string,string>={
 page_view:"Sayfa açıldı",click:"Butona / bağlantıya tıklandı",product_view:"Ürün incelendi",
 category_view:"Kategori seçildi",search:"Ürün arandı",add_to_cart:"Sepete eklendi",
 checkout_started:"Sipariş ekranı açıldı",order_requested:"Sipariş talebi oluşturuldu",
 whatsapp_click:"WhatsApp açıldı",active_time:"Aktif süre"
};
const targetNames:Record<string,string>={
 home:"Ana sayfa",giris:"Google giriş",search_button:"Arama butonu",
 cart_open:"Sepet açma",login:"Hesaba giriş",category_nav:"Üst kategori menüsü",
 category_filter:"Kategori filtresi",product_open:"Ürün detay düğmesi",
 product_add:"Sepete ekle",checkout:"Sipariş formu",
 send_order:"WhatsApp'a devam",hero_products:"Ürünlere git",
 hero_about:"Hakkımızda",bulk_order:"Toptan sipariş",whatsapp_contact:"WhatsApp iletişim",
 story_contact:"İletişim",newsletter_products:"Ürünlere git",footer_products:"Alt menü ürünler",
 privacy:"Çerez politikası",cookie_settings:"Çerez ayarları",
 visible:"Aktif sayfa",tumu:"Tümü",kuruyemis:"Kuruyemiş",
 leblebi:"Leblebi",cekirdek:"Çekirdek",karisik:"Karışık",kuru_meyve:"Kuru meyve"
};
function label(target:string,products:Product[]){return products.find(p=>p.slug===target)?.name||targetNames[target]||target.replace(/_/g," ")}
function Bars({items,products,empty="Henüz veri yok."}:{items:Count[];products:Product[];empty?:string}){
 if(!items.length)return <p className="a-empty">{empty}</p>;
 const max=Math.max(...items.map(x=>x.count),1);
 return <div className="a-bars">{items.map(i=><div className="a-bar" key={i.name}><span>{label(i.name,products)}</span><div className="a-track"><i style={{width:Math.max(4,100*i.count/max)+"%"}}/></div><strong>{i.count}</strong></div>)}</div>
}
export default function AnalyticsDashboard({products}:{products:Product[]}){
 const [days,setDays]=useState<7|30|90>(7);
 const [report,setReport]=useState<Report|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [ephemeral,setEphemeral]=useState(false);
 async function load(period:number){
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/admin/analytics?days="+period,{credentials:"same-origin",cache:"no-store"});
   if(!r.ok)throw Error("İstatistikler yüklenemedi.");
   const data=await r.json();setReport(data.report);setEphemeral(Boolean(data.ephemeral));
  }catch(e){setError(e instanceof Error?e.message:"Bağlantı hatası");}finally{setLoading(false)}
 }
 useEffect(()=>{void load(days)},[days]);
 const cards=report?[
  {title:"Onaylı tekil ziyaretçi",value:report.visitors.toLocaleString("tr-TR"),detail:"Yalnızca izin verenler"},
  {title:"Sayfa gösterimi",value:report.totalViews.toLocaleString("tr-TR"),detail:report.sessions+" anonim oturum"},
  {title:"Aktif ziyaret süresi",value:report.activeMinutes+" dk",detail:"Görünür + etkileşimli süre"},
  {title:"Ürün inceleme",value:report.productViews.toLocaleString("tr-TR"),detail:"Ürün detay görüntüleme"},
  {title:"Sepete ekleme",value:report.cartAdds.toLocaleString("tr-TR"),detail:"Ürün ekleme eylemi"},
  {title:"Sipariş formu açma",value:report.checkouts.toLocaleString("tr-TR"),detail:report.orderRequests+" WhatsApp talebi"}
 ]:[];
 return <div className="a-panel">
  <div className="a-header"><div><span>ÇEREZ İZNİ VEREN ZİYARETÇİLER</span><h2>Ziyaretçi analizi</h2><p>Sayfalar, ürünler, tıklamalar ve aktif süre · kimlik bilgisi toplanmaz.</p></div><div className="a-controls"><div className="a-period">{([7,30,90] as const).map(x=><button type="button" className={days===x?"active":""} onClick={()=>setDays(x)} key={x}>{x} gün</button>)}</div><button type="button" className="a-reload" onClick={()=>void load(days)}>↻ Yenile</button></div></div>
  {ephemeral&&<div className="a-notice"><strong>Veri saklama uyarısı:</strong> Vercel&apos;deki yerel SQLite geçicidir. Sunucu yenilendiğinde veya farklı sunucuya yönlendiğinizde istatistikler kaybolabilir. Kalıcı rapor için kalıcı veritabanı gerekir.</div>}
  {error&&<div className="a-notice">{error}</div>}
  {loading?<p className="a-loading">İstatistikler getiriliyor...</p>:report&&<>
  <div className="a-stats">{cards.map(x=><div key={x.title} className="a-stat"><small>{x.title}</small><strong>{x.value}</strong><span>{x.detail}</span></div>)}</div>
  <div className="a-plots"><section className="a-card a-trend"><h3>Günlük ziyaretler</h3>{report.daily.length?<>
   <div className="a-chart">{report.daily.slice(-30).map(x=><div className="a-chart-col" key={x.day} title={x.day+" · "+x.views+" sayfa gösterimi · "+x.visitors+" ziyaretçi"}><div style={{height:Math.max(6,100*x.views/Math.max(...report.daily.map(d=>d.views),1))+"%"}}/><small>{x.day.slice(5)}</small></div>)}</div><p className="a-explain">Grafik: gün bazında sayfa gösterimi</p>
  </>:<p className="a-empty">Henüz analitik izniyle toplanmış veri yok.</p>}</section>
  <section className="a-card"><h3>En çok bakılan ürünler</h3><Bars items={report.products} products={products}/></section>
  <section className="a-card"><h3>En çok açılan sayfalar</h3><Bars items={report.pages} products={products}/></section>
  <section className="a-card"><h3>En çok tıklanan alanlar</h3><Bars items={report.clicks} products={products}/></section>
  </div>
  <section className="a-card a-activity"><div className="a-activity-title"><div><h3>Son ziyaretçi hareketleri</h3><p>Anonim oturum numarası ile listelenir. Gmail, ad, telefon ve arama metni kaydedilmez.</p></div><span>{report.events.length} son olay</span></div>
  <div className="a-scroll"><table><thead><tr><th>Saat</th><th>Olay</th><th>İncelenen / tıklanan</th><th>Sayfa</th><th>Anonim oturum</th></tr></thead><tbody>
  {report.events.map((event,index)=><tr key={event.session+"-"+event.at+"-"+index}><td>{new Date(event.at).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td><td><span className="a-eventname">{actionNames[event.event]||event.event}</span></td><td>{label(event.target,products)||"—"}</td><td>{event.page}</td><td><code>#{event.session}</code></td></tr>)}
  </tbody></table></div>
  {!report.events.length&&<p className="a-empty">Henüz kaydedilmiş ziyaretçi hareketi yok.</p>}
  </section>
  <p className="a-foot">Yalnızca analitik iznini açıkça kabul eden kişiler ölçülür. Reddeden ziyaretçiler bu rapora dahil edilmez. Toplanan anonim olaylar 90 gün sonunda temizlenir.</p>
  </>}
 </div>;
}
