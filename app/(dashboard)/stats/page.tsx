"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Camera, Coins, Wallet, Diamond } from "lucide-react"

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
    <div className="text-center py-20 text-[#9CA3AF] text-sm">{error ?? 'Veri bulunamadı'}</div>
  )

  const totalProduced = data.jewelry.total + data.clothing.total

  // Chart data
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

  // Category breakdowns
  const jCategories: { label: string; count: number }[] = [
    { label: "Yüzük", count: data.jewelry.byCategory.ring },
    { label: "Kolye", count: data.jewelry.byCategory.necklace },
    { label: "Küpe", count: data.jewelry.byCategory.earring },
    { label: "Saat", count: data.jewelry.byCategory.watch },
  ]
  const cCategories: { label: string; count: number }[] = [
    { label: "Üst Giyim", count: data.clothing.byCategory.tops },
    { label: "Alt Giyim", count: data.clothing.byCategory.bottoms },
    { label: "Tek Parça", count: data.clothing.byCategory.onepiece },
  ]
  const jMax = Math.max(...jCategories.map(c => c.count), 1)
  const cMax = Math.max(...cCategories.map(c => c.count), 1)

  return (
    <div className="min-h-screen bg-[#F8F6F2] px-4 py-8 lg:px-0 lg:py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Başlık */}
        <div>
          <h1 className="font-cormorant text-2xl font-semibold text-[#111827]">Kullanım Özeti</h1>
          <p className="text-[11px] uppercase tracking-widest text-[#9CA3AF] mt-1">Son 30 Gün</p>
        </div>

        {/* 4 Stat Kartı */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            iconBg="bg-[#FDF6EC]"
            iconColor="text-[#C9A96E]"
            Icon={Camera}
            value={String(totalProduced)}
            label="TOPLAM ÜRETİM"
          />
          <StatCard
            iconBg="bg-[#F0F7ED]"
            iconColor="text-green-700"
            Icon={Coins}
            value={String(totalProduced)}
            label="HARCANAN KREDİ"
          />
          <StatCard
            iconBg="bg-[#EEF4FB]"
            iconColor="text-blue-700"
            Icon={Wallet}
            value={String(data.credits)}
            label="KALAN KREDİ"
          />
          <StatCard
            iconBg="bg-[#FDF6EC]"
            iconColor="text-[#C9A96E]"
            Icon={Diamond}
            value={`${data.jewelry.total} / ${data.clothing.total}`}
            label="TAKI / KİYAFET"
          />
        </div>

        {/* Günlük Üretim Chart */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#111827]">Günlük üretim</h2>
            <div className="flex items-center gap-1">
              {([7, 30, "all"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-full text-[10px] tracking-wide transition-colors cursor-pointer ${
                    range === r
                      ? "bg-[#111827] text-white"
                      : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
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
                      <div
                        className="w-full rounded-t-sm bg-[#C9A96E]"
                        style={{ height: jH }}
                        title={`Takı: ${d.j}`}
                      />
                    )}
                    {d.c > 0 && (
                      <div
                        className="w-full rounded-t-sm bg-[#111827]"
                        style={{ height: cH }}
                        title={`Kıyafet: ${d.c}`}
                      />
                    )}
                    {d.j === 0 && d.c === 0 && (
                      <div className="w-full rounded-t-sm bg-[#F3F4F6]" style={{ height: 4 }} />
                    )}
                  </div>
                  {chartData.length <= 14 && (
                    <span className="text-[8px] text-[#9CA3AF] leading-none">{dayLabel}</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#C9A96E]" />
              <span className="text-[10px] text-[#6B7280]">Takı</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#111827]" />
              <span className="text-[10px] text-[#6B7280]">Kıyafet</span>
            </div>
          </div>
        </div>

        {/* Kategori Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#111827] mb-4">Takı kategorileri</h2>
            <div className="space-y-3">
              {jCategories.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#6B7280] w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C9A96E] rounded-full transition-all"
                      style={{ width: `${(count / jMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#111827] font-medium w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#111827] mb-4">Kıyafet kategorileri</h2>
            <div className="space-y-3">
              {cCategories.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#6B7280] w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#111827] rounded-full transition-all"
                      style={{ width: `${(count / cMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#111827] font-medium w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROI Banner */}
        <div className="bg-[#111827] rounded-lg p-6 flex items-center justify-between border-t-2 border-[#C9A96E]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF]">Bu ay tasarrufunuz</p>
            <p className="text-white text-sm mt-1">
              {totalProduced} üretim × ortalama stüdyo çekimi
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="font-cormorant text-2xl font-semibold text-[#C9A96E]">
              ~{(totalProduced * 300).toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({
  iconBg,
  iconColor,
  Icon,
  value,
  label,
}: {
  iconBg: string
  iconColor: string
  Icon: React.ElementType
  value: string
  label: string
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex flex-col gap-3">
      <div className={`w-8 h-8 rounded-md ${iconBg} ${iconColor} flex items-center justify-center`}>
        <Icon size={15} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-cormorant text-3xl font-semibold text-[#111827]">{value}</p>
        <p className="text-[9px] uppercase tracking-widest text-[#9CA3AF] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] px-4 py-8 lg:px-0 lg:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-7 w-48 bg-[#E5E7EB] rounded mb-2" />
          <div className="h-3 w-24 bg-[#E5E7EB] rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 animate-pulse">
              <div className="w-8 h-8 bg-[#E5E7EB] rounded-md mb-3" />
              <div className="h-6 w-16 bg-[#E5E7EB] rounded mb-1" />
              <div className="h-2 w-20 bg-[#E5E7EB] rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 animate-pulse h-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 animate-pulse h-40" />
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 animate-pulse h-40" />
        </div>
        <div className="bg-[#E5E7EB] rounded-lg h-20 animate-pulse" />
      </div>
    </div>
  )
}
