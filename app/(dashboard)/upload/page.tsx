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
  ShoppingBag,
  Aperture,
  Heart,
  Coffee,
} from "lucide-react"

type Concept = "ecommerce" | "studio" | "engagement" | "lifestyle"

const CONCEPTS: {
  id: Concept
  label: string
  desc: string
  icon: React.ElementType
}[] = [
  {
    id: "ecommerce",
    label: "E-Ticaret",
    desc: "Beyaz stüdyo zemin",
    icon: ShoppingBag,
  },
  {
    id: "studio",
    label: "Stüdyo",
    desc: "Profesyonel aydınlatma",
    icon: Aperture,
  },
  {
    id: "engagement",
    label: "Nişan",
    desc: "Romantik yakın çekim",
    icon: Heart,
  },
  {
    id: "lifestyle",
    label: "Yaşam Tarzı",
    desc: "Doğal ortam",
    icon: Coffee,
  },
]

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [concept, setConcept] = useState<Concept | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState("")

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.")
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError("")
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  function clearFile() {
    setFile(null)
    setPreview(null)
    setResult(null)
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
        else if (h > MAX) { w = (w * MAX) / h; h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = url
    })
  }

  async function handleGenerate() {
    if (!file || !concept) return
    setGenerating(true)
    setError("")

    try {
      // 0. Supabase session token al
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
        return
      }

      // 1. Görseli sıkıştır (max 512x512, jpeg 0.7) ve base64'e çevir
      const dataUrl = await resizeAndConvertToBase64(file)
      const imageBase64 = dataUrl.split(",")[1]

      // 2. Görsel üretimi — Leonardo.ai
      try {
        const tryOnRes = await fetch("/api/try-on", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ imageBase64, concept }),
        })
        if (!tryOnRes.ok) {
          const err = await tryOnRes.json().catch(() => ({}))
          throw new Error(err?.error ?? "Görsel üretimi başarısız oldu.")
        }
        const tryOnData = await tryOnRes.json()
        setResult(tryOnData.outputUrl)
      } catch (err: unknown) {
        throw new Error(
          "Üretim adımı başarısız: " +
            (err instanceof Error ? err.message : "Bilinmeyen hata.")
        )
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.")
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = !!file && !!concept && !generating

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">
          Takı Fotoğrafı Yükle
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Takı görselinizi yükleyin, konsept seçin ve modelde gösterin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol: yükleme + konsept */}
        <div className="space-y-5">

          {/* DropZone */}
          <div>
            <p className="text-sm font-medium text-[#111827] mb-2">
              1. Takı fotoğrafı
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
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    PNG, JPG, WEBP — max 10 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] h-52">
                <Image
                  src={preview}
                  alt="Yüklenen takı"
                  fill
                  className="object-contain p-3"
                />
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

          {/* Konsept seçici */}
          <div>
            <p className="text-sm font-medium text-[#111827] mb-2">
              2. Konsept seçin
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CONCEPTS.map(({ id, label, desc, icon: Icon }) => {
                const selected = concept === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setConcept(id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? "border-[#111827] bg-[#111827] text-white"
                        : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF] text-[#111827]"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        selected ? "bg-white/20" : "bg-[#F9FAFB]"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={selected ? "text-white" : "text-[#6B7280]"}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium leading-tight ${
                          selected ? "text-white" : "text-[#111827]"
                        }`}
                      >
                        {label}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          selected ? "text-white/70" : "text-[#6B7280]"
                        }`}
                      >
                        {desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hata */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
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
                Üretiliyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={15} />
                Üret — 1 kredi
              </span>
            )}
          </Button>
        </div>

        {/* Sağ: sonuç alanı */}
        <div>
          <p className="text-sm font-medium text-[#111827] mb-2">
            3. Sonuç
          </p>

          {generating ? (
            /* Skeleton loader */
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 h-full min-h-[420px]">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ) : result ? (
            /* Sonuç görseli */
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4">
              <div className="rounded-lg overflow-hidden bg-[#F9FAFB]">
                <img
                  src={result}
                  alt="Üretilen görsel"
                  crossOrigin="anonymous"
                  className="w-full h-auto object-contain"
                />
              </div>
              <a
                href={result}
                download="jewelry-tryon.jpg"
                className="flex items-center justify-center gap-2 w-full h-10 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Download size={14} />
                İndir
              </a>
            </div>
          ) : (
            /* Boş durum */
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white h-full min-h-[420px] gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                <Sparkles size={20} className="text-[#9CA3AF]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">
                  Sonuç burada görünecek
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Görsel yükleyin ve konsept seçin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
