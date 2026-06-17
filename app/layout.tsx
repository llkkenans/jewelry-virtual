import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: 'Lunia Studio — Yapay Zeka ile Takı Görselleştirme',
  description: 'Pahalı stüdyo çekimi olmadan, takı fotoğraflarınızı saniyeler içinde profesyonel model görsellerine dönüştürün. Kolye, yüzük, küpe ve saat için AI destekli sanal deneme.',
  keywords: 'takı görseli, yapay zeka, sanal deneme, jewelry virtual try-on, kolye, yüzük, küpe, saat',
  openGraph: {
    title: 'Lunia Studio — Yapay Zeka ile Takı Görselleştirme',
    description: 'Takı fotoğraflarınızı profesyonel model görsellerine dönüştürün.',
    url: 'https://jewelry-virtual.vercel.app',
    siteName: 'Lunia Studio',
    type: 'website',
    locale: 'tr_TR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lunia Studio',
    description: 'Takı fotoğraflarınızı profesyonel model görsellerine dönüştürün.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,300;1,9..40,400;1,9..40,700&family=EB+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-white text-[#111827]">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
