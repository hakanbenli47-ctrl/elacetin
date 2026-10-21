import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Benli Kuruyemiş | Lezzetin En Doğal Hâli",
  description: "Benli Kuruyemiş'in yeni dijital vitrini. Kuruyemiş, leblebi, çekirdek ve karışık kuruyemiş çeşitlerini keşfedin.",
  applicationName: "Benli Kuruyemiş",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: "Benli Kuruyemiş",
    description: "Toptan kuruyemiş ticaretindeki tecrübemiz şimdi yeni dijital vitrinimizde.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="tr"><body>{children}</body></html>;
}
