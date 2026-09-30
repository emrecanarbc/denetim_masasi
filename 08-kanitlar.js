"use strict";
/* ============ Kanıtlar: denetimde üzerinde çalışılan dosyalar ============
   Kayıt (metadata) denetim kaydında, dosya içeriği tarayıcının IndexedDB'sinde tutulur (demo).
   Kurumsal sürümde içerik sunucudaki dosya deposuna gider. */
const KAYNAKLAR = ["Birimden alındı","Sistemden (ERP) çekildi","Denetçi çalışması / analiz","Dış kaynak","Toplantı / görüşme notu"];
const XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
let KF = {t:"",q:""};
const kanitlar = a => a.kanitlar || (a.kanitlar=[]);
const sonSurum = k => k.surumler[k.surumler.length-1];
const extOf = n => (String(n).match(/\.([a-z0-9]+)$/i)||[])[1] ? String(n).match(/\.([a-z0-9]+)$/i)[1].toLowerCase() : "";
const boyutTxt = b => b==null ? "" : b<1024 ? b+" B" : b<1048576 ? Math.round(b/1024)+" KB" : (b/1048576).toFixed(1).replace(".",",")+" MB";

/* ---- IndexedDB ---- */
const KDB = {
 p:null,
 open(){ if(this.p) return this.p; this.p=new Promise(res=>{ try{ const r=indexedDB.open("denetim-masasi-gh-kanit",1); r.onupgradeneeded=()=>r.result.createObjectStore("f"); r.onsuccess=()=>res(r.result); r.onerror=()=>res(null); }catch(e){ res(null); } }); return this.p; },
 async put(id,blob){ const db=await this.open(); if(!db) return false; return new Promise(res=>{ try{ const tx=db.transaction("f","readwrite"); tx.objectStore("f").put(blob,id); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); tx.onabort=()=>res(false); }catch(e){ res(false); } }); },
 async get(id){ const db=await this.open(); if(!db) return null; return new Promise(res=>{ try{ const r=db.transaction("f").objectStore("f").get(id); r.onsuccess=()=>res(r.result||null); r.onerror=()=>res(null); }catch(e){ res(null); } }); }
};

/* ---- Örnek kanıtların içeriği (üretilir) ---- */
function seedSheets(fid){
 const R=(s=>()=>{ s=(s*16807)%2147483647; return s/2147483647; })(fid.length*7919+13);
 const g=d=>{ const x=new Date(2026,0,2); x.setDate(x.getDate()+d); return iso(x); };
 if(fid==="seed:odeme-v1"||fid==="seed:odeme-v2"){
  const banka=["Banka A","Banka B","Banka C"], evren=[["Talimat no","Tarih","Banka","Alıcı","Tutar (TL)","1. imza","2. imza"]];
  for(let i=1;i<=48;i++){ const b=banka[i%3], tek=[8,20,32].includes(i); evren.push([`OT-2026-${String(i*8).padStart(4,"0")}`,g(Math.floor(i*3.6)),b,`Tedarikçi ${String.fromCharCode(65+(i%12))}`,tek?Math.round(420000+R()*300000):Math.round(80000+R()*900000),"Hazine Uzmanı",tek?"":"Finansman Müdürü"]); }
  if(fid==="seed:odeme-v1") return {Evren:evren};
  const orn=[["Talimat no","Tarih","Banka","Tutar (TL)","İmza sayısı","Yetki listesinde mi","Sonuç"]];
  evren.slice(1).filter((r,i)=>r[4]>250000).slice(0,25).forEach(r=>orn.push([r[0],r[1],r[2],r[4],r[6]?2:1,"Evet",r[6]?"Uygun":"Tek imza – istisna"]));
  return {Evren:evren,"Örneklem":orn,"Not":[["Açıklama"],["Tutar > 250.000 TL olan talimatlardan 25 örneklem seçildi."],["Banka C'de çift imza kuralı tanımlı değil; 3 talimat tek imzayla gönderilmiş."]]};
 }
 if(fid==="seed:nakit"){
  const r=[["Tarih","Rapor gönderim saati","Onay saati","Onaylayan","Durum"]]; let say=0;
  for(let i=0;i<20;i++){ const onaysiz=[1,2,4,5,7,8,10,12,13,15,17,19].includes(i); if(onaysiz) say++; r.push([g(120+i+Math.floor(i/5)*2),`09:${String(10+Math.floor(R()*40)).padStart(2,"0")}`,onaysiz?"":`09:0${Math.floor(R()*9)}`,onaysiz?"":"Hazine Yöneticisi",onaysiz?"Onaysız gönderildi":"Onaylı"]); }
  r.push(["Toplam","","","",`${say} / 20 onaysız`]); return {"Nakit pozisyon":r};
 }
 if(fid==="seed:mutabakat"){
  const r=[["Ay","Banka","Banka bakiyesi","Defter bakiyesi","Fark","Açıklama","Hazırlayan","Onaylayan"]];
  ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran"].forEach((m,i)=>["Banka A","Banka B","Banka C"].forEach(b=>{ const bb=Math.round(2e6+R()*8e6), f=i===2&&b==="Banka B"?14250:0; r.push([m,b,bb,bb-f,f,f?"Yolda olan EFT, 1 Nisan'da kapandı":"",`Hazine Uzmanı`,"Finansman Müdürü"]); }));
  return {"Mutabakat":r};
 }
 return null;
}
const csvOf = rows => rows.map(r=>r.map(c=>{ const s=String(c==null?"":c); return /[;"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }).join(";")).join("\r\n");

function kanitMigrate(){
 S.audits.forEach(a=>kanitlar(a));
 if(S.kanitSeed) return; S.kanitSeed=true;
 const a=S.audits.find(x=>x.id==="a4"); if(!a) return;
 if(!a.belgeler) a.belgeler=["Ödeme yetki matrisi ve imza sirküleri","İnternet bankacılığı kullanıcı ve yetki listeleri","Dönem ödeme talimatları listesi (Excel)","Aylık banka mutabakatları","Günlük nakit pozisyon raporları ve onay e-postaları"];
 const st=(d,h)=>addDays(d)+" "+h;
 a.kanitlar=[
  {id:"k1",ad:"odeme_talimatlari_2026H1.xlsx",bag:{t:"test",id:"x1"},talep:2,kaynak:"Sistemden (ERP) çekildi",yukleyen:"u3",tarih:st(-10,"10:12"),
   aciklama:"T-01 çift imza testi: ödeme talimatı evreni ve 25'lik örneklem.",
   calisma:"Ocak–Haziran 2026 internet bankacılığı talimatları ERP'den alındı (48 satır, demo). Tutarı 250.000 TL üstü olanlardan 25 örneklem seçildi; imza sayısı ve yetki listesiyle karşılaştırıldı. Banka C'deki 3 tek imzalı talimat 'Örneklem' sayfasında 'Tek imza – istisna' olarak işaretlendi.",
   surumler:[{fid:"seed:odeme-v1",ad:"odeme_talimatlari_2026H1.xlsx",boyut:18432,tarih:st(-10,"10:12"),by:"u3",not:"ERP'den alınan ham veri"},{fid:"seed:odeme-v2",ad:"odeme_talimatlari_2026H1.xlsx",boyut:24576,tarih:st(-8,"16:40"),by:"u3",not:"Örneklem ve sonuç sütunu eklendi"}],
   gunluk:[{at:st(-9,"11:05"),by:"u3",not:"Banka C'de çift imza kuralı olmadığı hazine uzmanıyla teyit edildi."}]},
  {id:"k2",ad:"imza_sirkuleri_2025.pdf",bag:{t:"rkm",id:"r1"},talep:0,kaynak:"Birimden alındı",yukleyen:"u4",tarih:st(-14,"09:30"),
   aciklama:"R-01 için yetki listesi karşılaştırması: güncel imza sirküleri.",calisma:"Banka yetki listeleri ile imza sirkülerindeki A ve B grubu imzacılar karşılaştırıldı; fark yok.",
   surumler:[{fid:"seed:yok",ad:"imza_sirkuleri_2025.pdf",boyut:412000,tarih:st(-14,"09:30"),by:"u4",not:""}],gunluk:[]},
  {id:"k3",ad:"nakit_pozisyon_onay_analizi.csv",bag:{t:"ck",id:"w3"},talep:4,kaynak:"Denetçi çalışması / analiz",yukleyen:"u3",tarih:st(-5,"14:20"),
   aciklama:"ÇK-05-03 dayanağı: 20 iş günü nakit pozisyon raporunun onay izi.",calisma:"Rapor e-postalarının gönderim saati ile yönetici onay e-postalarının saati eşleştirildi. 12 günde onay bulunamadı. B2 bulgusunun sayısal dayanağı bu dosyadır.",
   surumler:[{fid:"seed:nakit",ad:"nakit_pozisyon_onay_analizi.csv",boyut:1650,tarih:st(-5,"14:20"),by:"u3",not:""}],gunluk:[{at:st(-4,"10:00"),by:"u2",not:"Gözden geçirildi; örneklem yeterli."}]},
  {id:"k4",ad:"banka_mutabakatlari_ocak_haziran.xlsx",bag:{t:"ck",id:"w2"},talep:3,kaynak:"Birimden alındı",yukleyen:"u4",tarih:st(-9,"15:05"),
   aciklama:"ÇK-05-02: altı aylık banka mutabakatları.",calisma:"Her ay ve banka için banka ile defter bakiyesi karşılaştırıldı; tek fark (Mart, Banka B, 14.250 TL) yolda olan EFT, 1 Nisan'da kapanmış. Onay imzaları tam.",
   surumler:[{fid:"seed:mutabakat",ad:"banka_mutabakatlari_ocak_haziran.xlsx",boyut:15360,tarih:st(-9,"15:05"),by:"u4",not:""}],gunluk:[]}
 ];
}
kanitMigrate(); save();

/* ---- Bağlantılar ---- */
function bagSecenek(a){
 const o=[["genel:","Genel (denetimin tamamı)"]];
 rkmRows(a).forEach((r,i)=>o.push([`rkm:${r.id}`,`R-${pad2(i+1)} · ${String(r.risk||"").slice(0,60)}`]));
 testRows(a).forEach(t=>o.push([`test:${t.id}`,`${testCode(a,t.id)} · ${String(t.test||"").slice(0,60)}`]));
 a.ek4.forEach(w=>o.push([`ck:${w.id}`,`${w.ref} · ${String(w.test||"").slice(0,55)}`]));
 findingsOf(a.id).forEach(f=>o.push([`bulgu:${f.id}`,`B${f.no} · ${String(f.konu||"").slice(0,60)}`]));
 return o;
}
function bagEtiket(a,b){
 if(!b||b.t==="genel") return "Genel";
 if(b.t==="rkm") return `${rkmCode(a,b.id)} risk`;
 if(b.t==="test") return `${testCode(a,b.id)} test`;
 if(b.t==="ck"){ const w=a.ek4.find(x=>x.id===b.id); return w?w.ref:"Çalışma kağıdı"; }
 if(b.t==="bulgu"){ const f=finding(b.id); return f?`B${f.no} bulgu`:"Bulgu"; }
 return "—";
}
const talepKanit = (a,i) => kanitlar(a).filter(k=>k.talep===i);
const kanitSay = (a,t,id) => kanitlar(a).filter(k=>k.bag&&k.bag.t===t&&k.bag.id===id).length;

/* Dosyayı kaydet: kayıt hemen eklenir, içerik arka planda saklanır */
function kanitKaydet(a,file,meta){
 const fid=uid("kf"), now=nowStamp();
 const k=Object.assign({id:uid("k"),ad:file.name,bag:{t:"genel",id:""},talep:null,kaynak:KAYNAKLAR[2],aciklama:"",calisma:"",yukleyen:S.me,tarih:now,gunluk:[]},meta,{surumler:[{fid,ad:file.name,boyut:file.size,tarih:now,by:S.me,not:meta.surumNot||""}]});
 delete k.surumNot; kanitlar(a).unshift(k);
 KDB.put(fid,file).then(ok=>{ if(!ok) toast(`${file.name}: içerik bu tarayıcıda saklanamadı; yalnızca kayıt tutuldu.`); });
 log(`${a.no} kanıt eklendi: ${file.name} (${bagEtiket(a,k.bag)}).`);
 return k;
}
const dosyaObj = id => { const el=document.getElementById(id); return el&&el.files&&el.files[0] ? el.files[0] : null; };

/* ---- Görünüm ---- */
function renderKanit(a){
 const ks=kanitlar(a), q=trLow(KF.q);
 const tip=[["","Tümü"],["genel","Genel"],["rkm","Risk"],["test","Test"],["ck","Çalışma kağıdı"],["bulgu","Bulgu"]];
 const liste=ks.filter(k=>(!KF.t||(k.bag&&k.bag.t)===KF.t)&&(!q||trLow(k.ad+" "+k.aciklama+" "+k.calisma).includes(q)));
 const talepCard = a.belgeler&&a.belgeler.length ? `<div class="card"><div class="card-head"><h2>Belge talep listesi</h2><span class="muted small">${a.belgeler.filter((_,i)=>talepKanit(a,i).length).length} / ${a.belgeler.length} alındı</span></div>${a.belgeler.map((b,i)=>{ const kk=talepKanit(a,i); return `<div class="li"><div class="li-main"><div>${esc(b)}</div>${kk.length?`<div class="li-sub">${kk.map(k=>`<button class="btn sm ghost" style="padding:0 4px" data-act="knAc" data-id="${a.id}" data-k="${k.id}">${esc(k.ad)}</button>`).join(" ")}</div>`:""}</div>${kk.length?chip(["Alındı","c-ok"]):`<button class="btn sm" data-act="knModal" data-id="${a.id}" data-talep="${i}">Yükle</button>`}</div>`; }).join("")}</div>` : "";
 const olay=[]; ks.forEach(k=>{ k.surumler.forEach((s,i)=>olay.push({at:s.tarih,by:s.by,txt:`${i?"Yeni sürüm (v"+(i+1)+")":"Yüklendi"}: ${k.ad}${s.not?" · "+s.not:""}`,k})); k.gunluk.forEach(g=>olay.push({at:g.at,by:g.by,txt:`Not · ${k.ad}: ${g.not}`,k})); });
 olay.sort((x,y)=>String(y.at).localeCompare(String(x.at)));
 const rows = liste.map(k=>{ const s=sonSurum(k); return `<tr class="click" data-act="knAc" data-id="${a.id}" data-k="${k.id}"><td style="min-width:240px"><b>${esc(k.ad)}</b> <span class="small muted"><span class="mono">.${esc(extOf(k.ad)||"?")}</span> · ${boyutTxt(s.boyut)}${k.surumler.length>1?` · v${k.surumler.length}`:""}</span><div class="small" style="margin-top:2px">${esc(k.aciklama)}</div>${k.calisma?`<div class="li-sub">${esc(k.calisma.slice(0,120))}${k.calisma.length>120?"…":""}</div>`:""}</td><td class="small" style="min-width:130px">${esc(bagEtiket(a,k.bag))}${k.talep!=null&&a.belgeler&&a.belgeler[k.talep]?` · talep ${k.talep+1}`:""}<div class="li-sub">${esc(k.kaynak)}</div></td><td class="small">${esc(user(k.yukleyen).name)}<div class="li-sub">${esc(fmt(String(k.tarih).slice(0,10)))}</div></td></tr>`; }).join("");
 return `<div class="spread" style="margin-bottom:12px"><p class="muted" style="margin:0;max-width:760px">Denetimde üzerinde çalışılan veriler, birimden gelen belgeler ve analiz dosyaları. Her dosyada ne için kullanıldığı ve üzerinde ne yapıldığı yazılır; yeni sürüm yüklenince eskisi silinmez.</p><button class="btn pri" data-act="knModal" data-id="${a.id}">Kanıt ekle</button></div>
  <div class="cols"><div class="stack">
   <div class="spread"><div class="seg">${tip.map(x=>`<button class="${KF.t===x[0]?"on":""}" data-act="knFiltre" data-t="${x[0]}">${x[1]}</button>`).join("")}</div><input class="input" id="kn-q" data-kq="1" value="${esc(KF.q)}" placeholder="Dosya adı veya açıklamada ara" style="max-width:260px" aria-label="Kanıtlarda ara"></div>
   ${liste.length?`<div class="tw"><table class="t"><tr><th>Dosya · ne için, ne yapıldı</th><th>Bağlı olduğu yer · kaynak</th><th>Yükleyen</th></tr>${rows}</table></div>`:`<div class="card empty">${ks.length?"Bu filtrede kanıt yok.":"Henüz kanıt yok. Birimden gelen Excel'leri, sistemden çekilen verileri ve analiz dosyalarınızı buraya ekleyin."}</div>`}
   <p class="small muted" style="margin:0">Demo: dosyaların içeriği yüklendiği tarayıcıda saklanır. Kurumsal sürümde kurum içi sunucudaki dosya deposuna yazılır.</p></div>
   <div class="stack">${talepCard}<div class="card"><div class="card-head"><h2>Çalışma günlüğü</h2><span class="muted small">Ne üzerinde, nasıl çalışıldı</span></div>${olay.length?olay.slice(0,14).map(o=>`<div class="li" data-act="knAc" data-id="${a.id}" data-k="${o.k.id}" style="cursor:pointer"><div class="li-main"><div class="small">${esc(o.txt)}</div><div class="li-sub">${esc(fmt(String(o.at).slice(0,10)))} ${esc(String(o.at).slice(11))} · ${esc(user(o.by).name)}</div></div></div>`).join(""):`<div class="empty">Henüz kayıt yok.</div>`}</div></div></div>`;
}

function kanitModal(a,pre){
 pre=pre||{};
 const bagSel = pre.bag || "genel:";
 modal("Kanıt ekle",`<label class="field"><span>Dosyalar <span class="hint">· Excel, CSV, PDF, Word, görsel; birden fazla seçilebilir</span></span><input class="input" type="file" id="kn-file" multiple></label>
  <label class="field"><span>Ne için kullanıldı</span><input class="input" id="kn-ac" placeholder="Ör. T-02 için dönem tahsilat listesi ve iskonto yeniden hesaplaması"></label>
  <div class="grid2"><label class="field"><span>Bağlı olduğu iş</span><select class="input" id="kn-bag">${bagSecenek(a).map(o=>`<option value="${esc(o[0])}" ${o[0]===bagSel?"selected":""}>${esc(o[1])}</option>`).join("")}</select></label>
  <label class="field"><span>Kaynak</span><select class="input" id="kn-kay">${KAYNAKLAR.map(x=>`<option ${x===(pre.kaynak||KAYNAKLAR[0])?"selected":""}>${x}</option>`).join("")}</select></label></div>
  ${a.belgeler&&a.belgeler.length?`<label class="field"><span>Karşıladığı belge talebi <span class="hint">· isteğe bağlı</span></span><select class="input" id="kn-talep"><option value="">—</option>${a.belgeler.map((b,i)=>`<option value="${i}" ${pre.talep===i?"selected":""}>${i+1}. ${esc(b)}</option>`).join("")}</select></label>`:""}
  <label class="field"><span>Üzerinde yapılan çalışma <span class="hint">· filtre, formül, pivot, örneklem, karşılaştırma</span></span><textarea class="input" id="kn-cal" placeholder="Ör. 1.240 satırdan vadesi geçmiş ödemeler süzüldü; iskonto yeniden hesaplandı; 37 farklı satır 'Fark' sayfasına alındı."></textarea></label>`,
  `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="knKaydet" data-id="${a.id}">Kaydet</button>`,true);
}

async function kanitBlob(k,s){
 if(String(s.fid).startsWith("seed:")){
  const sh=seedSheets(s.fid); if(!sh) return null;
  if(extOf(s.ad)==="csv") return new Blob(["﻿"+csvOf(Object.values(sh)[0])],{type:"text/csv"});
  const X=await yukleXlsx(); if(!X) return null; const wb=X.utils.book_new(); Object.entries(sh).forEach(([n,r])=>X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(r),n.slice(0,31)));
  return new Blob([X.write(wb,{type:"array",bookType:"xlsx"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
 }
 return await KDB.get(s.fid);
}
let _xlsxP=null;
function yukleXlsx(){ if(window.XLSX) return Promise.resolve(window.XLSX); if(_xlsxP) return _xlsxP;
 _xlsxP=new Promise(res=>{ const sc=document.createElement("script"); sc.src=XLSX_URL; sc.onload=()=>res(window.XLSX||null); sc.onerror=()=>{ _xlsxP=null; res(null); }; document.head.appendChild(sc); }); return _xlsxP; }

function tabloHtml(rows){ const r=rows.slice(0,31), nc=Math.min(14,Math.max(0,...r.map(x=>x.length)));
 return `<div class="tw" style="max-height:380px;overflow:auto"><table class="t">${r.map((x,i)=>`<tr>${Array.from({length:nc},(_,j)=>{ const v=x[j]; const c=esc(v==null?"":typeof v==="number"?v.toLocaleString("tr-TR"):String(v)); return i===0?`<th>${c}</th>`:`<td${typeof v==="number"?' class="num"':""}>${c}</td>`; }).join("")}</tr>`).join("")}</table></div>`; }
async function kanitOnizle(a,k,si){
 const el=document.getElementById("kn-prev"); if(!el) return; const s=k.surumler[si], ext=extOf(s.ad);
 if(s.fid==="seed:yok"){ el.innerHTML=`<div class="empty">Örnek kayıt: bu dosyanın içeriği demo verisinde yok.</div>`; return; }
 el.innerHTML=`<div class="empty">Önizleme hazırlanıyor…</div>`;
 try{
  if(String(s.fid).startsWith("seed:")&&["xlsx","csv"].includes(ext)){ const sh=seedSheets(s.fid); return kanitSayfalar(el,Object.entries(sh).map(([n,r])=>({n,r}))); }
  const b=await kanitBlob(k,s);
  if(!b){ el.innerHTML=`<div class="empty">Dosya içeriği bu tarayıcıda bulunamadı. Demo sürümünde içerik, dosyanın yüklendiği tarayıcıda saklanır.</div>`; return; }
  if(["xlsx","xls","xlsm","csv","ods"].includes(ext)){
   const X=await yukleXlsx(); if(!X){ el.innerHTML=`<div class="empty">Excel önizleme kütüphanesi yüklenemedi. Dosyayı indirerek açabilirsiniz.</div>`; return; }
   const wb= ext==="csv" ? X.read(await b.text(),{type:"string"}) : X.read(new Uint8Array(await b.arrayBuffer()),{type:"array"});
   return kanitSayfalar(el,wb.SheetNames.map(n=>({n,r:X.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:""})})));
  }
  if(["png","jpg","jpeg","gif","webp"].includes(ext)){ el.innerHTML=`<img alt="${esc(s.ad)}" style="max-width:100%;border:1px solid var(--line);border-radius:6px" src="${URL.createObjectURL(b)}">`; return; }
  if(["txt","md","json"].includes(ext)){ const t=await b.text(); el.innerHTML=`<pre class="small" style="white-space:pre-wrap;max-height:380px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:6px">${esc(t.slice(0,6000))}</pre>`; return; }
  if(ext==="pdf"){ el.innerHTML=`<iframe title="${esc(s.ad)}" style="width:100%;height:460px;border:1px solid var(--line);border-radius:6px" src="${URL.createObjectURL(b)}"></iframe><p class="small muted" style="margin:6px 0 0">PDF görünmüyorsa indirerek açın.</p>`; return; }
  el.innerHTML=`<div class="empty">.${esc(ext)} dosyaları için önizleme yok. İndirerek açabilirsiniz.</div>`;
 }catch(e){ el.innerHTML=`<div class="empty">Önizleme açılamadı: ${esc(e.message||String(e))}</div>`; }
}
function kanitSayfalar(el,sh){
 const ciz=i=>{ const s=sh[i]; el.innerHTML=`${sh.length>1?`<div class="seg" style="margin-bottom:8px">${sh.map((x,j)=>`<button class="${i===j?"on":""}" data-ks="${j}">${esc(x.n)}</button>`).join("")}</div>`:""}<div class="small muted" style="margin-bottom:6px">${esc(s.n)} · ${Math.max(0,s.r.length-1)} satır${s.r.length>31?" · ilk 30 satır gösteriliyor":""}</div>${tabloHtml(s.r)}`;
  el.querySelectorAll("[data-ks]").forEach(b=>b.addEventListener("click",ev=>{ ev.stopPropagation(); ciz(+b.dataset.ks); })); };
 ciz(0);
}
function kanitAc(a,k,si){
 si = si==null ? k.surumler.length-1 : si; const s=k.surumler[si];
 modal(k.ad,`<div class="grid3 small"><div><span class="muted">Bağlı olduğu yer</span><div>${esc(bagEtiket(a,k.bag))}</div></div><div><span class="muted">Kaynak</span><div>${esc(k.kaynak)}</div></div><div><span class="muted">Yükleyen</span><div>${esc(user(k.yukleyen).name)} · ${esc(fmt(String(k.tarih).slice(0,10)))}</div></div></div>
  ${k.talep!=null&&a.belgeler&&a.belgeler[k.talep]?`<div class="small"><span class="muted">Karşıladığı belge talebi:</span> ${k.talep+1}. ${esc(a.belgeler[k.talep])}</div>`:""}
  <div><div class="section-label">Ne için kullanıldı</div><div>${esc(k.aciklama||"—")}</div></div>
  <div><div class="section-label">Üzerinde yapılan çalışma</div><div style="white-space:pre-wrap">${esc(k.calisma||"—")}</div></div>
  <div><div class="spread"><div class="section-label">Önizleme · v${si+1}${si<k.surumler.length-1?" (eski sürüm)":""}</div><button class="btn sm" data-act="knIndir" data-id="${a.id}" data-k="${k.id}" data-s="${si}">İndir</button></div><div id="kn-prev" style="margin-top:8px"></div></div>
  <div><div class="section-label">Sürümler</div>${k.surumler.map((x,i)=>`<div class="li"><div class="li-main"><b>v${i+1}</b> <span class="small">${esc(x.ad)} · ${boyutTxt(x.boyut)}</span><div class="li-sub">${esc(fmt(String(x.tarih).slice(0,10)))} ${esc(String(x.tarih).slice(11))} · ${esc(user(x.by).name)}${x.not?" · "+esc(x.not):""}</div></div><div class="btns">${i!==si?`<button class="btn sm ghost" data-act="knAc" data-id="${a.id}" data-k="${k.id}" data-s="${i}">Göster</button>`:""}<button class="btn sm ghost" data-act="knIndir" data-id="${a.id}" data-k="${k.id}" data-s="${i}">İndir</button></div></div>`).join("")}
   <div class="grid2" style="margin-top:8px"><label class="field"><span>Yeni sürüm yükle</span><input class="input" type="file" id="kn-yeni"></label><label class="field"><span>Bu sürümde ne değişti</span><input class="input" id="kn-yeni-not" placeholder="Ör. birimden gelen düzeltilmiş liste"></label></div></div>
  <div><div class="section-label">Notlar</div>${k.gunluk.length?k.gunluk.map(g=>`<div class="li"><div class="li-main"><div>${esc(g.not)}</div><div class="li-sub">${esc(fmt(String(g.at).slice(0,10)))} ${esc(String(g.at).slice(11))} · ${esc(user(g.by).name)}</div></div></div>`).join(""):`<div class="empty">Not yok.</div>`}
   <label class="field" style="margin-top:6px"><span>Not ekle</span><textarea class="input" id="kn-not" placeholder="Ör. pivotta şube bazında toplandı; 3 şube ortalamanın 2 katı"></textarea></label></div>`,
  `${isMudur()?`<button class="btn danger" data-act="knSil" data-id="${a.id}" data-k="${k.id}">Kaldır</button>`:""}<button class="btn" data-act="closeModal">Kapat</button><button class="btn pri" data-act="knGuncelle" data-id="${a.id}" data-k="${k.id}">Notu / sürümü kaydet</button>`,true);
 const ae=document.activeElement; if(ae&&ae.blur) ae.blur(); const mb=document.querySelector(".modal-b"); if(mb) mb.scrollTop=0;
 kanitOnizle(a,k,si);
}

const KANIT_ACT = {
 knModal(d){ const a=audit(d.id); kanitModal(a,{talep:d.talep!=null&&d.talep!==""?+d.talep:null,kaynak:d.talep!=null?KAYNAKLAR[0]:null,bag:d.bag}); },
 knFiltre(d){ KF.t=d.t; render(); },
 knKaydet(d){ const a=audit(d.id), el=document.getElementById("kn-file"), fs=el&&el.files?[...el.files]:[];
  if(!fs.length) return toast("Dosya seçin."); const ac=val("kn-ac"); if(!ac) return toast("Dosyanın ne için kullanıldığını yazın.");
  const [t,id]=val("kn-bag").split(":"), tv=val("kn-talep");
  fs.forEach(f=>kanitKaydet(a,f,{aciklama:ac,calisma:val("kn-cal"),kaynak:val("kn-kay"),bag:{t,id},talep:tv===""||tv==null?null:+tv}));
  MODAL=null; S.ui.tab="kanit"; commit(`${fs.length} kanıt eklendi.`); },
 knAc(d){ const a=audit(d.id), k=kanitlar(a).find(x=>x.id===d.k); if(!k) return; kanitAc(a,k,d.s!=null?+d.s:null); },
 async knIndir(d){ const a=audit(d.id), k=kanitlar(a).find(x=>x.id===d.k), s=k.surumler[+d.s], b=await kanitBlob(k,s);
  if(!b) return toast(s.fid==="seed:yok"?"Örnek kayıt: içerik yok.":"Dosya içeriği bu tarayıcıda bulunamadı.");
  const dl=await getDownloads();
  if(!dl){ try{ const u=URL.createObjectURL(b), x=document.createElement("a"); x.href=u; x.download=s.ad; document.body.appendChild(x); x.click(); x.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); }catch(e){ toast("Bu görünümde indirme kullanılamıyor."); } return; }
  try{ await dl.save({filename:s.ad,data:b}); toast(s.ad+" kaydedildi."); }
  catch(e){ const c=e&&e.code; toast(c==="declined"?"İndirme iptal edildi.":c==="rejected_extension"||c==="extension_not_enabled"?`.${extOf(s.ad)} dosyaları bu görünümde indirilemiyor.`:c==="rate_limited"?"Açık bir indirme onayı var; biraz sonra tekrar deneyin.":"Dosya indirilemedi."); } },
 knGuncelle(d){ const a=audit(d.id), k=kanitlar(a).find(x=>x.id===d.k), f=dosyaObj("kn-yeni"), n=val("kn-not"), yn=val("kn-yeni-not");
  if(!f&&!n) return toast("Not yazın veya yeni sürüm dosyası seçin.");
  if(f){ const fid=uid("kf"); k.surumler.push({fid,ad:f.name,boyut:f.size,tarih:nowStamp(),by:S.me,not:yn}); k.ad=f.name; KDB.put(fid,f).then(ok=>{ if(!ok) toast("İçerik bu tarayıcıda saklanamadı; yalnızca kayıt tutuldu."); }); log(`${a.no} kanıt yeni sürüm: ${f.name} (v${k.surumler.length}).`); }
  if(n){ k.gunluk.push({at:nowStamp(),by:S.me,not:n}); }
  save(); kanitAc(a,k); toast(f?`v${k.surumler.length} yüklendi; önceki sürüm saklandı.`:"Not eklendi."); },
 knSil(d){ const a=audit(d.id), k=kanitlar(a).find(x=>x.id===d.k); a.kanitlar=kanitlar(a).filter(x=>x!==k); log(`${a.no} kanıt kaldırıldı: ${k.ad} (${k.surumler.length} sürüm).`); MODAL=null; commit("Kanıt kaldırıldı; işlem değişiklik kaydına yazıldı."); }
};
