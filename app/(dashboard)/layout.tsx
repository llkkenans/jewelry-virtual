"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { LogOut, Images, Upload } from "lucide-react"

const navItems = [
  { href: "/upload", label: "Üret", icon: Upload },
  { href: "/gallery", label: "Galeri", icon: Images },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single()

      setCredits(data?.credits ?? 0)
      setLoading(false)
    }

    loadUser()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/upload" className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rotate-45 border-2 border-[#111827] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#111827] rotate-45" />
            </div>
            <span className="text-[#111827] text-sm font-bold tracking-wide hidden sm:block" style={{ fontFamily: "'Audrey', Georgia, serif" }}>
              Jewelry Virtual
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-[#111827] text-white"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sağ: kredi + çıkış */}
          <div className="flex items-center gap-3">
            {/* Kredi göstergesi */}
            <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
              {loading ? (
                <Skeleton className="h-3.5 w-8 rounded" />
              ) : (
                <span className="text-xs font-semibold text-[#111827] tabular-nums">
                  {credits} Kredi
                </span>
              )}
            </div>

            <Separator orientation="vertical" className="h-5" />

            {/* Çıkış */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer p-1.5 rounded-xl hover:bg-[#F9FAFB]"
              aria-label="Çıkış yap"
            >
              <LogOut size={15} />
              <span className="text-sm hidden sm:block">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sayfa içeriği */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
