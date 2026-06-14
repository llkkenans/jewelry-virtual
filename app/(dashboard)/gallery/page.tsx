"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ImageOff, Sparkles, Gem, Link2, Heart, Share2, Trash2, CheckSquare, Square, X, Watch, FolderPlus } from "lucide-react"
import { toast } from "sonner"

type Generation = {
  id: string
  output_image_url: string
  jewelry_type: string
  created_at: string
  is_favorite: boolean
}

type Collection = {
  id: string
  name: string
  cover_image_url: string | null
  created_at: string
  collection_items: { count: number }[]
}

const JEWELRY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  ring:     { label: "Yüzük",  icon: Gem      },
  necklace: { label: "Kolye",  icon: Link2    },
  earring:  { label: "Küpe",   icon: Sparkles },
  watch:    { label: "Saat",   icon: Watch    },
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
    toast("Link kopyalandı.")
  }
}

async function handleDownload(url: string, index: number) {
  const response = await fetch(url)
  const blob = await response.blob()
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `lunia-studio-${index + 1}.jpg`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function GalleryPage() {
  const [items, setItems]                   = useState<Generation[]>([])
  const [loading, setLoading]               = useState(true)
  const [tab, setTab]                       = useState<"all" | "favorites" | "collections">("all")
  const [zipping, setZipping]               = useState(false)
  const [selectMode, setSelectMode]         = useState(false)
  const [selected, setSelected]             = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null)
  const [bulkConfirm, setBulkConfirm]       = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [collections, setCollections]               = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [showAddToCollection, setShowAddToCollection] = useState<string | null>(null)
  const [showNewCollection, setShowNewCollection]   = useState(false)
  const [newCollectionName, setNewCollectionName]   = useState("")
  const [creatingCollection, setCreatingCollection] = useState(false)

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

  useEffect(() => {
    if (tab === "collections") loadCollections()
  }, [tab])

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
    setBulkConfirm(false)
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
          zip.file(`lunia-studio-${i + 1}.jpg`, blob)
        })
      )
      const content = await zip.generateAsync({ type: "blob" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(content)
      a.download = "lunia-studio-gallery.zip"
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setZipping(false)
    }
  }

  async function loadCollections() {
    setCollectionsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/collections', {
      headers: { authorization: `Bearer ${session.access_token}` }
    })
    const json = await res.json()
    setCollections(json.collections ?? [])
    setCollectionsLoading(false)
  }

  async function createCollection() {
    if (!newCollectionName.trim()) return
    setCreatingCollection(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const coverItem = showAddToCollection
      ? items.find(i => i.id === showAddToCollection)
      : null

    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        name: newCollectionName.trim(),
        cover_image_url: coverItem?.output_image_url ?? null
      })
    })
    const json = await res.json()

    if (json.collection && showAddToCollection) {
      await addToCollection(json.collection.id, showAddToCollection)
    }

    setNewCollectionName("")
    setShowNewCollection(false)
    setCreatingCollection(false)
    await loadCollections()
    toast("Koleksiyon oluşturuldu.")
  }

  async function addToCollection(collectionId: string, generationId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`/api/collections/${collectionId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ generation_id: generationId })
    })
    setShowAddToCollection(null)
    toast("Koleksiyona eklendi.")
  }

  async function deleteCollection(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`/api/collections/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${session.access_token}` }
    })
    setCollections(prev => prev.filter(c => c.id !== id))
    toast("Koleksiyon silindi.")
  }

  return (
    <div className="space-y-8">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">
            Jewelry Virtual Studio
          </p>
          <h1 className="text-2xl font-light tracking-wide text-[#111827]">
            Koleksiyon
          </h1>
          <div className="w-8 h-px bg-[#111827] mt-3" />
        </div>

        {!loading && items.length > 0 && (
          <div className="flex items-center gap-3">
            {!selectMode ? (
              <>
                <div className="flex items-center border border-[#E5E7EB]">
                  <button
                    onClick={() => setTab("all")}
                    className={`px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-light transition-colors cursor-pointer ${
                      tab === "all" ? "bg-[#111827] text-white" : "bg-white text-[#9CA3AF] hover:text-[#111827]"
                    }`}
                  >
                    Tümü <span className="ml-1 opacity-60">({items.length})</span>
                  </button>
                  <button
                    onClick={() => setTab("favorites")}
                    className={`px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-light transition-colors cursor-pointer flex items-center gap-1.5 ${
                      tab === "favorites" ? "bg-[#111827] text-white" : "bg-white text-[#9CA3AF] hover:text-[#111827]"
                    }`}
                  >
                    <Heart size={10} className={tab === "favorites" ? "fill-white" : ""} />
                    Favoriler <span className="opacity-60">({items.filter(i => i.is_favorite).length})</span>
                  </button>
                </div>
                <button
                  onClick={() => setTab("collections")}
                  className={`pb-3 text-[11px] tracking-[0.15em] uppercase font-light transition-colors relative cursor-pointer ${
                    tab === "collections" ? "text-[#111827]" : "text-[#9CA3AF] hover:text-[#111827]"
                  }`}
                >
                  Koleksiyonlar
                  {tab === "collections" && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-[#111827]" />
                  )}
                </button>
                <div className="w-px h-5 bg-[#E5E7EB]" />
                <button onClick={() => setSelectMode(true)} className="text-[10px] tracking-[0.15em] uppercase font-light text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer flex items-center gap-1.5">
                  <CheckSquare size={12} strokeWidth={1.5} />Seç
                </button>
                <button onClick={handleDownloadAll} disabled={zipping} className="text-[10px] tracking-[0.15em] uppercase font-light text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40">
                  <Download size={12} strokeWidth={1.5} />{zipping ? "Hazırlanıyor..." : "Tümünü İndir"}
                </button>
              </>
            ) : (
              <>
                <button onClick={toggleSelectAll} className="text-[10px] tracking-[0.15em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer flex items-center gap-1.5">
                  {selected.size === displayed.length ? <CheckSquare size={12} strokeWidth={1.5} className="text-[#111827]" /> : <Square size={12} strokeWidth={1.5} />}
                  {selected.size === displayed.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                </button>
                {selected.size > 0 && (
                  <button onClick={() => setBulkConfirm(true)} className="text-[10px] tracking-[0.15em] uppercase font-light text-red-500 hover:text-red-700 transition-colors cursor-pointer flex items-center gap-1.5">
                    <Trash2 size={12} strokeWidth={1.5} />Sil ({selected.size})
                  </button>
                )}
                <div className="w-px h-5 bg-[#E5E7EB]" />
                <button onClick={exitSelectMode} className="text-[10px] tracking-[0.15em] uppercase font-light text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer flex items-center gap-1.5">
                  <X size={12} strokeWidth={1.5} />İptal
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-8 w-full max-w-sm mx-4 space-y-6">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-2">Onay Gerekli</p>
              <p className="text-base font-light text-[#111827] tracking-wide">Bu görsel kalıcı olarak silinecek.</p>
              <div className="w-8 h-px bg-[#111827] mt-3" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-[#E5E7EB] text-[10px] tracking-[0.15em] uppercase font-light text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition-colors cursor-pointer">İptal</button>
              <button onClick={() => deleteOne(deleteConfirm)} disabled={deleting} className="flex-1 h-10 bg-[#111827] hover:bg-black text-white text-[10px] tracking-[0.15em] uppercase font-light transition-colors cursor-pointer disabled:opacity-40">{deleting ? "Siliniyor..." : "Sil"}</button>
            </div>
          </div>
        </div>
      )}

      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-8 w-full max-w-sm mx-4 space-y-6">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-2">Onay Gerekli</p>
              <p className="text-base font-light text-[#111827] tracking-wide">{selected.size} görsel kalıcı olarak silinecek.</p>
              <div className="w-8 h-px bg-[#111827] mt-3" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBulkConfirm(false)} className="flex-1 h-10 border border-[#E5E7EB] text-[10px] tracking-[0.15em] uppercase font-light text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition-colors cursor-pointer">İptal</button>
              <button onClick={deleteSelected} disabled={deleting} className="flex-1 h-10 bg-[#111827] hover:bg-black text-white text-[10px] tracking-[0.15em] uppercase font-light transition-colors cursor-pointer disabled:opacity-40">{deleting ? "Siliniyor..." : `${selected.size} Görseli Sil`}</button>
            </div>
          </div>
        </div>
      )}

      {showAddToCollection && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddToCollection(null)}
        >
          <div
            className="bg-white border border-[#E5E7EB] w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#9CA3AF] font-light mb-1">
                  Lunia Studio
                </p>
                <h2 className="text-base font-light tracking-wide text-[#111827]">
                  Koleksiyona Ekle
                </h2>
                <div className="w-6 h-px bg-[#111827] mt-2" />
              </div>
              <button
                onClick={() => setShowAddToCollection(null)}
                className="text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {collections.length > 0 && (
              <div className="space-y-2 mb-4">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => addToCollection(col.id, showAddToCollection)}
                    className="w-full flex items-center justify-between p-3 border border-[#E5E7EB] hover:border-[#111827] transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] tracking-[0.1em] uppercase font-light text-[#111827]">
                      {col.name}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-light">
                      {col.collection_items?.[0]?.count ?? 0} görsel
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showNewCollection ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Koleksiyon adı"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createCollection()}
                  className="w-full h-10 border border-[#E5E7EB] px-3 text-sm font-light text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={createCollection}
                    disabled={creatingCollection || !newCollectionName.trim()}
                    className="flex-1 h-10 bg-[#111827] text-white text-[11px] tracking-[0.15em] uppercase font-light hover:bg-black transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {creatingCollection ? "Oluşturuluyor..." : "Oluştur"}
                  </button>
                  <button
                    onClick={() => { setShowNewCollection(false); setNewCollectionName("") }}
                    className="h-10 px-4 border border-[#E5E7EB] text-[11px] tracking-[0.1em] uppercase font-light text-[#9CA3AF] hover:border-[#111827] hover:text-[#111827] transition-all cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCollection(true)}
                className="w-full h-10 border border-dashed border-[#E5E7EB] hover:border-[#111827] text-[11px] tracking-[0.1em] uppercase font-light text-[#9CA3AF] hover:text-[#111827] transition-all cursor-pointer"
              >
                + Yeni Koleksiyon Oluştur
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-4 space-y-3">
              <Skeleton className="w-full aspect-square rounded-none" />
              <Skeleton className="h-3 w-1/2 rounded-none" />
            </div>
          ))}
        </div>
      ) : tab === "collections" ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] tracking-[0.1em] uppercase font-light text-[#9CA3AF]">
              {collections.length} koleksiyon
            </p>
            <button
              onClick={() => setShowNewCollection(true)}
              className="text-[11px] tracking-[0.1em] uppercase font-light text-[#111827] border-b border-[#111827] pb-px hover:opacity-60 transition-opacity cursor-pointer"
            >
              + Yeni Koleksiyon
            </button>
          </div>

          {collectionsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-[#E5E7EB]">
                  <Skeleton className="aspect-[3/4] rounded-none" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-24 rounded-none" />
                  </div>
                </div>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div className="w-px h-12 bg-[#E5E7EB] mx-auto" />
              <p className="text-[11px] tracking-[0.15em] uppercase font-light text-[#9CA3AF]">
                Henüz koleksiyon yok
              </p>
              <button
                onClick={() => setShowNewCollection(true)}
                className="text-[10px] tracking-[0.1em] uppercase font-light text-[#111827] border-b border-[#111827] pb-px hover:opacity-60 transition-opacity cursor-pointer"
              >
                İlk koleksiyonu oluştur
              </button>
              <div className="w-px h-12 bg-[#E5E7EB] mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {collections.map((col) => (
                <div key={col.id} className="group border border-[#E5E7EB] hover:border-[#9CA3AF] transition-all">
                  <div className="relative aspect-[3/4] bg-[#F9FAFB] overflow-hidden">
                    {col.cover_image_url ? (
                      <img
                        src={col.cover_image_url}
                        alt={col.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-px h-8 bg-[#E5E7EB]" />
                      </div>
                    )}
                    <button
                      onClick={() => deleteCollection(col.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white border border-[#E5E7EB] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:border-[#111827]"
                    >
                      <Trash2 size={11} strokeWidth={1.5} className="text-[#9CA3AF]" />
                    </button>
                  </div>
                  <div className="pt-3 pb-2 px-0">
                    <p className="text-[11px] tracking-[0.1em] uppercase font-light text-[#111827] mb-1">
                      {col.name}
                    </p>
                    <div className="w-6 h-px bg-[#111827] mb-2" />
                    <p className="text-[10px] text-[#9CA3AF] font-light">
                      {col.collection_items?.[0]?.count ?? 0} görsel
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[480px] gap-6 border border-dashed border-[#E5E7EB]">
          <div className="w-px h-16 bg-[#E5E7EB]" />
          <div className="text-center space-y-2">
            <ImageOff size={20} strokeWidth={1} className="text-[#D1D5DB] mx-auto mb-4" />
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#9CA3AF] font-light">Henüz üretim yok</p>
            <p className="text-[10px] tracking-wide text-[#D1D5DB]">İlk takı görselinizi oluşturun</p>
          </div>
          <Link href="/upload" className="flex items-center gap-2 h-10 px-6 bg-[#111827] hover:bg-black text-white text-[10px] tracking-[0.2em] uppercase font-light transition-colors">
            <Sparkles size={11} strokeWidth={1.5} />Üretmeye Başla
          </Link>
          <div className="w-px h-16 bg-[#E5E7EB]" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] gap-6 border border-dashed border-[#E5E7EB]">
          <div className="w-px h-12 bg-[#E5E7EB]" />
          <div className="text-center space-y-2">
            <Heart size={20} strokeWidth={1} className="text-[#D1D5DB] mx-auto mb-4" />
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#9CA3AF] font-light">Favori yok</p>
            <p className="text-[10px] tracking-wide text-[#D1D5DB]">Beğendiğiniz görsellerin üstündeki kalbi kullanın</p>
          </div>
          <button onClick={() => setTab("all")} className="text-[10px] tracking-[0.15em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer underline underline-offset-4">
            Tüm görsellere dön
          </button>
          <div className="w-px h-12 bg-[#E5E7EB]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayed.map((item) => {
            const type = JEWELRY_LABELS[item.jewelry_type]
            const Icon = type?.icon ?? Gem
            const isSelected = selected.has(item.id)
            return (
              <div
                key={item.id}
                onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                className={`bg-white group transition-all ${selectMode ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-inset ring-[#111827]" : ""}`}
              >
                <div className="relative aspect-square overflow-hidden bg-[#FAFAFA]">
                  <img
                    src={item.output_image_url}
                    alt={type?.label ?? item.jewelry_type}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {selectMode ? (
                    <div className={`absolute inset-0 transition-colors ${isSelected ? "bg-[#111827]/10" : "bg-transparent"}`}>
                      <div className="absolute top-3 left-3 w-5 h-5 border bg-white flex items-center justify-center">
                        {isSelected ? <CheckSquare size={14} strokeWidth={1.5} className="text-[#111827]" /> : <Square size={14} strokeWidth={1} className="text-[#D1D5DB]" />}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAddToCollection(item.id)
                          loadCollections()
                        }}
                        className="absolute top-2 left-2 w-7 h-7 bg-white border border-[#E5E7EB] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:border-[#111827]"
                        title="Koleksiyona ekle"
                      >
                        <FolderPlus size={12} strokeWidth={1.5} className="text-[#9CA3AF]" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, item.is_favorite) }} className="absolute top-3 right-3 w-7 h-7 bg-white/0 group-hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer" aria-label="Favori">
                        <Heart size={12} strokeWidth={1.5} className={item.is_favorite ? "fill-[#111827] text-[#111827]" : "text-[#6B7280]"} />
                      </button>
                    </div>
                  )}
                  {!selectMode && item.is_favorite && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#111827] flex items-center justify-center group-hover:opacity-0 transition-opacity">
                      <Heart size={10} strokeWidth={1.5} className="fill-white text-white" />
                    </div>
                  )}
                </div>
                <div className="pt-3 pb-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.15em] uppercase font-light text-[#111827]">
                      {JEWELRY_LABELS[item.jewelry_type]?.label ?? item.jewelry_type}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-light">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="w-6 h-px bg-[#111827] mb-3" />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(item.output_image_url, items.indexOf(item)) }}
                      className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827]
                        text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280]
                        hover:text-[#111827] transition-all flex items-center justify-center
                        gap-1.5 cursor-pointer"
                    >
                      <Download size={11} strokeWidth={1.5} />
                      İndir
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(item.output_image_url) }}
                      className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827]
                        text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280]
                        hover:text-[#111827] transition-all flex items-center justify-center
                        gap-1.5 cursor-pointer"
                    >
                      <Share2 size={11} strokeWidth={1.5} />
                      Paylaş
                    </button>
                    {!selectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id) }}
                        className="w-8 h-8 border border-[#E5E7EB] hover:border-[#111827]
                          text-[#9CA3AF] hover:text-[#111827] transition-all
                          flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={11} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && tab !== "collections" && displayed.length > 0 && (
        <p className="text-center text-[9px] tracking-[0.15em] uppercase text-[#D1D5DB] font-light pt-4">
          {displayed.length} görsel · Lunia Studio
        </p>
      )}
    </div>
  )
}
