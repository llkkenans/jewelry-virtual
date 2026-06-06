import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jewelry Virtual Try-On",
  description: "Takı fotoğraflarını saniyeler içinde gerçekçi model elinde göster.",
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-white text-[#111827]">
        {children}
      </body>
    </html>
  );
}
