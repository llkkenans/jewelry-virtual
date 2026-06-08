"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ImageOff, Sparkles, Gem, Link2, Heart } from "lucide-react"

type Generation = {
  id: string
  output_image_url: string
  jewelry_type: string
  created_at: string
  is_favorite: boolean
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

async function handleDownload(url: string, index: number) {
  const response = await fetch(url)
  const blob = await response.blob()
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `jewelry-virtual-${index + 1}.jpg`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function GalleryPage() {
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data } = await supabase
        .from("generations")
        .select("id, output_image_url, jewelry_type, created_at, is_favorite")
        .eq("status", "done")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      setItems(data ?? [])
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">
          Galeri
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Ürettiğiniz takı görsellerinin tamamı burada.
        </p>
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
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#E5E7EB] bg-white p-3 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F9FAFB]">
                  <img
                    src={item.output_image_url}
                    alt={type?.label ?? item.jewelry_type}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(item.id, item.is_favorite)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
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

                <button
                  onClick={() => handleDownload(item.output_image_url, items.indexOf(item))}
                  className="flex items-center justify-center gap-1.5 w-full h-8 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  İndir
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
