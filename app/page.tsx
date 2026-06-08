"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Gem, Download, Zap, Gift, Star } from "lucide-react"

/* ─── Veri ──────────────────────────────────────────────────────────── */

const steps = [
  {
    n: "01",
    icon: Upload,
    title: "Takı Fotoğrafı Yükle",
    desc: "Beyaz zemin üzerindeki takı fotoğrafınızı sürükleyip bırakın.",
  },
  {
    n: "02",
    icon: Gem,
    title: "Tür Seç",
    desc: "Yüzük, kolye veya küpe — doğru kategoriyi seçin.",
  },
  {
    n: "03",
    icon: Download,
    title: "Sonucu İndir",
    desc: "Yapay zeka takınızı model üzerinde gösterir. İndirin, kullanın.",
  },
]

const features = [
  {
    icon: Zap,
    title: "Saniyeler İçinde Sonuç",
    desc: "Görsel yüklendikten sonra yapay zeka motoru ortalama 30 saniyede çıktı üretir.",
  },
  {
    icon: Gift,
    title: "10 Ücretsiz Kredi",
    desc: "Kayıt olun, kredi kartı gerekmeden 10 üretim hakkı kazanın.",
  },
  {
    icon: Star,
    title: "Profesyonel Kalite",
    desc: "Flux Inpainting modeliyle üretilen görseller stüdyo çekimlerine rakip kalitede çıkar.",
  },
]

const SERIF = "'Cormorant Garant', Georgia, serif"

/* ─── Sayfa ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111827]">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#E5E7EB]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rotate-45 border-2 border-[#111827] flex items-center justify-center">
              <div className="w-1 h-1 bg-[#111827] rotate-45" />
            </div>
            <span
              style={{ fontFamily: SERIF }}
              className="text-base font-semibold tracking-wide"
            >
              Jewelry Virtual
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Giriş Yap
            </Link>
            <Link href="/register">
              <Button className="h-8 px-4 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-medium rounded-lg cursor-pointer tracking-wide">
                Ücretsiz Dene
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero: Tam Ekran Video ── */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">

          {/* Video arka plan */}
          <video
            src="/videos/luxury.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Degradeli overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />

          {/* İçerik */}
          <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto pt-14">

            {/* Küçük kategori etiketi */}
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/45 mb-10 font-light">
              B2B Kuyumcu Çözümü
            </p>

            {/* Ana başlık */}
            <h1
              style={{ fontFamily: SERIF }}
              className="text-5xl sm:text-[5.5rem] font-light leading-[1.08] tracking-tight text-white mb-8"
            >
              Takılarınızı<br />
              <em className="font-light">Saniyeler İçinde</em><br />
              Canlandırın
            </h1>

            {/* Alt metin */}
            <p className="text-[15px] text-white/55 max-w-sm mx-auto mb-12 font-light leading-relaxed tracking-wide">
              Pahalı stüdyo çekimine gerek yok. Yapay zeka ile takınızı
              gerçek modeller üzerinde görün.
            </p>

            {/* CTA butonları */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/register">
                <Button className="h-12 px-9 bg-white text-[#111827] hover:bg-white/92 text-sm font-medium rounded-xl cursor-pointer tracking-wide transition-all">
                  Ücretsiz Dene →
                </Button>
              </Link>
              <Link href="/login">
                <Button className="h-12 px-9 border border-white/30 text-white/85 hover:bg-white/10 hover:border-white/50 text-sm font-medium rounded-xl bg-transparent cursor-pointer tracking-wide transition-all">
                  Giriş Yap
                </Button>
              </Link>
            </div>

            {/* Küçük bilgi notu */}
            <p className="mt-10 text-[11px] text-white/25 tracking-widest uppercase">
              Kredi kartı gerekmez &nbsp;·&nbsp; 10 ücretsiz kredi &nbsp;·&nbsp; Anında başla
            </p>
          </div>
        </section>

        <Separator className="bg-[#E5E7EB]" />

        {/* ── Nasıl Çalışır ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
          <div className="mb-16">
            <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.35em] mb-4">
              Nasıl Çalışır
            </p>
            <h2
              style={{ fontFamily: SERIF }}
              className="text-3xl sm:text-5xl font-light tracking-tight text-[#111827] leading-tight"
            >
              Üç adımda<br />
              <em className="text-[#6B7280]">stüdyo kalitesi</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {steps.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="space-y-5">
                <div className="flex items-center gap-3">
                  <span
                    style={{ fontFamily: SERIF }}
                    className="text-sm font-light text-[#D1D5DB] italic tabular-nums"
                  >
                    {n}
                  </span>
                  <div className="h-px flex-1 bg-[#F3F4F6]" />
                  <div className="w-9 h-9 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                    <Icon size={15} className="text-[#6B7280]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827] mb-2 tracking-tight">{title}</p>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed font-light">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-[#E5E7EB]" />

        {/* ── Özellikler ── */}
        <section className="bg-[#F9FAFB] py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-16">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.35em] mb-4">
                Özellikler
              </p>
              <h2
                style={{ fontFamily: SERIF }}
                className="text-3xl sm:text-5xl font-light tracking-tight text-[#111827] leading-tight"
              >
                Neden<br />
                <em className="text-[#6B7280]">Jewelry Virtual?</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card
                  key={title}
                  className="border border-[#E5E7EB] shadow-none rounded-2xl bg-white"
                >
                  <CardContent className="p-7 space-y-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                      <Icon size={17} className="text-[#111827]" />
                    </div>
                    <div>
                      <p
                        style={{ fontFamily: SERIF }}
                        className="text-lg font-light text-[#111827] mb-2 tracking-tight leading-tight"
                      >
                        {title}
                      </p>
                      <p className="text-sm text-[#9CA3AF] leading-relaxed font-light">{desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
          <div className="bg-[#111827] rounded-3xl px-8 py-20 text-center space-y-7 relative overflow-hidden">
            {/* Dekoratif daireler */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/5" />
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/5" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-white/5" />

            <p className="relative text-[10px] tracking-[0.4em] uppercase text-white/30 font-light">
              Hemen Başla
            </p>
            <h2
              style={{ fontFamily: SERIF }}
              className="relative text-4xl sm:text-6xl font-light text-white tracking-tight leading-tight"
            >
              Takılarınızı<br />
              <em className="text-white/60">dünyaya tanıtın</em>
            </h2>
            <p className="relative text-sm text-white/40 max-w-sm mx-auto leading-relaxed font-light">
              10 ücretsiz kredi ile takılarınızın model görsellerini dakikalar içinde oluşturun.
            </p>
            <div className="relative">
              <Link href="/register">
                <Button className="h-12 px-10 bg-white hover:bg-white/92 text-[#111827] text-sm font-medium rounded-xl cursor-pointer tracking-wide transition-all mt-2">
                  Ücretsiz Hesap Oluştur →
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rotate-45 border border-[#D1D5DB] flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-[#D1D5DB] rotate-45" />
            </div>
            <span
              style={{ fontFamily: SERIF }}
              className="text-xs text-[#9CA3AF] tracking-wide"
            >
              © 2026 Jewelry Virtual
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors tracking-wide">
              Giriş Yap
            </Link>
            <Link href="/register" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors tracking-wide">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
