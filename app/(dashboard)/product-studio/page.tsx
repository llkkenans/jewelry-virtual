"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import Image from "next/image"
import Link from "next/link"
import {
  ImagePlus, X, Circle, Gem, Sparkles, Watch,
  InfoIcon, Download, BookmarkPlus, Check,
  ShoppingBag, Layers, Coffee, Leaf, Square,
  Monitor, Briefcase, ChefHat, Utensils, Flower2, Droplets, Eye, Zap,
} from "lucide-react"

type Scene    = "ecommerce" | "marble" | "lifestyle" | "nature" | "minimal" | "dark_luxury"
type Shadow   = "hafif" | "normal" | "dramatik"
type Mode     = "genel" | "sektorel"
type Industry = "kitchen" | "cosmetics" | "tech" | "fashion" | "food"

type BatchResult = {
  scene: string
  url: string | null
  generationId: string | null
  selected: boolean
}

type MultiResult = {
  previewUrl: string
  status: "pending" | "processing" | "success" | "failed"
  outputUrl: string | null
  generationId: string | null
  selected: boolean
}

const MAX_FILE_BYTES = 7 * 1024 * 1024
const MAX_MULTI_FILES = 20

const SCENES: { id: Scene; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "ecommerce",   label: "E-ticaret",   description: "Beyaz arka plan",        icon: <ShoppingBag size={18} strokeWidth={1.5} /> },
  { id: "marble",      label: "Mermer",      description: "Taş yüzey dokusu",       icon: <Layers      size={18} strokeWidth={1.5} /> },
  { id: "lifestyle",   label: "Lifestyle",   description: "Kahve & günlük yaşam",   icon: <Coffee      size={18} strokeWidth={1.5} /> },
  { id: "nature",      label: "Doğa",        description: "Doğal ortam, yaprak",    icon: <Leaf        size={18} strokeWidth={1.5} /> },
  { id: "minimal",     label: "Minimal",     description: "Sade, geometrik",        icon: <Square      size={18} strokeWidth={1.5} /> },
  { id: "dark_luxury", label: "Dark Luxury", description: "Karanlık lüks atmosfer", icon: <Gem         size={18} strokeWidth={1.5} /> },
]

const INDUSTRIES: { id: Industry; label: string; emoji: string }[] = [
  { id: "kitchen",   label: "Ev & Mutfak",   emoji: "🏠" },
  { id: "cosmetics", label: "Kozmetik",      emoji: "💄" },
  { id: "tech",      label: "Teknoloji",     emoji: "💻" },
  { id: "fashion",   label: "Moda Aksesuar", emoji: "👜" },
  { id: "food",      label: "Yiyecek",       emoji: "🍽️" },
]

const INDUSTRY_SCENES: Record<Industry, { id: string; label: string; description: string; icon: React.ReactNode }[]> = {
  kitchen: [
    { id: "wooden_counter",  label: "Ahşap Tezgah",    description: "Doğal ahşap yüzey",   icon: <Coffee    size={18} strokeWidth={1.5} /> },
    { id: "modern_kitchen",  label: "Modern Mutfak",   description: "Çağdaş tasarım",      icon: <Layers    size={18} strokeWidth={1.5} /> },
    { id: "rustic_shelf",    label: "Rustik Raf",      description: "Vintage stil",         icon: <Square    size={18} strokeWidth={1.5} /> },
    { id: "breakfast_table", label: "Kahvaltı Masası", description: "Sabah atmosferi",      icon: <ChefHat   size={18} strokeWidth={1.5} /> },
  ],
  cosmetics: [
    { id: "spa_bathroom",   label: "Spa Banyo",        description: "Lüks spa ortamı",     icon: <Droplets  size={18} strokeWidth={1.5} /> },
    { id: "water_droplets", label: "Su Damlacıkları",  description: "Ferah su efekti",     icon: <Circle    size={18} strokeWidth={1.5} /> },
    { id: "rose_petals",    label: "Gül Yaprakları",   description: "Romantik dekor",      icon: <Flower2   size={18} strokeWidth={1.5} /> },
    { id: "vanity_mirror",  label: "Makyaj Masası",    description: "Şık aydınlatma",      icon: <Eye       size={18} strokeWidth={1.5} /> },
  ],
  tech: [
    { id: "modern_desk",      label: "Modern Masa",    description: "Temiz çalışma alanı", icon: <Monitor   size={18} strokeWidth={1.5} /> },
    { id: "dark_gaming",      label: "Gaming Odası",   description: "RGB atmosfer",        icon: <Zap       size={18} strokeWidth={1.5} /> },
    { id: "concrete_minimal", label: "Beton Minimal",  description: "Sade beton yüzey",   icon: <Square    size={18} strokeWidth={1.5} /> },
    { id: "workspace_flat",   label: "Çalışma Alanı",  description: "Flat lay düzeni",     icon: <Briefcase size={18} strokeWidth={1.5} /> },
  ],
  fashion: [
    { id: "velvet_display", label: "Kadife Yüzey",    description: "Lüks kadife zemin",   icon: <Gem         size={18} strokeWidth={1.5} /> },
    { id: "boutique_shelf", label: "Butik Rafı",      description: "Mağaza sergisi",       icon: <ShoppingBag size={18} strokeWidth={1.5} /> },
    { id: "marble_vanity",  label: "Mermer Makyaj",   description: "Mermer yüzey",        icon: <Layers      size={18} strokeWidth={1.5} /> },
    { id: "linen_flatlay",  label: "Keten Flat-lay",  description: "Doğal keten doku",    icon: <Square      size={18} strokeWidth={1.5} /> },
  ],
  food: [
    { id: "restaurant_table", label: "Restoran Masası", description: "Fine dining ortamı", icon: <Utensils size={18} strokeWidth={1.5} /> },
    { id: "kitchen_prep",     label: "Mutfak Tezgahı",  description: "Hazırlık yüzeyi",    icon: <ChefHat  size={18} strokeWidth={1.5} /> },
    { id: "picnic_outdoor",   label: "Piknik",           description: "Açık hava piknik",   icon: <Leaf     size={18} strokeWidth={1.5} /> },
    { id: "cafe_counter",     label: "Kafe Tezgahı",    description: "Kahve kafe ortamı",  icon: <Coffee   size={18} strokeWidth={1.5} /> },
  ],
}

const SHADOWS: { id: Shadow; label: string; symbol: string }[] = [
  { id: "hafif",    label: "Hafif",    symbol: "☁" },
  { id: "normal",   label: "Normal",   symbol: "◐" },
  { id: "dramatik", label: "Dramatik", symbol: "◑" },
]

const SHADOW_INTENSITY: Record<Shadow, string> = {
  hafif:    "soft",
  normal:   "medium",
  dramatik: "dramatic",
}

const PROGRESS_STEPS = [
  "Görsel analiz ediliyor...",
  "Sahne oluşturuluyor...",
  "Işıklandırma ayarlanıyor...",
  "Son rötuşlar yapılıyor...",
]

// ─── Helper components ─────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex items-center text-[#9CA3AF] hover:text-[#C9A96E] transition-colors focus:outline-none"
        aria-label="Bilgi"
      >
        <InfoIcon size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute left-5 top-0 z-50 w-56 sm:w-64 bg-[#111827] text-[#F8F6F2] text-[11px] leading-relaxed tracking-wide p-3 shadow-lg pointer-events-none">
          {text}
        </div>
      )}
    </span>
  )
}

function BatchSkeletonCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#F3F4F6] relative flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="w-3 h-3 border-2 border-[#9CA3AF]/40 border-t-[#9CA3AF] rounded-full animate-spin" />
          <span className="text-[9px] tracking-[0.12em] uppercase text-[#9CA3AF]">Üretiliyor...</span>
        </div>
        <span className="absolute top-2 left-2 bg-black/30 text-white text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm">
          {label}
        </span>
      </div>
    </div>
  )
}

function MultiResultCard({
  result, idx, isCurrent, onToggle, onRetry, disabled,
}: {
  result: MultiResult
  idx: number
  isCurrent: boolean
  onToggle: (idx: number) => void
  onRetry: (idx: number) => void
  disabled: boolean
}) {
  return (
    <div
      onClick={() => result.status === "success" && !disabled && onToggle(idx)}
      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
        result.status === "success" && result.selected
          ? "border-[#C9A96E] shadow-sm"
          : isCurrent
          ? "border-[#C9A96E]/50"
          : "border-[#E5E7EB]"
      } ${result.status === "success" && !disabled ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
    >
      <div className="aspect-square bg-[#F9FAFB] relative overflow-hidden">
        {/* Main image */}
        {result.status === "success" && result.outputUrl ? (
          <img src={result.outputUrl} alt={`Ürün ${idx + 1}`} className="w-full h-full object-cover" />
        ) : (
          <img
            src={result.previewUrl}
            alt={`Ürün ${idx + 1}`}
            className={`w-full h-full object-contain p-3 ${result.status === "failed" ? "opacity-20" : "opacity-40"}`}
          />
        )}

        {/* Original thumbnail (top-left, on success) */}
        {result.status === "success" && result.outputUrl && (
          <div className="absolute top-1.5 left-1.5 w-9 h-9 bg-white border border-white/80 shadow overflow-hidden">
            <img src={result.previewUrl} className="w-full h-full object-contain" />
          </div>
        )}

        {/* Pending overlay */}
        {result.status === "pending" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
            <span className="text-[9px] tracking-[0.12em] uppercase text-white/80 bg-black/30 px-2 py-1">
              Sırada...
            </span>
          </div>
        )}

        {/* Processing overlay */}
        {result.status === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-[9px] tracking-[0.12em] uppercase text-white/90">Üretiliyor...</span>
          </div>
        )}

        {/* Failed overlay */}
        {result.status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/15">
            <span className="text-[9px] tracking-[0.12em] uppercase text-red-400">Başarısız</span>
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); onRetry(idx) }}
                className="text-[9px] tracking-[0.1em] uppercase text-white bg-[#111827]/80 hover:bg-[#111827] px-2 py-1 transition-colors"
              >
                ↺ Tekrar
              </button>
            )}
          </div>
        )}

        {/* Checkbox (top-right, success only) */}
        {result.status === "success" && (
          <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            result.selected ? "bg-[#C9A96E] border-[#C9A96E]" : "bg-white/80 border-white/80"
          }`}>
            {result.selected && <Check size={10} strokeWidth={2.5} className="text-white" />}
          </div>
        )}

        {/* Sequence number (bottom-left) */}
        <span className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-sm">
          {idx + 1}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ProductStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cancelRef    = useRef(false)
  const { showToast } = useToast()

  // Scene / mode state
  const [mode,          setMode]          = useState<Mode>("genel")
  const [scene,         setScene]         = useState<Scene>("ecommerce")
  const [shadow,        setShadow]        = useState<Shadow>("normal")
  const [industry,      setIndustry]      = useState<Industry>("kitchen")
  const [industryScene, setIndustryScene] = useState<string>("wooden_counter")

  // Single-product state
  const [file,         setFile]         = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [dragging,     setDragging]     = useState(false)
  const [generating,   setGenerating]   = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [resultUrl,    setResultUrl]    = useState<string | null>(null)
  const [error,        setError]        = useState("")
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [saved,        setSaved]        = useState(false)
  const [saving,       setSaving]       = useState(false)

  // Scene-batch state (multi-scene, single product)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [batchSaving,  setBatchSaving]  = useState(false)

  // Multi-product state
  const [multiFiles,      setMultiFiles]      = useState<File[]>([])
  const [multiPreviews,   setMultiPreviews]   = useState<string[]>([])
  const [multiResults,    setMultiResults]    = useState<MultiResult[]>([])
  const [multiProcessing, setMultiProcessing] = useState(false)
  const [currentIdx,      setCurrentIdx]      = useState(-1)
  const [multiSaving,     setMultiSaving]     = useState(false)

  // ── File handling ──

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) { setError("Lütfen bir görsel dosyası seçin."); return }
    if (f.size > MAX_FILE_BYTES)      { setError("Dosya boyutu 7 MB'ı geçemez.");    return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResultUrl(null)
    setBatchResults([])
    setError("")
  }

  function handleFiles(fileList: File[]) {
    const valid = fileList.filter(f => f.type.startsWith("image/") && f.size <= MAX_FILE_BYTES)
    const skipped = fileList.length - valid.length
    if (skipped > 0) showToast(`${skipped} dosya atlandı (tip/boyut hatası).`, "error")
    if (valid.length === 0) { setError("Geçerli görsel dosyası bulunamadı."); return }

    const capped = valid.slice(0, MAX_MULTI_FILES)
    if (valid.length > MAX_MULTI_FILES) showToast(`En fazla ${MAX_MULTI_FILES} ürün. İlk ${MAX_MULTI_FILES} alındı.`, "error")

    setError("")
    setBatchResults([])
    setResultUrl(null)
    setGenerationId(null)
    setSaved(false)
    setMultiResults([])
    cancelRef.current = true
    setMultiProcessing(false)
    setCurrentIdx(-1)

    if (capped.length === 1) {
      setMultiFiles([])
      setMultiPreviews([])
      setFile(null); setPreview(null)
      handleFile(capped[0])
    } else {
      setFile(null); setPreview(null)
      setMultiFiles(capped)
      setMultiPreviews(capped.map(f => URL.createObjectURL(f)))
    }
  }

  function removeMultiFile(idx: number) {
    if (multiProcessing) return
    URL.revokeObjectURL(multiPreviews[idx])
    const newFiles    = multiFiles.filter((_, i) => i !== idx)
    const newPreviews = multiPreviews.filter((_, i) => i !== idx)
    setMultiResults([])

    if (newFiles.length <= 1) {
      newPreviews.forEach(u => URL.revokeObjectURL(u))
      setMultiFiles([]); setMultiPreviews([])
      if (newFiles.length === 1) handleFile(newFiles[0])
    } else {
      setMultiFiles(newFiles)
      setMultiPreviews(newPreviews)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFiles(files)
  }, [])
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])

  function clearFile() {
    setFile(null); setPreview(null); setResultUrl(null)
    setError(""); setGenerationId(null); setSaved(false)
    setBatchResults([])
    cancelRef.current = true
    setMultiFiles([]); setMultiPreviews([]); setMultiResults([])
    setMultiProcessing(false); setCurrentIdx(-1)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleModeChange(m: Mode) {
    setMode(m)
    setResultUrl(null); setBatchResults([]); setGenerationId(null); setSaved(false); setError("")
    setMultiResults([])
  }

  function handleIndustryChange(ind: Industry) {
    setIndustry(ind)
    setIndustryScene(INDUSTRY_SCENES[ind][0].id)
    setBatchResults([]); setResultUrl(null); setGenerationId(null); setSaved(false); setError("")
    setMultiResults([])
  }

  // ── Auth / base64 helpers ──

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function fileToBase64(f: File): Promise<string> {
    const buf = await f.arrayBuffer()
    return Buffer.from(buf).toString("base64")
  }

  async function getImageBase64(): Promise<string> {
    return fileToBase64(file!)
  }

  function buildBody(imageBase64: string, sceneId?: string) {
    if (mode === "genel") {
      return { imageBase64, scene_type: sceneId ?? scene, shadow_intensity: SHADOW_INTENSITY[shadow] }
    }
    return { imageBase64, industry, industry_scene: sceneId ?? industryScene, shadow_intensity: SHADOW_INTENSITY[shadow] }
  }

  // ── Single-product generate ──

  async function handleGenerate() {
    if (!file) return
    setGenerating(true); setProgressStep(0); setError(""); setBatchResults([])

    const progressInterval = setInterval(() => {
      setProgressStep((s) => (s < PROGRESS_STEPS.length - 1 ? s + 1 : s))
    }, 6000)

    try {
      const token = await getToken()
      if (!token) { setError("Oturum bulunamadı. Lütfen tekrar giriş yapın."); return }
      const imageBase64 = await getImageBase64()

      const res = await fetch("/api/product-shot", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(imageBase64)),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Görsel üretimi başarısız oldu.")
      }

      const data = await res.json() as { outputUrl?: string; generationId?: string }
      setResultUrl(data.outputUrl ?? null)
      setGenerationId(data.generationId ?? null)
      setSaved(false)
      window.dispatchEvent(new Event("credits-updated"))
      showToast("Görsel başarıyla üretildi!", "success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      setError(msg)
      showToast(msg.toLowerCase().includes("kredi") || msg.toLowerCase().includes("credit") ? "Yetersiz kredi" : msg || "Üretim başarısız oldu", "error")
    } finally {
      setGenerating(false); clearInterval(progressInterval); setProgressStep(0)
    }
  }

  // ── Scene-batch generate (multi-scene, single product) ──

  async function handleBatchGenerate() {
    if (!file) return
    setBatchLoading(true); setBatchResults([]); setResultUrl(null)
    setGenerationId(null); setSaved(false); setError("")

    const batchScenes = mode === "genel"
      ? SCENES.map((s) => s.id as string)
      : INDUSTRY_SCENES[industry].map((s) => s.id)

    try {
      const token = await getToken()
      if (!token) { setError("Oturum bulunamadı. Lütfen tekrar giriş yapın."); return }
      const imageBase64      = await getImageBase64()
      const shadow_intensity = SHADOW_INTENSITY[shadow]

      const settled = await Promise.allSettled(
        batchScenes.map(async (sceneId) => {
          const body = mode === "genel"
            ? { imageBase64, scene_type: sceneId, shadow_intensity }
            : { imageBase64, industry, industry_scene: sceneId, shadow_intensity }
          const res = await fetch("/api/product-shot", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error((errData as { error?: string })?.error ?? `${sceneId} başarısız`)
          }
          const data = await res.json() as { outputUrl?: string; generationId?: string }
          return { sceneId, outputUrl: data.outputUrl ?? null, generationId: data.generationId ?? null }
        })
      )

      setBatchResults(
        batchScenes.map((sceneId, i) => {
          const result = settled[i]
          if (result.status === "fulfilled") {
            return { scene: sceneId, url: result.value.outputUrl, generationId: result.value.generationId, selected: true }
          }
          return { scene: sceneId, url: null, generationId: null, selected: false }
        })
      )

      window.dispatchEvent(new Event("credits-updated"))
      const successCount = settled.filter((r) => r.status === "fulfilled").length
      showToast(
        successCount === batchScenes.length ? "Tüm sahneler üretildi!" : `${successCount}/${batchScenes.length} sahne üretildi.`,
        "success"
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      setError(msg); showToast(msg || "Üretim başarısız oldu", "error")
    } finally {
      setBatchLoading(false)
    }
  }

  // ── Multi-product sequential generate ──

  async function handleMultiGenerate() {
    if (multiFiles.length < 2 || multiProcessing) return

    const token = await getToken()
    if (!token) { setError("Oturum bulunamadı."); return }

    // Credit pre-check
    try {
      const profileRes = await fetch("/api/profile", { headers: { "Authorization": `Bearer ${token}` } })
      if (profileRes.ok) {
        const profile = await profileRes.json() as { credits?: number }
        const needed = multiFiles.length
        if (typeof profile.credits === "number" && profile.credits < needed) {
          showToast(`Yetersiz kredi. ${needed} kredi gerekli, ${profile.credits} krediniz var.`, "error")
          return
        }
      }
    } catch { /* proceed, server will block if needed */ }

    cancelRef.current = false
    setMultiProcessing(true)
    setCurrentIdx(-1)
    setBatchResults([])
    setResultUrl(null)
    setGenerationId(null)
    setSaved(false)
    setError("")

    setMultiResults(multiPreviews.map((previewUrl) => ({
      previewUrl,
      status: "pending" as const,
      outputUrl: null,
      generationId: null,
      selected: false,
    })))

    let successCount = 0

    for (let i = 0; i < multiFiles.length; i++) {
      if (cancelRef.current) break

      setCurrentIdx(i)
      setMultiResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "processing" as const } : r))

      try {
        const imageBase64 = await fileToBase64(multiFiles[i])
        const res = await fetch("/api/product-shot", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(imageBase64)),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error((errData as { error?: string })?.error ?? "Üretim başarısız")
        }

        const data = await res.json() as { outputUrl?: string; generationId?: string }
        setMultiResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          status: "success" as const,
          outputUrl: data.outputUrl ?? null,
          generationId: data.generationId ?? null,
          selected: true,
        } : r))
        successCount++
      } catch {
        setMultiResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "failed" as const } : r))
      }
    }

    window.dispatchEvent(new Event("credits-updated"))
    setMultiProcessing(false)
    setCurrentIdx(-1)
    showToast(
      `${successCount}/${multiFiles.length} ürün başarıyla üretildi.`,
      successCount > 0 ? "success" : "error"
    )
  }

  async function handleRetryMulti(idx: number) {
    if (multiProcessing) return
    const token = await getToken()
    if (!token) return

    setMultiResults(prev => prev.map((r, i) => i === idx ? { ...r, status: "processing" as const } : r))

    try {
      const imageBase64 = await fileToBase64(multiFiles[idx])
      const res = await fetch("/api/product-shot", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(imageBase64)),
      })

      if (!res.ok) throw new Error("Üretim başarısız")
      const data = await res.json() as { outputUrl?: string; generationId?: string }
      setMultiResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: "success" as const,
        outputUrl: data.outputUrl ?? null,
        generationId: data.generationId ?? null,
        selected: true,
      } : r))
      window.dispatchEvent(new Event("credits-updated"))
      showToast("Tekrar üretildi!", "success")
    } catch {
      setMultiResults(prev => prev.map((r, i) => i === idx ? { ...r, status: "failed" as const } : r))
      showToast("Tekrar üretim başarısız.", "error")
    }
  }

  // ── Save / download handlers ──

  async function handleSave() {
    if (!resultUrl)    { showToast("Görsel URL eksik.", "error"); return }
    if (!generationId) { showToast("Generation ID eksik.", "error"); return }
    if (saved || saving) return
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) { showToast("Oturum bulunamadı.", "error"); return }
      const res = await fetch("/api/save-to-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ generationId, imageUrl: resultUrl, type: "product" }),
      })
      const data = await res.json().catch(() => ({})) as { saved?: boolean; error?: string }
      if (res.ok) { setSaved(true); showToast("Galeriye kaydedildi!", "success") }
      else showToast(data.error ?? "Kaydetme başarısız oldu.", "error")
    } catch { showToast("Bir hata oluştu.", "error") }
    finally { setSaving(false) }
  }

  async function handleBatchSave() {
    const selected = batchResults.filter((r) => r.selected && r.url && r.generationId)
    if (!selected.length || batchSaving) return
    setBatchSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      const settled = await Promise.allSettled(
        selected.map((r) =>
          fetch("/api/save-to-gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ generationId: r.generationId, imageUrl: r.url, type: "product" }),
          }).then(async (res) => {
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error((data as { error?: string })?.error ?? `HTTP ${res.status}`)
            return data
          })
        )
      )
      const savedCount  = settled.filter((r) => r.status === "fulfilled").length
      const failedCount = settled.length - savedCount
      showToast(
        failedCount > 0 ? `${savedCount} kaydedildi, ${failedCount} başarısız.` : `${savedCount} görsel galeriye kaydedildi!`,
        failedCount > 0 ? "error" : "success"
      )
    } catch { showToast("Kaydetme sırasında hata oluştu.", "error") }
    finally { setBatchSaving(false) }
  }

  async function handleMultiSave() {
    const toSave = multiResults.filter(r => r.selected && r.outputUrl && r.generationId)
    if (!toSave.length || multiSaving) return
    setMultiSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      const settled = await Promise.allSettled(
        toSave.map(r =>
          fetch("/api/save-to-gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ generationId: r.generationId, imageUrl: r.outputUrl, type: "product" }),
          }).then(async res => {
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error((data as { error?: string })?.error ?? `HTTP ${res.status}`)
            return data
          })
        )
      )
      const savedCount  = settled.filter(r => r.status === "fulfilled").length
      const failedCount = settled.length - savedCount
      showToast(
        failedCount > 0 ? `${savedCount} kaydedildi, ${failedCount} başarısız.` : `${savedCount} görsel galeriye kaydedildi!`,
        failedCount > 0 ? "error" : "success"
      )
    } catch { showToast("Kaydetme sırasında hata oluştu.", "error") }
    finally { setMultiSaving(false) }
  }

  async function downloadUrl(url: string, filename: string) {
    try {
      const res  = await fetch(url)
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = href; a.download = filename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(href)
    } catch { window.open(url, "_blank") }
  }

  async function handleBatchDownload() {
    for (const r of batchResults.filter((r) => r.selected && r.url))
      await downloadUrl(r.url!, `product-${r.scene}-${Date.now()}.jpg`)
  }

  async function handleDownload() {
    if (resultUrl) await downloadUrl(resultUrl, `product-studio-${Date.now()}.jpg`)
  }

  async function handleMultiDownload() {
    for (const r of multiResults.filter(r => r.selected && r.outputUrl))
      await downloadUrl(r.outputUrl!, `product-multi-${Date.now()}.jpg`)
  }

  function toggleBatchSelect(idx: number) {
    setBatchResults((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  function toggleMultiSelect(idx: number) {
    setMultiResults((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  // ── Derived values ──

  const isMultiUpload   = multiFiles.length > 1
  const batchCreditCount = mode === "genel" ? 6 : 4
  const canGenerate     = !!file && !generating && !batchLoading && !multiProcessing
  const canMultiGenerate = isMultiUpload && !multiProcessing && !generating && !batchLoading
  const selectedCount   = batchResults.filter((r) => r.selected).length
  const multiSelCount   = multiResults.filter((r) => r.selected).length
  const isBatchMode     = batchResults.length > 0 || batchLoading
  const showMultiPanel  = isMultiUpload && (multiProcessing || multiResults.length > 0)
  const currentScenes   = mode === "genel" ? SCENES : INDUSTRY_SCENES[industry]
  const multiDoneCount  = multiResults.filter(r => r.status === "success" || r.status === "failed").length
  const multiSuccCount  = multiResults.filter(r => r.status === "success").length

  const sceneLabel = (id: string) => {
    const g = SCENES.find((s) => s.id === id)
    if (g) return g.label
    for (const scenes of Object.values(INDUSTRY_SCENES)) {
      const found = scenes.find((s) => s.id === id)
      if (found) return found.label
    }
    return id
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      <Link
        href="/studio"
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-[#9CA3AF] hover:text-[#111827] transition-colors mb-8 font-light"
      >
        ← Stüdyo Seçimine Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── SOL PANEL ── */}
        <div className="space-y-5">

          <div className="mb-8">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">Product Studio</p>
            <h1 className="text-2xl font-light tracking-wide text-[#111827]">Ürün Stüdyosu</h1>
            <div className="w-8 h-px bg-[#111827] mt-3" />
          </div>

          {/* Adım 1 — Ürün Fotoğrafı */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3 flex items-center gap-1.5">
              Ürün Fotoğrafı
              <InfoTooltip text="En iyi sonuç için ürününüzü düz bir arka plan üzerinde, net ışıkla çekin. Gölge ve yansıma olmasın." />
            </p>

            {isMultiUpload ? (
              /* Multi-file thumbnail grid */
              <div>
                <div className="grid grid-cols-4 gap-1.5">
                  {multiFiles.map((_, i) => (
                    <div key={i} className="relative aspect-square bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden group">
                      <img src={multiPreviews[i]} alt={`Ürün ${i + 1}`} className="w-full h-full object-contain p-1" />
                      {!multiProcessing && (
                        <button
                          onClick={() => removeMultiFile(i)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white/90 border border-[#E5E7EB] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                          aria-label="Kaldır"
                        >
                          <X size={8} className="text-[#6B7280]" />
                        </button>
                      )}
                      {multiProcessing && currentIdx === i && (
                        <div className="absolute inset-0 bg-[#C9A96E]/20 flex items-center justify-center">
                          <span className="w-3 h-3 border-2 border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add-more slot */}
                  {!multiProcessing && multiFiles.length < MAX_MULTI_FILES && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border border-dashed border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <ImagePlus size={16} className="text-[#9CA3AF]" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-[#9CA3AF] tracking-wide">
                    {multiFiles.length} ürün yüklendi
                  </p>
                  {!multiProcessing && (
                    <button
                      onClick={clearFile}
                      className="text-[10px] text-[#9CA3AF] hover:text-[#6B7280] tracking-wide underline cursor-pointer"
                    >
                      Tümünü temizle
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) handleFiles(Array.from(files))
                    e.target.value = ""
                  }}
                />
              </div>
            ) : !preview ? (
              /* Single-file dropzone */
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 border border-dashed cursor-pointer transition-colors h-52 select-none rounded-none ${
                  dragging
                    ? "border-[#C9A96E] bg-[#C9A96E]/5"
                    : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C9A96E] hover:bg-[#FAFDF9]"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                  <ImagePlus size={20} className="text-[#6B7280]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-light tracking-wide text-[#6B7280]">
                    {dragging ? "Bırakın" : "Sürükleyin veya tıklayın"}
                  </p>
                  <p className="text-[11px] tracking-wide text-[#9CA3AF] mt-0.5">JPG, PNG, WEBP — tek veya çoklu, max 7 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) handleFiles(Array.from(files))
                    e.target.value = ""
                  }}
                />
              </div>
            ) : (
              /* Single-file preview */
              <div className="relative overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] h-52 rounded-none">
                <Image src={preview} alt="Yüklenen ürün" fill className="object-contain p-3" />
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  aria-label="Görseli kaldır"
                >
                  <X size={13} className="text-[#6B7280]" />
                </button>
              </div>
            )}
          </div>

          {/* Adım 2 — Mod Seçimi + Sahne */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">Sahne</p>

            {/* Segmented control */}
            <div className="flex border border-[#E5E7EB] mb-4 rounded-none overflow-hidden">
              {(["genel", "sektorel"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`flex-1 py-2 text-[10px] tracking-[0.2em] uppercase font-serif transition-all cursor-pointer ${
                    mode === m ? "bg-[#111827] text-white" : "bg-white text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {m === "genel" ? "Genel" : "Sektörel"}
                </button>
              ))}
            </div>

            {/* GENEL — 6 scene cards */}
            {mode === "genel" && (
              <div className="grid grid-cols-3 gap-2">
                {SCENES.map(({ id, label, description, icon }) => (
                  <button
                    key={id}
                    onClick={() => setScene(id)}
                    className={`flex flex-col items-center gap-1.5 p-3 border transition-all cursor-pointer rounded-none text-center ${
                      scene === id ? "border-[#C9A96E] bg-[#C9A96E]/5" : "border-[#E5E7EB] bg-white hover:border-[#C9A96E]/40"
                    }`}
                  >
                    <span className={scene === id ? "text-[#C9A96E]" : "text-[#9CA3AF]"}>{icon}</span>
                    <span className={`text-[11px] font-medium tracking-wide leading-tight ${scene === id ? "text-[#111827]" : "text-[#6B7280]"}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-light leading-tight">{description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* SEKTÖREL — industry chips + sub-scene grid */}
            {mode === "sektorel" && (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible">
                  {INDUSTRIES.map(({ id, label, emoji }) => (
                    <button
                      key={id}
                      onClick={() => handleIndustryChange(id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border text-[11px] tracking-wide transition-all cursor-pointer rounded-none whitespace-nowrap ${
                        industry === id
                          ? "border-[#C9A96E] bg-[#C9A96E]/8 text-[#111827]"
                          : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#C9A96E]/50 hover:text-[#111827]"
                      }`}
                    >
                      <span className="text-sm leading-none">{emoji}</span>
                      <span className="font-light">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRY_SCENES[industry].map(({ id, label, description, icon }) => (
                    <button
                      key={id}
                      onClick={() => setIndustryScene(id)}
                      className={`flex flex-col items-center gap-1.5 p-3 border transition-all cursor-pointer rounded-none text-center ${
                        industryScene === id ? "border-[#C9A96E] bg-[#C9A96E]/5" : "border-[#E5E7EB] bg-white hover:border-[#C9A96E]/40"
                      }`}
                    >
                      <span className={industryScene === id ? "text-[#C9A96E]" : "text-[#9CA3AF]"}>{icon}</span>
                      <span className={`text-[11px] font-medium tracking-wide leading-tight ${industryScene === id ? "text-[#111827]" : "text-[#6B7280]"}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] font-light leading-tight">{description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Adım 3 — Gölge Kontrolü */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">Gölge</p>
            <div className="flex gap-2">
              {SHADOWS.map(({ id, label, symbol }) => (
                <button
                  key={id}
                  onClick={() => setShadow(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border text-[11px] tracking-wide transition-all cursor-pointer rounded-none ${
                    shadow === id
                      ? "border-[#C9A96E] bg-[#C9A96E]/5 text-[#111827]"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#C9A96E]/40"
                  }`}
                >
                  <span className={`text-[13px] leading-none ${shadow === id ? "text-[#C9A96E]" : "text-[#9CA3AF]"}`}>{symbol}</span>
                  <span className="font-light">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Uyarı bandı */}
          <div className="flex items-start gap-2 bg-[#FDF8F0] border border-[#C9A96E]/20 px-3 py-2.5">
            <InfoIcon size={13} strokeWidth={1.5} className="text-[#C9A96E] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[#9C9588] leading-relaxed tracking-wide">
              En iyi sonuç için ürününüzü düz bir arka plan üzerinde, net ışıkla çekin.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">{error}</p>
          )}

          {/* ── Buttons ── */}
          {isMultiUpload ? (
            /* Multi-product mode buttons */
            <>
              <button
                onClick={handleMultiGenerate}
                disabled={!canMultiGenerate}
                className="w-full h-12 bg-[#111827] hover:bg-[#000000] text-white text-[11px] font-medium tracking-[0.2em] uppercase rounded-none transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {multiProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {currentIdx + 1}/{multiFiles.length} İşleniyor...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} strokeWidth={1.5} />
                    Toplu Üret · {multiFiles.length} Kredi
                  </>
                )}
              </button>

              {multiProcessing && (
                <button
                  onClick={() => { cancelRef.current = true }}
                  className="w-full h-10 border border-red-200 hover:border-red-400 text-red-500 hover:text-red-700 text-[10px] font-medium tracking-[0.2em] uppercase rounded-none transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  İptal Et
                </button>
              )}

              <p className="text-[10px] text-[#9C9588] tracking-wide text-center -mt-2">
                {multiFiles.length} ürün × 1 sahne = {multiFiles.length} kredi
              </p>
            </>
          ) : (
            /* Single-product mode buttons */
            <>
              <button
                onClick={handleBatchGenerate}
                disabled={!canGenerate}
                className="w-full h-12 bg-white border border-[#111827] hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-medium tracking-[0.2em] uppercase rounded-none transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {batchLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#111827]/30 border-t-[#111827] rounded-full animate-spin" />
                    Sahneler Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Gem size={13} strokeWidth={1.5} />
                    Tüm Sahneleri Üret · {batchCreditCount} Kredi
                  </>
                )}
              </button>

              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full h-12 bg-[#111827] hover:bg-[#000000] text-white text-[11px] font-medium tracking-[0.2em] uppercase rounded-none transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {PROGRESS_STEPS[progressStep]}
                  </>
                ) : (
                  <>
                    <Sparkles size={13} strokeWidth={1.5} />
                    Ürün Görseli Oluştur · 1 Kredi
                  </>
                )}
              </button>

              <p className="text-[10px] text-[#9C9588] tracking-wide text-center -mt-2">
                Tek sahne: 1 kredi · Tüm sahneler: {batchCreditCount} kredi
              </p>
            </>
          )}
        </div>

        {/* ── SAĞ PANEL ── */}
        <div className="relative">

          {/* Priority 1: Multi-product results */}
          {showMultiPanel ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF]">
                  Toplu Üretim
                </p>
                <div className="flex items-center gap-3">
                  {multiProcessing ? (
                    <>
                      <p className="text-[10px] tracking-wide text-[#6B7280]">
                        {multiDoneCount}/{multiFiles.length} tamamlandı
                      </p>
                      <button
                        onClick={() => { cancelRef.current = true }}
                        className="text-[10px] tracking-[0.1em] uppercase text-red-500 hover:text-red-700 font-medium cursor-pointer"
                      >
                        İptal Et
                      </button>
                    </>
                  ) : multiResults.length > 0 && (
                    <p className="text-[10px] tracking-wide text-[#6B7280]">
                      {multiSuccCount}/{multiResults.length} başarılı
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {multiResults.map((r, idx) => (
                  <MultiResultCard
                    key={idx}
                    result={r}
                    idx={idx}
                    isCurrent={currentIdx === idx}
                    onToggle={toggleMultiSelect}
                    onRetry={handleRetryMulti}
                    disabled={multiProcessing}
                  />
                ))}
              </div>

              {!multiProcessing && multiResults.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleMultiDownload}
                    disabled={multiSelCount === 0}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Download size={11} strokeWidth={1.5} />
                    {multiSelCount > 0 ? `İndir (${multiSelCount})` : "İndir"}
                  </button>
                  <button
                    onClick={clearFile}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    onClick={handleMultiSave}
                    disabled={multiSelCount === 0 || multiSaving}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <BookmarkPlus size={11} strokeWidth={1.5} />
                    {multiSaving ? "Kaydediliyor..." : multiSelCount > 0 ? `Kaydet (${multiSelCount})` : "Kaydet"}
                  </button>
                </div>
              )}
            </div>

          /* Priority 2: Scene-batch results */
          ) : isBatchMode ? (
            <div>
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">Tüm Sahneler</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {batchLoading
                  ? currentScenes.map((s) => <BatchSkeletonCard key={s.id} label={s.label} />)
                  : batchResults.map((r, idx) => (
                    <div
                      key={r.scene}
                      onClick={() => r.url && toggleBatchSelect(idx)}
                      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                        r.selected ? "border-[#C9A96E] shadow-sm" : "border-[#E5E7EB]"
                      } ${r.url ? "cursor-pointer hover:shadow-md" : "cursor-default opacity-60"}`}
                    >
                      <div className="aspect-square bg-[#F9FAFB] relative overflow-hidden">
                        {r.url ? (
                          <img src={r.url} alt={r.scene} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-[10px] tracking-wide text-[#9CA3AF] text-center px-2">Üretilemedi</p>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm">
                          {sceneLabel(r.scene)}
                        </span>
                        {r.url && (
                          <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            r.selected ? "bg-[#C9A96E] border-[#C9A96E]" : "bg-white/80 border-white/80"
                          }`}>
                            {r.selected && <Check size={11} strokeWidth={2.5} className="text-white" />}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>

              {!batchLoading && batchResults.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleBatchDownload}
                    disabled={selectedCount === 0}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Download size={11} strokeWidth={1.5} />
                    İndir {selectedCount > 0 ? `(${selectedCount})` : ""}
                  </button>
                  <button
                    onClick={clearFile}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    onClick={handleBatchSave}
                    disabled={selectedCount === 0 || batchSaving}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <BookmarkPlus size={11} strokeWidth={1.5} />
                    {batchSaving ? "Kaydediliyor..." : `Kaydet ${selectedCount > 0 ? `(${selectedCount})` : ""}`}
                  </button>
                </div>
              )}
            </div>

          ) : (
            /* Priority 3: Single preview */
            <div>
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">Önizleme</p>

              <div className="relative border border-[#E5E7EB] bg-white overflow-hidden rounded-none" style={{ minHeight: "420px" }}>
                {generating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#F9FAFB]">
                    <div className="flex flex-col items-center gap-6">
                      <div className="grid grid-cols-2 gap-5">
                        <Gem      size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "0ms" }} />
                        <Circle   size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "200ms" }} />
                        <Sparkles size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "400ms" }} />
                        <Watch    size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "600ms" }} />
                      </div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[#9CA3AF] font-light">
                        {PROGRESS_STEPS[progressStep]}
                      </p>
                    </div>
                  </div>
                )}

                {resultUrl && !generating && (
                  <div className="absolute inset-0">
                    <img src={resultUrl} alt="Üretim sonucu" className="w-full h-full object-contain" />
                  </div>
                )}

                {!resultUrl && !generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                    <div className="w-px h-12 bg-[#E5E7EB]" />
                    <p className="text-[11px] tracking-[0.15em] uppercase font-light text-[#9CA3AF]">Sonuç Burada Görünecek</p>
                    <p className="text-[10px] tracking-wide text-[#D1D5DB]">
                      {isMultiUpload ? "Toplu üretimi başlatın." : "Ürün fotoğrafı yükleyin ve sahne seçin."}
                    </p>
                    <div className="w-px h-12 bg-[#E5E7EB]" />
                  </div>
                )}
              </div>

              {resultUrl && !generating && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={11} strokeWidth={1.5} />
                    İndir
                  </button>
                  <button
                    onClick={clearFile}
                    className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saved || saving}
                    className={`flex-1 h-8 border text-[10px] tracking-[0.1em] uppercase font-light transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                      saved ? "border-[#C9A96E] text-[#C9A96E]" : "border-[#E5E7EB] hover:border-[#111827] text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    {saved ? <Check size={11} strokeWidth={1.5} /> : <BookmarkPlus size={11} strokeWidth={1.5} />}
                    {saving ? "Kaydediliyor..." : saved ? "Kaydedildi" : "Kaydet"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
