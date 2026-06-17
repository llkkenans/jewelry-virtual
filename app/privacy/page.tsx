import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/" className="text-xs text-[#6B7280] hover:text-[#111827]">← Ana Sayfa</Link>
        <h1 className="text-2xl font-semibold text-[#111827]">Gizlilik Politikası</h1>
        <div className="space-y-6 text-sm text-[#4B5563] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">1. Toplanan Veriler</h2>
            <p>Hesap oluşturma sırasında e-posta adresinizi toplarız. Yüklediğiniz takı görselleri işlenir ve sonuçlar hesabınıza kaydedilir. Ödeme bilgileri doğrudan Stripe tarafından işlenir; biz kart bilgilerinizi saklamayız.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">2. Verilerin Kullanımı</h2>
            <p>Verileriniz yalnızca hizmet sunumu, hesap yönetimi ve hizmet iyileştirme amacıyla kullanılır. Kişisel verileriniz üçüncü taraflarla pazarlama amacıyla paylaşılmaz.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">3. Veri Saklama</h2>
            <p>Yüklediğiniz görseller bulut sunucularında güvenli şekilde saklanır. Galeriye kaydetmediğiniz üretimler otomatik olarak silinir. Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılır.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">4. Çerezler</h2>
            <p>Oturum yönetimi için gerekli çerezler kullanılır. Reklam veya izleme çerezleri kullanılmaz.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">5. KVKK Kapsamında Haklarınız</h2>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında verilerinize erişim, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Taleplerinizi destek e-posta adresimiz üzerinden iletebilirsiniz.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">6. Güvenlik</h2>
            <p>Verileriniz endüstri standardı şifreleme ve güvenlik protokolleri ile korunmaktadır. Tüm bağlantılar SSL/TLS ile şifrelenir.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-medium text-[#111827]">7. İletişim</h2>
            <p>Gizlilik politikası hakkında sorularınız için support@jewelryvirtual.com adresine yazabilirsiniz.</p>
          </section>
          <p className="text-xs text-[#9CA3AF] pt-4">Son güncelleme: Haziran 2026</p>
        </div>
      </div>
    </div>
  )
}
