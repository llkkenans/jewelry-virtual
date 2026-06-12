"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/* ─── Veri ──────────────────────────────────────────────────────────── */

const SERIF = "'EB Garamond', Georgia, serif"

const steps = [
  {
    n: "01",
    img: "/landing_images/more/step1.jpg",
    imgPosition: "object-top",
    title: "Ürününüzü Yükleyin",
    desc: "Takı görselinizi sürükleyip bırakın ya da dosya seçin. Beyaz zemin üzerinde çekilmiş net bir fotoğraf, en yüksek kalite çıktıyı sağlar.",
  },
  {
    n: "02",
    img: "/landing_images/more/step2.jpg",
    imgPosition: "object-center",
    title: "Türü & Adedi Belirleyin",
    desc: "Yüzük, kolye, küpe ya da bileklik — kategorinizi seçin. Tek görselden dörde kadar farklı model varyasyonu üretebilirsiniz.",
  },
  {
    n: "03",
    img: "/landing_images/more/step3.jpg",
    imgPosition: "object-top",
    title: "Anında İndirin, Hemen Kullanın",
    desc: "Yapay zeka motorumuz takınızı gerçekçi bir model üzerine yerleştirir. 30 saniye içinde stüdyo kalitesinde ürün görseli elinizde.",
  },
]

const features = [
  {
    n: "01",
    img: "/landing_images/landing/ring.jpg",
    label: "Yapay Zeka",
    title: "Gerçek Sonuç",
    desc: "Flux inpainting ile takınız piksel hassasiyetiyle modele işlenir",
  },
  {
    n: "02",
    img: "/landing_images/landing/necklace.jpg",
    label: "7/24 Erişim",
    title: "Stüdyonuz Açık",
    desc: "Fotoğrafçı, ışık, model ajansı — hiçbirine gerek yok",
  },
  {
    n: "03",
    img: "/landing_images/landing/earrings.jpg",
    label: "Dönüşüm",
    title: "Görsel Satar",
    desc: "Model üzerindeki takılar %40 daha yüksek sepete ekleme oranı sağlar",
  },
]

/* ─── Sayfa ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#111827]">

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]"
          : "bg-transparent"
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-5 h-5 rotate-45 border-2 flex items-center justify-center transition-colors duration-300 ${scrolled ? "border-[#111827]" : "border-white"}`}>
              <div className={`w-1 h-1 rotate-45 transition-colors duration-300 ${scrolled ? "bg-[#111827]" : "bg-white"}`} />
            </div>
            <span style={{ fontFamily: SERIF }} className={`text-base font-semibold tracking-wide transition-colors duration-300 ${scrolled ? "text-[#111827]" : "text-white"}`}>
              Jewelry Virtual
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button className={`h-8 px-4 text-xs font-medium rounded-full cursor-pointer tracking-widest uppercase transition-all duration-300 ${
                scrolled
                  ? "bg-transparent hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#111827]"
                  : "bg-white/15 hover:bg-white/25 border border-white/50 text-white backdrop-blur-sm"
              }`}>
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button className={`h-8 px-4 text-xs font-medium rounded-full cursor-pointer tracking-widest uppercase transition-all duration-300 ${
                scrolled
                  ? "bg-[#111827] hover:bg-[#1F2937] border border-[#111827] text-white"
                  : "bg-white/15 hover:bg-white/25 border border-white/50 text-white backdrop-blur-sm"
              }`}>
                Ücretsiz Dene
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero: Tam Ekran Video ── */}
        <section className="relative h-screen overflow-hidden">
          <video
            src="/landing_videos/main.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Sol alttan sağa doğru kararlaşan gradient — Pandora tarzı */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          {/* Metin — sol alt köşe */}
          <div className="absolute bottom-10 left-0 z-10 px-6 sm:px-10 max-w-lg">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/55 mb-4 font-light">
              Yeni koleksiyonunuzu keşfedin
            </p>
            <h1
              style={{ fontFamily: "'Inter', sans-serif" }}
              className="text-[1.85rem] sm:text-[2.4rem] font-bold leading-[1.25] tracking-tight text-white mb-6 uppercase"
            >
              Takılarınızı<br />
              Saniyeler İçinde<br />
              Canlandırın
            </h1>
            <Link href="/register">
              <Button className="h-9 px-5 bg-white/15 hover:bg-white/25 border border-white/50 text-white text-xs font-medium rounded-full cursor-pointer tracking-widest uppercase transition-all backdrop-blur-sm">
                Şimdi Keşfet
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Nasıl Çalışır ── */}
        <section className="relative min-h-screen overflow-hidden flex flex-col justify-between">

          {/* Arka plan video */}
          <video
            src="/landing_videos/hailo.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gradient overlay — hero ile aynı */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/35" />

          {/* İçerik */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 w-full pt-20 pb-16 flex flex-col justify-between min-h-screen">

            {/* Üst: Başlık */}
            <div>
              <p className="text-[10px] tracking-[0.45em] uppercase text-white/40 mb-5 font-light">
                Nasıl Çalışır
              </p>
              <h2
                style={{ fontFamily: "'Inter', sans-serif" }}
                className="text-[1.85rem] sm:text-[2.5rem] font-bold tracking-tight text-white leading-[1.1] uppercase max-w-md"
              >
                Üç Adımda<br />
                <span className="text-white/40">Stüdyo Kalitesi</span>
              </h2>
            </div>

            {/* Alt: Adımlar — yatay grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 mt-16">
              {steps.map(({ n, title, desc }) => (
                <div key={n} className="border-t border-white/20 pt-5">
                  <span
                    style={{ fontFamily: SERIF }}
                    className="block text-4xl font-light text-white/20 italic leading-none mb-4 select-none"
                  >
                    {n}
                  </span>
                  <p
                    style={{ fontFamily: SERIF }}
                    className="text-lg font-normal text-white mb-2 tracking-tight leading-tight"
                  >
                    {title}
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed font-light">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12">
              <Link href="/register">
                <Button className="h-9 px-6 bg-white/15 hover:bg-white/25 border border-white/50 text-white text-xs font-medium rounded-full cursor-pointer tracking-widest uppercase transition-all backdrop-blur-sm">
                  Hemen Başla
                </Button>
              </Link>
            </div>

          </div>
        </section>

        {/* ── Koleksiyon ── */}
        <section className="bg-[#0D0D0D] py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-6 sm:px-10">
            <div className="mb-14">
              <p className="text-[10px] tracking-[0.45em] uppercase text-white/30 mb-5 font-light">
                Koleksiyonunuz
              </p>
              <h2
                style={{ fontFamily: "'Inter', sans-serif" }}
                className="text-[1.85rem] sm:text-[2.5rem] font-bold tracking-tight text-white leading-[1.1] uppercase"
              >
                Her Takı Türü<br />
                <span className="text-white/35">İçin Stüdyo Kalitesi</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { src: "/landing_images/landing/ring.jpg", cat: "Yüzük", title: "Nişan & Tektaş", desc: "Parmakta gerçekçi canlandırma" },
                { src: "/landing_images/landing/earrings.jpg", cat: "Küpe", title: "Halka & Sarkıt", desc: "Kulakta doğal ışık sergisi" },
                { src: "/landing_images/landing/necklace.jpg", cat: "Kolye", title: "Kolye & Pendant", desc: "Boyunda stüdyo kalitesi" },
              ].map(({ src, cat, title, desc }) => (
                <div key={cat} className="group relative overflow-hidden rounded-xl aspect-[3/4]">
                  <img
                    src={src}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <span className="text-[9px] text-[#C9A96E] tracking-[0.35em] uppercase font-medium block mb-2">
                      {cat}
                    </span>
                    <p style={{ fontFamily: SERIF }} className="text-lg font-normal text-white leading-tight mb-1">
                      {title}
                    </p>
                    <p className="text-xs text-white/50 font-light">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Özellikler ── */}
        <section className="bg-[#0D0D0D] py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-6 sm:px-10">
            <div className="mb-14">
              <p className="text-[10px] tracking-[0.45em] uppercase text-white/30 mb-5 font-light">
                Neden Jewelry Virtual
              </p>
              <h2
                style={{ fontFamily: "'Inter', sans-serif" }}
                className="text-[1.85rem] sm:text-[2.5rem] font-bold tracking-tight text-white leading-[1.1] uppercase"
              >
                Kuyumcular İçin<br />
                <span className="text-white/35">Tasarlandı</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map(({ n, img, label, title, desc }) => (
                <div key={n} className="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-default">
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />
                  <div className="absolute bottom-0 inset-x-0 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-[9px] text-[#C9A96E] tracking-[0.35em] uppercase font-medium block mb-2">
                      {label}
                    </span>
                    <p style={{ fontFamily: SERIF }} className="text-xl font-normal text-white leading-tight mb-2">
                      {title}
                    </p>
                    <p className="text-xs text-white/0 group-hover:text-white/60 font-light leading-relaxed transition-all duration-500 max-h-0 group-hover:max-h-20 overflow-hidden">
                      {desc}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span style={{ fontFamily: SERIF }} className="text-xs text-white/30 italic">{n}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative min-h-[70vh] overflow-hidden flex items-end">
          <video
            src="/landing_videos/luxury.mp4"
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 w-full pb-16">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/40 mb-5 font-light">Hemen Başla</p>
            <h2
              style={{ fontFamily: "'Inter', sans-serif" }}
              className="text-[1.85rem] sm:text-[2.5rem] font-bold tracking-tight text-white leading-[1.1] uppercase mb-6 max-w-lg"
            >
              Takılarınızı<br />
              <span className="text-white/40">Dünyaya Tanıtın</span>
            </h2>
            <p className="text-sm text-white/55 max-w-sm mb-8 font-light leading-relaxed">
              10 ücretsiz kredi ile takılarınızın model görsellerini dakikalar içinde oluşturun.
            </p>
            <Link href="/register">
              <Button className="h-9 px-6 bg-white/15 hover:bg-white/25 border border-white/50 text-white text-xs font-medium rounded-full cursor-pointer tracking-widest uppercase transition-all backdrop-blur-sm">
                Ücretsiz Hesap Oluştur
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0D0D0D] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rotate-45 border border-white/20 flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-white/20 rotate-45" />
            </div>
            <span style={{ fontFamily: SERIF }} className="text-xs text-white/30 tracking-wide">
              © 2026 Jewelry Virtual
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-wide">
              Giriş Yap
            </Link>
            <Link href="/register" className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-wide">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
