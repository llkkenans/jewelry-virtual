"use client"

import Link from "next/link"
import { useRef } from "react"

const SERIF = "'Cormorant Garamond', Georgia, serif"
const BODY  = "'Inter', sans-serif"

const studios = [
  {
    href:        "/upload",
    badge:       "Mevcut",
    title:       "Takı Stüdyosu",
    description: "Yüzük, kolye, küpe, saat — model üzerinde göster",
    gradient:    "from-[#3a3530] to-[#1a1714]",
    video:       "/studio_sec/taki.mp4",
  },
  {
    href:        "/clothing-studio",
    badge:       "Yeni",
    title:       "Kıyafet Stüdyosu",
    description: "Kıyafet görsellerini gerçek model üzerinde canlandır",
    gradient:    "from-[#2c3038] to-[#14171e]",
    video:       "/studio_sec/kiyafet.mp4",
  },
]

type Studio = typeof studios[0]

function StudioCard({ href, badge, title, description, gradient, video }: Studio) {
  const videoRef = useRef<HTMLVideoElement>(null)

  function handleMouseEnter() {
    videoRef.current?.play()
  }

  function handleMouseLeave() {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex-1 h-[380px] rounded-2xl overflow-hidden cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1.5"
    >
      {/* Arka plan gradient (video yüklenene kadar görünür) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Video arka plan */}
      <video
        ref={videoRef}
        src={video}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Alt overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

      {/* İçerik */}
      <div className="absolute bottom-0 left-0 right-0 p-7 text-white">

        {/* Badge */}
        <span
          style={{ fontFamily: BODY, letterSpacing: "0.15em" }}
          className="text-[10px] uppercase text-[#C9A96E] font-semibold mb-2 block"
        >
          {badge}
        </span>

        {/* Başlık */}
        <p
          style={{ fontFamily: SERIF }}
          className="text-[26px] font-medium mb-2 leading-tight"
        >
          {title}
        </p>

        {/* Açıklama */}
        <p
          style={{ fontFamily: BODY }}
          className="text-sm text-white/70 mb-5 font-light leading-relaxed"
        >
          {description}
        </p>

        {/* CTA */}
        <span
          style={{ fontFamily: BODY, letterSpacing: "0.12em" }}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase font-semibold text-[#C9A96E] transition-all duration-300 group-hover:gap-3"
        >
          Devam et →
        </span>
      </div>
    </Link>
  )
}

export default function StudioPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-4xl">

        {/* Üst etiket */}
        <p
          style={{ fontFamily: BODY, letterSpacing: "0.2em" }}
          className="text-center text-[11px] uppercase text-[#9C9588] mb-2"
        >
          Lunia Studio
        </p>

        {/* Başlık */}
        <h1
          style={{ fontFamily: SERIF }}
          className="text-center text-[28px] sm:text-[32px] font-light text-[#111827] mb-10 tracking-tight"
        >
          Hangi stüdyoyu kullanmak istersin?
        </h1>

        {/* Kartlar */}
        <div className="flex flex-col md:flex-row gap-5">
          {studios.map((s) => (
            <StudioCard key={s.href} {...s} />
          ))}
        </div>

      </div>
    </div>
  )
}
