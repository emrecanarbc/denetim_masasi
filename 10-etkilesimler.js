"use strict";
/* ============ Etkileşimler ============ */
let PUAN = 0;
const val = id => { const el=document.getElementById(id); return el ? (el.type==="checkbox"?el.checked:el.value.trim()) : ""; };
const fileName = id => { const el=document.getElementById(id); return el&&el.files&&el.files[0] ? el.files[0].name : ""; };
function commit(msg){ save(); render(); if(msg) toast(msg); }
function modal(title,body,foot,wide){ MODAL={title,body,foot,wide}; render(); const first=document.querySelector(".modal input:not([type=radio]):not([type=checkbox]):not([type=file]),.modal textarea,.modal select"); if(first) first.focus(); }
const closeModal = () => { MODAL=null; render(); };
function backToAudit(a,tab,msg){ S.ui={v:"audit",id:a.id,tab:tab||"akis",mine:S.ui.mine}; DRAFT=null; DB=null; MODAL=null; save(); render(); window.scrollTo(0,0); if(msg) toast(msg); }
function markTaskDone(t,note,quiet){ if(!t||!["acik","devam"].includes(t.durum)) return; t.bitis=iso(new Date()); if(note) t.sonuc=note; if(isMudur()){ t.durum="kapandi"; t.onayTarihi=t.bitis; gEkle(t,"Müdür tamamladı ve kapattı",note); return; } t.durum="onay_bekliyor"; gEkle(t,"Tamamlandı, müdür onayına gönderildi",note||(t.formKey?"Form onaya gönderildi.":"")); if(!quiet) mudurler().forEach(m=>notify(m.id,`${me().name} "${t.baslik}" görevini tamamlayıp onayınıza gönderdi${t.auditId?" ("+audit(t.auditId).no+")":""}. Puanınız bekleniyor.`,{v:"gorev",id:t.id})); }
function linkedTaskDone(a,key){ markTaskDone(S.tasks.find(t=>t.auditId===a.id&&t.formKey===key&&["acik","devam"].includes(t.durum))); }
function starsHtml(){ return `<div class="stars" role="group" aria-label="Puan">${[1,2,3,4,5].map(n=>`<button data-act="star" data-n="${n}" aria-label="${n} puan">${n}</button>`).join("")}</div>`; }
function newFinding(a,o){ const n=findingsOf(a.id).reduce((m,f)=>Math.max(m,f.no),0)+1;
 const f=Object.assign({id:uid("f"),auditId:a.id,no:n,konu:"",birim:a.birim,kategori:"",kategoriAciklama:"",mevcut:"",neden:"",risk:"",kriter:"",oneri:"",calismaRef:"",rkmId:null,testId:null,scores:{},onemOverride:null,status:"taslak",termin:null,ilkTermin:null,sorumluDenetci:S.me,ek10:{gorus:[],eylemler:[],aciklama:"",islendi:false,nedenGizle:false},updates:[],uzatim:null},o||{});
 S.findings.push(f); log(`${a.no} B${n} bulgusu oluşturuldu${f.calismaRef?" ("+f.calismaRef+" çalışma kağıdından)":""}.`); return f; }

/* Görev değerlendirme formu: basit görevlerde tek puan, diğerlerinde ölçütler; gerekçe zorunlu */
function puanFormHtml(t){ const z=t.zorluk||"orta", d=t.degerlendirme&&!t.degerlendirme.eski?t.degerlendirme:null;
 const sec=(name,v,na)=>`<div class="seg kr" role="radiogroup" aria-label="${name}">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${name}" value="${n}" ${v===n?"checked":""}><span>${n}</span></label>`).join("")}${na?`<label title="Uygulanamaz"><input type="radio" name="${name}" value="na" ${d&&v===null?"checked":""}><span>U/Y</span></label>`:""}</div>`;
 const gd=gorevDurumu(t), tes=t.bitis?(gd==="zamaninda"?"Zamanında teslim":`Gecikmeli teslim (${daysBetween(terminEff(t),t.bitis)} gün)`):"Teslim edilmedi";
 return `<div class="grid2"><label class="field"><span>Zorluk <span class="hint">· atamada belirlendi; gerekirse değiştirin</span></span><select class="input" id="p-zor" data-pz="1">${Object.entries(ZORLUK).map(([k,v])=>`<option value="${k}" ${k===z?"selected":""}>${v.ad} (ağırlık ${v.w})</option>`).join("")}</select></label>
  <div class="field"><span>Sistemden <span class="hint">· puana girmez, ayrı izlenir</span></span><div class="small">${tes} · ${t.geriGonderme||0} kez düzeltmeye gönderildi</div></div></div>
  <div data-pz-basit ${z==="basit"?"":"hidden"}><div class="kr-row"><span>Genel değerlendirme</span>${sec("p-genel",d?d.genel:undefined)}</div></div>
  <div data-pz-detay ${z==="basit"?"hidden":""}>${KRITERLER.map(k=>`<div class="kr-row"><span>${k.ad} <span class="muted small">· EK-14 K${k.ek14}</span></span>${sec("p-"+k.k,d&&d.kriterler?d.kriterler[k.k]:undefined,true)}</div>`).join("")}<p class="small muted" style="margin:4px 0 0">Göreve uymayan ölçütte U/Y (uygulanamaz) seçin; puan, uygulanabilir ölçütlerin ortalamasıdır.</p></div>
  ${t.gorus?`<div class="notice info"><div><b>Çalışanın görüşü:</b> ${esc(t.gorus.metin)}</div></div>`:""}
  <label class="field"><span>Gerekçe <span class="hint">· zorunlu, çalışan görür</span></span><textarea class="input" id="p-gerekce" placeholder="Ör. Örneklem gerekçesi açık, ancak iki istisnanın kök nedeni yazılmamış.">${esc(d?d.gerekce:"")}</textarea></label>`; }
function puanOku(t){ const z=val("p-zor")||t.zorluk||"orta", r=n=>{ const e=document.querySelector(`input[name="${n}"]:checked`); return e?e.value:null; };
 let puan, kriterler=null, genel=null;
 if(z==="basit"){ genel=+r("p-genel")||0; if(!genel) return {hata:"Genel puanı seçin."}; puan=genel; }
 else { kriterler={}; for(const k of KRITERLER){ const v=r("p-"+k.k); if(v==null) return {hata:`"${k.ad}" için puan seçin ya da U/Y işaretleyin.`}; kriterler[k.k]=v==="na"?null:+v; }
  const vs=Object.values(kriterler).filter(v=>v!=null); if(!vs.length) return {hata:"En az bir ölçüt puanlanmalı."}; puan=Math.round(vs.reduce((a,b)=>a+b,0)/vs.length*10)/10; }
 const gerekce=val("p-gerekce"); if(!gerekce) return {hata:"Değerlendirmenin gerekçesini yazın."};
 return {puan,zorluk:z,deg:{genel,kriterler,gerekce,by:S.me,at:nowStamp()}}; }
function puanUygula(t,p){ if((t.zorluk||"orta")!==p.zorluk){ log(`${t.baslik}: zorluk ${ZORLUK[t.zorluk||"orta"].ad} → ${ZORLUK[p.zorluk].ad} olarak değiştirildi.`); t.zorluk=p.zorluk; }
 if(t.puan&&t.puan!==p.puan){ t.revizyonlar=t.revizyonlar||[]; t.revizyonlar.push({eski:t.puan,yeni:p.puan,at:nowStamp(),by:S.me,gerekce:p.deg.gerekce}); log(`${t.baslik}: puan ${puanTxt(t.puan)} → ${puanTxt(p.puan)} olarak revize edildi.`); }
 if(t.gorus) t.gorus.incelendi=true;
 gEkle(t,t.puan&&t.puan!==p.puan?`Puan revize edildi · ${puanTxt(t.puan)} → ${puanTxt(p.puan)} / 5`:t.puan?"Değerlendirme gözden geçirildi":`Değerlendirildi · ${puanTxt(p.puan)} / 5`,p.deg.gerekce);
 t.puan=p.puan; t.degerlendirme=p.deg; t.yorum=p.deg.gerekce; if(!t.onayTarihi) t.onayTarihi=iso(new Date()); if(!t.bitis) t.bitis=iso(new Date()); t.durum="kapandi"; }
/* Görev dosyaları: içerik IndexedDB'de, kayıt görevde */
function gDosyaKaydet(t,file,not){ const fid=uid("gf"); t.dosyalar=t.dosyalar||[]; t.dosyalar.push({fid,ad:file.name,boyut:file.size,tarih:nowStamp(),by:S.me,not:not||""});
 KDB.put(fid,file).then(ok=>{ if(!ok) toast(`${file.name}: içerik bu tarayıcıda saklanamadı; yalnızca kayıt tutuldu.`); }); }
const ACT = {
 go(d){ if(d.v==="gorev"&&S.ui.v!=="gorev") GOREV_GERI={v:S.ui.v,id:S.ui.id,filter:S.ui.filter,tab:S.ui.tab}; PUAN=0; KF={t:"",q:""}; S.ui={v:d.v,id:d.id||null,key:d.key||null,tab:d.tab||null,filter:d.filter||null,mine:S.ui.mine}; DRAFT=null; DB=null; DRAWER=false; MODAL=null; save(); render(); window.scrollTo(0,0); },
 tab(d){ S.ui.tab=d.tab; save(); render(); },
 btab(d){ S.ui.tab=d.tab; render(); },
 filter(d){ S.ui.filter=d.f; render(); },
 drawer(){ DRAWER=!DRAWER; render(); },
 readAll(){ S.notifs.forEach(n=>{ if(n.to===S.me) n.read=true; }); commit(); },
 notif(d){ const n=S.notifs.find(x=>x.id===d.id); if(!n) return; n.read=true; DRAWER=false; if(n.link) ACT.go({v:n.link.v,id:n.link.id,tab:n.link.tab,key:n.link.key,filter:n.link.filter}); else commit(); },
 birimSec(d){ S.ui.birim=d.b; render(); },
 gDosyaModal(d){ const t=S.tasks.find(x=>x.id===d.id);
  modal("Göreve dosya ekle",`<div><b>${esc(t.baslik)}</b></div><label class="field"><span>Dosyalar <span class="hint">· birden fazla seçilebilir</span></span><input class="input" type="file" id="gd-file" multiple></label><label class="field"><span>Not <span class="hint">· isteğe bağlı</span></span><input class="input" id="gd-not" placeholder="Ör. müdürün istediği ek tablo"></label>${t.auditId?`<label class="row"><input type="checkbox" id="gd-kanit" checked> Denetimin Kanıtlar bölümüne de ekle</label>`:""}`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="gDosyaGo" data-id="${t.id}">Ekle</button>`); },
 gDosyaGo(d){ const t=S.tasks.find(x=>x.id===d.id), el=document.getElementById("gd-file"), fl=el&&el.files?[...el.files]:[], n=val("gd-not");
  if(!fl.length) return toast("Dosya seçin.");
  fl.forEach(f=>{ gDosyaKaydet(t,f,n); if(t.auditId&&val("gd-kanit")) kanitKaydet(audit(t.auditId),f,{aciklama:`Görev dosyası: ${t.baslik}`,calisma:n,kaynak:KAYNAKLAR[2],bag:t.testId?{t:"test",id:t.testId}:{t:"genel",id:""}}); });
  gEkle(t,`Dosya eklendi (${fl.length})`,fl.map(f=>f.name).join(", ")+(n?" · "+n:"")); log(`${t.baslik}: ${fl.length} dosya eklendi.`); MODAL=null; commit(`${fl.length} dosya eklendi.`); },
 gDosyaAc(d){ const t=S.tasks.find(x=>x.id===d.id), x=(t.dosyalar||[])[+d.i]; if(!x) return;
  modal(x.ad,`<div class="grid3 small"><div><span class="muted">Görev</span><div>${esc(t.baslik)}</div></div><div><span class="muted">Ekleyen</span><div>${esc(user(x.by).name)} · ${esc(fmt(String(x.tarih).slice(0,10)))}</div></div><div><span class="muted">Boyut</span><div>${x.boyut!=null?boyutTxt(x.boyut):"—"}</div></div></div>${x.not?`<div class="small"><span class="muted">Not:</span> ${esc(x.not)}</div>`:""}
   <div><div class="spread"><div class="section-label">Önizleme</div><button class="btn sm" data-act="gDosyaIndir" data-id="${t.id}" data-i="${d.i}">İndir</button></div><div id="kn-prev" style="margin-top:8px"></div></div>`,
   `<button class="btn" data-act="closeModal">Kapat</button>`,true);
  kanitOnizle(null,{surumler:[x]},0); },
 async gDosyaIndir(d){ const t=S.tasks.find(x=>x.id===d.id), x=(t.dosyalar||[])[+d.i]; if(!x) return; const b=await kanitBlob({},x);
  if(!b) return toast(x.fid==="seed:yok"?"Örnek kayıt: bu dosyanın içeriği demo verisinde yok.":"Dosya içeriği bu tarayıcıda bulunamadı.");
  const dl=await getDownloads();
  if(!dl){ try{ const u=URL.createObjectURL(b), a=document.createElement("a"); a.href=u; a.download=x.ad; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); }catch(e){ toast("Bu görünümde indirme kullanılamıyor."); } return; }
  try{ await dl.save({filename:x.ad,data:b}); toast(x.ad+" kaydedildi."); }catch(e){ toast(e&&e.code==="declined"?"İndirme iptal edildi.":"Dosya indirilemedi."); } },
 kokSec(d){ S.ui={v:"findings",filter:"tum",kok:d.k,mine:S.ui.mine}; render(); window.scrollTo(0,0); },
 tekrarIsaret(d){ const f=finding(d.id), x=finding(d.of); if(!f||!x) return; f.tekrar={of:x.id,by:S.me,at:bugun()}; if(DB&&DB.id===f.id) DB.tekrar=f.tekrar;
  log(`${fcode(f)} tekrar eden bulgu olarak ${fcode(x)} bulgusuna bağlandı.`); commit("Tekrar eden bulgu olarak bağlandı; raporda ve EK-9'da belirtilecek."); },
 tekrarKaldir(d){ const f=finding(d.id); if(!f||!f.tekrar) return; const x=finding(f.tekrar.of); delete f.tekrar; if(DB&&DB.id===f.id) delete DB.tekrar;
  log(`${fcode(f)} için tekrar bağı kaldırıldı${x?` (${fcode(x)})`:""}.`); commit("Tekrar bağı kaldırıldı."); },
 reset(){ if(!RESET_ARMED){ RESET_ARMED=true; render(); setTimeout(()=>{ if(RESET_ARMED){ RESET_ARMED=false; render(); } },4000); return; }
   RESET_ARMED=false; const who=S.me; S=seed(); S.me=who; olcumMigrate(); kokMigrate(); gorevMigrate(); kanitMigrate(); epostaMigrate(); DRAFT=null; DB=null; MODAL=null; commit("Demo verisi baştan yüklendi."); },
 closeModal(){ closeModal(); },
 scrim(d,el,e){ if(e.target===el) closeModal(); },
 peek(d){ const a=audit(d.id); MODAL={wide:true,title:`${a.no} · ${FORMS[d.key].title}`,body:`<div class="paper-wrap"><div class="docroot">${blocksToHtml(formBlocks(a,d.key))}</div></div>`,foot:`<button class="btn" data-act="closeModal">Kapat</button>`}; render(); },
 peekCK(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w); MODAL={wide:true,title:`${w.ref} Çalışma kağıdı`,body:`<div class="paper-wrap"><div class="docroot">${blocksToHtml(ek4Blocks(a,w))}</div></div>`,foot:`<button class="btn ghost" data-act="exportCK" data-id="${a.id}" data-w="${w.id}" data-kind="docx">Word</button><button class="btn ghost" data-act="exportCK" data-id="${a.id}" data-w="${w.id}" data-kind="pdf">PDF</button>${(w.hazirlayan===S.me||canReview())&&a.status==="aktif"?`<button class="btn" data-act="ckEdit" data-id="${a.id}" data-w="${w.id}">Düzenle (yeni sürüm)</button>`:""}<button class="btn" data-act="closeModal">Kapat</button>`}; render(); },

 /* Denetime Başla */
 startModal(d){
  const a=audit(d.id), prev=prevAudits(a), p=planRow(a.planId)||a.makro;
  const prevF = prev.flatMap(x=>findingsOf(x.id)), openF=prevF.filter(f=>!kapali(f));
  const ref=denetimTarihi(a), sinir=String(+ref.slice(0,4)-TEKRAR_YIL)+ref.slice(4), sonF=prev.filter(x=>denetimTarihi(x)>=sinir).flatMap(x=>findingsOf(x.id)).filter(raporlanan);
  const cats={}; sonF.forEach(f=>{ const c=cats[f.kategori]=cats[f.kategori]||{n:0,acik:0}; c.n++; if(!kapali(f)) c.acik++; });
  const koks=kokDagilim(sonF);
  const plan=[["EK1",a.sorumlu,2],["EK3",a.sorumlu,2],["EK15",other(a),4],["EK6",other(a),5],["EK7",a.sorumlu,6]];
  modal(`Denetime Başla · ${a.no}`,
   `<div class="notice info"><div><b>${esc(a.surec)}</b> · ${esc(a.birim)}${p?` · Makro risk ${num2(p.puan)} (${p.duzey})`:""}</div></div>
    <div><div class="section-label" style="margin-bottom:6px">1. Önceki denetimler</div>${prev.length?`<div class="tw"><table class="t"><tr><th>Rapor No</th><th>Rapor tarihi</th><th>Bulgu</th><th>Müdür puanı</th><th></th></tr>${prev.map(x=>`<tr><td class="num">${x.no}</td><td class="num">${fmt(x.rapor.tarih)}</td><td class="num">${findingsOf(x.id).length}</td><td class="num">${x.puan?x.puan.deger+" / 5":"—"}</td><td><button class="btn sm" data-act="previewRapor" data-id="${x.id}">Raporu incele</button></td></tr>`).join("")}</table></div>`:`<div class="empty">Bu süreçte önceki denetim yok.</div>`}</div>
    <div><div class="section-label" style="margin-bottom:6px">2. Hâlâ açık bulgular</div>${openF.length?openF.map(f=>`<div class="li"><div class="li-main"><span class="mono small">${esc(fcode(f))}</span> ${esc(f.konu)}<div class="li-sub">Termin ${fmt(f.termin)} · ${esc(user(f.sorumluDenetci).name)}</div></div>${fChip(f)}</div>`).join(""):`<div class="empty">Açık bulgu yok.</div>`}</div>
    ${Object.keys(cats).length?`<div><div class="section-label" style="margin-bottom:6px">3. Tekrarlayan konular <span class="muted" style="text-transform:none;letter-spacing:0">· son ${TEKRAR_YIL} yıl</span></div><div class="row">${Object.entries(cats).map(([k,c])=>`<span class="chip ${c.n>1?"c-warn":""} nodot">${esc(k)} · ${c.n} bulgu${c.acik?` (${c.acik} açık)`:""}</span>`).join("")}</div>${koks.length?`<div class="row" style="margin-top:6px"><span class="small muted">Kök nedenler:</span>${koks.map(x=>`<span class="chip ${x.fs.length>1?"c-warn":""} nodot">${esc(x.l)} · ${x.fs.length}</span>`).join("")}</div>`:""}<p class="small muted" style="margin:6px 0 0">Bu konuları EK-6 risk matrisinde ve testlerde öncelikli ele alın; aynı kök neden yeniden çıkarsa bulguda tekrar olarak işaretlenir.</p></div>`:""}
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
  let pp=null; if(pt){ pp=puanOku(pt); if(pp.hata) return toast(pp.hata); }
  const before=JSON.parse(JSON.stringify(f.data||{})), after=JSON.parse(JSON.stringify(DRAFT?DRAFT.data:f.data)), ch=diffForm(key,before,after);
  const sub=(f.history||[]).filter(x=>x.tip==="Onaya gönderildi").pop(), to=sub?sub.by:a.sorumlu;
  S.notifs.forEach(n=>{ if(n.to===S.me&&n.link&&n.link.v==="form"&&n.link.id===a.id&&n.link.key===key) n.read=true; });
  f.data=after; f.status="onayli"; f.history=f.history||[]; f.history.push({tip:ch.length?"Müdür değiştirerek onayladı":"Onaylandı",by:S.me,at:nowStamp(),data:after,changes:ch});
  if(pt) puanUygula(pt,pp);
  notify(to,`${a.no} · ${def.title} onaylandı${ch.length?`; müdür ${ch.length} alanı değiştirdi (${ch.map(c=>c.l).join(", ")})`:""}${pt?` · görev puanı ${puanTxt(pp.puan)}/5`:""}.`,{v:"form",id:a.id,key});
  log(`${a.no} ${def.title} onaylandı${ch.length?"; müdür değişiklikleri: "+ch.map(c=>c.l).join(", "):""}${pt?" · görev puanı "+puanTxt(pp.puan)+"/5":""}.`);
  backToAudit(a,"akis",ch.length?`Form ${ch.length} değişiklikle onaylandı; gönderilen sürüm ayrıca saklandı.`:"Form onaylandı."); },
 formBack(){ const a=audit(S.ui.id), key=S.ui.key, f=formOf(a,key), sub=(f.history||[]).filter(x=>x.tip==="Onaya gönderildi").pop(), to=sub?sub.by:a.sorumlu, pt=pendingTask(a,key);
  f.status="taslak"; f.history=f.history||[]; f.history.push({tip:"Düzeltme için geri gönderildi",by:S.me,at:nowStamp()}); if(pt){ pt.durum="devam"; pt.geriGonderme=(pt.geriGonderme||0)+1; pt.bitis=null; gEkle(pt,"Form düzeltme için geri gönderildi",(typeof puanOku==="function"&&val("p-gerekce"))||""); }
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
  const w={id:uid("w"),ref:d.ref,testId:t.id,rkmId:t.rkm,test:val("ck-test"),amac:val("ck-amac"),yontem:val("ck-yontem"),bilgi:val("ck-bilgi"),sonuc:val("ck-sonuc"),dosya:fileName("ck-file"),hazirlayan:S.me,tarih:iso(new Date()),onay:false,surum:1,inceleme:null,gecmis:[],bulguGerekmez:""};
  a.ek4.push(w); { const cf=dosyaObj("ck-file"); if(cf) kanitKaydet(a,cf,{aciklama:`${w.ref} çalışma kağıdı destek dosyası`,calisma:w.yontem,kaynak:KAYNAKLAR[2],bag:{t:"ck",id:w.id}}); } markTaskDone(S.tasks.find(x=>x.auditId===a.id&&x.testId===t.id&&["acik","devam"].includes(x.durum)),`${w.ref} yazıldı: ${w.sonuc}`);
  reviewers().filter(r=>r.id!==S.me).forEach(r=>notify(r.id,`${me().name}, ${a.no} · ${d.ref} çalışma kağıdını gözden geçirmenize gönderdi.`,{v:"audit",id:a.id,tab:"testler"}));
  log(`${a.no} ${d.ref} çalışma kağıdı eklendi (${testCode(a,t.id)}, ${w.sonuc}).`); MODAL=null;
  commit(w.sonuc==="Etkin"?"Çalışma kağıdı kaydedildi. Kontrol etkin.":"Çalışma kağıdı kaydedildi. Kontrol etkin değil: bulgu açın veya neden gerekmediğini yazın."); },
 ckOnay(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w); if(w.hazirlayan===S.me) return toast("Kendi hazırladığınız çalışma kağıdını gözden geçiremezsiniz.");
  w.onay=true; w.inceleme={by:S.me,at:nowStamp(),surum:w.surum||1}; notify(w.hazirlayan,`${w.ref} (v${w.surum||1}) ${me().name} tarafından gözden geçirildi.`,{v:"audit",id:a.id,tab:"testler"}); log(`${a.no} ${w.ref} v${w.surum||1} gözden geçirildi.`); commit("Çalışma kağıdı gözden geçirildi; gözden geçiren, tarih ve sürüm kaydedildi."); },
 ckEdit(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w);
  modal(`${w.ref} · yeni sürüm (v${(w.surum||1)+1})`,`${w.onay?`<div class="notice warn"><div>Bu çalışma kağıdı v${w.surum||1} olarak gözden geçirildi. Kaydederseniz onay düşer ve yeni sürüm yeniden gözden geçirilir; önceki sürüm saklanır.</div></div>`:""}
   <label class="field"><span>Test</span><input class="input" id="ce-test" value="${esc(w.test)}"></label><label class="field"><span>Amaç</span><textarea class="input" id="ce-amac">${esc(w.amac)}</textarea></label><label class="field"><span>Yöntem</span><textarea class="input" id="ce-yontem">${esc(w.yontem)}</textarea></label><label class="field"><span>Edinilen bilgi</span><textarea class="input" id="ce-bilgi">${esc(w.bilgi)}</textarea></label>
   <div class="grid2"><label class="field"><span>Kontrol değerlendirmesi</span><select class="input" id="ce-sonuc">${TEST_SONUC.map(x=>`<option ${x===w.sonuc?"selected":""}>${x}</option>`).join("")}</select></label><label class="field"><span>Ne değişti</span><input class="input" id="ce-not" placeholder="Ör. örneklem 25'ten 40'a çıkarıldı"></label></div>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="ckEditGo" data-id="${a.id}" data-w="${w.id}">Yeni sürümü kaydet</button>`,true); },
 ckEditGo(d){ const a=audit(d.id), w=a.ek4.find(x=>x.id===d.w), not=val("ce-not"); if(!not) return toast("Neyin değiştiğini yazın.");
  w.gecmis=w.gecmis||[]; w.gecmis.push({surum:w.surum||1,at:nowStamp(),by:S.me,not,inceleme:w.onay?w.inceleme:null,data:{test:w.test,amac:w.amac,yontem:w.yontem,bilgi:w.bilgi,sonuc:w.sonuc}});
  const onayli=w.onay; Object.assign(w,{test:val("ce-test"),amac:val("ce-amac"),yontem:val("ce-yontem"),bilgi:val("ce-bilgi"),sonuc:val("ce-sonuc"),surum:(w.surum||1)+1,onay:false,inceleme:null});
  reviewers().filter(r=>r.id!==w.hazirlayan&&r.id!==S.me).forEach(r=>notify(r.id,`${a.no} · ${w.ref} v${w.surum} gözden geçirmenizi bekliyor${onayli?" (önceki onay düştü)":""}.`,{v:"audit",id:a.id,tab:"testler"}));
  log(`${a.no} ${w.ref} v${w.surum} kaydedildi${onayli?"; önceki gözden geçirme onayı düştü":""}: ${not}`); MODAL=null; commit(`v${w.surum} kaydedildi; gözden geçirme bekliyor.`); },
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
  ["konu","birim","kategori","kategoriAciklama","mevcut","neden","kokAna","kokIkincil","risk","kriter","oneri","scores","onemOverride"].forEach(k=>f[k]=JSON.parse(JSON.stringify(DB[k]===undefined?null:DB[k])));
  f.ek10.nedenGizle=DB.ek10.nedenGizle; if(silent!==true){ log(`${fcode(f)} kaydedildi.`); commit("Bulgu kaydedildi."); } else save(); return true; },
 bSend(){ if(ACT.bSave(true)===false) return; const f=finding(S.ui.id), a=audit(f.auditId);
  if(!f.kategori) return toast("Kategori seçin."); if(!f.kokAna) return toast("Ana kök nedeni seçin."); if(maxEtki(f.scores)===0) return toast("Bulguyu puanlayın: en az bir alt faktör seçin."); if(!f.mevcut||!f.oneri) return toast("Mevcut durum ve öneri alanlarını doldurun.");
  f.status="onay_bekliyor"; f.submitted=bSnap(f); f.history=f.history||[]; f.history.push({tip:"Gözden geçirmeye gönderildi",by:S.me,at:nowStamp(),snap:f.submitted});
  reviewers().filter(u=>u.id!==S.me).forEach(r=>notify(r.id,`${me().name}, ${fcode(f)} bulgusunu gözden geçirmenize gönderdi.`,{v:"bulgu",id:f.id,tab:"ek9"}));
  log(`${fcode(f)} gözden geçirmeye gönderildi.`); backToAudit(a,"testler","Bulgu gözden geçirmeye gönderildi; müdüre ve yöneticiye bildirim gitti."); },
 bApprove(){ const f=finding(S.ui.id), a=audit(f.auditId), before=f.submitted||bSnap(f), wasPending=f.status==="onay_bekliyor";
  if(ACT.bSave(true)===false) return; if(!f.kategori) return toast("Kategori seçin."); if(!f.kokAna) return toast("Ana kök nedeni seçin."); if(maxEtki(f.scores)===0) return toast("Onaydan önce bulgu puanlanmalı."); if(!f.mevcut||!f.oneri) return toast("Mevcut durum ve öneri alanlarını doldurun.");
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
   f.uzatim={tarih:t,gerekce:not,durum:"bekliyor",by:S.me,at:iso(new Date())}; f.updates.push({at:iso(new Date()),by:S.me,tip:"Uzatım talebi",not:`${fmt(t)} · ${not}`}); mudurler().forEach(m=>notify(m.id,`Termin uzatım talebi: ${fcode(f)} (${me().name}).`,{v:"findings"})); }
  else { if(!not) return toast("Kısa bir açıklama yazın."); f.updates.push({at:iso(new Date()),by:S.me,tip:v==="bilgi"?"Birimden bilgi alınamadı":"Devam ediyor",not}); }
  log(`${fcode(f)} durum girişi: ${f.updates[f.updates.length-1].tip}.`); MODAL=null; commit("Durum kaydedildi."); },
 verify(d){ const f=finding(d.id), u=f.updates.filter(x=>x.tip==="Tamamlandı").pop()||{}, a=audit(f.auditId), hi=yuksekRisk(f), ks=kanitlar(a).slice().sort((x,y)=>((y.bag&&y.bag.id===f.id)?1:0)-((x.bag&&x.bag.id===f.id)?1:0));
  modal(`Kapanış doğrulaması · ${fcode(f)}`,`<div><b>${esc(f.konu)}</b> ${onemChip(onemOf(f))}<div class="li-sub">Öneri: ${esc(f.oneri)}</div></div>
   <div class="card small"><span class="muted">Birim beyanı · ${fmt(u.at)} · ${esc(user(u.by).name)}:</span> ${esc(u.not||"—")}${u.kanit?` · <span class="mono">${esc(u.kanit)}</span>`:""}</div>
   ${hi?`<div class="notice warn"><div><b>Yüksek riskli bulgu.</b> Kontrol yeniden yapılmalı veya örneklem testi uygulanmalı, en az bir kanıta dayanılmalı. Doğrulamadan sonra kapanışı başka bir gözden geçiren onaylar.</div></div>`:""}
   <div class="grid2"><label class="field"><span>Doğrulama yöntemi</span><select class="input" id="v-yontem"><option value="">Seçin</option>${DOG_YONTEM.map(y=>`<option ${hi&&["Sorgulama","Gözlem"].includes(y)?"disabled":""}>${y}</option>`).join("")}</select></label>
   <label class="field"><span>Sonuç</span><select class="input" id="v-sonuc" data-vsonuc="1"><option value="">Seçin</option><option value="giderildi">Risk giderildi${hi?" · kapanış onayına gönder":" · kapat"}</option><option value="kismen">Kısmen giderildi · açık kalsın</option><option value="yetersiz">Kanıt yetersiz · aksiyona geri gönder</option>${isMudur()?`<option value="kabul">Yönetim riski kabul etti</option>`:""}</select></label></div>
   <div data-vk="kismen" hidden><label class="field"><span>Yeni termin</span><input class="input" type="date" id="v-termin"></label></div>
   <label class="field"><span>Yeniden yapılan kontrol veya test ve sonucu</span><textarea class="input" id="v-test" placeholder="Ör. Mart–Mayıs döneminden 25 ödeme talimatı seçildi; tamamında çift imza bulundu."></textarea></label>
   <div class="field"><span>Dayanılan kanıtlar ${hi?"<span class=\"hint\">· en az bir kanıt</span>":"<span class=\"hint\">· isteğe bağlı</span>"}</span>${ks.length?`<div class="stack" style="gap:4px;max-height:160px;overflow:auto">${ks.map(k=>`<label class="chk"><input type="checkbox" name="v-kanit" value="${k.id}" ${k.bag&&k.bag.id===f.id?"checked":""}> <span>${esc(k.ad)} <span class="muted small">· ${esc(k.aciklama)}</span></span></label>`).join("")}</div>`:`<div class="small muted">Bu denetimde kanıt yok. Önce denetimin Kanıtlar bölümüne ekleyin.</div>`}</div>
   <label class="field"><span>Aksiyon kök nedeni giderdi mi? <span class="hint">· kök neden: ${esc(f.kokAna?kokAd(f.kokAna):"girilmemiş")}${f.kokIkincil?" / "+esc(kokAd(f.kokIkincil)):""}</span></span><select class="input" id="v-kok"><option value="">Seçin</option><option value="evet">Evet · kök neden ortadan kalktı</option><option value="kismen">Kısmen · belirti düzeldi, kök neden sürüyor</option><option value="hayir">Hayır · yalnızca bu örnekler düzeltildi</option></select></label>
   <label class="field"><span>Riskin neden giderilmiş (veya kabul edilmiş) sayıldığı</span><textarea class="input" id="v-not"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="verifyGo" data-id="${f.id}">Kaydet</button>`,true); },
 verifyGo(d){ const f=finding(d.id), a=audit(f.auditId), hi=yuksekRisk(f), y=val("v-yontem"), s=val("v-sonuc"), test=val("v-test"), not=val("v-not"), sec=[...document.querySelectorAll('input[name="v-kanit"]:checked')].map(x=>x.value);
  if(!s) return toast("Sonucu seçin.");
  if(s==="yetersiz"){ if(!not) return toast("Neyin eksik olduğunu yazın."); }
  else { if(!y) return toast("Doğrulama yöntemini seçin."); if(!test) return toast("Yeniden yapılan kontrolü veya testi yazın."); if(!not) return toast("Riskin neden giderilmiş sayıldığını yazın."); }
  if(hi&&s==="giderildi"){ if(["Sorgulama","Gözlem"].includes(y)) return toast("Yüksek riskli bulguda kontrol yeniden yapılmalı veya örneklem testi uygulanmalı."); if(!sec.length) return toast("Yüksek riskli bulguda en az bir kanıt seçin."); }
  const yt=val("v-termin"); if(s==="kismen"&&!yt) return toast("Kısmen giderilen bulgu için yeni termin girin.");
  if(s==="kabul"&&!isMudur()) return toast("Risk kabulünü yalnızca müdür kaydedebilir.");
  const kg=val("v-kok"); if(["giderildi","kismen"].includes(s)&&!kg) return toast("Aksiyonun kök nedeni giderip gidermediğini seçin.");
  if(s==="giderildi"&&kg!=="evet") return toast("Kök neden sürüyorsa bulgu kapatılamaz; sonucu \"Kısmen giderildi\" seçip yeni termin verin.");
  const now=nowStamp(), dog={by:S.me,at:now,kokGiderildi:kg||null,yontem:y,test,kanitlar:sec.map(id=>{ const k=kanitlar(a).find(x=>x.id===id); return k?{id,ad:k.ad}:null; }).filter(Boolean),sonuc:s,not};
  f.dogrulamalar=f.dogrulamalar||[]; f.dogrulamalar.push(dog); let msg;
  if(s==="yetersiz"){ f.status="aksiyonda"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Kanıt yetersiz",not}); msg="Bulgu aksiyona geri gönderildi."; }
  else if(s==="kismen"){ f.status="aksiyonda"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Kısmen giderildi",not:`${y}: ${test} · yeni termin ${fmt(yt)}`}); f.termin=yt; msg="Bulgu açık kaldı; yeni termin kaydedildi."; }
  else if(s==="kabul"){ f.status="risk_kabul"; f.kapanisTarihi=iso(new Date()); f.riskKabul={by:S.me,at:now,gerekce:not}; f.updates.push({at:iso(new Date()),by:S.me,tip:"Yönetim riski kabul etti",not}); msg="Risk kabulü kaydedildi; Denetim Komitesi raporunda listelenecek."; }
  else if(hi){ f.status="kapanis_onayi"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Doğrulandı · kapanış onayı bekliyor",not:`${y}: ${test}`}); reviewers().filter(r=>r.id!==S.me).forEach(r=>notify(r.id,`${fcode(f)} doğrulandı; kapanış için ikinci onayınız bekleniyor.`,{v:"bulgu",id:f.id,tab:"takip"})); msg="Doğrulama kaydedildi; kapanış ikinci onaya gönderildi."; }
  else { f.status="kapandi"; f.kapanisTarihi=iso(new Date()); f.kapanis={by:S.me,at:now,ikinci:false}; f.updates.push({at:iso(new Date()),by:S.me,tip:"Doğrulandı, bulgu kapandı",not:`${y}: ${test}`}); msg="Doğrulama kaydedildi, bulgu kapandı."; }
  if(f.sorumluDenetci!==S.me) notify(f.sorumluDenetci,`${fcode(f)}: ${({giderildi:hi?"doğrulandı, kapanış onayı bekleniyor":"doğrulandı ve kapandı",kismen:"kısmen giderildi, açık kaldı",yetersiz:"kanıt yetersiz bulundu",kabul:"yönetim riski kabul etti"})[s]}.`,{v:"bulgu",id:f.id,tab:"takip"});
  log(`${fcode(f)} kapanış doğrulaması: ${s} (${y||"—"}).`); MODAL=null; commit(msg); },
 kapanisOnay(d){ const f=finding(d.id), dog=(f.dogrulamalar||[]).slice(-1)[0]||{};
  if(dog.by===S.me) return toast("Kendi doğruladığınız bulgunun kapanışını onaylayamazsınız.");
  modal(`Kapanış onayı · ${fcode(f)}`,`<div><b>${esc(f.konu)}</b> ${onemChip(onemOf(f))}</div><div class="card small stack" style="gap:4px"><div><span class="muted">Doğrulayan:</span> ${esc(user(dog.by).name)} · ${esc(fmt(String(dog.at).slice(0,10)))}</div><div><span class="muted">Yöntem:</span> ${esc(dog.yontem||"—")}</div><div><span class="muted">Yeniden yapılan kontrol:</span> ${esc(dog.test||"—")}</div><div><span class="muted">Kanıt:</span> ${(dog.kanitlar||[]).map(k=>esc(k.ad)).join(", ")||"—"}</div><div><span class="muted">Gerekçe:</span> ${esc(dog.not||"—")}</div></div><label class="field"><span>Not <span class="hint">· geri gönderirken zorunlu</span></span><textarea class="input" id="ko-not"></textarea></label>`,
   `<button class="btn" data-act="kapanisGo" data-id="${f.id}" data-ok="0">Doğrulamaya geri gönder</button><button class="btn pri" data-act="kapanisGo" data-id="${f.id}" data-ok="1">Onayla ve kapat</button>`); },
 kapanisGo(d){ const f=finding(d.id), dog=(f.dogrulamalar||[]).slice(-1)[0]||{}, not=val("ko-not");
  if(d.ok==="1"){ f.status="kapandi"; f.kapanisTarihi=iso(new Date()); f.kapanis={by:S.me,at:nowStamp(),ikinci:true,dogrulayan:dog.by,not}; f.updates.push({at:iso(new Date()),by:S.me,tip:"Kapanış ikinci onayla verildi",not}); }
  else { if(!not) return toast("Geri gönderme nedenini yazın."); f.status="dogrulamada"; f.updates.push({at:iso(new Date()),by:S.me,tip:"Kapanış onayı verilmedi",not}); }
  [dog.by,f.sorumluDenetci].filter((x,i,a)=>x&&x!==S.me&&a.indexOf(x)===i).forEach(u=>notify(u,`${fcode(f)}: ${d.ok==="1"?"kapanış onaylandı, bulgu kapandı":"kapanış onayı verilmedi, yeniden doğrulama gerekli"}.`,{v:"bulgu",id:f.id,tab:"takip"}));
  log(`${fcode(f)} kapanış ${d.ok==="1"?"ikinci onayla verildi":"onayı reddedildi"}.`); MODAL=null; commit(d.ok==="1"?"Bulgu kapandı.":"Bulgu doğrulamaya geri gönderildi."); },
 uzatim(d){ const f=finding(d.id), u=f.uzatim;
  if(d.ok==="1"){ f.updates.push({at:iso(new Date()),by:S.me,tip:"Uzatım onaylandı",not:`${fmt(f.termin)} → ${fmt(u.tarih)}`}); f.termin=u.tarih; u.durum="onaylandı"; f.uzatimSayisi=(f.uzatimSayisi||0)+1; }
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
   <label class="field"><span>Zorluk <span class="hint">· değerlendirmede ağırlık olarak kullanılır</span></span><select class="input" id="t-zor">${Object.entries(ZORLUK).map(([k,v])=>`<option value="${k}" ${k==="orta"?"selected":""}>${v.ad} (ağırlık ${v.w})</option>`).join("")}</select></label>
   <p class="small muted" style="margin:0">Görev tamamlandığında çıktısı eklenir ve müdür gerekçeli değerlendirmeden kapanmaz.</p>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="taskCreate">Oluştur</button>`); },
 taskCreate(){ const b=val("t-baslik"), t=val("t-termin"); if(!b||!t) return toast("Görev adı ve termin gerekli.");
  const kay=val("t-kay"), bag=val("t-bag"), sor = canReview()? val("t-sor") : S.me;
  const atayan = kay==="sozlu" ? (canReview()?S.me:val("t-veren")) : S.me;
  const task={id:uid("t"),baslik:b,aciklama:val("t-acik"),atayan,sorumlu:sor,termin:t,durum:"acik",auditId:bag!=="surekli"?bag:null,surekli:bag==="surekli"?{alan:val("t-alan"),siklik:val("t-sik")}:null,formKey:null,puan:null,yorum:"",kaynak:kay,kaydeden:kay==="sozlu"?S.me:null,created:iso(new Date()),sonuc:"",cikti:"",tespit:"",zorluk:val("t-zor")||"orta",geriGonderme:0};
  S.tasks.unshift(task);
  if(sor!==S.me) notify(sor,`Yeni görev atandı: ${b}.`,{v:task.surekli?"surekli":"tasks"});
  if(kay==="sozlu"&&atayan!==S.me) notify(atayan,`${me().name}, sözlü talimatınızı sisteme görev olarak girdi: ${b}.`,{v:task.surekli?"surekli":"tasks"});
  log(`Görev oluşturuldu (${KAYNAK[kay]}): ${b} → ${user(sor).name}${task.auditId?" · "+audit(task.auditId).no:" · sürekli denetim"}.`); MODAL=null; commit("Görev oluşturuldu."); },
 taskStart(d){ const t=S.tasks.find(x=>x.id===d.id); t.durum="devam"; gEkle(t,"Başlandı"); commit(); },
 taskDoneModal(d){ const t=S.tasks.find(x=>x.id===d.id);
  modal("Görevi tamamla",`<div><b>${esc(t.baslik)}</b><div class="li-sub">${taskCtx(t)} · termin ${fmt(t.termin)}</div></div>
   <label class="field"><span>Sonuç</span><textarea class="input" id="td-sonuc" placeholder="Ne yapıldı, ne bulundu"></textarea></label>
   <label class="field"><span>Çıktı dosyaları <span class="hint">· rapor, Excel vb. · birden fazla seçilebilir${t.auditId?" · denetimin Kanıtlar bölümüne de eklenir":""}</span></span><input class="input" type="file" id="td-file" multiple></label>
   ${t.surekli?`<label class="row"><input type="checkbox" id="td-tsp" data-ttsp="1"> Denetim gerektiren bir tespit var</label><div data-tsp hidden><label class="field"><span>Tespit</span><textarea class="input" id="td-tespit" placeholder="Ör. 3 şubede iade oranı ortalamanın iki katı"></textarea></label></div>`:""}`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="taskDoneGo" data-id="${t.id}">Tamamlandı, müdür puanına gönder</button>`); },
 taskDoneGo(d){ const t=S.tasks.find(x=>x.id===d.id), s=val("td-sonuc"); if(!s) return toast("Sonucu kısaca yazın.");
  if(val("td-tsp")){ const tp=val("td-tespit"); if(!tp) return toast("Tespiti yazın."); t.tespit=tp; }
  { const el=document.getElementById("td-file"), fl=el&&el.files?[...el.files]:[];
    fl.forEach(tf=>{ gDosyaKaydet(t,tf,"Görev çıktısı"); if(t.auditId) kanitKaydet(audit(t.auditId),tf,{aciklama:`Görev çıktısı: ${t.baslik}`,calisma:s,kaynak:KAYNAKLAR[2],bag:t.testId?{t:"test",id:t.testId}:{t:"genel",id:""}}); });
    if(fl.length) t.cikti=fl[0].name; }
  markTaskDone(t,s); log(`Görev tamamlandı: ${t.baslik}.`); MODAL=null; commit(isMudur()?"Görev kapandı.":"Görev tamamlandı; müdüre bildirim gitti."); },
 taskPuan(d){ const t=S.tasks.find(x=>x.id===d.id);
  modal(t.durum==="kapandi"?"Değerlendirmeyi gözden geçir":"Görevi değerlendir",`<div class="spread"><div><b>${esc(t.baslik)}</b><div class="li-sub">${esc(user(t.sorumlu).name)} · ${taskCtx(t)} · termin ${fmt(t.termin)}${t.bitis?` · teslim ${fmt(t.bitis)}`:""}</div></div>${S.ui.v!=="gorev"?`<button class="btn sm" data-act="go" data-v="gorev" data-id="${t.id}">Görevin tamamını aç</button>`:""}</div>${t.sonuc||(t.dosyalar||[]).length?`<div class="card small"><div style="white-space:pre-wrap">${esc(t.sonuc||"")}</div>${(t.dosyalar||[]).length?`<div style="margin-top:6px">${t.dosyalar.map((x,i)=>`<span class="mono">${esc(x.ad)}</span>`).join(", ")} <span class="muted">· içeriği görmek için görevi açın</span></div>`:""}</div>`:""}${puanFormHtml(t)}`,
   `<button class="btn" data-act="closeModal">Vazgeç</button>${t.durum==="onay_bekliyor"?`<button class="btn" data-act="taskBack" data-id="${t.id}">Düzeltme için geri gönder</button>`:""}<button class="btn pri" data-act="taskPuanGo" data-id="${t.id}">${t.durum==="kapandi"?"Değerlendirmeyi güncelle":"Değerlendir ve kapat"}</button>`,true); },
 taskBack(d){ const t=S.tasks.find(x=>x.id===d.id), n=val("p-gerekce"); if(!n) return toast("Gerekçe alanına neyin düzeltilmesi gerektiğini yazın.");
  t.durum="devam"; t.geriGonderme=(t.geriGonderme||0)+1; t.bitis=null; gEkle(t,"Düzeltme için geri gönderildi",n); notify(t.sorumlu,`"${t.baslik}" düzeltme için geri gönderildi: ${n}`,{v:"gorev",id:t.id}); log(`Görev düzeltmeye gönderildi: ${t.baslik}.`); MODAL=null; commit("Görev düzeltme için geri gönderildi."); },
 gorusModal(d){ const t=S.tasks.find(x=>x.id===d.id);
  modal("Değerlendirmeye görüş ekle",`<div><b>${esc(t.baslik)}</b> · ${puanTxt(t.puan)} / 5</div>${degerlendirmeHtml(t)}<label class="field"><span>Görüşünüz <span class="hint">· müdür görür; puanı değiştirmez, müdür yeniden inceleyebilir</span></span><textarea class="input" id="gr-metin"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="gorusGo" data-id="${t.id}">Gönder</button>`); },
 gorusGo(d){ const t=S.tasks.find(x=>x.id===d.id), m=val("gr-metin"); if(!m) return toast("Görüşünüzü yazın.");
  t.gorus={metin:m,at:nowStamp(),by:S.me,incelendi:false}; gEkle(t,"Çalışan görüşü eklendi",m); mudurler().forEach(u=>notify(u.id,`${me().name}, "${t.baslik}" değerlendirmesine görüş ekledi.`,{v:"gorev",id:t.id})); log(`${t.baslik}: değerlendirmeye çalışan görüşü eklendi.`); MODAL=null; commit("Görüşünüz müdüre iletildi."); },
 beklemeModal(d){ const t=S.tasks.find(x=>x.id===d.id);
  modal("Birimden bilgi / belge bekleniyor",`<p class="small muted" style="margin:0">Bekleme süresi termine eklenir ve gecikmeniz sayılmaz. Bilgi gelince "Bilgi geldi" deyin.</p><label class="field"><span>Ne bekleniyor, kimden</span><textarea class="input" id="bk-not" placeholder="Ör. Hazine biriminden Mart ayı banka ekstreleri"></textarea></label>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="beklemeGo" data-id="${t.id}">Beklemeyi başlat</button>`); },
 beklemeGo(d){ const t=S.tasks.find(x=>x.id===d.id), n=val("bk-not"); if(!n) return toast("Neyin beklendiğini yazın."); t.beklemeler=t.beklemeler||[]; t.beklemeler.push({bas:bugun(),bit:null,not:n}); gEkle(t,"Birim beklemesi başladı",n); if(t.durum==="acik") t.durum="devam"; log(`${t.baslik}: birim beklemesi başladı (${n}).`); MODAL=null; commit("Bekleme kaydedildi."); },
 beklemeBitir(d){ const t=S.tasks.find(x=>x.id===d.id), b=(t.beklemeler||[]).find(x=>!x.bit); if(b){ b.bit=bugun(); gEkle(t,"Bilgi geldi, bekleme bitti",`${beklemeGun(t)} gün termine eklendi.`); } log(`${t.baslik}: birim beklemesi bitti (${beklemeGun(t)} gün termine eklendi).`); commit(`Bekleme kapandı; termin ${fmt(terminEff(t))} oldu.`); },
 donem(d){ S.pref=S.pref||{}; S.pref.donem=d.k; save(); render(); },
 ertele(d){ const p=planRow(d.p);
  modal(`Plan satırını ertele veya iptal et · ${p.surec}`,`<div class="grid2"><label class="field"><span>İşlem</span><select class="input" id="er-tip"><option value="ertelendi">Ertele</option><option value="iptal">İptal et</option></select></label><label class="field"><span>Neden</span><select class="input" id="er-neden">${ERTELEME_NEDEN.map(x=>`<option>${x}</option>`).join("")}</select></label></div>
   <label class="field"><span>Hedef dönem <span class="hint">· ertelemede</span></span><input class="input" id="er-hedef" placeholder="Ör. 2027 · 1. çeyrek"></label><label class="field"><span>Gerekçe</span><textarea class="input" id="er-ger"></textarea></label><p class="small muted" style="margin:0">Plan sapmaları Denetim Komitesi / YK'ya raporlanır.</p>`,
   `<button class="btn" data-act="closeModal">Vazgeç</button><button class="btn pri" data-act="erteleGo" data-p="${p.id}">Kaydet</button>`); },
 erteleGo(d){ const p=planRow(d.p), g=val("er-ger"), tip=val("er-tip"); if(!g) return toast("Gerekçe yazın."); if(tip==="ertelendi"&&!val("er-hedef")) return toast("Hedef dönemi yazın.");
  p.durum=tip; p.erteleme={neden:val("er-neden"),gerekce:g,hedef:val("er-hedef")||"—",by:S.me,at:bugun()}; log(`Plan: ${p.surec} ${PLAN_DURUM[tip][0].toLowerCase()} (${p.erteleme.neden}): ${g}`); MODAL=null; commit("Plan sapması kaydedildi."); },
 planGeriAl(d){ const p=planRow(d.p); p.durum="planlandi"; log(`Plan: ${p.surec} yeniden plana alındı.`); commit("Satır yeniden planlandı."); },
 star(d){ PUAN=+d.n; document.querySelectorAll(".stars button").forEach(b=>b.classList.toggle("on",+b.dataset.n<=PUAN)); },
 taskPuanGo(d){ const t=S.tasks.find(x=>x.id===d.id), ilk=t.durum!=="kapandi", p=puanOku(t); if(p.hata) return toast(p.hata); puanUygula(t,p);
  notify(t.sorumlu,`"${t.baslik}" ${ilk?"değerlendirildi":"değerlendirmesi güncellendi"}: ${puanTxt(t.puan)}/5. Gerekçe: ${p.deg.gerekce}`,{v:t.surekli?"surekli":"tasks"}); log(`Görev değerlendirildi (${puanTxt(t.puan)}/5, ${ZORLUK[t.zorluk].ad}): ${t.baslik}.`);
  let msg=ilk?"Görev değerlendirildi ve kapandı.":"Değerlendirme güncellendi; eski puan revizyon olarak saklandı.";
  if(ilk&&t.surekli&&SIKLIK_GUN[t.surekli.siklik]){ const g=SIKLIK_GUN[t.surekli.siklik], base=t.termin>iso(new Date())?t.termin:iso(new Date()); const d2=new Date(base+"T00:00:00"); d2.setDate(d2.getDate()+g);
   S.tasks.unshift({...t,id:uid("t"),durum:"acik",termin:iso(d2),puan:null,yorum:"",sonuc:"",cikti:"",dosyalar:[],gecmis:[],tespit:"",bitis:null,onayTarihi:null,degerlendirme:null,gorus:null,revizyonlar:[],beklemeler:[],geriGonderme:0,created:iso(new Date())}); msg+=` Bir sonraki dönem görevi ${fmt(iso(d2))} terminiyle açıldı.`; }
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
 if(d.pz!=null){ const b=t.value==="basit"; document.querySelectorAll("[data-pz-basit]").forEach(x=>x.hidden=!b); document.querySelectorAll("[data-pz-detay]").forEach(x=>x.hidden=b); return; }
 if(d.vsonuc!=null){ document.querySelectorAll("[data-vk]").forEach(x=>x.hidden=x.dataset.vk!==t.value); return; }
 if(d.yn!=null&&NEW){ yeniSet(d.yn, t.type==="checkbox"?t.checked:t.value); return; }
 if(d.ynArr!=null&&NEW){ const k=d.ynArr; if(t.checked){ if(!NEW[k].includes(t.value)) NEW[k].push(t.value); } else NEW[k]=NEW[k].filter(x=>x!==t.value); render(); return; }
 if(d.actChange==="kisi"){ S.ui.kisi=t.value||null; render(); return; }
 if(d.actChange==="birim"){ S.ui.birim=t.value||null; render(); return; }
 if(d.actChange==="kok"){ S.ui.kok=t.value||null; render(); return; }
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
