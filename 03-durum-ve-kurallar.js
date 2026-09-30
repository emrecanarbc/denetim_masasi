"use strict";
/* ============ Durum ============ */
const KEY = "denetim-masasi-gh-v1";
let S = null;
try{ const raw = localStorage.getItem(KEY); if(raw) S = JSON.parse(raw); }catch(e){}
if(!S || S.v!==5) S = seed();
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

let MODAL = null, DRAWER = false, DRAFT = null, DB = null, RESET_ARMED = false;

const user = id => S.users.find(u=>u.id===id) || {name:"—",title:""};
const me = () => user(S.me);
const isMudur = () => me().role==="mudur";
const canReview = () => ["mudur","yonetici"].includes(me().role);
const audit = id => S.audits.find(a=>a.id===id);
const planRow = id => S.plan.find(p=>p.id===id);
const finding = id => S.findings.find(f=>f.id===id);
const findingsOf = aid => S.findings.filter(f=>f.auditId===aid).sort((a,b)=>a.no-b.no);
const names = ids => ids.map(i=>user(i).name).join(", ");
const mudurler = () => S.users.filter(u=>u.role==="mudur");
const reviewers = () => S.users.filter(u=>u.role==="mudur"||u.role==="yonetici");
const fcode = f => `${audit(f.auditId).no} · B${f.no}`;

/* ---- RKM → Test → Çalışma kağıdı → Bulgu zinciri ---- */
const rkmRows = a => (formOf(a,"EK6").data.rows||[]).filter(r=>r.id);
const testRows = a => (formOf(a,"EK8").data.rows||[]).filter(r=>r.id);
const rkmCode = (a,id) => { const i=rkmRows(a).findIndex(r=>r.id===id); return i<0?"—":"R-"+pad2(i+1); };
const testCode = (a,id) => { const i=testRows(a).findIndex(r=>r.id===id); return i<0?"—":"T-"+pad2(i+1); };
const rkmById = (a,id) => rkmRows(a).find(r=>r.id===id);
const testById = (a,id) => testRows(a).find(r=>r.id===id);
const ckOfTest = (a,tid) => a.ek4.find(w=>w.testId===tid);
const findingsOfTest = (a,tid) => S.findings.filter(f=>f.auditId===a.id&&f.testId===tid);
const canApproveB = f => isMudur() || (me().role==="yonetici" && f.sorumluDenetci!==S.me);
const pendingTask = (a,k) => S.tasks.find(t=>t.auditId===a.id&&t.formKey===k&&t.durum==="onay_bekliyor");
function diffForm(key,a,b){ a=a||{}; b=b||{}; const out=[], def=FORMS[key]; const s=v=>v==null?"":typeof v==="object"?JSON.stringify(v):String(v);
 if(def.fields) def.fields.forEach(x=>{ if(s(a[x.k])!==s(b[x.k])) out.push({l:x.l,b:s(a[x.k]),a:s(b[x.k])}); });
 if(def.custom==="sure"){ (b.rows||[]).forEach((r,i)=>{ const o=(a.rows||[])[i]||{}; ["p","r","g"].forEach(c=>{ if(s(o[c])!==s(r[c])) out.push({l:`${EK3_ROWS[i]} · ${({p:"planlanan",r:"revize",g:"gerçekleşen"})[c]} (gün)`,b:s(o[c]),a:s(r[c])}); }); }); if(s(a.gerekce)!==s(b.gerekce)) out.push({l:"Revizyon gerekçesi",b:s(a.gerekce),a:s(b.gerekce)}); }
 if(def.custom==="rows"){ const pre=key==="EK6"?"R-":"T-", ar=a.rows||[], br=b.rows||[], sh=(c,v)=>c.t==="team"?user(v).name:s(v);
  br.forEach((r,i)=>{ const o=ar.find(x=>x.id&&x.id===r.id); if(!o) out.push({l:`${pre}${pad2(i+1)} satırı eklendi`,b:"",a:def.cols.map(c=>sh(c,r[c.k])).filter(Boolean).join(" · ")}); else def.cols.forEach(c=>{ if(s(o[c.k])!==s(r[c.k])) out.push({l:`${pre}${pad2(i+1)} · ${c.l}`,b:sh(c,o[c.k]),a:sh(c,r[c.k])}); }); });
  ar.forEach(o=>{ if(!br.find(x=>x.id===o.id)) out.push({l:"Satır silindi",b:def.cols.map(c=>sh(c,o[c.k])).filter(Boolean).join(" · "),a:""}); }); }
 if(def.custom==="ek14"){ Object.keys(b).forEach(u=>{ const o=a[u]||{c:[]}, n=b[u]||{c:[]}; EK14_K.forEach((k,j)=>{ const x=o.c&&o.c[j]!=null?EK14_O[o.c[j]]:"", y=n.c&&n.c[j]!=null?EK14_O[n.c[j]]:""; if(x!==y) out.push({l:`${user(u).name} · kriter ${j+1}`,b:x,a:y}); }); if(s(o.not)!==s(n.not)) out.push({l:`${user(u).name} · genel değerlendirme`,b:s(o.not),a:s(n.not)}); }); }
 return out; }
function diffObj(fields,a,b){ const out=[]; fields.forEach(([k,l])=>{ const x=String(a[k]==null?"":a[k]), y=String(b[k]==null?"":b[k]); if(x!==y) out.push({l,b:x,a:y}); }); return out; }
const B_DIFF=[["konu","Bulgunun konusu"],["birim","Birim"],["kategori","Kategori"],["kategoriAciklama","Kategori açıklaması"],["mevcut","Mevcut durum"],["neden","Neden"],["risk","Riskler ve etkileri"],["kriter","Kriter"],["oneri","Öneri"],["puan","Bulgu puanı"],["onem","Önem düzeyi"]];
function bSnap(f){ return {konu:f.konu,birim:f.birim,kategori:f.kategori,kategoriAciklama:f.kategoriAciklama,mevcut:f.mevcut,neden:f.neden,risk:f.risk,kriter:f.kriter,oneri:f.oneri,puan:num2(bulguPuan(f.scores)),onem:onemOf(f)||""}; }
const R_DIFF=[["riskler","Yönetici özeti · riskler"],["etkiler","Yönetici özeti · etkiler"],["cozumler","Yönetici özeti · çözümler"],["giris","A. Giriş"],["sonuc","E. Sonuç"],["sira","D bölümü sıralaması"]];
const rSnap = r => ({riskler:r.ozet.riskler,etkiler:r.ozet.etkiler,cozumler:r.ozet.cozumler,giris:r.giris,sonuc:r.sonuc,sira:r.sira});
function byBirim(fs){ const m={}; fs.forEach(f=>(m[f.birim]=m[f.birim]||[]).push(f)); return Object.entries(m).sort((x,y)=>y[1].length-x[1].length); }
const reportIndex = f => { const a=audit(f.auditId); const i=reportFindings(a).findIndex(x=>x.id===f.id); return i<0?null:i+1; };

function effStatus(f){ if(f.status==="aksiyonda" && f.termin && daysUntil(f.termin)<0) return "gecikti"; return f.status; }
const F_ST = {taslak:["Taslak",""],onay_bekliyor:["Onay bekliyor","c-info"],onayli:["Onaylandı","c-acc"],paylasildi:["Paylaşıldı","c-info"],uzlasildi:["Uzlaşıldı","c-acc"],uzlasilmadi:["Uzlaşılmadı","c-warn"],aksiyonda:["Aksiyonda","c-info"],dogrulamada:["Doğrulamada","c-warn"],gecikti:["Gecikti","c-crit"],kapandi:["Kapandı","c-ok"]};
const T_ST = {acik:["Açık",""],devam:["Devam ediyor","c-info"],onay_bekliyor:["Puan bekliyor","c-warn"],kapandi:["Kapandı","c-ok"]};
const FORM_ST = {bos:["Başlanmadı",""],taslak:["Taslak","c-info"],tamam:["Tamamlandı","c-ok"],onay_bekliyor:["Onay bekliyor","c-warn"],onayli:["Onaylandı","c-ok"]};
const chip = (pair) => `<span class="chip ${pair[1]}">${esc(pair[0])}</span>`;
const fChip = f => chip(F_ST[effStatus(f)]||[f.status,""]);
const onemChip = d => d ? `<span class="chip ${onemCls(d)}">${esc(d)}</span>` : `<span class="chip">Puanlanmadı</span>`;
const sonucChip = s => s ? `<span class="chip ${sonucCls(s)}">${esc(s)}</span>` : `<span class="chip">Test edilmedi</span>`;
const stageChip = a => a.status==="reddedildi" ? `<span class="chip c-crit">Talep reddedildi</span>` : a.talep&&a.talep.durum==="bekliyor" ? `<span class="chip c-warn">Müdür onayı bekliyor</span>` : a.status==="tamamlandi" ? `<span class="chip c-ok">Tamamlandı</span>` : `<span class="chip ${a.stage===0?"":"c-acc"}">${a.stage}. ${STAGES[a.stage]}</span>`;
const dayTxt = s => { const n=daysUntil(s); if(n===null) return ""; if(n<0) return `<span class="late">${-n} gün geçti</span>`; if(n===0) return `<span class="late">bugün</span>`; return `<span class="muted">${n} gün kaldı</span>`; };

function notify(to,text,link){ const n={id:uid("n"),to,text,at:iso(new Date()),read:false,link:link||null}; S.notifs.unshift(n); if(typeof epostaBildir==="function") epostaBildir(n); }
function log(text){ S.log.unshift({at:nowStamp(),by:S.me,text}); }
function toast(msg){ const old=document.querySelector(".toast"); if(old) old.remove(); const d=document.createElement("div"); d.className="toast"; d.setAttribute("role","status"); d.textContent=msg; document.body.appendChild(d); setTimeout(()=>d.remove(),3400); }

function formOf(a,k){ if(!a.forms[k]) a.forms[k]={status:"bos",data:{}}; if(!a.forms[k].data) a.forms[k].data={}; return a.forms[k]; }
function formDone(a,k){ const f=a.forms[k]; return !!f && (f.status==="tamam"||f.status==="onayli"); }

/* ============ Aşama kuralları ============ */
function reqs(a){
 const fs = findingsOf(a.id);
 const F = (k) => ({l:FORMS[k].title+(FORMS[k].mudurOnly?"":" (müdür onayı)"),ok:formDone(a,k),act:{kind:"form",key:k},st:formOf(a,k).status});
 switch(a.stage){
  case 0: return [{l:"Denetim ekibi atandı",ok:a.ekip.length>0},{l:"Geçmiş tarama ve hazırlık görevleri (Denetime Başla)",ok:false,act:{kind:"start"}}];
  case 1: return [{l:"Geçmiş tarama incelendi",ok:!!a.gecmisIncelendi},F("EK1"),F("EK3"),F("EK15"),F("EK6"),F("EK7")];
  case 2: return [F("EK5"),F("EK8")];
  case 3: { const ts=testRows(a), withCK=ts.filter(t=>ckOfTest(a,t.id)), bad=a.ek4.filter(w=>w.sonuc&&w.sonuc!=="Etkin");
   return [{l:`EK-8'deki her test için çalışma kağıdı (${withCK.length}/${ts.length})`,ok:ts.length>0&&withCK.length===ts.length,act:{kind:"tab",tab:"testler"}},
    {l:"Çalışma kağıtları gözden geçirildi",ok:a.ek4.length>0&&a.ek4.every(w=>w.onay),act:{kind:"tab",tab:"testler"}},
    {l:`Etkin olmayan kontroller için bulgu açıldı veya gerekçe yazıldı (${bad.filter(w=>findingsOfTest(a,w.testId).length||w.bulguGerekmez).length}/${bad.length})`,ok:bad.every(w=>findingsOfTest(a,w.testId).length||w.bulguGerekmez),act:{kind:"tab",tab:"testler"}},
    {l:"Bulgular onaylandı ve puanlandı (EK-9)",ok:fs.every(f=>!["taslak","onay_bekliyor"].includes(f.status)&&maxEtki(f.scores)>0),act:{kind:"tab",tab:"bulgular"}},
    {l:"Personel Anketi (isteğe bağlı, Faz 2)",ok:true,opt:true}]; }
  case 4: return [{l:"Her bulgu için EK-10 çıktısı alındı ve birim yanıtı işlendi",ok:fs.every(f=>f.ek10.islendi),act:{kind:"tab",tab:"bulgular"}}];
  case 5: return [F("EK11"),{l:"Denetim raporu nihai onaylandı",ok:a.rapor.status==="nihai",act:{kind:"tab",tab:"rapor"}}];
  case 6: return [{l:FORMS.EK14.title+" (müdür)",ok:formDone(a,"EK14"),act:{kind:"form",key:"EK14"},st:formOf(a,"EK14").status},
                  {l:"EK-3 gerçekleşen süreler (aşama tarihlerinden otomatik)",ok:true,act:{kind:"form",key:"EK3"}},
                  {l:"Müdür denetim puanı",ok:!!a.puan,act:{kind:"auditpuan"}}];
 }
 return [];
}
const stageOk = a => reqs(a).every(r=>r.ok||r.opt);

function makeTask(a,key,sorumlu,gun){
 S.tasks.unshift({id:uid("t"),baslik:FORMS[key].title,aciklama:"",atayan:S.me,sorumlu,termin:addDays(gun),durum:"acik",auditId:a.id,surekli:null,formKey:key,puan:null,yorum:"",kaynak:"sistem",kaydeden:null,created:iso(new Date()),sonuc:"",cikti:"",tespit:""});
 if(sorumlu!==S.me) notify(sorumlu,`Yeni görev: ${FORMS[key].title} (${a.no}).`,{v:"form",id:a.id,key});
}
function other(a){ return a.ekip.find(x=>x!==a.sorumlu) || a.sorumlu; }
function ek3Actual(a){
 const out=EK3_ROWS.map(()=>"");
 for(let s=1;s<=5;s++){ const st=a.stageDates[s]; if(!st) continue; const en=a.stageDates[s+1]||iso(new Date()); const days=Math.max(0,daysBetween(st,en));
  const idx=EK3_STAGE.map((x,i)=>x===s?i:-1).filter(i=>i>=0); idx.forEach(i=>out[i]= days? String(Math.max(1,Math.round(days/idx.length))) : ""); }
 return out;
}

function advance(a){
 if(!stageOk(a)) return;
 a.stage++; a.stageDates[a.stage]=iso(new Date());
 if(a.stage===2){ makeTask(a,"EK5",a.sorumlu,2); makeTask(a,"EK8",a.sorumlu,3); const f=formOf(a,"EK5"); f.data.gundem=f.data.gundem||EK5_GUNDEM; }
 if(a.stage===3){ testRows(a).forEach(t=>{ S.tasks.unshift({id:uid("t"),baslik:`${testCode(a,t.id)} ${t.test}: çalışma kağıdı`,aciklama:`${rkmCode(a,t.rkm)} riskine bağlı test.`,atayan:S.me,sorumlu:t.denetci,termin:t.bit||addDays(7),durum:"acik",auditId:a.id,surekli:null,formKey:null,testId:t.id,puan:null,yorum:"",kaynak:"sistem",kaydeden:null,created:iso(new Date()),sonuc:"",cikti:"",tespit:""}); if(t.denetci!==S.me) notify(t.denetci,`${a.no} saha aşaması başladı: ${testCode(a,t.id)} testi size atandı.`,{v:"audit",id:a.id,tab:"testler"}); }); }
 if(a.stage===4){ findingsOf(a.id).forEach(f=>{ if(f.status==="onayli") f.status="paylasildi"; }); a.ekip.forEach(u=>u!==S.me&&notify(u,`${a.no} bulgu paylaşımı aşamasında. EK-10 çıktılarını alıp birim yanıtlarını işleyin.`,{v:"audit",id:a.id,tab:"bulgular"})); }
 if(a.stage===5){ makeTask(a,"EK11",a.sorumlu,3); if(a.rapor.status==="yok") a.rapor.status="taslak"; if(!a.rapor.giris) a.rapor.giris=defaultGiris(a); if(!a.rapor.ozet.riskler) Object.assign(a.rapor.ozet,draftOzet(a));
  const k=formOf(a,"EK11"), e5=formOf(a,"EK5").data;
  k.data.katilimcilar=k.data.katilimcilar||[names(a.ekip)+" (İç Denetim)",e5.yonetici,e5.personel].filter(Boolean).join("; ");
  k.data.gundem=k.data.gundem||findingsOf(a.id).map(f=>`B${f.no} – ${f.konu}: ${f.ek10.gorus.includes("katiliyor")?"birim katılıyor, eylem planı "+fmt((f.ek10.eylemler[0]||{}).tarih):"birim katılmıyor"}`).join("\n"); }
 if(a.stage===6){ const e3=formOf(a,"EK3"); e3.data.rows=(e3.data.rows&&e3.data.rows.length?e3.data.rows:EK3_ROWS.map(()=>({p:"",r:"",g:""}))); const g=ek3Actual(a); e3.data.rows.forEach((r,i)=>{ if(!r.g) r.g=g[i]; });
  mudurler().forEach(m=>notify(m.id,`${a.no} Değerlendirme aşamasına geçti. EK-14 Denetçi Değerlendirme Formu'nu doldurun ve denetimi puanlayın.`,{v:"audit",id:a.id,tab:"akis"})); }
 if(a.stage===7){ a.status="tamamlandi"; a.bitis=iso(new Date()); a.ekip.forEach(u=>notify(u,`${a.no} denetimi tamamlandı. Açık bulgular İzleme'de takip ediliyor.`,{v:"audit",id:a.id,tab:"akis"})); }
 log(`${a.no} ${a.stage===7?"denetimi tamamlandı":STAGES[a.stage]+" aşamasına geçti"}.`);
}

function defaultGiris(a){ return `${a.no} numaralı denetim, 2026 yılı Denetim Planı'nda yer alan ${a.surec} süreci kapsamında ${a.birim} nezdinde ${fmt(a.start)} – ${fmt(a.end)} tarihleri arasında gerçekleştirilmiştir.`; }
function reportFindings(a){ const fs=findingsOf(a.id).filter(f=>!["taslak","onay_bekliyor"].includes(f.status)); return a.rapor.sira==="no" ? fs : fs.slice().sort((x,y)=>bulguPuan(y.scores)-bulguPuan(x.scores)||x.no-y.no); }
function draftOzet(a){
 const fs = reportFindings(a).slice().sort((x,y)=>bulguPuan(y.scores)-bulguPuan(x.scores)).slice(0,3);
 return {riskler:fs.map(f=>"- "+f.konu).join("\n"),etkiler:fs.map(f=>"- "+f.risk).join("\n"),cozumler:fs.map(f=>"- "+f.oneri).join("\n")};
}
function testSummary(a){ const c={}; a.ek4.forEach(w=>{ if(w.sonuc) c[w.sonuc]=(c[w.sonuc]||0)+1; }); return {n:rkmRows(a).length,t:a.ek4.length,c}; }
function prevAudits(a){ return S.audits.filter(x=>x.id!==a.id && x.surec===a.surec && (a.surec!=="Şube Operasyonları" || x.birim===a.birim) && x.rapor.status==="nihai"); }
function repeats(f){
 const a=audit(f.auditId); if(!f.kategori) return [];
 return S.findings.filter(x=>x.id!==f.id && x.auditId!==f.auditId && audit(x.auditId).surec===a.surec && x.kategori===f.kategori);
}
function perfOf(a,u){
 const ts=testRows(a).filter(t=>t.denetci===u), cks=a.ek4.filter(w=>w.hazirlayan===u), onTime=cks.filter(w=>{ const t=testById(a,w.testId); return !t||!w.tarih||w.tarih<=t.bit; }).length;
 const fs=S.findings.filter(f=>f.auditId===a.id&&f.sorumluDenetci===u);
 const tk=S.tasks.filter(t=>t.auditId===a.id&&t.sorumlu===u&&t.puan);
 return {tests:ts.length,cks:cks.length,onTime,fs:fs.length,revised:cks.filter(w=>!w.onay).length,tp:tk.length?tk.reduce((s,t)=>s+t.puan,0)/tk.length:null};
}

/* ============ Belge blokları ============ */
const hdr = a => ({t:"kv",rows:[["Denetim Numarası",a.no],["Denetim Konusu",a.konu],["Denetlenen Birim",a.birim]]});
function formBlocks(a,key,d){
 d = d || formOf(a,key).data || {};
 const def=FORMS[key], B=[{t:"org"},{t:"title",text:upTR(def.title.replace(/^EK-\d+\s/,""))}];
 const mud = mudurler()[0];
 if(key==="EK1"){
  B.push({t:"p",text:"Konu: Denetim Bildirimi"},{t:"p",text:upTR(a.birim)+" DİKKATİNE"},
   {t:"p",text:`Biriminiz faaliyetleri içinde yer alan ${a.odak||a.surec} ${a.odak&&/Süreci$/.test(a.odak)?"":"sürecinin "}${a.tur==="C"?"danışmanlık çalışması":"denetimi"} ${fmt(d.baslangic)} tarihinde başlayacaktır.`},
   {t:"p",text:(a.planDisi||(a.talepEden&&!a.planId)) ? `Söz konusu ${a.tur==="C"?"çalışma":"denetim"}, 2026 yılı Denetim Planı dışında${a.talepEden?" "+a.talepEden+" talebi üzerine":""}${a.planDisi&&a.planDisi.gerekce?" ("+a.planDisi.gerekce.replace(/[.]+$/,"")+")":""} gerçekleştirilecektir.` : `Söz konusu denetim, Yönetim Kurulunun ${fmt(d.ykOnay)} tarihli onayıyla yürütülmekte olan 2026 yılı Denetim Planında yer almaktadır.`},
   {t:"p",text:`Denetimin kapsamı temel olarak; ${d.kapsam||"…"} Kesin kapsam, iç denetçilerimiz tarafından biriminizle yapılacak görüşmeler sonucunda belirlenecektir.`},
   {t:"p",text:`Denetim, İç Denetçi/Denetçiler ${names(a.ekip)} tarafından gerçekleştirilecek olup iç denetim faaliyeti sonucu hazırlanacak rapor tarafınıza verilecektir.`},
   {t:"p",text:"Denetimin başarıyla sonuçlanması için iş birliğiniz ve bilgi paylaşımınız büyük önem arz etmektedir."},{t:"p",text:"Bilgilerinize rica ederim."},
   {t:"sign",cols:[[mud.name,"İç Denetim Müdürü"]]});
  return B;
 }
 B.push(hdr(a));
 if(key==="EK3"){
  const rows=(d.rows||[]).map((r,i)=>[EK3_ROWS[i],r.p||"",r.r||"",r.g||"",(r.g&&r.p)?String((+r.g)-(+(r.r||r.p))):""]);
  const sum=k=>(d.rows||[]).reduce((t,r)=>t+(+r[k]||0),0);
  rows.push(["TOPLAM SÜRE",String(sum("p")||""),String(sum("r")||""),String(sum("g")||""),""]);
  B.push({t:"table",head:["Faaliyet","Planlanan (gün)","Revize (gün)","Gerçekleşen (gün)","Plana göre fark"],rows});
  if(d.gerekce) B.push({t:"label",label:"Revizyon gerekçesi:",text:d.gerekce});
  B.push({t:"p",text:"*Planlanan denetim süresi revizyonları gerekçesiyle birlikte bu formda kayıt altına alınır."});
 } else if(key==="EK6"){
  const rows=(d.rows||[]).map((r,i)=>{ const ts=testRows(a).filter(t=>t.rkm===r.id), ck=ts.map(t=>ckOfTest(a,t.id)).filter(Boolean);
   return ["R-"+pad2(i+1),r.risk,r.etki,r.olas,(r.etki&&r.olas)?String(r.etki*r.olas):"",r.kontrol,r.tur,r.siklik,r.test,ts.map(t=>user(t.denetci).name).join(", "),ck.map(w=>w.ref).join(", "),ck.map(w=>w.sonuc).join(", ")]; });
  B.push({t:"table",head:["No","Risk","Etki","Olas.","Seviye","Kontrol","Tür","Sıklık","Test prosedürü","Denetçi","Çalışma kağıdı","Test sonucu"],rows});
  B.push({t:"p",text:"Denetçi, çalışma kağıdı ve test sonucu sütunları EK-8 ve EK-4 kayıtlarından otomatik gelir."});
 } else if(key==="EK8"){
  B.push({t:"table",head:["No","RKM","Uygulanacak test","İlgili birim","İç denetçi","Başlama","Bitiş","Çalışma kağıdı"],rows:(d.rows||[]).map((r,i)=>["T-"+pad2(i+1),rkmCode(a,r.rkm),r.test,r.birim,user(r.denetci).name,fmt(r.bas),fmt(r.bit),(ckOfTest(a,r.id)||{}).ref||""])});
  B.push({t:"p",text:`Hazırlayan: ${user(a.sorumlu).name}   Onaylayan: ${mud.name} (İç Denetim Müdürü)`});
 } else if(key==="EK7"){
  B.push({t:"h2",text:"I. GENEL BİLGİLER"},{t:"kv",rows:[["Planlanan başlama",fmt(a.start)],["Planlanan bitiş",fmt(a.end)],["Denetim türü",a.tur==="C"?"Danışmanlık":"Güvence"],["İç denetçiler",names(a.ekip)]]});
  FORMS.EK7.fields.forEach(f=>B.push({t:"h2",text:f.l.toLocaleUpperCase("tr-TR")},{t:"p",text:d[f.k]||""}));
 } else if(key==="EK14"){
  a.ekip.forEach((u,i)=>{ const r=(d[u]||{}); if(i) B.push({t:"break"},{t:"org"},{t:"title",text:"DENETÇİ DEĞERLENDİRME FORMU"},hdr(a));
   B.push({t:"kv",rows:[["İç Denetçi Adı",user(u).name],["Değerlendiren",mud.name]]},{t:"table",head:["No","Kriter","Değerlendirme"],rows:EK14_K.map((k,j)=>[String(j+1),k,r.c&&r.c[j]!=null?EK14_O[r.c[j]]:""])});
   if(r.not) B.push({t:"label",label:"Genel değerlendirme:",text:r.not}); });
 } else {
  (def.fields||[]).forEach(f=>B.push({t:"h2",text:f.l},{t:"p",text:d[f.k]||""}));
  if(key==="EK5"||key==="EK11") B.push({t:"sign",cols:[...a.ekip.map(u=>[user(u).name,"İç Denetçi"]),[d.yonetici||formOf(a,"EK5").data.yonetici||"Denetlenen Birim Yöneticisi","Adı-Soyadı, Unvanı"]]});
 }
 return B;
}
function ek4Blocks(a,w){
 const t=testById(a,w.testId)||{}, r=rkmById(a,w.rkmId)||{}, fs=findingsOfTest(a,w.testId);
 return [{t:"org"},{t:"title",text:"ÇALIŞMA KAĞIDI"},{t:"kv",rows:[["Referans",w.ref],["İç Denetim Birimi","İç Denetim Müdürlüğü"],["Denetlenen",a.birim],["Denetim Konusu",a.konu],["İlgili test (EK-8)",testCode(a,w.testId)+" "+(t.test||"")],["İlgili risk (EK-6)",rkmCode(a,w.rkmId)+" "+(r.risk||"")],["Test edilen kontrol",r.kontrol||""]]},
  {t:"h2",text:"TEST"},{t:"p",text:w.test},{t:"h2",text:"AMAÇ"},{t:"p",text:w.amac},{t:"h2",text:"YÖNTEM"},{t:"p",text:w.yontem},{t:"h2",text:"EDİNİLEN BİLGİ"},{t:"p",text:w.bilgi},
  {t:"h2",text:"SONUÇ"},{t:"p",text:`Kontrol değerlendirmesi: ${w.sonuc||"—"}${fs.length?"\nİlgili bulgu: "+fs.map(f=>"B"+f.no+" "+f.konu).join("; "):w.bulguGerekmez?"\nBulgu açılmadı: "+w.bulguGerekmez:""}`},
  {t:"table",head:["Hazırlayan","Tarih","Gözden geçiren"],rows:[[user(w.hazirlayan).name,fmt(w.tarih),w.onay?user("u2").name:""]]}];
}
function bulguBlocks(f,kind){
 const a=audit(f.auditId), on=onemOf(f)||"—";
 const B=[{t:"org"},{t:"title",text:kind==="EK10"?"BULGU PAYLAŞIM FORMU":"BULGU FORMU"},hdr(a),{t:"h2",text:`${f.no} - ${f.konu}`}];
 const rows=[["Bulgunun İlgili Olduğu Birim",f.birim],["Bulgunun Önem Düzeyi",on],["Mevcut Durum",f.mevcut]];
 if(!(kind==="EK10"&&f.ek10.nedenGizle)) rows.push(["Neden",f.neden]);
 rows.push(["Riskler ve Etkileri",f.risk],["Kriter",f.kriter],["Öneri",f.oneri]);
 if(kind!=="EK10") rows.push(["Çalışma Kağıdı Referansı",f.calismaRef||""]);
 B.push({t:"kv",rows});
 if(kind==="EK10"){
  const g=f.ek10.gorus||[], box=k=>g.includes(k)?"☒":"☐";
  B.push({t:"h2",text:"Denetlenen Birim Görüşü"},{t:"p",text:`${box("katiliyor")} Bulguya katılıyoruz.   ${box("katilmiyor")} Bulguya katılmıyoruz.\n${box("oneri_evet")} Öneriye katılıyoruz.   ${box("oneri_hayir")} Öneriye katılmıyoruz.\n${box("onem_hayir")} Bulgunun önem düzeyine katılmıyoruz.`},
   {t:"h2",text:"Eylem Planı"},{t:"table",head:["Sorumlusu","Gerçekleştirilecek eylem","Tamamlanma tarihi"],rows:(f.ek10.eylemler.length?f.ek10.eylemler:[{},{}]).map(e=>[e.sorumlu||"",e.eylem||"",e.tarih?fmt(e.tarih):""])},
   {t:"h2",text:"Denetlenen Birimin Açıklamaları"},{t:"p",text:f.ek10.aciklama||""});
 } else B.push({t:"p",text:`Hazırlayan: ${user(f.sorumluDenetci).name}`});
 return B;
}
function raporBlocks(a){
 const mud=mudurler()[0], yon=S.users.find(u=>u.role==="yonetici"), r=a.rapor, ek7=formOf(a,"EK7").data||{}, ts=testSummary(a);
 const yontemEk = ts.t ? `\nDenetim kapsamında Risk Kontrol Matrisi'nde yer alan ${ts.n} riske ilişkin kontroller ${ts.t} test ile sınanmıştır: ${TEST_SONUC.filter(s=>ts.c[s]).map(s=>`${ts.c[s]} kontrol ${s.toLocaleLowerCase("tr-TR")}`).join(", ")}.` : "";
 const B=[{t:"space",n:3},{t:"center",text:ORG,bold:true,size:14},{t:"center",text:"İÇ DENETİM MÜDÜRLÜĞÜ",bold:true,size:13,mb:60},
  {t:"center",text:raporBaslik(a),bold:true,size:15},{t:"center",text:a.tur==="C"?"DANIŞMANLIK RAPORU":"DENETİM RAPORU",bold:true,size:15,mb:50},
  {t:"center",text:"İÇ DENETİM EKİBİ",size:11,bold:true},{t:"center",text:names(a.ekip),size:11,mb:20},{t:"center",text:"Rapor No: "+a.no,bold:true},{t:"center",text:r.status==="nihai"?fmt(r.tarih):"TASLAK – "+fmt(iso(new Date())),bold:true,mb:80},
  {t:"center",text:"BU RAPOR İÇERİĞİ İTİBARİ İLE GİZLİDİR. SADECE YÖNETİM KURULUNUN ERİŞİMİ UYGUNDUR.",color:true,size:10,bold:true},
  {t:"break"},{t:"title",text:"İÇİNDEKİLER"},{t:"list",items:["YÖNETİCİ ÖZETİ","A. GİRİŞ","B. DENETİM FAALİYETİNİN AMAÇ VE KAPSAMI","C. YÖNTEM","D. BULGU, RİSK VE ÖNERİLER","E. SONUÇ VE EKLER"]},{t:"space",n:6},
  {t:"sign",cols:[["RAPORU HAZIRLAYAN",(yon?yon.name:"")+" · İç Denetim Yöneticisi"],["RAPORU ONAYLAYAN",mud.name+" · İç Denetim Müdürü"]]},
  {t:"break"},{t:"title",text:"YÖNETİCİ ÖZETİ"},
  {t:"h2",text:"Tespit edilen riskler arasında;"},{t:"p",text:r.ozet.riskler},{t:"h2",text:"Bu risklerin etkileri;"},{t:"p",text:r.ozet.etkiler},{t:"h2",text:"Bu bulgular ışığında önerilen başlıca çözümler;"},{t:"p",text:r.ozet.cozumler},
  {t:"h1",text:"A. GİRİŞ"},{t:"p",text:r.giris||defaultGiris(a)},
  {t:"h1",text:"B. DENETİM FAALİYETİNİN AMAÇ VE KAPSAMI"},{t:"p",text:[ek7.amac,ek7.kapsam].filter(Boolean).join("\n")},
  {t:"h1",text:"C. YÖNTEM"},{t:"p",text:(ek7.yontem||"")+yontemEk},
  {t:"h1",text:"D. BULGU, RİSK VE ÖNERİLER"}];
 const fs=reportFindings(a);
 if(!fs.length) B.push({t:"p",text:"(Onaylanmış bulgu henüz yok. Bulgular onaylandıkça bu bölüm otomatik dolar.)"});
 fs.forEach((f,i)=>B.push({t:"h2",text:`${i+1}. Bulgu: ${f.konu}`},{t:"p",text:f.mevcut},{t:"label",label:"Risk Tanımı:",text:f.risk},{t:"label",label:"Öneri:",text:f.oneri}));
 B.push({t:"h1",text:"E. SONUÇ VE EKLER"},{t:"p",text:r.sonuc||""},{t:"h2",text:"Ek: Bulgu özet tablosu"},
  {t:"table",head:["No","Bulgunun konusu","Önem derecesi","Uzlaşıldı / Uzlaşılmadı"],rows:fs.map((f,i)=>[String(i+1),f.konu,onemOf(f)||"—",f.ek10.islendi?(f.ek10.gorus.includes("katiliyor")?"Uzlaşıldı":"Uzlaşılmadı"):"—"])});
 return B;
}
function openPreview(name,blocks,wm,msg){ MODAL={wide:true,title:name,body:`${msg?`<div class="notice info">${esc(msg)}</div>`:""}<div class="paper-wrap"><div class="docroot">${blocksToHtml(blocks,{wm})}</div></div>`,foot:`<button class="btn" data-act="closeModal">Kapat</button>`}; render(); }
