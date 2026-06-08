"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { LogOut, Images, Upload } from "lucide-react"

const SERIF = "'Cormorant Garant', Georgia, serif"

const navItems = [
  { href: "/upload", label: "Üret",  icon: Upload },
  { href: "/gallery", label: "Galeri", icon: Images },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router   = useRouter()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/login"); return }

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
    <div className="min-h-screen" style={{ backgroundColor: "#F8F6F2" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: "rgba(248,246,242,0.92)",
          borderColor: "#E5DFD5",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/upload" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-5 h-5 rotate-45 flex items-center justify-center"
              style={{ border: "1px solid rgba(201,169,110,0.55)" }}
            >
              <div
                className="w-1 h-1 rotate-45"
                style={{ backgroundColor: "rgba(201,169,110,0.55)" }}
              />
            </div>
            <span
              style={{ fontFamily: SERIF }}
              className="text-[#1C1C1C] text-base tracking-[0.18em] uppercase font-light hidden sm:block"
            >
              Jewelry Virtual
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer relative"
                  style={{
                    color: active ? "#1C1C1C" : "#B0A090",
                    backgroundColor: active ? "rgba(201,169,110,0.1)" : "transparent",
                  }}
                >
                  <Icon size={13} style={{ color: active ? "#C9A96E" : "#C4B9AC" }} />
                  <span
                    style={{
                      fontFamily: active ? SERIF : undefined,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    {label}
                  </span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-px"
                      style={{ backgroundColor: "#C9A96E", opacity: 0.5 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sağ: kredi + çıkış */}
          <div className="flex items-center gap-3">

            {/* Kredi */}
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ border: "1px solid #E5DFD5", backgroundColor: "rgba(201,169,110,0.07)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C9A96E" }} />
              {loading ? (
                <Skeleton className="h-3 w-10 rounded" />
              ) : (
                <span
                  className="tabular-nums"
                  style={{ fontSize: "10px", letterSpacing: "0.18em", color: "#8A7060", fontWeight: 500 }}
                >
                  {credits} KREDİ
                </span>
              )}
            </div>

            {/* Ayraç */}
            <div className="h-4 w-px" style={{ backgroundColor: "#E5DFD5" }} />

            {/* Çıkış */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 transition-colors cursor-pointer p-1.5 rounded-lg"
              style={{ color: "#C4B9AC" }}
              aria-label="Çıkış yap"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1C1C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#C4B9AC")}
            >
              <LogOut size={14} />
              <span
                className="hidden sm:block"
                style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                Çıkış
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* İçerik */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        {children}
      </main>
    </div>
  )
}
