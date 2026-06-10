"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, TrendingUp } from "lucide-react"

const SERIF = "'Cormorant Garamond', Georgia, serif"

const PLANS = [
  {
    id: "starter",
    label: "Starter",
    price: "$9",
    credits: 50,
    icon: Zap,
    desc: "Küçük koleksiyonlar için",
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  },
  {
    id: "growth",
    label: "Growth",
    price: "$24",
    credits: 150,
    icon: TrendingUp,
    desc: "Büyüyen işletmeler için",
    highlight: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
  },
  {
    id: "pro",
    label: "Pro",
    price: "$49",
    credits: 400,
    icon: Sparkles,
    desc: "Yüksek hacimli üretim",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
]

export default function BillingPage() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single()
      setCredits(data?.credits ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  async function handleBuy(planId: string) {
    setBuying(planId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ planId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Kredi Satın Al</h1>
        <p className="text-sm text-[#6B7280] mt-1.5">
          Mevcut bakiye:{" "}
          {loading ? "..." : (
            <span className="font-semibold text-[#111827]">{credits} kredi</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PLANS.map(({ id, label, price, credits: cr, icon: Icon, desc, highlight }) => (
          <div
            key={id}
            className={`relative rounded-2xl border bg-white p-6 flex flex-col gap-5 transition-shadow hover:shadow-sm ${
              highlight ? "border-[#111827] shadow-sm" : "border-[#E5E7EB]"
            }`}
          >
            {highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#111827] text-white text-[10px] font-medium tracking-widest uppercase px-3 py-1 rounded-full">
                  Popüler
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                <Icon size={16} className="text-[#111827]" />
              </div>
              <div>
                <p style={{ fontFamily: SERIF }} className="text-lg font-light text-[#111827] leading-tight">
                  {label}
                </p>
                <p className="text-xs text-[#9CA3AF]">{desc}</p>
              </div>
            </div>

            <div>
              <p className="text-3xl font-semibold text-[#111827] tracking-tight">{price}</p>
              <p className="text-sm text-[#6B7280] mt-0.5">{cr} kredi</p>
            </div>

            <Button
              onClick={() => handleBuy(id)}
              disabled={buying === id}
              className={`w-full h-10 rounded-xl text-sm font-medium transition-colors cursor-pointer mt-auto ${
                highlight
                  ? "bg-[#111827] hover:bg-[#1F2937] text-white"
                  : "bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB]"
              }`}
            >
              {buying === id ? "Yönlendiriliyor..." : "Satın Al"}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#9CA3AF] text-center">
        Güvenli ödeme · Stripe ile işleniyor · Kredi kartı bilgileriniz saklanmaz
      </p>
    </div>
  )
}
