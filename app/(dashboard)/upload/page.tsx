"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ImagePlus, Sparkles, Download, X } from "lucide-react"

type JewelryType = "ring" | "necklace" | "earring" | "watch"
type Gender      = "woman" | "man"
type Ethnicity   = "european" | "asian" | "afro" | "middleeastern"
type SkinTone    = "ivory" | "sand" | "honey" | "caramel" | "espresso"
type NailStyle   = "natural" | "french" | "red" | "dark"
type CollarType  = "v_neck" | "high_neck"

const GENDERS: { id: Gender; label: string }[] = [
  { id: "woman", label: "Kadın" },
  { id: "man",   label: "Erkek" },
]

const ETHNICITIES: { id: Ethnicity; label: string }[] = [
  { id: "european",      label: "Avrupalı" },
  { id: "asian",         label: "Asyalı" },
  { id: "afro",          label: "Afro" },
  { id: "middleeastern", label: "Ortadoğulu" },
]

const SKIN_TONES: { id: SkinTone; label: string; hex: string }[] = [
  { id: "ivory",    label: "Ivory",    hex: "#F5E6D8" },
  { id: "sand",     label: "Sand",     hex: "#D4A574" },
  { id: "honey",    label: "Honey",    hex: "#C68642" },
  { id: "caramel",  label: "Caramel",  hex: "#8D5524" },
  { id: "espresso", label: "Espresso", hex: "#3C1F0F" },
]

const JEWELRY_TYPES: { id: JewelryType; label: string; icon: string }[] = [
  { id: "ring",     label: "Yüzük",  icon: "💍" },
  { id: "necklace", label: "Kolye",  icon: "📿" },
  { id: "earring",  label: "Küpe",   icon: "✨" },
  { id: "watch",    label: "Saat",   icon: "⌚" },
]

const NAIL_STYLES: { id: NailStyle; label: string }[] = [
  { id: "natural", label: "Doğal" },
  { id: "french",  label: "French" },
  { id: "red",     label: "Mat Kırmızı" },
  { id: "dark",    label: "Koyu Renk" },
]

const COLLAR_TYPES: { id: CollarType; label: string }[] = [
  { id: "v_neck",    label: "V Yaka" },
  { id: "high_neck", label: "Dik Yaka" },
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

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [gender, setGender]             = useState<Gender | null>(null)
  const [ethnicity, setEthnicity]       = useState<Ethnicity | null>(null)
  const [skinTone, setSkinTone]         = useState<SkinTone | null>(null)
  const [jewelryType, setJewelryType]   = useState<JewelryType | null>(null)
  const [nailStyle, setNailStyle]       = useState<NailStyle | null>(null)
  const [collarType, setCollarType]     = useState<CollarType | null>(null)
  const [quantity, setQuantity]         = useState(1)
  const [file, setFile]                 = useState<File | null>(null)
  const [preview, setPreview]           = useState<string | null>(null)
  const [dragging, setDragging]         = useState(false)
  const [generating, setGenerating]     = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [results, setResults]           = useState<string[]>([])
  const [error, setError]               = useState("")

  function getPreviewUrl(): string | null {
    if (!gender || !ethnicity || !skinTone || !jewelryType) return null
    const detail =
      jewelryType === "ring" || jewelryType === "watch"
        ? (nailStyle ?? "natural")
        : (collarType ?? "v_neck")
    return `${R2_URL}/references/${jewelryType}/${gender}/${ethnicity}/${skinTone}/${detail}.jpg`
  }

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.")
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults([])
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
          ethnicity,
          nailStyle,
          collarType,
        }),
      })

      if (!tryOnRes.ok) {
        const err = await tryOnRes.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Görsel üretimi başarısız oldu.")
      }

      const tryOnData = await tryOnRes.json() as { outputUrls?: string[]; outputUrl?: string }
      const urls: string[] = Array.isArray(tryOnData.outputUrls)
        ? tryOnData.outputUrls
        : tryOnData.outputUrl
        ? [tryOnData.outputUrl]
        : []

      setResults(urls)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.")
    } finally {
      setGenerating(false)
      clearInterval(progressInterval)
      setProgressStep(0)
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

  const canGenerate = !!file && !!jewelryType && !!gender && !generating
  const previewUrl  = getPreviewUrl()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

      {/* ── SOL PANEL ── */}
      <div className="space-y-5">

        {/* Başlık */}
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Yeni Üretim</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Filtreleri seçin, takı görselinizi yükleyin ve oluşturun.
          </p>
        </div>

        {/* 1. Cinsiyet */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
            Cinsiyet
          </p>
          <div className="flex gap-2">
            {GENDERS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setGender(id); setEthnicity(null) }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  gender === id
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Etnisite — cinsiyet seçilince animasyonlu açılır */}
        {gender && (
          <div style={{ animation: "fadeSlideDown 0.3s ease" }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
              Etnisite
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ETHNICITIES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setEthnicity(id)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    ethnicity === id
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Cilt Tonu */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
            Cilt Tonu
          </p>
          <div className="flex gap-3">
            {SKIN_TONES.map(({ id, label, hex }) => (
              <button
                key={id}
                onClick={() => setSkinTone(id)}
                title={label}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  skinTone === id ? "opacity-100 scale-110" : "opacity-60 hover:opacity-90"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    skinTone === id ? "border-[#111827]" : "border-transparent"
                  }`}
                  style={{ backgroundColor: hex }}
                />
                <span className="text-[10px] text-[#6B7280]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Takı Türü */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
            Takı Türü
          </p>
          <div className="grid grid-cols-4 gap-2">
            {JEWELRY_TYPES.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => { setJewelryType(id); setNailStyle(null); setCollarType(null) }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  jewelryType === id
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]"
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 5a. Tırnak Tarzı — ring veya watch seçilince */}
        {(jewelryType === "ring" || jewelryType === "watch") && (
          <div style={{ animation: "fadeSlideDown 0.3s ease" }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
              Tırnak Tarzı
            </p>
            <div className="grid grid-cols-4 gap-2">
              {NAIL_STYLES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setNailStyle(id)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    nailStyle === id
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5b. Yaka Tipi — necklace seçilince */}
        {jewelryType === "necklace" && (
          <div style={{ animation: "fadeSlideDown 0.3s ease" }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
              Yaka Tipi
            </p>
            <div className="flex gap-2">
              {COLLAR_TYPES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCollarType(id)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    collarType === id
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Takı Görseli — DropZone */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
            Takı Görseli
          </p>
          {!preview ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors h-52 select-none ${
                dragging
                  ? "border-[#111827] bg-[#111827]/5"
                  : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#9CA3AF] hover:bg-white"
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                <ImagePlus size={20} className="text-[#6B7280]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#111827]">
                  {dragging ? "Bırakın" : "Sürükleyin veya tıklayın"}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">PNG, JPG, WEBP — max 10 MB</p>
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
            <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] h-52">
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

        {/* 7. Görsel Adedi */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-2">
            Görsel Adedi
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition-all cursor-pointer ${
                  quantity === q
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
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
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Oluştur Butonu */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full h-11 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {PROGRESS_STEPS[progressStep]}
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Görsel Oluştur · {quantity} Kredi
            </>
          )}
        </button>
      </div>

      {/* ── SAĞ PANEL ── */}
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-3">
          Önizleme &amp; Sonuç
        </p>

        <div className="relative rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden min-h-[520px] flex items-center justify-center">

          {/* Canlı önizleme — filtreler seçilince silik manken */}
          {previewUrl && !results.length && !generating && (
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
            <div className={`absolute inset-0 p-4 ${quantity > 1 ? "grid grid-cols-2 gap-3 content-start" : ""}`}>
              {Array.from({ length: quantity }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-full aspect-square rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Sonuç görseller */}
          {results.length > 0 && !generating && (
            <div className={`absolute inset-0 p-4 ${results.length > 1 ? "grid grid-cols-2 gap-3 content-start" : ""}`}>
              {results.map((url, i) => (
                <div key={i} className="space-y-2">
                  <img
                    src={url}
                    alt={`Sonuç ${i + 1}`}
                    className="w-full h-auto rounded-lg object-contain"
                    crossOrigin="anonymous"
                  />
                  <button
                    onClick={() => handleDownload(url, i)}
                    className="flex items-center justify-center gap-2 w-full h-9 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    {results.length > 1 ? `İndir ${i + 1}` : "İndir"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Placeholder — hiçbir şey yokken */}
          {!previewUrl && !generating && !results.length && (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                <Sparkles size={20} className="text-[#9CA3AF]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Sonuç burada görünecek</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Sol taraftan filtreleri seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
