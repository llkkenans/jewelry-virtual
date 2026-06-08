"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
    desc: "Görsel yüklendikten sonra yapay zeka motoru ortalama 30 saniyede çıktı üretir. Bekleme yok.",
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
  /* Parallax */
  const heroContentRef = useRef<HTMLDivElement>(null)

  /* Fade-in state'leri */
  const howRef = useRef<HTMLElement>(null)
  const [howVisible, setHowVisible] = useState(false)

  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [cardsVisible, setCardsVisible] = useState([false, false, false])

  const ctaRef = useRef<HTMLElement>(null)
  const [ctaVisible, setCtaVisible] = useState(false)

  /* Parallax — scroll dinle */
  useEffect(() => {
    function onScroll() {
      if (heroContentRef.current) {
        heroContentRef.current.style.transform =
          `translateY(${window.scrollY * 0.2}px)`
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* IntersectionObserver — fade-in */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          if (entry.target === howRef.current) {
            setHowVisible(true)
          } else if (entry.target === ctaRef.current) {
            setCtaVisible(true)
          } else {
            const idx = cardRefs.current.indexOf(
              entry.target as HTMLDivElement
            )
            if (idx !== -1) {
              setTimeout(() => {
                setCardsVisible((prev) => {
                  const next = [...prev]
                  next[idx] = true
                  return next
                })
              }, idx * 120)
            }
          }

          obs.unobserve(entry.target)
        })
      },
      { threshold: 0.12 }
    )

    if (howRef.current) obs.observe(howRef.current)
    if (ctaRef.current) obs.observe(ctaRef.current)
    cardRefs.current.forEach((el) => { if (el) obs.observe(el) })

    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#111827]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rotate-45 border-2 border-[#111827] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#111827] rotate-45" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Jewelry Virtual</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Giriş Yap
            </Link>
            <Link href="/register">
              <Button className="h-8 px-4 bg-[#111827] hover:bg-[#1F2937] text-white text-sm rounded-lg cursor-pointer">
                Ücretsiz Dene
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="overflow-hidden">
          <div
            ref={heroContentRef}
            style={{ willChange: "transform" }}
            className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Sol: metin */}
              <div>
                <Badge
                  variant="secondary"
                  className="mb-6 bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] text-xs font-medium px-3 py-1 rounded-full"
                >
                  B2B Kuyumcu Çözümü
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.15] text-[#111827] mb-6">
                  Takılarınızı Saniyeler
                  <br />
                  İçinde Canlandırın
                </h1>
                <p className="text-base text-[#6B7280] leading-relaxed mb-10 max-w-md">
                  Pahalı stüdyo çekimine gerek yok. Yapay zeka ile takınızı
                  gerçek modeller üzerinde görün.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/register">
                    <Button className="h-11 px-6 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium rounded-xl cursor-pointer">
                      Ücretsiz Dene →
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="h-11 px-6 border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-xl hover:bg-[#F9FAFB] cursor-pointer"
                    >
                      Giriş Yap
                    </Button>
                  </Link>
                </div>
                <p className="mt-5 text-xs text-[#9CA3AF]">
                  Kredi kartı gerekmez &nbsp;·&nbsp; 10 ücretsiz kredi &nbsp;·&nbsp; Anında başla
                </p>
              </div>

              {/* Sağ: video */}
              <div className="w-full">
                <video
                  src="/videos/luxury.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full rounded-2xl shadow-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-[#E5E7EB]" />

        {/* ── Nasıl Çalışır ── */}
        <section
          ref={howRef}
          style={{
            opacity: howVisible ? 1 : 0,
            transform: howVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
          className="max-w-5xl mx-auto px-4 sm:px-6 py-20"
        >
          <div className="mb-12">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-widest mb-3">
              Nasıl Çalışır
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
              Üç adımda stüdyo kalitesi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#9CA3AF] tabular-nums">{n}</span>
                  <div className="h-px flex-1 bg-[#E5E7EB]" />
                  <div className="w-9 h-9 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                    <Icon size={16} className="text-[#6B7280]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827] mb-1">{title}</p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-[#E5E7EB]" />

        {/* ── Özellikler ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-widest mb-3">
              Özellikler
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
              Neden Jewelry Virtual?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                ref={(el) => { cardRefs.current[i] = el }}
                style={{
                  opacity: cardsVisible[i] ? 1 : 0,
                  transform: cardsVisible[i] ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                }}
              >
                <Card className="border border-[#E5E7EB] shadow-none rounded-xl bg-white h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                      <Icon size={18} className="text-[#111827]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827] mb-1.5">{title}</p>
                      <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-[#E5E7EB]" />

        {/* ── CTA ── */}
        <section
          ref={ctaRef}
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
          className="max-w-5xl mx-auto px-4 sm:px-6 py-20"
        >
          <div className="bg-[#111827] rounded-2xl px-8 py-14 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Hemen Başla
            </h2>
            <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed">
              10 ücretsiz kredi ile takılarınızın model görsellerini dakikalar içinde oluşturun.
            </p>
            <Link href="/register">
              <Button className="h-11 px-8 bg-white hover:bg-white/90 text-[#111827] text-sm font-semibold rounded-xl cursor-pointer mt-2">
                Ücretsiz Hesap Oluştur →
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rotate-45 border border-[#9CA3AF] flex items-center justify-center">
              <div className="w-1 h-1 bg-[#9CA3AF] rotate-45" />
            </div>
            <span className="text-xs text-[#9CA3AF]">© 2026 Jewelry Virtual</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Giriş Yap
            </Link>
            <Link href="/register" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
