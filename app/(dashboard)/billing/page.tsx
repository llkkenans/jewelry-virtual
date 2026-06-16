"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "starter",
    label: "Starter",
    price: "$9",
    credits: 50,
    slogan: "Başlamak için ideal",
    features: [
      "50 profesyonel görsel",
      "Tüm takı tipleri",
      "E-ticarete hazır çıktı",
      "Yüksek çözünürlük indirme",
    ],
    cta: "Başla",
    note: "Yeni başlayan küçük kuyumcular için.",
    highlight: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  },
  {
    id: "growth",
    label: "Growth",
    price: "$24",
    credits: 150,
    slogan: "En çok tercih edilen",
    features: [
      "150 profesyonel görsel",
      "Tüm model ve sahne seçenekleri",
      "Yüksek çözünürlük indirme",
      "Öncelikli üretim hızı",
    ],
    cta: "Hemen Al",
    note: "Düzenli görsel üreten kuyumcular için.",
    highlight: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
  },
  {
    id: "pro",
    label: "Pro",
    price: "$49",
    credits: 400,
    slogan: "Yüksek hacim için güç",
    features: [
      "400 profesyonel görsel",
      "Öncelikli üretim hızı",
      "Toplu yükleme desteği",
      "Tüm gelişmiş özellikler",
    ],
    cta: "Yükselt",
    note: "Geniş katalog yöneten işletmeler için.",
    highlight: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
]

const FAQ = [
  {
    q: "Kredi nasıl çalışır?",
    a: "Her görsel üretimi bir kredi harcar. Krediniz bitene kadar dilediğiniz kadar üretebilirsiniz.",
  },
  {
    q: "Görsel kalitesi nasıl?",
    a: "Tüm görseller stüdyo kalitesinde, yüksek çözünürlüklü ve e-ticarete hazır olarak üretilir.",
  },
  {
    q: "İptal edebilir miyim?",
    a: "Kredi paketleri tek seferlik alımdır. Aboneliğiniz olmadığı için iptal etmenize gerek yoktur.",
  },
]

export default function BillingPage() {
  const [credits, setCredits]   = useState<number | null>(null)
  const [loading, setLoading]   = useState(true)
  const [buying, setBuying]     = useState<string | null>(null)
  const [openFaq, setOpenFaq]   = useState<number | null>(null)

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
    <div className="max-w-3xl mx-auto space-y-16 py-4">

      {/* Başlık */}
      <div>
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">
          Kredi & Plan
        </p>
        <h1 className="text-2xl font-light tracking-wide text-[#111827]">
          Size Uygun Paketi Seçin
        </h1>
        <div className="w-8 h-px bg-[#111827] mt-3 mb-3" />
        <p className="text-sm font-light text-[#6B7280]">
          Her üretim bir kredi. İhtiyacınız kadar alın, dilediğiniz zaman yükseltin.
        </p>
        {!loading && credits !== null && (
          <p className="text-xs text-[#9CA3AF] mt-2 font-light">
            Mevcut bakiye:{" "}
            <span className="text-[#111827] font-medium">{credits} kredi</span>
          </p>
        )}
      </div>

      {/* Paketler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E5E7EB]">
        {PLANS.map(({ id, label, price, credits: cr, slogan, features, cta, note, highlight }) => (
          <div
            key={id}
            className={`relative bg-white p-6 flex flex-col gap-6 ${
              highlight ? "bg-[#111827]" : "bg-white"
            }`}
          >
            {/* Popüler badge */}
            {highlight && (
              <div className="absolute top-4 right-4">
                <span className="text-[9px] tracking-[0.2em] uppercase font-medium text-white/50">
                  En Popüler
                </span>
              </div>
            )}

            {/* Paket ismi */}
            <div>
              <p className={`text-[10px] tracking-[0.2em] uppercase font-medium mb-2 ${
                highlight ? "text-white/40" : "text-[#9CA3AF]"
              }`}>
                {slogan}
              </p>
              <p className={`text-xl font-light tracking-wide ${
                highlight ? "text-white" : "text-[#111827]"
              }`}>
                {label}
              </p>
            </div>

            {/* Fiyat */}
            <div>
              <p className={`text-3xl font-light tracking-tight ${
                highlight ? "text-white" : "text-[#111827]"
              }`}>
                {price}
              </p>
              <p className={`text-[11px] mt-1 font-light ${
                highlight ? "text-white/40" : "text-[#9CA3AF]"
              }`}>
                {cr} kredi
              </p>
            </div>

            {/* Özellikler */}
            <div className="space-y-2.5 flex-1">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check
                    size={11}
                    strokeWidth={2}
                    className={`mt-0.5 shrink-0 ${
                      highlight ? "text-white/60" : "text-[#111827]"
                    }`}
                  />
                  <span className={`text-[12px] font-light leading-relaxed ${
                    highlight ? "text-white/70" : "text-[#6B7280]"
                  }`}>
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <button
                onClick={() => handleBuy(id)}
                disabled={buying === id}
                className={`w-full h-10 text-[11px] tracking-[0.15em] uppercase font-medium
                  transition-all cursor-pointer disabled:opacity-40 ${
                  highlight
                    ? "bg-white text-[#111827] hover:bg-white/90"
                    : "bg-[#111827] text-white hover:bg-black"
                }`}
              >
                {buying === id ? "Yönlendiriliyor..." : cta}
              </button>
              <p className={`text-[10px] font-light text-center ${
                highlight ? "text-white/30" : "text-[#D1D5DB]"
              }`}>
                {note}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Güvenli ödeme */}
      <p className="text-[10px] tracking-[0.1em] text-[#9CA3AF] text-center font-light uppercase">
        Güvenli ödeme · Stripe ile işleniyor · Kredi kartı bilgileriniz saklanmaz
      </p>

      {/* SSS */}
      <div>
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#9CA3AF] mb-1">
          Sıkça Sorulan
        </p>
        <h2 className="text-xl font-light tracking-wide text-[#111827] mb-2">
          Sorular
        </h2>
        <div className="w-6 h-px bg-[#111827] mb-8" />

        <div className="divide-y divide-[#E5E7EB]">
          {FAQ.map(({ q, a }, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-4
                  text-left cursor-pointer group"
              >
                <span className="text-[12px] tracking-[0.05em] font-light text-[#111827]
                  group-hover:text-[#6B7280] transition-colors">
                  {q}
                </span>
                {openFaq === i
                  ? <ChevronUp size={13} strokeWidth={1.5} className="text-[#9CA3AF] shrink-0" />
                  : <ChevronDown size={13} strokeWidth={1.5} className="text-[#9CA3AF] shrink-0" />
                }
              </button>
              {openFaq === i && (
                <p className="text-[12px] font-light text-[#6B7280] leading-relaxed pb-4">
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alt CTA */}
      <div className="border border-[#E5E7EB] p-8 text-center space-y-4">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#9CA3AF] font-light">
          Lunia Studio
        </p>
        <h3 className="text-xl font-light tracking-wide text-[#111827]">
          İlk Görselinizi Bugün Üretin
        </h3>
        <div className="w-6 h-px bg-[#111827] mx-auto" />
        <p className="text-[12px] font-light text-[#6B7280]">
          Kredi kartı gerekmez. Birkaç dakikada kaydolun, hemen başlayın.
        </p>
        <Link href="/register">
          <button className="mt-2 h-10 px-8 bg-[#111827] text-white text-[11px]
            tracking-[0.15em] uppercase font-medium hover:bg-black
            transition-colors cursor-pointer">
            Ücretsiz Dene
          </button>
        </Link>
      </div>

    </div>
  )
}
