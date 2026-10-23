import type { Metadata } from "next";
import Link from "next/link";
import "./policy.css";
export const metadata:Metadata={title:"Çerez ve Gizlilik Politikası | Benli Kuruyemiş",description:"Benli Kuruyemiş internet sitesinin çerez, analitik izin ve kişisel veri işleme açıklamaları."};
export default function CookiePolicy(){return <main className="bn-policy">
 <header><Link href="/">← Benli Kuruyemiş mağazasına dön</Link><span>GİZLİLİK VE ÇEREZLER</span></header>
 <article><span className="bn-eyebrow">BENLİ KURUYEMİŞ</span><h1>Çerez ve gizlilik politikası</h1><p className="bn-date">Güncellenme: 23 Ekim 2026</p>
 <div className="bn-alert"><strong>Bilgilendirme:</strong> Analitik ölçüm yalnızca açıkça izin veren ziyaretçilerde çalışır. İzin vermeden alışverişe devam edebilirsiniz. Sol alttaki Çerez ayarları düğmesinden tercihinizi istediğiniz an değiştirebilirsiniz.</div>
 <section><h2>1. Veri sorumlusu ve iletişim</h2><p>Bu site Benli Kuruyemiş markasına aittir. Gizlilik ve veri işleme talepleriniz için <a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">0551 555 03 02 numaralı WhatsApp hattına</a> ulaşabilirsiniz. İşletmenin resmî unvanı ve tebligat adresi faaliyete geçmeden önce eklenmelidir.</p></section>
 <section><h2>2. Hangi bilgiler işlenir?</h2><p>Ürün ve kategori görüntüleme, isimlendirilmiş bağlantı ve buton tıklamaları, sepete ürün ekleme, sipariş adımlarına geçiş ve yalnızca sayfa açık ve etkin kullanılırken geçen süre; <strong>sadece analitik izni verirseniz</strong> kaydedilir. İstatistiklerde rastgele oluşturulmuş ziyaretçi ve oturum kimlikleri kullanılır; analitik kayıtlara ad, Gmail adresi, telefon, IP adresi, arama metni, yazdığınız form içerikleri veya ödeme bilgileri eklenmez.</p><p>İsteğe bağlı sipariş talebi için verdiğiniz ad, telefon, e-posta ve adres bilgileri ayrı sipariş işleminin parçası olarak kullanılır. Google hesabıyla giriş seçerseniz Google kimlik doğrulama verileri oturum sağlamak için işlenir. Bu işlemler analitik izin tercihinden bağımsızdır.</p></section>
 <section><h2>3. Kullanılan çerezler ve tarayıcı kayıtları</h2><div className="bn-scroll"><table><thead><tr><th>Ad</th><th>Amaç</th><th>Tür / süre</th></tr></thead><tbody>
 <tr><td><code>benli_cookie_choice_v1</code></td><td>Çerez tercihinizi hatırlama</td><td>Tarayıcı kaydı · en fazla 180 gün</td></tr>
 <tr><td><code>benli-cart</code></td><td>Seçtiğiniz ürünleri sepette saklama</td><td>Tarayıcı kaydı · silinene kadar</td></tr>
 <tr><td><code>benli_google</code></td><td>Google kullanıcı oturumu</td><td>Güvenli oturum çerezi · 7 gün</td></tr>
 <tr><td><code>benli_oauth</code></td><td>Google giriş akışı güvenliği</td><td>Güvenli çerez · 10 dakika</td></tr>
 <tr><td><code>benli_admin_session</code></td><td>Yetkili yönetici oturumu</td><td>Güvenli çerez · 12 saat</td></tr>
 <tr><td><code>benli_analytics_consent</code></td><td>Analitik açık rıza durumunu doğrulama</td><td>Güvenli çerez · 180 gün</td></tr>
 <tr><td><code>benli_analytics_visitor_v1</code></td><td>İzinli, anonim ziyaretçileri sayma</td><td>Tarayıcı kaydı · tercih geri alınana kadar</td></tr>
 <tr><td><code>benli_analytics_session_v1</code></td><td>Oturum içinde olayları birleştirme</td><td>Sekme oturumu boyunca</td></tr>
 </tbody></table></div><p>Analitik çerez ve kayıtlar varsayılan olarak kapalıdır; onaylanmadıkça oluşturulmaz.</p></section>
 <section><h2>4. Analitik veriler, hukuki sebep ve saklama</h2><p>Siteyi iyileştirmek amacıyla hazırlanan analitik kayıtlar, <strong>açık rızanıza</strong> dayanır. Üçüncü taraf reklam veya yeniden hedefleme çerezi kullanılmaz. Analitik olaylar en fazla 90 gün saklanacak şekilde otomatik silinir; bazı toplulaştırılmış istatistikler bu süreden önce kaldırılabilir.</p><p>İzin vermediğinizde davranış analizi çalışmaz. İzni geri aldığınızda bu tarayıcıya ait analitik ziyaretçi kimliği kaldırılır; mevcut ziyaretçi kimliğine bağlı analitik kayıtların silinmesi de talep edilir.</p></section>
 <section><h2>5. Kimler erişir?</h2><p>Toplu istatistikler ve anonim oturum olayları yalnızca yetkili yönetim panelinde gösterilir. Siteyi barındıran Vercel gibi teknik hizmet sağlayıcılar, uygulamanın çalışması kapsamında bazı teknik bağlantı kayıtlarını ayrıca işleyebilir. Veri aktarımları ve yurt dışı altyapısı yürürlükteki mevzuat açısından ayrıca değerlendirilmelidir.</p></section>
 <section><h2>6. Tercihleriniz ve haklarınız</h2><p>Sayfanın sol altındaki <strong>Çerez ayarları</strong> düğmesine basarak analitik iznini dilediğiniz zaman reddedebilir veya yeniden verebilirsiniz. Kişisel verileriniz hakkında bilgi edinme, düzeltme veya silinmesini talep etme gibi KVKK kapsamındaki haklarınız için işletme iletişim hattından bize ulaşabilirsiniz.</p></section>
 <p className="bn-policy-note">Bu metin sitenin mevcut teknik işleyişini açıklar. İşletmenin resmî kimliği, tüm tedarikçiler, aktarım koşulları ve saklama süreleri satışa geçmeden önce hukuki değerlendirme ile tamamlanmalıdır.</p></article>
 </main>}
