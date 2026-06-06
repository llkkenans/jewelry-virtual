"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/upload")
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sol panel — marka */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111827] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-full border border-white/10" />
        <div className="absolute bottom-16 -left-8 w-40 h-40 rounded-full border border-white/5" />

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

        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-4">
            <p className="text-white/90 text-2xl font-light leading-relaxed tracking-tight">
              &quot;Takı fotoğraflarınızı saniyeler içinde gerçekçi model fotoğraflarına dönüştürün.&quot;
            </p>
            <footer className="space-y-1">
              <p className="text-white/60 text-sm">Pahalı stüdyo çekimi gerekmez.</p>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/40" />
              </div>
            </footer>
          </blockquote>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: "10", label: "Ücretsiz kredi" },
              { value: "30s", label: "Ortalama süre" },
              { value: "4", label: "Konsept stili" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-white text-xl font-semibold">{stat.value}</p>
                <p className="text-white/50 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
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
              Tekrar hoş geldiniz
            </h1>
            <p className="text-sm text-[#6B7280]">
              Hesabınıza giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="border border-[#E5E7EB] shadow-none rounded-xl">
              <CardHeader className="pb-0 pt-6 px-6">
                <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">
                  Giriş Bilgileri
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-[#111827]">
                      Şifre
                    </Label>
                    <button
                      type="button"
                      className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      Şifremi unuttum
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </CardContent>
            </Card>
          </form>

          <p className="text-center text-sm text-[#6B7280]">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="font-medium text-[#111827] hover:underline underline-offset-4"
            >
              Ücretsiz başlayın
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
