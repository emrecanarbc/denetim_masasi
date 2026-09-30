"use strict";
/* ============ Konu şablonları: seçilen konuya göre eklere aktarılan içerik ============
   rkm satırı: [risk, etki, olasılık, kontrol, kontrol türü, sıklık, test prosedürü] */
const KONU_SABLON = [
 {id:"erken-odeme", ad:"Erken Ödeme İskontoları", s:"Müşteri Hizmet ve Tahsilat Yönetimi", alt:["Tahsilat Yönetimi (Şüpheli alacak yönetimi)","Müşteri Hesap Yönetimi"],
  anahtar:["erken ödeme","iskonto","vade farkı","peşin ödeme indirimi"], birim:"Finans Direktörlüğü – Tahsilat ve Müşteri Cari Hesaplar",
  amac:"Müşterilere erken ödeme karşılığında uygulanan iskontoların onaylı politikaya uygun, doğru hesaplanmış, tüm müşterilere eşit koşullarla ve zamanında uygulandığını; tedarikçilerin sunduğu erken ödeme iskontolarından yararlanma düzeyini ve ilgili muhasebe kayıtlarının doğruluğunu değerlendirmek.",
  kk:"erken ödeme iskonto politikasının belirlenmesi ve onayı, iskonto parametrelerinin sistemde tanımlanması, tahsilatlarda iskonto hak edişinin hesaplanması, manuel iskonto ve cari düzeltmeler, iskontoların muhasebeleştirilmesi ile tedarikçi erken ödeme iskontolarının takibi",
  yontem:"İskonto politikası ve YK / Genel Müdür onaylarının incelenmesi; süreç sahipleriyle görüşme ve süreç yürüyüşü; dönemin tüm iskontolu tahsilatları üzerinde veri analizi (yeniden hesaplama, istisna analizi); manuel iskonto kayıtlarında tam tarama; tahsilat modülü ile muhasebe arasında mutabakat.",
  q1:"Müşterilerin fatura vadesinden önce yaptığı ödemelere, erken ödenen gün sayısına göre kademeli iskonto uygulanır. Alt adımlar: politika ve oranların belirlenmesi, sistem parametresi, tahsilat kaydı, iskonto hesaplama, cari hesaba yansıtma, muhasebe ve raporlama.",
  q2:"Tahsilatı hızlandırmak ve likiditeyi iyileştirmek. İskonto maliyetinin, erken tahsilatın finansman getirisini aşmaması gerekir.",
  q3:"Tahsilat kaydı ERP'de oluşur; iskonto sistem parametresine göre hesaplanır ve müşteri cari hesabına alacak olarak yansır. Tahsilat birimi, müşteri cari hesaplar ve muhasebe görev alır.",
  belge:["Erken ödeme iskonto politikası ve onay kararı (YK / Genel Müdür)","Sistemdeki iskonto parametre tablosu ve dönem içi değişiklik logları","Dönem tahsilat listesi: fatura no, vade, ödeme tarihi, tutar, uygulanan iskonto (Excel)","Manuel iskonto ve cari düzeltme kayıtları listesi, onay belgeleri","İskonto hesaplarının muavin dökümü","Tedarikçi sözleşmelerindeki erken ödeme koşulları ve dönem ödeme listesi"],
  rkm:[
   ["İskonto oranlarının onaylı politika dışında tanımlanması veya yetkisiz değiştirilmesi","4","2","İskonto oranları sistemde parametrik; değişiklik yalnızca yetkili kullanıcı tarafından, onayla yapılır","Önleyici","İşlem bazında","Parametre tablosunun onaylı politikayla karşılaştırılması; dönemdeki parametre değişikliklerinin log ve onay izinin incelenmesi"],
   ["Erken ödeme koşulu sağlanmadan (vade geçtikten sonra) iskonto verilmesi","4","3","Sistem, ödeme tarihini fatura vadesiyle karşılaştırarak iskontoyu otomatik hesaplar","Önleyici","İşlem bazında","Dönemin tüm iskontolu tahsilatlarında ödeme tarihi ile vade farkının veri analiziyle yeniden hesaplanması; istisnaların incelenmesi"],
   ["İskonto tutarının hatalı hesaplanması (kademe, tutar, KDV etkisi)","3","3","Sistem hesaplaması ve aylık iskonto raporunun yönetici tarafından gözden geçirilmesi","Tespit edici","Aylık","40 iskontolu tahsilatta tutarın yeniden hesaplanması; aylık raporlarda onay izinin kontrolü"],
   ["Manuel iskonto veya cari düzeltme yoluyla yetkisiz indirim yapılması","5","2","Manuel iskonto ve cari düzeltmeler iki aşamalı onaya tabidir","Önleyici","İşlem bazında","Dönemdeki tüm manuel iskonto ve düzeltme kayıtlarının onay izi, gerekçe ve kullanıcı bazında incelenmesi"],
   ["Müşterilere eşit olmayan koşullarla iskonto uygulanması","3","2","Politika tüm müşterilere aynı koşulları tanımlar; istisnalar Genel Müdür onaylıdır","Yönlendirici","Yıllık","Müşteri bazında uygulanan ortalama iskonto oranlarının dağılım analizi; istisna onaylarının kontrolü"],
   ["İskontoların yanlış hesaba veya döneme kaydedilmesi","3","2","Tahsilat modülü ile muhasebe arasında aylık mutabakat","Tespit edici","Aylık","Tahsilat modülündeki iskonto toplamlarının muavin hesaplarla mutabakatı"],
   ["Tedarikçilerin sunduğu erken ödeme iskontolarından yararlanılmaması","4","3","Hazine ödeme planında iskonto koşullu faturalar ayrıca işaretlenir ve önceliklendirilir","Yönlendirici","Haftalık","İskonto koşullu tedarikçi faturalarında erken ödeme yapılıp yapılmadığının ve kaçırılan iskonto tutarının analizi"]]},

 {id:"tahsilat", ad:"Tahsilat ve Şüpheli Alacak Yönetimi", s:"Müşteri Hizmet ve Tahsilat Yönetimi", alt:["Tahsilat Yönetimi (Şüpheli alacak yönetimi)","Müşteri Hesap Yönetimi"],
  anahtar:["tahsilat","şüpheli alacak","alacak","risk limiti","cari"], birim:"Finans Direktörlüğü – Tahsilat",
  amac:"Müşteri alacaklarının zamanında tahsil edildiğini, risk limitlerinin onaylı kurallara göre belirlenip izlendiğini ve şüpheli alacakların doğru sınıflandırılıp karşılık ayrıldığını değerlendirmek.",
  kk:"müşteri risk limitlerinin belirlenmesi, vadesi geçen alacakların takibi, sevkiyat blokajları, şüpheli alacak sınıflandırması ve karşılık hesaplanması, yasal takip süreci",
  yontem:"Alacak yaşlandırma analizi; risk limiti aşımlarında veri analizi; şüpheli alacak dosyalarının örneklemle incelenmesi; muhasebe karşılıklarının yeniden hesaplanması.",
  belge:["Alacak yaşlandırma raporu (dönem sonu)","Müşteri risk limiti listesi ve limit değişikliği onayları","Blokajı kaldırılan müşteriler listesi","Şüpheli alacak ve karşılık hesabı dökümü","Yasal takibe gönderilen dosyalar listesi"],
  rkm:[
   ["Risk limiti aşılmış müşterilere sevkiyat yapılması","4","3","Sistem limit aşımında siparişi otomatik bloke eder; blokaj kaldırma yetkiye bağlıdır","Önleyici","İşlem bazında","Dönemdeki limit aşımlı siparişlerin ve blokaj kaldırma onaylarının veri analiziyle incelenmesi"],
   ["Vadesi geçen alacakların takip edilmemesi","4","3","Haftalık vadesi geçen alacak raporu ve aranma kayıtları","Tespit edici","Haftalık","Yaşlandırmada 90 gün üstü alacaklar için takip kayıtlarının kontrolü"],
   ["Şüpheli alacakların geç sınıflandırılması veya eksik karşılık ayrılması","4","2","Dönem sonu şüpheli alacak değerlendirmesi ve muhasebe onayı","Tespit edici","Aylık","Karşılık tutarının VUK ve iç politika kriterlerine göre yeniden hesaplanması"],
   ["Tahsilatların yanlış müşteri hesabına kaydedilmesi","3","2","Banka hareketlerinin otomatik eşleştirilmesi ve eşleşmeyenlerin günlük kontrolü","Tespit edici","Günlük","Eşleşmeyen tahsilat listesinin ve manuel eşleştirmelerin incelenmesi"]]},

 {id:"satinalma", ad:"Satınalma Sipariş Yönetimi", s:"Tedarik Yönetimi", alt:["Satınalma Sipariş Yönetimi Süreci","Ürün Kabul Süreci"],
  anahtar:["satınalma","sipariş","satın alma","ürün kabul"], birim:"Satış Direktörlüğü – Satınalma",
  amac:"Satınalma siparişlerinin ihtiyaca dayalı, yetki limitlerine uygun, sözleşme fiyatlarıyla verildiğini ve sipariş, kabul ve fatura adımlarının birbiriyle eşleştiğini değerlendirmek.",
  kk:"satınalma ihtiyacının belirlenmesi, sipariş onayı ve yetki limitleri, fiyat ve iskonto koşulları, ürün kabul ve sipariş–irsaliye–fatura eşleşmesi",
  yontem:"Yetki matrisinin incelenmesi; sipariş verisinde fiyat ve miktar analizi; örneklem siparişlerde üçlü eşleşme testi; görevler ayrılığı için kullanıcı rollerinin karşılaştırılması.",
  belge:["Satınalma yetki matrisi ve limitler","Dönem sipariş listesi (tedarikçi, ürün, miktar, fiyat, onaylayan)","Tedarikçi fiyat ve iskonto anlaşmaları","Sipariş–irsaliye–fatura eşleşme raporu, eşleşmeyenler listesi","Satınalma modülü kullanıcı ve rol listesi"],
  rkm:[
   ["Yetki limitini aşan siparişlerin onaysız verilmesi","4","2","Sistemde tutar bazlı onay akışı","Önleyici","İşlem bazında","Limit üstü siparişlerin onay izinin veri analiziyle kontrolü"],
   ["Sözleşme fiyatından yüksek fiyatla alım yapılması","4","3","Sipariş fiyatının sistemdeki anlaşma fiyatıyla otomatik karşılaştırılması","Önleyici","İşlem bazında","Sipariş fiyatlarının anlaşma fiyatlarıyla karşılaştırılması ve fark tutarının hesaplanması"],
   ["İhtiyaç dışı veya fazla miktarda sipariş verilmesi","3","3","Sipariş önerisinin talep tahmini ve stok seviyesine göre sistemden üretilmesi","Yönlendirici","Günlük","Stok devir hızı düşük ürünlerde verilen siparişlerin analizi"],
   ["Teslim alınmayan veya eksik teslim edilen ürünün faturasının ödenmesi","5","2","Sipariş, irsaliye ve fatura üçlü eşleşmesi","Önleyici","İşlem bazında","30 faturada üçlü eşleşme testi; eşleşmeyen faturaların ödenip ödenmediğinin kontrolü"],
   ["Sipariş veren ve mal kabul eden kullanıcının aynı olması","4","2","Rol tanımlarında görevler ayrılığı","Önleyici","Sürekli","Kullanıcı rol listesinin çakışan yetkiler açısından incelenmesi"]]},

 {id:"stok", ad:"Stok Yönetimi ve Sayım", s:"Envanter Yönetimi", alt:["Stok Yönetim Süreci","Depo Yönetim Süreci"],
  anahtar:["stok","sayım","envanter","depo","miat","skt"], birim:"Lojistik ve Operasyon Direktörlüğü – Depo",
  amac:"Stok kayıtlarının fiziki stokla uyumlu olduğunu, sayım farklarının onaylı şekilde düzeltildiğini ve miadı yaklaşan ürünlerin zamanında yönetildiğini değerlendirmek.",
  kk:"dönemsel ve sürpriz sayımlar, sayım farklarının onayı ve kaydı, miat takibi, soğuk zincir ürünleri, stok hareket yetkileri",
  yontem:"Sürpriz sayıma katılım ve örneklem sayım; sayım farkı kayıtlarının incelenmesi; miat raporu ve imha verisinin analizi; stok hareket yetkilerinin kontrolü.",
  belge:["Son iki sayım tutanağı ve sayım farkı listesi","Sayım farkı düzeltme onayları","Miadına 90 gün kalan ürün raporu","Soğuk zincir sıcaklık kayıtları","Stok hareket yetkisi olan kullanıcılar listesi"],
  rkm:[
   ["Sayım farklarının onay alınmadan sistemde düzeltilmesi","4","3","Sayım farkı düzeltmeleri depo müdürü ve mali işler onayına tabidir","Önleyici","İşlem bazında","Dönemdeki tüm sayım farkı düzeltmelerinin onay izinin incelenmesi"],
   ["Kayıtlı stok ile fiziki stok arasında fark oluşması","4","3","Periyodik ve sürpriz sayımlar","Tespit edici","Aylık","Yüksek değerli 30 kalemde örneklem sayım ve kayıtla karşılaştırma"],
   ["Miadı dolan ürünlerin geç tespit edilmesi, imha kaybı","3","3","Haftalık miat raporu ve sorumluya atanması","Tespit edici","Haftalık","Dönem imha verisinin ve miat raporlarının takip kayıtlarının incelenmesi"],
   ["Soğuk zincir ürünlerinin uygun olmayan koşullarda saklanması","5","2","Sıcaklık sensörü alarmları ve günlük kontrol","Tespit edici","Günlük","Sıcaklık kayıtlarında alarm ve müdahale kayıtlarının incelenmesi"]]},

 {id:"müşteri-iade", ad:"Müşteri İade Yönetimi", s:"Envanter Yönetimi", alt:["Müşteri İade Yönetimi","Firma İade Yönetimi"],
  anahtar:["iade","müşteri iade","firma iade"], birim:"Lojistik ve Operasyon Direktörlüğü – İade Birimi",
  amac:"Müşterilerden gelen iadelerin iade koşullarına uygun kabul edildiğini, zamanında kaydedildiğini ve firmalara iade edilebilen ürünlerin zamanında iade edilerek alacak oluşturulduğunu değerlendirmek.",
  kk:"iade kabul koşulları, iade kaydı ve müşteri alacaklandırma, e-irsaliyeler, firmaya iade ve iade alacaklarının takibi",
  yontem:"İade verisinde süre ve koşul analizi; örneklem iadelerde belge ve e-irsaliye kontrolü; firma iade alacaklarının yaşlandırılması.",
  belge:["İade kabul prosedürü","Dönem müşteri iade listesi (kabul tarihi, kayıt tarihi, tutar)","Firmaya iade listesi ve firma alacak bakiyeleri","İade e-irsaliye kayıtları"],
  rkm:[
   ["İade koşullarına uymayan ürünlerin kabul edilmesi","4","3","İade kabul kontrol listesi ve sistem kontrolleri (miat, parti, fatura)","Önleyici","İşlem bazında","40 iadede kabul koşullarına uygunluğun belgelerle kontrolü"],
   ["İadelerin geç kaydedilmesi, müşteri bakiyesinin hatalı olması","3","3","İadelerin kabul günü sisteme işlenmesi","Önleyici","Günlük","Kabul ve kayıt tarihleri arasındaki farkın veri analiziyle incelenmesi"],
   ["Firmaya iade edilebilecek ürünlerin süresinde iade edilmemesi","4","3","Haftalık firma iade listesi takibi","Tespit edici","Haftalık","Firma iade süresi geçen ürünlerin ve kayıp tutarının analizi"],
   ["İade e-irsaliyelerinin düzenlenmemesi","4","2","e-irsaliye entegrasyonu ve hata raporu","Tespit edici","Günlük","İade kayıtları ile e-irsaliyelerin karşılaştırılması"]]},

 {id:"odemeler", ad:"Ödemelerin Yönetimi", s:"Hazine ve Nakit Yönetimi", alt:["Ödemelerin Yönetimi","Banka Hesaplarının Yönetimi Süreci"],
  anahtar:["ödeme","banka","talimat","iban","havale"], birim:"Finans Direktörlüğü – Hazine",
  amac:"Ödemelerin onaylı belgeye dayandığını, yetki matrisine uygun onaylandığını, mükerrer veya hatalı hesaba ödeme yapılmadığını ve banka hesaplarının düzenli mutabakatla izlendiğini değerlendirmek.",
  kk:"ödeme talimatlarının hazırlanması ve onayı, internet bankacılığı yetkileri, tedarikçi banka bilgisi değişiklikleri, mükerrer ödeme kontrolü ve banka mutabakatları",
  yontem:"Yetki matrisi ve banka imza yetkilerinin karşılaştırılması; ödeme verisinde mükerrer ödeme analizi; banka bilgisi değişikliklerinin tam taranması; mutabakatların incelenmesi.",
  belge:["Ödeme yetki matrisi ve imza sirküleri","İnternet bankacılığı kullanıcı ve yetki listeleri","Dönem ödeme listesi (tedarikçi, tutar, IBAN, onaylayan)","Tedarikçi banka bilgisi değişiklik kayıtları","Aylık banka mutabakatları"],
  rkm:[
   ["Yetkisiz kişilerin ödeme talimatı vermesi","5","2","İnternet bankacılığında çift imza ve yetki listesi","Önleyici","İşlem bazında","Banka yetki listelerinin imza sirküleriyle karşılaştırılması; 25 ödemede çift imza kontrolü"],
   ["Aynı faturanın mükerrer ödenmesi","4","2","Sistemde fatura no ve tutar bazında mükerrer kontrolü","Önleyici","İşlem bazında","Dönem ödeme verisinde tedarikçi, tutar ve tarih bazında mükerrer ödeme analizi"],
   ["Tedarikçi banka bilgisinin yetkisiz değiştirilerek ödemenin yanlış hesaba yapılması","5","2","Banka bilgisi değişikliği ikinci kişi onayı ve tedarikçiyle teyit","Önleyici","İşlem bazında","Dönemdeki tüm banka bilgisi değişikliklerinin teyit ve onay izinin incelenmesi"],
   ["Banka ve defter kayıtları arasındaki farkların gözden kaçması","4","2","Aylık banka mutabakatı ve yönetici onayı","Tespit edici","Aylık","Altı aylık mutabakatların ve açıklanmayan farkların incelenmesi"]]},

 {id:"bordro", ad:"Bordrolama", s:"Ücret ve Yan Hak Yönetimi", alt:["Bordrolama","Derecelendirme Ücret ve Yan Hak Yönetimi"],
  anahtar:["bordro","maaş","ücret","fazla mesai","yan hak"], birim:"İnsan Kaynakları ve İdari İşler Direktörlüğü – İK ve Bordro",
  amac:"Bordro hesaplamalarının doğru, onaylı ve yasal yükümlülüklere uygun yapıldığını; personel kayıtları ile bordro arasında tutarlılık olduğunu değerlendirmek.",
  kk:"personel ana verisi, ücret değişiklikleri, fazla mesai ve yan haklar, yasal kesintiler ve SGK bildirimleri, bordro ödemesi",
  yontem:"Bordro yeniden hesaplama; personel listesi ile bordro ve banka ödeme listesinin karşılaştırılması; ücret değişikliği onaylarının incelenmesi; veri analizi.",
  belge:["Dönem bordro dökümleri","Aktif personel listesi, işe giriş ve çıkışlar","Ücret değişikliği onayları","Fazla mesai onay kayıtları","SGK bildirgeleri ve muhtasar beyannameler","Maaş ödeme banka listeleri"],
  rkm:[
   ["Ayrılan veya hayali personele ücret ödenmesi","5","1","Bordro ile aktif personel listesinin aylık karşılaştırılması","Tespit edici","Aylık","Banka ödeme listesi, bordro ve personel listesinin üçlü karşılaştırılması"],
   ["Onaysız fazla mesai veya yan hak ödenmesi","4","3","Fazla mesai ve yan hakların ön onayı","Önleyici","İşlem bazında","40 fazla mesai kaydında onay kontrolü; mükerrer yan hak analizi"],
   ["Ücretin hatalı hesaplanması","4","2","Bordro kontrol listesi ve ikinci kişi kontrolü","Tespit edici","Aylık","3 aylık bordroda örneklem personel için yeniden hesaplama"],
   ["Onaysız ücret değişikliği yapılması","4","2","Ücret değişiklikleri İK müdürü ve GM onayına tabidir","Önleyici","İşlem bazında","Dönemdeki ücret değişikliklerinin onay belgeleriyle karşılaştırılması"]]},

 {id:"kampanya", ad:"Kampanya Planlama ve Yönetimi", s:"Ürün Yönetimi", alt:["Kampanya Planlama Ve Yönetimi"],
  anahtar:["kampanya","promosyon","firma katkı","mal fazlası"], birim:"Pazarlama Direktörlüğü – Kampanya",
  amac:"Kampanyaların onaylı planlara göre tanımlandığını, sistemde doğru uygulandığını, firma katkılarının eksiksiz tahsil edildiğini ve kampanya sonuçlarının ölçüldüğünü değerlendirmek.",
  kk:"kampanya planlaması ve onayı, sistem tanımları, firma katkı anlaşmaları ve tahsili, müşterilere duyurum ve kampanya sonrası değerlendirme",
  yontem:"Kampanya onaylarının incelenmesi; kampanya tanımlarının sistem verisiyle karşılaştırılması; firma katkı alacaklarının mutabakatı; kampanya etkinlik analizleri.",
  belge:["Dönem kampanya listesi ve onayları","Firma katkı anlaşmaları","Kampanya satış ve iskonto verisi","Firma katkı alacakları ve tahsilat durumu","Kampanya sonuç raporları"],
  rkm:[
   ["Onaysız kampanya tanımlanması","4","2","Kampanya tanımı öncesi yönetici onayı","Önleyici","İşlem bazında","Sistemdeki kampanya tanımlarının onay kayıtlarıyla karşılaştırılması"],
   ["Kampanya koşullarının sistemde hatalı tanımlanması","3","3","Tanım sonrası ikinci kişi kontrolü","Tespit edici","İşlem bazında","Örneklem kampanyalarda uygulanan iskonto ile tanımlı koşulların karşılaştırılması"],
   ["Firma katkılarının eksik veya geç tahsil edilmesi","4","3","Aylık firma katkı mutabakatı","Tespit edici","Aylık","Kampanya satış verisinden hak edilen katkının yeniden hesaplanması ve tahsilatla karşılaştırılması"],
   ["Kampanyaların etkinliğinin ölçülmemesi","2","3","Kampanya sonrası sonuç raporu","Tespit edici","İşlem bazında","Tamamlanan kampanyalarda sonuç raporu ve hedef karşılaştırması olup olmadığının kontrolü"]]},

 {id:"fiyat", ad:"Fiyatlandırma", s:"Pazar Geliştirme", alt:["Fiyatlandırma Stratejisi Tanımlama"],
  anahtar:["fiyat","fiyatlandırma","marj","kararname"], birim:"Satış Direktörlüğü – Fiyatlandırma",
  amac:"Satış fiyatlarının onaylı fiyat politikasına ve ilgili mevzuata uygun belirlendiğini, fiyat değişikliklerinin yetkili kişilerce yapıldığını ve manuel fiyat müdahalelerinin kontrol altında olduğunu değerlendirmek.",
  kk:"fiyat politikası ve marj kuralları, tedarikçi fiyat listesi güncellemeleri, fiyat değişikliği yetkileri, manuel fiyat ve özel fiyat uygulamaları",
  yontem:"Fiyat politikası incelemesi; sistem fiyatlarının tedarikçi fiyat listesiyle karşılaştırılması; fiyat değişiklik loglarının analizi; manuel fiyatlı satışların taranması.",
  belge:["Fiyat politikası ve marj kuralları","Tedarikçi fiyat listesi güncellemeleri","Fiyat değişikliği logları","Manuel ve özel fiyatlı satışlar listesi"],
  rkm:[
   ["Tedarikçi fiyat değişikliklerinin sisteme geç veya hatalı yansıtılması","4","3","Fiyat listesi yayımlandığında aynı gün toplu güncelleme ve kontrol","Önleyici","İşlem bazında","Son iki fiyat güncellemesinde sistem fiyatlarının tedarikçi listesiyle karşılaştırılması"],
   ["Yetkisiz fiyat değişikliği yapılması","4","2","Fiyat değiştirme yetkisi sınırlı rollerde","Önleyici","Sürekli","Fiyat değişiklik loglarının yetkili kullanıcı listesiyle karşılaştırılması"],
   ["Manuel veya özel fiyatla marj altı satış yapılması","4","3","Manuel fiyat girişinde onay zorunluluğu","Önleyici","İşlem bazında","Manuel fiyatlı satışlarda marj analizi ve onay kontrolü"]]},

 {id:"tedarikci-mutabakat", ad:"Tedarikçi Mutabakatı", s:"Tedarikçi Yönetimi", alt:["Tedarikçi Mutabakat Süreci","Tedarikçi & Ürün Kartı Açma"],
  anahtar:["mutabakat","tedarikçi","cari mutabakat","tedarikçi kartı"], birim:"Finans Direktörlüğü – Tedarikçi Cari Hesaplar",
  amac:"Tedarikçi cari hesaplarının düzenli mutabakatla doğrulandığını, farkların zamanında çözüldüğünü ve tedarikçi kartı açma işlemlerinin kontrollü yapıldığını değerlendirmek.",
  kk:"tedarikçi kartı açma ve değişiklik, dönemsel cari mutabakat, mutabakat farklarının çözümü, firma iade ve fiyat farkı faturaları",
  yontem:"Mutabakat dosyalarının incelenmesi; açık farkların yaşlandırılması; tedarikçi kartı değişikliklerinin taranması; örneklem tedarikçilerde bakiye doğrulaması.",
  belge:["Son dönem tedarikçi mutabakat mektupları ve yanıtları","Açık mutabakat farkları listesi","Tedarikçi kartı açma ve değişiklik logları","Fiyat farkı ve iade faturaları listesi"],
  rkm:[
   ["Tedarikçi bakiyelerinin mutabakatsız kalması","4","3","Çeyreklik cari mutabakat","Tespit edici","Çeyreklik","En büyük 20 tedarikçide mutabakat yapılıp yapılmadığının ve farkların kontrolü"],
   ["Mutabakat farklarının uzun süre çözülmemesi","3","3","Açık fark listesinin aylık takibi","Tespit edici","Aylık","90 günden eski farkların yaşlandırılması ve çözüm kayıtlarının incelenmesi"],
   ["Mükerrer veya hayali tedarikçi kartı açılması","5","2","Kart açmada vergi no kontrolü ve onay","Önleyici","İşlem bazında","Tedarikçi ana verisinde vergi no, IBAN ve adres bazında mükerrer analizi"]]},

 {id:"sevkiyat", ad:"Sevkiyat Yönetimi", s:"Lojistik Yönetimi", alt:["Sevkiyat Yönetimi","Hazırlama ve Paketleme","3. Taraf nakliye Firmalarının Yönetimi"],
  anahtar:["sevkiyat","teslimat","nakliye","dağıtım","paketleme"], birim:"Lojistik ve Operasyon Direktörlüğü – Sevkiyat",
  amac:"Siparişlerin doğru hazırlanıp zamanında teslim edildiğini, teslimat hatalarının izlendiğini ve üçüncü taraf nakliye hizmetlerinin sözleşmeye uygun faturalandığını değerlendirmek.",
  kk:"sipariş hazırlama ve kontrol, sevkiyat planlaması, teslimat performansı, hatalı ve eksik teslimatlar, nakliye firması faturaları",
  yontem:"Teslimat performans verisinin analizi; hatalı teslimat kayıtlarının incelenmesi; nakliye faturalarının sözleşme tarifesiyle karşılaştırılması; depoda süreç gözlemi.",
  belge:["Teslimat performans raporları (zamanında teslim oranı)","Hatalı / eksik teslimat şikâyet kayıtları","Nakliye sözleşmeleri ve tarife","Nakliye faturaları"],
  rkm:[
   ["Siparişin hatalı veya eksik hazırlanması","3","3","Barkodlu toplama ve çıkış kontrolü","Önleyici","İşlem bazında","Hatalı teslimat kayıtlarının kök neden analizi; çıkış kontrolünün gözlemlenmesi"],
   ["Teslimatların geç yapılması","3","4","Günlük teslimat performans takibi","Tespit edici","Günlük","Zamanında teslim oranının rota ve şube bazında analizi"],
   ["Nakliye faturalarının sözleşmeye aykırı tutarda ödenmesi","4","2","Faturaların tarifeyle kontrolü ve onayı","Tespit edici","Aylık","Nakliye faturalarının sefer verisi ve tarifeyle yeniden hesaplanması"]]},

 {id:"yetkilendirme", ad:"Yetkilendirme Yönetimi", s:"BT Operasyon Yönetimi", alt:["Yetkilendirme Yönetimi"],
  anahtar:["yetki","kullanıcı","erişim","rol","şifre"], birim:"Genel Müdürlük – Bilgi Teknolojileri",
  amac:"ERP ve kritik uygulamalarda kullanıcı yetkilerinin iş ihtiyacına göre, onaylı şekilde verildiğini, ayrılan personelin erişiminin zamanında kapatıldığını ve yetkilerin düzenli gözden geçirildiğini değerlendirmek.",
  kk:"kullanıcı açma, yetki değişikliği ve kapatma, kritik ve süper kullanıcı yetkileri, periyodik yetki gözden geçirmesi, görevler ayrılığı",
  yontem:"Kullanıcı listesinin İK aktif personel listesiyle karşılaştırılması; yetki taleplerinin örneklemle incelenmesi; kritik yetkiler ve görevler ayrılığı çakışmaları için veri analizi.",
  belge:["ERP ve kritik uygulama kullanıcı listeleri (rol, son giriş tarihi)","Dönem yetki talep ve onay kayıtları","İK işten çıkış listesi","Süper kullanıcı / yönetici hesap listesi","Son yetki gözden geçirme çalışması"],
  rkm:[
   ["Ayrılan personelin kullanıcı hesabının açık kalması","4","3","İK çıkış bildirimiyle aynı gün hesap kapatma","Önleyici","İşlem bazında","Kullanıcı listesinin işten çıkış listesiyle karşılaştırılması"],
   ["Onaysız veya iş ihtiyacı dışında yetki verilmesi","4","3","Yetki talebinin yönetici ve süreç sahibi onayı","Önleyici","İşlem bazında","25 yetki değişikliğinde onay kaydının kontrolü"],
   ["Çakışan yetkilerle görevler ayrılığının ihlal edilmesi","4","2","Rol tasarımında çakışma matrisi","Önleyici","Sürekli","Kullanıcı rollerinin çakışma matrisiyle analizi"],
   ["Yetkilerin düzenli gözden geçirilmemesi","3","3","Altı aylık yetki gözden geçirmesi","Tespit edici","Yıllık","Son gözden geçirme çalışmasının kapsam ve sonuçlarının incelenmesi"]]},

 {id:"sozlesme", ad:"Sözleşmelerin Yönetimi", s:"Hukuki İşlemlerinin Yönetimi", alt:["Sözleşmelerin Yönetimi"],
  anahtar:["sözleşme","hukuk","anlaşma"], birim:"Genel Müdürlük – Hukuk",
  amac:"Sözleşmelerin hukuki görüş alınarak, yetkili kişilerce imzalandığını, merkezi olarak saklandığını ve süre, yenileme ve yükümlülüklerin takip edildiğini değerlendirmek.",
  kk:"sözleşme taslağı ve hukuki görüş, imza yetkileri, sözleşme arşivi, süre ve yenileme takibi, teminatlar",
  yontem:"Sözleşme envanterinin incelenmesi; örneklem sözleşmelerde görüş ve imza yetkisi kontrolü; süresi dolan ve yenilenen sözleşmelerin analizi.",
  belge:["Sözleşme envanteri (taraf, konu, süre, tutar)","İmza sirküleri ve yetki devri kararları","Örneklem sözleşmeler ve hukuki görüşler","Teminat mektupları listesi"],
  rkm:[
   ["Hukuki görüş alınmadan sözleşme imzalanması","4","3","Sözleşme imzadan önce hukuk onayına tabidir","Önleyici","İşlem bazında","20 sözleşmede hukuki görüş kaydının kontrolü"],
   ["Yetkisiz kişilerce sözleşme imzalanması","4","2","İmza sirküleri ve yetki devri","Önleyici","İşlem bazında","İmzacıların imza sirkülerindeki yetkilerle karşılaştırılması"],
   ["Süresi dolan sözleşmelerin fark edilmeden devam etmesi","3","3","Sözleşme envanterinde süre uyarısı","Tespit edici","Aylık","Süresi dolan sözleşmelerde yenileme veya fesih kaydının kontrolü"]]}
];

const BOYUT_ACIK = {Uygunluk:"mevzuat ve iç düzenlemelere uyum",Mali:"kayıt, tutar ve mutabakat doğruluğu",Performans:"etkinlik, verimlilik ve hedef gerçekleşmesi",Sistem:"kontrol tasarımı, onay akışları ve görevler ayrılığı",BT:"sistem erişimi, veri bütünlüğü ve uygulama kontrolleri"};
const BOYUT_YONTEM = {Uygunluk:"mevzuat ve prosedür karşılaştırması, örneklem uyum testleri",Mali:"kayıt ve tutarların belge ve mutabakatlarla doğrulanması, yeniden hesaplama",Performans:"KPI ve hedef gerçekleşme analizi, dönemsel karşılaştırma",Sistem:"süreç yürüyüşü, onay akışı ve görevler ayrılığı testleri",BT:"kullanıcı yetki ve log incelemesi, veri analitiği"};
const BOYUT_RKM = {
 Uygunluk:o=>[`${o} işlemlerinin ilgili mevzuat, YK kararları ve iç prosedürlere aykırı yürütülmesi`,"Yazılı prosedür ve onay mekanizması","Yönlendirici","İşlem bazında",`Prosedürün mevzuatla karşılaştırılması; 25 işlemlik örneklemde prosedüre uyumun test edilmesi`],
 Mali:o=>[`${o} işlemlerinin hatalı tutarla veya yanlış döneme kaydedilmesi`,"Aylık mutabakat ve yönetici gözden geçirmesi","Tespit edici","Aylık",`Örneklem işlemlerin belge ve muhasebe kayıtlarıyla mutabakatı; tutarların yeniden hesaplanması`],
 Performans:o=>[`${o} sürecinin süre, maliyet ve kalite hedeflerini karşılamaması`,"KPI takibi ve dönemsel yönetim raporlaması","Tespit edici","Aylık",`Son iki dönem KPI verilerinin hedeflerle karşılaştırılması; sapmaların kök neden analizi`],
 Sistem:o=>[`${o} sürecinde onay adımlarının atlanması veya görevler ayrılığının sağlanamaması`,"Sistem içi onay akışı ve rol ayrımı","Önleyici","İşlem bazında",`Süreç yürüyüşü; yetki matrisi ile kullanıcı rollerinin karşılaştırılması`],
 BT:o=>[`${o} için kullanılan sistemde yetkisiz erişim veya kayıt değişikliği yapılması`,"Rol bazlı yetkilendirme ve değişiklik logları","Tespit edici","Aylık",`Kullanıcı yetki listesi ve değişiklik loglarının incelenmesi`]
};
