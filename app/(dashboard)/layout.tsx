"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { LogOut } from "lucide-react"
import { ToastProvider } from "@/components/ui/toast"

const navItems = [
  { href: "/upload",  label: "Üret" },
  { href: "/gallery", label: "Galeri" },
  { href: "/billing", label: "Kredi" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchCredits() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/profile', {
      headers: { authorization: `Bearer ${session.access_token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setCredits(data.credits ?? 0)
    }
  }

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/login"); return }
      const { data } = await supabase
        .from("profiles").select("credits").eq("id", session.user.id).single()
      setCredits(data?.credits ?? 0)
      setLoading(false)
    }
    loadUser()
  }, [router])

  useEffect(() => {
    function refresh() { fetchCredits() }
    window.addEventListener('credits-updated', refresh)
    return () => window.removeEventListener('credits-updated', refresh)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── MOBİL HEADER ── */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-[#E5E7EB] bg-white sticky top-0 z-30">
        <Link href="/upload" className="flex items-center gap-2">
          <div className="w-4 h-4 rotate-45 border border-[#111827]" />
          <span className="text-[#111827] text-[10px] font-light tracking-[0.25em] uppercase">Lunia Studio</span>
        </Link>
        <div className="flex items-center gap-4">
          {credits !== null && (
            <span className="text-xs text-[#6B7280]">{credits} Kredi</span>
          )}
        </div>
      </div>

      {/* ── MOBİL NAV ── */}
      <nav className="lg:hidden flex items-center justify-around border-b border-[#E5E7EB] bg-white sticky top-14 z-20">
        {navItems.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`relative py-3 text-[10px] tracking-[0.15em] uppercase font-light transition-colors ${
                active ? "text-[#111827]" : "text-[#9CA3AF]"
              }`}
            >
              {label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-px bg-[#111827]" />}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="py-3 text-[10px] tracking-[0.15em] uppercase font-light text-[#9CA3AF] cursor-pointer"
        >
          Çıkış
        </button>
      </nav>

      {/* ── DESKTOP HEADER ── */}
      <header className="hidden lg:block bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/upload" className="flex items-center gap-3 shrink-0">
            <div className="w-5 h-5 rotate-45 border border-[#111827]" />
            <span className="text-[#111827] text-[11px] font-light tracking-[0.25em] uppercase">
              Lunia Studio
            </span>
          </Link>

          {/* Nav — ortada */}
          <nav className="flex items-center gap-8">
            {navItems.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative text-[11px] tracking-[0.15em] uppercase font-light
                    transition-colors pb-0.5 ${
                    active
                      ? "text-[#111827]"
                      : "text-[#9CA3AF] hover:text-[#111827]"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute -bottom-px left-0 right-0 h-px bg-[#111827]" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sağ: kredi + çıkış */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#111827]" />
              {loading ? (
                <Skeleton className="h-3 w-12 rounded" />
              ) : (
                <span className="text-[11px] tracking-[0.1em] text-[#111827] font-light">
                  {credits} Kredi
                </span>
              )}
            </div>

            <div className="w-px h-4 bg-[#E5E7EB]" />

            <button
              onClick={handleSignOut}
              className="text-[11px] tracking-[0.1em] text-[#9CA3AF]
                hover:text-[#111827] transition-colors font-light uppercase
                flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={12} strokeWidth={1.5} />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  )
}
