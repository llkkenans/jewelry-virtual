"use client"

import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckIcon } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const DISPLAY = "'DM Sans', sans-serif"
const BODY = "'Inter', sans-serif"

type Plan = {
  id: string
  title: string
  desc: string
  credits: number
  price: number
  pricePerCredit: string
  badge?: string
  ctaLabel: string
  features: string[]
  href: string
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: "starter",
    title: "Starter",
    desc: "Küçük koleksiyonlar ve ilk denemeler için ideal başlangıç paketi.",
    credits: 50,
    price: 9,
    pricePerCredit: "0,18",
    ctaLabel: "Satın Al",
    features: [
      "50 AI görsel üretimi",
      "Takı & kıyafet stüdyosu",
      "HD çıktı kalitesi",
      "Galeri & indirme",
      "E-posta desteği",
    ],
    href: "/dashboard/billing",
  },
  {
    id: "growth",
    title: "Growth",
    desc: "Büyüyen kataloglar ve düzenli üretim ihtiyacı olan markalar için.",
    credits: 150,
    price: 24,
    pricePerCredit: "0,16",
    badge: "En Popüler",
    ctaLabel: "Satın Al",
    features: [
      "150 AI görsel üretimi",
      "Takı & kıyafet stüdyosu",
      "HD çıktı kalitesi",
      "Galeri & indirme",
      "Koleksiyon yönetimi",
      "Öncelikli destek",
    ],
    href: "/dashboard/billing",
    highlight: true,
  },
  {
    id: "pro",
    title: "Pro",
    desc: "Yoğun sezon ve büyük kataloglar için profesyonel güç.",
    credits: 400,
    price: 49,
    pricePerCredit: "0,12",
    ctaLabel: "Satın Al",
    features: [
      "400 AI görsel üretimi",
      "Takı & kıyafet stüdyosu",
      "HD çıktı kalitesi",
      "Galeri & indirme",
      "Koleksiyon yönetimi",
      "Toplu indirme (ZIP)",
      "Öncelikli destek",
    ],
    href: "/dashboard/billing",
  },
]

function PlanCard({ plan, visible }: { plan: Plan; visible: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-none border transition-all duration-300 overflow-hidden bg-white",
        plan.highlight
          ? "border-[#111827]"
          : "border-[#E5E7EB]"
      )}
    >
      {/* Badge */}
      <div className="px-6 pt-6 pb-0 flex items-start justify-between">
        <span
          style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.2em" }}
          className="uppercase text-[#6B7280] font-medium tracking-widest"
        >
          {plan.title}
        </span>
        {plan.badge && (
          <span
            style={{ fontFamily: BODY, fontSize: "9px", letterSpacing: "0.15em" }}
            className="uppercase bg-[#111827] text-white font-semibold px-2.5 py-1"
          >
            {plan.badge}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="px-6 pt-4 pb-5 border-b border-[#E5E7EB]">
        <div className="flex items-end gap-1.5 mb-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${plan.id}-${visible}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <span
                style={{ fontFamily: DISPLAY }}
                className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-[#111827]"
              >
                <NumberFlow
                  value={plan.price}
                  format={{
                    style: "currency",
                    currency: "USD",
                    currencyDisplay: "narrowSymbol",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }}
                />
              </span>
            </motion.div>
          </AnimatePresence>
          <span
            style={{ fontFamily: BODY, fontSize: "12px" }}
            className="text-[#6B7280] mb-2 font-light"
          >
            / {plan.credits} kredi
          </span>
        </div>
        <p
          style={{ fontFamily: BODY, fontSize: "12px", letterSpacing: "0.01em" }}
          className="text-[#6B7280] font-light leading-[1.65]"
        >
          {plan.desc}
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pt-5">
        <Link href={plan.href}>
          <button
            className={cn(
              "w-full h-11 text-[12px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer",
              plan.highlight
                ? "bg-[#111827] text-white hover:bg-[#111827]/90"
                : "bg-transparent border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
            )}
            style={{ fontFamily: BODY }}
          >
            {plan.ctaLabel}
          </button>
        </Link>
        <p
          style={{ fontFamily: BODY, fontSize: "10px", letterSpacing: "0.06em" }}
          className="text-center text-[#6B7280] mt-2.5 mb-1 font-light"
        >
          ≈ {plan.pricePerCredit} ₺/görsel
        </p>
      </div>

      {/* Features */}
      <div className="px-6 py-5 flex flex-col gap-3">
        {plan.features.map((feat, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CheckIcon
              size={13}
              strokeWidth={2.5}
              className="text-[#111827] mt-0.5 shrink-0"
            />
            <span
              style={{ fontFamily: BODY, fontSize: "13px", letterSpacing: "0.01em" }}
              className="text-[#111827] font-light"
            >
              {feat}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PricingSection() {
  const [revealed, setRevealed] = useState(false)

  return (
    <section className="relative bg-[#EFEEEA] py-28 sm:py-36 overflow-hidden">

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="mb-16 sm:mb-20">
          <p
            style={{ fontFamily: BODY }}
            className="text-[11px] tracking-[0.28em] uppercase font-medium mb-5 text-[#6B7280]"
          >
            Fiyatlandırma
          </p>
          <h2
            style={{ fontFamily: DISPLAY }}
            className="text-[2.4rem] sm:text-[3.4rem] font-extrabold tracking-[-0.035em] text-[#111827] leading-[1.0] mb-6 max-w-xl"
          >
            Kredi Paketleri
            <br />
            <em className="not-italic font-light text-[#C4C0B8]" style={{ fontFamily: DISPLAY }}>
              Tek Seferlik Ödeme.
            </em>
          </h2>
          <p
            style={{ fontFamily: BODY, fontSize: "14px" }}
            className="text-[#6B7280] font-light max-w-sm leading-[1.75]"
          >
            Abonelik yok, gizli ücret yok. İhtiyacınız kadar kredi satın alın, istediğiniz zaman kullanın.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-[#E5E7EB]">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} visible={revealed} />
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{ fontFamily: BODY, fontSize: "11px", letterSpacing: "0.08em" }}
          className="text-center text-[#6B7280] mt-8 font-light"
        >
          Tüm paketler tek seferlik satın alım · Krediler hesabınıza anında yüklenir · KDV dahil değildir
        </p>
      </div>
    </section>
  )
}
