# Benli Kuruyemiş

Mobil uyumlu, geniş ekranlı kuruyemiş mağazası; Google ile müşteri oturumu, WhatsApp sipariş talebi, ürün yönetimi, yönetim paneli, sipariş takibi.

## Önemli: Kalıcı veri

Proje yerel bilgisayarda **SQLite** veritabanını `.data/benli.sqlite` dosyasında tutar. **Vercel üzerinde SQLite kalıcı değildir.** Vercel Function konteynerleri ayrı/yeniden başlatılabilir ve `/tmp` içeriği silinebilir. Canlı sitedeki katalog ve sipariş takibi şu aşamada **demo / geçici** amaçlıdır. Gerçek müşterilerden sipariş almadan önce kalıcı veritabanına veya sabit sunucuya geçmelisiniz. Ayrıca ürün fiyatları, stok ve yasal metinleri doğrulayın.

WhatsApp hattı: **0551 555 03 02**. Sipariş talebi önceden kaydedilir ve müşterinin WhatsApp uygulamasına ön-doldurulmuş sipariş metni açılır; **müşterinin mesajı göndermesi gerekir**. WhatsApp üzerinden kesinleşmiş sipariş otomatik olarak tespit edilmez.

## Yerelde çalıştırma

Node.js 24 önerilir.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Site: `http://localhost:3000` • Yönetim: `http://localhost:3000/admin` • Müşteri girişi: `http://localhost:3000/giris`.

Yerel demo admin kullanıcı adı `benli kuruyemiş`, şifre `123456`; canlı sunucuda bu bilgileri doğrudan koda yazmak yerine `ADMIN_USERNAME`, `ADMIN_PASSWORD` ve güçlü `AUTH_SECRET` ortam değişkenleri olarak tanımlayın. 123456 tahmin edilebilir ve **kalıcı kullanım için güvenli değildir**. Admin oturumu sunucu imzalı HttpOnly çerezle korunur.

## Google ile giriş

Google Cloud Console'da **OAuth istemci kimliği** (web uygulaması) oluşturun. `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` ekleyin; izinli yönlendirme adreslerine `https://selinay.vercel.app/api/google/callback` (ya da kullandığınız alan adı) ve yerel test için `http://localhost:3000/api/google/callback` adreslerini tanımlayın. OAuth kimlik doğrulaması gerçek Google imzalı kimlik tokenı üzerinden yapılır. Anahtarlar girilene kadar Google giriş butonu devre dışıdır.

## Ürün yönetimi

Yönetim panelinde ürün ekleme/düzenleme/silme, kategori, 250/500/1000 g fiyatları, stok, görsel URL'si veya küçük görsel yükleme, açıklama, içerik/alerjen alanı ve aktif/öne çıkar ayarı vardır. İlk ürünler örnek vitrindir; fiyatları bilerek boş bırakılmıştır. Yalnızca doğrulanmış ürün ve alerjen bilgileri yayımlayın.

## Sipariş takibi

Sepette gramaj/adet ve mevcutsa ürün toplamı görünür. Müşteri ad-soyad ve telefonunu girip WhatsApp'a yönlendirilir. Yönetimde talep numarası, müşteri, durum, kargo firması/takip numarası ve CSV dışa aktarma yer alır. Kargo bedeli fiyata dahil değildir; satıcı teyit eder. Ödeme entegrasyonu **yoktur**.

## Yayın öncesi kontrol

Mevcut ürün fotoğrafları temsilîdir. Ürün fiyatları, gerçek görselleri, içerikler, alerjenler, iade/mesafeli satış koşulları, ETBİS/gıda bilgilendirmeleri ve gerçek işletme iletişim/adres bilgilerini tamamlayın. Google ile giriş için OAuth bilgilerini bağlayın. Kalıcı veri depolaması olmadan üretim sipariş süreçlerini kullanmayın.
