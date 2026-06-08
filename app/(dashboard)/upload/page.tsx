"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ImagePlus,
  Sparkles,
  Download,
  X,
  Gem,
  Link2,
} from "lucide-react"

const SERIF = "'Cormorant Garant', Georgia, serif"

type JewelryType = "ring" | "necklace" | "earring"

const JEWELRY_TYPES: {
  id: JewelryType
  label: string
  desc: string
  icon: React.ElementType
}[] = [
  { id: "ring",     label: "Yüzük",  desc: "Parmakta deneme", icon: Gem      },
  { id: "necklace", label: "Kolye",  desc: "Boyunda deneme",  icon: Link2    },
  { id: "earring",  label: "Küpe",   desc: "Kulakta deneme",  icon: Sparkles },
]

const QUANTITIES = [1, 2, 3, 4]

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]       = useState(false)
  const [file, setFile]               = useState<File | null>(null)
  const [preview, setPreview]         = useState<string | null>(null)
  const [jewelryType, setJewelryType] = useState<JewelryType | null>(null)
  const [quantity, setQuantity]       = useState<number>(1)
  const [generating, setGenerating]   = useState(false)
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
    if (!file || !jewelryType) return
    setGenerating(true)
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
        body: JSON.stringify({ imageBase64, jewelryType, quantity }),
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

  const canGenerate = !!file && !!jewelryType && !generating

  return (
    <div className="space-y-8">

      {/* ── Başlık ── */}
      <div>
        <p
          className="mb-2"
          style={{ fontSize: "10px", color: "#B0A090", letterSpacing: "0.38em", textTransform: "uppercase", fontWeight: 400 }}
        >
          Yapay Zeka Destekli
        </p>
        <h1
          style={{ fontFamily: SERIF, fontSize: "clamp(32px, 5vw, 44px)", color: "#1C1C1C", fontWeight: 300, lineHeight: 1.15, letterSpacing: "-0.01em" }}
        >
          Takı Üretimi
        </h1>
        <div className="flex items-center gap-3 mt-4">
          <div className="h-px w-8" style={{ backgroundColor: "rgba(201,169,110,0.5)" }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.7)" }} />
          <div className="h-px w-16" style={{ backgroundColor: "#E5DFD5" }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Sol: kontroller ── */}
        <div className="space-y-6">

          {/* 1. Fotoğraf */}
          <div>
            <p
              className="mb-3"
              style={{ fontSize: "10px", color: "#B0A090", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              01 — Takı Fotoğrafı
            </p>

            {!preview ? (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all h-52 select-none"
                style={{
                  border: `1.5px dashed ${dragging ? "#C9A96E" : "#D9D3CB"}`,
                  backgroundColor: dragging ? "rgba(201,169,110,0.05)" : "rgba(255,255,255,0.7)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ border: "1px solid #E5DFD5", backgroundColor: "white" }}
                >
                  <ImagePlus size={18} style={{ color: "#C4B9AC" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#1C1C1C" }}>
                    {dragging ? "Bırakın" : "Sürükleyin veya tıklayın"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#B0A090" }}>
                    PNG, JPG, WEBP — maks 10 MB
                  </p>
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
              <div
                className="relative rounded-2xl overflow-hidden h-52"
                style={{ border: "1px solid #E5DFD5", backgroundColor: "white" }}
              >
                <Image src={preview} alt="Yüklenen takı" fill className="object-contain p-3" />
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  style={{ backgroundColor: "white", border: "1px solid #E5DFD5" }}
                  aria-label="Görseli kaldır"
                >
                  <X size={13} style={{ color: "#B0A090" }} />
                </button>
              </div>
            )}
          </div>

          {/* 2. Takı türü */}
          <div>
            <p
              className="mb-3"
              style={{ fontSize: "10px", color: "#B0A090", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              02 — Takı Türü
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {JEWELRY_TYPES.map(({ id, label, desc, icon: Icon }) => {
                const selected = jewelryType === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setJewelryType(id)}
                    className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl text-center transition-all cursor-pointer"
                    style={{
                      border: `1.5px solid ${selected ? "#C9A96E" : "#E5DFD5"}`,
                      backgroundColor: selected ? "rgba(201,169,110,0.07)" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: selected ? "rgba(201,169,110,0.15)" : "#F8F6F2",
                        border: `1px solid ${selected ? "rgba(201,169,110,0.3)" : "#E5DFD5"}`,
                      }}
                    >
                      <Icon size={16} style={{ color: selected ? "#C9A96E" : "#B0A090" }} />
                    </div>
                    <div>
                      <p
                        className="text-sm leading-tight"
                        style={{
                          fontFamily: SERIF,
                          color: selected ? "#1C1C1C" : "#5C4F44",
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        className="mt-0.5"
                        style={{ fontSize: "10px", color: selected ? "#C9A96E" : "#B0A090" }}
                      >
                        {desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Adet */}
          <div>
            <p
              className="mb-3"
              style={{ fontSize: "10px", color: "#B0A090", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              03 — Görsel Adedi
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {QUANTITIES.map((q) => {
                const selected = quantity === q
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl text-center transition-all cursor-pointer"
                    style={{
                      border: `1.5px solid ${selected ? "#C9A96E" : "#E5DFD5"}`,
                      backgroundColor: selected ? "rgba(201,169,110,0.07)" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: "22px",
                        fontWeight: 300,
                        color: selected ? "#1C1C1C" : "#8A7060",
                        lineHeight: 1,
                      }}
                    >
                      {q}
                    </span>
                    <span style={{ fontSize: "10px", color: selected ? "#C9A96E" : "#C4B9AC", letterSpacing: "0.1em" }}>
                      kredi
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hata */}
          {error && (
            <p className="text-sm rounded-xl px-4 py-2.5" style={{ color: "#991B1B", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2" }}>
              {error}
            </p>
          )}

          {/* ── Üret butonu ── */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full h-12 rounded-xl transition-all"
            style={{
              backgroundColor: canGenerate ? "#1C1C1C" : "#D9D3CB",
              color: "white",
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.25)", borderTopColor: "white" }}
                />
                Üretiliyor...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={14} />
                Üret — {quantity} Kredi
              </span>
            )}
          </button>
        </div>

        {/* ── Sağ: sonuç ── */}
        <div>
          <p
            className="mb-3"
            style={{ fontSize: "10px", color: "#B0A090", letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            04 — Sonuç
          </p>

          {generating ? (
            <div
              className={`rounded-2xl p-4 min-h-[420px] ${quantity > 1 ? "grid grid-cols-2 gap-3 content-start" : "space-y-3"}`}
              style={{ border: "1px solid #E5DFD5", backgroundColor: "rgba(255,255,255,0.7)" }}
            >
              {Array.from({ length: quantity }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div
              className={`rounded-2xl p-4 ${results.length > 1 ? "grid grid-cols-2 gap-4" : "space-y-4"}`}
              style={{ border: "1px solid #E5DFD5", backgroundColor: "rgba(255,255,255,0.7)" }}
            >
              {results.map((url, i) => (
                <div key={i} className="space-y-2.5">
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#F8F6F2" }}>
                    <img
                      src={url}
                      alt={`Üretilen görsel ${i + 1}`}
                      crossOrigin="anonymous"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <button
                    onClick={() => handleDownload(url, i)}
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-xl transition-colors cursor-pointer"
                    style={{
                      backgroundColor: "#1C1C1C",
                      color: "white",
                      fontSize: "10px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2E2E2E")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1C1C1C")}
                  >
                    <Download size={12} />
                    {results.length > 1 ? `İndir ${i + 1}` : "İndir"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-2xl min-h-[420px] gap-4 text-center px-6"
              style={{ border: "1.5px dashed #D9D3CB", backgroundColor: "rgba(255,255,255,0.5)" }}
            >
              {/* Dekoratif elmas */}
              <div className="relative">
                <div
                  className="w-14 h-14 rotate-45 flex items-center justify-center"
                  style={{ border: "1px solid rgba(201,169,110,0.3)", backgroundColor: "rgba(201,169,110,0.05)" }}
                >
                  <Sparkles size={18} style={{ color: "rgba(201,169,110,0.6)", transform: "rotate(-45deg)" }} />
                </div>
              </div>
              <div>
                <p
                  style={{ fontFamily: SERIF, fontSize: "20px", color: "#1C1C1C", fontWeight: 300 }}
                >
                  Sonuç burada görünecek
                </p>
                <p
                  className="mt-1.5"
                  style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "0.1em" }}
                >
                  Görsel yükleyin, takı türünü ve adedi seçin
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-px w-8" style={{ backgroundColor: "rgba(201,169,110,0.3)" }} />
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.4)" }} />
                <div className="h-px w-8" style={{ backgroundColor: "rgba(201,169,110,0.3)" }} />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
