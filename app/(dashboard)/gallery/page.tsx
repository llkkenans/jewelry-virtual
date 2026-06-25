"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ImageOff, Sparkles, Gem, Link2, Heart, Share2, Trash2, CheckSquare, Square, X, Watch, FolderPlus, Check } from "lucide-react"
import { toast } from "sonner"
import { Lightbox } from "@/components/gallery/Lightbox"

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

type ClothingItem = {
  id: string
  category: string
  gender: string
  skin_tone: string
  output_image_url: string
  is_saved: boolean
  created_at: string
}

type ProductItem = {
  id: string
  scene_type: string
  output_image_url: string
  is_saved: boolean
  created_at: string
}

const PRODUCT_SCENE_LABELS: Record<string, string> = {
  ecommerce:   "E-Ticaret",
  marble:      "Mermer",
  lifestyle:   "Lifestyle",
  nature:      "Doğa",
  minimal:     "Minimal",
  dark_luxury: "Lüks",
}

const CLOTHING_CATEGORY_LABELS: Record<string, string> = {
  tops: "Üst",
  bottoms: "Alt",
  "one-pieces": "Tek Parça",
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

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

async function handleShare(url: string) {
  if (navigator.share) {
    await navigator.share({ title: "Lunia Studio", text: "Takılarımı AI ile fotoğrafladım!", url })
  } else {
    await navigator.clipboard.writeText(url)
    toast("Link kopyalandı.")
  }
}

async function handleDownload(url: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `jewelry-virtual-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
          <div className="grid grid-cols-2 gap-2">
            <Gem size={16} strokeWidth={1.2} className="text-white/30 animate-pulse" style={{ animationDelay: '0ms' }} />
            <Link2 size={16} strokeWidth={1.2} className="text-white/30 animate-pulse" style={{ animationDelay: '150ms' }} />
            <Sparkles size={16} strokeWidth={1.2} className="text-white/30 animate-pulse" style={{ animationDelay: '300ms' }} />
            <Watch size={16} strokeWidth={1.2} className="text-white/30 animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-[1.04]`}
        style={{ transition: 'opacity 0.5s, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' }}
      />
    </>
  )
}

/* ── Skeleton row for loading states ── */
function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[4/5] bg-[#1A1A1A] animate-pulse" />
      ))}
    </div>
  )
}

export default function GalleryPage() {
  const [items, setItems]                   = useState<Generation[]>([])
  const [loading, setLoading]               = useState(true)
  const [page, setPage]                     = useState(1)
  const [hasMore, setHasMore]               = useState(true)
  const [loadingMore, setLoadingMore]       = useState(false)
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

  const [galleryType, setGalleryType]                 = useState<"jewelry" | "clothing" | "product">("jewelry")
  const [clothingItems, setClothingItems]             = useState<ClothingItem[]>([])
  const [clothingLoading, setClothingLoading]         = useState(false)
  const [clothingPage, setClothingPage]               = useState(1)
  const [clothingHasMore, setClothingHasMore]         = useState(true)
  const [clothingLoadingMore, setClothingLoadingMore] = useState(false)
  const clothingLoadedRef = useRef(false)

  const [productItems, setProductItems]             = useState<ProductItem[]>([])
  const [productLoading, setProductLoading]         = useState(false)
  const [productPage, setProductPage]               = useState(1)
  const [productHasMore, setProductHasMore]         = useState(true)
  const [productLoadingMore, setProductLoadingMore] = useState(false)
  const productLoadedRef = useRef(false)

  const [lightboxOpen, setLightboxOpen]   = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      try {
        const res = await fetch('/api/gallery?page=1&limit=12', {
          headers: { authorization: `Bearer ${session.access_token}` }
        })
        const json = await res.json()
        const fetchedItems = json.items ?? []
        setItems(fetchedItems)
        setHasMore(fetchedItems.length >= (json.limit ?? 12))
      } catch (err) {
        console.error('Gallery fetch error:', err)
        setItems([])
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (tab === "collections") loadCollections()
  }, [tab])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoadingMore(false); return }
    try {
      const res = await fetch(`/api/gallery?page=${nextPage}&limit=12`, {
        headers: { authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      const newItems = json.items ?? []
      setItems(prev => [...prev, ...newItems])
      setPage(nextPage)
      setHasMore(newItems.length >= (json.limit ?? 12))
    } catch (err) {
      console.error('Load more error:', err)
    }
    setLoadingMore(false)
  }

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

  async function loadClothing() {
    if (clothingLoadedRef.current) return
    clothingLoadedRef.current = true
    setClothingLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setClothingLoading(false); return }
    try {
      const res = await fetch('/api/gallery?type=clothing&page=1&limit=12', {
        headers: { authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      const fetchedItems = json.items ?? []
      setClothingItems(fetchedItems)
      setClothingHasMore(fetchedItems.length >= (json.limit ?? 12))
    } catch (err) {
      console.error('Clothing gallery fetch error:', err)
      setClothingItems([])
    }
    setClothingLoading(false)
  }

  async function loadProduct() {
    if (productLoadedRef.current) return
    productLoadedRef.current = true
    setProductLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setProductLoading(false); return }
    try {
      const res = await fetch('/api/gallery?type=product&page=1&limit=12', {
        headers: { authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      const fetchedItems = json.items ?? []
      setProductItems(fetchedItems)
      setProductHasMore(fetchedItems.length >= (json.limit ?? 12))
    } catch (err) {
      console.error('Product gallery fetch error:', err)
      setProductItems([])
    }
    setProductLoading(false)
  }

  async function loadMoreProduct() {
    if (productLoadingMore || !productHasMore) return
    setProductLoadingMore(true)
    const nextPage = productPage + 1
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setProductLoadingMore(false); return }
    try {
      const res = await fetch(`/api/gallery?type=product&page=${nextPage}&limit=12`, {
        headers: { authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      const newItems = json.items ?? []
      setProductItems(prev => [...prev, ...newItems])
      setProductPage(nextPage)
      setProductHasMore(newItems.length >= (json.limit ?? 12))
    } catch (err) {
      console.error('Load more product error:', err)
    }
    setProductLoadingMore(false)
  }

  async function loadMoreClothing() {
    if (clothingLoadingMore || !clothingHasMore) return
    setClothingLoadingMore(true)
    const nextPage = clothingPage + 1
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setClothingLoadingMore(false); return }
    try {
      const res = await fetch(`/api/gallery?type=clothing&page=${nextPage}&limit=12`, {
        headers: { authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      const newItems = json.items ?? []
      setClothingItems(prev => [...prev, ...newItems])
      setClothingPage(nextPage)
      setClothingHasMore(newItems.length >= (json.limit ?? 12))
    } catch (err) {
      console.error('Load more clothing error:', err)
    }
    setClothingLoadingMore(false)
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

  /* ── Studio type filter options ── */
  const studioFilters = [
    { key: "jewelry" as const,  label: "Mücevher Stüdyosu" },
    { key: "clothing" as const, label: "Kıyafet Stüdyosu"  },
    { key: "product" as const,  label: "Ürün Stüdyosu"     },
  ]

  /* ── Jewelry sub-tab options ── */
  const jewelryTabs = [
    { key: "all" as const,         label: `Tümü (${items.length})`                              },
    { key: "favorites" as const,   label: `Favoriler (${items.filter(i => i.is_favorite).length})` },
    { key: "collections" as const, label: "Koleksiyonlar"                                        },
  ]

  return (
    /* Escape dashboard's px-6 py-10 padding to go dark full-bleed */
    <div className="-mx-6 -my-10 min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">

      {/* ── PAGE HEADER ── */}
      <div className="px-6 pt-8 pb-5">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/25 mb-1">
              Lunia Studio
            </p>
            <h1
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-3xl font-light tracking-wide text-white"
            >
              Galeri
            </h1>
          </div>

          {/* Actions (Select / Download All) — shown only for jewelry non-collections */}
          {galleryType === "jewelry" && !loading && items.length > 0 && tab !== "collections" && (
            <div className="flex items-center gap-3">
              {!selectMode ? (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="text-[10px] tracking-[0.12em] uppercase font-light text-white/40 hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare size={12} strokeWidth={1.5} /> Seç
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button
                    onClick={handleDownloadAll}
                    disabled={zipping}
                    className="text-[10px] tracking-[0.12em] uppercase font-light text-white/40 hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
                  >
                    <Download size={12} strokeWidth={1.5} /> {zipping ? "Hazırlanıyor..." : "Tümünü İndir"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="text-[10px] tracking-[0.12em] uppercase font-light text-white/50 hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {selected.size === displayed.length
                      ? <CheckSquare size={12} strokeWidth={1.5} className="text-white" />
                      : <Square size={12} strokeWidth={1.5} />}
                    {selected.size === displayed.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                  </button>
                  {selected.size > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <button
                        onClick={() => setBulkConfirm(true)}
                        className="text-[10px] tracking-[0.12em] uppercase font-light text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 size={12} strokeWidth={1.5} /> Sil ({selected.size})
                      </button>
                    </>
                  )}
                  <div className="w-px h-4 bg-white/10" />
                  <button
                    onClick={exitSelectMode}
                    className="text-[10px] tracking-[0.12em] uppercase font-light text-white/40 hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X size={12} strokeWidth={1.5} /> İptal
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Studio type filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {studioFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setGalleryType(key)
                if (key === "clothing" && !clothingLoadedRef.current) loadClothing()
                if (key === "product" && !productLoadedRef.current) loadProduct()
              }}
              className={`px-4 py-1.5 text-[10px] tracking-[0.14em] uppercase font-medium transition-all duration-200 cursor-pointer border ${
                galleryType === key
                  ? "bg-white text-[#0A0A0A] border-white"
                  : "bg-transparent text-white/40 border-white/10 hover:text-white/70 hover:border-white/25"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Jewelry sub-tabs (All / Favorites / Collections) */}
        {galleryType === "jewelry" && !loading && items.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {jewelryTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1 text-[9px] tracking-[0.14em] uppercase font-medium transition-all duration-200 cursor-pointer border ${
                  tab === key
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-transparent text-white/30 border-white/[0.06] hover:text-white/55 hover:border-white/15"
                }`}
              >
                {label}
              </button>
            ))}
            {tab === "collections" && (
              <button
                onClick={() => setShowNewCollection(true)}
                className="ml-auto text-[9px] tracking-[0.14em] uppercase font-light text-white/30 hover:text-white/60 transition-colors cursor-pointer border-b border-white/20 pb-px"
              >
                + Yeni Koleksiyon
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Delete single confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] p-8 w-full max-w-sm mx-4 space-y-6">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">Onay Gerekli</p>
              <p className="text-base font-light text-white tracking-wide">Bu görsel kalıcı olarak silinecek.</p>
              <div className="w-8 h-px bg-white/20 mt-3" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 border border-white/[0.08] text-[10px] tracking-[0.15em] uppercase font-light text-white/40 hover:border-white/25 hover:text-white/70 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={() => deleteOne(deleteConfirm)}
                disabled={deleting}
                className="flex-1 h-10 bg-white text-[#0A0A0A] text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40"
              >
                {deleting ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] p-8 w-full max-w-sm mx-4 space-y-6">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">Onay Gerekli</p>
              <p className="text-base font-light text-white tracking-wide">{selected.size} görsel kalıcı olarak silinecek.</p>
              <div className="w-8 h-px bg-white/20 mt-3" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkConfirm(false)}
                className="flex-1 h-10 border border-white/[0.08] text-[10px] tracking-[0.15em] uppercase font-light text-white/40 hover:border-white/25 hover:text-white/70 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="flex-1 h-10 bg-white text-[#0A0A0A] text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40"
              >
                {deleting ? "Siliniyor..." : `${selected.size} Görseli Sil`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to collection modal */}
      {showAddToCollection && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddToCollection(null)}
        >
          <div
            className="bg-[#111] border border-white/[0.08] w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 font-light mb-1">
                  Lunia Studio
                </p>
                <h2 className="text-base font-light tracking-wide text-white">
                  Koleksiyona Ekle
                </h2>
                <div className="w-6 h-px bg-white/20 mt-2" />
              </div>
              <button
                onClick={() => setShowAddToCollection(null)}
                className="text-white/30 hover:text-white/70 transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between p-3 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
                  >
                    <span className="text-[11px] tracking-[0.1em] uppercase font-light text-white/80">
                      {col.name}
                    </span>
                    <span className="text-[10px] text-white/30 font-light">
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
                  className="w-full h-10 border border-white/[0.08] bg-transparent px-3 text-sm font-light text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={createCollection}
                    disabled={creatingCollection || !newCollectionName.trim()}
                    className="flex-1 h-10 bg-white text-[#0A0A0A] text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-white/90 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {creatingCollection ? "Oluşturuluyor..." : "Oluştur"}
                  </button>
                  <button
                    onClick={() => { setShowNewCollection(false); setNewCollectionName("") }}
                    className="h-10 px-4 border border-white/[0.08] text-[11px] tracking-[0.1em] uppercase font-light text-white/30 hover:border-white/20 hover:text-white/60 transition-all cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCollection(true)}
                className="w-full h-10 border border-dashed border-white/[0.08] hover:border-white/20 text-[11px] tracking-[0.1em] uppercase font-light text-white/25 hover:text-white/55 transition-all cursor-pointer"
              >
                + Yeni Koleksiyon Oluştur
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── GRID CONTENT ── */}

      {/* Product studio grid */}
      {galleryType === "product" && (
        productLoading ? <GridSkeleton /> :
        productItems.length === 0 ? (
          <EmptyState
            icon={<ImageOff size={20} strokeWidth={1} className="text-white/20 mx-auto mb-4" />}
            title="Henüz Üretim Yok"
            desc="İlk ürününüzü yükleyin, saniyeler içinde profesyonel stüdyo görünümü elde edin."
            ctaHref="/studio"
            ctaLabel="Üretime Başla"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
              {productItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative aspect-[4/5] overflow-hidden group cursor-pointer bg-[#1A1A1A]"
                  onClick={() => { setLightboxIndex(idx); setLightboxOpen(true) }}
                >
                  <GalleryImage src={item.output_image_url} alt={PRODUCT_SCENE_LABELS[item.scene_type] ?? item.scene_type} />
                  <HoverOverlay
                    label={PRODUCT_SCENE_LABELS[item.scene_type] ?? item.scene_type}
                    date={formatDateShort(item.created_at)}
                    onDownload={(e) => { e.stopPropagation(); handleDownload(item.output_image_url) }}
                  />
                </div>
              ))}
            </div>
            <LoadMoreBar
              hasMore={productHasMore}
              loading={productLoadingMore}
              count={productItems.length}
              onLoadMore={loadMoreProduct}
            />
          </>
        )
      )}

      {/* Clothing studio grid */}
      {galleryType === "clothing" && (
        clothingLoading ? <GridSkeleton /> :
        clothingItems.length === 0 ? (
          <EmptyState
            icon={<ImageOff size={20} strokeWidth={1} className="text-white/20 mx-auto mb-4" />}
            title="Henüz Üretim Yok"
            desc="İlk kıyafetinizi yükleyin, saniyeler içinde modelin üzerinde görün."
            ctaHref="/clothing-studio"
            ctaLabel="Üretime Başla"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
              {clothingItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative aspect-[4/5] overflow-hidden group cursor-pointer bg-[#1A1A1A]"
                  onClick={() => { setLightboxIndex(idx); setLightboxOpen(true) }}
                >
                  <GalleryImage src={item.output_image_url} alt={CLOTHING_CATEGORY_LABELS[item.category] ?? item.category} />
                  <HoverOverlay
                    label={CLOTHING_CATEGORY_LABELS[item.category] ?? item.category}
                    date={formatDateShort(item.created_at)}
                    onDownload={(e) => { e.stopPropagation(); handleDownload(item.output_image_url) }}
                  />
                </div>
              ))}
            </div>
            <LoadMoreBar
              hasMore={clothingHasMore}
              loading={clothingLoadingMore}
              count={clothingItems.length}
              onLoadMore={loadMoreClothing}
            />
          </>
        )
      )}

      {/* Jewelry studio */}
      {galleryType === "jewelry" && (
        loading ? <GridSkeleton /> :
        tab === "collections" ? (
          /* ── Collections view ── */
          <div className="px-6 pb-10">
            {collectionsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-[#1A1A1A] animate-pulse" />
                ))}
              </div>
            ) : collections.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="w-px h-12 bg-white/10 mx-auto" />
                <p className="text-[11px] tracking-[0.15em] uppercase font-light text-white/30">Koleksiyon Yok</p>
                <p className="text-[10px] tracking-wide text-white/15">
                  Görsellerinizi koleksiyonlarda düzenleyin, kolayca erişin.
                </p>
                <button
                  onClick={() => setShowNewCollection(true)}
                  className="text-[10px] tracking-[0.1em] uppercase font-light text-white/40 border-b border-white/20 pb-px hover:opacity-60 transition-opacity cursor-pointer"
                >
                  Koleksiyon Oluştur
                </button>
                <div className="w-px h-12 bg-white/10 mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {collections.map((col) => (
                  <div key={col.id} className="relative group aspect-[3/4] overflow-hidden bg-[#1A1A1A] cursor-pointer">
                    {col.cover_image_url ? (
                      <img
                        src={col.cover_image_url}
                        alt={col.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-px h-8 bg-white/10" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 pointer-events-none">
                      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-block bg-white/90 text-[#0A0A0A] text-[9px] font-medium tracking-[0.1em] uppercase px-2.5 py-1">
                          {col.name}
                        </span>
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => deleteCollection(col.id)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/70 pointer-events-auto"
                    >
                      <Trash2 size={11} strokeWidth={1.5} className="text-white/50" />
                    </button>
                    {/* Count badge */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <span className="text-[9px] text-white/40 font-light">
                        {col.collection_items?.[0]?.count ?? 0} görsel
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ImageOff size={20} strokeWidth={1} className="text-white/20 mx-auto mb-4" />}
            title="Henüz Üretim Yok"
            desc="İlk takınızı yükleyin, saniyeler içinde modelin üzerinde görün."
            ctaHref="/upload"
            ctaLabel="Üretime Başla"
          />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] gap-5">
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center space-y-2">
              <Heart size={20} strokeWidth={1} className="text-white/15 mx-auto mb-4" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-light">Favori Yok</p>
              <p className="text-[10px] tracking-wide text-white/15">
                Beğendiğiniz görselleri favorileyin, en sevdiklerinizi burada bulun.
              </p>
            </div>
            <button
              onClick={() => setTab("all")}
              className="text-[10px] tracking-[0.15em] uppercase font-light text-white/30 hover:text-white/60 transition-colors cursor-pointer underline underline-offset-4"
            >
              Tüm görsellere dön
            </button>
            <div className="w-px h-12 bg-white/10" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
              {displayed.map((item, idx) => {
                const type = JEWELRY_LABELS[item.jewelry_type]
                const isSelected = selected.has(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                    className={`relative aspect-[4/5] overflow-hidden group bg-[#1A1A1A] ${selectMode ? "cursor-pointer" : ""}`}
                  >
                    {/* Image */}
                    <div
                      className={!selectMode ? "cursor-pointer w-full h-full" : "w-full h-full"}
                      onClick={!selectMode ? () => { setLightboxIndex(idx); setLightboxOpen(true) } : undefined}
                    >
                      <GalleryImage src={item.output_image_url} alt={type?.label ?? item.jewelry_type} />
                    </div>

                    {/* Select mode overlay */}
                    {selectMode ? (
                      <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelected ? "bg-white/10" : "bg-transparent"}`}>
                        <div className="absolute top-2.5 left-2.5 w-5 h-5 border border-white/50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          {isSelected && <Check size={11} strokeWidth={2.5} className="text-white" />}
                        </div>
                      </div>
                    ) : (
                      /* Hover overlay with actions */
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 pointer-events-none">

                        {/* Metadata badge — bottom left */}
                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <span className="inline-block bg-white/90 text-[#0A0A0A] text-[9px] font-medium tracking-[0.1em] uppercase px-2.5 py-1">
                            {type?.label ?? item.jewelry_type} · {formatDateShort(item.created_at)}
                          </span>
                        </div>

                        {/* Action icons — top right */}
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, item.is_favorite) }}
                            className="w-7 h-7 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                            aria-label="Favori"
                          >
                            <Heart
                              size={12}
                              strokeWidth={1.5}
                              className={item.is_favorite ? "fill-white text-white" : "text-white/70"}
                            />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(item.output_image_url) }}
                            className="w-7 h-7 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                          >
                            <Download size={12} strokeWidth={1.5} className="text-white/70" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShare(item.output_image_url) }}
                            className="w-7 h-7 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                          >
                            <Share2 size={12} strokeWidth={1.5} className="text-white/70" />
                          </button>
                        </div>

                        {/* Add to collection — top left */}
                        <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowAddToCollection(item.id); loadCollections() }}
                            className="w-7 h-7 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                            title="Koleksiyona ekle"
                          >
                            <FolderPlus size={12} strokeWidth={1.5} className="text-white/70" />
                          </button>
                        </div>

                        {/* Delete — bottom right */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id) }}
                            className="w-7 h-7 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} strokeWidth={1.5} className="text-white/40 hover:text-red-400 transition-colors" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Favorite indicator — visible when not hovering */}
                    {!selectMode && item.is_favorite && (
                      <div className="absolute top-2.5 right-2.5 pointer-events-none group-hover:opacity-0 transition-opacity">
                        <Heart size={11} strokeWidth={1.5} className="fill-white text-white drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <LoadMoreBar
              hasMore={hasMore && tab === "all"}
              loading={loadingMore}
              count={displayed.length}
              onLoadMore={loadMore}
            />
          </>
        )
      )}

      {/* ── LIGHTBOX ── */}
      <Lightbox
        images={
          galleryType === "jewelry"
            ? displayed.map(i => ({
                url: i.output_image_url,
                category: JEWELRY_LABELS[i.jewelry_type]?.label ?? i.jewelry_type,
                date: formatDate(i.created_at),
                id: i.id,
              }))
            : galleryType === "clothing"
            ? clothingItems.map(i => ({
                url: i.output_image_url,
                category: CLOTHING_CATEGORY_LABELS[i.category] ?? i.category,
                date: formatDate(i.created_at),
                id: i.id,
              }))
            : productItems.map(i => ({
                url: i.output_image_url,
                category: PRODUCT_SCENE_LABELS[i.scene_type] ?? i.scene_type,
                date: formatDate(i.created_at),
                id: i.id,
              }))
        }
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}

/* ── Small helper components (render-only, no logic) ── */

function HoverOverlay({
  label,
  date,
  onDownload,
}: {
  label: string
  date: string
  onDownload: (e: React.MouseEvent) => void
}) {
  return (
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 pointer-events-none">
      {/* Metadata badge */}
      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="inline-block bg-white/90 text-[#0A0A0A] text-[9px] font-medium tracking-[0.1em] uppercase px-2.5 py-1">
          {label} · {date}
        </span>
      </div>
      {/* Download icon */}
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <button
          onClick={onDownload}
          className="w-7 h-7 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
        >
          <Download size={12} strokeWidth={1.5} className="text-white/70" />
        </button>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  desc,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  ctaHref: string
  ctaLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] gap-6 px-6">
      <div className="w-px h-16 bg-white/10" />
      <div className="text-center space-y-2">
        {icon}
        <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-light">{title}</p>
        <p className="text-[10px] tracking-wide text-white/15 max-w-xs">{desc}</p>
      </div>
      <Link
        href={ctaHref}
        className="flex items-center gap-2 h-10 px-6 bg-white text-[#0A0A0A] text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-white/90 transition-colors"
      >
        <Sparkles size={11} strokeWidth={1.5} /> {ctaLabel}
      </Link>
      <div className="w-px h-16 bg-white/10" />
    </div>
  )
}

function LoadMoreBar({
  hasMore,
  loading,
  count,
  onLoadMore,
}: {
  hasMore: boolean
  loading: boolean
  count: number
  onLoadMore: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 px-6">
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="h-10 px-8 border border-white/10 hover:border-white/25 text-[10px] tracking-[0.15em] uppercase font-light text-white/30 hover:text-white/60 transition-all cursor-pointer disabled:opacity-30"
        >
          {loading ? "Yükleniyor..." : "Daha Fazla Göster"}
        </button>
      )}
      <p className="text-center text-[9px] tracking-[0.15em] uppercase text-white/15 font-light">
        {count} görsel · Lunia Studio
      </p>
    </div>
  )
}
