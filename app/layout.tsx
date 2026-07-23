import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beuna Jaya Kayu — SPK",
  description: "Sistem Pendukung Keputusan Pemilihan Kayu",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // "en" → "id", tambahkan translate="no" agar Google Translate tidak menerjemahkan
<html lang="id" translate="no">
  <head>
    {/* blokir Google Translate */}
    <meta name="google" content="notranslate" />
  </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}