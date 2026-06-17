import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/" className="text-xs text-[#6B7280] hover:text-[#111827]">← Ana Sayfa</Link>
        <h1 className="text-2xl font-semibold text-[#111827]">Kullanım Koşulları</h1>
        <div className="space-y-6 text-sm text-[#4B5563] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">1. Hizmet Tanımı</h2>
            <p>Jewelry Virtual Studio ("Platform"), kullanıcıların takı görsellerini yapay zeka destekli sanal deneme teknolojisi ile model üzerinde görselleştirmesini sağlayan bir B2B SaaS hizmetidir.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">2. Hesap ve Güvenlik</h2>
            <p>Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi üçüncü kişilerle paylaşmayın. Yetkisiz erişim tespit edildiğinde hesap askıya alınabilir.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">3. Kredi Sistemi</h2>
            <p>Her görsel üretimi 1 kredi kullanır. Kullanılmayan krediler iade edilmez. Başarısız üretimlerde kredi düşülmez.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">4. Fikri Mülkiyet</h2>
            <p>Yüklediğiniz takı görselleri üzerindeki haklar size aittir. Platform tarafından üretilen görseller üzerinde ticari kullanım hakkına sahipsiniz. Platform altyapısı ve yazılımı Jewelry Virtual Studio&apos;ya aittir.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">5. Yasaklı Kullanım</h2>
            <p>Platformu yasa dışı, yanıltıcı veya zararlı içerik üretmek için kullanamazsınız. API&apos;yi kötüye kullanan veya sistemi aşırı yükleyen hesaplar askıya alınır.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">6. Sorumluluk Sınırı</h2>
            <p>Platform &quot;olduğu gibi&quot; sunulmaktadır. Üretilen görsellerin kalitesi veya doğruluğu konusunda garanti verilmez. Hizmet kesintileri için sorumluluk kabul edilmez.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">7. Değişiklikler</h2>
            <p>Bu koşullar önceden bildirimle güncellenebilir. Güncellemeler yayınlandığı anda yürürlüğe girer.</p>
          </section>
          <p className="text-xs text-[#9CA3AF] pt-4">Son güncelleme: Haziran 2026</p>
        </div>
      </div>
    </div>
  )
}
