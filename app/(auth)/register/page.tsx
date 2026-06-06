"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

const benefits = [
  { icon: "◈", text: "10 ücretsiz kredi ile başla" },
  { icon: "◈", text: "4 farklı konsept stili" },
  { icon: "◈", text: "30 saniyede sonuç" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto">
            <div className="w-7 h-7 rotate-45 border-2 border-[#16A34A]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#111827] tracking-tight">
              Hesabınız oluşturuldu
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              <span className="font-medium text-[#111827]">{email}</span> adresine
              bir doğrulama bağlantısı gönderdik. E-postanızı kontrol edin.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-[#111827] hover:underline underline-offset-4 transition-colors"
          >
            Giriş sayfasına git →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sol panel — marka */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111827] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-12 -right-12 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute top-32 -left-16 w-56 h-56 rounded-full border border-white/10" />
        <div className="absolute top-16 -left-8 w-40 h-40 rounded-full border border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rotate-45 border-2 border-white/80 flex items-center justify-center">
              <div className="w-2 h-2 bg-white/80 rotate-45" />
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">
              Jewelry Virtual
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-white text-2xl font-light leading-relaxed tracking-tight">
              Kuyumcunuz için
              <br />
              <span className="font-semibold">yapay zeka destekli</span>
              <br />
              görsel üretim.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Stüdyo kalitesinde fotoğraflar, cebinize uygun fiyatla.
            </p>
          </div>

          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit.text} className="flex items-center gap-3">
                <span className="text-white/60 text-xs">{benefit.icon}</span>
                <span className="text-white/80 text-sm">{benefit.text}</span>
              </li>
            ))}
          </ul>

          <div className="w-12 h-px bg-white/20" />

          <p className="text-white/40 text-xs leading-relaxed">
            Kredi kartı gerekmez.
            <br />
            İstediğiniz zaman iptal edin.
          </p>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © 2026 Jewelry Virtual. Tüm hakları saklıdır.
        </p>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-7 h-7 rotate-45 border-2 border-[#111827] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#111827] rotate-45" />
            </div>
            <span className="text-[#111827] text-lg font-semibold tracking-tight">
              Jewelry Virtual
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
              Hesap oluşturun
            </h1>
            <p className="text-sm text-[#6B7280]">
              10 ücretsiz krediyle hemen başlayın
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="border border-[#E5E7EB] shadow-none rounded-xl">
              <CardHeader className="pb-0 pt-6 px-6">
                <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">
                  Hesap Bilgileri
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-[#111827]">
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
                    className="h-10 border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] placeholder:text-[#9CA3AF] text-sm rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-[#111827]">
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
                    className="h-10 border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] placeholder:text-[#9CA3AF] text-sm rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-[#111827]">
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
                    className="h-10 border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] placeholder:text-[#9CA3AF] text-sm rounded-lg"
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
                  className="w-full h-10 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium rounded-lg transition-colors mt-2 disabled:opacity-60"
                >
                  {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
                </Button>

                <p className="text-center text-xs text-[#9CA3AF] leading-relaxed">
                  Devam ederek{" "}
                  <span className="underline underline-offset-2 cursor-pointer hover:text-[#6B7280] transition-colors">
                    Kullanım Koşulları
                  </span>
                  &apos;nı kabul etmiş olursunuz.
                </p>
              </CardContent>
            </Card>
          </form>

          <p className="text-center text-sm text-[#6B7280]">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-[#111827] hover:underline underline-offset-4"
            >
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
