"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Gift, Star } from "lucide-react"
import ImageSpotlight from "@/components/ui/image-spotlight"

const HERO_VIDEOS = [
  "/landing_videos/luxury.mp4",
  "/landing_videos/hailuo-2_3_A_seamless_infinite_loop_video_of_an_elegant_fair-skinned_woman_closely_inspecti-0.mp4",
  "/landing_videos/kling-3.0_A_seamless_infinite_loop_video_of_an_elegant_fair-skinned_woman_slowly_rotating_-0.mp4",
]

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
    icon: Zap,
    title: "30 Saniyede Sonuç",
    desc: "Görsel yüklendikten sonra yapay zeka motorumuz ortalama 30 saniyede çıktı üretir. Sıra bekleme yok.",
  },
  {
    icon: Gift,
    title: "10 Ücretsiz Kredi",
    desc: "Kayıt olun, kredi kartı gerekmeden 10 üretim hakkı kazanın. Beğenirseniz devam edin.",
  },
  {
    icon: Star,
    title: "Profesyonel Kalite",
    desc: "Flux Inpainting modeliyle üretilen görseller, stüdyo çekimlerine rakip kalitede çıkar.",
  },
]

/* ─── Sayfa ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const key = "jv_hero_video_idx"
    const current = parseInt(sessionStorage.getItem(key) ?? "0", 10)
    const next = (current + 1) % HERO_VIDEOS.length
    sessionStorage.setItem(key, String(next))
    setVideoSrc(HERO_VIDEOS[current])
  }, [])

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
          {videoSrc && (
            <video
              key={videoSrc}
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
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
        <section className="bg-[#111827] py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">

            {/* Başlık */}
            <div className="mb-14">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.4em] mb-5">
                Nasıl Çalışır
              </p>
              <h2
                style={{ fontFamily: "'Inter', sans-serif" }}
                className="text-3xl sm:text-[2.75rem] font-bold tracking-tight text-white leading-[1.1] uppercase"
              >
                Üç Adımda<br />
                <span className="text-white/35">Stüdyo Kalitesi</span>
              </h2>
            </div>

            {/* Video + Adımlar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

              {/* Video */}
              <div className="relative rounded-2xl overflow-hidden w-full max-w-sm mx-auto lg:mx-0 aspect-[9/16]">
                <video
                  src="/landing_videos/hailo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl" />
              </div>

              {/* Adımlar */}
              <div className="flex flex-col gap-10">
                {steps.map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-5 items-start">
                    <span
                      style={{ fontFamily: SERIF }}
                      className="text-5xl font-light text-white/15 italic leading-none select-none shrink-0 mt-1"
                    >
                      {n}
                    </span>
                    <div className="pt-3 border-t border-white/10 flex-1">
                      <p
                        style={{ fontFamily: SERIF }}
                        className="text-xl font-normal text-white mb-2 tracking-tight leading-tight"
                      >
                        {title}
                      </p>
                      <p className="text-sm text-white/45 leading-relaxed font-light">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <Link href="/register">
                    <Button className="h-10 px-7 bg-white hover:bg-white/90 text-[#111827] text-xs font-medium rounded-full cursor-pointer tracking-widest uppercase transition-all">
                      Hemen Başla
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Koleksiyon Spotlight ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
          <div className="mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.35em] mb-4">
                Koleksiyonunuz
              </p>
              <h2
                style={{ fontFamily: SERIF }}
                className="text-3xl sm:text-5xl font-normal tracking-tight text-[#111827] leading-tight"
              >
                Her takı türü için<br />
                <em className="italic text-[#9CA3AF]">stüdyo kalitesi</em>
              </h2>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-relaxed font-light max-w-xs sm:text-right">
              Fareyi görselin üzerinde gezdirerek detayları keşfedin.
            </p>
          </div>

          <div className="flex justify-center gap-4 flex-wrap sm:flex-nowrap">

            {/* Yüzük */}
            <div className="flex flex-col gap-4 w-full sm:w-auto">
              <ImageSpotlight
                src="/landing_images/landing/ring.jpg"
                alt="Elmas solitaire yüzük stüdyo çekimi"
                orientation="portrait"
                width={300}
                height={400}
                config={{ spotlightSize: 120, overlayOpacity: 0.45 }}
              />
              <div className="px-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-5 bg-[#E5E7EB]" />
                  <span className="text-[10px] text-[#C9A96E] tracking-[0.3em] uppercase font-medium">
                    Yüzük
                  </span>
                </div>
                <p style={{ fontFamily: SERIF }} className="text-lg font-normal text-[#111827] mb-1 tracking-tight">
                  Nişan & Tektaş
                </p>
                <p className="text-xs text-[#9CA3AF] leading-relaxed font-light">
                  Dört pençeli solitaire&apos;den pavé bantlara, her yüzüğü model eli üzerinde gerçekçi biçimde canlandırın.
                </p>
              </div>
            </div>

            {/* Küpe */}
            <div className="flex flex-col gap-4 w-full sm:w-auto">
              <ImageSpotlight
                src="/landing_images/landing/earrings.jpg"
                alt="Altın halka küpeler stüdyo çekimi"
                orientation="portrait"
                width={300}
                height={400}
                config={{ spotlightSize: 120, overlayOpacity: 0.45 }}
              />
              <div className="px-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-5 bg-[#E5E7EB]" />
                  <span className="text-[10px] text-[#C9A96E] tracking-[0.3em] uppercase font-medium">
                    Küpe
                  </span>
                </div>
                <p style={{ fontFamily: SERIF }} className="text-lg font-normal text-[#111827] mb-1 tracking-tight">
                  Halka & Sarkıt
                </p>
                <p className="text-xs text-[#9CA3AF] leading-relaxed font-light">
                  Halka, çivi ve sarkıt küpeleri doğal ışıkta, gerçek kulak pozisyonunda sergileyin.
                </p>
              </div>
            </div>

            {/* Kolye */}
            <div className="flex flex-col gap-4 w-full sm:w-auto">
              <ImageSpotlight
                src="/landing_images/landing/necklace.jpg"
                alt="İnce altın kolye ve pendant stüdyo çekimi"
                orientation="portrait"
                width={300}
                height={400}
                config={{ spotlightSize: 120, overlayOpacity: 0.45 }}
              />
              <div className="px-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-5 bg-[#E5E7EB]" />
                  <span className="text-[10px] text-[#C9A96E] tracking-[0.3em] uppercase font-medium">
                    Kolye
                  </span>
                </div>
                <p style={{ fontFamily: SERIF }} className="text-lg font-normal text-[#111827] mb-1 tracking-tight">
                  Kolye & Pendant
                </p>
                <p className="text-xs text-[#9CA3AF] leading-relaxed font-light">
                  Zincir ve pendant kombinasyonlarını boyun üzerinde, stüdyo ışığıyla mükemmel şekilde gösterin.
                </p>
              </div>
            </div>

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
                className="text-3xl sm:text-5xl font-normal tracking-tight text-[#111827] leading-tight"
              >
                Neden<br />
                <em className="italic text-[#9CA3AF]">Jewelry Virtual?</em>
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
                        className="text-xl font-normal text-[#111827] mb-2 tracking-tight leading-tight"
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
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/5" />
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/5" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-white/5" />

            <p className="relative text-[10px] tracking-[0.4em] uppercase text-white/30 font-light">
              Hemen Başla
            </p>
            <h2
              style={{ fontFamily: SERIF }}
              className="relative text-4xl sm:text-6xl font-normal text-white tracking-tight leading-tight"
            >
              Takılarınızı<br />
              <em className="italic text-white/60">dünyaya tanıtın</em>
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
            <span style={{ fontFamily: SERIF }} className="text-xs text-[#9CA3AF] tracking-wide">
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
