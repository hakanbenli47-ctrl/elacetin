import type { Metadata } from "next";
import "./globals.css";
import ConsentAnalytics from "@/components/ConsentAnalytics";

export const metadata: Metadata = {
  title: "Benli Kuruyemiş | Bir Avuç İyi Şey, Bolca Keyif",
  description: "Benli Kuruyemiş'te Antep fıstığı, kaju, fındık, kuru meyve ve karışık çerezleri keşfedin. 250 g, 500 g, 1 kg veya 5 kg seçin; siparişinizi WhatsApp ile tamamlayın.",
  applicationName: "Benli Kuruyemiş",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: "Benli Kuruyemiş",
    description: "Bir avuç iyi şey, bolca keyif. Benli Kuruyemiş ürünlerini keşfedin, gramaj seçin ve siparişinizi kolayca oluşturun.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="tr"><body>{children}<ConsentAnalytics/></body></html>;
}
