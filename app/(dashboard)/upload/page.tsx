"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ImagePlus,
  Sparkles,
  Download,
  X,
  Gem,
  Link2,
  ChevronLeft,
  Clock,
} from "lucide-react"

type JewelryType = "ring" | "necklace" | "earring" | "watch"
type DisplayType = "woman" | "man"
type SkinTone = "ivory" | "sand" | "honey" | "caramel" | "espresso"
type Background = "pure_white" | "soft_grey" | "golden_hour" | "marble_luxe" | "noir"

const DISPLAY_TYPES: {
  id: DisplayType
  label: string
  cardImage: string
}[] = [
  {
    id: "woman",
    label: "Kadın",
    cardImage: "/model_sec/woman.jpg",
  },
  {
    id: "man",
    label: "Erkek",
    cardImage: "/model_sec/man.jpg",
  },
]

const SKIN_TONES: {
  id: SkinTone
  label: string
  hex: string
  desc: string
}[] = [
  { id: "ivory",    label: "Ivory",    hex: "#F5E6D8", desc: "Çok açık, pembe alt ton" },
  { id: "sand",     label: "Sand",     hex: "#D4A574", desc: "Açık, sıcak alt ton" },
  { id: "honey",    label: "Honey",    hex: "#C68642", desc: "Orta, sıcak buğday" },
  { id: "caramel",  label: "Caramel",  hex: "#8D5524", desc: "Koyu orta ton" },
  { id: "espresso", label: "Espresso", hex: "#3C1F0F", desc: "Derin koyu ton" },
]

const BACKGROUNDS: {
  id: Background
  label: string
  desc: string
  emoji: string
}[] = [
  { id: "pure_white",  label: "Pure White",  desc: "Temiz beyaz stüdyo",     emoji: "⬜" },
  { id: "soft_grey",   label: "Soft Grey",   desc: "Editöryal nötr gri",      emoji: "🩶" },
  { id: "golden_hour", label: "Golden Hour", desc: "Sıcak altın saati ışığı", emoji: "🌅" },
  { id: "marble_luxe", label: "Marble Luxe", desc: "Lüks beyaz mermer",       emoji: "🏛️" },
  { id: "noir",        label: "Noir",        desc: "Dramatik siyah fon",      emoji: "🖤" },
]

const JEWELRY_TYPES: {
  id: JewelryType
  label: string
  desc: string
  icon: React.ElementType
  cardImage: string
}[] = [
  {
    id: "ring",
    label: "Yüzük",
    desc: "Parmakta deneme",
    icon: Gem,
    cardImage: "/models/woman/ring/lucid-origin_professional_photo_of_elegant_woman_s_hand_with_manicured_nails_close-up_white_s-3.jpg",
  },
  {
    id: "necklace",
    label: "Kolye",
    desc: "Boyunda deneme",
    icon: Link2,
    cardImage: "/models/woman/necklace/1.jpg",
  },
  {
    id: "earring",
    label: "Küpe",
    desc: "Kulakta deneme",
    icon: Sparkles,
    cardImage: "/models/woman/kupe/lucid-origin_professional_photo_of_A_close-up_photography_focusing_purely_on_the_ear_and_neck-1.jpg",
  },
  {
    id: "watch",
    label: "Saat",
    desc: "Bilekte deneme",
    icon: Clock,
    cardImage: "/models/woman/watch/1.jpg",
  },
]

const QUANTITIES = [1, 2, 3, 4]


const PROGRESS_STEPS = [
  "Görsel analiz ediliyor...",
  "Maske oluşturuluyor...",
  "Model üretiyor...",
  "Son rötuşlar yapılıyor...",
]

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep]               = useState<1 | 2 | 3 | 4 | 5>(1)
  const [dragging, setDragging]       = useState(false)
  const [file, setFile]               = useState<File | null>(null)
  const [preview, setPreview]         = useState<string | null>(null)
  const [displayType, setDisplayType] = useState<DisplayType | null>(null)
  const [skinTone, setSkinTone]       = useState<SkinTone | null>(null)
  const [background, setBackground]   = useState<Background | null>(null)
  const [jewelryType, setJewelryType] = useState<JewelryType | null>(null)
  const [quantity, setQuantity]       = useState<number>(1)
  const [generating, setGenerating]   = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [results, setResults]         = useState<string[]>([])
  const [error, setError]             = useState("")

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

  function goBack() {
    if (step === 5) {
      clearFile()
      setJewelryType(null)
      setStep(4)
    } else if (step === 4) {
      setBackground(null)
      setStep(3)
    } else if (step === 3) {
      setSkinTone(null)
      setStep(2)
    } else if (step === 2) {
      setDisplayType(null)
      setStep(1)
    }
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
    if (!file || !jewelryType || !displayType) return
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
        body: JSON.stringify({ imageBase64, jewelryType, quantity, displayType, skinTone, background }),
      })

      if (!tryOnRes.ok) {
        const err = await tryOnRes.json().catch(() => ({}))
        throw new Error(err?.error ?? "Görsel üretimi başarısız oldu.")
      }

      const tryOnData = await tryOnRes.json()

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

  const canGenerate = !!file && !!jewelryType && !!displayType && !generating
  const currentJewelry = JEWELRY_TYPES.find((j) => j.id === jewelryType)

  /* ── Adım 1: Cinsiyet Seçim Ekranı ── */
  if (step === 1) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-10 bg-black flex flex-col items-center justify-center px-8"
        style={{ top: "3.5rem" }}
      >
        <div className="w-full max-w-5xl">
          {/* Başlık */}
          <div className="text-center mb-16">
            <p
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4"
            >
              Model Seçimi
            </p>
            <h1
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-5xl font-bold text-white mb-3"
            >
              Kimi üzerinde görmek istersiniz?
            </h1>
            <p
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xl text-gray-400"
            >
              Takınızın sergileneceği modeli seçin
            </p>
          </div>

          {/* Kartlar */}
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            {DISPLAY_TYPES.map(({ id, label, cardImage }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setDisplayType(id); setStep(2) }}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer focus:outline-none transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
                style={{
                  backgroundColor: "#111",
                  border: displayType === id ? "2px solid #C9A96E" : "2px solid transparent",
                }}
              >
                <Image
                  src={cardImage}
                  alt={label}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-8">
                  <p
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    className="text-2xl font-light text-white leading-tight"
                  >
                    {label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Adım 2: Cilt Tonu Seçim Ekranı ── */
  if (step === 2) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-10 bg-black flex flex-col items-center justify-center px-8"
        style={{ top: "3.5rem" }}
      >
        <div className="w-full max-w-5xl">
          {/* Geri */}
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer mb-12"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ChevronLeft size={16} />
            <span className="text-sm">Geri</span>
          </button>

          {/* Başlık */}
          <div className="text-center mb-16">
            <p
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4"
            >
              Cilt Tonu
            </p>
            <h1
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-5xl font-bold text-white mb-3"
            >
              Cilt Tonunu Seçin
            </h1>
            <p
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xl text-gray-400"
            >
              Modelin cilt tonunu belirleyin
            </p>
          </div>

          {/* Kartlar */}
          <div className="grid grid-cols-5 gap-6 max-w-4xl mx-auto">
            {SKIN_TONES.map(({ id, label, hex, desc }) => {
              const selected = skinTone === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setSkinTone(id); setStep(3) }}
                  className="group flex flex-col items-center py-10 px-6 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none hover:border-gray-600"
                  style={{
                    backgroundColor: selected ? "#1a1508" : "#111",
                    borderColor: selected ? "#C9A96E" : "transparent",
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: hex }}
                  />
                  <p
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    className="text-lg font-medium text-white mb-1"
                  >
                    {label}
                  </p>
                  <p
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    className="text-sm text-gray-400 text-center"
                  >
                    {desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  /* ── Adım 3: Arka Plan Seçim Ekranı ── */
  if (step === 3) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-10 bg-black flex flex-col items-center justify-center px-8"
        style={{ top: "3.5rem" }}
      >
        <div className="w-full max-w-5xl">
          {/* Geri */}
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer mb-12"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ChevronLeft size={16} />
            <span className="text-sm">Geri</span>
          </button>

          {/* Başlık */}
          <div className="text-center mb-16">
            <p
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4"
            >
              Arka Plan
            </p>
            <h1
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-5xl font-bold text-white mb-3"
            >
              Arka Plan Seçin
            </h1>
            <p
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xl text-gray-400"
            >
              Çekim ortamını belirleyin
            </p>
          </div>

          {/* Kartlar */}
          <div className="grid grid-cols-5 gap-6 max-w-4xl mx-auto">
            {BACKGROUNDS.map(({ id, label, desc }) => {
              const selected = background === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setBackground(id); setStep(4) }}
                  className="group flex flex-col py-10 px-6 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none hover:border-gray-600"
                  style={{
                    backgroundColor: selected ? "#1a1508" : "#111",
                    borderColor: selected ? "#C9A96E" : "transparent",
                  }}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden relative mb-6">
                    <Image
                      src={`/backgrounds/${id}.jpg`}
                      alt={label}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                  <p
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    className="text-lg font-medium text-white mb-1"
                  >
                    {label}
                  </p>
                  <p
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    className="text-sm text-gray-400"
                  >
                    {desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  /* ── Adım 4: Takı Seçim Ekranı ── */
  if (step === 4) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-10 bg-black flex flex-col items-center justify-center py-16 px-6 sm:px-12"
        style={{ top: "3.5rem" }}
      >
        <div className="w-full max-w-3xl mb-10">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/70 transition-colors cursor-pointer mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ChevronLeft size={14} />
            <span className="tracking-[0.15em] uppercase font-medium">Geri</span>
          </button>

          <p
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="text-[10px] tracking-[0.28em] uppercase font-medium text-white/30 mb-5"
          >
            Takı Seçimi
          </p>
          <h1
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-white leading-[1.0]"
          >
            Hangi takıyı
            <br />
            <span className="font-light text-white/30">modellemek istersiniz?</span>
          </h1>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full max-w-3xl">
          {JEWELRY_TYPES.map(({ id, label, desc, cardImage }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setJewelryType(id); setStep(5) }}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer focus:outline-none"
            >
              <Image
                src={cardImage}
                alt={label}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 25vw, 200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4">
                <span
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  className="text-[9px] text-white/35 tracking-[0.25em] uppercase font-medium block mb-1.5"
                >
                  {desc}
                </span>
                <p
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  className="text-[1rem] sm:text-[1.15rem] font-bold text-white leading-tight tracking-[-0.02em]"
                >
                  {label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ── Adım 5: Upload + Üret Ekranı ── */
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          {currentJewelry?.label ?? "Geri"}
        </button>
        <div className="w-px h-4 bg-[#E5E7EB]" />
        <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
          Yeni Üretim
        </h1>
      </div>
      <p className="text-sm text-[#6B7280] -mt-4 leading-relaxed">
        Takı görselinizi yükleyin ve yapay zeka destekli fotoğrafınızı oluşturun.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Sol: kontroller ── */}
        <div className="space-y-5">

          {/* 1. DropZone */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-3">Takı Görseli</p>
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

          {/* 2. Adet seçici */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-3">Görsel Adedi</p>
            <div className="grid grid-cols-4 gap-2.5">
              {QUANTITIES.map((q) => {
                const selected = quantity === q
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selected
                        ? "border-[#111827] bg-[#111827]"
                        : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
                    }`}
                  >
                    <span className={`text-xl font-semibold tabular-nums leading-none ${selected ? "text-white" : "text-[#111827]"}`}>
                      {q}
                    </span>
                    <span className={`text-[11px] leading-none ${selected ? "text-white/60" : "text-[#9CA3AF]"}`}>
                      {q} kredi
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hata */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Üret butonu */}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full h-11 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {PROGRESS_STEPS[progressStep]}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={15} />
                Görsel Oluştur · {quantity} Kredi
              </span>
            )}
          </Button>
        </div>

        {/* ── Sağ: sonuç alanı ── */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9CA3AF] mb-3">Üretilen Görsel</p>

          {generating ? (
            <div className={`rounded-xl border border-[#E5E7EB] bg-white p-4 min-h-[420px] ${quantity > 1 ? "grid grid-cols-2 gap-3 content-start" : "space-y-3"}`}>
              {Array.from({ length: quantity }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-full aspect-square rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className={`rounded-xl border border-[#E5E7EB] bg-white p-4 ${results.length > 1 ? "grid grid-cols-2 gap-4" : "space-y-4"}`}>
              {results.map((url, i) => (
                <div key={i} className="space-y-2">
                  <div className="rounded-lg overflow-hidden bg-[#F9FAFB]">
                    <img
                      src={url}
                      alt={`Üretilen görsel ${i + 1}`}
                      crossOrigin="anonymous"
                      className="w-full h-auto object-contain"
                    />
                  </div>
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
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white h-full min-h-[420px] gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                <Sparkles size={20} className="text-[#9CA3AF]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Sonuç burada görünecek</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Görsel yükleyin ve ayarları seçin</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
