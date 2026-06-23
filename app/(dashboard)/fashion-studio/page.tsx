"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import Image from "next/image"
import Link from "next/link"
import { ImagePlus, X, Sparkles, Download, BookmarkPlus, Check, ChevronDown, ChevronUp, InfoIcon } from "lucide-react"

function IconUserSilhouette({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconPlus({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
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

type ModeType = "auto" | "avatar" | "kendi-modelim"

interface Avatar {
  id: string
  name: string
  scenes: string[]
  previewUrl: string | null
}

interface UserModel {
  id: string
  name: string
  previewUrl: string | null
  createdAt: string
}

const MAX_FILE_BYTES = 7 * 1024 * 1024

const PROGRESS_STEPS = [
  "Ürün analiz ediliyor...",
  "Model oluşturuluyor...",
  "Görsel işleniyor...",
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

function AvatarCard({
  avatar,
  selected,
  onSelect,
}: {
  avatar: Avatar
  selected: boolean
  onSelect: () => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer transition-all group ${
        selected ? "scale-[1.03]" : "opacity-70 hover:opacity-100"
      }`}
    >
      <div
        className={`w-[100px] h-[136px] overflow-hidden border transition-all ${
          selected
            ? "border-[#C9A96E] ring-2 ring-[#C9A96E] ring-offset-1"
            : "border-[#E5E7EB] group-hover:border-[#C9A96E]"
        }`}
      >
        {avatar.previewUrl && !imgError ? (
          <img
            src={avatar.previewUrl}
            alt={avatar.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center">
            <IconUserSilhouette size={32} />
          </div>
        )}
      </div>
      <span
        className={`text-[10px] tracking-wider uppercase font-medium transition-colors ${
          selected ? "text-[#111827]" : "text-[#9CA3AF]"
        }`}
      >
        {avatar.name}
      </span>
    </button>
  )
}

function ComingSoonCard() {
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed">
      <div className="w-[100px] h-[136px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] flex items-center justify-center">
        <IconPlus size={20} />
      </div>
      <span className="text-[10px] tracking-wider uppercase font-medium text-[#9CA3AF]">
        Yakında
      </span>
    </div>
  )
}

export default function FashionStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userModelFileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const [file,          setFile]          = useState<File | null>(null)
  const [preview,       setPreview]       = useState<string | null>(null)
  const [dragging,      setDragging]      = useState(false)
  const [generating,    setGenerating]    = useState(false)
  const [progressStep,  setProgressStep]  = useState(0)
  const [resultUrl,     setResultUrl]     = useState<string | null>(null)
  const [error,         setError]         = useState("")
  const [generationId,  setGenerationId]  = useState<string | null>(null)
  const [saved,         setSaved]         = useState(false)
  const [saving,        setSaving]        = useState(false)

  const [mode,           setMode]           = useState<ModeType>("auto")
  const [avatars,        setAvatars]        = useState<Avatar[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [advancedOpen,   setAdvancedOpen]   = useState(false)
  const [customPrompt,   setCustomPrompt]   = useState("")

  const [videoResolution, setVideoResolution] = useState<"720p" | "1080p">("720p")
  const [videoUrl,        setVideoUrl]        = useState<string | null>(null)
  const [videoLoading,    setVideoLoading]    = useState(false)
  const [videoError,      setVideoError]      = useState<string | null>(null)

  const [userModels,          setUserModels]          = useState<UserModel[]>([])
  const [selectedUserModelId, setSelectedUserModelId] = useState<string | null>(null)
  const [userModelsLoaded,    setUserModelsLoaded]    = useState(false)
  const [addingModel,         setAddingModel]         = useState(false)

  const [editOpen,       setEditOpen]       = useState(false)
  const [editPrompt,     setEditPrompt]     = useState("")
  const [editResolution, setEditResolution] = useState<"1k" | "2k" | "4k">("1k")
  const [editLoading,    setEditLoading]    = useState(false)
  const [editError,      setEditError]      = useState<string | null>(null)
  const [editHint,       setEditHint]       = useState(false)

  useEffect(() => {
    fetch("/api/avatars")
      .then((res) => res.json())
      .then((data: { avatars?: Avatar[] }) => setAvatars(data.avatars ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (mode !== "kendi-modelim" || userModelsLoaded) return
    fetch("/api/user-models")
      .then((res) => res.json())
      .then((data: { models?: UserModel[] }) => {
        setUserModels(data.models ?? [])
        setUserModelsLoaded(true)
      })
      .catch(console.error)
  }, [mode, userModelsLoaded])

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
    setGenerationId(null)
    setSaved(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleAddUserModel(f: File) {
    if (!f.type.startsWith("image/")) {
      showToast("Lütfen bir görsel dosyası seçin.", "error")
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      showToast("Dosya boyutu 7 MB'ı geçemez.", "error")
      return
    }
    setAddingModel(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        showToast("Oturum bulunamadı.", "error")
        return
      }
      const imageBase64 = await fileToBase64(f)
      const defaultName = `Model ${userModels.length + 1}`
      const res = await fetch("/api/user-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64, name: defaultName }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Model eklenemedi.")
      }
      const newModel = await res.json() as UserModel
      setUserModels((prev) => [...prev, newModel])
      setSelectedUserModelId(newModel.id)
      showToast("Model başarıyla eklendi!", "success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      showToast(msg, "error")
    } finally {
      setAddingModel(false)
      if (userModelFileInputRef.current) userModelFileInputRef.current.value = ""
    }
  }

  async function handleGenerate() {
    if (!file) return
    setGenerating(true)
    setProgressStep(0)
    setError("")
    setVideoUrl(null)

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

      let res: Response

      if (mode === "kendi-modelim") {
        res = await fetch("/api/fashion-tryon-max", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ garmentImage: imageBase64, userModelId: selectedUserModelId }),
        })
      } else {
        const bodyPayload: {
          productImage: string
          mode: ModeType
          avatarId?: string
          prompt?: string
        } = {
          productImage: imageBase64,
          mode,
          avatarId: mode === "avatar" && selectedAvatar ? selectedAvatar : undefined,
          prompt: customPrompt.trim() || undefined,
        }
        res = await fetch("/api/fashion-studio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Görsel üretimi başarısız oldu.")
      }

      const data = await res.json() as { outputUrl?: string; generationId?: string; fashnId?: string }
      setResultUrl(data.outputUrl ?? null)
      setGenerationId(data.generationId ?? null)
      setSaved(false)
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

  async function handleSave() {
    if (!resultUrl || !generationId || saved || saving) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const res = await fetch("/api/save-to-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ generationId, imageUrl: resultUrl, type: "fashion" }),
      })
      if (res.ok) {
        setSaved(true)
        showToast("Galeriye kaydedildi!", "success")
      } else {
        showToast("Kaydetme başarısız oldu.", "error")
      }
    } catch {
      showToast("Bir hata oluştu.", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleVideoGenerate() {
    if (!resultUrl) return
    setVideoLoading(true)
    setVideoError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setVideoError("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
        return
      }
      const res = await fetch("/api/fashion-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceImageUrl: resultUrl, resolution: videoResolution, duration: 5 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Video oluşturma başarısız oldu.")
      }
      const data = await res.json() as { videoUrl?: string; generationId?: string; fashnId?: string }
      setVideoUrl(data.videoUrl ?? null)
      window.dispatchEvent(new Event("credits-updated"))
      showToast("Video başarıyla oluşturuldu!", "success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      setVideoError(msg)
      showToast(msg || "Video oluşturma başarısız oldu", "error")
    } finally {
      setVideoLoading(false)
    }
  }

  async function handleDownloadVideo() {
    if (!videoUrl) return
    try {
      const res = await fetch(videoUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `fashion-studio-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(videoUrl, "_blank")
    }
  }

  async function handleEdit() {
    if (!resultUrl) return
    if (!editPrompt.trim()) {
      setEditHint(true)
      return
    }
    setEditHint(false)
    setEditLoading(true)
    setEditError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setEditError("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
        return
      }
      const res = await fetch("/api/fashion-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceImageUrl: resultUrl, prompt: editPrompt.trim(), resolution: editResolution }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string })?.error ?? "Düzenleme başarısız oldu.")
      }
      const data = await res.json() as { outputUrl?: string; generationId?: string; fashnId?: string }
      setResultUrl(data.outputUrl ?? null)
      setGenerationId(data.generationId ?? null)
      setVideoUrl(null)
      setSaved(false)
      setEditPrompt("")
      window.dispatchEvent(new Event("credits-updated"))
      showToast("Görsel başarıyla düzenlendi!", "success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      setEditError(msg)
      showToast(msg || "Düzenleme başarısız oldu", "error")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDownloadResult() {
    if (!resultUrl) return
    try {
      const res = await fetch(resultUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `fashion-studio-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(resultUrl, "_blank")
    }
  }

  const canGenerate =
    !!file &&
    !generating &&
    (mode === "auto" || (mode === "avatar" && !!selectedAvatar) || (mode === "kendi-modelim" && !!selectedUserModelId))

  const creditCost = mode === "kendi-modelim" ? 4 : 1

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
              Fashion Studio
            </p>
            <h1 className="text-2xl font-light tracking-wide text-[#111827]">
              Moda Stüdyosu
            </h1>
            <div className="w-8 h-px bg-[#111827] mt-3" />
          </div>

          {/* Adım 1 — Ürün Fotoğrafı */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3 flex items-center gap-1.5">
              Ürün Fotoğrafı
              <InfoTooltip text="Ürünün tamamının göründüğü, net ve iyi aydınlatılmış fotoğraflar en iyi sonucu verir." />
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

          {/* Adım 2 — Mod Seçimi */}
          <div>
            <div className="flex items-center gap-4 mb-4 border-b border-[#F3F4F6]">
              <button
                type="button"
                onClick={() => setMode("auto")}
                className={`pb-2.5 text-[10px] font-medium tracking-[0.15em] uppercase transition-all cursor-pointer ${
                  mode === "auto"
                    ? "text-[#111827] border-b-2 border-[#C9A96E] -mb-px"
                    : "text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                Otomatik
              </button>
              <button
                type="button"
                onClick={() => setMode("avatar")}
                className={`pb-2.5 text-[10px] font-medium tracking-[0.15em] uppercase transition-all cursor-pointer ${
                  mode === "avatar"
                    ? "text-[#111827] border-b-2 border-[#C9A96E] -mb-px"
                    : "text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                Avatar
              </button>
              <button
                type="button"
                onClick={() => setMode("kendi-modelim")}
                className={`pb-2.5 text-[10px] font-medium tracking-[0.15em] uppercase transition-all cursor-pointer ${
                  mode === "kendi-modelim"
                    ? "text-[#111827] border-b-2 border-[#C9A96E] -mb-px"
                    : "text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                Kendi Modelim
              </button>
            </div>

            {/* Otomatik mod */}
            {mode === "auto" && (
              <p className="text-[11px] tracking-wide text-[#9CA3AF] font-light leading-relaxed">
                FASHN AI modeli otomatik seçer ve ürünü model üzerinde gösterir.
                Referans görsele gerek yok.
              </p>
            )}

            {/* Avatar modu */}
            {mode === "avatar" && (
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
                  Model Seç
                </p>
                {avatars.length === 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    <ComingSoonCard />
                    <ComingSoonCard />
                    <ComingSoonCard />
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {avatars.map((avatar) => (
                      <AvatarCard
                        key={avatar.id}
                        avatar={avatar}
                        selected={selectedAvatar === avatar.id}
                        onSelect={() => {
                          setSelectedAvatar(selectedAvatar === avatar.id ? null : avatar.id)
                        }}
                      />
                    ))}
                    <ComingSoonCard />
                  </div>
                )}
                {mode === "avatar" && !selectedAvatar && (
                  <p className="text-[10px] text-[#C9A96E] tracking-wide mt-2">
                    Devam etmek için bir avatar seçin.
                  </p>
                )}
              </div>
            )}

            {/* Kendi Modelim modu */}
            {mode === "kendi-modelim" && (
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-3">
                  Modelini Seç
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {userModels.map((model) => {
                    const isSelected = selectedUserModelId === model.id
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedUserModelId(isSelected ? null : model.id)}
                        className={`relative flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer transition-all group ${
                          isSelected ? "scale-[1.03]" : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div
                          className={`w-[100px] h-[136px] overflow-hidden border transition-all ${
                            isSelected
                              ? "border-[#C9A96E] ring-2 ring-[#C9A96E] ring-offset-1"
                              : "border-[#E5E7EB] group-hover:border-[#C9A96E]"
                          }`}
                        >
                          {model.previewUrl ? (
                            <img
                              src={model.previewUrl}
                              alt={model.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center">
                              <IconUserSilhouette size={32} />
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] tracking-wider uppercase font-medium transition-colors ${
                            isSelected ? "text-[#111827]" : "text-[#9CA3AF]"
                          }`}
                        >
                          {model.name}
                        </span>
                      </button>
                    )
                  })}

                  {/* + Yeni Model Ekle kartı */}
                  <button
                    type="button"
                    onClick={() => userModelFileInputRef.current?.click()}
                    disabled={addingModel}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="w-[100px] h-[136px] border border-dashed border-[#C9A96E] bg-[#F9FAFB] hover:bg-[#C9A96E]/5 transition-colors flex items-center justify-center">
                      {addingModel ? (
                        <span className="w-5 h-5 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                      ) : (
                        <IconPlus size={20} />
                      )}
                    </div>
                    <span className="text-[10px] tracking-wider uppercase font-medium text-[#C9A96E]">
                      {addingModel ? "Yükleniyor..." : "+ Yeni Ekle"}
                    </span>
                  </button>

                  <input
                    ref={userModelFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddUserModel(f) }}
                  />
                </div>

                {!selectedUserModelId && (
                  <p className="text-[10px] text-[#C9A96E] tracking-wide mt-2">
                    Devam etmek için bir model seçin veya yeni ekleyin.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Gelişmiş (collapse) */}
          <div className="border border-[#F3F4F6]">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
            >
              Gelişmiş
              {advancedOpen ? <ChevronUp size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
            </button>
            {advancedOpen && (
              <div className="px-4 pb-4">
                <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-2">
                  Özel Prompt
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="örn: stüdyo arka plan, doğal ışık"
                  className="w-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-light text-[#111827] tracking-wide placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#111827] transition-colors rounded-none"
                />
              </div>
            )}
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
                Üret · {creditCost} Kredi
              </>
            )}
          </button>

          <p className="text-[10px] text-[#9C9588] tracking-wide text-center -mt-2">
            {creditCost} kredi kullanılacak
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
                  <div className="flex gap-3">
                    <Sparkles size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "0ms" }} />
                    <Sparkles size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "300ms" }} />
                    <Sparkles size={28} strokeWidth={1.2} className="text-[#C9A96E] animate-pulse" style={{ animationDelay: "600ms" }} />
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
                  Ürün fotoğrafı yükleyin ve model üzerinde görün.
                </p>
                <div className="w-px h-12 bg-[#E5E7EB]" />
              </div>
            )}
          </div>

          {resultUrl && !generating && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDownloadResult}
                className="flex-1 h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={11} strokeWidth={1.5} />
                İndir
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

          {resultUrl && !generating && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-2">
                  Video Çözünürlüğü
                </p>
                <div className="flex gap-2">
                  {(["720p", "1080p"] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setVideoResolution(res)}
                      className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium transition-all border cursor-pointer ${
                        videoResolution === res
                          ? "border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/5"
                          : "border-[#E5E7EB] text-[#9CA3AF] hover:border-[#C9A96E] hover:text-[#C9A96E]"
                      }`}
                    >
                      {res} · {res === "720p" ? "3" : "6"} Kredi
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleVideoGenerate}
                disabled={videoLoading}
                className="w-full h-10 border border-[#C9A96E] hover:bg-[#C9A96E]/10 text-[#C9A96E] text-[11px] font-medium tracking-[0.2em] uppercase transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {videoLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                    Video oluşturuluyor... (30-60 saniye)
                  </>
                ) : (
                  <>🎬 VİDEO YAP</>
                )}
              </button>

              {videoError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">
                  {videoError}
                </p>
              )}

              {videoUrl && (
                <div className="space-y-2">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full border border-[#E5E7EB]"
                  />
                  <button
                    onClick={handleDownloadVideo}
                    className="w-full h-8 border border-[#E5E7EB] hover:border-[#111827] text-[10px] tracking-[0.1em] uppercase font-light text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={11} strokeWidth={1.5} />
                    Videoyu İndir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Düzenle bölümü */}
          {resultUrl && !generating && (
            <div className="mt-3 border border-[#F3F4F6]">
              <button
                type="button"
                onClick={() => setEditOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
              >
                Düzenle
                {editOpen ? <ChevronUp size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
              </button>

              {editOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => { setEditPrompt(e.target.value); setEditHint(false) }}
                      placeholder="Ne değiştirmek istersiniz? örn: arka planı plaja çevir, modeli sola çevir, güneş gözlüğü ekle"
                      rows={3}
                      className="w-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-light text-[#111827] tracking-wide placeholder:text-[#D1D5DB] focus:outline-none focus:border-[#111827] transition-colors rounded-none resize-none"
                    />
                    {editHint && (
                      <p className="text-[10px] text-[#C9A96E] tracking-wide mt-1">
                        Lütfen bir düzenleme talimatı girin.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#9CA3AF] mb-2">
                      Çözünürlük
                    </p>
                    <div className="flex gap-2">
                      {(["1k", "2k", "4k"] as const).map((res) => {
                        const creditMap = { "1k": 1, "2k": 2, "4k": 3 }
                        return (
                          <button
                            key={res}
                            type="button"
                            onClick={() => setEditResolution(res)}
                            className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium transition-all border cursor-pointer ${
                              editResolution === res
                                ? "border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/5"
                                : "border-[#E5E7EB] text-[#9CA3AF] hover:border-[#C9A96E] hover:text-[#C9A96E]"
                            }`}
                          >
                            {res.toUpperCase()} · {creditMap[res]} Kredi
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleEdit}
                    disabled={editLoading}
                    className="w-full h-10 border border-[#C9A96E] hover:bg-[#C9A96E]/10 text-[#C9A96E] text-[11px] font-medium tracking-[0.2em] uppercase transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                        Düzenleniyor...
                      </>
                    ) : (
                      "DÜZENLE"
                    )}
                  </button>

                  {editError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">
                      {editError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
