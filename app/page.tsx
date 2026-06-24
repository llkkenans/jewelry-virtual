"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gem, Circle, Sparkles, Watch } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

/* ─── Hero Videos ───────────────────────────────────────────────────── */
const heroVideos = [
  "/landing/landing_videos/main.mp4",
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

/* ─── Social Media Videos ───────────────────────────────────────────── */
const socialVideos = [
  "/landing/landing_videos/social_media/hf_20260624_021954_0d30f41a-3a0f-460c-b303-49dd1d2eac0a.mp4",
  "/landing/landing_videos/social_media/hf_20260624_022754_65297412-0a9b-4b79-9439-db7681742d55.mp4",
  "/landing/landing_videos/social_media/hf_20260624_024147_80bb619a-f838-4121-9cc3-76e9c5f472f0.mp4",
  "/landing/landing_videos/social_media/hf_20260624_025743_9cfed9ef-72a7-485a-88a7-c44adefef3fd.mp4",
]

/* ─── Data ───────────────────────────────────────────────────────────── */
const steps = [
  {
    n: "01",
    img: "/landing/landing_images/how_does_it_work/step1.jpg",
    title: "Fotoğrafı Yükle",
    desc: "Takı veya kıyafet görselinizi sürükleyip bırakın.",
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
  { value: "2",    label: "Stüdyo" },
  { value: "~30s", label: "Üretim süresi" },
  { value: "HD",   label: "Çıktı kalitesi" },
  { value: "10",   label: "Ücretsiz kredi" },
]

/* ─── Demo Simulator ─────────────────────────────────────────────────── */
const demoItems = [
  {
    id: "ring", cat: "Yüzük",
    before: "/landing/landing_images/collection/ring_before.png",
    afters: [
      "/landing/landing_images/collection/ring_after.png",
      "/landing/landing_images/collection/ring_after1.png",
      "/landing/landing_images/collection/ring_after2.png",
      "/landing/landing_images/collection/ring_after3.png",
    ],
  },
  {
    id: "necklace", cat: "Kolye",
    before: "/landing/landing_images/collection/necklace_before.png",
    afters: [
      "/landing/landing_images/collection/necklace_after.png",
      "/landing/landing_images/collection/necklace_after1.png",
      "/landing/landing_images/collection/necklace_after2.png",
      "/landing/landing_images/collection/necklace_after3.png",
    ],
  },
  {
    id: "earrings", cat: "Küpe",
    before: "/landing/landing_images/collection/earrings_before.png",
    afters: [
      "/landing/landing_images/collection/earrings_after.png",
      "/landing/landing_images/collection/earrings_after1.png",
      "/landing/landing_images/collection/earrings_after2.png",
      "/landing/landing_images/collection/earrings_after3.png",
    ],
  },
]

function DemoSimulator() {
  const [studioTab, setStudioTab] = useState<'jewelry' | 'clothing'>('jewelry')
  const [clothingType, setClothingType] = useState<'tops' | 'bottoms' | 'onepiece'>('tops')
  const [selected, setSelected] = useState(0)
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle")
  const [afterIndex, setAfterIndex] = useState(0)

  const item = demoItems[selected]
  const currentAfter = item.afters[afterIndex]

  function handleGenerate() {
    if (phase === "loading") return
    const nextIndex = Math.floor(Math.random() * item.afters.length)
    setAfterIndex(nextIndex)
    setPhase("loading")
    setTimeout(() => setPhase("done"), 2800)
  }

  function handleSelect(i: number) {
    setSelected(i)
    setAfterIndex(0)
    setPhase("idle")
  }

  function handleTabChange(tab: 'jewelry' | 'clothing') {
    setStudioTab(tab)
    setPhase("idle")
  }

  const clothingButtons: { id: 'tops' | 'bottoms' | 'onepiece'; label: string }[] = [
    { id: 'tops', label: 'Üst Giyim' },
    { id: 'bottoms', label: 'Alt Giyim' },
    { id: 'onepiece', label: 'Tek Parça' },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* ── Üst-seviye Tab Switcher ── */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-1 bg-[#F8F6F2] rounded-full p-1 border border-black/[0.06]">
          {(['jewelry', 'clothing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                studioTab === tab
                  ? "bg-white shadow-sm text-[#111827]"
                  : "text-[#9CA3AF] hover:text-[#6B7280]"
              }`}
              style={{ fontFamily: BODY, fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              {tab === 'jewelry' ? 'Takı' : 'Kıyafet'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

        {/* ── Sol panel ── */}
        <div className="flex flex-col gap-4">

          {studioTab === 'jewelry' ? (
            <>
              {/* Takı thumbnail'ları */}
              <div className="flex gap-3">
                {demoItems.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(i)}
                    className={`relative flex-1 aspect-square rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                      selected === i
                        ? "ring-2 ring-[#0A0A0A]/50 scale-[1.02]"
                        : "opacity-45 hover:opacity-70"
                    }`}
                  >
                    <img src={d.before} alt={d.cat} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-1.5">
                      <span
                        style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: "9px", letterSpacing: "0.18em" }}
                        className="block text-center text-white/70 uppercase font-medium"
                      >
                        {d.cat}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Seçili takı büyük görsel */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white">
                <img
                  key={item.id}
                  src={item.before}
                  alt={item.cat}
                  className="w-full h-full object-cover"
                  style={{ animation: "demoFadeIn 0.35s ease" }}
                />
                <div className="absolute top-3.5 left-3.5">
                  <span style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.2em" }} className="text-white/85 uppercase font-medium drop-shadow-sm">
                    Ürün Görseli
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Kıyafet alt kategori butonları */}
              <div className="flex gap-3">
                {clothingButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setClothingType(btn.id)}
                    className={`flex-1 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                      clothingType === btn.id
                        ? "border-[#0A0A0A]/40 bg-white text-[#0A0A0A]"
                        : "border-black/[0.08] bg-white/50 text-[#9CA3AF] hover:text-[#6B7280]"
                    }`}
                    style={{ fontFamily: BODY, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Kıyafet için placeholder */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-dashed border-black/[0.1]">
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <Sparkles size={22} strokeWidth={1.2} className="text-[#C9A96E]/40" />
                  <p style={{ fontFamily: BODY, fontSize: "12px", letterSpacing: "0.02em" }} className="text-black/25 font-light leading-relaxed">
                    Kıyafet görseli<br />yükleyin
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Sağ panel ── */}
        <div className="flex flex-col gap-4">

          {studioTab === 'jewelry' ? (
            <>
              {/* Çıktı alanı — takı */}
              <div className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-white flex items-center justify-center">

                {/* IDLE */}
                {phase === "idle" && (
                  <div className="flex flex-col items-center gap-4 px-6 text-center">
                    <Sparkles size={22} strokeWidth={1.2} className="text-[#C9A96E]/70" />
                    <p style={{ fontFamily: BODY, fontSize: "12.5px", letterSpacing: "0.02em" }} className="text-black/35 font-light leading-relaxed">
                      Görseli oluşturmak için<br />aşağıdaki butona tıklayın
                    </p>
                  </div>
                )}

                {/* LOADING */}
                {phase === "loading" && (
                  <div className="flex flex-col items-center gap-5 px-6 text-center">
                    <div className="flex items-center gap-3">
                      <Gem size={26} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '0ms' }} />
                      <Circle size={26} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '200ms' }} />
                      <Sparkles size={26} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '400ms' }} />
                      <Watch size={26} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '600ms' }} />
                    </div>
                    <p style={{ fontFamily: BODY, fontSize: "12.5px", letterSpacing: "0.02em" }} className="text-black/35 font-light">
                      AI görsel oluşturuyor...
                    </p>
                  </div>
                )}

                {/* DONE */}
                {phase === "done" && (
                  <>
                    <img
                      src={currentAfter}
                      alt={`${item.cat} model`}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ animation: "demoFadeIn 0.6s ease" }}
                    />
                    <div className="absolute top-3.5 left-3.5">
                      <span style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.2em" }} className="text-white/85 uppercase font-medium drop-shadow-sm">
                        Model Görseli
                      </span>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="absolute bottom-3.5 right-3.5 bg-white/85 backdrop-blur-sm px-3 py-1.5 rounded-full cursor-pointer hover:bg-white transition-all"
                    >
                      <span style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.18em" }} className="text-black/45 uppercase font-medium">
                        Tekrar Dene
                      </span>
                    </button>
                  </>
                )}
              </div>

              {/* Generate butonu — takı */}
              <button
                onClick={phase === "done" ? () => setPhase("idle") : handleGenerate}
                disabled={phase === "loading"}
                className={`w-full h-12 rounded-full text-[12px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                  phase === "loading"
                    ? "bg-black/5 text-black/25 cursor-not-allowed"
                    : phase === "done"
                    ? "bg-black/5 text-black/40 hover:bg-black/8 border border-black/[0.08]"
                    : "bg-[#0A0A0A] text-white hover:bg-[#1F1F1F]"
                }`}
              >
                {phase === "loading" ? "Oluşturuluyor..." : phase === "done" ? "Farklı Ürün Dene" : "Modele Giydir →"}
              </button>
            </>
          ) : (
            <>
              {/* Kıyafet — yakında mesajı */}
              <div className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 px-8 text-center">
                  <Sparkles size={22} strokeWidth={1.2} className="text-[#C9A96E]/40" />
                  <p style={{ fontFamily: BODY, fontSize: "13px", letterSpacing: "0.01em" }} className="text-black/30 font-light leading-[1.7]">
                    Yakında — Kıyafet stüdyosu<br />demo görselleri ekleniyor
                  </p>
                </div>
              </div>

              {/* Disabled buton — kıyafet */}
              <button
                disabled
                className="w-full h-12 rounded-full text-[12px] font-semibold uppercase tracking-[0.15em] bg-black/5 text-black/25 cursor-not-allowed opacity-50"
                style={{ fontFamily: BODY }}
              >
                Modele Giydir →
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes demoFadeIn { from { opacity:0; transform:scale(1.02); } to { opacity:1; transform:scale(1); } }
        @keyframes demoSpin { to { transform:rotate(360deg); } }
        @keyframes demoPulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        @keyframes blobDrift1 { 0%,100% { transform:translate(0px,0px) scale(1); } 33% { transform:translate(40px,-30px) scale(1.06); } 66% { transform:translate(-25px,20px) scale(0.96); } }
        @keyframes blobDrift2 { 0%,100% { transform:translate(0px,0px) scale(1); } 40% { transform:translate(-50px,35px) scale(1.08); } 70% { transform:translate(30px,-20px) scale(0.94); } }
        @keyframes blobDrift3 { 0%,100% { transform:translate(0px,0px) scale(1); } 50% { transform:translate(35px,-40px) scale(1.05); } }
        @keyframes rayPulse1 { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes rayPulse2 { 0%,100% { opacity:0.4; } 50% { opacity:0.85; } }
      `}</style>
    </div>
  )
}

/* ─── Social Video Card ──────────────────────────────────────────────── */
function SocialVideoCard({ src, index }: { src: string; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function handleClick() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.muted = false
      v.play().catch(() => {})
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <div
      className="relative flex-shrink-0 w-[240px] sm:w-[280px] snap-center cursor-pointer group"
      onClick={handleClick}
    >
      <div
        className="relative rounded-[28px] overflow-hidden bg-[#111] border border-white/[0.06] transition-all duration-500 group-hover:border-[#C9A96E]/35 group-hover:shadow-[0_0_48px_rgba(201,169,110,0.13)]"
        style={{ aspectRatio: "9/16" }}
      >
        <GlowingEffect disabled={false} />
        <video
          ref={videoRef}
          src={src}
          loop
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Karartma — sadece duruyorken */}
        <div
          className="absolute inset-0 bg-black/30 transition-opacity duration-400"
          style={{ opacity: playing ? 0 : 1 }}
        />

        {/* Play butonu */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ opacity: playing ? 0 : 1, transform: playing ? "scale(0.75)" : "scale(1)" }}
        >
          <div className="w-[60px] h-[60px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Sıra etiketi — sol üst */}
        <div className="absolute top-4 left-4">
          <span
            style={{ fontFamily: BODY, letterSpacing: "0.18em" }}
            className="text-[10px] uppercase text-white/45 font-medium bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Alt gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Ses dalgası — oynarken */}
        {playing && (
          <div className="absolute bottom-4 right-4 flex items-end gap-[3px]">
            {[6, 10, 14, 10, 6].map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-[#C9A96E]"
                style={{
                  height: `${h}px`,
                  animation: "soundBar 0.8s ease-in-out infinite alternate",
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}
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
  const [videoIndex, setVideoIndex] = useState(0)

  useEffect(() => {
    const current = parseInt(sessionStorage.getItem('heroVideoIndex') || '0')
    const next = (current + 1) % heroVideos.length
    sessionStorage.setItem('heroVideoIndex', String(next))
    setVideoIndex(current)
  }, [])
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
            key={videoIndex}
            src={heroVideos[videoIndex]}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Oura-style gradient: subtle top, strong bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

          {/* Hero content — bottom left */}
          <div className="absolute bottom-14 sm:bottom-20 left-0 right-0 z-10 px-6 sm:px-16 max-w-5xl">
            <Overline light>AI STÜDYO</Overline>
            <h1
              style={{ fontFamily: DISPLAY }}
              className="text-[2.8rem] sm:text-[4.25rem] md:text-[5.25rem] font-extrabold leading-[0.95] tracking-[-0.035em] text-white mb-6 max-w-2xl"
            >
              Ürününüz Modelin
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
        <section id="sonuclar" className="py-28 sm:py-36" style={{ backgroundColor: "#F8F6F2" }}>

          {/* Blob 1 — altın, sol üst */}
          <div className="absolute pointer-events-none" style={{ width:"700px", height:"700px", borderRadius:"50%", background:"radial-gradient(circle, rgba(201,169,110,0.11) 0%, transparent 65%)", top:"-200px", left:"-180px", filter:"blur(60px)", animation:"blobDrift1 20s ease-in-out infinite" }} />

          {/* Blob 2 — mor, sağ orta */}
          <div className="absolute pointer-events-none" style={{ width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle, rgba(120,80,200,0.10) 0%, transparent 65%)", top:"10%", right:"-150px", filter:"blur(70px)", animation:"blobDrift2 25s ease-in-out infinite" }} />

          {/* Blob 3 — mavi, sol alt */}
          <div className="absolute pointer-events-none" style={{ width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle, rgba(60,100,220,0.08) 0%, transparent 65%)", bottom:"-100px", left:"20%", filter:"blur(55px)", animation:"blobDrift3 22s ease-in-out infinite" }} />

          {/* Blob 4 — altın, sağ alt */}
          <div className="absolute pointer-events-none" style={{ width:"350px", height:"350px", borderRadius:"50%", background:"radial-gradient(circle, rgba(220,160,90,0.09) 0%, transparent 65%)", bottom:"5%", right:"10%", filter:"blur(45px)", animation:"blobDrift1 18s ease-in-out 4s infinite" }} />

          {/* Işık huzmesi 1 */}
          <div className="absolute pointer-events-none" style={{ width:"1px", height:"55%", background:"linear-gradient(to top, rgba(201,169,110,0.18), transparent)", left:"28%", bottom:0, filter:"blur(8px)", transform:"scaleX(18)", transformOrigin:"center bottom", animation:"rayPulse1 6s ease-in-out infinite" }} />

          {/* Işık huzmesi 2 */}
          <div className="absolute pointer-events-none" style={{ width:"1px", height:"45%", background:"linear-gradient(to top, rgba(120,80,200,0.14), transparent)", right:"25%", bottom:0, filter:"blur(10px)", transform:"scaleX(22)", transformOrigin:"center bottom", animation:"rayPulse2 8s ease-in-out infinite" }} />

          {/* Işık huzmesi 3 */}
          <div className="absolute pointer-events-none" style={{ width:"1px", height:"35%", background:"linear-gradient(to top, rgba(255,220,130,0.10), transparent)", left:"52%", bottom:0, filter:"blur(6px)", transform:"scaleX(10)", transformOrigin:"center bottom", animation:"rayPulse1 10s ease-in-out 2s infinite" }} />

          <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">

            <Reveal>
              <Overline>Sonuçlar</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-[#0A0A0A] leading-[1.0] mb-6 max-w-xl"
              >
                Ürün fotoğrafından
                <br />
                <em className="not-italic font-light text-black/30" style={{ fontFamily: DISPLAY }}>
                  model görseline.
                </em>
              </h2>
              <p style={{ fontFamily: BODY }} className="text-[14px] text-[#0A0A0A]/45 font-light mb-16 max-w-sm leading-[1.75]">
                Takı veya kıyafet fotoğrafınızı yükleyin, modele giydirin — saniyeler içinde stüdyo kalitesi.
              </p>
            </Reveal>

            <DemoSimulator />

            <Reveal delay={200} className="mt-16">
              <Link href="/register">
                <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-white text-[#0A0A0A] hover:bg-white/90 transition-all duration-300 tracking-wide">
                  Ücretsiz Dene
                </Button>
              </Link>
            </Reveal>
          </div>
          </div>
        </section>

        {/* ─────────────── SOCIAL MEDIA ─────────────── */}
        <section className="relative pt-28 sm:pt-36 pb-24 bg-[#0A0A0A] overflow-hidden bg-grid-white">

          {/* Radial gradient fade — kenarları karartır, Aceternity tarzı */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, #0A0A0A 75%)",
            }}
          />

          <style>{`
            @keyframes soundBar {
              from { transform: scaleY(0.4); }
              to   { transform: scaleY(1.0); }
            }
          `}</style>

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 mb-14 text-center">
            <Reveal>
              <Overline light>Instagram</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-white leading-[1.0] mb-6"
              >
                Sosyal Medyada
                <br />
                <em className="not-italic font-light text-white/30" style={{ fontFamily: DISPLAY }}>
                  Lunia Studio.
                </em>
              </h2>
              <p style={{ fontFamily: BODY }} className="text-[14px] text-white/40 font-light leading-[1.75] mx-auto max-w-sm">
                Lunia Studio ile üretilen görseller Instagram'da nasıl görünüyor? Gerçek çekimlerden ayırt edilemeyen AI çıktıları.
              </p>
            </Reveal>
          </div>

          {/* Ortalanmış video kartları */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">
            <Reveal delay={100}>
              <div className="flex flex-wrap justify-center gap-4">
                {socialVideos.map((src, i) => (
                  <SocialVideoCard key={src} src={src} index={i} />
                ))}
              </div>
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
                Kredi kartı gerekmez. Birkaç dakikada kaydolun, ilk ürününüzü modele giydirin.
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
