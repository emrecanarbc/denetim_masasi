"use strict";
try{ document.documentElement.lang="tr"; }catch(e){}
/* ============ Yardımcılar ============ */
const TODAY = (()=>{const d=new Date();d.setHours(0,0,0,0);return d;})();
const iso = d => { const z=new Date(d); z.setMinutes(z.getMinutes()-z.getTimezoneOffset()); return z.toISOString().slice(0,10); };
const addDays = n => { const d=new Date(TODAY); d.setDate(d.getDate()+n); return iso(d); };
const fmt = s => { if(!s) return "—"; const [y,m,d]=s.split("-"); return `${d}.${m}.${y}`; };
const daysUntil = s => s ? Math.round((new Date(s+"T00:00:00") - TODAY)/86400000) : null;
const daysBetween = (a,b) => (a&&b) ? Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000) : 0;
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const upTR = s => String(s||"").toLocaleUpperCase("tr-TR");
let _id = Date.now()%100000;
const uid = p => (p||"x") + (++_id).toString(36);
const nowStamp = () => { const d=new Date(); return iso(d)+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
const num2 = n => (Math.round(n*100)/100).toFixed(2).replace(".",",");
const pad2 = n => String(n).padStart(2,"0");

/* ============ Sabitler ============ */
const STAGES = ["Planlama","Hazırlık","Açılış","Saha","Bulgu paylaşımı","Kapanış ve rapor","Değerlendirme","Tamamlandı"];
const KATEGORILER = ["Finans ve Muhasebe","Hazine ve Nakit Yönetimi","Satış ve Müşteri İlişkileri","Satın Alma ve Tedarik","Stok ve Depo Yönetimi","Lojistik ve Dağıtım","İnsan Kaynakları","Bilgi Teknolojileri","Yasal Uyum ve Mevzuat","İdari İşler (bina, filo, sigorta)","Diğer"];
const SUREKLI_ALAN = ["Kasa sayımları","Şube performans analizi","Veri analitiği","Mevzuat takibi","Raporlama","Metodoloji","Arşiv ve dokümantasyon","Diğer"];
const SIKLIK_GUN = {"Tek sefer":0,"Haftalık":7,"Aylık":30,"Çeyreklik":90};
const TEST_SONUC = ["Etkin","Kısmen etkin","Etkin değil"];
const GEN5 = ["Etkisi yok denecek kadar az","Düşük","Orta","Yüksek","Çok yüksek"];
const FIN_KZ = ["≤ 10 bin TL gider/gelir etkisi","10 bin – 100 bin TL","100 bin – 1 mn TL","1 mn – 10 mn TL","> 10 mn TL"];
const FACTORS = [
 {k:"fin",q:"Bulgunun finansal etkisi var mı?",subs:[
  {k:"fin_hacim",l:"Yüksek işlem hacmi",w:.10,o:["≤ 4,5 mn TL alış/satış hacmi","4,5 mn – 45 mn TL","45 mn – 450 mn TL","450 mn – 4,5 mlr TL","> 4,5 mlr TL"]},
  {k:"fin_fraud",l:"Suistimal (fraud)",w:.05,o:FIN_KZ},
  {k:"fin_kredi",l:"Kredi, likidite, kur ve sigorta",w:.10,o:FIN_KZ}]},
 {k:"op",q:"Operasyonu etkiliyor mu?",subs:[
  {k:"op_tehlike",l:"İşin tehlike boyutu, işin durması",w:.10,o:["Zarar veya aksaklık yok","Kısa aksama, küçük yaralanma","Ciddi aksama, tedavi gerektiren yaralanma","Uzun süreli duruş, ciddi sakatlanma","Faaliyetin durması, ölümlü kaza"]},
  {k:"op_ik",l:"İK, performans, yetki, iletişim",w:.05,o:GEN5},
  {k:"op_urun",l:"Ürün-hizmet kalitesi, fiyatlama, uzmanlık",w:.05,o:GEN5},
  {k:"op_bt",l:"Karmaşıklık, BT, bilgi güvenliği, otomasyon",w:.05,o:["Tam otomasyon, karmaşık değil","Otomasyon yüksek","Otomasyon ve manuel müdahale birlikte","Karmaşık, işlemlerin çoğu manuel","Çok karmaşık, tamamen manuel"]}]},
 {k:"yasal",q:"Yasal yaptırım doğurabilir mi?",subs:[
  {k:"yasal",l:"Yasal risk maruziyeti",w:.15,o:["Resmi kurumdan uyarı","Küçük idari-mali ceza","Kınama ve idari-mali ceza","Önemli finansal ve hukuki yükümlülük","Faaliyeti durduracak ceza"]}]},
 {k:"yon",q:"Yönetim kararını veya paydaşları etkiliyor mu?",subs:[
  {k:"yon_butce",l:"Bütçe, planlama, raporlama",w:.05,o:["Hata veya gecikme yok","Küçük hata, kısa gecikme","Hatalı raporlama, yanlış karar","Çok hatalı raporlama, çok yanlış karar","Raporlama yapılamıyor, karar alınamıyor"]},
  {k:"yon_paydas",l:"Rekabet, paydaş memnuniyeti, tedarikçi bağımlılığı",w:.10,o:["Etkisi yok","Kısa süreli küçük kayıp","Tolere edilebilir kayıp","Ciddi düşüş, rekabet avantajı kaybı","Kalıcı kayıp, pazar payında çok ciddi düşüş"]}]},
 {k:"imaj",q:"İmaj / itibar kaybı yaratır mı?",subs:[
  {k:"imaj",l:"İmaj / itibar",w:.10,o:["Medyaya yansımaz","Lokal medya, kısa süreli","Ulusal medya, kısa süreli","Satışlarda orta vadeli düşüş","Uzun süreli ciddi itibar kaybı"]}]},
 {k:"dis",q:"Dış etkenlere açıklığı artırıyor mu?",subs:[
  {k:"dis_kriz",l:"Politik / ekonomik kriz, afet",w:.05,o:["Etkilenmez","Önemsiz zarar","Kısa süreli ara","Uzun süreli ara","Faaliyet durur"]},
  {k:"dis_rakip",l:"Rakipler ve talep trendleri",w:.05,o:["Etkilenmez","Önemsiz zarar","Kısa süreli ara","Uzun süreli ara","Faaliyet durur"]}]}
];
const SUBS = FACTORS.flatMap(f=>f.subs.map(s=>({...s,f:f.k})));
const ONEM_BY_ETKI = [null,"Düşük","Düşük","Orta","Yüksek","Çok Yüksek"];
const ONEM_LIST = ["Çok Yüksek","Yüksek","Orta","Düşük"];
const TERMIN_GUN = {"Çok Yüksek":30,"Yüksek":45,"Orta":60,"Düşük":90};
const bulguPuan = sc => Math.round(SUBS.reduce((t,s)=>t+(+(sc||{})[s.k]||0)*s.w,0)*100)/100;
const maxEtki = sc => Math.max(0,...SUBS.map(s=>+(sc||{})[s.k]||0));
const onemHesap = sc => ONEM_BY_ETKI[maxEtki(sc)] || null;
const onemOf = f => (f.onemOverride && f.onemOverride.duzey) || onemHesap(f.scores);
const onemCls = d => ({"Çok Yüksek":"c-crit","Yüksek":"c-high","Orta":"c-warn","Düşük":"c-ok"})[d]||"";
const riskDuzey = p => p>=4 ? "Çok Yüksek" : p>=3.55 ? "Yüksek" : p>=3.1 ? "Orta" : "Düşük";
const sonucCls = s => ({"Etkin":"c-ok","Kısmen etkin":"c-warn","Etkin değil":"c-crit"})[s]||"";

const EK3_ROWS = ["Denetim amaçlarının belirlenmesi","Bilgi toplama / ön araştırma","Açılış toplantısı","Potansiyel sorunlu alanların belirlenmesi","Bireysel çalışma planının hazırlanması","Denetim testlerinin uygulanması","Bulguların oluşturulması ve önerilerin geliştirilmesi","Bulguların denetlenen ile paylaşılması","Kapanış toplantısı","Taslak denetim raporunun hazırlanması ve gönderilmesi","Nihai denetim raporunun hazırlanması ve sunumu"];
const EK3_STAGE = [1,1,2,1,2,3,3,4,5,5,5];
const EK15_Q = ["Yürütülen hizmetlerle ilgili mevcut süreçler nelerdir, hangi alt süreçlerden oluşur?","Sürecin temel önceliği nedir? Üretilen çıktının değeri (parasal olan / olmayan) nedir?","Süreç nasıl başlar, hangi birimler görev alır, temel girdiler ve kullanılan BT sistemleri nelerdir?","Sürecin çıktıları nelerdir, kimler kullanır, belirlenmiş süreler var mıdır?","Sürece ilişkin dokümantasyon ve düzenli raporlar bulunmakta mıdır?","Hedefler için ne gibi ilave kaynak ve imkân gerekir?","Bu süreçte ortaya çıkabilecek en önemli sorun nedir?","Geçmişte bu süreçte karşılaşılan en önemli sorun nedir?","Kriz anında sürecin işlemesini sağlayacak alternatifler var mıdır?"];
const EK5_GUNDEM = "- Denetimin amacı ve kapsamı\n- Denetim yöntemi\n- Denetim sonuçlarının ne şekilde paylaşılacağı\n- Denetimin tahmini süresi\n- Denetime yardımcı olacak personel ve çalışanlardan beklentiler\n- Birimin denetimden beklentileri\n- Denetim ekibi ile birim arasındaki iletişimin nasıl gerçekleştirileceği\n- Denetimin sağlayacağı faydalar";
const EK14_K = ["Bireysel çalışma planının ve denetim kapsamının belirlenen sürede hazırlanması","Çalışma kağıtlarının ve çalışma planının riskli alanları kapsaması ve kontrollerin etkinliğini ölçmeye yeterli olması","Bireysel çalışma planının karşılaşılan durumlara uygun olarak revize edilmesi","Doğru başlıklandırılmış, numaralandırılmış ve çapraz referanslı çalışma kağıtları","Her bir denetim bulgusunun çalışma kağıtları ile desteklenmesi","Bulgu formundaki tespit, neden, risk ve etkileri, kriter ve öneri alanlarının uygun doldurulması","Bulguların eksiksiz doğrulanması ve ilgili bütün yöneticilerle paylaşılması","Denetimin ve çalışma kağıtlarının zamanında tamamlanması ve teslim edilmesi"];
const EK14_O = ["Çok iyi","İyi","Orta","Yetersiz"];
const KONTROL_TUR = ["Önleyici","Tespit edici","Yönlendirici","Düzeltici","Telafi edici"];
const SIKLIK = ["Günlük","Haftalık","Aylık","Yıllık","İşlem bazında","Düzensiz","Tek sefer"];

/* Form tanımları: stage = açıldığı aşama */
const FORMS = {
 EK1:{title:"EK-1 Denetim Bildirimi",stage:1,approval:true,fields:[
   {k:"kapsam",l:"Denetimin kapsamı",t:"textarea",hint:"Kesin kapsam açılış görüşmelerinde netleşir."},
   {k:"baslangic",l:"Denetimin başlama tarihi",t:"date"},
   {k:"ykOnay",l:"Denetim planının YK onay tarihi",t:"date",hint:"Plan kaydından otomatik gelir."}]},
 EK3:{title:"EK-3 Denetim Süre Planı",stage:1,custom:"sure"},
 EK15:{title:"EK-15 Süreç Bilgi Formu",stage:1,fields:EK15_Q.map((q,i)=>({k:"q"+(i+1),l:(i+1)+". "+q,t:"textarea"}))},
 EK6:{title:"EK-6 Risk Kontrol Matrisi",stage:1,custom:"rows",cols:[
   {k:"risk",l:"Risk tanımı",t:"textarea"},{k:"etki",l:"Etki",t:"sel",o:["1","2","3","4","5"]},{k:"olas",l:"Olasılık",t:"sel",o:["1","2","3","4","5"]},
   {k:"kontrol",l:"Kontrol tanımı",t:"textarea"},{k:"tur",l:"Kontrol türü",t:"sel",o:KONTROL_TUR},{k:"siklik",l:"Sıklık",t:"sel",o:SIKLIK},
   {k:"test",l:"Test prosedürü",t:"textarea"}]},
 EK7:{title:"EK-7 Denetim Programı",stage:1,fields:[
   {k:"amac",l:"II. Denetimin amaç ve hedefleri",t:"textarea"},
   {k:"kapsam",l:"III. Denetimin kapsamı",t:"textarea",hint:"Raporun B bölümüne aktarılır."},
   {k:"yontem",l:"IV. Yöntem",t:"textarea",hint:"Raporun C bölümüne aktarılır."},
   {k:"onceki",l:"V. Önceki denetime ilişkin bilgiler",t:"textarea",hint:"Arşivden otomatik doldu."},
   {k:"hazirlik",l:"VI. Hazırlık çalışmaları",t:"textarea"},
   {k:"testler",l:"VII. Testler",t:"textarea",hint:"Risk Kontrol Matrisi'ndeki test prosedürlerinden otomatik."}]},
 EK5:{title:"EK-5 Açılış Toplantısı Tutanağı",stage:2,note:"Denetim Açılış Toplantı Formu ile birleştirildi.",fields:[
   {k:"yonetici",l:"Denetlenen birim yöneticisi (ad, unvan)",t:"text"},
   {k:"personel",l:"Toplantıya katılan birim personeli",t:"text"},
   {k:"irtibat",l:"Denetimde irtibat kurulacak personel",t:"text"},
   {k:"yerTarih",l:"Toplantı yeri ve tarihi",t:"text"},
   {k:"gundem",l:"Gündeme getirilen konular",t:"textarea"},
   {k:"notlar",l:"Toplantı notları",t:"textarea"}]},
 EK8:{title:"EK-8 Bireysel Çalışma Programı",stage:2,approval:true,custom:"rows",note:"Her satır bir testtir ve Risk Kontrol Matrisi'ndeki bir satıra bağlıdır. Satırlar RKM'den otomatik gelir.",cols:[
   {k:"rkm",l:"RKM satırı",t:"rkm"},{k:"test",l:"Uygulanacak test",t:"textarea"},{k:"birim",l:"İlgili birim",t:"text"},{k:"denetci",l:"İç denetçi",t:"team"},
   {k:"bas",l:"Başlama",t:"date"},{k:"bit",l:"Bitiş",t:"date"}]},
 EK11:{title:"EK-11 Kapanış Toplantısı Tutanağı",stage:5,fields:[
   {k:"katilimcilar",l:"Katılımcılar",t:"text",hint:"EK-5'ten otomatik"},
   {k:"yerTarih",l:"Toplantı yeri ve tarihi",t:"text"},
   {k:"gundem",l:"Gündeme getirilen konular",t:"textarea",hint:"Bulgular ve birim görüşleri otomatik eklendi."}]},
 EK14:{title:"EK-14 Denetçi Değerlendirme Formu",stage:6,custom:"ek14",mudurOnly:true},
 EK13:{title:"EK-13 Denetim Süreci Anket Formu",stage:6,faz2:true},
 PERS:{title:"Denetim Görevine İlişkin Personel Anketi",stage:3,faz2:true}
};

/* ============ Örnek veri ============ */
function seed(){
 const users=[
  {id:"u1",name:"Ayşe Tan",role:"mudur",title:"İç Denetim Müdürü"},
  {id:"u2",name:"Burak Şen",role:"yonetici",title:"İç Denetim Yöneticisi"},
  {id:"u3",name:"Can Yıldız",role:"denetci",title:"İç Denetçi"},
  {id:"u4",name:"Deniz Ak",role:"denetci",title:"İç Denetçi"}];
 const P=(id,surec,fonksiyon,puan,saat,tur)=>({id,surec,fonksiyon,puan,duzey:riskDuzey(puan),saat,tur:tur||"D",yil:2026});
 const plan=[
  P("p1","Hazine ve Nakit Yönetimi","Finans Direktörlüğü",3.95,240),
  P("p2","Satış Stratejisi Geliştirme","Satış Direktörlüğü",3.70,160),
  P("p3","Tedarik Yönetimi","Satış Direktörlüğü, Lojistik ve Operasyon Direktörlüğü",4.05,240),
  P("p4","Envanter Yönetimi","Satış Direktörlüğü, Lojistik ve Operasyon Direktörlüğü",3.55,240),
  P("p5","Lojistik Yönetimi","Lojistik ve Operasyon Direktörlüğü",3.30,240),
  P("p6","Ücret ve Yan Hak Yönetimi","İnsan Kaynakları ve İdari İşler Direktörlüğü",3.20,160),
  P("p7","Sigorta Süreçleri","Finans Direktörlüğü",3.35,160),
  P("p9","Filo Yönetimi","İnsan Kaynakları ve İdari İşler Direktörlüğü",2.95,120,"C"),
  P("p8","Personel Yönetimi","İnsan Kaynakları ve İdari İşler Direktörlüğü",3.15,160),
  P("p10","Doküman Yönetimi","Pazarlama Direktörlüğü",1.95,80)];
 const done = st => ({status:st||"tamam",data:{},at:addDays(-200)});
 const allDone = () => ({EK1:done("onayli"),EK3:done(),EK15:done(),EK7:done(),EK6:done(),EK5:done(),EK8:done("onayli"),EK11:done(),EK14:done()});
 const rep = (tarih) => ({status:"nihai",tarih,giris:"",sonuc:"",ozet:{riskler:"",etkiler:"",cozumler:""},sira:"puan"});
 const SD = offs => { const o={}; offs.forEach((d,i)=>{ if(d!=null) o[i]=addDays(d); }); return o; };
 const A=(o)=>Object.assign({tur:"D",status:"aktif",gecmisIncelendi:true,forms:{},ek4:[],rapor:{status:"yok",ozet:{riskler:"",etkiler:"",cozumler:""},sira:"puan"},puan:null,stageDates:{}},o);
 const R=(id,risk,etki,olas,kontrol,tur,siklik,test)=>({id,risk,etki,olas,kontrol,tur,siklik,test});
 const X=(id,rkm,test,birim,denetci,bas,bit)=>({id,rkm,test,birim,denetci,bas:addDays(bas),bit:addDays(bit)});
 const W=(id,ref,testId,rkmId,o)=>Object.assign({id,ref,testId,rkmId,dosya:"",onay:true,bulguGerekmez:""},o);

 /* 2026/D-05 Hazine – bağlantılı örnek (Saha aşamasında) */
 const a4rkm=[
  R("r1","Yetkisiz kişilerin banka talimatı vermesi","5","3","İnternet bankacılığında çift imza","Önleyici","İşlem bazında","25 ödeme talimatında çift imza ve yetki listesi kontrolü"),
  R("r2","Banka ve defter kayıtları arasındaki farkların gözden kaçması","4","2","Aylık banka mutabakatı","Tespit edici","Aylık","6 aylık mutabakatların incelenmesi"),
  R("r3","Hatalı nakit pozisyon bilgisiyle finansman kararı alınması","3","3","Günlük nakit raporunun yönetici onayı","Önleyici","Günlük","20 günlük nakit pozisyon raporunda onay izinin kontrolü"),
  R("r4","Kasada açık veya zimmet oluşması","4","2","Periyodik kasa sayımı ve mutabakatı","Tespit edici","Aylık","Sürpriz kasa sayımı ve son 3 ayın sayım tutanakları")];
 const a4ek8=[X("x1","r1","25 ödeme talimatında çift imza ve yetki listesi kontrolü","Hazine","u3",-15,-6),X("x2","r2","6 aylık mutabakatların incelenmesi","Hazine","u4",-15,-8),X("x3","r3","20 günlük nakit pozisyon raporunda onay izinin kontrolü","Hazine","u3",-10,-4),X("x4","r4","Sürpriz kasa sayımı ve son 3 ayın sayım tutanakları","Hazine / Muhasebe","u3",-3,2)];
 /* 2026/D-04 Ücret – değerlendirme aşamasında */
 const a3rkm=[R("r1","Onaysız fazla mesai ödenmesi","4","3","Fazla mesai ön onayı","Önleyici","İşlem bazında","40 fazla mesai kaydında onay kontrolü"),R("r2","Bordroda hatalı ücret hesaplanması","4","2","Bordro kontrol listesi","Tespit edici","Aylık","3 aylık bordro yeniden hesaplama"),R("r3","Yan hak ödemelerinin mükerrer yapılması","3","3","Mükerrer kayıt kontrolü","Önleyici","Aylık","Yemek ve yol yardımında mükerrer kayıt analizi")];
 const a3ek8=[X("x1","r1","40 fazla mesai kaydında onay kontrolü","İK","u4",-60,-52),X("x2","r2","3 aylık bordro yeniden hesaplama","İK / Bordro","u4",-58,-48),X("x3","r3","Yemek ve yol yardımında mükerrer kayıt analizi","İK / Bordro","u3",-55,-47)];

 const audits=[
  A({id:"a1",no:"2025/D-04",planId:"p4",surec:"Envanter Yönetimi",konu:"Envanter Yönetimi Süreçleri Denetimi",birim:"Depo ve Envanter Müdürlüğü",ekip:["u3","u4"],sorumlu:"u4",stage:7,status:"tamamlandi",start:addDays(-360),end:addDays(-318),forms:allDone(),rapor:rep(addDays(-312)),puan:{deger:4,yorum:"Kapsam iyi, rapor zamanında."},stageDates:SD([-362,-360,-352,-345,-330,-322,-312,-305])}),
  A({id:"a2",no:"2026/D-02",planId:"p7",surec:"Sigorta Süreçleri",konu:"Sigorta Süreçleri Denetimi",birim:"Finans – Sigorta Birimi",ekip:["u3","u2"],sorumlu:"u3",stage:7,status:"tamamlandi",start:addDays(-250),end:addDays(-222),forms:allDone(),rapor:rep(addDays(-217)),puan:{deger:5,yorum:""},stageDates:SD([-252,-250,-244,-239,-229,-224,-217,-210])}),
  A({id:"a3",no:"2026/D-04",planId:"p6",surec:"Ücret ve Yan Hak Yönetimi",konu:"Ücret ve Yan Hak Yönetimi Denetimi",birim:"İnsan Kaynakları Müdürlüğü",ekip:["u4","u3"],sorumlu:"u4",stage:6,start:addDays(-80),end:addDays(-12),stageDates:SD([-85,-80,-70,-62,-40,-25,-6]),
     forms:Object.assign(allDone(),{EK14:{status:"bos",data:{}},EK6:{status:"tamam",data:{rows:a3rkm}},EK8:{status:"onayli",data:{rows:a3ek8}},EK3:{status:"tamam",data:{rows:[3,4,1,2,2,12,4,3,1,3,2].map((p,i)=>({p:String(p),r:"",g:String([3,5,1,2,3,15,5,4,1,4,2][i])})),gerekce:""}}}),rapor:rep(addDays(-6)),
     ek4:[W("w1","ÇK-04-01","x1","r1",{test:"40 fazla mesai kaydında onay kontrolü",amac:"Fazla mesainin onaylı yapıldığını doğrulamak",yontem:"Örneklem, e-posta onayları",bilgi:"11 kayıtta onay e-postası bulunamadı.",sonuc:"Kısmen etkin",hazirlayan:"u4",tarih:addDays(-53)}),
          W("w2","ÇK-04-02","x2","r2",{test:"3 aylık bordro yeniden hesaplama",amac:"Ücret hesaplamasının doğruluğu",yontem:"Yeniden hesaplama",bilgi:"Fark bulunmadı.",sonuc:"Etkin",hazirlayan:"u4",tarih:addDays(-49)}),
          W("w3","ÇK-04-03","x3","r3",{test:"Yemek ve yol yardımında mükerrer kayıt analizi",amac:"Mükerrer ödemeyi tespit etmek",yontem:"Veri analizi",bilgi:"6 personele aynı ay için iki kayıt girilmiş.",sonuc:"Etkin değil",hazirlayan:"u3",tarih:addDays(-47)})]}),
  A({id:"a4",no:"2026/D-05",planId:"p1",surec:"Hazine ve Nakit Yönetimi",konu:"Hazine ve Nakit Yönetimi Denetimi",birim:"Finansman ve Hazine Müdürlüğü",ekip:["u3","u4"],sorumlu:"u3",stage:3,start:addDays(-24),end:addDays(16),stageDates:SD([-26,-24,-18,-15]),
     forms:{
      EK1:{status:"onayli",at:addDays(-24),data:{kapsam:"Banka hesaplarının yönetimi, günlük nakit pozisyonu, ödeme onay süreçleri ve kasa işlemleri (01.01.2026 – 30.06.2026).",baslangic:addDays(-24),ykOnay:"2025-01-15"}},
      EK3:{status:"onay_bekliyor",at:addDays(-1),data:{rows:["2","4","1","2","2","10","4","2","1","3","2"].map(p=>({p,r:"",g:""})),gerekce:""},history:[{tip:"Onaya gönderildi",by:"u3",at:addDays(-1)+" 17:20",data:{rows:["2","4","1","2","2","10","4","2","1","3","2"].map(p=>({p,r:"",g:""})),gerekce:""}}]},
      EK15:{status:"tamam",at:addDays(-21),data:{q1:"Banka hesap yönetimi, nakit planlama, ödeme süreçleri ve kasa işlemleri.",q2:"Ödemelerin zamanında ve doğru yapılması; likiditenin korunması.",q3:"Ödeme talepleri ERP üzerinden gelir; hazine ekibi internet bankacılığı ile işler. İki kişilik ekip.",q7:"Yetkisiz ödeme talimatı ve yanlış hesaba transfer.",q8:"Geçen yıl bir bankada imza sirküleri güncellenmediği için ödeme gecikti."}},
      EK6:{status:"tamam",at:addDays(-20),data:{rows:a4rkm}},
      EK7:{status:"onayli",at:addDays(-19),history:[{tip:"Onaya gönderildi",by:"u3",at:addDays(-20)+" 10:05",data:{}},{tip:"Müdür değiştirerek onayladı",by:"u1",at:addDays(-19)+" 09:40",data:{},changes:[{l:"III. Denetimin kapsamı",b:"01.01.2026 – 30.06.2026 dönemi banka ve ödeme işlemleri.",a:"01.01.2026 – 30.06.2026 dönemi banka, kasa ve ödeme işlemleri."}]}],data:{amac:"Hazine ve nakit yönetimi süreçlerindeki iç kontrollerin tasarım ve işleyiş etkinliğini değerlendirmek.",kapsam:"01.01.2026 – 30.06.2026 dönemi banka, kasa ve ödeme işlemleri.",yontem:"Görüşme, doküman incelemesi, örneklem testleri, veri analizi.",onceki:"Bu süreçte daha önce denetim yapılmamıştır.",hazirlik:"Süreç bilgi formu ve açılış toplantısı notları özetlendi.",testler:a4rkm.map((r,i)=>`R-${pad2(i+1)} ${r.risk}: ${r.test}`).join("\n")}},
      EK5:{status:"tamam",at:addDays(-18),data:{yonetici:"Finansman ve Hazine Müdürü",personel:"Hazine uzmanları (2 kişi)",irtibat:"Hazine Uzmanı",yerTarih:"Genel Müdürlük toplantı salonu, "+fmt(addDays(-18)),gundem:EK5_GUNDEM,notlar:"Birim, ödeme onay adımlarının ERP'ye taşınması projesini paylaştı. Kasa sayımlarının muhasebe ile birlikte yapıldığı belirtildi."}},
      EK8:{status:"onayli",at:addDays(-16),data:{rows:a4ek8}}},
     ek4:[
      W("w1","ÇK-05-01","x1","r1",{test:"25 ödeme talimatında çift imza ve yetki listesi kontrolü",amac:"Ödemelerin yetki matrisine uygun, çift imzayla onaylandığını doğrulamak",yontem:"25 ödeme talimatı örneklemi, internet bankacılığı logları",bilgi:"3 talimatta tek imza ile işlem yapıldığı görüldü. İlgili bankada çift imza kuralı tanımlı değil.",sonuc:"Kısmen etkin",hazirlayan:"u3",tarih:addDays(-7)}),
      W("w2","ÇK-05-02","x2","r2",{test:"6 aylık mutabakatların incelenmesi",amac:"Aylık mutabakatların eksiksiz ve zamanında yapıldığını doğrulamak",yontem:"6 aylık mutabakat dosyaları",bilgi:"Mutabakatlar zamanında hazırlanmış, farklar açıklanmış.",sonuc:"Etkin",hazirlayan:"u4",tarih:addDays(-8)}),
      W("w3","ÇK-05-03","x3","r3",{test:"20 günlük nakit pozisyon raporunda onay izinin kontrolü",amac:"Raporun gönderilmeden önce onaylandığını doğrulamak",yontem:"20 iş günü e-posta ve rapor versiyonları",bilgi:"12 günde rapor yönetici onayı olmadan gönderilmiş.",sonuc:"Kısmen etkin",hazirlayan:"u3",tarih:addDays(-4),onay:false})]}),
  A({id:"a5",no:"2026/D-06",planId:"p4",surec:"Envanter Yönetimi",konu:"Envanter Yönetimi Süreçleri Denetimi",birim:"Depo ve Envanter Müdürlüğü",ekip:["u3","u4"],sorumlu:"u3",stage:0,start:addDays(10),end:addDays(45),gecmisIncelendi:false,stageDates:SD([-1])})
 ];
 const F=(o)=>Object.assign({kategoriAciklama:"",neden:"",kriter:"",calismaRef:"",rkmId:null,testId:null,onemOverride:null,ek10:{gorus:[],eylemler:[],aciklama:"",islendi:true,nedenGizle:false},updates:[],uzatim:null},o);
 const E=(sorumlu,eylem,t)=>[{sorumlu,eylem,tarih:t}];
 const K=(e)=>({gorus:["katiliyor"],eylemler:e,aciklama:"",islendi:true,nedenGizle:false});
 const findings=[
  F({id:"f1",auditId:"a1",no:1,konu:"Sayım farklarının onaysız düzeltilmesi",birim:"Depo ve Envanter Müdürlüğü",kategori:"Stok ve Depo Yönetimi",mevcut:"Dönem sonu sayım farklarının bir kısmının depo sorumlusu tarafından onay alınmadan sistemde düzeltildiği görülmüştür.",risk:"Stok kayıtlarının gerçeği yansıtmaması ve suistimalin gizlenmesi riski.",oneri:"Sayım farkı düzeltmeleri için çift onay adımı tanımlanmalıdır.",scores:{fin_fraud:4,fin_hacim:3,op_bt:3},status:"kapandi",termin:addDays(-250),ilkTermin:addDays(-250),sorumluDenetci:"u4"}),
  F({id:"f2",auditId:"a1",no:2,konu:"Miadı yaklaşan ürünlerin takibinin yapılmaması",birim:"Depo ve Envanter Müdürlüğü",kategori:"Stok ve Depo Yönetimi",mevcut:"Miadına 90 günden az kalan ürünler için düzenli rapor alınmadığı tespit edilmiştir.",risk:"İmha ve iade kayıpları, müşterilere miadı dolmuş ürün sevk edilmesi.",oneri:"Sistemden haftalık miat raporu alınmalı ve sorumluya atanmalıdır.",scores:{fin_kredi:3,op_urun:4,imaj:2},status:"aksiyonda",termin:addDays(-40),ilkTermin:addDays(-70),sorumluDenetci:"u4",ek10:K(E("Depo Müdürü","Haftalık miat raporunun devreye alınması",addDays(-40)))}),
  F({id:"f3",auditId:"a1",no:3,konu:"Depo sistemi erişim yetkilerinin gözden geçirilmemesi",birim:"Bilgi Teknolojileri",kategori:"Bilgi Teknolojileri",mevcut:"Ayrılan 4 personelin depo yönetim sistemi kullanıcılarının aktif olduğu görülmüştür.",risk:"Yetkisiz erişim ve kayıt değişikliği.",oneri:"Yetkiler üç ayda bir gözden geçirilmeli, ayrılan personel kullanıcıları aynı gün kapatılmalıdır.",scores:{op_bt:4,fin_fraud:3},status:"kapandi",termin:addDays(-280),ilkTermin:addDays(-280),sorumluDenetci:"u3"}),
  F({id:"f4",auditId:"a1",no:4,konu:"İade ürünlerin sisteme geç kaydedilmesi",birim:"Depo ve Envanter Müdürlüğü",kategori:"Stok ve Depo Yönetimi",mevcut:"Müşterilerden gelen iadelerin ortalama 6 gün sonra sisteme işlendiği görülmüştür.",risk:"Stok ve alacak bakiyelerinin hatalı raporlanması.",oneri:"İadeler kabul günü sisteme işlenmelidir.",scores:{fin_hacim:2,yon_butce:3},status:"aksiyonda",termin:addDays(5),ilkTermin:addDays(5),sorumluDenetci:"u3",ek10:K(E("Depo Şefi","İade kabul ekranında aynı gün kayıt zorunluluğu",addDays(5)))}),
  F({id:"f5",auditId:"a2",no:1,konu:"Poliçe yenilemelerinin takip edilmemesi",birim:"Finans – Sigorta Birimi",kategori:"İdari İşler (bina, filo, sigorta)",mevcut:"İki araç ve bir depo poliçesinin vadesinden sonra yenilendiği, arada teminatsız gün oluştuğu tespit edilmiştir.",risk:"Teminatsız dönemde oluşabilecek hasarın şirket tarafından karşılanması.",oneri:"Poliçe vadeleri için 30 gün önceden uyarı veren takip listesi oluşturulmalıdır.",scores:{fin_kredi:5,fin_hacim:5,fin_fraud:5},status:"aksiyonda",termin:addDays(-3),ilkTermin:addDays(-3),sorumluDenetci:"u3",ek10:K(E("Sigorta Sorumlusu","Poliçe vade takip listesinin kurulması",addDays(-3)))}),
  F({id:"f6",auditId:"a2",no:2,konu:"Hasar dosyalarında eksik belge",birim:"Finans – Sigorta Birimi",kategori:"İdari İşler (bina, filo, sigorta)",mevcut:"İncelenen 12 hasar dosyasının 4'ünde ekspertiz raporunun bulunmadığı görülmüştür.",risk:"Tazminatların eksik tahsil edilmesi, raporlama hataları.",oneri:"Hasar dosyası kontrol listesi kullanılmalıdır.",scores:{yon_butce:4},status:"dogrulamada",termin:addDays(12),ilkTermin:addDays(12),sorumluDenetci:"u3",updates:[{at:addDays(-2),by:"u3",tip:"Tamamlandı",not:"Birim kontrol listesini devreye aldı; 3 örnek dosya kontrol edildi.",kanit:"hasar_kontrol_listesi.pdf"}],ek10:K(E("Sigorta Sorumlusu","Hasar dosyası kontrol listesi",addDays(12)))}),
  F({id:"f7",auditId:"a2",no:3,konu:"Sigorta bedellerinin güncel değerle uyumsuzluğu",birim:"Finans – Sigorta Birimi",kategori:"İdari İşler (bina, filo, sigorta)",mevcut:"Depo binası sigorta bedelinin güncel ekspertiz değerinin %40 altında olduğu görülmüştür.",risk:"Eksik sigorta nedeniyle hasarda kayıp.",oneri:"Sigorta bedelleri yıllık ekspertizle güncellenmelidir.",scores:{fin_kredi:4},status:"kapandi",termin:addDays(-150),ilkTermin:addDays(-150),sorumluDenetci:"u2"}),
  F({id:"f8",auditId:"a2",no:4,konu:"Teminat kapsamının yetersiz olması",birim:"Finans – Sigorta Birimi",kategori:"İdari İşler (bina, filo, sigorta)",mevcut:"Soğuk zincir ürünleri için bozulma teminatının poliçelerde yer almadığı görülmüştür.",risk:"Soğuk zincir arızasında ürün kaybının karşılanmaması; mevzuata aykırılık.",oneri:"Poliçelere bozulma teminatı eklenmelidir.",scores:{fin_kredi:3,yasal:3},status:"aksiyonda",termin:addDays(20),ilkTermin:addDays(20),sorumluDenetci:"u2",uzatim:{tarih:addDays(60),gerekce:"Sigorta şirketinden teklif bekleniyor.",durum:"bekliyor",by:"u2"},ek10:K(E("Sigorta Sorumlusu","Bozulma teminatı için teklif alınması",addDays(20)))}),
  F({id:"f9",auditId:"a2",no:5,konu:"Sigorta primlerinin bütçeyle karşılaştırılmaması",birim:"Finans – Sigorta Birimi",kategori:"Finans ve Muhasebe",mevcut:"Prim giderlerinin bütçe ile karşılaştırmalı raporlanmadığı görülmüştür.",risk:"Maliyet artışlarının geç fark edilmesi.",oneri:"Çeyreklik prim–bütçe raporu hazırlanmalıdır.",scores:{yon_butce:3,yon_paydas:3},status:"aksiyonda",termin:addDays(40),ilkTermin:addDays(40),sorumluDenetci:"u3",ek10:K(E("Bütçe Uzmanı","Çeyreklik prim–bütçe raporu",addDays(40)))}),
  F({id:"f10",auditId:"a3",no:1,konu:"Fazla mesai onaylarının sistem dışı yürütülmesi",birim:"İnsan Kaynakları Müdürlüğü",kategori:"İnsan Kaynakları",mevcut:"40 fazla mesai kaydının 11'inde onay bulunamamış; onayların e-posta ile alındığı, bordro sistemine elle girildiği görülmüştür.",risk:"Onaysız fazla mesai ödemesi ve mevzuata aykırı çalışma süreleri.",kriter:"Fazla Çalışma Prosedürü md. 4",oneri:"Fazla mesai talep ve onayı bordro sistemi üzerinden yapılmalıdır.",scores:{op_ik:4,fin_fraud:3,yasal:2},status:"aksiyonda",termin:addDays(38),ilkTermin:addDays(38),sorumluDenetci:"u4",rkmId:"r1",testId:"x1",calismaRef:"ÇK-04-01",ek10:K(E("İK Müdürü","Fazla mesai modülünün devreye alınması",addDays(38)))}),
  F({id:"f11",auditId:"a3",no:2,konu:"Yan hak ödemelerinde mükerrer kayıt kontrolünün bulunmaması",birim:"İnsan Kaynakları Müdürlüğü",kategori:"Finans ve Muhasebe",mevcut:"Yemek ve yol yardımı ödemelerinde 6 personele aynı ay için iki kayıt girildiği görülmüştür.",risk:"Mükerrer ödeme ve suistimal.",oneri:"Bordro sisteminde mükerrer kayıt engeli tanımlanmalıdır.",scores:{fin_fraud:4,fin_hacim:2,op_bt:3},status:"aksiyonda",termin:addDays(45),ilkTermin:addDays(45),sorumluDenetci:"u3",rkmId:"r3",testId:"x3",calismaRef:"ÇK-04-03",ek10:K(E("Bordro Uzmanı","Mükerrer kayıt kontrolü",addDays(45)))}),
  F({id:"f12",auditId:"a4",no:1,konu:"Banka talimatlarında tek imza ile işlem yapılması",birim:"Finansman ve Hazine Müdürlüğü",kategori:"Hazine ve Nakit Yönetimi",mevcut:"İncelenen 25 ödeme talimatının 3'ünde internet bankacılığında çift imza yerine tek imza ile işlem yapıldığı görülmüştür.",neden:"Bir bankada çift imza kuralı tanımlanmamış.",risk:"Yetkisiz veya hatalı ödeme yapılması, suistimal riski.",kriter:"Ödeme Yetki Yönergesi md. 7: tüm ödeme talimatları iki yetkilinin onayı ile gerçekleştirilir.",oneri:"Tüm bankalarda çift imza kuralı tanımlanmalı ve yetki listesi üç ayda bir gözden geçirilmelidir.",calismaRef:"ÇK-05-01",rkmId:"r1",testId:"x1",scores:{fin_fraud:5,fin_kredi:3,yasal:2},status:"onayli",termin:null,ilkTermin:null,sorumluDenetci:"u3",ek10:{gorus:[],eylemler:[],aciklama:"",islendi:false,nedenGizle:false}}),
  F({id:"f13",auditId:"a4",no:2,konu:"Günlük nakit pozisyon raporunun onaysız gönderilmesi",birim:"Finansman ve Hazine Müdürlüğü",kategori:"Hazine ve Nakit Yönetimi",mevcut:"İncelenen 20 iş gününün 12'sinde günlük nakit pozisyon raporunun yönetici onayı olmadan Genel Müdürlüğe gönderildiği görülmüştür.",risk:"Hatalı nakit bilgisiyle finansman kararı alınması.",kriter:"Günlük nakit pozisyon raporu hazine yöneticisi onayından sonra gönderilir.",oneri:"Rapor gönderilmeden önce hazine yöneticisi onayı alınmalıdır.",calismaRef:"ÇK-05-03",rkmId:"r3",testId:"x3",scores:{yon_butce:3,fin_hacim:2},status:"onay_bekliyor",termin:null,ilkTermin:null,sorumluDenetci:"u3",history:[{tip:"Gözden geçirmeye gönderildi",by:"u3",at:addDays(-1)+" 15:10"}],ek10:{gorus:[],eylemler:[],aciklama:"",islendi:false,nedenGizle:false}})
 ];
 const T=(o)=>Object.assign({aciklama:"",auditId:null,surekli:null,formKey:null,puan:null,yorum:"",kaynak:"sistem",kaydeden:null,created:addDays(-30),sonuc:"",cikti:"",tespit:""},o);
 const SK=(alan,siklik)=>({alan,siklik});
 const tasks=[
  T({id:"t1",baslik:"EK-1 Denetim Bildirimi",atayan:"u1",sorumlu:"u3",termin:addDays(-23),durum:"kapandi",auditId:"a4",formKey:"EK1",puan:5}),
  T({id:"t2",baslik:"EK-3 Denetim Süre Planı",atayan:"u1",sorumlu:"u3",termin:addDays(-22),durum:"onay_bekliyor",auditId:"a4",formKey:"EK3",bitis:addDays(-1)}),
  T({id:"t3",baslik:"EK-15 Süreç Bilgi Formu",atayan:"u1",sorumlu:"u4",termin:addDays(-20),durum:"kapandi",auditId:"a4",formKey:"EK15",puan:4}),
  T({id:"t4",baslik:"EK-7 Denetim Programı",atayan:"u1",sorumlu:"u3",termin:addDays(-19),durum:"kapandi",auditId:"a4",formKey:"EK7",puan:5}),
  T({id:"t5",baslik:"EK-6 Risk Kontrol Matrisi",atayan:"u1",sorumlu:"u4",termin:addDays(-19),durum:"kapandi",auditId:"a4",formKey:"EK6",puan:3,yorum:"Kasa riski ilk sürümde eksikti."}),
  T({id:"t6",baslik:"EK-5 Açılış Toplantısı Tutanağı",atayan:"u1",sorumlu:"u3",termin:addDays(-17),durum:"kapandi",auditId:"a4",formKey:"EK5",puan:4}),
  T({id:"t7",baslik:"EK-8 Bireysel Çalışma Programı",atayan:"u1",sorumlu:"u3",termin:addDays(-16),durum:"kapandi",auditId:"a4",formKey:"EK8",puan:5}),
  T({id:"t9",baslik:"T-04 Sürpriz kasa sayımı: çalışma kağıdı",atayan:"u1",sorumlu:"u3",termin:addDays(2),durum:"devam",auditId:"a4",testId:"x4",created:addDays(-3)}),
  T({id:"t12",baslik:"EK-11 Kapanış Toplantısı Tutanağı",atayan:"u1",sorumlu:"u4",termin:addDays(-9),durum:"kapandi",auditId:"a3",formKey:"EK11",puan:4}),
  T({id:"s1",baslik:"Eylül ayı sürpriz kasa sayımları (3 şube)",atayan:"u1",sorumlu:"u4",termin:addDays(5),durum:"devam",surekli:SK("Kasa sayımları","Aylık"),kaynak:"sozlu",kaydeden:"u4",created:addDays(-8)}),
  T({id:"s2",baslik:"Şube performans Excel'ini son çeyrek verisiyle güncelle",aciklama:"Şube denetimlerinin önceliklendirilmesi için.",atayan:"u1",sorumlu:"u3",termin:addDays(6),durum:"acik",surekli:SK("Şube performans analizi","Çeyreklik"),created:addDays(-1)}),
  T({id:"t15",baslik:"Kasa sayım prosedürü taslağını gözden geçir",aciklama:"Muhasebenin hazırladığı taslak; yorumlarını yaz.",atayan:"u1",sorumlu:"u3",termin:addDays(5),durum:"acik",surekli:SK("Metodoloji","Tek sefer"),created:addDays(0)}),
  T({id:"s3",baslik:"Haftalık iade ve iskonto veri analizi (38. hafta)",atayan:"u1",sorumlu:"u3",termin:addDays(-4),durum:"kapandi",puan:4,surekli:SK("Veri analitiği","Haftalık"),sonuc:"İade oranları analiz edildi.",cikti:"iade_analizi_hafta38.xlsx",tespit:"3 şubede iade oranı ortalamanın iki katı; şube denetimi önerilir.",bitis:addDays(-5)}),
  T({id:"s4",baslik:"KVKK yönetmelik değişikliklerinin süreçlere etkisi",atayan:"u1",sorumlu:"u4",termin:addDays(-1),durum:"onay_bekliyor",surekli:SK("Mevzuat takibi","Tek sefer"),kaynak:"sozlu",kaydeden:"u4",sonuc:"Değişiklikler özetlendi; İK ve BT süreçlerini etkiliyor.",cikti:"kvkk_degisiklik_ozeti.docx",bitis:addDays(-1)}),
  T({id:"t11",baslik:"Denetim komitesi için açık bulgu listesi",aciklama:"Geciken bulgular ayrı sekmede.",atayan:"u1",sorumlu:"u4",termin:addDays(-1),durum:"onay_bekliyor",surekli:SK("Raporlama","Tek sefer"),sonuc:"Liste hazırlandı.",cikti:"acik_bulgular_eylul.xlsx",bitis:addDays(-1)}),
  T({id:"t13",baslik:"Önceki dönem bulgu kanıtlarının arşivlenmesi",atayan:"u2",sorumlu:"u4",termin:addDays(-3),durum:"acik",surekli:SK("Arşiv ve dokümantasyon","Tek sefer"),created:addDays(-10)}),
  T({id:"t14",baslik:"Kontrol testleri için örneklem tablosunun hazırlanması",atayan:"u1",sorumlu:"u3",termin:addDays(-12),durum:"kapandi",puan:3,yorum:"Örneklem gerekçeleri daha açık yazılmalı.",surekli:SK("Metodoloji","Tek sefer"),kaynak:"sozlu",kaydeden:"u3",bitis:addDays(-13)})
 ];
 const notifs=[
  {id:"n0",to:"u1",text:"Can Yıldız, 2026/D-05 · EK-3 Denetim Süre Planı formunu onayınıza gönderdi.",at:addDays(-1),read:false,link:{v:"form",id:"a4",key:"EK3"}},
  {id:"n00",to:"u1",text:"Can Yıldız, 2026/D-05 · B2 bulgusunu gözden geçirmenize gönderdi.",at:addDays(-1),read:false,link:{v:"bulgu",id:"f13"}},
  {id:"n01",to:"u2",text:"Can Yıldız, 2026/D-05 · B2 bulgusunu gözden geçirmenize gönderdi.",at:addDays(-1),read:false,link:{v:"bulgu",id:"f13"}},
  {id:"n02",to:"u3",text:"Yeni görev atandı: Kasa sayım prosedürü taslağını gözden geçir.",at:addDays(0),read:false,link:{v:"tasks"}},
  {id:"n1",to:"u1",text:"2026/D-04 Değerlendirme aşamasına geçti. EK-14 Denetçi Değerlendirme Formu'nu doldurun.",at:addDays(-2),read:false,link:{v:"audit",id:"a3",tab:"akis"}},
  {id:"n2",to:"u1",text:"Deniz Ak \"Denetim komitesi için açık bulgu listesi\" görevini tamamladı. Puanınız bekleniyor.",at:addDays(-1),read:false,link:{v:"tasks"}},
  {id:"n3",to:"u1",text:"Termin uzatım talebi: 2026/D-02 · B4 (Burak Şen).",at:addDays(-1),read:false,link:{v:"findings"}},
  {id:"n4",to:"u1",text:"Kanıt doğrulama bekliyor: 2026/D-02 · B2.",at:addDays(-2),read:false,link:{v:"findings"}},
  {id:"n5",to:"u3",text:"2026/D-02 · B1 bulgusunun termini geçti. Bu bulgunun durumu ne?",at:addDays(-2),read:false,link:{v:"findings"}},
  {id:"n6",to:"u3",text:"Yeni görev atandı: Şube performans Excel'ini son çeyrek verisiyle güncelle.",at:addDays(-1),read:false,link:{v:"surekli"}},
  {id:"n7",to:"u3",text:"2025/D-04 · B4 bulgusunun terminine 5 gün kaldı. Bu bulgunun durumu ne?",at:addDays(0),read:false,link:{v:"findings"}},
  {id:"n8",to:"u2",text:"ÇK-05-03 çalışma kağıdı gözden geçirmenizi bekliyor.",at:addDays(-4),read:false,link:{v:"audit",id:"a4",tab:"testler"}},
  {id:"n9",to:"u4",text:"Görev termini geçti: Önceki dönem bulgu kanıtlarının arşivlenmesi.",at:addDays(-2),read:false,link:{v:"surekli"}}
 ];
 const log=[
  {at:addDays(-24)+" 09:12",by:"u1",text:"2026/D-05 denetimi başlatıldı; 5 hazırlık görevi atandı."},
  {at:addDays(-19)+" 09:40",by:"u1",text:"2026/D-05 EK-7 Denetim Programı onaylandı; müdür değişiklikleri: III. Denetimin kapsamı."},
  {at:addDays(-16)+" 15:40",by:"u1",text:"2026/D-05 EK-8 Bireysel Çalışma Programı onaylandı."},
  {at:addDays(-6)+" 11:05",by:"u1",text:"2026/D-04 denetim raporu nihai olarak onaylandı ve kilitlendi."},
  {at:addDays(-2)+" 10:22",by:"u3",text:"2026/D-02 · B2 için kanıt yüklendi (hasar_kontrol_listesi.pdf)."},
  {at:addDays(-1)+" 16:48",by:"u2",text:"2026/D-02 · B4 için termin uzatım talebi oluşturuldu."}
 ];
 const e7=audits.find(x=>x.id==="a4").forms.EK7; e7.history[1].data=JSON.parse(JSON.stringify(e7.data)); e7.history[0].data=Object.assign(JSON.parse(JSON.stringify(e7.data)),{kapsam:"01.01.2026 – 30.06.2026 dönemi banka ve ödeme işlemleri."});
 return {v:5,me:"u3",users,plan,audits,findings,tasks,notifs,log,seq:{"D2026":6,"C2026":0},ui:{v:"panel"}};
}
