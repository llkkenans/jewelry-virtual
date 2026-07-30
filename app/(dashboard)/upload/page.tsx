"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ImagePlus, Download, Heart, X, Circle, Gem, Sparkles, Watch, Sun, ChevronRight } from "lucide-react"

type JewelryType = "ring" | "necklace" | "earring" | "watch"
type Gender      = "woman" | "man"
type SkinTone    = "ivory" | "sand" | "honey" | "caramel" | "espresso"

const GENDERS: { id: Gender; label: string }[] = [
  { id: "woman", label: "Kadın" },
  { id: "man",   label: "Erkek" },
]

const SKIN_TONES: { id: SkinTone; label: string; hex: string }[] = [
  { id: "ivory",    label: "Ivory",    hex: "#F5E6D8" },
  { id: "sand",     label: "Sand",     hex: "#D4A574" },
  { id: "honey",    label: "Honey",    hex: "#C68642" },
  { id: "caramel",  label: "Caramel",  hex: "#8D5524" },
  { id: "espresso", label: "Espresso", hex: "#3C1F0F" },
]

const JEWELRY_TYPES: { id: JewelryType; label: string; icon: React.ReactNode }[] = [
  { id: "ring",     label: "Yüzük",  icon: <Gem size={18} strokeWidth={1.5} /> },
  { id: "necklace", label: "Kolye",  icon: <Circle size={18} strokeWidth={1.5} /> },
  { id: "earring",  label: "Küpe",   icon: <Sparkles size={18} strokeWidth={1.5} /> },
  { id: "watch",    label: "Saat",   icon: <Watch size={18} strokeWidth={1.5} /> },
]

const PROGRESS_STEPS = [
  "Görsel analiz ediliyor...",
  "Maske oluşturuluyor...",
  "Model üretiyor...",
  "Son rötuşlar yapılıyor...",
]

const R2_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-1c98cbbb496648eaa0b68f90cd1f1e97.r2.dev"

function ResultImage({ url, index, generationId, onDownload, onSave, saving, saved, showIndex }: {
  url: string
  index: number
  generationId: string | null
  onDownload: (url: string, index: number) => void
  onSave: (index: number, url: string, generationId: string | null) => void
  saving: boolean
  saved: boolean
  showIndex: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [url])

  return (
    <div className="flex flex-col border border-[#E5E7EB] bg-white">
      <div className="relative w-full aspect-[3/4] bg-white overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F9FAFB]">
            <div className="grid grid-cols-2 gap-3">
              <Gem size={22} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '0ms' }} />
              <Circle size={22} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '200ms' }} />
              <Sparkles size={22} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '400ms' }} />
              <Watch size={22} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '600ms' }} />
            </div>
          </div>
        )}
        <img
          ref={imgRef}
          src={url}
          alt={`Sonuç ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          crossOrigin="anonymous"
          onLoad={() => setLoaded(true)}
        />
      </div>
      <div className="flex gap-1 p-1">
        <button
          onClick={() => onDownload(url, index)}
          className={`flex-1 flex items-center justify-center gap-2 h-10 bg-[#111827] hover:bg-[#000000] text-white text-[10px] font-medium tracking-[0.15em] uppercase transition-colors cursor-pointer ${!loaded ? "opacity-30 pointer-events-none" : ""}`}
        >
          <Download size={12} />
          İndir
        </button>
        <button
          onClick={() => onSave(index, url, generationId)}
          disabled={saving || saved || !loaded || !generationId}
          className={`flex-1 flex items-center justify-center gap-2 h-10 text-[10px] font-medium tracking-[0.15em] uppercase transition-colors cursor-pointer ${
            saved
              ? "bg-[#C9A96E] text-white"
              : "border border-[#E5E7EB] text-[#6B7280] hover:border-[#111827] hover:text-[#111827]"
          } ${!loaded ? "opacity-30 pointer-events-none" : ""} disabled:opacity-40`}
        >
          <Heart size={12} className={saved ? "fill-white" : ""} />
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi" : "Kaydet"}
        </button>
      </div>
    </div>
  )
}

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const [gender, setGender]             = useState<Gender | null>(null)
  const [skinTone, setSkinTone]         = useState<SkinTone | null>(null)
  const [jewelryType, setJewelryType]   = useState<JewelryType | null>(null)
  const [quantity, setQuantity]         = useState(1)
  const [file, setFile]                 = useState<File | null>(null)
  const [preview, setPreview]           = useState<string | null>(null)
  const [dragging, setDragging]         = useState(false)
  const [generating, setGenerating]     = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [results, setResults]           = useState<{ url: string; id: string | null }[]>([])
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set())
  const [savingIndices, setSavingIndices] = useState<Set<number>>(new Set())
  const [error, setError]               = useState("")

  async function handleSaveToGallery(index: number, imageUrl: string, generationId: string | null) {
    if (!generationId) return
    if (savingIndices.has(index) || savedIndices.has(index)) return
    setSavingIndices((prev) => { const n = new Set(prev); n.add(index); return n })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/save-to-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ generationId, imageUrl }),
      })
      if (res.ok) {
        setSavedIndices((prev) => { const n = new Set(prev); n.add(index); return n })
        showToast("Galeriye kaydedildi!", "success")
      } else {
        showToast("Kaydetme başarısız", "error")
      }
    } catch {
      showToast("Kaydetme başarısız", "error")
    } finally {
      setSavingIndices((prev) => { const n = new Set(prev); n.delete(index); return n })
    }
  }

  function getPreviewUrl(): string | null {
    if (!gender || !skinTone || !jewelryType) return null
    return `${R2_URL}/references/${jewelryType}/${gender}/${skinTone}.jpg`
  }

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.")
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults([])
    setSavedIndices(new Set())
    setSavingIndices(new Set())
    setError("")
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])

  function clearFile() {
    setFile(null)
    setPreview(null)
    setResults([])
    setSavedIndices(new Set())
    setSavingIndices(new Set())
    setError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function resizeAndConvertToBase64(f: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new window.Image()
      const url = URL.createObjectURL(f)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 512
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX }
        else if (h > MAX)     { w = (w * MAX) / h; h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = url
    })
  }

  async function handleGenerate() {
    if (!file || !jewelryType || !gender) return
    setGenerating(true)
    setProgressStep(0)
    const progressInterval = setInterval(() => {
      setProgressStep((s) => (s < PROGRESS_STEPS.length - 1 ? s + 1 : s))
    }, 7000)
    setError("")

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
        return
      }

      const dataUrl     = await resizeAndConvertToBase64(file)
      const imageBase64 = dataUrl.split(",")[1]

      const tryOnRes = await fetch("/api/try-on", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64,
          jewelryType,
          quantity,
          displayType: gender,
          skinTone,
          background: "pure_white",
        }),
      })

      if (!tryOnRes.ok) {
        const err = await tryOnRes.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Görsel üretimi başarısız oldu.")
      }

      const tryOnData = await tryOnRes.json() as { outputUrls?: { url: string; id: string | null }[] }

      setResults(tryOnData.outputUrls ?? [])
      setSavedIndices(new Set())
      setSavingIndices(new Set())
      window.dispatchEvent(new Event('credits-updated'))
      showToast("Görsel başarıyla üretildi!", "success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      setError(msg)
      if (msg.toLowerCase().includes("kredi") || msg.toLowerCase().includes("credit")) {
        showToast("Yetersiz kredi", "error")
      } else {
        showToast(msg || "Üretim başarısız oldu", "error")
      }
    } finally {
      setGenerating(false)
      clearInterval(progressInterval)
      setProgressStep(0)
    }
  }

  async function handleDownload(url: string, index: number) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `jewelry-virtual-${Date.now()}-${index + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const canGenerate = !!file && !!jewelryType && !!gender && !generating
  const previewUrl  = getPreviewUrl()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

      {/* ── SOL PANEL ── */}
      <div className="space-y-5">

        {/* Başlık */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">
            Jewelry Virtual Studio
          </p>
          <h1 className="text-2xl font-light tracking-wide text-[#111827]">
            Yeni Üretim
          </h1>
          <div className="w-8 h-px bg-[#111827] mt-3" />
        </div>

        {/* 1. Cinsiyet */}
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
            Cinsiyet
          </p>
          <div className="flex gap-2">
            {GENDERS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setGender(id)}
                className={`flex-1 py-2 border text-sm font-light tracking-[0.1em] transition-all cursor-pointer rounded-none ${
                  gender === id
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#111827]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Cilt Tonu */}
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
            Cilt Tonu
          </p>
          <div className="flex gap-4">
            {SKIN_TONES.map(({ id, label, hex }) => (
              <div key={id} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => setSkinTone(id)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                    skinTone === id
                      ? "ring-1 ring-offset-2 ring-[#111827]"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  style={{ backgroundColor: hex }}
                  title={label}
                />
                <span className={`text-[10px] tracking-wide ${
                  skinTone === id ? "text-[#111827] font-medium" : "text-[#9CA3AF]"
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Takı Türü */}
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
            Takı Türü
          </p>
          <div className="grid grid-cols-4 gap-2">
            {JEWELRY_TYPES.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setJewelryType(id)}
                className={`flex flex-col items-center gap-1.5 py-3 border text-[11px] font-light tracking-[0.1em] uppercase transition-all cursor-pointer rounded-none ${
                  jewelryType === id
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#111827]"
                }`}
              >
                {icon}
                <span className="mt-1.5">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Takı Görseli — DropZone */}
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
            Takı Görseli
          </p>
          {!preview ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 border border-dashed cursor-pointer transition-colors h-52 select-none rounded-none ${
                dragging
                  ? "border-[#111827] bg-[#111827]/5"
                  : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#111827] hover:bg-white"
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                <ImagePlus size={20} className="text-[#6B7280]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-light tracking-wide text-[#6B7280]">
                  {dragging ? "Bırakın" : "Sürükleyin veya tıklayın"}
                </p>
                <p className="text-[11px] tracking-wide text-[#9CA3AF] mt-0.5">PNG, JPG, WEBP — max 10 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          ) : (
            <div className="relative overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] h-52 rounded-none">
              <Image src={preview} alt="Yüklenen takı" fill className="object-contain p-3" />
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

        {/* 6. Görsel Adedi */}
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
            Görsel Adedi
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`flex flex-col items-center gap-1 py-3 border text-center transition-all cursor-pointer rounded-none ${
                  quantity === q
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#E5E7EB] bg-white hover:border-[#111827]"
                }`}
              >
                <span className={`text-xl font-semibold ${quantity === q ? "text-white" : "text-[#111827]"}`}>
                  {q}
                </span>
                <span className={`text-[11px] ${quantity === q ? "text-white/60" : "text-[#9CA3AF]"}`}>
                  {q} kredi
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hata */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">
            {error}
          </p>
        )}

        {/* Oluştur Butonu */}
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
              Görsel Oluştur · {quantity} Kredi
            </>
          )}
        </button>
      </div>

      {/* ── SAĞ PANEL ── */}
      <div className="relative">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
          Önizleme &amp; Sonuç
        </p>

        {results.length > 0 && !generating ? (
          <div className={`grid gap-3 ${results.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            {results.map((result, i) => (
              <ResultImage key={i} url={result.url} index={i} generationId={result.id} onDownload={handleDownload} onSave={handleSaveToGallery} saving={savingIndices.has(i)} saved={savedIndices.has(i)} showIndex={results.length > 1} />
            ))}
          </div>
        ) : (
          <div className="relative border border-[#E5E7EB] bg-white overflow-hidden min-h-[360px] lg:min-h-[520px] flex flex-col rounded-none">

            {/* Canlı önizleme — filtreler seçilince silik manken */}
            {previewUrl && !generating && (
              <img
                src={previewUrl}
                alt="Önizleme"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.35 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            )}

            {/* Generating — skeleton */}
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F9FAFB]">
                <div className="flex flex-col items-center gap-6">
                  <div className="grid grid-cols-2 gap-5">
                    <Gem size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '0ms' }} />
                    <Circle size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '200ms' }} />
                    <Sparkles size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '400ms' }} />
                    <Watch size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: '600ms' }} />
                  </div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#9CA3AF] font-light">
                    {PROGRESS_STEPS[progressStep]}
                  </p>
                </div>
              </div>
            )}

            {/* Placeholder — filtre seçilmemiş */}
            {!getPreviewUrl() && !generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-px h-12 bg-[#E5E7EB]" />
                <p className="text-[11px] tracking-[0.15em] uppercase font-light text-[#9CA3AF]">
                  Önizleme Hazır
                </p>
                <p className="text-[10px] tracking-wide text-[#D1D5DB]">
                  Seçimlerinizi yapın, önizleme burada belirsin.
                </p>
                <div className="w-px h-12 bg-[#E5E7EB]" />
              </div>
            )}

            {/* Placeholder — filtreler seçili, görsel yüklenmemiş */}
            {getPreviewUrl() && !file && !generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-px h-12 bg-[#E5E7EB]" />
                <p className="text-[11px] tracking-[0.15em] uppercase font-light text-[#9CA3AF]">
                  Son Bir Adım
                </p>
                <p className="text-[10px] tracking-wide text-[#D1D5DB]">
                  Takı fotoğrafınızı yükleyin, üretime hazır olun.
                </p>
                <div className="w-px h-12 bg-[#E5E7EB]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
