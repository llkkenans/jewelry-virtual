"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Camera, Coins, Wallet, Layers, Gem, Shirt } from "lucide-react"
import { HealthStatCard } from "@/components/ui/health-stat-card"

interface DailyEntry { date: string; count: number }
interface StatsData {
  jewelry: {
    total: number
    byCategory: { ring: number; necklace: number; earring: number; watch: number }
    daily: DailyEntry[]
  }
  clothing: {
    total: number
    byCategory: { tops: number; bottoms: number; onepiece: number }
    daily: DailyEntry[]
  }
  credits: number
}

const DAY_LABELS: Record<number, string> = { 0: "Paz", 1: "Pzt", 2: "Sal", 3: "Çar", 4: "Per", 5: "Cum", 6: "Cmt" }

const DARK_VARS = {
  "--card": "#111827",
  "--card-foreground": "#ffffff",
  "--muted": "#1f2937",
  "--muted-foreground": "#e5e7eb",
  "--border": "rgba(255,255,255,0.08)",
  "--popover": "#111827",
  "--popover-foreground": "#ffffff",
  "--primary": "#ffffff",
  "--primary-foreground": "#111827",
} as React.CSSProperties

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<7 | 30 | "all">(7)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch('/api/stats', {
          headers: { authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error('Sunucu hatası')
        setData(await res.json())
      } catch {
        setError('İstatistikler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || !data) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <p className="text-white/50 text-sm">{error ?? 'Veri bulunamadı'}</p>
    </div>
  )

  const totalProduced = data.jewelry.total + data.clothing.total

  const getChartData = () => {
    const jDaily = data.jewelry.daily
    const cDaily = data.clothing.daily
    if (range === "all") {
      return jDaily.map((j, i) => ({ date: j.date, j: j.count, c: cDaily[i]?.count ?? 0 }))
    }
    const slice = range === 7 ? -7 : -30
    return jDaily.slice(slice).map((j, i) => ({
      date: j.date,
      j: j.count,
      c: cDaily.slice(slice)[i]?.count ?? 0,
    }))
  }

  const chartData = getChartData()
  const maxVal = Math.max(...chartData.map(d => d.j + d.c), 1)

  const jMax = Math.max(
    data.jewelry.byCategory.ring,
    data.jewelry.byCategory.necklace,
    data.jewelry.byCategory.earring,
    data.jewelry.byCategory.watch,
    1
  )
  const cMax = Math.max(
    data.clothing.byCategory.tops,
    data.clothing.byCategory.bottoms,
    data.clothing.byCategory.onepiece,
    1
  )

  return (
    <div className="dark min-h-screen bg-[#0A0A0A] px-4 py-8 lg:px-0 lg:py-10" style={DARK_VARS}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Başlık */}
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Kullanım Özeti</h1>
          <p className="text-[11px] uppercase tracking-widest text-white/50 mt-1">Son 30 Gün</p>
        </div>

        {/* 4 Stat Kartı */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DarkStatCard icon={<Camera size={14} strokeWidth={1.5} />} value={String(totalProduced)} label="Toplam Üretim" />
          <DarkStatCard icon={<Coins size={14} strokeWidth={1.5} />} value={String(totalProduced)} label="Harcanan Kredi" />
          <DarkStatCard icon={<Wallet size={14} strokeWidth={1.5} />} value={String(data.credits)} label="Kalan Kredi" />
          <DarkStatCard icon={<Layers size={14} strokeWidth={1.5} />} value={`${data.jewelry.total}/${data.clothing.total}`} label="Takı / Kıyafet" />
        </div>

        {/* Günlük Üretim Chart */}
        <div className="bg-[#111827] rounded-xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-white">Günlük Üretim</h2>
            <div className="flex items-center gap-1">
              {([7, 30, "all"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-full text-[10px] tracking-wide transition-colors cursor-pointer ${
                    range === r
                      ? "bg-white text-[#0A0A0A]"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {r === "all" ? "Tümü" : `${r} Gün`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-1 h-24 overflow-x-auto pb-1">
            {chartData.map((d, i) => {
              const jH = Math.round((d.j / maxVal) * 80)
              const cH = Math.round((d.c / maxVal) * 80)
              const dayLabel = DAY_LABELS[new Date(d.date + 'T00:00:00').getDay()]
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-[18px]">
                  <div className="flex flex-col justify-end w-full gap-0.5" style={{ height: 80 }}>
                    {d.j > 0 && (
                      <div className="w-full rounded-t-sm bg-white/80" style={{ height: jH }} title={`Takı: ${d.j}`} />
                    )}
                    {d.c > 0 && (
                      <div className="w-full rounded-t-sm bg-white/35" style={{ height: cH }} title={`Kıyafet: ${d.c}`} />
                    )}
                    {d.j === 0 && d.c === 0 && (
                      <div className="w-full rounded-t-sm bg-white/5" style={{ height: 4 }} />
                    )}
                  </div>
                  {chartData.length <= 14 && (
                    <span className="text-[8px] text-white/50 leading-none">{dayLabel}</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-white/80" />
              <span className="text-[10px] text-white">Takı</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-white/35" />
              <span className="text-[10px] text-white">Kıyafet</span>
            </div>
          </div>
        </div>

        {/* Kategori HealthStatCards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HealthStatCard
            headerIcon={<Gem size={16} strokeWidth={1.5} />}
            title="Takı Kategorileri"
            stats={[
              { title: "Toplam", value: data.jewelry.total },
              { title: "Yüzük", value: data.jewelry.byCategory.ring },
              { title: "Kolye", value: data.jewelry.byCategory.necklace },
            ]}
            graphData={[
              { label: "Yüzük", value: Math.round((data.jewelry.byCategory.ring / jMax) * 100), color: "#60A5FA", description: `${data.jewelry.byCategory.ring} üretim` },
              { label: "Kolye", value: Math.round((data.jewelry.byCategory.necklace / jMax) * 100), color: "#34D399", description: `${data.jewelry.byCategory.necklace} üretim` },
              { label: "Küpe",  value: Math.round((data.jewelry.byCategory.earring / jMax) * 100),  color: "#FBBF24", description: `${data.jewelry.byCategory.earring} üretim` },
              { label: "Saat",  value: Math.round((data.jewelry.byCategory.watch / jMax) * 100),    color: "#F87171", description: `${data.jewelry.byCategory.watch} üretim` },
            ]}
            graphHeight={70}
            legendTitle="Kategori Dağılımı"
            legendFormat={(item) => item.label}
            className="max-w-none"
          />

          <HealthStatCard
            headerIcon={<Shirt size={16} strokeWidth={1.5} />}
            title="Kıyafet Kategorileri"
            stats={[
              { title: "Toplam", value: data.clothing.total },
              { title: "Üst",    value: data.clothing.byCategory.tops },
              { title: "Alt",    value: data.clothing.byCategory.bottoms },
            ]}
            graphData={[
              { label: "Üst Giyim", value: Math.round((data.clothing.byCategory.tops / cMax) * 100),      color: "#A78BFA", description: `${data.clothing.byCategory.tops} üretim` },
              { label: "Alt Giyim", value: Math.round((data.clothing.byCategory.bottoms / cMax) * 100),   color: "#22D3EE", description: `${data.clothing.byCategory.bottoms} üretim` },
              { label: "Tek Parça", value: Math.round((data.clothing.byCategory.onepiece / cMax) * 100),  color: "#FB923C", description: `${data.clothing.byCategory.onepiece} üretim` },
            ]}
            graphHeight={70}
            legendTitle="Kategori Dağılımı"
            legendFormat={(item) => item.label}
            className="max-w-none"
          />
        </div>

        {/* ROI Banner */}
        <div className="bg-[#111827] rounded-xl border border-white/5 p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Bu ay tasarrufunuz</p>
            <p className="text-white text-sm mt-1">
              {totalProduced} üretim × ortalama stüdyo çekimi
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-2xl font-semibold text-white">
              ~{(totalProduced * 300).toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function DarkStatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-[#111827] rounded-xl border border-white/5 p-4 flex flex-col gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-[9px] uppercase tracking-widest text-white/50 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="dark min-h-screen bg-[#0A0A0A] px-4 py-8 lg:px-0 lg:py-10">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="animate-pulse">
          <div className="h-7 w-48 bg-white/5 rounded mb-2" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#111827] rounded-xl border border-white/5 p-4 animate-pulse">
              <div className="w-8 h-8 bg-white/5 rounded-lg mb-3" />
              <div className="h-6 w-16 bg-white/5 rounded mb-1" />
              <div className="h-2 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-[#111827] rounded-xl border border-white/5 p-5 animate-pulse h-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#111827] rounded-xl border border-white/5 p-5 animate-pulse h-52" />
          <div className="bg-[#111827] rounded-xl border border-white/5 p-5 animate-pulse h-52" />
        </div>
        <div className="bg-[#111827] rounded-xl border border-white/5 h-20 animate-pulse" />
      </div>
    </div>
  )
}
