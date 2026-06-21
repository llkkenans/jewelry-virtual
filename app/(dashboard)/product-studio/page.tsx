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
} from "lucide-react"

type Scene  = "ecommerce" | "marble" | "lifestyle" | "nature" | "minimal" | "dark_luxury"
type Shadow = "hafif" | "normal" | "dramatik"

const MAX_FILE_BYTES = 7 * 1024 * 1024

const SCENES: { id: Scene; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "ecommerce",   label: "E-ticaret",   description: "Beyaz arka plan",        icon: <ShoppingBag size={18} strokeWidth={1.5} /> },
  { id: "marble",      label: "Mermer",      description: "Taş yüzey dokusu",       icon: <Layers      size={18} strokeWidth={1.5} /> },
  { id: "lifestyle",   label: "Lifestyle",   description: "Kahve & günlük yaşam",   icon: <Coffee      size={18} strokeWidth={1.5} /> },
  { id: "nature",      label: "Doğa",        description: "Doğal ortam, yaprak",    icon: <Leaf        size={18} strokeWidth={1.5} /> },
  { id: "minimal",     label: "Minimal",     description: "Sade, geometrik",        icon: <Square      size={18} strokeWidth={1.5} /> },
  { id: "dark_luxury", label: "Dark Luxury", description: "Karanlık lüks atmosfer", icon: <Gem         size={18} strokeWidth={1.5} /> },
]

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

type BatchResult = {
  scene: Scene
  url: string | null
  generationId: string | null
  selected: boolean
}

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
      <div className="p-2 flex items-center justify-between">
        <div className="h-3 w-16 bg-[#E5E7EB] rounded" />
        <div className="w-4 h-4 bg-[#E5E7EB] rounded" />
      </div>
    </div>
  )
}

export default function ProductStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const [scene,        setScene]        = useState<Scene>("ecommerce")
  const [shadow,       setShadow]       = useState<Shadow>("normal")
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

  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [batchSaving,  setBatchSaving]  = useState(false)

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) { setError("Lütfen bir görsel dosyası seçin."); return }
    if (f.size > MAX_FILE_BYTES)      { setError("Dosya boyutu 7 MB'ı geçemez.");    return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResultUrl(null)
    setBatchResults([])
    setError("")
  }

  const onDrop      = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [])
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])

  function clearFile() {
    setFile(null); setPreview(null); setResultUrl(null)
    setError(""); setGenerationId(null); setSaved(false)
    setBatchResults([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function getImageBase64(): Promise<string> {
    const buf = await file!.arrayBuffer()
    return Buffer.from(buf).toString("base64")
  }

  async function handleGenerate() {
    if (!file) return
    setGenerating(true)
    setProgressStep(0)
    setError("")
    setBatchResults([])

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
        body: JSON.stringify({ imageBase64, scene_type: scene, shadow_intensity: SHADOW_INTENSITY[shadow] }),
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
      setGenerating(false)
      clearInterval(progressInterval)
      setProgressStep(0)
    }
  }

  async function handleBatchGenerate() {
    if (!file) return
    setBatchLoading(true)
    setBatchResults([])
    setResultUrl(null)
    setGenerationId(null)
    setSaved(false)
    setError("")

    const BATCH_SCENE_IDS = SCENES.map((s) => s.id)

    try {
      const token = await getToken()
      if (!token) { setError("Oturum bulunamadı. Lütfen tekrar giriş yapın."); return }

      const imageBase64   = await getImageBase64()
      const shadow_intensity = SHADOW_INTENSITY[shadow]

      // 6 paralel POST — her biri kendi 60s timeout'unda çalışır
      const settled = await Promise.allSettled(
        BATCH_SCENE_IDS.map(async (sceneId) => {
          const res = await fetch("/api/product-shot", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64, scene_type: sceneId, shadow_intensity }),
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
        BATCH_SCENE_IDS.map((sceneId, i) => {
          const result = settled[i]
          if (result.status === "fulfilled") {
            return { scene: sceneId, url: result.value.outputUrl, generationId: result.value.generationId, selected: true }
          }
          return { scene: sceneId, url: null, generationId: null, selected: false }
        })
      )

      window.dispatchEvent(new Event("credits-updated"))
      const successCount = settled.filter((r) => r.status === "fulfilled").length
      if (successCount === BATCH_SCENE_IDS.length) {
        showToast("Tüm sahneler üretildi!", "success")
      } else {
        showToast(`${successCount}/${BATCH_SCENE_IDS.length} sahne üretildi.`, "success")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      setError(msg)
      showToast(msg || "Üretim başarısız oldu", "error")
    } finally {
      setBatchLoading(false)
    }
  }

  async function handleSave() {
    if (!resultUrl || !generationId || saved || saving) return
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      const res = await fetch("/api/save-to-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ generationId, imageUrl: resultUrl, type: "product" }),
      })
      if (res.ok) { setSaved(true); showToast("Galeriye kaydedildi!", "success") }
      else showToast("Kaydetme başarısız oldu.", "error")
    } catch {
      showToast("Bir hata oluştu.", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleBatchSave() {
    const selected = batchResults.filter((r) => r.selected && r.url && r.generationId)
    if (!selected.length || batchSaving) return
    setBatchSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      console.log("SAVE batch: ids=", selected.map((r) => r.generationId))
      const settled = await Promise.allSettled(
        selected.map((r) =>
          fetch("/api/save-to-gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ generationId: r.generationId, imageUrl: r.url, type: "product" }),
          }).then(async (res) => {
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error((data as { error?: string })?.error ?? `HTTP ${res.status}`)
            console.log(`SAVE: scene ${r.scene} →`, data)
            return data
          })
        )
      )
      const savedCount = settled.filter((r) => r.status === "fulfilled").length
      const failedCount = settled.length - savedCount
      if (failedCount > 0) {
        const errors = settled.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason?.message).join(", ")
        console.error("SAVE batch errors:", errors)
        showToast(`${savedCount} kaydedildi, ${failedCount} başarısız: ${errors}`, "error")
      } else {
        showToast(`${savedCount} görsel galeriye kaydedildi!`, "success")
      }
    } catch (err) {
      console.error("handleBatchSave unexpected error:", err)
      showToast("Kaydetme sırasında hata oluştu.", "error")
    } finally {
      setBatchSaving(false)
    }
  }

  async function handleBatchDownload() {
    const selected = batchResults.filter((r) => r.selected && r.url)
    for (const r of selected) {
      try {
        const res  = await fetch(r.url!)
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement("a")
        a.href = url; a.download = `product-${r.scene}-${Date.now()}.jpg`
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(url)
      } catch {
        window.open(r.url!, "_blank")
      }
    }
  }

  async function handleDownload() {
    if (!resultUrl) return
    try {
      const res  = await fetch(resultUrl)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = `product-studio-${Date.now()}.jpg`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch {
      window.open(resultUrl, "_blank")
    }
  }

  function toggleBatchSelect(idx: number) {
    setBatchResults((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  const canGenerate   = !!file && !generating && !batchLoading
  const selectedCount = batchResults.filter((r) => r.selected).length
  const isBatchMode   = batchResults.length > 0 || batchLoading
  const sceneLabel    = (id: Scene) => SCENES.find((s) => s.id === id)?.label ?? id

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
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">
              Product Studio
            </p>
            <h1 className="text-2xl font-light tracking-wide text-[#111827]">
              Ürün Stüdyosu
            </h1>
            <div className="w-8 h-px bg-[#111827] mt-3" />
          </div>

          {/* Adım 1 — Ürün Fotoğrafı */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3 flex items-center gap-1.5">
              Ürün Fotoğrafı
              <InfoTooltip text="En iyi sonuç için ürününüzü düz bir arka plan üzerinde, net ışıkla çekin. Gölge ve yansıma olmasın." />
            </p>
            {!preview ? (
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
                  <p className="text-[11px] tracking-wide text-[#9CA3AF] mt-0.5">
                    JPG, PNG, WEBP — max 7 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>
            ) : (
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

          {/* Adım 2 — Sahne Seçimi */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
              Sahne
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SCENES.map(({ id, label, description, icon }) => (
                <button
                  key={id}
                  onClick={() => setScene(id)}
                  className={`flex flex-col items-center gap-1.5 p-3 border transition-all cursor-pointer rounded-none text-center ${
                    scene === id
                      ? "border-[#C9A96E] bg-[#C9A96E]/5"
                      : "border-[#E5E7EB] bg-white hover:border-[#C9A96E]/40"
                  }`}
                >
                  <span className={scene === id ? "text-[#C9A96E]" : "text-[#9CA3AF]"}>
                    {icon}
                  </span>
                  <span className={`text-[11px] font-medium tracking-wide leading-tight ${scene === id ? "text-[#111827]" : "text-[#6B7280]"}`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] font-light leading-tight">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Adım 3 — Gölge Kontrolü */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
              Gölge
            </p>
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
                  <span className={`text-[13px] leading-none ${shadow === id ? "text-[#C9A96E]" : "text-[#9CA3AF]"}`}>
                    {symbol}
                  </span>
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
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">
              {error}
            </p>
          )}

          {/* Tüm Sahneleri Üret */}
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
                Tüm Sahneleri Üret · 6 Kredi
              </>
            )}
          </button>

          {/* Tek Sahne Üret */}
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
            Tek sahne: 1 kredi · Tüm sahneler: 6 kredi
          </p>
        </div>

        {/* ── SAĞ PANEL ── */}
        <div className="relative">

          {/* ── BATCH MOD ── */}
          {isBatchMode ? (
            <div>
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
                Tüm Sahneler
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {batchLoading
                  ? SCENES.map((s) => <BatchSkeletonCard key={s.id} label={s.label} />)
                  : batchResults.map((r, idx) => (
                    <div
                      key={r.scene}
                      onClick={() => r.url && toggleBatchSelect(idx)}
                      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                        r.selected
                          ? "border-[#C9A96E] shadow-sm"
                          : "border-[#E5E7EB]"
                      } ${r.url ? "cursor-pointer hover:shadow-md" : "cursor-default opacity-60"}`}
                    >
                      {/* Görsel */}
                      <div className="aspect-square bg-[#F9FAFB] relative overflow-hidden">
                        {r.url ? (
                          <img src={r.url} alt={r.scene} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-[10px] tracking-wide text-[#9CA3AF] text-center px-2">
                              Üretilemedi
                            </p>
                          </div>
                        )}

                        {/* Sahne badge */}
                        <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm">
                          {sceneLabel(r.scene)}
                        </span>

                        {/* Checkbox */}
                        {r.url && (
                          <div
                            className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              r.selected
                                ? "bg-[#C9A96E] border-[#C9A96E]"
                                : "bg-white/80 border-white/80"
                            }`}
                          >
                            {r.selected && <Check size={11} strokeWidth={2.5} className="text-white" />}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Batch aksiyon butonları */}
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
            /* ── TEK SAHNE MODU ── */
            <div>
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
                Önizleme
              </p>

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
                    <p className="text-[11px] tracking-[0.15em] uppercase font-light text-[#9CA3AF]">
                      Sonuç Burada Görünecek
                    </p>
                    <p className="text-[10px] tracking-wide text-[#D1D5DB]">
                      Ürün fotoğrafı yükleyin ve sahne seçin.
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
                      saved
                        ? "border-[#C9A96E] text-[#C9A96E]"
                        : "border-[#E5E7EB] hover:border-[#111827] text-[#6B7280] hover:text-[#111827]"
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
