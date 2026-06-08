"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ImageOff, Sparkles, Gem, Link2 } from "lucide-react"

type Generation = {
  id: string
  output_image_url: string
  jewelry_type: string
  created_at: string
}

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

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data } = await supabase
        .from("generations")
        .select("id, output_image_url, jewelry_type, created_at")
        .eq("status", "done")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const type = JEWELRY_LABELS[item.jewelry_type]
            const Icon = type?.icon ?? Gem
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#E5E7EB] bg-white p-3 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#F9FAFB]">
                  <img
                    src={item.output_image_url}
                    alt={type?.label ?? item.jewelry_type}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
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
