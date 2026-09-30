# Denetim Masası

İç denetim ekibi için görev, denetim akışı, form (ek), kanıt ve bulgu takibi platformunun **prototipi**. Yalnızca iç denetçiler kullanır; sistem başka birimlere bir şey göndermez, birimle iletişimi denetçiler kurar.

Prototip tek başına tarayıcıda çalışır: sunucu, veritabanı veya kurulum gerekmez. Tüm veriler **kurgusaldır**: kurum adı (ÖRNEK DAĞITIM A.Ş.), kişiler, denetim evreni ve makro risk puanları temsili olarak üretilmiştir.

## Çalıştırma

- **Yerel:** `index.html` dosyasını çift tıklayın (Chrome, Edge veya Firefox).
- **GitHub Pages:** Depo ayarlarında *Settings → Pages → Branch: main / root* seçin. Sayfa `https://<kullanıcı>.github.io/<depo>/` adresinde açılır. Özel (private) depolarda GitHub Pages yalnızca ücretli planlarda (Pro, Team, Enterprise) kullanılabilir.

Word, PDF ve Excel önizleme kütüphaneleri internetten (jsDelivr) yüklenir; bu özellikler için internet bağlantısı gerekir.

## Özellikler

| Modül | Ne yapar |
|---|---|
| Panel | Tıklanabilir göstergeler (aktif denetim, açık görev, izlemedeki / geciken bulgu, durumu sorulan bulgu veya onay bekleyenler); **Kişisel göstergeler** (müdür puanı, görev performansı) ve **Denetim göstergeleri** (bulgu durumu, önem dağılımı, denetim ilerlemesi, birim bazında açık bulgular) |
| Denetimler | Denetim listesi, **Yeni denetim** sihirbazı ve her denetimin akışı: Akış, Formlar, Testler ve çalışma kağıtları, Bulgular, Kanıtlar, Risk → rapor izi, Rapor, EK-2 |
| Görevler | Aktif / Bekleyen / Puan bekleyen / Tamamlanan sekmeleri; sistemden, sözlü talimatla veya kendi planıyla görev girişi |
| Sürekli Denetim | Bir denetime bağlı olmayan tekrarlayan işler; puanlanınca bir sonraki dönem görevi açılır |
| İzleme | Bulguların birim bazında takibi: durum girişi, kanıt, termin uzatma, kanıt doğrulama |
| Denetim Planı | 2026 planı, makro risk puanı, kapasite kontrolü |
| Performans | Denetçi bazında görev puanı, EK-14 ortalaması, zamanında tamamlama |
| Değişiklik Kaydı | Kim, neyi, ne zaman değiştirdi (yalnızca müdür görür) |

### Denetim akışı

0 Planlama → 1 Hazırlık → 2 Açılış → 3 Saha → 4 Bulgu paylaşımı → 5 Kapanış ve rapor → 6 Değerlendirme → Tamamlandı

- **Denetime Başla:** önceki raporlar, açık bulgular ve tekrarlayan konular gösterilir; hazırlık ekleri (EK-1, EK-3, EK-15, EK-6, EK-7) görev olarak atanır.
- **Evrak zinciri:** EK-6 risk → EK-8 test → EK-4 çalışma kağıdı → EK-9 bulgu → EK-10 birim yanıtı → raporun D bölümü.
- **Müdür onayı:** denetçi "müdür onayına gönder" der; müdür onaylar, puanlar veya değiştirerek onaylar. Gönderilen ve onaylanan sürüm ayrı saklanır.
- **Bulgu puanı:** makro risk alt faktörlerine göre (çıktıya girmeyen ek sorular); önem düzeyi en yüksek etkiden belirlenir.
- **Çıktılar:** tüm formlar, çalışma kağıtları, bulgu formları ve rapor Word (.docx) ve PDF olarak alınır.

### Yeni denetim sihirbazı

Tür seçilir: Süreç, Şube, Performans, Uygunluk, Mali, BT / sistem, Danışmanlık (rapor no C), Özel inceleme, İzleme. Süreç temelli türlerde denetim evreninden süreç ve alt süreç seçilir veya konu aranır (ör. "erken ödeme iskontoları"). Seçime göre EK-1, EK-3, EK-6, EK-7 ve EK-15 ile bilgi ve belge talep listesi ön doldurulur.

### E-posta bildirimleri

Sistemdeki her bildirim, kullanıcının tanımlı e-posta adresine de gönderilir. Kullanıcı sol alttaki **Profil ve e-posta** bölümünden adresini ve tercihini seçer: her bildirimde anında, günlük özet veya kapalı. Giden e-postalar aynı ekranda listelenir ve önizlenir.

Prototip sunucusuz olduğu için gerçek gönderim bir **webhook** ile yapılır. Tanımlı değilse e-postalar yalnızca "Giden e-postalar" kaydında görünür. Kurulum (Microsoft Power Automate örneği):

1. Power Automate'te yeni bir *Anlık bulut akışı* oluşturun, tetikleyici: **When a HTTP request is received**.
2. İstek gövdesi şeması: `{"type":"object","properties":{"to":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"},"html":{"type":"string"}}}`
3. Eylem ekleyin: **Office 365 Outlook → Send an email (V2)**; Alıcı = `to`, Konu = `subject`, Gövde = `html`.
4. Kaydedince oluşan HTTP POST adresini `js/09-eposta-bildirimleri.js` içindeki `MAIL_AYAR.webhook` alanına yazın.

İstek `text/plain` içerik türüyle gönderilir (tarayıcı kısıtı); akış gövdeyi JSON olarak okumazsa ayrıştırma için `json(triggerBody())` ifadesini kullanın. Webhook adresi, adrese sahip herkesin e-posta göndermesine izin verir; herkese açık bir depoya gerçek adresi yazmayın. Kurumsal sürümde gönderim sunucu tarafında kurum e-posta sunucusu (SMTP / Exchange) üzerinden yapılmalıdır.

### Kanıtlar

Her denetimde üzerinde çalışılan dosyalar (Excel, CSV, PDF, Word, görsel) ne için kullanıldığı, üzerinde yapılan çalışma, kaynağı ve bağlı olduğu iş (risk, test, çalışma kağıdı, bulgu, belge talebi) ile saklanır. Sürümler silinmez, Excel dosyaları sistem içinde önizlenir, çalışma günlüğü tutulur.

## Dosya yapısı

```
index.html                       Sayfa iskeleti; script'leri sırayla yükler
css/styles.css                   Tüm stiller (açık / koyu tema)
js/01-yardimcilar-ve-veri.js     Yardımcı fonksiyonlar, sabitler, form tanımları, örnek veri (seed)
js/02-belge-uretimi.js           Word (docx) ve PDF üretimi, önizleme
js/03-durum-ve-kurallar.js       Uygulama durumu, aşama kuralları, belge içerikleri (rapor, formlar)
js/04-gorunumler.js              Ekranlar (panel, denetim, formlar, bulgu, görevler, izleme, plan…)
js/05-denetim-evreni.js          Denetim evreni: süreçler, alt süreçler, makro risk puanları (temsili)
js/06-konu-sablonlari.js         Konu şablonları: risk matrisi satırları, belge listeleri, amaç metinleri
js/07-yeni-denetim.js            Yeni denetim sihirbazı ve eklere ön doldurma
js/08-kanitlar.js                Kanıtlar bölümü (dosya saklama, önizleme, sürümler)
js/09-eposta-bildirimleri.js     E-posta bildirimleri: tercihler, giden kutusu, günlük özet, webhook
js/10-etkilesimler.js            Buton işlemleri ve olay dinleyicileri; uygulamayı başlatır
```

Dosyalar `index.html`'deki sırayla yüklenmelidir; sonraki dosyalar öncekilerdeki fonksiyonları kullanır. Derleme (build) adımı yoktur.

## Verinin tutulduğu yer (prototip)

- Kayıtlar tarayıcının `localStorage` alanında (`denetim-masasi-gh-v1` anahtarı) tutulur.
- Kanıt dosyalarının içeriği tarayıcının IndexedDB'sinde (`denetim-masasi-gh-kanit`) tutulur.
- Veriler yalnızca o bilgisayardaki o tarayıcıda görünür. Sol alttaki **Demo verisini sıfırla** örnek veriye döner.
- Sol alttaki kullanıcı seçiciyle müdür, yönetici ve denetçi görünümleri arasında geçilir; gerçek kimlik doğrulama yoktur.

## Sık yapılacak değişiklikler

- **Yeni konu şablonu eklemek:** `js/06-konu-sablonlari.js` içindeki `KONU_SABLON` dizisine aynı biçimde bir kayıt ekleyin (`s` alanı `05-denetim-evreni.js`'deki süreç adıyla aynı olmalı).
- **Denetim evrenini güncellemek:** `js/05-denetim-evreni.js` içindeki `EVREN` listesini makro risk değerlendirmesine göre güncelleyin.
- **Kullanıcılar, plan ve örnek veriler:** `js/01-yardimcilar-ve-veri.js` içindeki `seed()` fonksiyonu.
- **E-posta ayarları:** `js/09-eposta-bildirimleri.js` içindeki `MAIL_AYAR` (webhook, gönderen adı, özet saati).
- **Form alanları:** `js/01-yardimcilar-ve-veri.js` içindeki `FORMS` tanımları.

Değişiklikten sonra tarayıcıda **Demo verisini sıfırla** ile örnek veriyi yeniden yükleyin.

## Kurumsal sürüm için notlar

Prototip onaylanırsa kurumsal sürümde öngörülenler: kurum içi sunucu ve veritabanı, Active Directory ile giriş, dosyaların kurum içi dosya deposunda saklanması, yetkilendirme ve yedekleme. Bilgi Teknolojileri ile görüşme müdür onayından sonra yapılacaktır.

## Gizlilik

Depodaki tüm veriler kurgusaldır. Gerçek süreç listesi, risk puanı, rapor, bulgu veya kişisel veri eklemeyin; gerçek verilerle çalışılacaksa depoyu özel (private) tutun ve kurumsal sürüme geçin.
