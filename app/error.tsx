"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="w-12 h-12 mx-auto bg-red-50 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[#111827]">Bir Sorun Oluştu</h1>
          <p className="text-sm text-[#6B7280]">Beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.</p>
        </div>
        <button
          onClick={reset}
          className="inline-block h-10 px-8 bg-[#111827] hover:bg-black text-white text-[10px] font-medium tracking-[0.15em] uppercase transition-colors cursor-pointer"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
