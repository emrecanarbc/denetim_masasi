"use strict";
/* ============ Etkileşimler ============ */
let PUAN = 0;
const val = id => { const el=document.getElementById(id); return el ? (el.type==="checkbox"?el.checked:el.value.trim()) : ""; };
const fileName = id => { const el=document.getElementById(id); return el&&el.files&&el.files[0] ? el.files[0].name : ""; };
function commit(msg){ save(); render(); if(msg) toast(msg); }
function modal(title,body,foot,wide){ MODAL={title,body,foot,wide}; render(); const first=document.querySelector(".modal input:not([type=radio]):not([type=checkbox]):not([type=file]),.modal textarea,.modal select"); if(first) first.focus(); }
const closeModal = () => { MODAL=null; render(); };
function backToAudit(a,tab,msg){ S.ui={v:"audit",id:a.id,tab:tab||"akis",mine:S.ui.mine}; DRAFT=null; DB=null; MODAL=null; save(); render(); window.scrollTo(0,0); if(msg) toast(msg); }
function markTaskDone(t,note,quiet){ if(!t||!["acik","devam"].includes(t.durum)) return; t.bitis=iso(new Date()); if(note) t.sonuc=note; if(isMudur()){ t.durum="kapandi"; return; } t.durum="onay_bekliyor"; if(!quiet) mudurler().forEach(m=>notify(m.id,`${me().name} "${t.baslik}" görevini tamamlayıp onayınıza gönderdi${t.auditId?" ("+audit(t.auditId).no+")":""}. Puanınız bekleniyor.`,{v:"tasks",filter:"puan"})); }
function linkedTaskDone(a,key){ markTaskDone(S.tasks.find(t=>t.auditId===a.id&&t.formKey===key&&["acik","devam"].includes(t.durum))); }
function starsHtml(){ return `<div class="stars" role="group" aria-label="Puan">${[1,2,3,4,5].map(n=>`<button data-act="star" data-n="${n}" aria-label="${n} puan">${n}</button>`).join("")}</div>`; }
function newFinding(a,o){ const n=findingsOf(a.id).reduce((m,f)=>Math.max(m,f.no),0)+1;
 const f=Object.assign({id:uid("f"),auditId:a.id,no:n,konu:"",birim:a.birim,kategori:"",kategoriAciklama:"",mevcut:"",neden:"",risk:"",kriter:"",oneri:"",calismaRef:"",rkmId:null,testId:null,scores:{},onemOverride:null,status:"taslak",termin:null,ilkTermin:null,sorumluDenetci:S.me,ek10:{gorus:[],eylemler:[],aciklama:"",islendi:false,nedenGizle:false},updates:[],uzatim:null},o||{});
 S.findings.push(f); log(`${a.no} B${n} bulgusu oluşturuldu${f.calismaRef?" ("+f.calismaRef+" çalışma kağıdından)":""}.`); return f; }

const ACT = {
 go(d){ PUAN=0; KF={t:"",q:""}; S.ui={v:d.v,id:d.id||null,key:d.key||null,tab:d.tab||null,filter:d.filter||null,mine:S.ui.mine}; DRAFT=null; DB=null; DRAWER=false; MODAL=null; save(); render(); window.scrollTo(0,0); },
 tab(d){ S.ui.tab=d.tab; save(); render(); },
 btab(d){ S.ui.tab=d.tab; render(); },
 filter(d){ S.ui.filter=d.f; render(); },
 drawer(){ DRAWER=!DRAWER; render(); },
 readAll(){ S.notifs.forEach(n=>{ if(n.to===S.me) n.read=true; }); commit(); },
 notif(d){ const n=S.notifs.find(x=>x.id===d.id); if(!n) return; n.read=true; DRAWER=false; if(n.link) ACT.go({v:n.link.v,id:n.link.id,tab:n.link.tab,key:n.link.key,filter:n.link.filter}); else commit(); },
 birimSec(d){ S.ui.birim=d.b; render(); },
 reset(){ if(!RESET_ARMED){ RESET_ARMED=true; render(); setTimeout(()=>{ if(RESET_ARMED){ RESET_ARMED=false; render(); } },4000); return; }
   RESET_ARMED=false; const who=S.me; S=seed(); S.me=who; kanitMigrate(); epostaMigrate(); DRAFT=null; DB=null; MODAL=null; commit("Demo verisi baştan yüklendi."); },
 closeModal(){ closeModal(); },
 scrim(d,el,e){ if(e.target===el) closeModal(); },
 peek(d){ const a=audit(d.id); MODAL={wide:true,title:`${a.no} · ${FORMS[d.key].title}`,body:`<div class="paper-wrap"><div class="docroot">${blocksToHtml(formBlocks(a,d.key))}</div></div>`,foot:`<button class="btn" data-act="closeModal">Kapat</button>`}; render(); },
 peekCK(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w); MODAL={wide:true,title:`${w.ref} Çalışma kağıdı`,body:`<div class="paper-wrap"><div class="docroot">${blocksToHtml(ek4Blocks(a,w))}</div></div>`,foot:`<button class="btn ghost" data-act="exportCK" data-id="${a.id}" data-w="${w.id}" data-kind="docx">Word</button><button class="btn ghost" data-act="exportCK" data-id="${a.id}" data-w="${w.id}" data-kind="pdf">PDF</button><button class="btn" data-act="closeModal">Kapat</button>`}; render(); },

 /* Denetime Başla */
 startModal(d){
  const a=audit(d.id), prev=prevAudits(a), p=planRow(a.planId)||a.makro;
  const prevF = prev.flatMap(x=>findingsOf(x.id)), openF=prevF.filter(f=>f.status!=="kapandi");
  const cats={}; prevF.forEach(f=>cats[f.kategori]=(cats[f.kategori]||0)+1);
  const plan=[["EK1",a.sorumlu,2],["EK3",a.sorumlu,2],["EK15",other(a),4],["EK6",other(a),5],["EK7",a.sorumlu,6]];
  modal(`Denetime Başla · ${a.no}`,
   `<div class="notice info"><div><b>${esc(a.surec)}</b> · ${esc(a.birim)}${p?` · Makro risk ${num2(p.puan)} (${p.duzey})`:""}</div></div>
    <div><div class="section-label" style="margin-bottom:6px">1. Önceki denetimler</div>${prev.length?`<div class="tw"><table class="t"><tr><th>Rapor No</th><th>Rapor tarihi</th><th>Bulgu</th><th>Müdür puanı</th><th></th></tr>${prev.map(x=>`<tr><td class="num">${x.no}</td><td class="num">${fmt(x.rapor.tarih)}</td><td class="num">${findingsOf(x.id).length}</td><td class="num">${x.puan?x.puan.deger+" / 5":"—"}</td><td><button class="btn sm" data-act="previewRapor" data-id="${x.id}">Raporu incele</button></td></tr>`).join("")}</table></div>`:`<div class="empty">Bu süreçte önceki denetim yok.</div>`}</div>
    <div><div class="section-label" style="margin-bottom:6px">2. Hâlâ açık bulgular</div>${openF.length?openF.map(f=>`<div class="li"><div class="li-main"><span class="mono small">${esc(fcode(f))}</span> ${esc(f.konu)}<div class="li-sub">Termin ${fmt(f.termin)} · ${esc(user(f.sorumluDenetci).name)}</div></div>${fChip(f)}</div>`).join(""):`<div class="empty">Açık bulgu yok.</div>`}</div>
    ${Object.keys(cats).length?`<div><div class="section-label" style="margin-bottom:6px">3. Tekrarlayan konular</div><div class="row">${Object.entries(cats).map(([k,n])=>`<span class="chip ${n>1?"c-warn":""} nodot">${esc(k)} · ${n} bulgu</span>`).join("")}</div></div>`:""}
    <div><div class="section-label" style="margin-bottom:6px">4. Atanacak hazırlık görevleri</div>${plan.map(x=>`<div class="li"><div class="li-main"><b>${FORMS[x[0]].title}</b><div class="li-sub">${esc(user(x[1]).name)} · termin ${fmt(addDays(x[2]))}${formOf(a,x[0]).sablon?" · seçilen konuya göre ön dolduruldu":""}</div></div></div>`).join("")}<p class="small muted" style="margin:6px 0 0">Bu ekrandaki bilgiler sonraki formlarda önünüze gelir: EK-7'nin "Önceki denetime ilişkin bilgiler" bölümü arşivden dolar, EK-6 doldururken önceki bulgular risk fikri olarak gösterilir.</p></div>
    <label class="row"><input type="checkbox" id="chk-gecmis"> Önceki raporları ve açık bulguları inceledim.</label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="startGo" data-id="${a.id}">Denetimi başlat</button>`,true);
 },
 previewRapor(d){ const x=audit(d.id); MODAL={wide:true,title:`${x.no} · ${x.konu}`,body:`<div class="paper-wrap"><div class="docroot">${blocksToHtml(raporBlocks(x),{wm:true})}</div></div>`,foot:`<button class="btn" data-act="startModal" data-id="${S.ui.id}">Geri dön</button>`}; render(); },
 startGo(d){
  if(!val("chk-gecmis")) return toast("Önce önceki raporları incelediğinizi işaretleyin.");
  const a=audit(d.id); a.gecmisIncelendi=true; a.stage=1; a.stageDates[1]=iso(new Date());
  const e1=formOf(a,"EK1"); e1.data.baslangic=a.start; e1.data.ykOnay="2025-01-15";
  makeTask(a,"EK1",a.sorumlu,2); makeTask(a,"EK3",a.sorumlu,2); makeTask(a,"EK15",other(a),4); makeTask(a,"EK6",other(a),5); makeTask(a,"EK7",a.sorumlu,6);
  log(`${a.no} denetimi başlatıldı; geçmiş tarama incelendi, 5 hazırlık görevi atandı.`);
  MODAL=null; S.ui.tab="akis"; commit("Denetim başladı. Hazırlık ekleri görev olarak atandı.");
 },
 advance(d){ const a=audit(d.id); if(!stageOk(a)) return toast("Zorunlu adımlar tamamlanmadı."); advance(a); commit(`${a.no} · ${STAGES[a.stage]} aşamasına geçildi.`); },

 /* Formlar */
 formSave(){ const a=audit(S.ui.id), f=formOf(a,S.ui.key); f.data=JSON.parse(JSON.stringify(DRAFT.data)); if(f.status==="bos") f.status="taslak"; f.at=iso(new Date()); const t=S.tasks.find(t=>t.auditId===a.id&&t.formKey===S.ui.key&&t.durum==="acik"); if(t) t.durum="devam"; commit("Taslak kaydedildi."); },
 formDone(){
  const a=audit(S.ui.id), key=S.ui.key, def=FORMS[key], f=formOf(a,key), D=DRAFT.data;
  if(key==="EK14"){ if(!a.ekip.every(u=>D[u]&&EK14_K.every((_,j)=>D[u].c[j]!=null))) return toast("Her denetçi için 8 kriterin hepsini değerlendirin."); }
  else if(key==="EK3"){ if(!D.rows.some(r=>r.p)) return toast("Planlanan süreleri girin."); if(D.rows.some(r=>r.r)&&!D.gerekce) return toast("Revize süre girdiniz; gerekçe yazın."); }
  else if(key==="EK6"){ D.rows=D.rows.filter(r=>r.risk||r.kontrol||r.test); if(!D.rows.length) return toast("En az bir risk satırı girin."); if(D.rows.some(r=>!r.risk||!r.kontrol||!r.test)) return toast("Her satırda risk, kontrol ve test prosedürü dolu olmalı; testler EK-8'e buradan aktarılır."); }
  else if(key==="EK8"){ D.rows=D.rows.filter(r=>r.test||r.rkm); if(!D.rows.length) return toast("En az bir test girin."); if(D.rows.some(r=>!r.rkm||!r.test)) return toast("Her test bir RKM satırına bağlı olmalı."); const miss=rkmRows(a).filter(r=>!D.rows.some(x=>x.rkm===r.id)); if(miss.length) return toast(`RKM'deki ${miss.map(r=>rkmCode(a,r.id)).join(", ")} için test yok.`); }
  else if(def.custom==="rows"){ if(!D.rows.some(r=>Object.values(r).some(v=>v&&String(v).trim()))) return toast("En az bir satırı doldurun."); }
  else if(!Object.values(D).some(v=>v&&String(v).trim())) return toast("Formda en az bir alanı doldurun.");
  f.data=JSON.parse(JSON.stringify(D)); f.at=iso(new Date()); f.history=f.history||[];
  const lt=S.tasks.find(t=>t.auditId===a.id&&t.formKey===key&&["acik","devam"].includes(t.durum));
  let msg;
  if(isMudur()){ f.status=def.mudurOnly?"tamam":"onayli"; f.history.push({tip:"Müdür tarafından tamamlandı ve onaylandı",by:S.me,at:nowStamp(),data:JSON.parse(JSON.stringify(D))}); if(lt){ lt.durum="kapandi"; lt.bitis=iso(new Date()); } msg="Form tamamlandı ve onaylandı."; }
  else { f.status="onay_bekliyor"; f.history.push({tip:"Onaya gönderildi",by:S.me,at:nowStamp(),data:JSON.parse(JSON.stringify(D))}); mudurler().forEach(m=>notify(m.id,`${me().name}, ${a.no} · ${def.title} formunu onayınıza gönderdi.`,{v:"form",id:a.id,key})); markTaskDone(lt,null,true); msg="Form müdür onayına gönderildi; müdüre bildirim gitti."; }
  log(`${a.no} ${def.title} ${f.status==="onay_bekliyor"?"müdür onayına gönderildi":"tamamlandı ve onaylandı"}.`);
  backToAudit(a,"akis",msg);
 },
 formApprove(){ const a=audit(S.ui.id), key=S.ui.key, def=FORMS[key], f=formOf(a,key), pt=pendingTask(a,key);
  if(pt&&!PUAN) return toast("Onaylamadan önce görev için 1–5 arası puan verin.");
  const before=JSON.parse(JSON.stringify(f.data||{})), after=JSON.parse(JSON.stringify(DRAFT?DRAFT.data:f.data)), ch=diffForm(key,before,after);
  const sub=(f.history||[]).filter(x=>x.tip==="Onaya gönderildi").pop(), to=sub?sub.by:a.sorumlu;
  S.notifs.forEach(n=>{ if(n.to===S.me&&n.link&&n.link.v==="form"&&n.link.id===a.id&&n.link.key===key) n.read=true; });
  f.data=after; f.status="onayli"; f.history=f.history||[]; f.history.push({tip:ch.length?"Müdür değiştirerek onayladı":"Onaylandı",by:S.me,at:nowStamp(),data:after,changes:ch});
  if(pt){ pt.puan=PUAN; pt.yorum=val("p-yorum"); pt.durum="kapandi"; }
  notify(to,`${a.no} · ${def.title} onaylandı${ch.length?`; müdür ${ch.length} alanı değiştirdi (${ch.map(c=>c.l).join(", ")})`:""}${pt?` · görev puanı ${PUAN}/5`:""}.`,{v:"form",id:a.id,key});
  log(`${a.no} ${def.title} onaylandı${ch.length?"; müdür değişiklikleri: "+ch.map(c=>c.l).join(", "):""}${pt?" · görev puanı "+PUAN+"/5":""}.`);
  backToAudit(a,"akis",ch.length?`Form ${ch.length} değişiklikle onaylandı; gönderilen sürüm ayrıca saklandı.`:"Form onaylandı."); },
 formBack(){ const a=audit(S.ui.id), key=S.ui.key, f=formOf(a,key), sub=(f.history||[]).filter(x=>x.tip==="Onaya gönderildi").pop(), to=sub?sub.by:a.sorumlu, pt=pendingTask(a,key);
  f.status="taslak"; f.history=f.history||[]; f.history.push({tip:"Düzeltme için geri gönderildi",by:S.me,at:nowStamp()}); if(pt) pt.durum="devam";
  notify(to,`${a.no} · ${FORMS[key].title} düzeltme için geri gönderildi.`,{v:"form",id:a.id,key}); log(`${a.no} ${FORMS[key].title} geri gönderildi.`); backToAudit(a,"akis","Form düzeltme için geri gönderildi."); },
 showDiff(d){ let h; if(d.kind==="f"){ const p=d.ref.split("|"); h=formOf(audit(p[0]),p[1]).history[+d.i]; } else if(d.kind==="b") h=finding(d.ref).history[+d.i]; else h=audit(d.ref).rapor.history[+d.i];
  modal("Gönderilen ve onaylanan sürüm",`<p class="muted" style="margin:0">${esc(h.tip)} · ${esc(user(h.by).name)} · ${esc(fmt(String(h.at).slice(0,10)))} ${esc(String(h.at).slice(11))}</p><div class="tw"><table class="t"><tr><th>Alan</th><th>Gönderilen</th><th>Onaylanan</th></tr>${h.changes.map(c=>`<tr><td><b>${esc(c.l)}</b></td><td class="diff-old">${esc(c.b||"—")}</td><td class="diff-new">${esc(c.a||"—")}</td></tr>`).join("")}</table></div><p class="small muted" style="margin:0">Bu değişiklik Değişiklik Kaydı'nda da tutulur.</p>`,`<button class="btn" data-act="closeModal">Kapat</button>`,true); },
 formReopen(){ const a=audit(S.ui.id), f=formOf(a,S.ui.key); f.status="taslak"; DRAFT=null; log(`${a.no} ${FORMS[S.ui.key].title} düzenlemeye açıldı.`); commit(); },
 rowAdd(){ const a=audit(S.ui.id); DRAFT.data.rows.push(S.ui.key==="EK8"?{id:uid("x"),denetci:a.sorumlu,birim:a.birim}:S.ui.key==="EK6"?{id:uid("r")}:{}); render(); },
 rowDel(d){ DRAFT.data.rows.splice(+d.i,1); if(!DRAFT.data.rows.length) DRAFT.data.rows.push(S.ui.key==="EK6"?{id:uid("r")}:S.ui.key==="EK8"?{id:uid("x")}:{}); render(); },
 e3auto(){ const g=ek3Actual(audit(S.ui.id)); DRAFT.data.rows.forEach((r,i)=>{ if(g[i]) r.g=g[i]; }); render(); toast("Gerçekleşen süreler aşama tarihlerinden dolduruldu."); },

 /* Dışa aktarım */
 exportForm(d){ const a=audit(d.id); const data = (DRAFT&&DRAFT.aid===a.id&&DRAFT.key===d.key)?DRAFT.data:null; exportDoc(`${a.no.replace("/","-")} ${FORMS[d.key].title}`,formBlocks(a,d.key,data),d.kind,false); },
 exportCK(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w); exportDoc(`${a.no.replace("/","-")} ${w.ref} Çalışma Kağıdı`,ek4Blocks(a,w),d.kind,false); },
 exportB(d){ const f=DB||finding(S.ui.id), a=audit(f.auditId); exportDoc(`${a.no.replace("/","-")} B${f.no} ${d.f==="EK10"?"EK-10 Bulgu Paylaşım Formu":"EK-9 Bulgu Formu"}`,bulguBlocks(f,d.f),d.kind,false); },
 exportRapor(d){ const a=audit(d.id); exportDoc(`${a.no.replace("/","-")} ${a.surec} Denetim Raporu`,raporBlocks(a),d.kind,true); },

 /* Çalışma kağıtları: her biri bir teste, her test bir RKM satırına bağlı */
 ckModal(d){ const a=audit(d.id), t=testById(a,d.t), r=rkmById(a,t.rkm)||{}, ref=`ÇK-${a.no.split("-")[1]}-${pad2(a.ek4.length+1)}`;
  modal(`Çalışma kağıdı · ${ref} · ${testCode(a,t.id)}`,`<div class="trace-strip"><div><span class="section-label">Risk (EK-6)</span><div><span class="mono">${rkmCode(a,r.id)}</span> ${esc(r.risk||"")} · seviye ${r.etki&&r.olas?r.etki*r.olas:"—"}</div></div><span class="arrow">→</span><div><span class="section-label">Test edilen kontrol</span><div>${esc(r.kontrol||"")} <span class="muted">(${esc(r.tur||"")}, ${esc(r.siklik||"")})</span></div></div><span class="arrow">→</span><div><span class="section-label">Test (EK-8)</span><div>${esc(user(t.denetci).name)} · ${fmt(t.bas)} – ${fmt(t.bit)}</div></div></div>
   <label class="field"><span>Test</span><input class="input" id="ck-test" value="${esc(t.test)}"></label>
   <label class="field"><span>Amaç</span><textarea class="input" id="ck-amac">${esc(`"${r.kontrol||""}" kontrolünün tasarım ve işleyiş etkinliğini test etmek (${rkmCode(a,r.id)}).`)}</textarea></label>
   <label class="field"><span>Yöntem <span class="hint">· RKM test prosedüründen</span></span><textarea class="input" id="ck-yontem">${esc(r.test||"")}</textarea></label>
   <label class="field"><span>Edinilen bilgi</span><textarea class="input" id="ck-bilgi" placeholder="Örneklem, yapılan inceleme ve tespitler"></textarea></label>
   <div class="grid2"><label class="field"><span>Kontrol değerlendirmesi</span><select class="input" id="ck-sonuc"><option value="">Seçin</option>${TEST_SONUC.map(s=>`<option>${s}</option>`).join("")}</select></label>
   <label class="field"><span>Destek dosyası <span class="hint">· denetimin Kanıtlar bölümüne de eklenir</span></span><input class="input" type="file" id="ck-file"></label></div>
   <p class="small muted" style="margin:0">Sonuç RKM'deki "Test sonucu" sütununa işlenir. Kısmen etkin veya etkin değilse bu çalışma kağıdından bulgu açılır.</p>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="ckCreate" data-id="${a.id}" data-t="${t.id}" data-ref="${ref}">Kaydet</button>`,true); },
 ckCreate(d){ const a=audit(d.id), t=testById(a,d.t); if(!val("ck-bilgi")) return toast("Edinilen bilgiyi yazın."); if(!val("ck-sonuc")) return toast("Kontrol değerlendirmesini seçin.");
  const w={id:uid("w"),ref:d.ref,testId:t.id,rkmId:t.rkm,test:val("ck-test"),amac:val("ck-amac"),yontem:val("ck-yontem"),bilgi:val("ck-bilgi"),sonuc:val("ck-sonuc"),dosya:fileName("ck-file"),hazirlayan:S.me,tarih:iso(new Date()),onay:canReview(),bulguGerekmez:""};
  a.ek4.push(w); { const cf=dosyaObj("ck-file"); if(cf) kanitKaydet(a,cf,{aciklama:`${w.ref} çalışma kağıdı destek dosyası`,calisma:w.yontem,kaynak:KAYNAKLAR[2],bag:{t:"ck",id:w.id}}); } markTaskDone(S.tasks.find(x=>x.auditId===a.id&&x.testId===t.id&&["acik","devam"].includes(x.durum)),`${w.ref} yazıldı: ${w.sonuc}`);
  if(!canReview()) reviewers().forEach(r=>notify(r.id,`${me().name}, ${a.no} · ${d.ref} çalışma kağıdını gözden geçirmenize gönderdi.`,{v:"audit",id:a.id,tab:"testler"}));
  log(`${a.no} ${d.ref} çalışma kağıdı eklendi (${testCode(a,t.id)}, ${w.sonuc}).`); MODAL=null;
  commit(w.sonuc==="Etkin"?"Çalışma kağıdı kaydedildi. Kontrol etkin.":"Çalışma kağıdı kaydedildi. Kontrol etkin değil: bulgu açın veya neden gerekmediğini yazın."); },
 ckOnay(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w); w.onay=true; notify(w.hazirlayan,`${w.ref} gözden geçirildi.`,{v:"audit",id:a.id,tab:"testler"}); log(`${a.no} ${w.ref} gözden geçirildi.`); commit("Çalışma kağıdı gözden geçirildi."); },
 noBulgu(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w);
  modal(`Bulgu gerekmiyor · ${w.ref}`,`<p style="margin:0">Kontrol "${esc(w.sonuc)}" değerlendirildi. Neden bulgu açılmadığını yazın (ör. önemsiz tutar, birim denetim sırasında düzeltti).</p><label class="field"><span>Gerekçe</span><textarea class="input" id="nb-g"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="noBulguGo" data-id="${a.id}" data-w="${w.id}">Kaydet</button>`); },
 noBulguGo(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w), g=val("nb-g"); if(!g) return toast("Gerekçe yazın."); w.bulguGerekmez=g; log(`${a.no} ${w.ref} için bulgu açılmadı: ${g}`); MODAL=null; commit("Gerekçe kaydedildi."); },

 /* Bulgular */
 bulguFromCK(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w), r=rkmById(a,w.rkmId)||{};
  const f=newFinding(a,{konu:`${r.kontrol||w.test} kontrolünün ${w.sonuc==="Etkin değil"?"işlememesi":"kısmen işlemesi"}`,mevcut:w.bilgi,risk:r.risk||"",kriter:r.kontrol?`Beklenen kontrol: ${r.kontrol} (${r.siklik||""})`:"",calismaRef:w.ref,rkmId:w.rkmId,testId:w.testId});
  MODAL=null; ACT.go({v:"bulgu",id:f.id,tab:"ek9"}); toast("Bulgu çalışma kağıdından oluşturuldu. Konuyu ve öneriyi düzenleyip puanlayın."); },
 bulguPick(d){ const a=audit(d.id), cands=a.ek4.filter(w=>!findingsOfTest(a,w.testId).length);
  modal("Hangi çalışma kağıdından?",cands.length?`<p style="margin:0" class="muted">Her bulgu bir çalışma kağıdına dayanır. Kaynağı seçin.</p>${cands.map(w=>`<div class="li"><div class="li-main"><span class="mono">${esc(w.ref)}</span> ${esc(w.test)}<div class="li-sub">${testCode(a,w.testId)} · ${rkmCode(a,w.rkmId)}</div></div><div class="btns">${sonucChip(w.sonuc)}<button class="btn sm pri" data-act="bulguFromCK" data-id="${a.id}" data-w="${w.id}">Seç</button></div></div>`).join("")}`:`<div class="empty">Bulgu açılmamış çalışma kağıdı yok. Önce Testler sekmesinden çalışma kağıdı yazın.</div>`,`<button class="btn" data-act="closeModal">Kapat</button>`); },
 fOn(d){ DB._on[d.k]=d.on==="1"; if(d.on!=="1") FACTORS.find(x=>x.k===d.k).subs.forEach(s=>delete DB.scores[s.k]); render(); },
 bSave(silent){ const f=finding(S.ui.id);
  if(!String(DB.konu||"").trim()){ toast("Bulgunun konusunu yazın."); return false; }
  if(DB.kategori==="Diğer"&&!String(DB.kategoriAciklama||"").trim()){ toast("Diğer kategorisi için açıklama yazın."); return false; }
  if(DB.onemOverride&&!String(DB.onemOverride.gerekce||"").trim()){ toast("Önem düzeyini değiştirme gerekçesini yazın."); return false; }
  ["konu","birim","kategori","kategoriAciklama","mevcut","neden","risk","kriter","oneri","scores","onemOverride"].forEach(k=>f[k]=JSON.parse(JSON.stringify(DB[k]===undefined?null:DB[k])));
  f.ek10.nedenGizle=DB.ek10.nedenGizle; if(silent!==true){ log(`${fcode(f)} kaydedildi.`); commit("Bulgu kaydedildi."); } else save(); return true; },
 bSend(){ if(ACT.bSave(true)===false) return; const f=finding(S.ui.id), a=audit(f.auditId);
  if(!f.kategori) return toast("Kategori seçin."); if(maxEtki(f.scores)===0) return toast("Bulguyu puanlayın: en az bir alt faktör seçin."); if(!f.mevcut||!f.oneri) return toast("Mevcut durum ve öneri alanlarını doldurun.");
  f.status="onay_bekliyor"; f.submitted=bSnap(f); f.history=f.history||[]; f.history.push({tip:"Gözden geçirmeye gönderildi",by:S.me,at:nowStamp(),snap:f.submitted});
  reviewers().filter(u=>u.id!==S.me).forEach(r=>notify(r.id,`${me().name}, ${fcode(f)} bulgusunu gözden geçirmenize gönderdi.`,{v:"bulgu",id:f.id,tab:"ek9"}));
  log(`${fcode(f)} gözden geçirmeye gönderildi.`); backToAudit(a,"testler","Bulgu gözden geçirmeye gönderildi; müdüre ve yöneticiye bildirim gitti."); },
 bApprove(){ const f=finding(S.ui.id), a=audit(f.auditId), before=f.submitted||bSnap(f), wasPending=f.status==="onay_bekliyor";
  if(ACT.bSave(true)===false) return; if(!f.kategori) return toast("Kategori seçin."); if(maxEtki(f.scores)===0) return toast("Onaydan önce bulgu puanlanmalı."); if(!f.mevcut||!f.oneri) return toast("Mevcut durum ve öneri alanlarını doldurun.");
  const after=bSnap(f), ch=wasPending?diffObj(B_DIFF,before,after):[], who=isMudur()?"Müdür":"Gözden geçiren";
  S.notifs.forEach(n=>{ if(n.to===S.me&&n.link&&n.link.v==="bulgu"&&n.link.id===f.id) n.read=true; });
  f.status="onayli"; f.history=f.history||[]; f.history.push({tip:!wasPending?`${who} tarafından yazıldı ve onaylandı`:ch.length?`${who} değiştirerek onayladı`:"Onaylandı",by:S.me,at:nowStamp(),snap:after,changes:ch});
  if(f.sorumluDenetci!==S.me) notify(f.sorumluDenetci,`${fcode(f)} onaylandı${ch.length?`; ${ch.length} alan değiştirildi (${ch.map(c=>c.l).join(", ")})`:""}.`,{v:"bulgu",id:f.id});
  log(`${fcode(f)} onaylandı${ch.length?"; değişiklikler: "+ch.map(c=>c.l).join(", "):""}.`); backToAudit(a,"iz",ch.length?`Bulgu ${ch.length} değişiklikle onaylandı; gönderilen sürüm ayrıca saklandı.`:"Bulgu onaylandı ve raporun D bölümüne eklendi."); },
 bBack(){ const f=finding(S.ui.id), a=audit(f.auditId); f.status="taslak"; f.history=f.history||[]; f.history.push({tip:"Düzeltme için geri gönderildi",by:S.me,at:nowStamp()}); notify(f.sorumluDenetci,`${fcode(f)} düzeltme için geri gönderildi.`,{v:"bulgu",id:f.id}); log(`${fcode(f)} geri gönderildi.`); backToAudit(a,"bulgular","Bulgu geri gönderildi."); },
 eyAdd(){ DB.ek10.eylemler.push({sorumlu:"",eylem:"",tarih:""}); render(); },
 eyDel(d){ DB.ek10.eylemler.splice(+d.i,1); render(); },
 ek10Save(){ const f=finding(S.ui.id), a=audit(f.auditId), e=DB.ek10;
  if(!e.gorus.includes("katiliyor")&&!e.gorus.includes("katilmiyor")) return toast("Birimin bulguya katılıp katılmadığını işaretleyin.");
  if(e.gorus.includes("katiliyor")&&!e.eylemler.some(x=>x.eylem&&x.tarih)) return toast("Bulguya katılındıysa en az bir eylem ve tamamlanma tarihi girin.");
  if(e.gorus.includes("katilmiyor")&&!e.aciklama) return toast("Katılmama gerekçesini açıklamalar alanına yazın.");
  f.ek10=JSON.parse(JSON.stringify(e)); f.ek10.islendi=true;
  const maxT=e.eylemler.map(x=>x.tarih).filter(Boolean).sort().pop();
  f.termin = maxT || addDays(TERMIN_GUN[onemOf(f)]||60); f.ilkTermin=f.termin;
  f.status = a.rapor.status==="nihai" ? "aksiyonda" : (e.gorus.includes("katiliyor")?"uzlasildi":"uzlasilmadi");
  log(`${fcode(f)} birim yanıtı işlendi; takip termini ${fmt(f.termin)}.`); backToAudit(a,"bulgular","Birim yanıtı işlendi, takip termini belirlendi."); },

 /* İzleme */
 durum(d){ const f=finding(d.id), p=d.p||"devam";
  const opt=(v,l)=>`<label class="row"><input type="radio" name="dur" value="${v}" ${v===p?"checked":""}> ${l}</label>`;
  modal(`Bu bulgunun durumu ne? · ${fcode(f)}`,`<div><b>${esc(f.konu)}</b><div class="li-sub">Termin ${fmt(f.termin)} · ${dayTxt(f.termin)} · Eylem: ${esc((f.ek10.eylemler[0]||{}).eylem||"—")}</div></div>
   <div class="stack" style="gap:6px">${opt("tamam","Tamamlandı, kanıt ekliyorum")}${opt("devam","Devam ediyor")}${opt("uzatim","Uzatım talebi")}${opt("bilgi","Birimden bilgi alınamadı")}</div>
   <div class="notice info small">Birimle iletişimi siz kurarsınız. Sistem yalnızca bilgiyi kayda alır.</div>
   <div data-dur="tamam" ${p==="tamam"?"":"hidden"}><label class="field"><span>Kanıt dosyası <span class="hint">· denetimin Kanıtlar bölümüne de eklenir</span></span><input class="input" type="file" id="d-file"></label></div>
   <div data-dur="uzatim" ${p==="uzatim"?"":"hidden"} class="grid2"><label class="field"><span>Önerilen yeni termin</span><input class="input" type="date" id="d-tarih"></label></div>
   <label class="field"><span>Açıklama</span><textarea class="input" id="d-not" placeholder="Birimden alınan bilgi, yapılan kontrol veya uzatım gerekçesi"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="durumGo" data-id="${f.id}">Kaydet</button>`); },
 durumGo(d){ const f=finding(d.id), r=document.querySelector('input[name="dur"]:checked'), v=r?r.value:"devam", not=val("d-not");
  if(v==="tamam"){ const k=fileName("d-file"); if(!k&&!not) return toast("Kanıt dosyası ekleyin veya yapılan kontrolü açıklayın.");
   { const kf=dosyaObj("d-file"); if(kf) kanitKaydet(audit(f.auditId),kf,{aciklama:`${fcode(f)} kapanış kanıtı`,calisma:not,kaynak:KAYNAKLAR[0],bag:{t:"bulgu",id:f.id}}); }
   f.status="dogrulamada"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Tamamlandı",not,kanit:k}); reviewers().forEach(x=>x.id!==S.me&&notify(x.id,`Kanıt doğrulama bekliyor: ${fcode(f)}.`,{v:"findings"})); }
  else if(v==="uzatim"){ const t=val("d-tarih"); if(!t||!not) return toast("Yeni termin ve gerekçe girin."); if(t<=f.termin) return toast("Yeni termin mevcut terminden sonra olmalı.");
   f.uzatim={tarih:t,gerekce:not,durum:"bekliyor",by:S.me}; f.updates.push({at:iso(new Date()),by:S.me,tip:"Uzatım talebi",not:`${fmt(t)} · ${not}`}); mudurler().forEach(m=>notify(m.id,`Termin uzatım talebi: ${fcode(f)} (${me().name}).`,{v:"findings"})); }
  else { if(!not) return toast("Kısa bir açıklama yazın."); f.updates.push({at:iso(new Date()),by:S.me,tip:v==="bilgi"?"Birimden bilgi alınamadı":"Devam ediyor",not}); }
  log(`${fcode(f)} durum girişi: ${f.updates[f.updates.length-1].tip}.`); MODAL=null; commit("Durum kaydedildi."); },
 verify(d){ const f=finding(d.id), u=f.updates.filter(x=>x.tip==="Tamamlandı").pop()||{};
  modal(`Kanıt doğrulama · ${fcode(f)}`,`<div><b>${esc(f.konu)}</b><div class="li-sub">Öneri: ${esc(f.oneri)}</div></div><div class="card"><div class="small muted">${fmt(u.at)} · ${esc(user(u.by).name)}</div><div>${esc(u.not||"")}</div>${u.kanit?`<div class="mono small" style="margin-top:6px">Kanıt: ${esc(u.kanit)}</div>`:""}</div><label class="field"><span>Not</span><textarea class="input" id="v-not"></textarea></label>`,
   `<button class="btn" data-act="verifyGo" data-id="${f.id}" data-ok="0">Yetersiz, aksiyona geri gönder</button><button class="btn pri" data-act="verifyGo" data-id="${f.id}" data-ok="1">Kanıtı onayla ve kapat</button>`); },
 verifyGo(d){ const f=finding(d.id), not=val("v-not");
  if(d.ok==="1"){ f.status="kapandi"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Kanıt onaylandı, bulgu kapandı",not}); }
  else { if(!not) return toast("Neyin eksik olduğunu yazın."); f.status="aksiyonda"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Kanıt yetersiz",not}); }
  notify(f.sorumluDenetci,`${fcode(f)}: ${d.ok==="1"?"kanıt onaylandı, bulgu kapandı":"kanıt yetersiz bulundu"}.`,{v:"findings"}); log(`${fcode(f)} ${d.ok==="1"?"kapandı":"aksiyona geri gönderildi"}.`); MODAL=null; commit(d.ok==="1"?"Bulgu kapandı.":"Bulgu aksiyona geri gönderildi."); },
 uzatim(d){ const f=finding(d.id), u=f.uzatim;
  if(d.ok==="1"){ f.updates.push({at:iso(new Date()),by:S.me,tip:"Uzatım onaylandı",not:`${fmt(f.termin)} → ${fmt(u.tarih)}`}); f.termin=u.tarih; u.durum="onaylandı"; }
  else { u.durum="reddedildi"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Uzatım reddedildi",not:""}); }
  notify(u.by,`${fcode(f)} termin uzatım talebi ${u.durum}.`,{v:"findings"}); log(`${fcode(f)} uzatım talebi ${u.durum}.`); commit(`Uzatım talebi ${u.durum}.`); },

 /* Görevler */
 taskModal(d){ const rev=canReview(), myAudits=S.audits.filter(a=>a.status==="aktif"&&(rev||a.ekip.includes(S.me))), sur=!!(d&&d.surekli)||!myAudits.length;
  modal(sur&&d&&d.surekli?"Sürekli denetim görevi":"Görev ekle",`<label class="field"><span>Görev</span><input class="input" id="t-baslik" placeholder="Ör. Eylül kasa sayımları, bulgu listesi hazırlığı"></label><label class="field"><span>Açıklama</span><textarea class="input" id="t-acik"></textarea></label>
   <div class="grid2"><label class="field"><span>Talep şekli</span><select class="input" id="t-kay" data-tkay="1">${rev?`<option value="sistem">Sistemden atıyorum</option>`:""}<option value="sozlu">Sözlü talimat (müdür / yönetici söyledi)</option><option value="kendi">Kendi planım</option></select></label>
   <label class="field" data-kayfrom ${rev?"hidden":""}><span>Talimatı veren</span><select class="input" id="t-veren">${reviewers().map(u=>`<option value="${u.id}">${esc(u.name)} · ${esc(u.title)}</option>`).join("")}</select></label></div>
   <label class="field"><span>Bağlı olduğu iş</span><select class="input" id="t-bag" data-tbag="1">${myAudits.map(a=>`<option value="${a.id}" ${sur?"":"selected"}>${a.no} · ${esc(a.surec)} (${STAGES[a.stage]})</option>`).join("")}<option value="surekli" ${sur?"selected":""}>Sürekli denetim (bir denetime bağlı değil)</option></select></label>
   <div class="grid2" data-sur ${sur?"":"hidden"}><label class="field"><span>Sürekli denetim alanı</span><select class="input" id="t-alan">${SUREKLI_ALAN.map(x=>`<option>${x}</option>`).join("")}</select></label><label class="field"><span>Sıklık</span><select class="input" id="t-sik">${Object.keys(SIKLIK_GUN).map(x=>`<option>${x}</option>`).join("")}</select></label></div>
   <div class="grid2"><label class="field"><span>Sorumlu</span><select class="input" id="t-sor" ${rev?"":"disabled"}>${S.users.filter(u=>u.role!=="mudur").map(u=>`<option value="${u.id}" ${u.id===S.me?"selected":""}>${esc(u.name)}</option>`).join("")}</select></label>
   <label class="field"><span>Termin</span><input class="input" type="date" id="t-termin" value="${addDays(7)}"></label></div>
   <p class="small muted" style="margin:0">Görev tamamlandığında çıktısı eklenir ve müdür puanlamadan kapanmaz.</p>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="taskCreate">Oluştur</button>`); },
 taskCreate(){ const b=val("t-baslik"), t=val("t-termin"); if(!b||!t) return toast("Görev adı ve termin gerekli.");
  const kay=val("t-kay"), bag=val("t-bag"), sor = canReview()? val("t-sor") : S.me;
  const atayan = kay==="sozlu" ? (canReview()?S.me:val("t-veren")) : S.me;
  const task={id:uid("t"),baslik:b,aciklama:val("t-acik"),atayan,sorumlu:sor,termin:t,durum:"acik",auditId:bag!=="surekli"?bag:null,surekli:bag==="surekli"?{alan:val("t-alan"),siklik:val("t-sik")}:null,formKey:null,puan:null,yorum:"",kaynak:kay,kaydeden:kay==="sozlu"?S.me:null,created:iso(new Date()),sonuc:"",cikti:"",tespit:""};
  S.tasks.unshift(task);
  if(sor!==S.me) notify(sor,`Yeni görev atandı: ${b}.`,{v:task.surekli?"surekli":"tasks"});
  if(kay==="sozlu"&&atayan!==S.me) notify(atayan,`${me().name}, sözlü talimatınızı sisteme görev olarak girdi: ${b}.`,{v:task.surekli?"surekli":"tasks"});
  log(`Görev oluşturuldu (${KAYNAK[kay]}): ${b} → ${user(sor).name}${task.auditId?" · "+audit(task.auditId).no:" · sürekli denetim"}.`); MODAL=null; commit("Görev oluşturuldu."); },
 taskStart(d){ const t=S.tasks.find(x=>x.id===d.id); t.durum="devam"; commit(); },
 taskDoneModal(d){ const t=S.tasks.find(x=>x.id===d.id);
  modal("Görevi tamamla",`<div><b>${esc(t.baslik)}</b><div class="li-sub">${taskCtx(t)} · termin ${fmt(t.termin)}</div></div>
   <label class="field"><span>Sonuç</span><textarea class="input" id="td-sonuc" placeholder="Ne yapıldı, ne bulundu"></textarea></label>
   <label class="field"><span>Çıktı dosyası <span class="hint">· rapor, Excel vb. · denetimin Kanıtlar bölümüne de eklenir</span></span><input class="input" type="file" id="td-file"></label>
   ${t.surekli?`<label class="row"><input type="checkbox" id="td-tsp" data-ttsp="1"> Denetim gerektiren bir tespit var</label><div data-tsp hidden><label class="field"><span>Tespit</span><textarea class="input" id="td-tespit" placeholder="Ör. 3 şubede iade oranı ortalamanın iki katı"></textarea></label></div>`:""}`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="taskDoneGo" data-id="${t.id}">Tamamlandı, müdür puanına gönder</button>`); },
 taskDoneGo(d){ const t=S.tasks.find(x=>x.id===d.id), s=val("td-sonuc"); if(!s) return toast("Sonucu kısaca yazın.");
  t.cikti=fileName("td-file")||t.cikti; if(val("td-tsp")){ const tp=val("td-tespit"); if(!tp) return toast("Tespiti yazın."); t.tespit=tp; }
  { const tf=dosyaObj("td-file"); if(tf&&t.auditId) kanitKaydet(audit(t.auditId),tf,{aciklama:`Görev çıktısı: ${t.baslik}`,calisma:s,kaynak:KAYNAKLAR[2],bag:t.testId?{t:"test",id:t.testId}:{t:"genel",id:""}}); }
  markTaskDone(t,s); log(`Görev tamamlandı: ${t.baslik}.`); MODAL=null; commit(isMudur()?"Görev kapandı.":"Görev tamamlandı; müdüre bildirim gitti."); },
 taskPuan(d){ const t=S.tasks.find(x=>x.id===d.id); PUAN=0;
  modal("Görevi puanla",`<div><b>${esc(t.baslik)}</b><div class="li-sub">${esc(user(t.sorumlu).name)} · ${taskCtx(t)} · termin ${fmt(t.termin)}${t.bitis?` · tamamlanma ${fmt(t.bitis)}`:""}</div></div>${t.sonuc||t.cikti?`<div class="card small">${esc(t.sonuc||"")}${t.cikti?`<div class="mono" style="margin-top:4px">${esc(t.cikti)}</div>`:""}</div>`:""}<div class="field"><span>Puan (1–5)</span>${starsHtml()}</div><label class="field"><span>Yorum <span class="hint">· denetçi görür</span></span><textarea class="input" id="p-yorum"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="taskPuanGo" data-id="${t.id}">Puanla ve kapat</button>`); },
 star(d){ PUAN=+d.n; document.querySelectorAll(".stars button").forEach(b=>b.classList.toggle("on",+b.dataset.n<=PUAN)); },
 taskPuanGo(d){ if(!PUAN) return toast("Bir puan seçin."); const t=S.tasks.find(x=>x.id===d.id); t.puan=PUAN; t.yorum=val("p-yorum"); t.durum="kapandi";
  notify(t.sorumlu,`"${t.baslik}" görevi ${PUAN}/5 puanla kapandı.`,{v:t.surekli?"surekli":"tasks"}); log(`Görev puanlandı (${PUAN}/5): ${t.baslik}.`);
  let msg="Görev puanlandı ve kapandı.";
  if(t.surekli&&SIKLIK_GUN[t.surekli.siklik]){ const g=SIKLIK_GUN[t.surekli.siklik], base=t.termin>iso(new Date())?t.termin:iso(new Date()); const d2=new Date(base+"T00:00:00"); d2.setDate(d2.getDate()+g);
   S.tasks.unshift({...t,id:uid("t"),durum:"acik",termin:iso(d2),puan:null,yorum:"",sonuc:"",cikti:"",tespit:"",bitis:null,created:iso(new Date())}); msg+=` Bir sonraki dönem görevi ${fmt(iso(d2))} terminiyle açıldı.`; }
  MODAL=null; commit(msg); },
 auditPuan(d){ const a=audit(d.id); PUAN=0;
  modal(`Denetimi puanla · ${a.no}`,`<p style="margin:0">EK-14 tamamlandı. Denetimin genel puanını verin; denetim "Tamamlandı" olur ve açık bulgular İzleme'ye geçer.</p>${ctxPerf(a)}<div class="field"><span>Puan (1–5)</span>${starsHtml()}</div><label class="field"><span>Yorum <span class="hint">· ekip görür</span></span><textarea class="input" id="p-yorum"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="auditPuanGo" data-id="${a.id}">Puanla ve denetimi tamamla</button>`,true); },
 auditPuanGo(d){ if(!PUAN) return toast("Bir puan seçin."); const a=audit(d.id); a.puan={deger:PUAN,yorum:val("p-yorum")};
  advance(a); log(`${a.no} denetimi puanlandı (${PUAN}/5).`); backToAudit(a,"akis","Denetim tamamlandı. Açık bulgular İzleme'de."); },

 /* Plan */
 openAudit(d){ const p=planRow(d.p);
  modal(`Denetimi aç · ${p.surec}`,`<div class="notice info">${p.tur==="C"?"Danışmanlık":"Denetim"} · makro risk ${num2(p.puan)} (${p.duzey}) · ${p.saat} saat</div>
   <label class="field"><span>Denetlenen birim</span><input class="input" id="oa-birim" value="${esc(p.fonksiyon)}"></label>
   <div class="grid2"><label class="field"><span>Başlangıç</span><input class="input" type="date" id="oa-start" value="${addDays(14)}"></label><label class="field"><span>Bitiş</span><input class="input" type="date" id="oa-end" value="${addDays(44)}"></label></div>
   <div class="field"><span>Ekip</span>${S.users.filter(u=>u.role!=="mudur").map(u=>`<label class="row"><input type="checkbox" id="oa-u-${u.id}" ${u.role==="denetci"?"checked":""}> ${esc(u.name)} · ${esc(u.title)}</label>`).join("")}</div>
   <label class="field"><span>Sorumlu denetçi</span><select class="input" id="oa-sor">${S.users.filter(u=>u.role!=="mudur").map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="openAuditGo" data-p="${p.id}">Denetim kaydını oluştur</button>`); },
 openAuditGo(d){ const p=planRow(d.p), ekip=S.users.filter(u=>val("oa-u-"+u.id)).map(u=>u.id), sor=val("oa-sor");
  if(!ekip.length) return toast("Ekipten en az bir kişi seçin."); if(!ekip.includes(sor)) ekip.unshift(sor);
  const k=p.tur+"2026"; S.seq[k]=(S.seq[k]||0)+1; const no=`2026/${p.tur}-${pad2(S.seq[k])}`;
  const a={id:uid("a"),no,tur:p.tur,planId:p.id,surec:p.surec,konu:`${p.surec} ${p.tur==="C"?"Danışmanlığı":"Denetimi"}`,birim:val("oa-birim"),ekip,sorumlu:sor,stage:0,status:"aktif",start:val("oa-start"),end:val("oa-end"),gecmisIncelendi:false,forms:{},ek4:[],rapor:{status:"yok",ozet:{riskler:"",etkiler:"",cozumler:""},sira:"puan"},puan:null,stageDates:{0:iso(new Date())}};
  S.audits.push(a); ekip.forEach(u=>notify(u,`${no} ${a.konu} için ekibe atandınız.`,{v:"audit",id:a.id})); log(`${no} denetim kaydı oluşturuldu (${p.surec}).`); ACT.go({v:"audit",id:a.id,tab:"akis"}); toast(`${no} oluşturuldu.`); },

 /* Rapor */
 raporSave(d){ log(`${audit(d.id).no} rapor taslağı kaydedildi.`); commit("Rapor taslağı kaydedildi."); },
 raporDraft(d){ const a=audit(d.id); Object.assign(a.rapor.ozet,draftOzet(a)); commit("Yönetici özeti taslağı en yüksek puanlı bulgulardan oluşturuldu."); },
 raporSend(d){ const a=audit(d.id); if(!reportFindings(a).length) return toast("Raporda onaylanmış bulgu yok."); if(isMudur()) return ACT.raporApprove(d);
  a.rapor.status="onay_bekliyor"; a.rapor.submitted=rSnap(a.rapor); a.rapor.history=a.rapor.history||[]; a.rapor.history.push({tip:"Onaya gönderildi",by:S.me,at:nowStamp()});
  mudurler().forEach(m=>notify(m.id,`${me().name}, ${a.no} denetim raporunu onayınıza gönderdi.`,{v:"audit",id:a.id,tab:"rapor"})); log(`${a.no} rapor onaya gönderildi.`); commit("Rapor müdür onayına gönderildi; müdüre bildirim gitti."); },
 raporBack(d){ const a=audit(d.id); a.rapor.status="taslak"; a.rapor.history=a.rapor.history||[]; a.rapor.history.push({tip:"Düzeltme için geri gönderildi",by:S.me,at:nowStamp()}); notify(a.sorumlu,`${a.no} rapor taslağı düzeltme için geri gönderildi.`,{v:"audit",id:a.id,tab:"rapor"}); log(`${a.no} rapor geri gönderildi.`); commit("Rapor düzeltme için geri gönderildi."); },
 raporApprove(d){ const a=audit(d.id), r=a.rapor; if(!reportFindings(a).length) return toast("Raporda onaylanmış bulgu yok.");
  const wasPending=r.status==="onay_bekliyor", ch=wasPending&&r.submitted?diffObj(R_DIFF,r.submitted,rSnap(r)):[];
  r.status="nihai"; r.tarih=iso(new Date()); r.history=r.history||[]; r.history.push({tip:!wasPending?"Müdür tarafından onaylandı ve kilitlendi":ch.length?"Müdür değiştirerek onayladı ve kilitledi":"Onaylandı ve kilitlendi",by:S.me,at:nowStamp(),changes:ch,snap:rSnap(r)});
  findingsOf(a.id).forEach(f=>{ if(["uzlasildi","uzlasilmadi","paylasildi"].includes(f.status)){ f.status="aksiyonda"; if(!f.termin){ f.termin=addDays(TERMIN_GUN[onemOf(f)]||60); f.ilkTermin=f.termin; } } });
  a.ekip.forEach(u=>notify(u,`${a.no} raporu nihai olarak onaylandı${ch.length?` (müdür ${ch.length} bölümü değiştirdi)`:""}. Bulgular izlemeye alındı.`,{v:"audit",id:a.id,tab:"rapor"})); log(`${a.no} denetim raporu nihai olarak onaylandı ve kilitlendi${ch.length?"; müdür değişiklikleri: "+ch.map(c=>c.l).join(", "):""}.`); commit(ch.length?"Rapor değişikliklerle onaylandı ve kilitlendi; gönderilen sürüm ayrıca saklandı.":"Rapor onaylandı ve kilitlendi. Bulgular izlemeye alındı."); }
};

Object.assign(ACT, YENI_ACT, KANIT_ACT, EPOSTA_ACT);
ACT.kpi = d => { S.ui.kpi = S.ui.kpi===d.k ? null : d.k; save(); render(); if(S.ui.kpi){ const el=document.getElementById("kpi-detay"); if(el&&el.scrollIntoView) el.scrollIntoView({block:"nearest",behavior:"smooth"}); } };
ACT.openAudit = d => { const p=planRow(d.p), e=evrenSurec(p.surec), tur=p.tur==="C"?"danismanlik":"surec"; yeniBaslat(Object.assign({planId:p.id,birim:p.fonksiyon},e?{tur,kat:e.k,surec:e.s}:{tur,ara:p.surec})); ; };
/* ============ Olay dinleyicileri ============ */
/* Grafik ipuçları: data-tip taşıyan işaretlerin üzerine gelince */
(()=>{ let tip=null;
 const goster=(el,x,y)=>{ if(!tip){ tip=document.createElement("div"); tip.className="tip"; tip.setAttribute("role","tooltip"); document.body.appendChild(tip); } tip.textContent=el.dataset.tip; tip.style.display="block"; const w=tip.offsetWidth; tip.style.left=Math.min(window.innerWidth-w-8,Math.max(8,x+12))+"px"; tip.style.top=(y+14)+"px"; };
 document.addEventListener("mousemove",e=>{ const el=e.target.closest&&e.target.closest("[data-tip]"); if(el) goster(el,e.clientX,e.clientY); else if(tip) tip.style.display="none"; });
 document.addEventListener("scroll",()=>{ if(tip) tip.style.display="none"; },true);
})();
document.addEventListener("click",e=>{
 const el=e.target.closest("[data-act]"); if(!el) return;
 const fn=ACT[el.dataset.act]; if(!fn) return;
 if(el.dataset.act!=="scrim") e.preventDefault();
 fn(el.dataset,el,e);
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ if(MODAL) closeModal(); else if(DRAWER){ DRAWER=false; render(); } } });
document.addEventListener("input",e=>{
 const t=e.target, d=t.dataset;
 if(d.df!=null&&DRAFT) DRAFT.data[d.df]=t.value;
 else if(d.dr!=null&&DRAFT) DRAFT.data.rows[+d.dr][d.dc]=t.value;
 else if(d.e3!=null&&DRAFT) DRAFT.data.rows[+d.e3][d.e3c]=t.value.replace(/[^\d]/g,"");
 else if(d.e14n!=null&&DRAFT) DRAFT.data[d.e14n].not=t.value;
 else if(d.bf!=null&&DB&&t.tagName!=="SELECT") DB[d.bf]=t.value;
 else if(d.bog!=null&&DB&&DB.onemOverride) DB.onemOverride.gerekce=t.value;
 else if(d.be!=null&&DB) DB.ek10.eylemler[+d.be][d.bec]=t.value;
 else if(d.b10!=null&&DB) DB.ek10[d.b10]=t.value;
 else if(d.yn!=null&&NEW&&t.tagName!=="SELECT"&&t.type!=="checkbox"&&d.yn!=="ara") NEW[d.yn]=t.value;
 else if(d.kq!=null){ KF.q=t.value; clearTimeout(window._kq); window._kq=setTimeout(()=>{ render(); const el=document.getElementById("kn-q"); if(el){ el.focus(); el.setSelectionRange(el.value.length,el.value.length); } },300); }
 else if(d.rf!=null&&t.tagName!=="SELECT"){ const a=audit(S.ui.id); if(["riskler","etkiler","cozumler"].includes(d.rf)) a.rapor.ozet[d.rf]=t.value; else a.rapor[d.rf]=t.value; }
});
document.addEventListener("change",e=>{
 const t=e.target, d=t.dataset;
 if(d.actChange==="who"){ S.me=t.value; DRAFT=null; DB=null; DRAWER=false; if(S.ui.v==="log"&&user(S.me).role!=="mudur") S.ui={v:"panel"}; const un=S.notifs.filter(n=>n.to===S.me&&!n.read).length; commit(`${me().name} olarak görüntüleniyor${un?` · ${un} okunmamış bildirim`:""}.`); return; }
 if(d.yn!=null&&NEW){ yeniSet(d.yn, t.type==="checkbox"?t.checked:t.value); return; }
 if(d.ynArr!=null&&NEW){ const k=d.ynArr; if(t.checked){ if(!NEW[k].includes(t.value)) NEW[k].push(t.value); } else NEW[k]=NEW[k].filter(x=>x!==t.value); render(); return; }
 if(d.actChange==="kisi"){ S.ui.kisi=t.value||null; render(); return; }
 if(d.actChange==="birim"){ S.ui.birim=t.value||null; render(); return; }
 if(d.actChange==="mine"){ S.ui.mine=t.checked; render(); return; }
 if(t.name==="dur"){ document.querySelectorAll("[data-dur]").forEach(x=>x.hidden=x.dataset.dur!==t.value); return; }
 if(d.tbag!=null){ document.querySelectorAll("[data-sur]").forEach(x=>x.hidden=t.value!=="surekli"); return; }
 if(d.tkay!=null){ document.querySelectorAll("[data-kayfrom]").forEach(x=>x.hidden=t.value!=="sozlu"||canReview()); return; }
 if(d.ttsp!=null){ document.querySelectorAll("[data-tsp]").forEach(x=>x.hidden=!t.checked); return; }
 if(d.bs!=null&&DB){ const v=+t.value; if(v) DB.scores[d.bs]=v; else delete DB.scores[d.bs]; render(); return; }
 if(d.bo!=null&&DB){ DB.onemOverride = t.value ? {duzey:t.value,gerekce:(DB.onemOverride||{}).gerekce||""} : null; render(); return; }
 if(d.bf!=null&&DB&&t.tagName==="SELECT"){ DB[d.bf]=t.value; render(); return; }
 if(d.e14u!=null&&DRAFT){ DRAFT.data[d.e14u].c[+d.e14i]=+t.value; return; }
 if(d.bg!=null&&DB){ const k=d.bg; let g=DB.ek10.gorus.filter(x=>x!==k); if(t.checked){ g.push(k); if(k==="katiliyor") g=g.filter(x=>x!=="katilmiyor"); if(k==="katilmiyor") g=g.filter(x=>x!=="katiliyor"); } DB.ek10.gorus=g; render(); return; }
 if(d.bng!=null&&DB){ DB.ek10.nedenGizle=t.checked; const f=finding(S.ui.id); f.ek10.nedenGizle=t.checked; save(); return; }
 if(d.rf==="sira"){ audit(S.ui.id).rapor.sira=t.value; commit(); return; }
 if((d.dr!=null&&t.tagName==="SELECT")||d.e3!=null){ render(); return; }
});

render();
