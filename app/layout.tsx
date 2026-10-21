import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/theme/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Benli Kuruyemiş | Lezzetin Doğal Hâli",
  description:
    "Benli Kuruyemiş'in kuruyemiş çeşitlerini keşfedin. Toptan kuruyemiş ticaretindeki birikimimizi dijital vitrinimize taşıyoruz.",
  applicationName: "Benli Kuruyemiş",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Benli Kuruyemiş | Lezzetin Doğal Hâli",
    description: "Benli Kuruyemiş'in ürünlerini ve lezzet dünyasını keşfedin.",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
