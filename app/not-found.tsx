import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <p className="text-[80px] font-light text-[#E5E7EB] leading-none">404</p>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[#111827]">Sayfa Bulunamadı</h1>
          <p className="text-sm text-[#6B7280]">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        </div>
        <Link
          href="/"
          className="inline-block h-10 px-8 leading-10 bg-[#111827] hover:bg-black text-white text-[10px] font-medium tracking-[0.15em] uppercase transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
