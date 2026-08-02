"use client"

import { useState, useEffect, useRef, Fragment } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Gem, Circle, Sparkles, Watch } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import PricingSection from "@/components/ui/pricing-section"
import SmoothScroll from "@/components/SmoothScroll"
import SilkShader from "@/components/SilkShader"

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

/* ─── Masonry Wall ───────────────────────────────────────────────────── */
const wallImages: { src: string; ratio: "portrait" | "landscape" }[] = [
  { src: "/landing/landing_images/collection/ring_after.png",      ratio: "portrait" },
  { src: "/landing/landing_images/collection/necklace_after.png",  ratio: "landscape" },
  { src: "/landing/landing_images/collection/earrings_after.png",  ratio: "portrait" },
  { src: "/landing/landing_images/how_does_it_work/step2.jpg",     ratio: "portrait" },
  { src: "/landing/landing_images/collection/ring_after1.png",     ratio: "landscape" },
  { src: "/landing/landing_images/collection/necklace_after1.png", ratio: "portrait" },
  { src: "/landing/landing_images/collection/earrings_after1.png", ratio: "portrait" },
  { src: "/landing/landing_images/how_does_it_work/step1.jpg",     ratio: "landscape" },
  { src: "/landing/landing_images/collection/ring_after2.png",     ratio: "portrait" },
  { src: "/landing/landing_images/collection/necklace_after2.png", ratio: "landscape" },
  { src: "/landing/landing_images/collection/earrings_after2.png", ratio: "portrait" },
  { src: "/landing/landing_images/how_does_it_work/step3.jpg",     ratio: "portrait" },
  { src: "/landing/landing_images/collection/necklace_after3.png", ratio: "landscape" },
  { src: "/landing/landing_images/collection/earrings_after3.png", ratio: "portrait" },
]

/* per-card convergence offsets by column index: [xVw, yVh, scale] at e = 0 */
const CONVERGE_OFFSETS: [number, number, number][] = [
  [-24, 0, 1],
  [0, 16, 0.9],
  [0, 20, 0.9],
  [24, 0, 1],
]
const RESIDUAL_SPEEDS = [1.0, 0.9, 1.1, 0.95]

function MasonryWall() {
  const sectionRef = useRef<HTMLElement>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [colCount, setColCount] = useState(4)

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)")
    const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1279px)")
    const update = () => setColCount(mqMobile.matches ? 2 : mqTablet.matches ? 3 : 4)
    update()
    mqMobile.addEventListener("change", update)
    mqTablet.addEventListener("change", update)
    return () => {
      mqMobile.removeEventListener("change", update)
      mqTablet.removeEventListener("change", update)
    }
  }, [])

  /* per-card scroll-scrubbed convergence + column residual drift */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cards = cardRefs.current

    if (reduce) {
      cards.forEach((el) => {
        if (!el) return
        el.style.opacity = "1"
        el.style.transform = "none"
        el.style.willChange = "auto"
      })
      colRefs.current.forEach((col) => {
        if (col) col.style.transform = "none"
      })
      return
    }

    const initial: boolean[] = new Array(cards.length).fill(false)

    const markInitial = () => {
      const vh = window.innerHeight
      const scrollY = window.scrollY
      cards.forEach((el, i) => {
        if (!el) { initial[i] = false; return }
        const r = el.getBoundingClientRect()
        // document-relative top so scroll position does not confuse the check
        initial[i] = r.top + scrollY < vh
      })
    }

    const setupInitialStyles = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const mobile = vw < 768
      cards.forEach((el, i) => {
        if (!el) return
        const colIndex = i % colCount
        if (initial[i]) {
          el.style.transform = "none"
          el.style.opacity = "0"
          el.style.willChange = "opacity"
          el.style.transition = `opacity 600ms ease-out ${i * 60}ms`
        } else {
          const [xVw, yVh, s] = CONVERGE_OFFSETS[colIndex % 4]
          const x = (mobile ? Math.sign(xVw) * 8 : xVw) * (vw / 100)
          const y = mobile ? 0 : yVh * (vh / 100)
          el.style.transition = ""
          el.style.opacity = "0"
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s})`
          el.style.willChange = "transform, opacity"
        }
      })
      // fade the initial row in on the next frame
      requestAnimationFrame(() => {
        cards.forEach((el, i) => {
          if (el && initial[i]) el.style.opacity = "1"
        })
      })
    }

    // damped follow: each non-initial card eases its own current toward target
    const target = new Array(cards.length).fill(0)
    const current = new Array(cards.length).fill(0)
    const SMOOTH = 0.085
    const SETTLED = 0.001

    const readTargets = () => {
      const vh = window.innerHeight
      const start = vh * 1.15
      const end = vh * 0.15
      cards.forEach((el, i) => {
        if (!el || initial[i]) { target[i] = 0; return }
        const r = el.getBoundingClientRect()
        let p = (start - r.top) / (start - end)
        p = Math.max(0, Math.min(1, p))
        // smoothstep
        target[i] = p * p * (3.0 - 2.0 * p)
      })
    }

    // seed current to target so first paint does not animate from zero
    readTargets()
    for (let i = 0; i < current.length; i++) current[i] = target[i]

    let raf = 0
    let running = false
    let needsFrame = false

    const writeCards = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const mobile = vw < 768
      cards.forEach((el, i) => {
        if (!el || initial[i]) return
        const e = current[i]
        const colIndex = i % colCount
        const [xVw, yVh, s] = CONVERGE_OFFSETS[colIndex % 4]
        const r = 1 - e
        const x = (mobile ? Math.sign(xVw) * 8 : xVw) * (vw / 100) * r
        const y = (mobile ? 0 : yVh * (vh / 100)) * r
        const scale = 1 - (1 - s) * r
        const opacity = Math.min(1, e / 0.4)
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
        el.style.opacity = opacity.toFixed(3)
        const settling = Math.abs(target[i] - current[i]) > SETTLED
        el.style.willChange = settling || (e > 0 && e < 1) ? "transform, opacity" : "auto"
      })
    }

    const writeColumns = () => {
      const vh = window.innerHeight
      const mobile = window.innerWidth < 768
      colRefs.current.forEach((col, i) => {
        if (!col) return
        if (mobile) { col.style.transform = "none"; return }
        const r = col.getBoundingClientRect()
        const delta = vh / 2 - (r.top + r.height / 2)
        const drift = Math.max(-60, Math.min(60, delta * (RESIDUAL_SPEEDS[i % 4] - 1)))
        col.style.transform = `translate3d(0, ${drift.toFixed(2)}px, 0)`
      })
    }

    const tick = () => {
      readTargets()
      let anyMoving = false
      for (let i = 0; i < current.length; i++) {
        if (initial[i]) continue
        const d = target[i] - current[i]
        if (Math.abs(d) > SETTLED) {
          current[i] += d * SMOOTH
          anyMoving = true
        } else {
          current[i] = target[i]
        }
      }
      writeCards()
      writeColumns()

      if (anyMoving || needsFrame) {
        needsFrame = false
        raf = requestAnimationFrame(tick)
      } else {
        running = false
        raf = 0
      }
    }

    const kick = () => {
      needsFrame = true
      if (!running) {
        running = true
        raf = requestAnimationFrame(tick)
      }
    }

    // first paint: seed transforms without animating
    writeCards()
    writeColumns()

    const onScroll = () => { kick() }

    const onResize = () => {
      markInitial()
      setupInitialStyles()
      // reseed current to new targets so resize doesn't animate
      readTargets()
      for (let i = 0; i < current.length; i++) current[i] = target[i]
      writeCards()
      writeColumns()
      kick()
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [colCount])

  const columns: { img: (typeof wallImages)[number]; index: number }[][] = Array.from(
    { length: colCount },
    () => []
  )
  wallImages.forEach((img, index) => {
    columns[index % colCount].push({ img, index })
  })

  return (
    <section ref={sectionRef} className="relative bg-[#EFEEEA] pt-[72px] pb-28 sm:pt-[120px] sm:pb-36 overflow-hidden">

      <div className="px-5 md:px-8">
        <div className="flex gap-4">
          {columns.map((col, ci) => (
            <div
              key={ci}
              ref={(el) => { colRefs.current[ci] = el }}
              className="flex-1 flex flex-col gap-4"
              style={{ willChange: "transform" }}
            >
              {col.map(({ img, index }) => (
                <div
                  key={img.src}
                  ref={(el) => { cardRefs.current[index] = el }}
                  className="relative overflow-hidden rounded-[20px]"
                  style={{
                    aspectRatio: img.ratio === "portrait" ? "3 / 5" : "4 / 3",
                  }}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    priority={index < 4}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


/* ─── Wall Headline ──────────────────────────────────────────────────── */
const HEADLINE_WORDS = ["HEPSİ", "LUNIA", "İLE", "ÜRETİLDİ"]
const SUB_DELAY_MS = (HEADLINE_WORDS.length - 1) * 90 + 180

function WallHeadline() {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [instant, setInstant] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInstant(true)
      setRevealed(true)
      return
    }
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRevealed(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -12% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className={`bg-[#EFEEEA] px-5 py-[80px] md:px-8 md:py-[120px]${revealed ? " revealed" : ""}${instant ? " hl-instant" : ""}`}
    >
      <div className="headlineStack">
        <SilkShader className="hl-canvas" />
        <h2
          className="headlineText"
          style={{
            fontFamily: "var(--font-display)",
            fontVariationSettings: "'wght' 900, 'wdth' 118",
            fontSize: "clamp(38px, 7.4vw, 128px)",
            // hard floor for Turkish uppercase display text: never below 1.0
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
          }}
        >
          {HEADLINE_WORDS.map((word, i) => (
            <Fragment key={word + i}>
              <span className="hl-mask">
                <span
                  className="hl-word"
                  style={{ transitionDelay: instant ? "0ms" : `${i * 90}ms` }}
                >
                  {word}
                </span>
              </span>{" "}
            </Fragment>
          ))}
        </h2>
      </div>
      <p
        className="hl-sub text-[16px] md:text-[18px]"
        style={{
          fontFamily: BODY,
          lineHeight: 1.55,
          color: "#6B7280",
          maxWidth: "520px",
          marginTop: "24px",
          transitionDelay: instant ? "0ms" : `${SUB_DELAY_MS}ms`,
        }}
      >
        Yukarıdaki her kare, tek bir ürün fotoğrafından saniyeler içinde
        oluşturuldu. Stüdyo yok, model yok, çekim günü yok.
      </p>
      <style>{`
        .headlineStack {
          position: relative;
          isolation: isolate;
          display: block;
        }
        .headlineStack .hl-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          display: block;
        }
        .headlineText {
          position: relative;
          z-index: 1;
          background: #EFEEEA;
          color: #000000;
          mix-blend-mode: lighten;
        }
        .hl-mask {
          display: inline-block;
          overflow: hidden;
          vertical-align: bottom;
          padding-top: 0.18em;
          margin-top: -0.18em;
          padding-bottom: 0.12em;
          margin-bottom: -0.12em;
        }
        .hl-word {
          display: inline-block;
          transform: translateY(110%);
          transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .revealed .hl-word {
          transform: translateY(0);
        }
        .hl-sub {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 700ms ease, transform 700ms ease;
        }
        .revealed .hl-sub {
          opacity: 1;
          transform: translateY(0);
        }
        .hl-instant .hl-word,
        .hl-instant .hl-sub {
          transition: none;
        }
      `}</style>
    </section>
  )
}

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
        <div className="flex gap-1 bg-white rounded-full p-1 border border-[#E5E7EB]">
          {(['jewelry', 'clothing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                studioTab === tab
                  ? "bg-[#111827] shadow-sm text-white"
                  : "text-[#6B7280] hover:text-[#111827]"
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
                    className={`relative flex-1 aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] transition-all duration-200 cursor-pointer ${
                      selected === i
                        ? "ring-2 ring-[#111827] scale-[1.02]"
                        : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img src={d.before} alt={d.cat} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent py-1.5">
                      <span
                        style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: "9px", letterSpacing: "0.18em" }}
                        className="block text-center text-white uppercase font-medium"
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
                  <span style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.2em" }} className="text-[#6B7280] uppercase font-medium bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded">
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
                        ? "border-[#111827] bg-[#111827] text-white"
                        : "border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827]"
                    }`}
                    style={{ fontFamily: BODY, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Kıyafet için placeholder */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <Sparkles size={22} strokeWidth={1.2} className="text-[#C4C0B8]" />
                  <p style={{ fontFamily: BODY, fontSize: "12px", letterSpacing: "0.02em" }} className="text-[#6B7280] font-light leading-relaxed">
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
                    <Sparkles size={22} strokeWidth={1.2} className="text-[#C4C0B8]" />
                    <p style={{ fontFamily: BODY, fontSize: "12.5px", letterSpacing: "0.02em" }} className="text-[#6B7280] font-light leading-relaxed">
                      Görseli oluşturmak için<br />aşağıdaki butona tıklayın
                    </p>
                  </div>
                )}

                {/* LOADING */}
                {phase === "loading" && (
                  <div className="flex flex-col items-center gap-5 px-6 text-center">
                    <div className="flex items-center gap-3">
                      <Gem size={26} strokeWidth={1.2} className="text-[#111827] animate-pulse" style={{ animationDelay: '0ms' }} />
                      <Circle size={26} strokeWidth={1.2} className="text-[#111827] animate-pulse" style={{ animationDelay: '200ms' }} />
                      <Sparkles size={26} strokeWidth={1.2} className="text-[#111827] animate-pulse" style={{ animationDelay: '400ms' }} />
                      <Watch size={26} strokeWidth={1.2} className="text-[#111827] animate-pulse" style={{ animationDelay: '600ms' }} />
                    </div>
                    <p style={{ fontFamily: BODY, fontSize: "12.5px", letterSpacing: "0.02em" }} className="text-[#6B7280] font-light">
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
                      <span style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.2em" }} className="text-[#111827] uppercase font-medium bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded">
                        Model Görseli
                      </span>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="absolute bottom-3.5 right-3.5 bg-[#111827] px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#111827]/90 transition-all"
                    >
                      <span style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.18em" }} className="text-white uppercase font-medium">
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
                    ? "bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed border border-[#E5E7EB]"
                    : phase === "done"
                    ? "bg-white text-[#111827] hover:bg-[#F9FAFB] border border-[#E5E7EB]"
                    : "bg-[#111827] text-white hover:bg-[#111827]/90"
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
                  <Sparkles size={22} strokeWidth={1.2} className="text-[#C4C0B8]" />
                  <p style={{ fontFamily: BODY, fontSize: "13px", letterSpacing: "0.01em" }} className="text-[#6B7280] font-light leading-[1.7]">
                    Yakında — Kıyafet stüdyosu<br />demo görselleri ekleniyor
                  </p>
                </div>
              </div>

              {/* Disabled buton — kıyafet */}
              <button
                disabled
                className="w-full h-12 rounded-full text-[12px] font-semibold uppercase tracking-[0.15em] bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] cursor-not-allowed opacity-60"
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
      {/* GlowingEffect'in border'ı dışarı taşabilmesi için overflow-hidden YOK */}
      <div
        className="relative rounded-[28px] border border-[#E5E7EB] transition-all duration-500 group-hover:border-[#111827]/25 group-hover:shadow-[0_8_32px_rgba(17,24,39,0.08)]"
        style={{ aspectRatio: "9/16" }}
      >
        <GlowingEffect disabled={false} proximity={64} borderWidth={3} spread={30} />

        {/* Video içeriği ayrı bir wrapper'da overflow-hidden ile kırpılıyor */}
        <div className="absolute inset-0 rounded-[28px] overflow-hidden bg-white">
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
            className="absolute inset-0 bg-black/25 transition-opacity duration-400"
            style={{ opacity: playing ? 0 : 1 }}
          />

          {/* Play butonu */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-300"
            style={{ opacity: playing ? 0 : 1, transform: playing ? "scale(0.75)" : "scale(1)" }}
          >
            <div className="w-[60px] h-[60px] rounded-full bg-white/90 backdrop-blur-md border border-[#E5E7EB] flex items-center justify-center shadow-2xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#111827">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Sıra etiketi — sol üst */}
          <div className="absolute top-4 left-4">
            <span
              style={{ fontFamily: BODY, letterSpacing: "0.18em" }}
              className="text-[10px] uppercase text-[#111827] font-medium bg-white/85 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#E5E7EB]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Ses dalgası — oynarken */}
          {playing && (
            <div className="absolute bottom-4 right-4 flex items-end gap-[3px]">
              {[6, 10, 14, 10, 6].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-white/80"
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
    </div>
  )
}

/* ─── Overline label ─────────────────────────────────────────────────── */
function Overline({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      style={{ fontFamily: BODY }}
      className={`text-[11px] tracking-[0.28em] uppercase font-medium mb-5 ${light ? "text-white/85" : "text-[#6B7280]"}`}
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

  return (
    <div style={{ fontFamily: BODY }} className="min-h-screen bg-[#EFEEEA] text-[#111827]">

      <SmoothScroll />

      {/* ─────────────── NAVBAR ─────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="px-5 md:px-8 py-5 flex items-center justify-between">

          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5">
            <span
              style={{ fontFamily: DISPLAY, textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
              className="text-[12px] font-light tracking-[0.22em] uppercase text-white"
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
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                className="text-[13px] font-medium transition-colors duration-300 cursor-pointer text-white hover:text-white/80"
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
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                className="h-9 px-4 text-[13px] font-medium rounded-full cursor-pointer transition-all duration-300 text-white hover:text-white/80 hover:bg-transparent"
              >
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button
                className="h-9 px-5 text-[13px] font-semibold rounded-full cursor-pointer transition-all duration-300 bg-[#111827] text-white hover:bg-[#111827]/90 border-0"
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
          {/* Legibility gradient confined to bottom text area */}
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/70 via-black/35 to-transparent pointer-events-none" />

          {/*
            Fade into the page background. Colour hardcoded to #EFEEEA (page bg);
            if the page background token changes, update these stops too or a
            visible seam will appear where the hero meets the next section.
          */}
          <div
            className="absolute inset-x-0 bottom-0 h-[140px] sm:h-[220px] pointer-events-none z-[5]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(239,238,234,0) 0%, rgba(239,238,234,0.55) 55%, rgba(239,238,234,1) 100%)",
            }}
          />

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
                className="not-italic font-light text-white/70"
                style={{ fontFamily: DISPLAY }}
              >
                Üzerinde.
              </em>
            </h1>
            <p
              style={{ fontFamily: BODY }}
              className="text-[15px] text-white/80 max-w-xs mb-9 leading-[1.7] font-light"
            >
              Pahalı stüdyo çekimi olmadan, profesyonel model görsellerine dönüştürün.
            </p>
            <Link href="/register">
              <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-white text-[#111827] hover:bg-white/90 transition-all duration-300 tracking-wide">
                Ücretsiz Başla
              </Button>
            </Link>
          </div>

          {/* Scroll line indicator */}
          <div className="absolute bottom-8 right-10 hidden sm:flex flex-col items-center gap-1.5 opacity-70">
            <span style={{ fontFamily: BODY }} className="text-[9px] tracking-[0.25em] uppercase text-white rotate-90 mb-2 origin-center">
              scroll
            </span>
            <div className="w-px h-10 bg-white/70" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          </div>
        </section>

        {/* ─────────────── MASONRY WALL ─────────────── */}
        <MasonryWall />

        {/* ─────────────── WALL HEADLINE ─────────────── */}
        <WallHeadline />

        {/* ─────────────── RESULTS — Before/After ─────────────── */}
        <section id="sonuclar" className="relative py-28 sm:py-36 bg-[#EFEEEA]">

          <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">

            <Reveal>
              <Overline>Sonuçlar</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-[#111827] leading-[1.0] mb-6 max-w-xl"
              >
                Ürün fotoğrafından
                <br />
                <em className="not-italic font-light text-[#C4C0B8]" style={{ fontFamily: DISPLAY }}>
                  model görseline.
                </em>
              </h2>
              <p style={{ fontFamily: BODY }} className="text-[14px] text-[#6B7280] font-light mb-16 max-w-sm leading-[1.75]">
                Takı veya kıyafet fotoğrafınızı yükleyin, modele giydirin — saniyeler içinde stüdyo kalitesi.
              </p>
            </Reveal>

            <DemoSimulator />

            <Reveal delay={200} className="mt-16">
              <Link href="/register">
                <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-[#111827] text-white hover:bg-[#111827]/90 transition-all duration-300 tracking-wide">
                  Ücretsiz Dene
                </Button>
              </Link>
            </Reveal>
          </div>
          </div>
        </section>

        {/* ─────────────── SOCIAL MEDIA ─────────────── */}
        <section className="relative pt-28 sm:pt-36 pb-24 bg-[#EFEEEA] overflow-hidden">

          <style>{`
            @keyframes soundBar {
              from { transform: scaleY(0.4); }
              to   { transform: scaleY(1.0); }
            }
          `}</style>

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 mb-14 text-center">
            <Reveal>
              <Overline>Instagram</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-[#111827] leading-[1.0] mb-6"
              >
                Sosyal Medyada
                <br />
                <em className="not-italic font-light text-[#C4C0B8]" style={{ fontFamily: DISPLAY }}>
                  Lunia Studio.
                </em>
              </h2>
              <p style={{ fontFamily: BODY }} className="text-[14px] text-[#6B7280] font-light leading-[1.75] mx-auto max-w-sm">
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

        {/* ─────────────── PRICING ─────────────── */}
        <PricingSection />

        {/* ─────────────── CTA — Video ─────────────── */}
        <section className="relative min-h-[88vh] overflow-hidden flex items-end border-t border-[#E5E7EB]">
          <video
            src="/landing/landing_videos/luxury.mp4"
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Legibility gradient confined to bottom text area */}
          <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/75 via-black/40 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-16 w-full pb-20">
            <Reveal>
              <Overline light>HEMEN BAŞLA</Overline>
              <h2
                style={{ fontFamily: DISPLAY }}
                className="text-[2.4rem] sm:text-[3.75rem] md:text-[4.5rem] font-extrabold tracking-[-0.035em] text-white leading-[0.95] mb-8 max-w-2xl"
              >
                İlk Görselinizi
                <br />
                <em className="not-italic font-light text-white/70" style={{ fontFamily: DISPLAY }}>
                  Bugün Üretin.
                </em>
              </h2>
              <p
                style={{ fontFamily: BODY }}
                className="text-[15px] text-white/80 max-w-sm mb-10 font-light leading-[1.7]"
              >
                Kredi kartı gerekmez. Birkaç dakikada kaydolun, ilk ürününüzü modele giydirin.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="h-11 px-8 text-[13px] font-semibold rounded-full cursor-pointer bg-white text-[#111827] hover:bg-white/92 transition-all duration-300 tracking-wide">
                    Hemen Dene
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="h-11 px-8 text-[13px] font-medium rounded-full cursor-pointer bg-transparent border border-white/60 text-white hover:bg-white/10 transition-all duration-300">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="bg-[#EFEEEA]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            {/* Brand */}
            <span
              style={{ fontFamily: DISPLAY }}
              className="text-[11px] font-light text-[#111827] tracking-[0.22em] uppercase"
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
                  className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p
              style={{ fontFamily: BODY }}
              className="text-[12px] text-[#6B7280] font-light"
            >
              © 2026 Lunia Studio
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
