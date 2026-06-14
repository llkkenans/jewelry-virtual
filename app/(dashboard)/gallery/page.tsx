"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ImageOff, Sparkles, Gem, Link2, Heart, Share2, Trash2, CheckSquare, Square, X } from "lucide-react"
import { toast } from "sonner"

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

async function handleShare(url: string) {
  if (navigator.share) {
    await navigator.share({ title: "Lunia Studio", text: "Takılarımı AI ile fotoğrafladım!", url })
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

export default function GalleryPage() {
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")
  const [zipping, setZipping] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, is_favorite: !current } : item))
    await supabase.from("generations").update({ is_favorite: !current }).eq("id", id)
  }

  async function deleteOne(id: string) {
    setDeleting(true)
    await supabase.from("generations").delete().eq("id", id)
    setItems((prev) => prev.filter((item) => item.id !== id))
    setDeleteConfirm(null)
    setDeleting(false)
    toast("Görsel silindi.")
  }

  async function deleteSelected() {
    setDeleting(true)
    const ids = Array.from(selected)
    await supabase.from("generations").delete().in("id", ids)
    setItems((prev) => prev.filter((item) => !selected.has(item.id)))
    setSelected(new Set())
    setBulkDeleteConfirm(false)
    setSelectMode(false)
    setDeleting(false)
    toast(`${ids.length} görsel silindi.`)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === displayed.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(displayed.map((i) => i.id)))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
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
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Galeri</h1>
          <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
            Ürettiğiniz takı görsellerinin tamamı burada.
          </p>
        </div>

        {!loading && displayed.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {!selectMode ? (
              <>
                <button
                  onClick={() => setSelectMode(true)}
                  className="flex items-center gap-1.5 h-9 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  <CheckSquare size={13} />
                  Seç
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={zipping}
                  className="flex items-center gap-1.5 h-9 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={13} />
                  {zipping ? "Hazırlanıyor..." : "Tümünü İndir"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 h-9 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  {selected.size === displayed.length ? <CheckSquare size={13} className="text-[#111827]" /> : <Square size={13} />}
                  {selected.size === displayed.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                </button>
                {selected.size > 0 && (
                  <button
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="flex items-center gap-1.5 h-9 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Seçilenleri Sil ({selected.size})
                  </button>
                )}
                <button
                  onClick={exitSelectMode}
                  className="flex items-center gap-1.5 h-9 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  <X size={13} />
                  İptal
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!loading && items.length > 0 && !selectMode && (
        <div className="flex gap-2">
          <button onClick={() => setTab("all")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${tab === "all" ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`}>Tümü</button>
          <button onClick={() => setTab("favorites")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${tab === "favorites" ? "bg-red-500 text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`}>
            <Heart size={13} className={tab === "favorites" ? "fill-white" : ""} />
            Favoriler
          </button>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Görseli sil?</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-9 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-medium hover:bg-[#F9FAFB] transition-colors cursor-pointer">İptal</button>
              <button onClick={() => deleteOne(deleteConfirm)} disabled={deleting} className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50">
                {deleting ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">{selected.size} görsel silinecek</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 h-9 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-medium hover:bg-[#F9FAFB] transition-colors cursor-pointer">İptal</button>
              <button onClick={deleteSelected} disabled={deleting} className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50">
                {deleting ? "Siliniyor..." : `${selected.size} Görseli Sil`}
              </button>
            </div>
          </div>
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
            <p className="text-sm font-semibold text-[#111827]">Henüz üretim yok</p>
            <p className="text-xs text-[#6B7280] mt-1">İlk takı görselinizi üretin ve burada görün.</p>
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
            <p className="text-sm font-semibold text-[#111827]">Henüz favori yok</p>
            <p className="text-xs text-[#6B7280] mt-1">Beğendiğiniz görselleri favorilere ekleyin.</p>
          </div>
          <button onClick={() => setTab("all")} className="text-sm text-[#374151] underline underline-offset-2 cursor-pointer">Tüm görsellere dön</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((item) => {
            const type = JEWELRY_LABELS[item.jewelry_type]
            const Icon = type?.icon ?? Gem
            const isSelected = selected.has(item.id)
            return (
              <div
                key={item.id}
                onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                className={`rounded-xl border bg-white p-3 space-y-3 hover:shadow-sm transition-all ${selectMode ? "cursor-pointer" : ""} ${isSelected ? "border-[#111827] ring-2 ring-[#111827]/10" : "border-[#E5E7EB]"}`}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F9FAFB]">
                  <img src={item.output_image_url} alt={type?.label ?? item.jewelry_type} crossOrigin="anonymous" className="w-full h-full object-cover" />
                  {selectMode ? (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                      {isSelected ? <CheckSquare size={16} className="text-[#111827]" /> : <Square size={16} className="text-[#9CA3AF]" />}
                    </div>
                  ) : (
                    <>
                      <button onClick={() => toggleFavorite(item.id, item.is_favorite)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer" aria-label={item.is_favorite ? "Favoriden çıkar" : "Favoriye ekle"}>
                        <Heart size={14} className={item.is_favorite ? "fill-red-500 text-red-500" : "text-[#9CA3AF]"} />
                      </button>
                      <button onClick={() => setDeleteConfirm(item.id)} className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 hover:bg-red-50 transition-all cursor-pointer" aria-label="Görseli sil">
                        <Trash2 size={13} className="text-[#9CA3AF] hover:text-red-500" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] text-xs font-medium">
                    <Icon size={11} />
                    {type?.label ?? item.jewelry_type}
                  </span>
                  <span className="text-xs text-[#9CA3AF] ml-auto">{formatDate(item.created_at)}</span>
                </div>
                {!selectMode && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(item.output_image_url, items.indexOf(item))} className="flex items-center justify-center gap-1.5 flex-1 h-8 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer">
                      <Download size={13} />İndir
                    </button>
                    <button onClick={() => handleShare(item.output_image_url)} className="flex items-center justify-center gap-1.5 flex-1 h-8 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-xl transition-colors cursor-pointer">
                      <Share2 size={13} />Paylaş
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
