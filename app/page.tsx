"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/* ─── Hero Videos ───────────────────────────────────────────────────── */
const heroVideos = [
  "/landing/landing_videos/main1.mp4",
  "/landing/landing_videos/main2.mp4",
]

/* ─── Fonts ─────────────────────────────────────────────────────────── */
const DISPLAY = "'DM Sans', sans-serif"
const BODY = "'Inter', sans-serif"

/* ─── Scroll Reveal ─────────────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, shown] as const
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [ref, shown] = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Data ───────────────────────────────────────────────────────────── */
const steps = [
  {
    n: "01",
    img: "/landing/landing_images/how_does_it_work/step1.jpg",
    title: "Fotoğrafı Yükle",
    desc: "Yüzük, kolye, küpe veya saat görselinizi sürükleyip bırakın.",
  },
  {
    n: "02",
    img: "/landing/landing_images/how_does_it_work/step2.jpg",
    title: "Modeli Seç",
    desc: "Cinsiyet, cilt tonu ve sahne stilini birkaç saniyede belirleyin.",
  },
  {
    n: "03",
    img: "/landing/landing_images/how_does_it_work/step3.jpg",
    title: "Görseli İndir",
    desc: "AI saniyeler içinde stüdyo kalitesinde görseli hazırlasın.",
  },
]


const stats = [
  { value: "4",    label: "Takı türü" },
  { value: "~30s", label: "Üretim süresi" },
  { value: "HD",   label: "Çıktı kalitesi" },
  { value: "10",   label: "Ücretsiz kredi" },
]

const collection = [
  { src: "/landing/landing_images/collection/ring.jpg", cat: "Yüzük", title: "Kusursuz Takı Sadakati", desc: "Ürünün her detayı orijinaliyle birebir korunur." },
  { src: "/landing/landing_images/collection/earrings.jpg", cat: "Küpe", title: "Sınırsız Model Seçeneği", desc: "Farklı cilt tonu ve cinsiyetlerde geniş kitleye hitap edin." },
  { src: "/landing/landing_images/collection/necklace.jpg", cat: "Kolye", title: "Saniyeler İçinde Sonuç", desc: "E-ticarete hazır görsel anında elinizde." },
]

/* ─── Overline label ─────────────────────────────────────────────────── */
function Overline({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      style={{ fontFamily: BODY }}
      className={`text-[11px] tracking-[0.28em] uppercase font-medium mb-5 ${light ? "text-white/35" : "text-black/35"}`}
    >
      {children}
    </p>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [videoIndex] = useState(() => {
    if (typeof window === 'undefined') return 0
    const current = parseInt(sessionStorage.getItem('heroVideoIndex') || '0')
    const next = (current + 1) % heroVideos.length
    sessionStorage.setItem('heroVideoIndex', String(next))
    return current
  })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div style={{ fontFamily: BODY }} className="min-h-screen bg-white text-[#0A0A0A]">

      {/* ─────────────── NAVBAR ─────────────── */}
      <header
        className={`fixed top-3 inset-x-4 z-50 rounded-2xl transition-all duration-500 backdrop-blur-xl ${
          scrolled
            ? "bg-white/88 border border-black/[0.08] shadow-sm"
            : "bg-black/[0.06]"
        }`}
      >
        <div className="px-5 sm:px-7 h-14 flex items-center justify-between">

          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5">
            <span
              style={{ fontFamily: DISPLAY }}
              className={`text-[12px] font-light tracking-[0.22em] uppercase transition-colors duration-400 ${
                scrolled ? "text-[#0A0A0A]" : "text-white"
              }`}
            >
              Lunia Studio
            </span>
          </Link>

          {/* Nav Links — desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Nasıl Çalışır", href: "#nasil-calisir" },
              { label: "Koleksiyon", href: "#koleksiyon" },
              { label: "Fiyatlar", href: "/dashboard/billing" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`text-[13px] font-medium transition-colors duration-300 cursor-pointer ${
                  scrolled
                    ? "text-[#0A0A0A]/55 hover:text-[#0A0A0A]"
                    : "text-white/65 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-1.5">
            <Link href="/login">
              <Button
                variant="ghost"
                className={`h-9 px-4 text-[13px] font-medium rounded-full cursor-pointer transition-all duration-300 ${
                  scrolled
                    ? "text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-black/[0.05]"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button
                className={`h-9 px-5 text-[13px] font-semibold rounded-full cursor-pointer transition-all duration-300 ${
                  scrolled
                    ? "bg-[#0A0A0A] text-white hover:bg-[#222] border-0"
                    : "bg-white/[0.15] text-white hover:bg-white/25 border border-white/40 backdrop-blur-sm"
                }`}
              >
                Ücretsiz Dene
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ─────────────── HERO ─────────────── */}
        <section className="relative h-screen overflow-hidden">
          <video
            src={heroVideos[videoIndex]}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Oura-style gradient: subtle top, strong bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

          {/* Hero content — bottom left */}
          <div className="absolute bottom-14 sm:bottom-20 left-0 right-0 z-10 px-6 sm:px-16 max-w-5xl">
            <Overline light>TAKI STÜDYO</Overline>
            <h1
              style={{ fontFamily: DISPLAY }}
              className="text-[2.8rem] sm:text-[4.25rem] md:text-[5.25rem] font-extrabold leading-[0.95] tracking-[-0.035em] text-white mb-6 max-w-2xl"
            >
              Takınız Modelin
              <br />
              <em
                className="not-italic font-light text-white/55"
                style={{ fontFamily: DISPLAY }}
              >
                Üzerinde.
              </em>
            </h1>
            <p
              style={{ fontFamily: BODY }}
              className="text-[15px] text-white/55 max-w-xs mb-9 leading-[1.7] font-light"
            >
              Pahalı stüdyo çekimi olmadan, profesyonel model görsellerine dönüştürün.
            </p>
            <Link href="/register">
              <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-white text-[#0A0A0A] hover:bg-white/90 transition-all duration-300 tracking-wide">
                Ücretsiz Başla
              </Button>
            </Link>
          </div>

          {/* Scroll line indicator */}
          <div className="absolute bottom-8 right-10 hidden sm:flex flex-col items-center gap-1.5 opacity-35">
            <span style={{ fontFamily: BODY }} className="text-[9px] tracking-[0.25em] uppercase text-white rotate-90 mb-2 origin-center">
              scroll
            </span>
            <div className="w-px h-10 bg-white/60" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          </div>
        </section>

        {/* ─────────────── STATS STRIP ─────────────── */}
        <section className="bg-white border-b border-black/[0.07]">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/[0.07]">
              {stats.map(({ value, label }, i) => (
                <Reveal key={label} delay={i * 90} className="py-10 px-6 text-center">
                  <div
                    style={{ fontFamily: DISPLAY }}
                    className="text-[2rem] sm:text-[2.6rem] font-extrabold tracking-[-0.03em] text-[#0A0A0A] leading-none mb-2.5"
                  >
                    {value}
                  </div>
                  <div
                    style={{ fontFamily: BODY }}
                    className="text-[11px] text-[#0A0A0A]/38 uppercase tracking-[0.18em] font-medium"
                  >
                    {label}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── HOW IT WORKS — White ─────────────── */}
        <section id="nasil-calisir" className="bg-white py-28 sm:py-36">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">

            <Reveal>
              <Overline>Nasıl Çalışır</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-[#0A0A0A] leading-[1.0] mb-20 max-w-xl"
              >
                Üç Adımda
                <br />
                <em className="not-italic font-light text-black/30" style={{ fontFamily: DISPLAY }}>
                  Profesyonel Görsel.
                </em>
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
              {steps.map(({ n, img, title, desc }, i) => (
                <Reveal key={n} delay={i * 110}>
                  <div className="group cursor-default">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-7 bg-[#F4F4F2]">
                      <img
                        src={img}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <span
                      style={{ fontFamily: DISPLAY }}
                      className="block text-[11px] font-semibold tracking-[0.25em] uppercase text-black/28 mb-3"
                    >
                      {n}
                    </span>
                    <h3
                      style={{ fontFamily: DISPLAY }}
                      className="text-[1.2rem] font-bold text-[#0A0A0A] tracking-[-0.02em] mb-2.5 leading-[1.2]"
                    >
                      {title}
                    </h3>
                    <p
                      style={{ fontFamily: BODY }}
                      className="text-[14px] text-[#0A0A0A]/48 leading-[1.7] font-light"
                    >
                      {desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={180} className="mt-16">
              <Link href="/register">
                <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-[#0A0A0A] text-white hover:bg-[#1F1F1F] transition-all duration-300">
                  Hemen Başla
                </Button>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ─────────────── COLLECTION — Dark ─────────────── */}
        <section id="koleksiyon" className="bg-[#0A0A0A] py-28 sm:py-36">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">

            <Reveal>
              <Overline light>Koleksiyonunuz</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-white leading-[1.0] mb-20 max-w-xl"
              >
                Her takı türü
                <br />
                <em className="not-italic font-light text-white/28" style={{ fontFamily: DISPLAY }}>
                  için stüdyo.
                </em>
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {collection.map(({ src, cat, title, desc }, i) => (
                <Reveal key={cat} delay={i * 100}>
                  <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer">
                    <img
                      src={src}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <span
                        style={{ fontFamily: BODY }}
                        className="text-[10px] text-white/38 tracking-[0.3em] uppercase font-medium block mb-2"
                      >
                        {cat}
                      </span>
                      <p
                        style={{ fontFamily: DISPLAY }}
                        className="text-[1.15rem] font-bold text-white leading-[1.2] tracking-[-0.015em] mb-1.5"
                      >
                        {title}
                      </p>
                      <p
                        style={{ fontFamily: BODY }}
                        className="text-[13px] text-white/38 font-light"
                      >
                        {desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── CTA — Video ─────────────── */}
        <section className="relative min-h-[88vh] overflow-hidden flex items-end">
          <video
            src="/landing/landing_videos/luxury.mp4"
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-16 w-full pb-20">
            <Reveal>
              <Overline light>HEMEN BAŞLA</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.75rem] md:text-[4.5rem] font-extrabold tracking-[-0.035em] text-white leading-[0.95] mb-8 max-w-2xl"
              >
                İlk Görselinizi
                <br />
                <em className="not-italic font-light text-white/45" style={{ fontFamily: DISPLAY }}>
                  Bugün Üretin.
                </em>
              </h2>
              <p
                style={{ fontFamily: BODY }}
                className="text-[15px] text-white/50 max-w-sm mb-10 font-light leading-[1.7]"
              >
                Kredi kartı gerekmez. Birkaç dakikada kaydolun, ilk takınızı modele giydirin.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-white text-[#0A0A0A] hover:bg-white/92 transition-all duration-300 tracking-wide">
                    Hemen Dene
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="h-11 px-8 text-[13px] font-medium rounded-full cursor-pointer bg-transparent border border-white/38 text-white hover:bg-white/10 transition-all duration-300">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="bg-white border-t border-black/[0.07]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            {/* Brand */}
            <span
              style={{ fontFamily: DISPLAY }}
              className="text-[11px] font-light text-[#0A0A0A]/38 tracking-[0.22em] uppercase"
            >
              Lunia Studio
            </span>

            {/* Links */}
            <div className="flex items-center gap-7">
              {[
                { label: "Giriş Yap", href: "/login" },
                { label: "Kayıt Ol", href: "/register" },
                { label: "Fiyatlar", href: "/dashboard/billing" },
                { label: "Kullanım Koşulları", href: "/terms" },
                { label: "Gizlilik", href: "/privacy" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  style={{ fontFamily: BODY }}
                  className="text-[13px] text-[#0A0A0A]/38 hover:text-[#0A0A0A]/70 transition-colors font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p
              style={{ fontFamily: BODY }}
              className="text-[12px] text-[#0A0A0A]/28 font-light"
            >
              © 2026 Lunia Studio
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
