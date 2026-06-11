"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ImageOff, Sparkles, Gem, Link2, Heart, Share2, ChevronsLeftRight } from "lucide-react"
import { toast } from "sonner"

type Generation = {
  id: string
  output_image_url: string
  jewelry_type: string
  created_at: string
  is_favorite: boolean
  jewelry_items: { original_image_url: string } | null
}

type Tab = "all" | "favorites"

const JEWELRY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  ring:     { label: "Yüzük",  icon: Gem      },
  necklace: { label: "Kolye",  icon: Link2    },
  earring:  { label: "Küpe",   icon: Sparkles },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

async function handleShare(url: string) {
  if (navigator.share) {
    await navigator.share({
      title: "Jewelry Virtual Try-On",
      text: "Takılarımı AI ile fotoğrafladım!",
      url: url,
    })
  } else {
    await navigator.clipboard.writeText(url)
    toast("Link kopyalandı!")
  }
}

async function handleDownload(url: string, index: number) {
  const response = await fetch(url)
  const blob = await response.blob()
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `jewelry-virtual-${index + 1}.jpg`
  a.click()
  URL.revokeObjectURL(a.href)
}

function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
}: {
  beforeSrc: string
  afterSrc: string
  alt: string
}) {
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((clientX - left) / width) * 100))
    setPos(pct)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    updatePos(e.clientX)
  }, [updatePos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePos(e.clientX)
  }, [updatePos])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F9FAFB] select-none"
    >
      {/* After (right/output) — base layer */}
      <img
        src={afterSrc}
        alt={alt}
        crossOrigin="anonymous"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Before (left/original) — clipped layer */}
      <img
        src={beforeSrc}
        alt="Orijinal takı"
        crossOrigin="anonymous"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_4px_rgba(0,0,0,0.4)] pointer-events-none"
        style={{ left: `${pos}%` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center cursor-ew-resize touch-none z-10"
        style={{ left: `${pos}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <ChevronsLeftRight size={14} className="text-[#374151]" />
      </div>

      {/* Labels */}
      <span className="absolute bottom-2 left-2 text-[9px] font-medium tracking-wide uppercase text-white/80 bg-black/30 px-1.5 py-0.5 rounded pointer-events-none">
        Önce
      </span>
      <span className="absolute bottom-2 right-2 text-[9px] font-medium tracking-wide uppercase text-white/80 bg-black/30 px-1.5 py-0.5 rounded pointer-events-none">
        Sonra
      </span>
    </div>
  )
}

export default function GalleryPage() {
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")
  const [zipping, setZipping] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data } = await supabase
        .from("generations")
        .select("id, output_image_url, jewelry_type, created_at, is_favorite, jewelry_items(original_image_url)")
        .eq("status", "done")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      setItems((data ?? []) as Generation[])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleFavorite(id: string, current: boolean) {
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, is_favorite: !current } : item)
    )
    await supabase.from("generations").update({ is_favorite: !current }).eq("id", id)
  }

  const displayed = tab === "favorites" ? items.filter((i) => i.is_favorite) : items

  async function handleDownloadAll() {
    if (displayed.length === 0 || zipping) return
    setZipping(true)
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      await Promise.all(
        displayed.map(async (gen, i) => {
          const response = await fetch(gen.output_image_url)
          const blob = await response.blob()
          zip.file(`jewelry-virtual-${i + 1}.jpg`, blob)
        })
      )
      const content = await zip.generateAsync({ type: "blob" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(content)
      a.download = "jewelry-virtual-photos.zip"
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
            Galeri
          </h1>
          <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
            Ürettiğiniz takı görsellerinin tamamı burada.
          </p>
        </div>
        {!loading && displayed.length > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={zipping}
            className="flex items-center gap-1.5 h-9 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download size={13} />
            {zipping ? "Hazırlanıyor..." : "Tümünü İndir"}
          </button>
        )}
      </div>

      {/* Tab selector */}
      {!loading && items.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              tab === "all"
                ? "bg-[#111827] text-white"
                : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setTab("favorites")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              tab === "favorites"
                ? "bg-red-500 text-white"
                : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
            }`}
          >
            <Heart size={13} className={tab === "favorites" ? "fill-white" : ""} />
            Favoriler
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-3 space-y-3">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white min-h-[420px] gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
            <ImageOff size={22} className="text-[#9CA3AF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">
              Henüz üretim yok
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              İlk takı görselinizi üretin ve burada görün.
            </p>
          </div>
          <Link href="/upload">
            <Button className="h-10 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium rounded-xl px-5 cursor-pointer">
              <Sparkles size={14} className="mr-2" />
              Üretmeye Başla
            </Button>
          </Link>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white min-h-[300px] gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center">
            <Heart size={22} className="text-[#FB7185]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">
              Henüz favori yok
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Beğendiğiniz görselleri favorilere ekleyin.
            </p>
          </div>
          <button
            onClick={() => setTab("all")}
            className="text-sm text-[#374151] underline underline-offset-2 cursor-pointer"
          >
            Tüm görsellere dön
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((item) => {
            const type = JEWELRY_LABELS[item.jewelry_type]
            const Icon = type?.icon ?? Gem
            const originalSrc = item.jewelry_items?.original_image_url ?? "/placeholder-jewelry.jpg"
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#E5E7EB] bg-white p-3 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="relative">
                  <BeforeAfterSlider
                    beforeSrc={originalSrc}
                    afterSrc={item.output_image_url}
                    alt={type?.label ?? item.jewelry_type}
                  />
                  <button
                    onClick={() => toggleFavorite(item.id, item.is_favorite)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer z-20"
                    aria-label={item.is_favorite ? "Favoriden çıkar" : "Favoriye ekle"}
                  >
                    <Heart
                      size={14}
                      className={item.is_favorite ? "fill-red-500 text-red-500" : "text-[#9CA3AF]"}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] text-xs font-medium">
                    <Icon size={11} />
                    {type?.label ?? item.jewelry_type}
                  </span>
                  <span className="text-xs text-[#9CA3AF] ml-auto">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(item.output_image_url, items.indexOf(item))}
                    className="flex items-center justify-center gap-1.5 flex-1 h-8 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    İndir
                  </button>
                  <button
                    onClick={() => handleShare(item.output_image_url)}
                    className="flex items-center justify-center gap-1.5 flex-1 h-8 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <Share2 size={13} />
                    Paylaş
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
