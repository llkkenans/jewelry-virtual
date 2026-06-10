"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

const SERIF = "'Audrey', Georgia, serif"

/* Sağ halka küpenin konumu (container yüzdesi)
   Orijinal görsel — küpe merkezi ~71% soldan, ~46% yukarıdan */
const EAR  = { x: 71, y: 46 }
const ZOOM = 150

/* background-position hesabı (300% zoom, 150×150 circle):
   Görsel bg: 450×564px | Küpe: 319px soldan, 260px yukarıdan
   bpx = (319-75)/(450-150) = 81%
   bpy = (260-75)/(564-150) = 45%                                    */
const BP = { x: 81, y: 45 }

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]                   = useState("")
  const [password, setPassword]             = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError]                   = useState("")
  const [loading, setLoading]               = useState(false)
  const [success, setSuccess]               = useState(false)
  const [zoomed, setZoomed]                 = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.")
      return
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  /* ── Başarı ekranı ── */
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#F8F6F2" }}
      >
        <div className="w-full max-w-xs text-center space-y-8">

          {/* İkon */}
          <div className="mx-auto w-14 h-14 rounded-full border border-amber-300/50 flex items-center justify-center">
            <div className="w-5 h-5 rotate-45 border border-amber-400/70" />
          </div>

          {/* Başlık */}
          <div className="space-y-3">
            <h2
              style={{ fontFamily: SERIF }}
              className="text-3xl font-light text-[#1C1C1C] tracking-tight"
            >
              Hoş geldiniz
            </h2>
            <p className="text-sm text-[#B0A090] font-light leading-relaxed">
              <span className="text-[#1C1C1C] font-medium">{email}</span> adresine
              doğrulama bağlantısı gönderdik.
            </p>
            <p className="text-xs text-[#CEC8BE] font-light tracking-wide">
              E-postanızı kontrol edin
            </p>
          </div>

          {/* Altın ayraç */}
          <div className="flex items-center gap-3 mx-auto max-w-[120px]">
            <div className="h-px flex-1 bg-amber-300/30" />
            <div className="w-1 h-1 rounded-full bg-amber-400/50" />
            <div className="h-px flex-1 bg-amber-300/30" />
          </div>

          <button
            onClick={() => router.push("/login")}
            style={{ fontFamily: SERIF }}
            className="text-base font-light text-[#C9A96E] hover:text-[#B8965A] transition-colors tracking-wide cursor-pointer"
          >
            Giriş sayfasına git →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Sol panel: Fotoğraf ── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden select-none">

        {/* Ana görsel */}
        <img
          src="/landing_images/register/lucid2.jpg"
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Alt degrade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* ── Küpe hover alanı ── */}
        <div
          className="absolute z-20 rounded-full cursor-zoom-in"
          style={{
            width: 110,
            height: 110,
            left: `${EAR.x}%`,
            top: `${EAR.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
        />

        {/* ── Dış altın halka ── */}
        <div
          className="absolute z-30 rounded-full pointer-events-none"
          style={{
            width: ZOOM + 12,
            height: ZOOM + 12,
            left: `${EAR.x}%`,
            top: `${EAR.y}%`,
            transform: `translate(-50%, -50%) scale(${zoomed ? 1 : 0.88})`,
            opacity: zoomed ? 1 : 0,
            transition: "opacity 0.4s ease, transform 0.4s ease",
            border: "1px solid rgba(201,169,110,0.35)",
          }}
        />

        {/* ── Zoom lens ── */}
        <div
          className="absolute z-30 rounded-full overflow-hidden pointer-events-none"
          style={{
            width: ZOOM,
            height: ZOOM,
            left: `${EAR.x}%`,
            top: `${EAR.y}%`,
            transform: `translate(-50%, -50%) scale(${zoomed ? 1 : 0.88})`,
            opacity: zoomed ? 1 : 0,
            transition: "opacity 0.4s ease, transform 0.4s ease",
            backgroundImage: "url(/landing_images/register/lucid2.jpg)",
            backgroundSize: "300%",
            backgroundPosition: `${BP.x}% ${BP.y}%`,
            backgroundRepeat: "no-repeat",
            boxShadow:
              "0 0 0 1.5px rgba(201,169,110,0.7), 0 0 0 3px rgba(201,169,110,0.18), 0 20px 60px rgba(0,0,0,0.6)",
          }}
        />

        {/* ── Logo ── */}
        <div className="absolute top-8 left-10 z-20 flex items-center gap-2.5">
          <div className="w-5 h-5 rotate-45 border border-amber-300/45 flex items-center justify-center">
            <div className="w-1 h-1 bg-amber-300/45 rotate-45" />
          </div>
          <span
            style={{ fontFamily: SERIF }}
            className="text-white/55 text-sm tracking-[0.28em] uppercase font-light"
          >
            Jewelry Virtual
          </span>
        </div>

        {/* ── Alt içerik ── */}
        <div className="absolute bottom-0 left-0 right-0 p-10 z-20">

          <p className="text-[10px] tracking-[0.45em] uppercase text-amber-300/45 mb-6 font-light">
            Ücretsiz Başlayın
          </p>

          <blockquote style={{ fontFamily: SERIF }}>
            <p className="text-white/85 text-[27px] font-light leading-[1.3] tracking-tight italic mb-7">
              &ldquo;Her kuyumcunun hak ettiği
              <br />
              stüdyo kalitesi — şimdi
              <br />
              cebinizde.&rdquo;
            </p>
          </blockquote>

          {/* Altın ayraç */}
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-8 bg-amber-400/35" />
            <div className="w-1 h-1 rounded-full bg-amber-400/55" />
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "Ücretsiz", label: "İlk 10 üretim" },
              { value: "Anında",  label: "Hesap erişimi" },
              { value: "Sıfır",    label: "Kredi kartı" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  style={{ fontFamily: SERIF }}
                  className="text-amber-200/70 text-[18px] font-light mb-0.5"
                >
                  {s.value}
                </p>
                <p className="text-white/28 text-[11px] tracking-wider font-light">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sağ panel: Form ── */}
      <div
        className="flex-1 flex items-center justify-center p-8 sm:p-12"
        style={{ backgroundColor: "#F8F6F2" }}
      >
        <div className="w-full max-w-sm">

          {/* Mobil logo */}
          <div className="flex items-center gap-2.5 lg:hidden mb-10">
            <div className="w-5 h-5 rotate-45 border-2 border-[#1C1C1C] flex items-center justify-center">
              <div className="w-1 h-1 bg-[#1C1C1C] rotate-45" />
            </div>
            <span style={{ fontFamily: SERIF }} className="text-[#1C1C1C] text-lg tracking-wide">
              Jewelry Virtual
            </span>
          </div>

          {/* Başlık */}
          <div className="mb-10">
            <h1
              style={{ fontFamily: SERIF }}
              className="text-[40px] font-light text-[#1C1C1C] tracking-tight leading-[1.15] mb-3"
            >
              Yeni bir<br />başlangıç
            </h1>
            <p className="text-[10px] text-[#B0A090] font-light tracking-[0.22em] uppercase">
              10 ücretsiz krediyle hemen başlayın
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[10px] font-medium text-[#B0A090] uppercase tracking-[0.22em]"
              >
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 border-[#E5DFD5] bg-white text-[#1C1C1C] placeholder:text-[#D4CCC0] text-sm rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-[#C9A96E]/35 focus-visible:border-[#C9A96E]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[10px] font-medium text-[#B0A090] uppercase tracking-[0.22em]"
              >
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="En az 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 border-[#E5DFD5] bg-white text-[#1C1C1C] placeholder:text-[#D4CCC0] text-sm rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-[#C9A96E]/35 focus-visible:border-[#C9A96E]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-password"
                className="text-[10px] font-medium text-[#B0A090] uppercase tracking-[0.22em]"
              >
                Şifre Tekrar
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 border-[#E5DFD5] bg-white text-[#1C1C1C] placeholder:text-[#D4CCC0] text-sm rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-[#C9A96E]/35 focus-visible:border-[#C9A96E]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#1C1C1C] hover:bg-[#2E2E2E] text-white text-[11px] font-medium rounded-lg transition-colors disabled:opacity-60 tracking-[0.2em] uppercase cursor-pointer mt-1"
            >
              {loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
            </Button>
          </form>

          {/* Küçük not */}
          <p className="text-center text-[10px] text-[#D4CCC0] mt-5 font-light leading-relaxed tracking-wide">
            Devam ederek{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-[#B0A090] transition-colors">
              Kullanım Koşulları
            </span>
            &apos;nı kabul etmiş olursunuz.
          </p>

          {/* Ayraç */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-[#E5DFD5]" />
            <span className="text-xs text-[#D4CCC0] font-light">veya</span>
            <div className="h-px flex-1 bg-[#E5DFD5]" />
          </div>

          <p className="text-center text-sm text-[#B0A090] font-light">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              style={{ fontFamily: SERIF }}
              className="text-[#C9A96E] hover:text-[#B8965A] transition-colors font-semibold text-base"
            >
              Giriş yapın
            </Link>
          </p>

        </div>
      </div>

    </div>
  )
}
