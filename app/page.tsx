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

const results = [
  {
    before: "/landing/landing_images/collection/ring.jpg",
    after: "/landing/landing_images/collection/ring.jpg",
    cat: "Yüzük",
    label: "Ürün Fotoğrafı → Model Görseli",
  },
  {
    before: "/landing/landing_images/collection/necklace.jpg",
    after: "/landing/landing_images/collection/necklace.jpg",
    cat: "Kolye",
    label: "Ürün Fotoğrafı → Model Görseli",
  },
  {
    before: "/landing/landing_images/collection/earrings.jpg",
    after: "/landing/landing_images/collection/earrings.jpg",
    cat: "Küpe",
    label: "Ürün Fotoğrafı → Model Görseli",
  },
]

/* ─── Before/After Slider ────────────────────────────────────────────── */
function BeforeAfterSlider({
  before,
  after,
  cat,
  label,
}: {
  before: string
  after: string
  cat: string
  label: string
}) {
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const move = (clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPos((x / rect.width) * 100)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    move(e.clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    move(e.touches[0].clientX)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl aspect-[3/4] cursor-col-resize select-none touch-none"
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchStart={(e) => move(e.touches[0].clientX)}
      >
        {/* AFTER image — full width base */}
        <img
          src={after}
          alt={`${cat} sonrası`}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* BEFORE image — clipped to left portion */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={before}
            alt={`${cat} öncesi`}
            className="w-full h-full object-cover"
            style={{ filter: "grayscale(0.15) brightness(0.92)" }}
            draggable={false}
          />
          {/* Before label */}
          <div className="absolute top-4 left-4">
            <span
              style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: "10px", letterSpacing: "0.2em" }}
              className="bg-white/90 text-[#0A0A0A] uppercase tracking-widest text-[10px] font-semibold px-3 py-1.5 rounded-full"
            >
              Önce
            </span>
          </div>
        </div>

        {/* After label */}
        <div className="absolute top-4 right-4" style={{ opacity: pos < 85 ? 1 : 0, transition: "opacity 0.2s" }}>
          <span
            style={{ fontSize: "10px", letterSpacing: "0.2em" }}
            className="bg-[#0A0A0A]/80 text-white uppercase tracking-widest text-[10px] font-semibold px-3 py-1.5 rounded-full"
          >
            Sonra
          </span>
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/80 z-10"
          style={{ left: `${pos}%`, transition: dragging ? "none" : "left 0.05s" }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center z-20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 8L2 5m0 0l3-3M2 5h12m0 0l-3-3m3 3l-3 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Label below */}
      <div className="flex items-center justify-between px-1">
        <span
          style={{ fontFamily: "var(--font-body, sans-serif)" }}
          className="text-[10px] text-white/30 tracking-[0.22em] uppercase font-medium"
        >
          {cat}
        </span>
        <span
          style={{ fontFamily: "var(--font-body, sans-serif)" }}
          className="text-[10px] text-white/20 tracking-[0.15em] uppercase font-light"
        >
          {label}
        </span>
      </div>
    </div>
  )
}

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
              { label: "Sonuçlar", href: "#sonuclar" },
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

        {/* ─────────────── RESULTS — Before/After ─────────────── */}
        <section id="sonuclar" className="bg-[#0A0A0A] py-28 sm:py-36">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">

            <Reveal>
              <Overline light>Sonuçlar</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-white leading-[1.0] mb-6 max-w-xl"
              >
                Ürün fotoğrafından
                <br />
                <em className="not-italic font-light text-white/28" style={{ fontFamily: DISPLAY }}>
                  model görseline.
                </em>
              </h2>
              <p style={{ fontFamily: BODY }} className="text-[14px] text-white/35 font-light mb-20 max-w-sm leading-[1.75]">
                Kaydırıcıyı hareket ettirerek farkı görün.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {results.map(({ before, after, cat, label }, i) => (
                <Reveal key={cat} delay={i * 100}>
                  <BeforeAfterSlider before={before} after={after} cat={cat} label={label} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={200} className="mt-16">
              <Link href="/register">
                <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-white text-[#0A0A0A] hover:bg-white/90 transition-all duration-300 tracking-wide">
                  Ücretsiz Dene
                </Button>
              </Link>
            </Reveal>
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
