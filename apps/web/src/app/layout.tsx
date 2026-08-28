import type { Metadata } from "next";
import { Manrope, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://forgeai.web.id"),
  title: "ClipForge AI - Auto Viral Clipping",
  description:
    "Ubah Video Panjang Menjadi Klip Viral dalam Hitungan Menit. AI Auto-Clipping, Karaoke Subtitle, Skor Momen Viral, render 9:16 Full HD 1080p.",
  keywords: [
    "auto clipping",
    "clip video viral",
    "ai video editor",
    "subtitel karaoke",
    "shorts tiktok",
    "forgeai",
    "clipforge",
  ],
  openGraph: {
    title: "ClipForge AI - Auto Viral Clipping",
    description:
      "Ubah Video Panjang Menjadi Puluhan Klip Viral dengan AI. Render 9:16 Full HD 1080p tanpa watermark.",
    url: "https://forgeai.web.id",
    siteName: "ClipForge AI",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/logo-cf.jpg", width: 1024, height: 1024, alt: "ClipForge AI" }],
  },
  icons: { icon: "/logo-cf.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
