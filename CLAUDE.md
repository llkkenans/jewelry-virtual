# CLAUDE.md — Jewelry Virtual Try-On SaaS
# Bu dosyayı her oturumda oku. Projenin anayasasıdır.

---

## 🎯 Projenin Tek Cümlelik Amacı
Orta segment kuyumcuların takı fotoğraflarını, pahalı stüdyo çekimi olmadan saniyeler içinde
gerçekçi model elinde gösteren B2B Web SaaS ürünü.

---

## 🏗️ Teknoloji Kararları (Değiştirme)

| Katman         | Teknoloji                         | Neden?                                      |
|----------------|-----------------------------------|---------------------------------------------|
| Frontend       | Next.js 14 (App Router) + Tailwind CSS | SEO + jilet hızı                        |
| UI Kütüphanesi | Shadcn UI                         | Temiz, aydınlık, e-ticaret dostu            |
| Veritabanı     | Supabase (PostgreSQL)             | Auth + DB + Storage tek çatı altında        |
| Storage        | Supabase Storage                  | Takı ve çıktı görsellerini barındırır       |
| AI Motoru      | fal.ai — Flux.1 Inpainting        | Ürün piksellerini kitleyerek altına el örer |
| Ödeme          | Stripe                            | Kredi paketi satışları                      |
| Hosting        | Vercel                            | Sıfır sabit maliyet, GitHub otomatik deploy |

---

## 🗂️ Klasör Yapısı

```
jewelry-tryon/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── upload/page.tsx        ← Ana iş ekranı
│   │   ├── gallery/page.tsx       ← Geçmiş üretimler
│   │   └── billing/page.tsx       ← Kredi satın alma
│   ├── api/
│   │   ├── try-on/route.ts        ← [API_AGENT] fal.ai entegrasyonu
│   │   ├── mask/route.ts          ← [API_AGENT] akıllı maskeleme
│   │   └── webhook/stripe/route.ts ← Stripe kredi güncelleme
│   └── page.tsx                   ← Landing page
├── components/
│   ├── upload/
│   │   ├── DropZone.tsx
│   │   └── ConceptPicker.tsx
│   ├── gallery/
│   │   └── GenerationCard.tsx
│   └── ui/                        ← Shadcn bileşenleri burada
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── fal.ts                     ← fal.ai istemcisi
│   └── stripe.ts                  ← Stripe istemcisi
├── supabase/
│   └── migrations/                ← Tüm SQL migration dosyaları
└── CLAUDE.md                      ← Bu dosya
```

---

## 🤖 Ajan Kuralları — ZORUNLU

### [DB_AGENT] — Sadece Supabase şeması
- Görev: tablo oluşturma, RLS, trigger, migration dosyaları
- **Dokunmayacağı:** Next.js route'ları, React bileşenleri, API çağrıları
- Çalışma dosyaları: `supabase/migrations/*.sql`
- Kullandığı skill: **YOK** (saf SQL işi, skill gerekmez)

### [API_AGENT] — Sadece backend logic
- Görev: `/api/*` route.ts dosyaları, fal.ai entegrasyonu, maskeleme algoritması
- **Dokunmayacağı:** Tailwind sınıfları, HTML/JSX yapısı, Shadcn bileşen konfigürasyonu
- Çalışma dosyaları: `app/api/**`, `lib/fal.ts`, `lib/stripe.ts`
- Kullandığı skill: **YOK** (backend mantığı, skill gerekmez)

### [UI_AGENT] — Sadece arayüz
- Görev: React bileşenleri, sayfa layout'ları, Shadcn kurulumu
- **Dokunmayacağı:** Supabase migration, fal.ai API key, backend logic
- Çalışma dosyaları: `app/(dashboard)/**`, `components/**`
- Kullandığı skill'ler: `frontend-design`, `ui-design-system`, `ui-ux-pro-max` (aşağıya bak)

### [QA_AGENT] — Sadece düzeltme ve deploy
- Görev: TypeScript hataları, `npm run build` geçişi, Vercel deployment
- **Dokunmayacağı:** Sıfırdan yeni özellik yazmaz; sadece var olanı tamir eder
- Çalışma dosyaları: her şeyi okur, sadece hatalı dosyaları düzeltir
- Kullandığı skill'ler: `web-performance-optimization`, `seo-optimizer` (deploy öncesi)

---

## 🔄 Sonsuz Döngü Önleme Kuralları — KRİTİK

Ajanlar aşağıdaki durumlarla karşılaştığında döngüye GİRMEZ, durur ve kullanıcıya sorar:

### Döngü Tetikleyici Durumlar ve Çözümleri

**1. Hata → Düzeltme → Aynı hata döngüsü**
```
❌ YANLIŞ: Aynı fix'i 3+ kez deneme
✅ DOĞRU:  2. denemede dur, hatayı olduğu gibi kullanıcıya göster ve sor:
           "Bu hatayı 2 kez denedim, çözemedim. Farklı bir yaklaşım deneyelim mi?"
```

**2. Ajan sınır ihlali döngüsü**
```
❌ YANLIŞ: [UI_AGENT] bir API sorunu görür → düzeltmeye çalışır →
           kendi kapsamı dışına çıkar → yeni hatalar üretir → döngü
✅ DOĞRU:  [UI_AGENT] durur ve yazar:
           "Bu sorun [API_AGENT] kapsamında. Ben devam etmiyorum."
```

**3. Migration çakışma döngüsü**
```
❌ YANLIŞ: Var olan tabloyu tekrar CREATE etmeye çalışmak
✅ DOĞRU:  Her migration başında şunu çalıştır:
           SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
           Tablo varsa → ALTER kullan, CREATE kullanma
```

**4. Build hatası → dosya değiştir → build → aynı hata döngüsü**
```
❌ YANLIŞ: npm run build → hata → düzelt → npm run build → aynı hata → tekrar düzelt
✅ DOĞRU:  3. başarısız build'de dur:
           "3 denemede build geçmedi. Hata logunu paylaşıyorum, birlikte bakalım:"
           [hata logunu yapıştır]
```

**5. Tip hatası yayılma döngüsü**
```
❌ YANLIŞ: Bir TypeScript hatasını düzeltirken başka dosyalara any eklemek →
           yeni tip hataları → onları da any yapmak → zincirleme bozulma
✅ DOĞRU:  any kullanma. Tipi bilmiyorsan şunu yaz:
           // TODO: [QA_AGENT] bu tipi düzelt
           ve duraksayarak kullanıcıya bildir
```

**6. Supabase RLS kilitleme döngüsü**
```
❌ YANLIŞ: RLS hatası → policy ekle → farklı RLS hatası → başka policy ekle → kilitlenme
✅ DOĞRU:  RLS sorununda önce mevcut policy'leri listele:
           SELECT * FROM pg_policies WHERE tablename = '[tablo_adı]';
           Sonra çakışanları sil, yeniden yaz
```

### Genel Döngü Durma Kuralı
> Herhangi bir sorun için **aynı çözümü 2 kez** denedikten sonra hâlâ çalışmıyorsa,
> bir 3. deneme YAPMA. Dur, durumu özetle, kullanıcıya farklı bir yol sor.

---

## 🛠️ Skill Kullanım Rehberi

`.claude/skills/` klasöründe 6 skill mevcut. Her biri belirli ajanların belirli görevlerinde devreye girer.

### `frontend-design`
- **Kim kullanır:** [UI_AGENT]
- **Ne zaman:** Yeni bir sayfa veya bileşen sıfırdan yazılırken
- **Bu projede:** `DropZone.tsx`, `ConceptPicker.tsx`, `GenerationCard.tsx`, landing page
- **Nasıl:** Bileşen yazmadan önce bu skill'i oku; renk, boşluk ve bileşen kararlarını buraya göre ver

### `ui-design-system`
- **Kim kullanır:** [UI_AGENT]
- **Ne zaman:** Shadcn bileşenlerini özelleştirirken veya yeni bir token eklerken
- **Bu projede:** Tailwind config'deki özel renkler, buton varyantları, kart stilleri
- **Nasıl:** Shadcn'a yeni bir bileşen eklemeden önce mevcut sistemi bu skill ile kontrol et

### `ui-ux-pro-max`
- **Kim kullanır:** [UI_AGENT]
- **Ne zaman:** Kullanıcı akışı (upload → konsept seç → üret → indir) tasarlarken
- **Bu projede:** Yükleme ekranı UX'i, kredi uyarı akışı, boş galeri durumu
- **Nasıl:** Ekran geçişlerini ve mikro-etkileşimleri kodlamadan önce bu skill'i oku

### `3d-web-experience`
- **Kim kullanır:** [UI_AGENT] — ama sadece landing page için, dashboard'da KULLANMA
- **Ne zaman:** Landing page'de takı önizleme animasyonu veya hero section effect'i istenirse
- **Bu projede:** Opsiyonel — performans öncelikli olduğundan önce `web-performance-optimization`'a bak
- **Kısıt:** Dashboard sayfalarında 3D efekt yasak; sadece `/` (landing) sayfasında kullanılabilir

### `seo-optimizer`
- **Kim kullanır:** [QA_AGENT], deploy öncesi
- **Ne zaman:** Faz 5'te, Vercel'e atmadan önce son kontrol olarak
- **Bu projede:** Landing page meta tag'leri, OG görselleri, robots.txt, sitemap
- **Nasıl:** `next/metadata` API ile entegre et; ayrı bir SEO kütüphanesi ekleme

### `web-performance-optimization`
- **Kim kullanır:** [QA_AGENT], [UI_AGENT] (görsel yoğun sayfalarda)
- **Ne zaman:** Galeri sayfası gibi çok görsel barındıran ekranları bitirince
- **Bu projede:** `next/image` kullanımı, lazy loading, Supabase Storage CDN ayarı
- **Kısıt:** fal.ai çıktı görsellerini optimize ederken orijinal görsel kalitesini düşürme;
            sadece thumbnail'ları sıkıştır

### Skill Kullanım Öncelik Sırası
```
Yeni bileşen yazacaksın     → frontend-design → ui-design-system
Kullanıcı akışı tasarlıyorsun → ui-ux-pro-max
Deploy öncesi kontrol        → web-performance-optimization → seo-optimizer
Landing page animasyonu      → 3d-web-experience (opsiyonel, dikkatli kullan)
```

---

## 🗄️ Veritabanı Şeması

### `profiles` tablosu (Supabase auth.users'a bağlı)
```sql
id          uuid PRIMARY KEY REFERENCES auth.users(id)
email       text NOT NULL
credits     integer DEFAULT 10          -- Ücretsiz başlangıç kredisi
plan        text DEFAULT 'free'         -- 'free' | 'starter' | 'pro'
stripe_customer_id  text
created_at  timestamptz DEFAULT now()
```

### `jewelry_items` tablosu
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE
name            text
original_image_url  text NOT NULL       -- Supabase Storage URL
created_at      timestamptz DEFAULT now()
```

### `generations` tablosu
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE
jewelry_item_id uuid REFERENCES jewelry_items(id) ON DELETE CASCADE
concept         text NOT NULL           -- 'ecommerce' | 'studio' | 'engagement' | 'lifestyle'
output_image_url    text                -- fal.ai çıktısı
status          text DEFAULT 'pending'  -- 'pending' | 'processing' | 'done' | 'failed'
credits_used    integer DEFAULT 1
created_at      timestamptz DEFAULT now()
```

### Kredi düşüş trigger'ı
```sql
-- generations INSERT sonrası profiles.credits'i 1 azalt
CREATE OR REPLACE FUNCTION deduct_credit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET credits = credits - NEW.credits_used
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_generation_insert
  AFTER INSERT ON generations
  FOR EACH ROW EXECUTE FUNCTION deduct_credit();
```

### RLS Kuralları
```sql
-- Her kullanıcı sadece kendi verisini görsün
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kendi profili" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "kendi takıları" ON jewelry_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "kendi üretimleri" ON generations FOR ALL USING (auth.uid() = user_id);
```

---

## 🎨 Tasarım Anayasası — [UI_AGENT] İçin

### Renk Paleti
```
Arkaplan (ana):    #FFFFFF
Arkaplan (panel):  #F9FAFB
Kenarlık:          #E5E7EB
Metin (ana):       #111827
Metin (ikincil):   #6B7280
Vurgu (CTA):       #111827  ← Siyah buton, beyaz metin
```

### Tipografi
```
Font: Inter (Google Fonts)
Başlık: 24px / font-weight: 600
Alt başlık: 16px / font-weight: 500
Gövde: 14px / font-weight: 400
```

### UX İlkeleri
1. Her ekranda tek bir odak noktası (sürükle-bırak kutusu veya sonuç görüntüsü)
2. Loading state'lerde spinner değil, skeleton kullan
3. Konsept seçici: büyük, net ikonlu kart bileşenleri (radio gibi çalışır)
4. Kredi sayısı her zaman header'da görünür olsun
5. Mobil önce tasarla; desktop ikincil

---

## 🤖 fal.ai Entegrasyonu

### Model
`fal-ai/flux/dev/image-to-image` veya `fal-ai/flux-pro/v1/fill` (inpainting için)

### API Akışı
```
1. Kullanıcı takı fotoğrafı yükler → Supabase Storage'a kaydet
2. /api/mask → Görseli analiz et, beyaz/açık bg piksellerini tespit et → mask üret
3. /api/try-on → fal.ai'ye gönder: orijinal görsel + mask + konsept prompt
4. Sonuç URL'ini generations tablosuna kaydet
5. Kredi trigger otomatik düşer
```

### Konsept Promptları
```typescript
const CONCEPT_PROMPTS = {
  ecommerce:   "elegant hand wearing the ring, clean white studio background, professional product photography, soft shadows",
  studio:      "hand wearing the ring, professional studio lighting, bokeh background, high-end jewelry photography",
  engagement:  "romantic close-up of hand wearing the ring, soft natural light, engagement photography style",
  lifestyle:   "hand wearing the ring resting near a coffee cup, cozy cafe lifestyle photography, warm tones",
}
```

---

## 💳 Stripe Kredi Paketleri

| Paket    | Kredi | Fiyat  |
|----------|-------|--------|
| Starter  | 50    | $9     |
| Growth   | 150   | $24    |
| Pro      | 400   | $49    |

Webhook: `checkout.session.completed` → `profiles.credits += purchased_credits`

---

## ⚙️ Environment Variables

```bash
# .env.local (Vercel'e de ekle)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Sadece server-side API route'larında kullan
FAL_KEY=                         # fal.ai API anahtarı — client'a asla sızdırma
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 🚀 Geliştirme Sırası (Faz Özeti)

```
Faz 1 → Next.js + Shadcn + Supabase Auth + Vercel deploy
Faz 2 → [DB_AGENT] tabloları + RLS + trigger oluştur
Faz 3 → [API_AGENT] maskeleme + fal.ai entegrasyonu
Faz 4 → [UI_AGENT] dashboard + konsept seçici + Stripe checkout
Faz 5 → [QA_AGENT] build temizliği + landing page + production
```

---

## ❌ Yapılmayacaklar

- `public.users` tablosuna INSERT atma (Supabase yönetir) → `profiles` kullan
- FAL_KEY'i client component'e import etme → sadece `app/api/` altında kullan
- `.next/` klasörünü git'e commit etme → `.gitignore`'a ekle
- Tek seferde çok büyük migration yazmak → küçük adımlarla ilerle
- Karanlık/neon tema kullanma → tasarım anayasasına sadık kal

---

## 📋 Her Faz Başında Yapılacaklar

1. Bu dosyayı baştan oku
2. Hangi ajanın ([DB_AGENT] / [API_AGENT] / [UI_AGENT] / [QA_AGENT]) görevinde olduğunu belirle
3. Sadece o ajanın dosyalarına dokun
4. Değişiklik sonrası `npm run build` koşarak TypeScript hatası bırakma
5. Migration'ları `supabase/migrations/` altına tarih prefix'li kaydet: `20240601_add_generations.sql`