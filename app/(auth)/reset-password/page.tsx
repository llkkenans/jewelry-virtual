"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via reset link
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.")
      return
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError("Şifre güncellenemedi. Lütfen tekrar deneyin.")
    } else {
      setSuccess(true)
      setTimeout(() => router.push("/upload"), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Yeni Şifre Belirle</h1>
          <p className="text-sm text-[#6B7280]">Yeni şifrenizi girin.</p>
        </div>

        {success ? (
          <div className="text-center space-y-2">
            <p className="text-sm text-[#C9A96E] font-medium">Şifreniz güncellendi! Yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Yeni şifre"
              required
              className="w-full h-11 px-4 border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] transition-colors"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Yeni şifre tekrar"
              required
              className="w-full h-11 px-4 border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] transition-colors"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#111827] hover:bg-black text-white text-xs font-medium tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
            >
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
