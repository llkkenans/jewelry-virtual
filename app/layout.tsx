import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
      <body className="antialiased bg-white text-[#111827]">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
