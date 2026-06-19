"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import Image from "next/image"
import Link from "next/link"
import { ImagePlus, X, Circle, Gem, Sparkles, Watch } from "lucide-react"

type Category = "tops" | "bottoms" | "one-pieces"
type Gender   = "woman" | "man"
type SkinTone = "light" | "medium" | "dark"

const MAX_FILE_BYTES = 7 * 1024 * 1024

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "tops",       label: "Üst" },
  { id: "bottoms",    label: "Alt" },
  { id: "one-pieces", label: "Tek Parça" },
]

const GENDERS: { id: Gender; label: string }[] = [
  { id: "woman", label: "Kadın" },
  { id: "man",   label: "Erkek" },
]

const SKIN_TONES: { id: SkinTone; label: string; hex: string }[] = [
  { id: "light",  label: "Açık",  hex: "#F1D9B5" },
  { id: "medium", label: "Orta",  hex: "#C68642" },
  { id: "dark",   label: "Koyu",  hex: "#5C4033" },
]

const PROGRESS_STEPS = [
  "Görsel analiz ediliyor...",
  "Model seçiliyor...",
  "Kıyafet giydiriliyor...",
  "Son rötuşlar yapılıyor...",
]

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(f)
  })
}

export default function ClothingStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const [category,  setCategory]  = useState<Category>("tops")
  const [gender,    setGender]    = useState<Gender>("woman")
  const [skinTone,  setSkinTone]  = useState<SkinTone>("medium")
  const [file,      setFile]      = useState<File | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error,     setError]     = useState("")

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.")
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("Dosya boyutu 7 MB'ı geçemez.")
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResultUrl(null)
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
    setResultUrl(null)
    setError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleGenerate() {
    if (!file) return
    setGenerating(true)
    setProgressStep(0)
    setError("")

    const progressInterval = setInterval(() => {
      setProgressStep((s) => (s < PROGRESS_STEPS.length - 1 ? s + 1 : s))
    }, 6000)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
        return
      }

      const imageBase64 = await fileToBase64(file)

      const res = await fetch("/api/clothing-tryon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64, category, gender, skinTone }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Görsel üretimi başarısız oldu.")
      }

      const data = await res.json() as { outputUrl?: string; generationId?: string }
      setResultUrl(data.outputUrl ?? null)
      window.dispatchEvent(new Event("credits-updated"))
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

  const canGenerate = !!file && !generating

  return (
    <div>
      {/* Geri linki */}
      <Link
        href="/studio"
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-[#9CA3AF] hover:text-[#111827] transition-colors mb-8 font-light"
      >
        ←
        Stüdyo Seçimine Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

        {/* ── SOL PANEL ── */}
        <div className="space-y-5">

          {/* Başlık */}
          <div className="mb-8">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">
              Clothing Studio
            </p>
            <h1 className="text-2xl font-light tracking-wide text-[#111827]">
              Kıyafet Stüdyosu
            </h1>
            <div className="w-8 h-px bg-[#111827] mt-3" />
          </div>

          {/* Adım 1 — Kıyafet Fotoğrafı */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
              Kıyafet Fotoğrafı
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
                <Image src={preview} alt="Yüklenen kıyafet" fill className="object-contain p-3" />
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

          {/* Adım 2 — Kategori */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
              Kategori
            </p>
            <div className="flex gap-2">
              {CATEGORIES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={`flex-1 py-2 border text-sm font-light tracking-[0.1em] transition-all cursor-pointer rounded-none ${
                    category === id
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#111827]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Adım 3 — Cinsiyet */}
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

          {/* Adım 4 — Ten Tonu */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
              Ten Tonu
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

          {/* Hata */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">
              {error}
            </p>
          )}

          {/* Üret Butonu */}
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
                Modele Giydir · 1 Kredi
              </>
            )}
          </button>

          <p className="text-[10px] text-[#9C9588] tracking-wide text-center -mt-2">
            1 kredi kullanılacak
          </p>
        </div>

        {/* ── SAĞ PANEL ── */}
        <div className="relative">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
            Önizleme
          </p>

          <div className="relative border border-[#E5E7EB] bg-white overflow-hidden min-h-[360px] lg:min-h-[520px] flex flex-col rounded-none" style={{ aspectRatio: "2/3" }}>

            {/* Generating */}
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

            {/* Sonuç */}
            {resultUrl && !generating && (
              <div className="absolute inset-0">
                <img
                  src={resultUrl}
                  alt="Üretim sonucu"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Placeholder */}
            {!resultUrl && !generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-px h-12 bg-[#E5E7EB]" />
                <p className="text-[11px] tracking-[0.15em] uppercase font-light text-[#9CA3AF]">
                  Sonuç Burada Görünecek
                </p>
                <p className="text-[10px] tracking-wide text-[#D1D5DB]">
                  Kıyafet fotoğrafı yükleyin ve modele giydirin.
                </p>
                <div className="w-px h-12 bg-[#E5E7EB]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
