# Denetim Masası

İç denetim ekibi için görev, denetim akışı, form (ek), kanıt ve bulgu takibi platformunun **prototipi**. Yalnızca iç denetçi kullanımı içindir; sistem başka birimlere bir şey göndermez, birimle iletişimi denetçiler kurar.

Prototip tek başına tarayıcıda çalışır: sunucu, veritabanı veya kurulum gerekmez. Tüm veriler **kurgusaldır**: kurum adı (ÖRNEK DAĞITIM A.Ş.), kişiler, denetim evreni ve makro risk puanları temsili olarak üretilmiştir.

## Çalıştırma

- **Yerel:** `index.html` dosyasını çift tıklayın (Chrome, Edge veya Firefox).
- **GitHub Pages:** Depo ayarlarında *Settings → Pages → Branch: main / root* seçin. Sayfa `https://<kullanıcı>.github.io/<depo>/` adresinde açılır. Özel (private) depolarda GitHub Pages yalnızca ücretli planlarda (Pro, Team, Enterprise) kullanılabilir.

Word, PDF ve Excel önizleme kütüphaneleri internetten (jsDelivr) yüklenir; bu özellikler için internet bağlantısı gerekir.

## Özellikler

| Modül | Ne yapar |
|---|---|
| Panel | Dönem seçici (Bu ay / Bu çeyrek / Geçen çeyrek / Bu yıl / Tümü); tıklanabilir göstergeler; **Kişisel / Ekip göstergeleri** (zorluk ağırlıklı puan, ölçüt ortalamaları, zamanlılık n/N, açık geciken, birimi bekleyen, müdür onayında, düzeltmeye dönen), **Denetim göstergeleri** (bulgu durumu, önem dağılımı, denetim ilerlemesi, birim bazında açık bulgular) ve **Departman göstergeleri** |
| Denetimler | Denetim listesi, **Yeni denetim** sihirbazı ve her denetimin akışı: Akış, Formlar, Testler ve çalışma kağıtları, Bulgular, Kanıtlar, Risk → rapor izi, Rapor, EK-2 |
| Görevler | Aktif / Bekleyen / Puan bekleyen / Tamamlanan sekmeleri; sistemden, sözlü talimatla veya kendi planıyla görev girişi; atamada zorluk (Basit / Orta / Karmaşık); teslim ve onay tarihleri ayrı; "Birimi bekliyorum" durumu; ölçüt bazlı değerlendirme ve çalışan görüşü; her göreve tıklanınca açılan **görev ayrıntısı** (içerik, bağlı iş, sonuç, dosyalar, değerlendirme, geçmiş) |
| Sürekli Denetim | Bir denetime bağlı olmayan tekrarlayan işler; puanlanınca bir sonraki dönem görevi açılır |
| İzleme | Bulguların birim bazında takibi: durum girişi, kanıt, termin uzatma, yapılandırılmış kapanış doğrulaması, risk kabulü; birim ve kök nedene göre süzme |
| Denetim Planı | 2026 planı, makro risk puanı, kapasite kontrolü; plan durumu (planlandı / devam / tamamlandı / ertelendi / iptal), gerekçeli erteleme ve iptal, plan dışı işler |
| Performans | Seçilen dönemde denetçi bazında zorluk ağırlıklı puan, ölçüt ortalamaları, EK-14 ortalaması, zamanlılık (n/N), açık geciken, birimi bekleyen, düzeltme sayısı, müdür onay süresi |
| Değişiklik Kaydı | Kim, neyi, ne zaman değiştirdi (yalnızca müdür görür) |

### Denetim akışı

0 Planlama → 1 Hazırlık → 2 Açılış → 3 Saha → 4 Bulgu paylaşımı → 5 Kapanış ve rapor → 6 Değerlendirme → Tamamlandı

- **Denetime Başla:** önceki raporlar, açık bulgular ve tekrarlayan konular gösterilir; hazırlık ekleri (EK-1, EK-3, EK-15, EK-6, EK-7) görev olarak atanır.
- **Evrak zinciri:** EK-6 risk → EK-8 test → EK-4 çalışma kağıdı → EK-9 bulgu → EK-10 birim yanıtı → raporun D bölümü.
- **Müdür onayı:** denetçi "müdür onayına gönder" der; müdür onaylar, puanlar veya değiştirerek onaylar ya da düzeltmeye geri gönderir. Gönderilen ve onaylanan sürüm ayrı saklanır.
- **Çalışma kağıdı gözden geçirme:** EK-4'ü hazırlayan kişi kendi kağıdını onaylayamaz. Gözden geçiren, gözden geçirme tarihi ve onaylanan sürüm çıktıya yazılır. Kağıt düzenlenince yeni sürüm oluşur ve onay düşer; önceki gözden geçirilmiş sürümler listelenir.
- **Bulgu puanı:** makro risk alt faktörlerine göre (çıktıya girmeyen ek sorular); önem düzeyi en yüksek etkiden belirlenir.
- **Çıktılar:** tüm formlar, çalışma kağıtları, bulgu formları ve rapor Word (.docx) ve PDF olarak alınır.

### Yeni denetim sihirbazı

Tür seçilir: Süreç, Şube, Performans, Uygunluk, Mali, BT / sistem, Danışmanlık (rapor no C), Özel inceleme, İzleme. Süreç temelli türlerde denetim evreninden süreç ve alt süreç seçilir veya konu aranır (ör. "erken ödeme iskontoları"). Seçime göre EK-1, EK-3, EK-6, EK-7 ve EK-15 ile bilgi ve belge talep listesi ön doldurulur.

### Bulgu kapanışı

Bulgu kapanışı gerekçesiz yapılamaz. **Kapanışı doğrula** ekranında doğrulama yöntemi (belge incelemesi, kontrolün yeniden yapılması, örneklem testi, gözlem, sorgulama), yeniden yapılan kontrol, bağlı kanıtlar, gerekçe ve sonuç (giderildi / kısmen giderildi / yetersiz) girilir.

- **Çok Yüksek ve Yüksek** önemdeki bulgularda yalnızca sorgulama veya gözlemle kapanış yapılamaz, en az bir kanıt bağlanmalıdır. Bulgu önce *Kapanış onayı bekliyor* durumuna geçer; doğrulamayı yapandan farklı bir kişi onaylayınca kapanır.
- **Kısmen giderildi** sonucunda kalan kısım için yeni termin girilir, bulgu izlemede kalır.
- **Risk kabul edildi:** yönetimin riski üstlendiği bulgular ayrı bir durumda tutulur; bu durumu yalnızca müdür verir. Risk kabulleri departman göstergelerinde ayrıca sayılır.

### Görev ayrıntısı

Görevler ve Sürekli Denetim listelerinde her göreve tıklanınca görevin sayfası açılır. Herkes kendi görebildiği görevlerin ayrıntısını görür (müdür ve yönetici tüm ekibin, denetçi kendi görevlerinin):

- **Görevin içeriği:** açıklama, bağlı olduğu denetim veya sürekli denetim alanı, talep şekli, atayan, sorumlu, zorluk. Form görevlerinde form açılır ve Word / PDF alınır; test görevlerinde çalışma kağıdı görülür.
- **Teslim edilen iş:** sonuç, tespit ve dosyalar. Dosyalar sayfada önizlenir (Excel, CSV, PDF, görsel, metin) ve indirilir. Görev sorumlusu, müdür ve yönetici sonradan dosya ekleyebilir; denetime bağlı görevlerin dosyaları Kanıtlar bölümüne de eklenir.
- **Durum ve değerlendirme:** termin, teslim ve müdür onay tarihleri, ölçüt puanları, gerekçe, çalışan görüşü, revizyonlar. Değerlendir, görüş ekle gibi işlemler bu sayfadan da yapılır.
- **Geçmiş:** atama, başlama, birim beklemesi, teslim, düzeltmeye dönme, değerlendirme ve dosya eklemeleri tarihleriyle.

### Kök neden ve tekrar eden bulgular

- Her bulguda serbest metin **Neden** alanına ek olarak seçmeli bir **ana kök neden** (zorunlu) ve isteğe bağlı **ikincil kök neden** girilir: prosedür yok veya eksik, kontrol tasarımı yetersiz, kontrol uygulanmıyor, eğitim / farkındalık eksik, sistem / BT kısıtı, kaynak yetersizliği, gözetim / yönetim eksikliği, dış etken, diğer. Kök neden yalnızca sistemde tutulur, çıktıya girmez.
- **Tekrar eden bulgu adayları:** aynı süreçte, son 3 yıl içindeki önceki denetimlerde aynı RKM kontrolüyle ilgili bulgu veya aynı kategori ve aynı ana kök nedenli bulgu **güçlü eşleşme**; yalnızca aynı kategori **olası eşleşme** sayılır. Önceki bulgu kapanmışsa "kapandıktan sonra yeniden ortaya çıktı", açıksa "önceki bulgu hâlâ açık" olarak gösterilir.
- Tekrar olduğuna denetçi karar verir ve bulguyu önceki bulguya bağlar. Bağlanan bulgu raporun D bölümünde ve EK-9'da "Tekrar eden bulgu" olarak belirtilir.
- **Denetime Başla** ekranı son 3 yıldaki önceki bulguları kategori ve kök nedene göre özetler.
- **Panel:** kök neden dağılımı; aynı kök neden 3 veya daha fazla birimde görülürse **sistemik konu**; tekrar eden bulgu sayısı ve kapandıktan sonra yeniden ortaya çıkanlar. Grafiğe tıklayınca İzleme ekranı o kök nedene göre süzülür.
- **Kapanış doğrulaması:** "Aksiyon kök nedeni giderdi mi?" sorusu zorunludur; kök neden sürüyorsa bulgu "giderildi" olarak kapatılamaz.

### Görev değerlendirme

- Zorluk görev atanırken belirlenir: **Basit (1)**, **Orta (2)**, **Karmaşık (3)**. Ortalama puan zorlukla ağırlıklandırılır.
- Basit görevler tek puanla değerlendirilir. Diğerleri üç ölçütle puanlanır: **Kanıt yeterliliği** (EK-14 K5), **Analiz doğruluğu** (EK-14 K6), **Kapsamı karşılama** (EK-14 K2). Uygulanamayan ölçüt "U/Y" seçilir ve ortalamaya girmez.
- Gerekçe zorunludur. Düzeltme sayısı ve zamanlılık puana katılmaz; sistem bunları ayrıca kaydeder.
- Çalışan puana görüş ekleyebilir; müdür görüşü inceler ve gerekirse puanı revize eder. Revizyonlar eski puan ve gerekçeyle birlikte saklanır.

### Zamanlılık ölçümü

- Payda, seçilen dönemde termini dolan görevlerdir; açıkken termini geçmiş görevler de dahildir. Oran her zaman n/N ile gösterilir.
- Teslim tarihi (denetçinin bitirdiği gün) ile onay tarihi (müdürün kapattığı gün) ayrı tutulur. Zamanında teslim, teslim tarihine göre ölçülür; müdürde bekleyen süre denetçinin aleyhine sayılmaz, müdür onay süresi olarak ayrıca gösterilir.
- **Birimi bekliyorum** durumunda geçen gün sayısı termine eklenir; birimi bekleyen görevler paydaya girmez, gecikme sayılmaz, ayrı listelenir.
- Termin uzatmaları sayılır ve görev üzerinde gösterilir.

### Departman göstergeleri

Panelde tüm ekip tarafından görülür:

- **Müdür onayında bekleyen** işler: adet, ortalama ve en uzun bekleme (iş günü), hedef 3 iş günü.
- **Plan gerçekleşmesi:** plan kalemlerinin durumu ve sapma gerekçeleri (kaynak yetersizliği dahil).
- **Yüksek riskli alan kapsama:** risk düzeyine göre denetim döngüsü (Çok Yüksek 1 yıl, Yüksek 2 yıl, Orta 3 yıl) içinde denetlenen alanların oranı ve kapsanmayan alanlar.
- **Süreler:** saha bitişinden nihai rapora geçen süre, ortalama bulgu kapanma süresi, termin uzatmaları ve risk kabulleri.

### E-posta bildirimleri

Sistemdeki her bildirim, kullanıcının tanımlı e-posta adresine de gönderilir. Kullanıcı sol alttaki **Profil ve e-posta** bölümünden adresini ve tercihini seçer: her bildirimde anında, günlük özet veya kapalı. Giden e-postalar aynı ekranda listelenir ve önizlenir.

Prototip sunucusuz olduğu için gerçek gönderim bir **webhook** ile yapılır. Tanımlı değilse e-postalar yalnızca "Giden e-postalar" kaydında görünür. Kurulum (Microsoft Power Automate örneği):

1. Power Automate'te yeni bir *Anlık bulut akışı* oluşturun, tetikleyici: **When a HTTP request is received**.
2. İstek gövdesi şeması: `{"type":"object","properties":{"to":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"},"html":{"type":"string"}}}`
3. Eylem ekleyin: **Office 365 Outlook → Send an email (V2)**; Alıcı = `to`, Konu = `subject`, Gövde = `html`.
4. Kaydedince oluşan HTTP POST adresini `09-eposta-bildirimleri.js` içindeki `MAIL_AYAR.webhook` alanına yazın.

İstek `text/plain` içerik türüyle gönderilir (tarayıcı kısıtı); akış gövdeyi JSON olarak okumazsa ayrıştırma için `json(triggerBody())` ifadesini kullanın. Webhook adresi, adrese sahip herkesin e-posta göndermesine izin verir; herkese açık bir depoya gerçek adresi yazmayın. Kurumsal sürümde gönderim sunucu tarafında kurum e-posta sunucusu (SMTP / Exchange) üzerinden yapılmalıdır.

### Kanıtlar

Her denetimde üzerinde çalışılan dosyalar (Excel, CSV, PDF, Word, görsel) ne için kullanıldığı, üzerinde yapılan çalışma, kaynağı ve bağlı olduğu iş (risk, test, çalışma kağıdı, bulgu, belge talebi) ile saklanır. Sürümler silinmez, Excel dosyaları sistem içinde önizlenir, çalışma günlüğü tutulur.

## Dosya yapısı

```
index.html                   Sayfa iskeleti; script'leri sırayla yükler
styles.css                   Tüm stiller (açık / koyu tema)
01-yardimcilar-ve-veri.js    Yardımcı fonksiyonlar, sabitler, form tanımları, örnek veri (seed)
02-belge-uretimi.js          Word (docx) ve PDF üretimi, önizleme
03-durum-ve-kurallar.js      Uygulama durumu, aşama kuralları, belge içerikleri; ölçüm ve değerlendirme kuralları
04-gorunumler.js             Ekranlar (panel, denetim, formlar, bulgu, görevler, izleme, plan…)
05-denetim-evreni.js         Denetim evreni: süreçler, alt süreçler, makro risk puanları (temsili)
06-konu-sablonlari.js        Konu şablonları: risk matrisi satırları, belge listeleri, amaç metinleri
07-yeni-denetim.js           Yeni denetim sihirbazı ve eklere ön doldurma
08-kanitlar.js               Kanıtlar bölümü (dosya saklama, önizleme, sürümler)
09-eposta-bildirimleri.js    E-posta bildirimleri: tercihler, giden kutusu, günlük özet, webhook
10-etkilesimler.js           Buton işlemleri ve olay dinleyicileri; uygulamayı başlatır
```

Tüm dosyalar deponun ana dizinindedir ve `index.html`'deki sırayla yüklenmelidir; sonraki dosyalar öncekilerdeki fonksiyonları kullanır. Derleme (build) adımı yoktur.

## Verinin tutulduğu yer (prototip)

- Kayıtlar tarayıcının `localStorage` alanında (`denetim-masasi-gh-v1` anahtarı) tutulur.
- Kanıt dosyalarının içeriği tarayıcının IndexedDB'sinde (`denetim-masasi-gh-kanit`) tutulur.
- Veriler yalnızca o bilgisayardaki o tarayıcıda görünür. Sol alttaki **Demo verisini sıfırla** örnek veriye döner.
- Sol alttaki kullanıcı seçiciyle müdür, yönetici ve denetçi görünümleri arasında geçilir; gerçek kimlik doğrulama yoktur.

## Sık yapılacak değişiklikler

- **Yeni konu şablonu eklemek:** `06-konu-sablonlari.js` içindeki `KONU_SABLON` dizisine aynı biçimde bir kayıt ekleyin (`s` alanı `05-denetim-evreni.js`'deki süreç adıyla aynı olmalı).
- **Denetim evrenini güncellemek:** `05-denetim-evreni.js` içindeki `EVREN` listesini makro risk değerlendirmesine göre güncelleyin.
- **Kullanıcılar, plan ve örnek veriler:** `01-yardimcilar-ve-veri.js` içindeki `seed()` fonksiyonu.
- **E-posta ayarları:** `09-eposta-bildirimleri.js` içindeki `MAIL_AYAR` (webhook, gönderen adı, özet saati).
- **Form alanları:** `01-yardimcilar-ve-veri.js` içindeki `FORMS` tanımları.
- **Ölçüm kuralları:** `03-durum-ve-kurallar.js` içindeki *Ölçüm ve değerlendirme* bölümü: `ZORLUK` (ağırlıklar), `KRITERLER` (ölçütler ve EK-14 eşleşmesi), `ONAY_SLA` (müdür onay hedefi, iş günü), `RISK_DONGU` (risk düzeyine göre denetim döngüsü), `ERTELEME_NEDEN` (plan sapma gerekçeleri), `DOG_YONTEM` (kapanış doğrulama yöntemleri); dosyanın sonundaki *Kök neden ve tekrar eden bulgular* bölümünde `KOK_NEDEN` (kök neden listesi), `TEKRAR_YIL` (tekrar araması için geriye bakılan yıl), `SISTEMIK_ESIK` (sistemik sayılması için birim sayısı).

- **Sürüm (önbellek):** Bir `.js` veya `styles.css` dosyasını güncellediğinizde `index.html` içindeki `?v=20261016` değerlerini yeni bir değerle (ör. o günün tarihi) değiştirin. Böylece tarayıcılar eski dosyayı önbellekten kullanmaz, güncelleme herkese hemen yansır.

Değişiklikten sonra tarayıcıda **Demo verisini sıfırla** ile örnek veriyi yeniden yükleyin.

## Kurumsal sürüm için notlar

Prototip onaylanırsa kurumsal sürümde öngörülenler: kurum içi sunucu ve veritabanı, Active Directory ile giriş, dosyaların kurum içi dosya deposunda saklanması, yetkilendirme ve yedekleme. Bilgi Teknolojileri ile görüşme müdür onayından sonra yapılacaktır.

## Gizlilik

Depodaki tüm veriler kurgusaldır. Gerçek süreç listesi, risk puanı, rapor, bulgu veya kişisel veri eklemeyin; gerçek verilerle çalışılacaksa depoyu özel (private) tutun ve kurumsal sürüme geçin.
