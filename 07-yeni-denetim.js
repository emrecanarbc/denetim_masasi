"use strict";
/* ============ Yeni denetim sihirbazı ============ */
const DTUR = [
 {k:"surec",ad:"Süreç denetimi",h:"Denetim evrenindeki bir süreç veya alt süreç. Makro risk puanı evrenden gelir.",harf:"D",boyut:["Uygunluk","Mali","Performans","Sistem","BT"],konu:"surec"},
 {k:"sube",ad:"Şube denetimi",h:"Bir şubenin satış, tahsilat, kasa, stok ve iade işlemleri.",harf:"D",boyut:["Uygunluk","Mali","Performans"],konu:"sube"},
 {k:"performans",ad:"Performans denetimi",h:"Bir sürecin etkinlik, verimlilik ve hedeflere ulaşma düzeyi.",harf:"D",boyut:["Performans","Sistem"],konu:"surec"},
 {k:"uygunluk",ad:"Uygunluk denetimi",h:"Mevzuat, YK kararları ve iç prosedürlere uyum.",harf:"D",boyut:["Uygunluk"],konu:"surec"},
 {k:"mali",ad:"Mali denetim",h:"Kayıtların, tutarların ve mutabakatların doğruluğu.",harf:"D",boyut:["Mali","Uygunluk"],konu:"surec"},
 {k:"bt",ad:"BT / sistem denetimi",h:"Yetkilendirme, uygulama kontrolleri, veri bütünlüğü.",harf:"D",boyut:["Sistem","BT"],konu:"surec"},
 {k:"danismanlik",ad:"Danışmanlık",h:"Talep üzerine süreç, sistem veya prosedür için görüş. Rapor no C ile başlar.",harf:"C",boyut:["Performans","Sistem"],konu:"surec"},
 {k:"inceleme",ad:"Özel inceleme",h:"İhbar, YK veya Genel Müdür talebi ya da bir olay üzerine inceleme.",harf:"D",boyut:["Uygunluk","Mali"],konu:"serbest"},
 {k:"izleme",ad:"İzleme denetimi",h:"Önceki denetim bulgularının aksiyonlarını yerinde doğrulama.",harf:"D",boyut:["Uygunluk"],konu:"izleme"}
];
const TALEP_EDEN = ["Yönetim Kurulu","Genel Müdür","Denetim Komitesi","İhbar / şikâyet","Süreç sahibi birim","İç denetim (kendi tespiti)"];
const BOYUTLAR = ["Uygunluk","Mali","Performans","Sistem","BT"];
const dtur = k => DTUR.find(x=>x.k===k);
const trLow = s => String(s||"").toLocaleLowerCase("tr-TR");
const evrenSurec = s => EVREN.find(x=>x.s===s);
const ONEM_ETKI = {"Çok Yüksek":"5","Yüksek":"4","Orta":"3","Düşük":"2"};
let NEW = null;

function yeniVarsayilan(){
 const denetci = S.users.filter(u=>u.role==="denetci").map(u=>u.id);
 return {tur:"",kat:"",surec:"",alt:[],odak:"",sablon:null,boyut:[],subeAd:"",izA:[],konuSerbest:"",ilgiliSurec:"",talep:"",gizli:false,birim:"",
  donemBas:"2026-01-01",donemBit:"2026-06-30",start:addDays(14),end:"",ekip:denetci,sorumlu:isMudur()?denetci[0]:S.me,gerekce:"",not:""};
}
function yeniBaslat(o){ NEW=Object.assign(yeniVarsayilan(),o||{}); if(NEW.tur) NEW.boyut=NEW.boyut.length?NEW.boyut:dtur(NEW.tur).boyut.slice(); if(o&&o.ara) yeniAra(o.ara,true);
 PUAN=0; S.ui={v:"yeni"}; DRAFT=null; DB=null; DRAWER=false; MODAL=null; save(); render(); window.scrollTo(0,0); }

/* Konu arama: şablon adı / anahtar kelime → alt süreç → süreç */
function yeniAra(q,sessiz){
 const t=trLow(q).trim(); if(!t) return;
 let sb=KONU_SABLON.find(x=>trLow(x.ad)===t);
 if(!sb){ let bs=0; KONU_SABLON.forEach(x=>{ const sc=x.anahtar.filter(a=>t.includes(a)||(t.length>=5&&a.includes(t))).length; if(sc>bs){ bs=sc; sb=x; } }); }
 if(sb) return yeniSablon(sb.id);
 const stop=["süreci","süreçleri","yönetimi","denetimi","ile","için"];
 const tok=t.split(/[^a-zçğıöşü0-9&]+/).filter(w=>w.length>=3&&!stop.includes(w)).map(w=>w.slice(0,5));
 let best=null;
 EVREN.forEach(e=>{ [...e.alt.map(a=>({e,a})),{e,a:null}].forEach(c=>{ const n=trLow(c.a||c.e.s); const sc=n===t?100:tok.filter(w=>n.includes(w)).length+(c.a?0.1:0); if(sc>=1&&(!best||sc>best.sc)) best=Object.assign({sc},c); }); });
 if(best){ NEW.kat=best.e.k; NEW.surec=best.e.s; NEW.alt=best.a?[best.a]:[]; NEW.odak=best.a?best.a.replace(/\s*\(.*\)$/,""):""; NEW.sablon=null; NEW.birim=""; return; }
 NEW.odak=q.trim(); if(!sessiz) toast("Evrende eşleşen süreç bulunamadı. Konuyu odak olarak yazdım; süreci aşağıdan seçin.");
}
function yeniSablon(id){ const sb=KONU_SABLON.find(x=>x.id===id), e=evrenSurec(sb.s); NEW.sablon=id; NEW.kat=e?e.k:""; NEW.surec=sb.s; NEW.alt=sb.alt.filter(a=>!e||e.alt.includes(a)); NEW.odak=sb.ad; NEW.birim=""; }

/* Seçimlerden eklere gidecek içeriği üretir (önizleme ve kayıt aynı fonksiyonu kullanır) */
function yeniHesap(N){
 const T=dtur(N.tur), H={eksik:[],rkm:[],belge:[]};
 if(!T){ H.eksik.push("Denetim türünü seçin."); return H; }
 H.T=T; H.harf=T.harf;
 const e = evrenSurec(T.konu==="serbest"?N.ilgiliSurec:N.surec);
 const sb = N.sablon ? KONU_SABLON.find(x=>x.id===N.sablon) : null;
 H.e=e; H.sb=sb; H.boyut=N.boyut.length?N.boyut:T.boyut;
 const plan = N.planId ? planRow(N.planId) : e ? S.plan.find(p=>p.surec===e.s) : null; H.plan=plan;
 H.makro = plan ? {puan:plan.puan,duzey:plan.duzey} : (e&&e.p ? {puan:e.p,duzey:riskDuzey(e.p)} : null);
 const X = N.odak || (N.alt.length===1?N.alt[0].replace(/\s*\(.*\)$/,""):"") || (e?e.s:"");
 const donem = `${fmt(N.donemBas)} – ${fmt(N.donemBit)}`;
 const etkiVars = H.makro ? String(Math.max(2,Math.min(5,Math.round(H.makro.puan)))) : "3";

 if(T.konu==="surec"){
  if(!e) H.eksik.push("Süreci seçin veya konu arayın.");
  H.surecAd = e?e.s:""; H.odak=X;
  const ad = X && e && X!==e.s ? X : H.surecAd;
  const ek = /Süreci$|Süreçleri$|Yönetimi$/.test(ad)?"":" Süreci";
  H.konuBaslik = {surec:`${ad}${ek} Denetimi`,performans:`${ad} Performans Denetimi`,uygunluk:`${ad} Uygunluk Denetimi`,mali:`${ad} Mali Denetimi`,bt:`${ad} BT Denetimi`,danismanlik:`${ad} Danışmanlığı`}[T.k];
  H.birim = N.birim || (sb&&sb.birim) || (e?e.f:"");
  if(sb){ H.rkm = sb.rkm.map(r=>r.slice()); H.belge = sb.belge.slice(); }
  else if(e){ H.boyut.forEach(b=>{ const g=BOYUT_RKM[b](X||e.s); H.rkm.push([g[0],etkiVars,"3",g[1],g[2],g[3],g[4]]); });
   H.belge = ["Süreç prosedürü, iş akışı ve görev tanımları","Dönem işlem listesi (Excel)","Süreçte kullanılan raporlar ve KPI verileri","Yetki matrisi ve sistem kullanıcı listesi"]; }
  // önceki denetim bulguları risk satırı olarak
  if(e){ const prev=S.audits.filter(x=>x.surec===e.s&&x.rapor.status==="nihai").flatMap(x=>findingsOf(x.id)).slice(0,2);
   prev.forEach(f=>H.rkm.push([`Önceki denetimde tespit edilen sorunun sürmesi: ${f.konu} (${fcode(f)})`,ONEM_ETKI[onemOf(f)]||"3","3",(f.ek10.eylemler[0]||{}).eylem||f.oneri,"Düzeltici","Tek sefer","Önceki bulguya ilişkin aksiyonun uygulandığının ve etkin işlediğinin test edilmesi"])); H.prev=prev; }
  H.amac = sb ? sb.amac : (e ? `${X||e.s} kapsamındaki iç kontrollerin tasarım ve işleyiş etkinliğini ${H.boyut.map(b=>BOYUT_ACIK[b]).join("; ")} açısından değerlendirmek.` : "");
  if(T.k==="danismanlik") H.amac = `${X||(e?e.s:"")} konusunda ${N.talep||"talep eden birim"} talebi üzerine süreç tasarımı, kontroller ve iyileştirme fırsatları hakkında görüş vermek.` + (sb?"\n"+sb.amac:"");
  H.kk = sb ? sb.kk : (N.alt.length ? N.alt.join(", ")+" alt süreçleri" : X);
  H.q1 = sb&&sb.q1 ? sb.q1 : (e?`${e.s} süreci (${e.k} süreçler). Alt süreçler: ${(N.alt.length?N.alt:e.alt).join(", ")}.`:"");
  H.q2 = sb&&sb.q2||""; H.q3 = sb&&sb.q3 ? sb.q3 : (e?`Süreç sahibi: ${e.f}.`:"");
  H.yontem = sb ? sb.yontem : "";
 }
 if(T.konu==="sube"){
  const ad=(N.subeAd||"").trim();
  if(!ad) H.eksik.push("Şube adını yazın.");
  H.surecAd="Şube Operasyonları"; H.odak=ad?`${ad} Operasyonları`:""; H.konuBaslik=`${ad.replace(/\s*Şubesi$/i,"")||"Şube"} Şube Denetimi`; H.birim=N.birim||ad;
  H.rkm=[
   ["Kasada açık veya zimmet oluşması","4","2","Periyodik kasa sayımı ve mutabakatı","Tespit edici","Aylık","Sürpriz kasa sayımı ve son 3 ayın sayım tutanaklarının incelenmesi"],
   ["Vadesi geçen müşteri alacaklarının takip edilmemesi","4","3","Haftalık vadesi geçen alacak raporu ve arama kayıtları","Tespit edici","Haftalık","Şube alacak yaşlandırmasında 90 gün üstü alacaklar için takip kayıtlarının kontrolü"],
   ["İade koşullarına uymayan ürünlerin kabul edilmesi veya geç kaydedilmesi","3","3","İade kabul kontrol listesi ve aynı gün kayıt","Önleyici","İşlem bazında","Dönem iadelerinde kabul koşulu ve kabul–kayıt tarihi farkının incelenmesi"],
   ["Şube stok kayıtları ile fiziki stok arasında fark oluşması","4","3","Periyodik sayım ve sayım farkı onayı","Tespit edici","Aylık","Yüksek değerli 20 kalemde örneklem sayım"],
   ["Siparişlerin hatalı hazırlanması veya geç teslim edilmesi","3","3","Çıkış kontrolü ve günlük teslimat takibi","Tespit edici","Günlük","Hatalı ve geç teslimat kayıtlarının kök neden analizi"],
   ["Yetki dışı fiyat veya iskonto uygulanması","4","2","Manuel fiyat ve iskontoda onay zorunluluğu","Önleyici","İşlem bazında","Şubede manuel fiyat ve iskontolu satışların onay kontrolü"]];
  H.belge=["Dönem satış, tahsilat ve iade verileri","Alacak yaşlandırma raporu","Sipariş ve teslimat hata kayıtları","Şube personel listesi ve görev dağılımı","Son 3 ayın kasa sayım tutanakları","Son sayım tutanağı ve sayım farkları"];
  H.amac="Şubenin operasyonel, finansal ve hizmet kalitesi süreçlerindeki iç kontrollerin tasarım ve işleyiş etkinliğini değerlendirmek.";
  H.kk="şube satış, tahsilat, iade, stok, kasa, sevkiyat ve personel işlemleri";
  H.q1=ad?`${ad}: satış, tahsilat, iade, stok, kasa ve sevkiyat süreçleri.`:""; H.q2=""; H.q3="";
  H.yontem="Şube ziyareti ve gözlem; sürpriz kasa sayımı; örneklem işlem testleri; veri analizi.";
 }
 if(T.konu==="serbest"){
  if(!N.konuSerbest.trim()) H.eksik.push("İncelemenin konusunu yazın.");
  if(!N.talep) H.eksik.push("İncelemeyi kimin talep ettiğini seçin.");
  H.surecAd = e?e.s:"Özel İnceleme"; H.odak=N.konuSerbest.trim(); H.konuBaslik=`${H.odak} Özel İncelemesi`; H.birim=N.birim||(e?e.f:"");
  H.rkm=[[`${H.odak} konusundaki işlemlerin yetkisiz veya usulsüz yapılmış olması`,"5","3","Yetki matrisi ve onay akışı","Önleyici","İşlem bazında","İddiaya konu dönemdeki işlemlerin tamamının onay, belge ve kullanıcı logu bazında incelenmesi"],
   [`İddiaya konu işlemlerden şirketin maddi zarara uğraması`,"5","2","Mutabakat ve yönetici gözden geçirmesi","Tespit edici","Aylık","Zarar tutarının belgelerle hesaplanması"]];
  H.belge=["Talep yazısı veya ihbar metni","İlgili dönem işlem kayıtları ve sistem logları","İlgili personelin görev tanımları ve yetki listesi","Konuyla ilgili yazışmalar"];
  H.amac=`${N.talep} talebi üzerine ${H.odak} konusunu incelemek; iddiaların doğruluğunu, varsa etkisini ve sorumluluk alanlarını belgelere dayalı olarak ortaya koymak.`;
  H.kk=`${H.odak} ile ilgili işlemler ve belgeler`; H.q1=""; H.q2=""; H.q3=""; H.yontem="Belge incelemesi, sistem log analizi, ilgili personelle görüşme.";
 }
 if(T.konu==="izleme"){
  const as=N.izA.map(audit).filter(Boolean); if(!as.length) H.eksik.push("İzlenecek denetimi seçin.");
  const fs=as.flatMap(a=>findingsOf(a.id)).filter(f=>f.status!=="kapandi"&&f.ek10.islendi); H.izF=fs;
  H.surecAd = as[0]?as[0].surec:"İzleme"; H.odak=as.map(a=>a.no).join(", ")+" bulguları"; H.konuBaslik=`${as.map(a=>a.surec).filter((v,i,s)=>s.indexOf(v)===i).join(", ")||"Bulgu"} İzleme Denetimi`; H.birim=N.birim||(as[0]?as[0].birim:"");
  H.makro = as[0]&&planRow(as[0].planId) ? {puan:planRow(as[0].planId).puan,duzey:planRow(as[0].planId).duzey} : null;
  fs.forEach(f=>H.rkm.push([f.risk||f.konu,ONEM_ETKI[onemOf(f)]||"3","3",(f.ek10.eylemler[0]||{}).eylem||f.oneri,"Düzeltici","Tek sefer",`${fcode(f)} için taahhüt edilen eylemin uygulandığının ve etkin işlediğinin yerinde doğrulanması`]));
  H.belge=fs.map(f=>`${fcode(f)} · ${f.konu}: aksiyon kanıtları`);
  H.amac=`${as.map(a=>a.no).join(", ")} numaralı denetimlerde tespit edilen bulgulara ilişkin taahhüt edilen aksiyonların uygulandığını ve etkinliğini yerinde doğrulamak.`;
  H.kk=`${fs.length} açık bulgunun eylem planları`; H.q1=""; H.q2=""; H.q3=""; H.yontem="Eylem planı kanıtlarının incelenmesi, yeniden test, birim yöneticileriyle görüşme.";
 }
 // ortak alanlar
 H.planDisi = !["sube","izleme"].includes(N.tur) && !H.plan && N.tur!=="inceleme";
 if(H.planDisi && N.tur!=="danismanlik" && !N.gerekce.trim()) H.eksik.push("Plan dışı denetim için gerekçe yazın.");
 if(N.tur==="danismanlik" && !N.talep) H.eksik.push("Danışmanlığı talep edeni seçin.");
 if(!N.ekip.length) H.eksik.push("Ekipten en az bir kişi seçin.");
 if(!N.start) H.eksik.push("Başlangıç tarihini girin.");
 const saat = H.plan ? H.plan.saat : ({"Çok Yüksek":240,"Yüksek":240,"Orta":160,"Düşük":120})[H.makro&&H.makro.duzey]||160;
 H.gun = Math.max(8,Math.min(40,Math.round(saat/8/Math.max(1,N.ekip.length))));
 const w=[3,5,1,2,3,15,5,4,1,4,2], ws=w.reduce((a,b)=>a+b,0);
 H.ek3 = w.map(x=>({p:String(Math.max(1,Math.round(x/ws*H.gun))),r:"",g:""}));
 H.end = N.end || (N.start ? (d=>{d.setDate(d.getDate()+Math.round(H.gun*1.4)); return iso(d);})(new Date(N.start+"T00:00:00")) : "");
 H.rkm = H.rkm.map(r=>({id:uid("r"),risk:r[0],etki:r[1],olas:r[2],kontrol:r[3],tur:r[4],siklik:r[5],test:r[6]}));
 H.ek1 = `${H.kk} konularında ${donem} dönemi işlemleridir.`;
 const prevTxt = (()=>{ if(!e) return ""; const pr=S.audits.filter(x=>x.surec===e.s&&x.rapor.status==="nihai"); return pr.length?pr.map(p=>`${p.no} · rapor tarihi ${fmt(p.rapor.tarih)} · ${findingsOf(p.id).length} bulgu`).join("\n"):"Bu süreçte daha önce denetim yapılmamıştır."; })();
 H.ek7 = {amac:H.amac||"",
  kapsam:[`İncelenen dönem: ${donem}.`, e&&T.konu!=="sube"?`Süreç: ${e.s} (${e.k} süreçler).`:"", N.alt.length&&T.konu==="surec"?`Alt süreçler: ${N.alt.join(", ")}.`:"", H.kk?`Kapsam: ${H.kk}.`:"", `Denetim boyutları: ${H.boyut.join(", ")}.`, N.not?`Not: ${N.not}`:""].filter(Boolean).join("\n"),
  yontem:[H.yontem, H.boyut.map(b=>`${b}: ${BOYUT_YONTEM[b]}`).join("; ")+"."].filter(Boolean).join("\n"),
  onceki:prevTxt,
  hazirlik:[H.makro&&H.makro.puan!=null?`Makro risk puanı ${num2(H.makro.puan)} (${H.makro.duzey}).`:"", H.plan?"2026 Denetim Planı'nda yer alıyor.":H.planDisi?`Plan dışı${N.gerekce?": "+N.gerekce.trim().replace(/[.]+$/,""):""}.`:"", N.talep?`Talep eden: ${N.talep}.`:"", H.belge.length?"Bilgi ve belge talep listesi:\n"+H.belge.map(b=>"- "+b).join("\n"):""].filter(Boolean).join("\n"),
  testler:H.rkm.map((r,i)=>`R-${pad2(i+1)} ${r.risk}: ${r.test}`).join("\n")};
 H.ek15 = {q1:H.q1||"",q2:H.q2||"",q3:H.q3||""};
 return H;
}

function yeniOlustur(){
 const N=NEW, H=yeniHesap(N); if(H.eksik.length) return toast(H.eksik[0]);
 const k=H.harf+"2026"; S.seq[k]=(S.seq[k]||0)+1; const no=`2026/${H.harf}-${pad2(S.seq[k])}`;
 const ekip=N.ekip.slice(); let sor=N.sorumlu||ekip[0]; if(!ekip.includes(sor)) ekip.unshift(sor);
 const sb=H.sb?H.sb.ad:null, f=(data)=>({status:"taslak",sablon:sb||dtur(N.tur).ad,at:iso(new Date()),data});
 const a={id:uid("a"),no,tur:H.harf,denetimTuru:N.tur,planId:H.plan?H.plan.id:null,surec:H.surecAd,odak:H.odak,altSurecler:N.alt.slice(),boyutlar:H.boyut.slice(),konu:H.konuBaslik,birim:H.birim,
  donem:{bas:N.donemBas,bit:N.donemBit},makro:H.makro&&H.makro.puan!=null?{puan:H.makro.puan,duzey:H.makro.duzey}:null,planDisi:H.planDisi?{gerekce:N.gerekce.trim()}:null,talepEden:N.talep||null,gizli:!!N.gizli,
  izA:N.tur==="izleme"?N.izA.slice():null,belgeler:H.belge.slice(),sablonAd:sb,ekip,sorumlu:sor,stage:0,status:"aktif",start:N.start,end:H.end,gecmisIncelendi:false,
  forms:{EK1:f({kapsam:H.ek1,baslangic:N.start,ykOnay:"2025-01-15"}),EK3:f({rows:H.ek3,gerekce:""}),EK6:f({rows:H.rkm}),EK7:f(H.ek7),EK15:f(H.ek15)},
  ek4:[],rapor:{status:"yok",ozet:{riskler:"",etkiler:"",cozumler:""},sira:"puan"},puan:null,stageDates:{0:iso(new Date())}};
 if(!isMudur()){ a.talep={by:S.me,at:nowStamp(),durum:"bekliyor"}; mudurler().forEach(m=>notify(m.id,`${me().name}, ${no} ${a.konu} için denetim talebi oluşturdu. Onayınız bekleniyor.`,{v:"audit",id:a.id})); }
 else ekip.forEach(u=>notify(u,`${no} ${a.konu} için ekibe atandınız.`,{v:"audit",id:a.id}));
 S.audits.push(a); log(`${no} ${a.konu} oluşturuldu (${dtur(N.tur).ad}${a.planDisi?", plan dışı":""}${sb?", şablon: "+sb:""})${a.talep?"; müdür onayına gönderildi":""}.`);
 NEW=null; ACT.go({v:"audit",id:a.id,tab:"akis"}); toast(a.talep?`${no} oluşturuldu ve müdür onayına gönderildi.`:`${no} oluşturuldu. Ekler seçilen konuya göre ön dolduruldu.`);
}

/* ---- Görünüm ---- */
function renderYeni(){
 if(!NEW) NEW=yeniVarsayilan();
 const N=NEW, T=dtur(N.tur), H=yeniHesap(N);
 const card=(n,t,body,sub)=>`<div class="card stack"><div class="card-head" style="margin:0"><h2>${n}. ${t}</h2>${sub||""}</div>${body}</div>`;
 const turHtml=`<div class="tgrid">${DTUR.map(x=>`<button class="tcard ${N.tur===x.k?"on":""}" data-act="ynTur" data-k="${x.k}" aria-pressed="${N.tur===x.k}"><b>${x.ad}</b><span>${x.h}</span></button>`).join("")}</div>`;
 let konu="";
 if(T&&T.konu==="surec"){
  const kats=["Destek","Operasyonel","Yönetsel"], ss=EVREN.filter(x=>!N.kat||x.k===N.kat).slice().sort((a,b)=>(b.p||0)-(a.p||0)), e=evrenSurec(N.surec);
  const onerilen=KONU_SABLON.filter(x=>!N.surec||x.s===N.surec);
  konu=`<label class="field"><span>Konu ara <span class="hint">· ör. erken ödeme iskontoları, bordro, iade, yetkilendirme</span></span><input class="input" id="yn-ara" list="yn-dl" data-yn="ara" placeholder="Konu, alt süreç veya süreç adı yazın"><datalist id="yn-dl">${KONU_SABLON.map(x=>`<option value="${esc(x.ad)}">`).join("")}${EVREN.flatMap(x=>x.alt).map(a=>`<option value="${esc(a)}">`).join("")}</datalist></label>
   <div class="grid2"><label class="field"><span>Süreç kategorisi</span><select class="input" id="yn-kat" data-yn="kat"><option value="">Tümü</option>${kats.map(k=>`<option value="${k}" ${N.kat===k?"selected":""}>${k} süreçler</option>`).join("")}</select></label>
   <label class="field"><span>Süreç <span class="hint">· makro risk puanına göre sıralı</span></span><select class="input" id="yn-surec" data-yn="surec"><option value="">Seçin</option>${ss.map(x=>`<option value="${esc(x.s)}" ${N.surec===x.s?"selected":""}>${esc(x.s)}${x.p?` · ${num2(x.p)} ${riskDuzey(x.p)}`:""}</option>`).join("")}</select></label></div>
   ${e?`<div class="field"><span>Alt süreçler <span class="hint">· denetime dahil olanları işaretleyin</span></span><div class="chk-grid">${e.alt.map((a,i)=>`<label class="chk"><input type="checkbox" id="yn-alt-${i}" data-yn-arr="alt" value="${esc(a)}" ${N.alt.includes(a)?"checked":""}> ${esc(a)}</label>`).join("")}</div></div>`:""}
   ${onerilen.length?`<div class="field"><span>Hazır konu şablonları <span class="hint">· risk matrisi, belge listesi ve amaç metniyle gelir</span></span><div class="row">${onerilen.map(x=>`<button class="btn sm ${N.sablon===x.id?"pri":""}" data-act="ynSablon" data-id="${x.id}">${esc(x.ad)}</button>`).join("")}</div></div>`:""}
   <label class="field"><span>Odak konu / denetim başlığı <span class="hint">· rapor kapağına ve eklere yazılır</span></span><input class="input" id="yn-odak" data-yn="odak" value="${esc(N.odak)}" placeholder="${esc(e?e.s:"Ör. Erken Ödeme İskontoları")}"></label>
   ${H.sb?`<div class="notice info"><div><b>Şablon: ${esc(H.sb.ad)}.</b> ${H.sb.rkm.length} risk, ${H.sb.belge.length} belge talebi ve hazır amaç, kapsam ve yöntem metni eklere aktarılacak.</div></div>`:e?`<div class="notice info"><div>Bu konu için hazır şablon yok. Risk matrisi seçtiğiniz denetim boyutlarından genel satırlarla doldurulacak; ekip düzenleyebilir.</div></div>`:""}`;
 }
 if(T&&T.konu==="sube"){
  konu=`<label class="field"><span>Şube adı</span><input class="input" id="yn-sube" data-yn="subeAd" value="${esc(N.subeAd||"")}" placeholder="Ör. Kadıköy Şubesi"></label>
   <div class="notice info"><div>Şube denetimlerinde kasa, alacak, iade, stok, sevkiyat ve fiyat/iskonto riskleri risk matrisine standart satırlar olarak gelir; ekip düzenleyebilir.</div></div>`;
 }
 if(T&&T.konu==="serbest"){
  konu=`<label class="field"><span>İncelemenin konusu</span><input class="input" id="yn-ks" data-yn="konuSerbest" value="${esc(N.konuSerbest)}" placeholder="Ör. X şubesinde iade işlemlerine ilişkin ihbar"></label>
   <label class="field"><span>İlgili süreç <span class="hint">· isteğe bağlı</span></span><select class="input" id="yn-is" data-yn="ilgiliSurec"><option value="">Seçin</option>${EVREN.map(x=>`<option ${N.ilgiliSurec===x.s?"selected":""}>${esc(x.s)}</option>`).join("")}</select></label>
   <label class="row"><input type="checkbox" id="yn-gizli" data-yn="gizli" ${N.gizli?"checked":""}> Gizli inceleme (denetlenen birime bildirim gönderilmez)</label>`;
 }
 if(T&&T.konu==="izleme"){
  const as=S.audits.filter(a=>findingsOf(a.id).some(f=>f.status!=="kapandi"&&f.ek10.islendi));
  konu=`<div class="field"><span>İzlenecek denetimler <span class="hint">· açık bulgusu olanlar</span></span>${as.map(a=>`<label class="chk"><input type="checkbox" id="yn-iz-${a.id}" data-yn-arr="izA" value="${a.id}" ${N.izA.includes(a.id)?"checked":""}> <span class="mono">${a.no}</span> ${esc(a.konu)} <span class="muted small">· ${findingsOf(a.id).filter(f=>f.status!=="kapandi").length} açık bulgu</span></label>`).join("")||`<div class="empty">Açık bulgusu olan denetim yok.</div>`}</div>`;
 }
 const talepAlan = T&&["danismanlik","inceleme"].includes(T.k) ? `<label class="field"><span>Talep eden</span><select class="input" id="yn-talep" data-yn="talep"><option value="">Seçin</option>${TALEP_EDEN.map(x=>`<option ${N.talep===x?"selected":""}>${x}</option>`).join("")}</select></label>` : "";
 const kapsam = `<div class="field"><span>Denetim boyutları <span class="hint">· yıllık plandaki türler; yöntem ve risk satırlarını belirler</span></span><div class="row">${BOYUTLAR.map(b=>`<label class="row"><input type="checkbox" id="yn-b-${b}" data-yn-arr="boyut" value="${b}" ${H.boyut&&H.boyut.includes(b)?"checked":""}> ${b}</label>`).join("")}</div></div>
  <div class="grid2"><label class="field"><span>İncelenen dönem başı</span><input class="input" type="date" id="yn-db" data-yn="donemBas" value="${N.donemBas}"></label><label class="field"><span>İncelenen dönem sonu</span><input class="input" type="date" id="yn-ds" data-yn="donemBit" value="${N.donemBit}"></label></div>
  <label class="field"><span>Denetlenen birim</span><input class="input" id="yn-birim" data-yn="birim" value="${esc(N.birim||H.birim||"")}"></label>
  ${talepAlan}
  <label class="field"><span>Kapsam notu <span class="hint">· isteğe bağlı, EK-7 kapsamına eklenir</span></span><textarea class="input" id="yn-not" data-yn="not" placeholder="Ör. yalnızca İstanbul Anadolu yakası şubeleri">${esc(N.not)}</textarea></label>`;
 const ekipler=S.users.filter(u=>u.role!=="mudur");
 const ekip = `<div class="grid2"><label class="field"><span>Planlanan başlangıç</span><input class="input" type="date" id="yn-st" data-yn="start" value="${N.start}"></label><label class="field"><span>Planlanan bitiş <span class="hint">· boşsa süre tahmininden</span></span><input class="input" type="date" id="yn-en" data-yn="end" value="${N.end||H.end||""}"></label></div>
  <div class="field"><span>Ekip</span><div class="row">${ekipler.map(u=>`<label class="row"><input type="checkbox" id="yn-u-${u.id}" data-yn-arr="ekip" value="${u.id}" ${N.ekip.includes(u.id)?"checked":""}> ${esc(u.name)}</label>`).join("")}</div></div>
  <label class="field"><span>Sorumlu denetçi</span><select class="input" id="yn-sor" data-yn="sorumlu">${ekipler.map(u=>`<option value="${u.id}" ${N.sorumlu===u.id?"selected":""}>${esc(u.name)}</option>`).join("")}</select></label>`;
 const planHtml = !T ? "" : H.plan ? `<div class="notice info"><div><b>2026 Denetim Planı'nda var.</b> ${esc(H.plan.surec)} · makro risk ${num2(H.plan.puan)} (${H.plan.duzey}) · ${H.plan.saat} saat.</div></div>`
  : ["sube","izleme"].includes(N.tur) ? `<div class="notice info"><div>${N.tur==="sube"?"Şube denetimleri yıllık şube denetim programı kapsamındadır.":"İzleme denetimleri plandaki izleme kapasitesinden karşılanır."}</div></div>`
  : N.tur==="inceleme" ? `<div class="notice info"><div>Özel incelemeler plan dışıdır; talep eden kayda alınır.</div></div>`
  : `<div class="notice warn"><div><b>Plan dışı.</b> Bu süreç 2026 Denetim Planı'nda yok${H.makro?` (makro risk ${num2(H.makro.puan)} · ${H.makro.duzey})`:""}.${N.tur==="danismanlik"?" Danışmanlık için talep eden yeterlidir.":" Gerekçe zorunludur."}</div></div>${N.tur!=="danismanlik"?`<label class="field"><span>Plan dışı denetim gerekçesi</span><textarea class="input" id="yn-ger" data-yn="gerekce" placeholder="Ör. sürekli denetimde tespit edilen anomali, YK talebi">${esc(N.gerekce)}</textarea></label>`:""}`;
 // önizleme
 const noTahmin = T ? `2026/${T.harf}-${pad2((S.seq[T.harf+"2026"]||0)+1)}` : "—";
 const li=(t,s)=>`<div class="li"><div class="li-main"><b>${t}</b><div class="li-sub" style="white-space:pre-wrap">${s}</div></div></div>`;
 const prev = !T ? `<div class="empty">Denetim türünü seçince eklere aktarılacak bilgiler burada görünür.</div>` :
  li("Rapor no ve başlık",`<span class="mono">${noTahmin}</span> · ${esc(H.konuBaslik||"—")}${H.makro&&H.makro.puan!=null?` · makro ${num2(H.makro.puan)} ${H.makro.duzey}`:""}`)+
  li("EK-1 Denetim Bildirimi · kapsam",esc(H.kk?H.ek1:"—"))+
  li("EK-3 Süre Planı",`Tahmini ${H.gun} iş günü; 11 faaliyete dağıtıldı. Bitiş ${fmt(H.end)}.`)+
  li(`EK-6 Risk Kontrol Matrisi · ${H.rkm.length} risk`,H.rkm.length?H.rkm.slice(0,4).map((r,i)=>`R-${pad2(i+1)} ${esc(r.risk)}`).join("\n")+(H.rkm.length>4?`\n+${H.rkm.length-4} risk daha`:""):"—")+
  li("EK-7 Denetim Programı",`Amaç, kapsam, yöntem, önceki denetimler, hazırlık (${H.belge.length} belge talebi) ve testler`)+
  li("EK-15 Süreç Bilgi Formu",H.ek15&&H.ek15.q1?esc(H.ek15.q1.slice(0,140))+(H.ek15.q1.length>140?"…":""):"Görüşmede doldurulur")+
  (H.belge.length?li("Bilgi ve belge talep listesi",H.belge.map(b=>"• "+esc(b)).join("\n")):"");
 const btn = isMudur()?"Denetim kaydını oluştur":"Oluştur ve müdür onayına gönder";
 return topbar("Yeni denetim",backTo("audits","Denetimler")) +
  `<p class="muted" style="margin-top:0">Türü ve konuyu seçin. Seçimlerinize göre EK-1, EK-3, EK-6, EK-7 ve EK-15 ön doldurulur; denetim başlayınca bu formlar görev olarak atanır ve ekip kontrol edip tamamlar.</p>
  <div class="cols"><div class="stack">${card(1,"Denetim türü",turHtml)}${T?card(2,T.konu==="sube"?"Şube":T.konu==="izleme"?"İzlenecek denetimler":T.konu==="serbest"?"İnceleme konusu":"Süreç ve konu",konu):""}${T?card(3,"Kapsam ve dönem",kapsam):""}${T?card(4,"Takvim ve ekip",ekip):""}${T?card(5,"Plan bağlantısı",planHtml):""}</div>
  <div class="stack scorebox"><div class="card"><div class="card-head"><h2>Eklere aktarılacaklar</h2></div>${prev}
   ${T?`<div class="stack" style="margin-top:12px;gap:8px">${H.eksik.length?`<div class="small muted">Eksik: ${esc(H.eksik[0])}</div>`:""}<button class="btn pri" data-act="ynOlustur" ${H.eksik.length?"disabled":""}>${btn}</button>${isMudur()?"":`<span class="small muted">Denetim, müdür onayladıktan sonra başlatılabilir.</span>`}</div>`:""}</div></div></div>`;
}

/* Denetim sayfası için: tanım kartı, talep bildirimi, şablon notu, belge talep listesi */
function ctxTanim(a){
 if(!a.denetimTuru) return "";
 const T=dtur(a.denetimTuru), rows=[["Tür",T?T.ad:""],["Odak",a.odak||""],["Süreç",a.surec],["Alt süreçler",(a.altSurecler||[]).join(", ")],["Boyutlar",(a.boyutlar||[]).join(", ")],["İncelenen dönem",a.donem?`${fmt(a.donem.bas)} – ${fmt(a.donem.bit)}`:""],["Plan",a.planId?"2026 Denetim Planı'nda":a.planDisi?`Plan dışı: ${a.planDisi.gerekce||"—"}`:"—"],["Talep eden",a.talepEden||""],["Şablon",a.sablonAd||""]].filter(r=>r[1]);
 return ctxCard("Denetim tanımı",`<ul class="ctx-list" style="list-style:none;padding:0">${rows.map(r=>`<li><span class="muted">${r[0]}:</span> ${esc(r[1])}</li>`).join("")}</ul>${a.belgeler&&a.belgeler.length?`<p style="margin-top:8px"><span class="muted">Bilgi ve belge talep listesi (${a.belgeler.length})</span></p><ul class="ctx-list">${a.belgeler.map((b,i)=>`<li>${esc(b)}${talepKanit(a,i).length?` <span class="chip c-ok nodot">Alındı</span>`:""}</li>`).join("")}</ul>`:""}`,
  a.belgeler&&a.belgeler.length?`<div class="btns"><button class="btn sm ghost" data-act="ynBelge" data-id="${a.id}" data-kind="docx">Talep listesi Word</button><button class="btn sm ghost" data-act="ynBelge" data-id="${a.id}" data-kind="pdf">PDF</button></div>`:"");
}
function talepNotice(a){
 if(!a.talep||a.talep.durum==="onaylandi") return "";
 if(a.talep.durum==="reddedildi") return `<div class="notice crit" style="margin-bottom:14px"><div><b>Denetim talebi reddedildi.</b> ${esc(a.talep.not||"")}</div></div>`;
 return `<div class="notice warn" style="margin-bottom:14px"><div style="flex:1"><b>${esc(user(a.talep.by).name)} bu denetimi oluşturdu; müdür onayı bekleniyor.</b> Onaylanınca "Denetime Başla" açılır.</div>${isMudur()?`<div class="btns"><button class="btn sm pri" data-act="ynTalep" data-id="${a.id}" data-ok="1">Onayla</button><button class="btn sm" data-act="ynTalep" data-id="${a.id}" data-ok="0">Reddet</button></div>`:""}</div>`;
}
function sablonNotice(a,f){
 if(!f.sablon||["tamam","onayli"].includes(f.status)) return "";
 return `<div class="notice info" style="margin-bottom:14px"><div><b>Ön dolduruldu.</b> Bu form denetim oluşturulurken seçilen konuya göre dolduruldu (${esc(f.sablon)}). Kontrol edin, birime ve döneme göre düzenleyin.</div></div>`;
}
function raporBaslik(a){
 if(!a.odak) return /SÜREÇLERİ$/.test(upTR(a.surec))?upTR(a.surec):upTR(a.surec)+" SÜREÇLERİ";
 const t=upTR(a.odak); if(["inceleme","izleme","sube"].includes(a.denetimTuru)) return t;
 return /(SÜRECİ|SÜREÇLERİ|YÖNETİMİ|OPERASYONLARI)$/.test(t)?t:t+" SÜRECİ";
}

const YENI_ACT = {
 yeni(){ yeniBaslat(); },
 ynTur(d){ NEW.tur=d.k; NEW.boyut=dtur(d.k).boyut.slice(); render(); },
 ynSablon(d){ NEW.planId=null; yeniSablon(d.id); render(); },
 ynOlustur(){ yeniOlustur(); },
 ynTalep(d){ const a=audit(d.id);
  if(d.ok==="1"){ a.talep.durum="onaylandi"; a.talep.onaylayan=S.me; a.ekip.forEach(u=>notify(u,`${a.no} ${a.konu} onaylandı; ekibe atandınız.`,{v:"audit",id:a.id})); log(`${a.no} denetim talebi onaylandı.`); commit("Denetim onaylandı; ekip bilgilendirildi."); }
  else modal(`Talebi reddet · ${a.no}`,`<label class="field"><span>Gerekçe</span><textarea class="input" id="yt-not"></textarea></label>`,`<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn danger" data-act="ynRed" data-id="${a.id}">Reddet</button>`); },
 ynRed(d){ const a=audit(d.id), n=val("yt-not"); if(!n) return toast("Gerekçe yazın."); a.talep.durum="reddedildi"; a.talep.not=n; a.status="reddedildi"; notify(a.talep.by,`${a.no} denetim talebiniz reddedildi: ${n}`,{v:"audit",id:a.id}); log(`${a.no} denetim talebi reddedildi.`); MODAL=null; commit("Talep reddedildi."); },
 ynBelge(d){ const a=audit(d.id); exportDoc(`${a.no.replace("/","-")} Bilgi ve Belge Talep Listesi`,[{t:"org"},{t:"title",text:"BİLGİ VE BELGE TALEP LİSTESİ"},hdr(a),{t:"p",text:`İncelenen dönem: ${a.donem?fmt(a.donem.bas)+" – "+fmt(a.donem.bit):"—"}`},{t:"table",head:["No","Talep edilen bilgi / belge","Teslim tarihi","Teslim alındı"],rows:a.belgeler.map((b,i)=>[String(i+1),b,"",""])},{t:"p",text:`Talep eden: ${names(a.ekip)} (İç Denetim)`}],d.kind,false); }
};
function yeniSet(k,v){
 if(k==="ara"){ NEW.planId=null; yeniAra(v); return render(); }
 NEW[k]=v;
 if(k==="kat"||k==="surec") NEW.planId=null;
 if(k==="kat"){ NEW.surec=""; NEW.alt=[]; NEW.sablon=null; NEW.birim=""; }
 if(k==="surec"){ NEW.alt=[]; NEW.sablon=null; NEW.birim=""; NEW.odak=""; }
 render();
}
