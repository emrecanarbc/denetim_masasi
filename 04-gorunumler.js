"use strict";
/* ============ Görünümler ============ */
const NAV = [["panel","Panel"],["audits","Denetimler"],["tasks","Görevler"],["surekli","Sürekli Denetim"],["findings","İzleme"],["plan","Denetim Planı"],["perf","Performans"],["log","Değişiklik Kaydı"]];
function myOpenTasks(){ return S.tasks.filter(t=>t.sorumlu===S.me && ["acik","devam"].includes(t.durum)); }
function lateFindings(){ return S.findings.filter(f=>effStatus(f)==="gecikti"); }
const taskCtx = t => t.auditId ? `<span class="mono">${esc(audit(t.auditId).no)}</span>` : t.surekli ? `Sürekli denetim · ${esc(t.surekli.alan)}` : "—";
const KAYNAK = {sistem:"Sistemden atandı",sozlu:"Sözlü talimat",kendi:"Kendi planı"};

function renderSide(){
 const cnt = {tasks: isMudur()? S.tasks.filter(t=>t.durum==="onay_bekliyor").length : canReview()? S.tasks.filter(t=>t.durum==="acik").length : myOpenTasks().filter(t=>!t.surekli).length, surekli: S.tasks.filter(t=>t.surekli&&["acik","devam"].includes(t.durum)&&(canReview()||t.sorumlu===S.me)).length, findings: lateFindings().length};
 const cur = ["audit","form","bulgu","yeni"].includes(S.ui.v) ? "audits" : S.ui.v;
 return `<aside class="side">
  <div class="brand"><div class="brand-mark">İD</div><div><b>Denetim Masası</b><span>İç denetim platformu</span></div></div>
  <nav class="nav" aria-label="Ana menü">${NAV.filter(n=>n[0]!=="log"||isMudur()).map(n=>`<button class="${cur===n[0]?"on":""}" data-act="go" data-v="${n[0]}">${n[1]}${cnt[n[0]]?`<span class="cnt">${cnt[n[0]]}</span>`:""}</button>`).join("")}</nav>
  <div class="side-foot">
   <label for="who">Görüntülenen kullanıcı</label>
   <select id="who" class="input" data-act-change="who">${S.users.map(u=>{ const n=S.notifs.filter(x=>x.to===u.id&&!x.read).length; return `<option value="${u.id}" ${u.id===S.me?"selected":""}>${esc(u.name)} · ${esc(u.title)}${n?` (${n})`:""}</option>`; }).join("")}</select>
   <button class="btn sm" data-act="profil">Profil ve e-posta</button>
   <button class="btn sm ${RESET_ARMED?"danger":""}" data-act="reset">${RESET_ARMED?"Emin misiniz? Tekrar tıklayın":"Demo verisini sıfırla"}</button>
  </div></aside>`;
}
function topbar(title,back,right){
 const unread = S.notifs.filter(n=>n.to===S.me&&!n.read).length;
 return `<div class="top"><div class="stack" style="gap:6px">${back||""}<h1 class="page-title">${title}</h1></div>
  <div class="top-right">${right||""}<span class="demo-tag">Örnek veri</span>
  <button class="btn bell" data-act="drawer" aria-label="Bildirimler">Bildirimler${unread?`<span class="dot">${unread}</span>`:""}</button></div></div>`;
}
const backBtn = (a,tab) => `<div><button class="btn sm" data-act="go" data-v="audit" data-id="${a.id}" data-tab="${tab||"akis"}">← ${esc(a.no)} denetimine dön</button></div>`;
const backTo = (v,label) => `<div><button class="btn sm" data-act="go" data-v="${v}">← ${esc(label)}</button></div>`;

/* ---- Bağlam kartları: önceki evraklar ilgili adımda önüne gelir ---- */
function ctxCard(title,html,btn){ return `<div class="ctx"><div class="spread"><b>${esc(title)}</b>${btn||""}</div><div class="ctx-b">${html}</div></div>`; }
const openFormBtn = (a,k) => `<button class="btn sm ghost" data-act="peek" data-id="${a.id}" data-key="${k}">Formu gör</button>`;
function ctxEK15(a,qs){ const d=formOf(a,"EK15").data; const items=qs.filter(i=>d["q"+i]).map(i=>`<li><span class="muted">${esc(EK15_Q[i-1])}</span><br>${esc(d["q"+i])}</li>`).join(""); return items?ctxCard("EK-15 Süreç Bilgi Formu'ndan",`<ul class="ctx-list">${items}</ul>`,openFormBtn(a,"EK15")):""; }
function ctxRKM(a){ const r=rkmRows(a); return r.length?ctxCard("EK-6 Risk Kontrol Matrisi'nden",`<ul class="ctx-list">${r.map((x,i)=>`<li><span class="mono">R-${pad2(i+1)}</span> ${esc(x.risk)} <span class="muted">· kontrol: ${esc(x.kontrol)} · seviye ${x.etki&&x.olas?x.etki*x.olas:"—"}</span></li>`).join("")}</ul>`,openFormBtn(a,"EK6")):""; }
function ctxEK7(a){ const d=formOf(a,"EK7").data; return d.amac?ctxCard("EK-7 Denetim Programı'ndan",`<p><span class="muted">Amaç:</span> ${esc(d.amac)}</p><p><span class="muted">Kapsam:</span> ${esc(d.kapsam||"")}</p>`,openFormBtn(a,"EK7")):""; }
function ctxEK5(a){ const d=formOf(a,"EK5").data; return (d.notlar||d.irtibat)?ctxCard("EK-5 Açılış toplantısından",`<p><span class="muted">İrtibat:</span> ${esc(d.irtibat||"—")}</p><p>${esc(d.notlar||"")}</p>`,openFormBtn(a,"EK5")):""; }
function ctxPrev(a){ const prev=prevAudits(a); if(!prev.length) return ctxCard("Önceki denetimler","<p>Bu süreçte daha önce denetim yapılmamış.</p>"); const fs=prev.flatMap(x=>findingsOf(x.id)); return ctxCard("Önceki denetimlerden",`<ul class="ctx-list">${fs.map(f=>`<li><span class="mono">${esc(fcode(f))}</span> ${esc(f.konu)} ${fChip(f)}</li>`).join("")}</ul>`); }
function ctxTests(a,mine){ const ts=testRows(a).filter(t=>!mine||t.denetci===S.me); return ts.length?ctxCard(mine?"Size atanan testler (EK-8)":"Testler (EK-8)",`<ul class="ctx-list">${ts.map(t=>{const w=ckOfTest(a,t.id); return `<li><span class="mono">${testCode(a,t.id)}</span> ${esc(t.test)} <span class="muted">· ${rkmCode(a,t.rkm)} · ${fmt(t.bit)}</span> ${w?sonucChip(w.sonuc):`<span class="chip c-warn">Çalışma kağıdı yok</span>`}</li>`;}).join("")}</ul>`,`<button class="btn sm ghost" data-act="tab" data-tab="testler">Testlere git</button>`):""; }
function ctxFindings(a){ const fs=findingsOf(a.id); return fs.length?ctxCard("Bulgular",`<ul class="ctx-list">${fs.map(f=>`<li><span class="mono">B${f.no}</span> ${esc(f.konu)} <span class="muted">· ${esc(f.calismaRef||"ÇK yok")}</span> ${onemChip(onemOf(f))} ${f.ek10.islendi?`<span class="muted">· ${f.ek10.gorus.includes("katiliyor")?"birim katılıyor":"birim katılmıyor"}</span>`:""}</li>`).join("")}</ul>`):""; }
function ctxEK3(a){ const d=formOf(a,"EK3").data, act=ek3Actual(a); if(!d.rows) return ""; const p=d.rows.reduce((t,r)=>t+(+r.p||0),0), g=act.reduce((t,x)=>t+(+x||0),0); return ctxCard("EK-3 Süre planı",`<p>Planlanan toplam <b class="mono">${p}</b> gün · aşama tarihlerine göre gerçekleşen <b class="mono">${g}</b> gün</p>`,openFormBtn(a,"EK3")); }
function ctxPerf(a){ return ctxCard("Denetçi katkıları (EK-14 için)",`<div class="tw"><table class="t"><tr><th>Denetçi</th><th>Test</th><th>Çalışma kağıdı</th><th>Zamanında</th><th>Bulgu</th><th>Görev puanı</th></tr>${a.ekip.map(u=>{const p=perfOf(a,u); return `<tr><td>${esc(user(u).name)}</td><td class="num">${p.tests}</td><td class="num">${p.cks}</td><td class="num">${p.cks?p.onTime+"/"+p.cks:"—"}</td><td class="num">${p.fs}</td><td class="num">${p.tp?num2(p.tp)+" / 5":"—"}</td></tr>`;}).join("")}</table></div>`); }
function stageContext(a){
 switch(a.stage){
  case 0: case 1: return [ctxTanim(a),ctxPrev(a)];
  case 2: return [ctxEK7(a),ctxRKM(a),ctxEK15(a,[7,8])];
  case 3: return [ctxTests(a,true),ctxRKM(a),ctxEK5(a),ctxEK15(a,[3,7])];
  case 4: return [ctxFindings(a)];
  case 5: return [ctxFindings(a),ctxEK3(a)];
  case 6: return [ctxPerf(a),ctxEK3(a)];
 }
 return [];
}
function formContext(a,key){
 switch(key){
  case "EK1": return [ctxTanim(a),ctxPrev(a)];
  case "EK6": return [ctxTanim(a),ctxEK15(a,[3,7,8]),ctxPrev(a)];
  case "EK7": return [ctxTanim(a),ctxEK15(a,[1,2]),ctxRKM(a)];
  case "EK5": return [ctxEK7(a)];
  case "EK8": return [ctxRKM(a)];
  case "EK11": return [ctxFindings(a),ctxEK5(a)];
  case "EK15": return [ctxPrev(a)];
 }
 return [];
}

function historyHtml(hist,kind,ref){
 if(!hist||!hist.length) return "";
 return `<div class="card" style="margin-top:14px"><div class="card-head"><h2>Sürüm geçmişi</h2><span class="muted small">Gönderilen ve onaylanan sürümler ayrı saklanır</span></div>${hist.map((h,i)=>({h,i})).reverse().map(({h,i})=>`<div class="li"><div class="li-main"><b>${esc(h.tip)}</b> <span class="muted small">· ${esc(user(h.by).name)} · ${esc(fmt(String(h.at).slice(0,10)))} ${esc(String(h.at).slice(11))}</span>${h.changes&&h.changes.length?`<div class="li-sub">Değişen alanlar: ${esc(h.changes.map(c=>c.l).join(", "))}</div>`:""}${h.not?`<div class="li-sub">Not: ${esc(h.not)}</div>`:""}</div>${h.changes&&h.changes.length?`<button class="btn sm" data-act="showDiff" data-kind="${kind}" data-ref="${ref}" data-i="${i}">Gönderilen ile karşılaştır</button>`:""}</div>`).join("")}</div>`;
}
/* ---- Panel ---- */
function approvalItems(){
 const out=[];
 S.audits.forEach(a=>{
  if(a.talep&&a.talep.durum==="bekliyor"&&isMudur()) out.push({t:`${a.no} · Denetim talebi`,s:`${user(a.talep.by).name} oluşturdu · ${a.konu}`,b:`<button class="btn sm pri" data-act="go" data-v="audit" data-id="${a.id}">İncele ve onayla</button>`});
  Object.entries(a.forms).forEach(([k,f])=>{ if(f.status==="onay_bekliyor"&&isMudur()){ const h=(f.history||[]).filter(x=>x.tip==="Onaya gönderildi").pop(); out.push({t:`${a.no} · ${FORMS[k].title}`,s:h?`${user(h.by).name} onayınıza gönderdi · ${fmt(String(h.at).slice(0,10))}`:"Onayınızı bekliyor",b:`<button class="btn sm pri" data-act="go" data-v="form" data-id="${a.id}" data-key="${k}">İncele ve onayla</button>`}); } });
  if(canReview()) a.ek4.filter(w=>!w.onay&&w.hazirlayan!==S.me).forEach(w=>out.push({t:`${a.no} · ${w.ref} çalışma kağıdı`,s:`${user(w.hazirlayan).name} · ${testCode(a,w.testId)} · ${w.sonuc}`,b:`<button class="btn sm" data-act="go" data-v="audit" data-id="${a.id}" data-tab="testler">Aç</button>`}));
  if(a.rapor.status==="onay_bekliyor"&&isMudur()) out.push({t:`${a.no} · Denetim raporu`,s:"Nihai onayınızı bekliyor",b:`<button class="btn sm pri" data-act="go" data-v="audit" data-id="${a.id}" data-tab="rapor">İncele ve onayla</button>`});
  if(a.stage===6&&isMudur()){
   if(!formDone(a,"EK14")) out.push({t:`${a.no} · EK-14 Denetçi Değerlendirme`,s:"Denetim sonu değerlendirmesi bekliyor",b:`<button class="btn sm pri" data-act="go" data-v="form" data-id="${a.id}" data-key="EK14">Doldur</button>`});
   else if(!a.puan) out.push({t:`${a.no} · Denetim puanı`,s:"Denetimin tamamlanması için puanınız gerekli",b:`<button class="btn sm pri" data-act="auditPuan" data-id="${a.id}">Puanla</button>`});
  }
 });
 S.findings.forEach(f=>{
  if(f.status==="onay_bekliyor"&&canApproveB(f)){ const h=(f.history||[]).filter(x=>/gönderildi/.test(x.tip)).pop(); out.push({t:`${fcode(f)} · ${f.konu}`,s:h?`${user(h.by).name} gözden geçirmenize gönderdi`:"Bulgu gözden geçirme bekliyor",b:`<button class="btn sm pri" data-act="go" data-v="bulgu" data-id="${f.id}">İncele ve onayla</button>`}); }
  if(f.status==="dogrulamada"&&canReview()) out.push({t:`${fcode(f)} · ${f.konu}`,s:`${f.birim} · kapanış kanıtı doğrulama bekliyor`,b:`<button class="btn sm" data-act="verify" data-id="${f.id}">İncele</button>`});
  if(f.uzatim&&f.uzatim.durum==="bekliyor"&&isMudur()) out.push({t:`${fcode(f)} · termin uzatımı`,s:`${f.birim} · ${fmt(f.termin)} → ${fmt(f.uzatim.tarih)} · ${f.uzatim.gerekce}`,b:`<button class="btn sm" data-act="uzatim" data-id="${f.id}" data-ok="1">Onayla</button><button class="btn sm ghost" data-act="uzatim" data-id="${f.id}" data-ok="0">Reddet</button>`});
 });
 if(isMudur()) S.tasks.filter(t=>t.durum==="onay_bekliyor"&&!(t.formKey&&t.auditId&&formOf(audit(t.auditId),t.formKey).status==="onay_bekliyor")).forEach(t=>out.push({t:t.baslik,s:`${user(t.sorumlu).name} tamamladı · görev puanı bekleniyor`,b:`<button class="btn sm pri" data-act="taskPuan" data-id="${t.id}">Puanla</button>`}));
 return out;
}
function askItems(){ return S.findings.filter(f=>["aksiyonda","gecikti"].includes(effStatus(f)) && f.termin && daysUntil(f.termin)<=7 && !(f.uzatim&&f.uzatim.durum==="bekliyor")).sort((a,b)=>a.termin.localeCompare(b.termin)); }
/* ---- Grafik yardımcıları (SVG, tema değişkenleriyle renklenir) ---- */
function donutSvg(parts,merkez,alt){
 const tot=parts.reduce((s,p)=>s+p.n,0), R=54, C=2*Math.PI*R, gap=tot>1?2:0; let off=0;
 const segs = tot ? parts.filter(p=>p.n).map(p=>{ const len=p.n/tot*C, d=Math.max(0,len-gap); const s=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="var(${p.c})" stroke-width="18" stroke-dasharray="${d} ${C-d}" stroke-dashoffset="${-off}" data-tip="${esc(p.l)}: ${p.n} (%${Math.round(p.n/tot*100)})" class="seg-hit"></circle>`; off+=len; return s; }).join("") : `<circle r="${R}" cx="70" cy="70" fill="none" stroke="var(--surface-2)" stroke-width="18"></circle>`;
 return `<svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="${esc(parts.map(p=>p.l+" "+p.n).join(", "))}"><g transform="rotate(-90 70 70)">${segs}</g><text x="70" y="68" text-anchor="middle" class="donut-num">${merkez}</text><text x="70" y="88" text-anchor="middle" class="donut-lbl">${esc(alt)}</text></svg>`;
}
function legendHtml(parts,tot){ return `<ul class="legend">${parts.map(p=>`<li data-tip="${esc(p.l)}: ${p.n}"><i style="background:var(${p.c})"></i><span>${esc(p.l)}</span><b class="mono">${p.n}</b>${tot?`<span class="muted small">%${Math.round(p.n/tot*100)}</span>`:""}</li>`).join("")}</ul>`; }
function hbarHtml(rows,max,birim){ max=Math.max(1,max||Math.max(...rows.map(r=>r.n),0));
 return `<div class="hbars">${rows.map(r=>`<div class="hbar" data-tip="${esc(r.l)}: ${r.n}${birim||""}"><span class="hbar-l">${esc(r.l)}</span><span class="hbar-t"><i style="width:${r.n?Math.max(2,r.n/max*100):0}%;background:var(${r.c||"--accent"})"></i></span><span class="hbar-v mono">${r.v!=null?r.v:r.n}</span></div>`).join("")}</div>`; }
function stackHtml(rows){ const max=Math.max(1,...rows.map(r=>r.a+r.b));
 return `<div class="hbars wide-l">${rows.map(r=>`<div class="hbar"><span class="hbar-l" title="${esc(r.l)}">${esc(r.l)}</span><span class="hbar-t stk">${r.a?`<i data-tip="${esc(r.l)} · zamanında: ${r.a}" style="width:${r.a/max*100}%;background:var(--c-open)"></i>`:""}${r.b?`<i data-tip="${esc(r.l)} · geciken: ${r.b}" style="width:${r.b/max*100}%;background:var(--c-crit)"></i>`:""}</span><span class="hbar-v mono">${r.a+r.b}</span></div>`).join("")}</div>`; }
function ringSvg(pct,etiket){ const R=40, C=2*Math.PI*R, d=Math.max(0,Math.min(1,pct))*C;
 return `<svg viewBox="0 0 100 100" width="104" height="104" role="img" aria-label="${esc(etiket)} %${Math.round(pct*100)}"><circle r="${R}" cx="50" cy="50" fill="none" stroke="var(--surface-2)" stroke-width="10"></circle><circle r="${R}" cx="50" cy="50" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${d} ${C-d}" transform="rotate(-90 50 50)"></circle><text x="50" y="56" text-anchor="middle" class="ring-num">%${Math.round(pct*100)}</text></svg>`; }

function renderPanel(){
 const act = S.audits.filter(a=>a.status==="aktif");
 const OPEN = ["paylasildi","uzlasildi","uzlasilmadi","aksiyonda","gecikti","dogrulamada"];
 const open = S.findings.filter(f=>["aksiyonda","gecikti","dogrulamada"].includes(effStatus(f)));
 const late = lateFindings(), ap = canReview()? approvalItems() : [], asks = askItems();
 const tasks = S.tasks.filter(t=>t.sorumlu===S.me&&["acik","devam"].includes(t.durum)).sort((a,b)=>(b.created||"").localeCompare(a.created||""));
 const puanBek = S.tasks.filter(t=>t.durum==="onay_bekliyor");
 const tiles = [
  {k:"aktif",n:act.length,l:"Aktif denetim"},
  isMudur()?{k:"puanbek",n:puanBek.length,l:"Puan bekleyen görev",alert:true}:{k:"gorev",n:tasks.length,l:"Açık görevim"},
  {k:"izleme",n:open.length,l:"İzlemedeki bulgu"},
  {k:"geciken",n:late.length,l:"Geciken bulgu",alert:true},
  canReview()?{k:"onay",n:ap.length,l:"Onayınızı bekleyen",alert:true}:{k:"sorulan",n:asks.length,l:"Durumu sorulan bulgu"}];
 const acik = tiles.some(t=>t.k===S.ui.kpi) ? S.ui.kpi : null;
 const kpis = `<div class="kpis">${tiles.map(t=>`<button class="kpi kpi-btn ${t.alert&&t.n?"alert":""} ${acik===t.k?"on":""}" data-act="kpi" data-k="${t.k}" aria-expanded="${acik===t.k}"><b>${t.n}</b><span>${t.l}</span><i class="kpi-caret" aria-hidden="true"></i></button>`).join("")}</div>`;

 const askCard = f => `<div class="ask ${effStatus(f)==="gecikti"?"overdue":""}">
   <div class="spread"><div><span class="mono small">${esc(fcode(f))}</span> ${onemChip(onemOf(f))}</div><div class="small">Termin ${fmt(f.termin)} · ${dayTxt(f.termin)}</div></div>
   <b>Bu bulgunun durumu ne?</b><div>${esc(f.konu)}</div>
   <div class="li-sub">Eylem: ${esc((f.ek10.eylemler[0]||{}).eylem||"—")} · Birimdeki sorumlu: ${esc((f.ek10.eylemler[0]||{}).sorumlu||"—")}</div>
   <div class="btns"><button class="btn sm pri" data-act="durum" data-id="${f.id}" data-p="tamam">Tamamlandı, kanıt ekle</button><button class="btn sm" data-act="durum" data-id="${f.id}" data-p="devam">Devam ediyor</button><button class="btn sm" data-act="durum" data-id="${f.id}" data-p="uzatim">Uzatım talebi</button><button class="btn sm ghost" data-act="durum" data-id="${f.id}" data-p="bilgi">Birimden bilgi alınamadı</button></div></div>`;
 const detay = {
  aktif:()=>["Aktif denetimler",`<button class="btn sm" data-act="yeni">Yeni denetim</button>`, act.map(a=>`<div class="li" data-act="go" data-v="audit" data-id="${a.id}" style="cursor:pointer"><div class="li-main" style="flex:1"><div class="spread"><b><span class="mono">${a.no}</span> ${esc(a.konu)}</b>${stageChip(a)}</div><div class="progress" style="margin-top:6px"><i style="width:${Math.round(a.stage/7*100)}%"></i></div><div class="li-sub" style="margin-top:4px">${esc(a.birim)} · ${esc(names(a.ekip))} · ${fmt(a.start)} – ${fmt(a.end)}</div></div></div>`).join("")||`<div class="empty">Aktif denetim yok.</div>`],
  gorev:()=>["Açık görevlerim",`<div class="btns"><button class="btn sm" data-act="taskModal">Görev ekle</button><button class="btn sm ghost" data-act="go" data-v="tasks">Tüm görevler</button></div>`, tasks.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.baslik)}</b> ${isNewTask(t)?`<span class="chip c-acc nodot">Yeni</span>`:""}<div class="li-sub">${taskCtx(t)} · Termin ${fmt(t.termin)} · ${dayTxt(t.termin)}</div></div><div class="btns">${chip(T_ST[t.durum])}${taskActions(t)}</div></div>`).join("")||`<div class="empty">Açık göreviniz yok.</div>`],
  puanbek:()=>["Puanınızı bekleyen görevler",`<button class="btn sm ghost" data-act="go" data-v="tasks" data-filter="puan">Görevler</button>`, puanBek.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.baslik)}</b><div class="li-sub">${esc(user(t.sorumlu).name)} · ${taskCtx(t)}${t.bitis?" · tamamlandı "+fmt(t.bitis):""}</div></div><div class="btns">${taskActions(t)}</div></div>`).join("")||`<div class="empty">Puan bekleyen görev yok.</div>`],
  izleme:()=>["İzlemedeki bulgular · birim bazında",`<button class="btn sm ghost" data-act="go" data-v="findings">İzleme ekranı</button>`, open.length?byBirim(open).map(([bi,fs])=>`<div class="section-label" style="margin-top:8px">${esc(bi)} · ${fs.length}</div>${fs.map(f=>`<div class="li" data-act="go" data-v="bulgu" data-id="${f.id}" data-tab="takip" style="cursor:pointer"><div class="li-main"><span class="mono small">${esc(fcode(f))}</span> ${esc(f.konu)}<div class="li-sub">Termin ${fmt(f.termin)} · ${dayTxt(f.termin)}</div></div><div class="btns">${onemChip(onemOf(f))}${fChip(f)}</div></div>`).join("")}`).join(""):`<div class="empty">İzlemede bulgu yok.</div>`],
  geciken:()=>["Geciken bulgular · birim bazında",`<button class="btn sm ghost" data-act="go" data-v="findings" data-filter="gecikti">İzleme ekranı</button>`, late.length?byBirim(late).map(([bi,fs])=>`<div class="li"><div class="li-main"><b>${esc(bi)}</b><div class="li-sub">${fs.map(f=>`${esc(fcode(f))} ${esc(f.konu)} (${-daysUntil(f.termin)} gün)`).join(" · ")}</div></div><span class="chip c-crit">${fs.length} geciken</span></div>`).join(""):`<div class="empty">Geciken bulgu yok.</div>`],
  sorulan:()=>["Durumu sorulan bulgular",`<span class="muted small">Birim bazında · termine 7 gün kala ve gecikmede</span>`, asks.length?`<div class="stack">${byBirim(asks).map(([bi,fs])=>`<div class="section-label">${esc(bi)} · ${fs.length} bulgu</div>${fs.map(askCard).join("")}`).join("")}</div>`:`<div class="empty">Termini yaklaşan veya geçen bulgu yok.</div>`],
  onay:()=>["Onayınızı bekleyenler",`<span class="muted small">${ap.length} iş</span>`, ap.length?ap.map(i=>`<div class="li"><div class="li-main"><b>${esc(i.t)}</b><div class="li-sub">${esc(i.s)}</div></div><div class="btns">${i.b}</div></div>`).join(""):`<div class="empty">Onayınızı bekleyen iş yok.</div>`]
 };
 const det = acik ? (()=>{ const [t,sag,body]=detay[acik](); return `<div class="card kpi-detail" id="kpi-detay"><div class="card-head"><h2>${t}</h2><div class="btns">${sag}<button class="btn sm ghost" data-act="kpi" data-k="${acik}" aria-label="Kapat">Kapat</button></div></div>${body}</div>`; })() : "";

 /* Görseller */
 const kap=S.findings.filter(f=>f.status==="kapandi").length, dog=S.findings.filter(f=>f.status==="dogrulamada").length, gec=late.length;
 const acikF=S.findings.filter(f=>OPEN.includes(effStatus(f))&&!["gecikti","dogrulamada"].includes(effStatus(f))).length;
 const raporlanmadi=S.findings.length-kap-dog-gec-acikF, totF=S.findings.length;
 const parts=[{l:"Çözüldü",n:kap,c:"--c-good"},{l:"Açık (aksiyonda)",n:acikF,c:"--c-open"},{l:"Doğrulamada",n:dog,c:"--c-warn"},{l:"Geciken",n:gec,c:"--c-crit"},{l:"Henüz raporlanmadı",n:raporlanmadi,c:"--c-na"}];
 const bulguCard = `<div class="card viz"><div class="card-head"><h2>Bulgu durumu</h2><span class="muted small">Tüm denetimler</span></div><div class="donut-wrap">${donutSvg(parts,String(totF),"toplam bulgu")}<div>${legendHtml(parts,totF)}<p class="small" style="margin:8px 0 0"><b>%${totF?Math.round(kap/totF*100):0}</b> çözüldü (${kap} / ${totF})</p></div></div></div>`;

 let puanCard;
 if(isMudur()){
  const ekip=S.users.filter(u=>u.role!=="mudur").map(u=>{ const ts=S.tasks.filter(t=>t.sorumlu===u.id&&t.puan); return {l:u.name,n:ts.length?ts.reduce((s,t)=>s+t.puan,0)/ts.length:0,k:ts.length}; });
  const tum=S.tasks.filter(t=>t.puan), ort=tum.length?tum.reduce((s,t)=>s+t.puan,0)/tum.length:0;
  puanCard = `<div class="card viz"><div class="card-head"><h2>Ekibin görev puanları</h2><span class="muted small">Verdiğiniz puanlar</span></div><div class="hero"><b class="mono">${num2(ort)}</b><span>/ 5 ekip ortalaması · ${tum.length} puanlı görev</span></div>${hbarHtml(ekip.map(e=>({l:e.l,n:e.n,v:e.k?num2(e.n):"—"})),5," / 5")}</div>`;
 } else {
  const ts=S.tasks.filter(t=>t.sorumlu===S.me&&t.puan), ort=ts.length?ts.reduce((s,t)=>s+t.puan,0)/ts.length:0;
  const dag=[5,4,3,2,1].map(p=>({l:p+" puan",n:ts.filter(t=>t.puan===p).length}));
  const e14=[]; S.audits.forEach(a=>{ const d=(a.forms.EK14||{}).data||{}; if(d[S.me]&&d[S.me].c) d[S.me].c.forEach(v=>v!=null&&e14.push(4-v)); });
  puanCard = `<div class="card viz"><div class="card-head"><h2>Müdürden aldığım puan</h2><span class="muted small">Görev puanları</span></div><div class="hero"><b class="mono">${ts.length?num2(ort):"—"}</b><span>/ 5 ortalama · ${ts.length} puanlı görev${e14.length?` · EK-14 ort. ${num2(e14.reduce((a,b)=>a+b,0)/e14.length)} / 4`:""}</span></div>${hbarHtml(dag,0," görev")}</div>`;
 }
 const onemRows=["Çok Yüksek","Yüksek","Orta","Düşük"].map(o=>({l:o,n:open.filter(f=>onemOf(f)===o).length}));
 const onemCard = `<div class="card viz"><div class="card-head"><h2>İzlemedeki bulgular · önem düzeyi</h2><span class="muted small">${open.length} bulgu</span></div>${hbarHtml(onemRows,0," bulgu")}<p class="small muted" style="margin:10px 0 0">Varsayılan takip süresi: Çok Yüksek 30, Yüksek 45, Orta 60, Düşük 90 gün.</p></div>`;
 const surecCard = `<div class="card viz"><div class="card-head"><h2>Denetimlerin ilerlemesi</h2><button class="btn sm" data-act="yeni">Yeni denetim</button></div>${act.length?`<div class="hbars wide-l">${act.map(a=>`<div class="hbar click" data-act="go" data-v="audit" data-id="${a.id}" data-tip="${esc(a.konu)} · ${esc(STAGES[a.stage])}"><span class="hbar-l"><span class="mono">${a.no}</span> ${esc(a.surec)}</span><span class="hbar-t"><i style="width:${Math.max(3,Math.round(a.stage/7*100))}%;background:var(--accent)"></i></span><span class="hbar-v small">${a.stage}/7</span></div>`).join("")}</div>`:`<div class="empty">Aktif denetim yok.</div>`}</div>`;
 const birimRows=byBirim(open).slice(0,6).map(([bi,fs])=>({l:bi,a:fs.filter(f=>effStatus(f)!=="gecikti").length,b:fs.filter(f=>effStatus(f)==="gecikti").length}));
 const birimCard = `<div class="card viz"><div class="card-head"><h2>Birim bazında açık bulgular</h2></div>${birimRows.length?stackHtml(birimRows)+`<ul class="legend inline"><li><i style="background:var(--c-open)"></i><span>Zamanında</span></li><li><i style="background:var(--c-crit)"></i><span>Geciken</span></li></ul>`:`<div class="empty">Açık bulgu yok.</div>`}</div>`;
 const benim=S.tasks.filter(t=>isMudur()?true:t.sorumlu===S.me), bitmis=benim.filter(t=>t.durum==="kapandi"&&t.bitis), zam=bitmis.filter(t=>t.bitis<=t.termin).length;
 const hafta=benim.filter(t=>["acik","devam"].includes(t.durum)&&daysUntil(t.termin)!=null&&daysUntil(t.termin)<=7).length;
 const gorevCard = `<div class="card viz"><div class="card-head"><h2>${isMudur()?"Ekibin görev performansı":"Görev performansım"}</h2></div><div class="donut-wrap">${ringSvg(bitmis.length?zam/bitmis.length:0,"Zamanında tamamlama")}<div class="stack" style="gap:8px"><div><b class="mono">${zam} / ${bitmis.length}</b><div class="small muted">zamanında tamamlanan görev</div></div><div><b class="mono">${hafta}</b><div class="small muted">7 gün içinde termini olan açık görev</div></div><div><b class="mono">${benim.filter(t=>t.durum==="onay_bekliyor").length}</b><div class="small muted">puan bekleyen</div></div></div></div></div>`;
 const doneA = S.audits.filter(a=>a.status==="tamamlandi").sort((x,y)=>(y.bitis||y.rapor.tarih||"").localeCompare(x.bitis||x.rapor.tarih||"")).slice(0,3);
 return topbar(`Merhaba, ${esc(me().name.split(" ")[0])}`) + kpis + det +
  `<section class="viz-group" aria-labelledby="vg-kisi"><div class="viz-head"><h2 id="vg-kisi">${isMudur()?"Ekip göstergeleri":"Kişisel göstergelerim"}</h2><span>${isMudur()?"Ekibe verdiğiniz puanlar ve ekibin görev performansı":"Müdürden aldığınız puanlar ve görev performansınız"}</span></div><div class="viz-grid two">${puanCard}${gorevCard}</div></section>
  <section class="viz-group" aria-labelledby="vg-den"><div class="viz-head"><h2 id="vg-den">Denetim göstergeleri</h2><span>Tüm denetimlerin bulgu, ilerleme ve birim durumu</span></div><div class="viz-grid two">${bulguCard}${onemCard}${surecCard}${birimCard}</div></section>
  <div class="card"><div class="card-head"><h2>Son tamamlanan denetimler</h2></div>${doneA.map(a=>`<div class="li" data-act="go" data-v="audit" data-id="${a.id}" style="cursor:pointer"><div class="li-main"><b><span class="mono">${a.no}</span> ${esc(a.surec)}</b><div class="li-sub">${a.puan?`Müdür puanı ${a.puan.deger}/5 · `:""}${findingsOf(a.id).filter(f=>f.status!=="kapandi").length} bulgu izlemede</div></div><span class="chip c-ok">Tamamlandı</span></div>`).join("")||`<div class="empty">Henüz tamamlanan denetim yok.</div>`}</div>`;
}
/* ---- Denetimler ---- */
function renderAudits(){
 const rows = S.audits.slice().sort((a,b)=>b.no.localeCompare(a.no)).map(a=>{ const open=findingsOf(a.id).filter(f=>f.status!=="kapandi").length;
  return `<tr class="click" data-act="go" data-v="audit" data-id="${a.id}"><td class="num">${a.no}</td><td><b>${esc(a.konu)}</b><div class="li-sub">${esc(a.birim)}</div></td><td>${stageChip(a)}</td><td>${esc(names(a.ekip))}</td><td class="num">${fmt(a.start)} – ${fmt(a.end)}</td><td class="num">${open}${a.status==="tamamlandi"&&open?` <span class="muted small">izlemede</span>`:""}</td></tr>`;}).join("");
 return topbar("Denetimler",null,`${isMudur()?`<button class="btn" data-act="go" data-v="plan">Plandan denetim aç</button>`:""}<button class="btn pri" data-act="yeni">Yeni denetim</button>`) +
  `<div class="tw"><table class="t"><tr><th>No</th><th>Denetim</th><th>Aşama</th><th>Ekip</th><th>Tarihler</th><th>Açık bulgu</th></tr>${rows}</table></div>`;
}
function stepper(a){ return `<div class="stepper">${STAGES.map((s,i)=>`<div class="step ${i<a.stage||a.status==="tamamlandi"?"done":i===a.stage?"cur":""}"><b>${i<7?i:"✓"}</b><span>${s}</span></div>`).join("")}</div>`; }
function ek2(a){
 const fs=findingsOf(a.id), g=!!a.gecmisIncelendi, d=k=>formDone(a,k), st=a.stage;
 return [["Denetim görevlendirmesi yapıldı",true],["Denetim bildirimi hazırlandı ve gönderildi (EK-1)",d("EK1")],["Denetimin amaçları belirlendi (EK-7)",d("EK7")],["Denetlenen hakkında genel bilgi edinildi (EK-15)",d("EK15")],["Denetlenenin hedefleri ve faaliyetleri hakkında bilgi edinildi (EK-15)",d("EK15")],["Önceki denetim raporu ve çalışma kağıtları gözden geçirildi",g],["Önceki bulgular ve düzeltici faaliyetler gözden geçirildi",g],["Önceki Denetçi Değerlendirme Formu incelendi",g],["Açılış toplantısı yapıldı (EK-5)",d("EK5")],["Prosedürler öğrenildi, uygulamalar belgelendi",d("EK15")&&st>=2],["Faaliyetler gözlemlendi ve belgelendi (EK-4)",a.ek4.length>0||st>=5],["Faaliyetler ve kontrol sistemi gözden geçirildi (EK-6)",d("EK6")],["Risk alanları belirlendi (EK-6)",d("EK6")],["Amaçlar gözden geçirildi, kapsam belirlendi",d("EK7")&&st>=2],["Bireysel Çalışma Programı hazırlandı (EK-8)",formOf(a,"EK8").status!=="bos"],["Bireysel Çalışma Programı onaylandı",d("EK8")],["Gerekiyorsa süre revizyonu yapıldı (EK-3)",d("EK3")],["Testler yapıldı, belgelendi ve analiz edildi (EK-4)",st>=4||(testRows(a).length>0&&testRows(a).every(t=>ckOfTest(a,t.id)))],["Bulgular belgelendi, gözden geçirildi ve birime gönderildi (EK-9, EK-10)",st>=4],["Kapanış toplantısı yapıldı (EK-11)",d("EK11")],["Taslak rapor hazırlandı",st>=5&&a.rapor.status!=="yok"],["Birim cevapları alındı ve değerlendirildi",st>=4&&fs.every(f=>f.ek10.islendi)],["Nihai rapor hazırlandı",a.rapor.status==="nihai"]];
}
function renderAudit(){
 const a=audit(S.ui.id); if(!a) return renderAudits();
 const tab=S.ui.tab||"akis", fs=findingsOf(a.id), p=planRow(a.planId)||a.makro;
 const e2=ek2(a), pct=Math.round(e2.filter(x=>x[1]).length/e2.length*100);
 const canStart = a.stage===0 && (isMudur()||a.ekip.includes(S.me)) && !(a.talep&&a.talep.durum!=="onaylandi");
 const head = `<div class="card" style="margin-bottom:14px"><div class="spread"><div><div class="row"><span class="mono">${a.no}</span><span class="chip ${a.tur==="C"?"c-info":"c-acc"} nodot">${a.tur==="C"?"Danışmanlık":"Güvence"}</span>${a.denetimTuru&&a.denetimTuru!=="danismanlik"?`<span class="chip nodot">${esc(dtur(a.denetimTuru).ad)}</span>`:""}${a.gizli?`<span class="chip c-crit nodot">Gizli</span>`:""}${a.planDisi?`<span class="chip c-warn nodot">Plan dışı</span>`:""}${p?`<span class="chip ${onemCls(p.duzey)}">Makro risk ${num2(p.puan)} · ${p.duzey}</span>`:""}${stageChip(a)}</div>
   <div class="li-sub" style="margin-top:4px">${esc(a.birim)} · Ekip: ${esc(names(a.ekip))} (sorumlu ${esc(user(a.sorumlu).name)}) · ${fmt(a.start)} – ${fmt(a.end)}</div></div>
   <div class="btns"><button class="btn" data-act="tab" data-tab="kanit">Kanıtlar (${kanitlar(a).length})</button>${canStart?`<button class="btn pri" data-act="startModal" data-id="${a.id}">Denetime Başla</button>`:`<div style="min-width:180px"><div class="small muted">EK-2 kontrol listesi · %${pct}</div><div class="progress"><i style="width:${pct}%"></i></div></div>`}</div></div></div>`;
 const tabs=[["akis","Akış"],["formlar","Formlar"],["testler",`Testler ve çalışma kağıtları (${a.ek4.length}/${testRows(a).length})`],["bulgular",`Bulgular (${fs.length})`],["kanit",`Kanıtlar (${kanitlar(a).length})`],["iz","Risk → rapor izi"],["rapor","Rapor"],["ek2","EK-2 Kontrol listesi"]];
 let body="";
 if(tab==="akis") body=renderFlow(a);
 if(tab==="formlar") body=renderFormsTab(a);
 if(tab==="testler") body=renderTests(a);
 if(tab==="bulgular") body=renderFindingsTab(a);
 if(tab==="iz") body=renderTrace(a);
 if(tab==="rapor") body=renderRapor(a);
 if(tab==="kanit") body=renderKanit(a);
 if(tab==="ek2") body=`<div class="card">${e2.map((x,i)=>`<div class="req"><span class="tick ${x[1]?"on":""}">${x[1]?"✓":""}</span><div class="li-main"><span class="mono small muted">${i+1}.</span> ${esc(x[0])}</div></div>`).join("")}<p class="muted small" style="margin:10px 0 0">Adımlar ilgili formlar tamamlandıkça sistem tarafından işaretlenir.</p></div>`;
 return topbar(esc(a.konu),backTo("audits","Denetimler")) + talepNotice(a) + head + stepper(a) +
  `<div class="tabs" role="tablist">${tabs.map(t=>`<button class="${tab===t[0]?"on":""}" data-act="tab" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>` + body;
}
function renderDone(a){
 const fs=findingsOf(a.id), open=fs.filter(f=>f.status!=="kapandi"), ts=testSummary(a);
 const gun = daysBetween(a.stageDates[1]||a.start, a.bitis||a.rapor.tarih||a.end);
 const st=(n,l)=>`<div><b class="mono">${n}</b><span>${l}</span></div>`;
 return `<div class="done-banner"><div class="done-mark" aria-hidden="true">✓</div><div class="stack" style="gap:6px"><h2>Denetim tamamlandı</h2><p>${esc(a.no)} ${esc(a.konu)} ${fmt(a.bitis||a.rapor.tarih)} tarihinde tamamlandı. Emeği geçen ekibe teşekkürler: ${esc(names(a.ekip))}.</p>
  <div class="done-stats">${st(gun,"gün sürdü")}${st(ts.t,"test ve çalışma kağıdı")}${st(fs.length,"bulgu")}${st(a.puan?a.puan.deger+"/5":"—","müdür puanı")}</div>
  ${a.puan&&a.puan.yorum?`<p class="small">Müdür notu: ${esc(a.puan.yorum)}</p>`:""}</div></div>
  <div class="card" style="margin-top:14px"><div class="card-head"><h2>İzlemeye alınan bulgular</h2><button class="btn sm" data-act="go" data-v="findings">İzleme ekranı</button></div>${open.length?open.map(f=>`<div class="li"><div class="li-main"><span class="mono small">B${f.no}</span> ${esc(f.konu)}<div class="li-sub">${esc(f.birim)} · termin ${fmt(f.termin)}</div></div>${fChip(f)}</div>`).join(""):`<div class="empty">Tüm bulgular kapandı.</div>`}</div>`;
}
function renderFlow(a){
 if(a.status==="tamamlandi") return renderDone(a);
 const rs=reqs(a), ok=stageOk(a);
 const actBtn = r => { if(!r.act) return ""; const k=r.act.kind;
  if(k==="form") return `<button class="btn sm" data-act="go" data-v="form" data-id="${a.id}" data-key="${r.act.key}">${r.ok?"Görüntüle":"Aç"}</button>`;
  if(k==="tab") return `<button class="btn sm" data-act="tab" data-tab="${r.act.tab}">Aç</button>`;
  if(k==="start") return a.stage===0&&!(a.talep&&a.talep.durum!=="onaylandi") ? `<button class="btn sm pri" data-act="startModal" data-id="${a.id}">Denetime Başla</button>` : "";
  if(k==="auditpuan") return isMudur()&&!r.ok&&formDone(a,"EK14") ? `<button class="btn sm pri" data-act="auditPuan" data-id="${a.id}">Puanla</button>` : "";
  return ""; };
 const next = a.stage===0 ? "" : a.stage===6 ? `<p class="muted small" style="margin:10px 0 0">EK-14 ve müdür puanı tamamlanınca denetim "Tamamlandı" olur; açık bulgular İzleme'ye geçer.</p>` : `<div class="spread" style="margin-top:12px"><span class="small muted">${ok?"Aşamanın zorunlu adımları tamam.":"Zorunlu adımlar tamamlanmadan sonraki aşama açılmaz."}</span><button class="btn pri" data-act="advance" data-id="${a.id}" ${ok?"":"disabled"}>Sonraki aşama: ${STAGES[a.stage+1]}</button></div>`;
 const tasks = S.tasks.filter(t=>t.auditId===a.id&&t.durum!=="kapandi");
 const intro = {0:"Denetim kaydı oluşturuldu. Denetime Başla, önceki raporları ve açık bulguları gösterir, ardından hazırlık eklerini görev olarak atar.",1:"Hazırlık: süreci tanı (EK-15), riskleri ve kontrolleri çıkar (EK-6), programı yaz (EK-7). RKM'deki test prosedürleri sonraki adımlarda testlere dönüşür.",2:"Açılış toplantısı ve bireysel çalışma programı. EK-8 satırları RKM'den gelir; her test bir denetçiye atanır.",3:"Saha: EK-8'deki her test için bir çalışma kağıdı yazılır. Etkin olmayan kontroller bulguya dönüşür.",4:"Her bulgu için EK-10 çıktısı alınır, birime sistem dışında iletilir; birimin yanıtı buraya işlenir.",5:"Kapanış toplantısı ve rapor. Raporun D bölümü bulgulardan, B ve C bölümleri EK-7'den gelir.",6:"Denetim sonu: EK-14 ve müdür puanı. Bu aşamaya geçildiğinde müdüre otomatik bildirim gider."}[a.stage];
 const ctx = stageContext(a).filter(Boolean).join("");
 return `<div class="cols"><div class="stack"><div class="card"><div class="card-head"><h2>Aşama ${a.stage} · ${STAGES[a.stage]}</h2></div><p class="muted" style="margin:0 0 8px">${intro}</p>
  ${rs.map(r=>`<div class="req"><span class="tick ${r.ok?"on":""}">${r.ok?"✓":""}</span><div class="li-main"><div>${esc(r.l)}</div>${r.st&&!r.ok?`<div class="li-sub">${FORM_ST[r.st][0]}</div>`:""}</div>${actBtn(r)}</div>`).join("")}${next}</div>
  <div class="card"><div class="card-head"><h2>Bu denetimin açık görevleri</h2></div>${tasks.length?tasks.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.baslik)}</b><div class="li-sub">${esc(user(t.sorumlu).name)} · ${fmt(t.termin)} · ${dayTxt(t.termin)}</div></div>${chip(T_ST[t.durum])}</div>`).join(""):`<div class="empty">Açık görev yok.</div>`}</div></div>
  <div class="stack">${ctx?`<div class="section-label">Önceki adımlardan, bu aşamada işinize yarayacaklar</div>${ctx}`:""}</div></div>`;
}
function renderFormsTab(a){
 const keys=["EK1","EK3","EK15","EK6","EK7","EK5","EK8","PERS","EK11","EK13","EK14"];
 return `<div class="tw"><table class="t"><tr><th>Form</th><th>Aşama</th><th>Durum</th><th></th></tr>${keys.map(k=>{const d=FORMS[k]; if(d.faz2) return `<tr><td>${esc(d.title)}</td><td>${d.stage}. ${STAGES[d.stage]}</td><td><span class="chip nodot">Faz 2</span></td><td></td></tr>`;
  const f=formOf(a,k), open=a.stage>=d.stage; return `<tr><td><b>${esc(d.title)}</b>${d.note?`<div class="li-sub">${esc(d.note)}</div>`:""}</td><td>${d.stage}. ${STAGES[d.stage]}</td><td>${chip(FORM_ST[f.status])}</td><td><div class="btns">${open?`<button class="btn sm" data-act="go" data-v="form" data-id="${a.id}" data-key="${k}">Aç</button>`:`<span class="muted small">Aşama ${d.stage}'de açılır</span>`}${f.status!=="bos"?`<button class="btn sm ghost" data-act="exportForm" data-id="${a.id}" data-key="${k}" data-kind="docx">Word</button><button class="btn sm ghost" data-act="exportForm" data-id="${a.id}" data-key="${k}" data-kind="pdf">PDF</button>`:""}</div></td></tr>`;}).join("")}
  <tr><td><b>EK-4 Çalışma Kağıdı</b><div class="li-sub">Her test için ayrı kayıt</div></td><td>3. Saha</td><td>${a.ek4.length} kayıt</td><td><button class="btn sm" data-act="tab" data-tab="testler">Testler</button></td></tr>
  <tr><td><b>EK-9 Bulgu Formu · EK-10 Bulgu Paylaşım Formu</b><div class="li-sub">Çalışma kağıdından açılır</div></td><td>3–4</td><td>${findingsOf(a.id).length} bulgu</td><td><button class="btn sm" data-act="tab" data-tab="bulgular">Bulgular</button></td></tr>
  <tr><td><b>EK-2 Denetim Kontrol Listesi</b><div class="li-sub">Ayrı form değil; otomatik işaretlenir</div></td><td>1–5</td><td>—</td><td><button class="btn sm" data-act="tab" data-tab="ek2">Kontrol listesi</button></td></tr>
 </table></div>`;
}
function renderTests(a){
 const ts=testRows(a);
 if(!ts.length) return `<div class="card empty">Henüz test yok. Testler EK-6 Risk Kontrol Matrisi'ndeki test prosedürlerinden EK-8 Bireysel Çalışma Programı'na aktarılır.</div>`;
 const canWrite = a.stage===3;
 const row = t => { const w=ckOfTest(a,t.id), r=rkmById(a,t.rkm)||{}, fs=findingsOfTest(a,t.id), mine=t.denetci===S.me||canReview();
  let bulgu="—";
  if(fs.length) bulgu=fs.map(f=>`<button class="btn sm ghost" data-act="go" data-v="bulgu" data-id="${f.id}">B${f.no} ${onemChip(onemOf(f))}</button>`).join("");
  else if(w&&w.sonuc!=="Etkin") bulgu = w.bulguGerekmez ? `<span class="small muted">Bulgu açılmadı: ${esc(w.bulguGerekmez)}</span>` : (canWrite&&mine?`<div class="btns"><button class="btn sm pri" data-act="bulguFromCK" data-id="${a.id}" data-w="${w.id}">Bulgu aç</button><button class="btn sm ghost" data-act="noBulgu" data-id="${a.id}" data-w="${w.id}">Bulgu gerekmez</button></div>`:`<span class="chip c-warn">Bulgu bekleniyor</span>`);
  else if(w) bulgu=`<span class="small muted">Kontrol etkin</span>`;
  return `<tr><td class="num">${testCode(a,t.id)}</td><td><span class="mono small">${rkmCode(a,t.rkm)}</span> ${esc(r.risk||"")}<div class="li-sub">Kontrol: ${esc(r.kontrol||"")}</div></td><td>${esc(t.test)}<div class="li-sub">${esc(user(t.denetci).name)} · ${fmt(t.bas)} – ${fmt(t.bit)}</div></td>
   <td>${w?`<button class="btn sm ghost" data-act="peekCK" data-id="${a.id}" data-w="${w.id}"><span class="mono">${esc(w.ref)}</span></button>${w.onay?"":canReview()?`<button class="btn sm" data-act="ckOnay" data-id="${a.id}" data-w="${w.id}">Gözden geçir</button>`:`<div><span class="chip c-info">Gözden geçirme bekliyor</span></div>`}`:(canWrite&&mine?`<button class="btn sm pri" data-act="ckModal" data-id="${a.id}" data-t="${t.id}">Çalışma kağıdı yaz</button>`:`<span class="chip">Yazılmadı</span>`)}</td>
   <td>${w?sonucChip(w.sonuc):"—"}</td><td>${bulgu}</td></tr>`; };
 return `<p class="muted" style="margin-top:0">Zincir: EK-6 risk ve kontrol → EK-8 test → EK-4 çalışma kağıdı → sonuç etkin değilse EK-9 bulgu → rapor. Çalışma kağıdı sonucu RKM'deki "Test sonucu" sütununa kendiliğinden işlenir.</p>
  <div class="tw"><table class="t"><tr><th>Test</th><th>Risk ve kontrol (EK-6)</th><th>Test (EK-8)</th><th>Çalışma kağıdı (EK-4)</th><th>Sonuç</th><th>Bulgu (EK-9)</th></tr>${ts.map(row).join("")}</table></div>`;
}
function renderTrace(a){
 const rs=rkmRows(a);
 if(!rs.length) return `<div class="card empty">Risk Kontrol Matrisi doldurulunca risklerden rapora kadar iz burada görünür.</div>`;
 const rows=[];
 rs.forEach((r,i)=>{ const ts=testRows(a).filter(t=>t.rkm===r.id); if(!ts.length) ts.push(null);
  ts.forEach((t,j)=>{ const w=t&&ckOfTest(a,t.id), fs=t?findingsOfTest(a,t.id):[];
   rows.push(`<tr>${j===0?`<td rowspan="${ts.length}" class="num">R-${pad2(i+1)}</td><td rowspan="${ts.length}">${esc(r.risk)}<div class="li-sub">Seviye ${r.etki&&r.olas?r.etki*r.olas:"—"} · ${esc(r.kontrol)}</div></td>`:""}
    <td>${t?`<span class="mono">${testCode(a,t.id)}</span> ${esc(user(t.denetci).name)}`:`<span class="chip c-warn">Test planlanmadı</span>`}</td><td>${w?`<span class="mono">${esc(w.ref)}</span>`:"—"}</td><td>${w?sonucChip(w.sonuc):"—"}</td>
    <td>${fs.length?fs.map(f=>`<button class="btn sm ghost" data-act="go" data-v="bulgu" data-id="${f.id}">B${f.no} ${onemChip(onemOf(f))}</button>`).join(""):(w&&w.bulguGerekmez?`<span class="small muted">Gerekmedi</span>`:"—")}</td>
    <td>${fs.map(f=>reportIndex(f)?`<span class="mono">D.${reportIndex(f)}</span>`:`<span class="muted small">onay bekliyor</span>`).join(" ")||"—"}</td></tr>`); }); });
 return `<p class="muted" style="margin-top:0">Her risk için hangi testin yapıldığı, hangi çalışma kağıdına dayandığı ve raporda hangi bulguya dönüştüğü.</p><div class="tw"><table class="t"><tr><th>RKM</th><th>Risk ve kontrol</th><th>Test</th><th>Çalışma kağıdı</th><th>Sonuç</th><th>Bulgu</th><th>Rapor</th></tr>${rows.join("")}</table></div>`;
}
function renderFindingsTab(a){
 const fs=findingsOf(a.id);
 return `<div class="spread" style="margin-bottom:12px"><p class="muted" style="margin:0">Bulgular çalışma kağıtlarından açılır ve raporun D bölümüne otomatik aktarılır. Puanlama alanları yalnızca sistemde görünür.</p>${a.stage===3?`<button class="btn pri" data-act="bulguPick" data-id="${a.id}">Bulgu ekle</button>`:""}</div>
 ${fs.length?`<div class="tw"><table class="t"><tr><th>No</th><th>Bulgu</th><th>Dayanak</th><th>Önem</th><th>Puan</th><th>Durum</th><th>EK-10 yanıtı</th></tr>${fs.map(f=>`<tr class="click" data-act="go" data-v="bulgu" data-id="${f.id}"><td class="num">B${f.no}</td><td><b>${esc(f.konu)}</b><div class="li-sub">${esc(f.kategori==="Diğer"?"Diğer: "+f.kategoriAciklama:f.kategori)}</div>${repeats(f).length?`<div><span class="chip c-warn">Tekrarlayan</span></div>`:""}</td><td class="small"><span class="mono">${f.rkmId?rkmCode(a,f.rkmId):"—"} → ${f.testId?testCode(a,f.testId):"—"} → ${esc(f.calismaRef||"—")}</span></td><td>${onemChip(onemOf(f))}</td><td class="num">${num2(bulguPuan(f.scores))}</td><td>${fChip(f)}</td><td>${f.ek10.islendi?chip(["İşlendi","c-ok"]):a.stage>=4?chip(["Bekliyor","c-warn"]):"—"}</td></tr>`).join("")}</table></div>`:`<div class="card empty">Bu denetimde henüz bulgu yok.</div>`}`;
}
function renderRapor(a){
 const r=a.rapor, locked=r.status==="nihai", waiting=r.status==="onay_bekliyor";
 const editable=!locked && a.stage>=3 && (a.ekip.includes(S.me)||canReview()) && !(waiting&&!isMudur());
 const st = {yok:["Taslak (henüz başlanmadı)",""],taslak:["Taslak","c-info"],onay_bekliyor:["Müdür onayı bekliyor","c-warn"],nihai:["Nihai · kilitli","c-ok"]}[r.status];
 const ta=(k,l,v)=>`<label class="field"><span>${l}</span><textarea class="input" id="r-${k}" data-rf="${k}" ${editable?"":"readonly"}>${esc(v||"")}</textarea></label>`;
 let main="";
 if(editable) main+=`<button class="btn" data-act="raporSave" data-id="${a.id}">Kaydet</button>`;
 if(editable&&!waiting&&a.stage>=5) main+= isMudur()?`<button class="btn pri" data-act="raporApprove" data-id="${a.id}">Onayla ve kilitle</button>`:`<button class="btn pri" data-act="raporSend" data-id="${a.id}">Müdür onayına gönder</button>`;
 if(isMudur()&&waiting) main+=`<button class="btn pri" data-act="raporApprove" data-id="${a.id}">Onayla ve kilitle</button><button class="btn" data-act="raporBack" data-id="${a.id}">Düzeltme için geri gönder</button>`;
 const btns = main+`<button class="btn ghost" data-act="exportRapor" data-id="${a.id}" data-kind="docx">Word</button><button class="btn ghost" data-act="exportRapor" data-id="${a.id}" data-kind="pdf">PDF</button>`;
 return `<div class="spread" style="margin-bottom:12px"><div class="row">${chip(st)}<span class="muted small">Rapor No <span class="mono">${a.no}</span>${locked?" · "+fmt(r.tarih):""}</span></div><div class="btns">${btns}</div></div>
 ${waiting&&isMudur()?`<div class="notice warn" style="margin-bottom:12px"><div><b>Rapor onayınızı bekliyor.</b> Gerekirse metni değiştirip onaylayabilirsiniz; gönderilen ve onaylanan sürüm ayrı saklanır, değişiklikler kayda alınır.</div></div>`:""}
 <div class="cols"><div class="stack">
  <div class="card stack"><div class="card-head" style="margin:0"><h2>Yönetici özeti</h2>${editable?`<button class="btn sm" data-act="raporDraft" data-id="${a.id}">Taslağı bulgulardan oluştur</button>`:""}</div>
   ${ta("riskler","Tespit edilen riskler arasında;",r.ozet.riskler)}${ta("etkiler","Bu risklerin etkileri;",r.ozet.etkiler)}${ta("cozumler","Bu bulgular ışığında önerilen başlıca çözümler;",r.ozet.cozumler)}</div>
  <div class="card stack">${ta("giris","A. Giriş",r.giris||defaultGiris(a))}
   <div class="notice info">Raporun kaynakları: B ← EK-7 amaç ve kapsam · C ← EK-7 yöntem + test özeti (EK-6/EK-4) · D ← onaylı bulgular (Bulgu ← mevcut durum, Risk Tanımı ← riskler ve etkileri, Öneri ← öneri) · E ← bulgu özet tablosu ve birim görüşleri (EK-10).</div>
   <label class="field"><span>D bölümü sıralaması</span><select class="input" id="r-sira" data-rf="sira" ${editable?"":"disabled"}><option value="puan" ${r.sira!=="no"?"selected":""}>Bulgu puanına göre (yüksekten düşüğe)</option><option value="no" ${r.sira==="no"?"selected":""}>Bulgu numarasına göre</option></select></label>
   ${ta("sonuc","E. Sonuç",r.sonuc)}</div>${historyHtml(r.history,"r",a.id)}</div>
  <div class="paper-wrap" style="align-items:flex-start"><div class="docroot">${blocksToHtml(raporBlocks(a),{wm:true})}</div></div></div>`;
}
/* ---- Form düzenleyici ---- */
function ensureDraft(a,key){
 if(DRAFT && DRAFT.aid===a.id && DRAFT.key===key) return DRAFT;
 const f=formOf(a,key), d=JSON.parse(JSON.stringify(f.data||{}));
 if(key==="EK1"){ d.baslangic=d.baslangic||a.start; d.ykOnay=d.ykOnay||"2025-01-15"; }
 if(key==="EK3"){ d.rows=d.rows&&d.rows.length?d.rows:EK3_ROWS.map(()=>({p:"",r:"",g:""})); }
 if(key==="EK6"){ d.rows=(d.rows&&d.rows.length?d.rows:[{}]).map(r=>r.id?r:Object.assign({id:uid("r")},r)); }
 if(key==="EK8"){ d.rows=(d.rows||[]).map(r=>r.id?r:Object.assign({id:uid("x")},r)); const has=new Set(d.rows.map(r=>r.rkm)); let i=0;
  if(f.status!=="onayli"&&f.status!=="onay_bekliyor") rkmRows(a).forEach(r=>{ if(!has.has(r.id)){ d.rows.push({id:uid("x"),rkm:r.id,test:r.test||"",birim:a.birim,denetci:a.ekip[i++%a.ekip.length],bas:a.start,bit:a.end}); } });
  if(!d.rows.length) d.rows.push({id:uid("x"),denetci:a.sorumlu}); }
 if(key==="EK7"){ if(!d.onceki){ const pr=prevAudits(a)[0]; d.onceki = pr ? `${pr.no} · rapor tarihi ${fmt(pr.rapor.tarih)}.\nÖnemli bulgular:\n`+findingsOf(pr.id).map(f=>`- B${f.no} ${f.konu} (${F_ST[effStatus(f)][0]})`).join("\n") : "Bu süreçte daha önce denetim yapılmamıştır."; }
  if(!d.testler&&rkmRows(a).length) d.testler=rkmRows(a).map((r,i)=>`R-${pad2(i+1)} ${r.risk}: ${r.test||"—"}`).join("\n"); }
 if(key==="EK5"&&!d.gundem) d.gundem=EK5_GUNDEM;
 if(key==="EK14") a.ekip.forEach(u=>{ d[u]=d[u]||{c:[],not:""}; });
 DRAFT={aid:a.id,key,data:d}; return DRAFT;
}
function renderForm(){
 const a=audit(S.ui.id), key=S.ui.key, def=FORMS[key]; if(!a||!def) return renderAudits();
 const f=formOf(a,key), D=ensureDraft(a,key).data;
 const waiting = f.status==="onay_bekliyor";
 const locked = (waiting&&!isMudur()) || f.status==="onayli" || f.status==="tamam" || (def.mudurOnly&&!isMudur()) || a.status==="tamamlandi";
 const ro = locked?"readonly disabled":"";
 let body="";
 if(def.fields) body = `<div class="card stack">${def.fields.map(x=>`<label class="field"><span>${esc(x.l)}${x.hint?` <span class="hint">· ${esc(x.hint)}</span>`:""}</span>${x.t==="textarea"?`<textarea class="input" id="f-${x.k}" data-df="${x.k}" ${ro}>${esc(D[x.k]||"")}</textarea>`:`<input class="input" id="f-${x.k}" type="${x.t==="date"?"date":"text"}" data-df="${x.k}" value="${esc(D[x.k]||"")}" ${ro}>`}</label>`).join("")}</div>`;
 if(def.custom==="sure"){
  const tot=k=>D.rows.reduce((t,r)=>t+(+r[k]||0),0), act=ek3Actual(a);
  body = `<div class="tw"><table class="t"><tr><th>Faaliyet</th><th>Aşama</th><th>Planlanan (gün)</th><th>Revize (gün)</th><th>Gerçekleşen (gün)</th><th>Fark</th></tr>${D.rows.map((r,i)=>`<tr><td>${esc(EK3_ROWS[i])}</td><td class="small muted">${EK3_STAGE[i]}. ${STAGES[EK3_STAGE[i]]}</td>${["p","r","g"].map(c=>`<td><input class="input mono" id="e3-${i}-${c}" inputmode="numeric" data-e3="${i}" data-e3c="${c}" value="${esc(r[c]||"")}" ${ro} style="max-width:90px">${c==="g"&&act[i]&&act[i]!==r.g?`<div class="li-sub">aşamalardan: ${act[i]}</div>`:""}</td>`).join("")}<td class="num">${r.g&&r.p?((+r.g)-(+(r.r||r.p))):""}</td></tr>`).join("")}<tr><td><b>TOPLAM SÜRE</b></td><td></td><td class="num">${tot("p")||""}</td><td class="num">${tot("r")||""}</td><td class="num">${tot("g")||""}</td><td></td></tr></table></div>
  ${locked?"":`<button class="btn sm" style="margin-top:10px" data-act="e3auto">Gerçekleşen süreleri aşama tarihlerinden doldur</button>`}
  <label class="field" style="margin-top:14px"><span>Revizyon gerekçesi <span class="hint">· Revize sütunu doluysa zorunlu</span></span><textarea class="input" id="f-gerekce" data-df="gerekce" ${ro}>${esc(D.gerekce||"")}</textarea></label>`;
 }
 if(def.custom==="rows"){
  const cell=(c,r,i)=>{ const v=r[c.k]||""; const at=`id="r-${i}-${c.k}" data-dr="${i}" data-dc="${c.k}" ${ro}`;
   if(c.t==="textarea") return `<textarea class="input" ${at}>${esc(v)}</textarea>`;
   if(c.t==="sel") return `<select class="input" ${at}><option value="">—</option>${c.o.map(o=>`<option ${o===v?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
   if(c.t==="team") return `<select class="input" ${at}>${a.ekip.map(u=>`<option value="${u}" ${u===v?"selected":""}>${esc(user(u).name)}</option>`).join("")}</select>`;
   if(c.t==="rkm") return `<select class="input" ${at}><option value="">—</option>${rkmRows(a).map((x,j)=>`<option value="${x.id}" ${x.id===v?"selected":""}>R-${pad2(j+1)} ${esc(String(x.risk||"").slice(0,40))}</option>`).join("")}</select>`;
   return `<input class="input" type="${c.t==="date"?"date":"text"}" ${at} value="${esc(v)}">`; };
  const autoCols = key==="EK6" ? `<th>Seviye</th><th>Denetçi · ÇK · sonuç <span class="muted">(otomatik)</span></th>` : key==="EK8" ? `<th>Çalışma kağıdı</th>` : "";
  const autoCells = (r) => { if(key==="EK6"){ const ts=testRows(a).filter(t=>t.rkm===r.id); return `<td class="num">${r.etki&&r.olas?r.etki*r.olas:""}</td><td class="small">${ts.map(t=>{const w=ckOfTest(a,t.id); return `<div><span class="mono">${testCode(a,t.id)}</span> ${esc(user(t.denetci).name)} · ${w?`<span class="mono">${esc(w.ref)}</span> ${sonucChip(w.sonuc)}`:"ÇK yok"}</div>`;}).join("")||`<span class="muted">EK-8'de test yok</span>`}</td>`; }
   if(key==="EK8"){ const w=ckOfTest(a,r.id); return `<td class="small">${w?`<span class="mono">${esc(w.ref)}</span> ${sonucChip(w.sonuc)}`:"—"}</td>`; } return ""; };
  const code = i => key==="EK6"?"R-"+pad2(i+1):key==="EK8"?"T-"+pad2(i+1):String(i+1);
  body = `<div class="tw"><table class="t"><tr><th>No</th>${def.cols.map(c=>`<th>${esc(c.l)}</th>`).join("")}${autoCols}<th></th></tr>${D.rows.map((r,i)=>`<tr><td class="num">${code(i)}</td>${def.cols.map(c=>`<td>${cell(c,r,i)}</td>`).join("")}${autoCells(r)}<td>${locked?"":`<button class="btn sm ghost" data-act="rowDel" data-i="${i}" aria-label="Satırı sil">Sil</button>`}</td></tr>`).join("")}</table></div>${locked?"":`<button class="btn sm" style="margin-top:10px" data-act="rowAdd">Satır ekle</button>`}`;
 }
 if(def.custom==="ek14"){
  body = ctxPerf(a) + a.ekip.map(u=>{ const r=D[u]; return `<div class="card" style="margin-top:14px"><div class="card-head"><h2>${esc(user(u).name)} · ${esc(user(u).title)}</h2><span class="muted small">Değerlendiren: ${esc(mudurler()[0].name)}</span></div>
   <div class="tw"><table class="t"><tr><th>#</th><th>Kriter</th>${EK14_O.map(o=>`<th>${o}</th>`).join("")}</tr>${EK14_K.map((k,j)=>`<tr><td class="num">${j+1}</td><td>${esc(k)}</td>${EK14_O.map((o,oi)=>`<td><input type="radio" id="e14-${u}-${j}-${oi}" name="e14-${u}-${j}" data-e14u="${u}" data-e14i="${j}" value="${oi}" ${r.c[j]===oi?"checked":""} ${ro} aria-label="${o}"></td>`).join("")}</tr>`).join("")}</table></div>
   <label class="field" style="margin-top:12px"><span>Genel değerlendirme</span><textarea class="input" id="e14n-${u}" data-e14n="${u}" ${ro}>${esc(r.not||"")}</textarea></label></div>`; }).join("") + (def.mudurOnly&&!isMudur()?`<div class="notice info" style="margin-top:14px">Bu formu yalnızca İç Denetim Müdürü doldurur.</div>`:"");
 }
 const auto = `<div class="card" style="margin-bottom:14px"><div class="section-label" style="margin-bottom:8px">Denetim kaydından otomatik</div><div class="grid3 small"><div><span class="muted">Denetim no</span><div class="mono">${a.no}</div></div><div><span class="muted">Konu</span><div>${esc(a.konu)}</div></div><div><span class="muted">Denetlenen birim</span><div>${esc(a.birim)}</div></div><div><span class="muted">İç denetçiler</span><div>${esc(names(a.ekip))}</div></div><div><span class="muted">Planlanan tarihler</span><div>${fmt(a.start)} – ${fmt(a.end)}</div></div><div><span class="muted">Denetim türü</span><div>${a.tur==="C"?"Danışmanlık":"Güvence"}</div></div></div>${def.note?`<p class="small muted" style="margin:10px 0 0">${esc(def.note)}</p>`:""}</div>`;
 const ctx = formContext(a,key).filter(Boolean);
 const ctxHtml = ctx.length ? `<details class="ctx-wrap" open><summary>Önceki evraklardan bu formla ilgili bilgiler (${ctx.length})</summary><div class="stack" style="margin-top:10px">${ctx.join("")}</div></details>` : "";
 const approver = isMudur(), pt = pendingTask(a,key), sub=(f.history||[]).filter(x=>x.tip==="Onaya gönderildi").pop();
 const primary = approver ? (def.mudurOnly?"Tamamla":"Tamamla ve onayla") : "Tamamla ve müdür onayına gönder";
 const approveBox = waiting&&approver&&pt ? `<div class="card" style="margin-top:14px"><div class="card-head"><h2>Görev puanı</h2><span class="muted small">${esc(user(pt.sorumlu).name)} · ${esc(pt.baslik)}</span></div><div class="field"><span>Puan (1–5)</span>${starsHtml()}</div><label class="field" style="margin-top:10px"><span>Yorum <span class="hint">· denetçi görür</span></span><textarea class="input" id="p-yorum"></textarea></label></div>` : "";
 const actions = waiting
  ? (approver ? `<button class="btn pri" data-act="formApprove">${pt?"Onayla ve puanla":"Onayla"}</button><button class="btn" data-act="formBack">Düzeltme için geri gönder</button>` : `<span class="chip c-warn">Müdür onayı bekleniyor</span>`)
  : `${!locked?`<button class="btn" data-act="formSave">Taslak kaydet</button><button class="btn pri" data-act="formDone">${primary}</button>`:""}${approver&&a.status!=="tamamlandi"&&(f.status==="onayli"||f.status==="tamam")?`<button class="btn" data-act="formReopen">Düzenlemeye aç</button>`:""}`;
 return topbar(esc(def.title),backBtn(a,"akis"),chip(FORM_ST[f.status])) + (waiting&&approver?`<div class="notice warn" style="margin-bottom:14px"><div><b>${sub?esc(user(sub.by).name)+" bu formu onayınıza gönderdi.":"Onayınızı bekliyor."}</b> Gerekirse alanları değiştirip onaylayabilirsiniz. Gönderilen sürüm ile onayladığınız sürüm ayrı saklanır, değişiklikler kayda alınır.</div></div>`:"") + auto + sablonNotice(a,f) + ctxHtml + body + approveBox +
  `<div class="spread" style="margin-top:16px"><div class="btns">${actions}</div><div class="btns"><button class="btn ghost" data-act="exportForm" data-id="${a.id}" data-key="${key}" data-kind="docx">Word</button><button class="btn ghost" data-act="exportForm" data-id="${a.id}" data-key="${key}" data-kind="pdf">PDF</button></div></div>` + historyHtml(f.history,"f",a.id+"|"+key);
}

/* ---- Bulgu düzenleyici ---- */
function ensureDB(f){ if(DB && DB.id===f.id) return DB; DB=JSON.parse(JSON.stringify(f)); DB._on={}; FACTORS.forEach(x=>{ DB._on[x.k]=x.subs.some(s=>+DB.scores[s.k]>0); }); DB.ek10=DB.ek10||{gorus:[],eylemler:[],aciklama:"",islendi:false}; return DB; }
function renderBulgu(){
 const f0=finding(S.ui.id); if(!f0) return renderAudits();
 const a=audit(f0.auditId), f=ensureDB(f0), tab=S.ui.tab||"ek9";
 const editable = (["taslak","onayli"].includes(f0.status) && (a.ekip.includes(S.me)||canReview())) || (f0.status==="onay_bekliyor" && canApproveB(f0));
 const ro = editable?"":"readonly disabled";
 const puan=bulguPuan(f.scores), hes=onemHesap(f.scores), on=onemOf(f);
 const r=rkmById(a,f0.rkmId), t=testById(a,f0.testId), w=a.ek4.find(x=>x.ref===f0.calismaRef), ri=reportIndex(f0);
 const links = `<div class="trace-strip">${[["Risk (EK-6)",r?`<span class="mono">${rkmCode(a,r.id)}</span> ${esc(r.risk)}`:"—"],["Kontrol",r?esc(r.kontrol):"—"],["Test (EK-8)",t?`<span class="mono">${testCode(a,t.id)}</span> ${esc(user(t.denetci).name)}`:"—"],["Çalışma kağıdı (EK-4)",w?`<button class="btn sm ghost" data-act="peekCK" data-id="${a.id}" data-w="${w.id}"><span class="mono">${esc(w.ref)}</span></button> ${sonucChip(w.sonuc)}`:"—"],["Rapor",ri?`<span class="mono">D.${ri}</span>`:`<span class="muted">onaylanınca D bölümüne girer</span>`]].map(x=>`<div><span class="section-label">${x[0]}</span><div>${x[1]}</div></div>`).join(`<span class="arrow" aria-hidden="true">→</span>`)}</div>`;
 const tabs=[["ek9","EK-9 Bulgu formu"],["ek10","EK-10 Paylaşım ve birim yanıtı"],["takip","Takip"]];
 let body="";
 if(tab==="ek9"){
  const rep=repeats(f);
  const txt=(k,l,h)=>`<label class="field"><span>${l}${h?` <span class="hint">· ${h}</span>`:""}</span><textarea class="input" id="b-${k}" data-bf="${k}" ${ro}>${esc(f[k]||"")}</textarea></label>`;
  const qs = FACTORS.map(x=>{ const onx=f._on[x.k]; return `<div class="score-q ${onx?"on":""}"><div class="qh"><b>${FACTORS.indexOf(x)+1}. ${esc(x.q)}</b><div class="seg" role="group"><button class="${onx?"":"on"}" data-act="fOn" data-k="${x.k}" data-on="0" ${editable?"":"disabled"}>Etkilemez</button><button class="${onx?"on":""}" data-act="fOn" data-k="${x.k}" data-on="1" ${editable?"":"disabled"}>Etkiler</button></div></div>
   ${onx?`<div class="sub">${x.subs.map(s=>{const v=+f.scores[s.k]||0; return `<div><div>${esc(s.l)}</div><div class="w">ağırlık %${Math.round(s.w*100)}${v?` · katkı ${num2(v*s.w)}`:""}</div></div><select class="input" id="s-${s.k}" data-bs="${s.k}" ${ro}><option value="0">Etkilemez</option>${s.o.map((o,i)=>`<option value="${i+1}" ${v===i+1?"selected":""}>${i+1} · ${esc(o)}</option>`).join("")}</select>`;}).join("")}</div>`:""}</div>`; }).join("");
  const groups = FACTORS.map(x=>{ const v=x.subs.reduce((tt,s)=>tt+(+f.scores[s.k]||0)*s.w,0), mx=x.subs.reduce((tt,s)=>tt+5*s.w,0); return `<div class="bar"><span>${esc({fin:"Finansal",op:"Operasyonel",yasal:"Yasal",yon:"Yönetimsel",imaj:"İmaj / itibar",dis:"Dışsal"}[x.k])}</span><span class="track"><i style="width:${Math.round(v/mx*100)}%"></i></span><span class="v">${num2(v)}</span></div>`; }).join("");
  body = `<div class="cols"><div class="stack">
   <div class="card stack"><div class="grid2"><label class="field"><span>Bulgunun konusu</span><input class="input" id="b-konu" data-bf="konu" value="${esc(f.konu)}" ${ro}></label><label class="field"><span>Bulgunun ilgili olduğu birim</span><input class="input" id="b-birim" data-bf="birim" value="${esc(f.birim)}" ${ro}></label>
    <label class="field"><span>Kategori <span class="hint">· yalnızca sistemde</span></span><select class="input" id="b-kategori" data-bf="kategori" ${ro}><option value="">Seçin</option>${KATEGORILER.map(k=>`<option ${f.kategori===k?"selected":""}>${esc(k)}</option>`).join("")}</select></label>
    ${f.kategori==="Diğer"?`<label class="field"><span>Kategori açıklaması <span class="hint">· Diğer için zorunlu</span></span><input class="input" id="b-kategoriAciklama" data-bf="kategoriAciklama" value="${esc(f.kategoriAciklama)}" ${ro}></label>`:`<div></div>`}</div>
    ${rep.length?`<div class="notice warn"><div><b>Tekrarlayan bulgu olabilir.</b> Aynı süreçte aynı kategoride önceki bulgular: ${rep.map(x=>`${esc(fcode(x))} ${esc(x.konu)} (${F_ST[effStatus(x)][0]})`).join("; ")}.</div></div>`:""}
    ${w?`<div class="notice info"><div><b>Çalışma kağıdından (${esc(w.ref)}):</b> ${esc(w.bilgi)}</div></div>`:""}
    ${txt("mevcut","Mevcut durum","raporda “Bulgu”")}${txt("neden","Neden")}${txt("risk","Riskler ve etkileri","raporda “Risk Tanımı”; RKM riskinden önerildi")}${txt("kriter","Kriter","RKM kontrolünden önerildi")}${txt("oneri","Öneri","raporda “Öneri”")}</div>
   <div class="internal"><div class="internal-head"><div><div class="section-label">Bulgu puanlama</div><b>Makro risk modeline göre</b></div><span class="chip c-acc nodot">Yalnızca sistemde · Word/PDF çıktısına girmez</span></div><div class="stack">${qs}</div></div></div>
   <div class="card scorebox stack"><div><div class="section-label">Bulgu puanı</div><div class="bignum">${num2(puan)}</div><div class="small muted">Σ (etki × ağırlık), etkilenmeyen alt faktör 0</div></div>
    <div>${groups}</div>
    <div><div class="section-label" style="margin-bottom:4px">Önem düzeyi</div>${onemChip(on)} ${hes?`<span class="small muted">En yüksek etki ${maxEtki(f.scores)} → ${hes}</span>`:""}</div>
    <label class="field"><span>Önem düzeyini değiştir <span class="hint">· bir kademe, gerekçeyle</span></span><select class="input" id="b-ovr" data-bo="1" ${ro}><option value="">Hesaplanan (${hes||"—"})</option>${ONEM_LIST.map(o=>`<option ${f.onemOverride&&f.onemOverride.duzey===o?"selected":""}>${o}</option>`).join("")}</select></label>
    ${f.onemOverride?`<label class="field"><span>Gerekçe</span><textarea class="input" id="b-ovrg" data-bog="1" ${ro}>${esc(f.onemOverride.gerekce||"")}</textarea></label>`:""}
    <p class="small muted" style="margin:0">Çıktıda yalnızca önem düzeyi görünür. Kategori, puanlama soruları ve puan sistemde kalır.</p></div></div>
   <div class="spread" style="margin-top:16px"><div class="btns">${editable?`<button class="btn" data-act="bSave">Kaydet</button>`:""}${editable&&f0.status==="taslak"?(isMudur()?`<button class="btn pri" data-act="bApprove">Onayla</button>`:`<button class="btn pri" data-act="bSend">Gözden geçirmeye gönder</button>`):""}${canApproveB(f0)&&f0.status==="onay_bekliyor"?`<button class="btn pri" data-act="bApprove">Onayla</button><button class="btn" data-act="bBack">Düzeltme için geri gönder</button>`:""}</div><div class="btns"><button class="btn ghost" data-act="exportB" data-kind="docx" data-f="EK9">EK-9 Word</button><button class="btn ghost" data-act="exportB" data-kind="pdf" data-f="EK9">EK-9 PDF</button></div></div>` + historyHtml(f0.history,"b",f0.id);
 }
 if(tab==="ek10"){
  const ready = a.stage>=4 || f0.ek10.islendi;
  const e=f.ek10, ro10 = (e.islendi&&f0.status!=="paylasildi") || !ready ? "readonly disabled" : "";
  const g=k=>`<label class="row"><input type="checkbox" id="g-${k}" data-bg="${k}" ${e.gorus.includes(k)?"checked":""} ${ro10}> ${{katiliyor:"Bulguya katılıyoruz",katilmiyor:"Bulguya katılmıyoruz",oneri_evet:"Öneriye katılıyoruz",oneri_hayir:"Öneriye katılmıyoruz",onem_hayir:"Bulgunun önem düzeyine katılmıyoruz"}[k]}</label>`;
  const maxT = e.eylemler.map(x=>x.tarih).filter(Boolean).sort().pop();
  body = !ready ? `<div class="card empty">EK-10, denetim Bulgu paylaşımı aşamasına (4) geçince açılır.</div>` : `<div class="cols"><div class="stack">
   <div class="card"><div class="card-head"><h2>1. EK-10 çıktısını alın ve birime iletin</h2></div><p class="muted" style="margin:0 0 10px">Sistem birime bir şey göndermez. Çıktıyı alıp birime siz iletirsiniz. Form, EK-9'daki bilgilerle dolu gelir.</p>
    <label class="row" style="margin-bottom:12px"><input type="checkbox" id="b-ng" data-bng="1" ${e.nedenGizle?"checked":""}> “Neden” alanını çıktıya ekleme</label>
    <div class="btns"><button class="btn" data-act="exportB" data-kind="docx" data-f="EK10">EK-10 Word</button><button class="btn" data-act="exportB" data-kind="pdf" data-f="EK10">EK-10 PDF</button></div></div>
   <div class="card stack"><div class="card-head" style="margin:0"><h2>2. Birimden gelen yanıtı işleyin</h2>${e.islendi?chip(["İşlendi","c-ok"]):""}</div>
    <div class="field"><span>Denetlenen birim görüşü</span><div class="stack" style="gap:6px">${["katiliyor","katilmiyor","oneri_evet","oneri_hayir","onem_hayir"].map(g).join("")}</div></div>
    <div class="field"><span>Eylem planı</span><div class="tw"><table class="t"><tr><th>Sorumlusu</th><th>Gerçekleştirilecek eylem</th><th>Tamamlanma tarihi</th><th></th></tr>${e.eylemler.map((x,i)=>`<tr><td><input class="input" id="ey-${i}-s" data-be="${i}" data-bec="sorumlu" value="${esc(x.sorumlu||"")}" ${ro10}></td><td><textarea class="input" id="ey-${i}-e" data-be="${i}" data-bec="eylem" ${ro10}>${esc(x.eylem||"")}</textarea></td><td><input class="input" type="date" id="ey-${i}-t" data-be="${i}" data-bec="tarih" value="${esc(x.tarih||"")}" ${ro10}></td><td>${ro10?"":`<button class="btn sm ghost" data-act="eyDel" data-i="${i}">Sil</button>`}</td></tr>`).join("")||`<tr><td colspan="4" class="muted">Eylem yok (bulguya katılınmadıysa boş kalabilir).</td></tr>`}</table></div>${ro10?"":`<button class="btn sm" style="margin-top:8px;align-self:flex-start" data-act="eyAdd">Eylem ekle</button>`}</div>
    <label class="field"><span>Denetlenen birimin açıklamaları</span><textarea class="input" id="b-acik" data-b10="aciklama" ${ro10}>${esc(e.aciklama||"")}</textarea></label>
    ${ro10?"":`<div class="spread"><span class="small muted">Takip termini: ${maxT?fmt(maxT)+" (eylem planından)":`${on?TERMIN_GUN[on]+" gün (önem düzeyine göre varsayılan)":"önem düzeyine göre"}`}</span><button class="btn pri" data-act="ek10Save">Yanıtı işle</button></div>`}</div></div>
   <div class="card"><div class="section-label" style="margin-bottom:8px">Bulgu özeti</div><b>${esc(f.konu)}</b><div style="margin:6px 0">${onemChip(on)} ${fChip(f0)}</div><p class="small" style="white-space:pre-wrap">${esc(f.mevcut)}</p><p class="small"><b>Öneri:</b> ${esc(f.oneri)}</p></div></div>`;
 }
 if(tab==="takip"){
  body = `<div class="cols"><div class="card"><div class="card-head"><h2>Takip geçmişi</h2>${["aksiyonda","gecikti"].includes(effStatus(f0))?`<button class="btn pri sm" data-act="durum" data-id="${f0.id}" data-p="devam">Durum gir</button>`:""}</div>
   ${f0.updates.length?f0.updates.slice().reverse().map(u=>`<div class="li"><div class="li-main"><b>${esc(u.tip)}</b> <span class="muted small">· ${fmt(u.at)} · ${esc(user(u.by).name)}</span><div class="li-sub">${esc(u.not||"")}${u.kanit?` · Kanıt: <span class="mono">${esc(u.kanit)}</span>`:""}</div></div></div>`).join(""):`<div class="empty">Henüz durum girişi yok.</div>`}</div>
   <div class="card"><div class="small stack" style="gap:8px"><div><span class="muted">Durum</span><div>${fChip(f0)}</div></div><div><span class="muted">Termin</span><div class="mono">${fmt(f0.termin)} ${f0.termin?dayTxt(f0.termin):""}</div></div><div><span class="muted">İlk termin</span><div class="mono">${fmt(f0.ilkTermin)}</div></div><div><span class="muted">Denetlenen birim</span><div>${esc(f0.birim)}</div></div><div><span class="muted">Birimdeki eylem sorumlusu</span><div>${esc((f0.ek10.eylemler[0]||{}).sorumlu||"—")}</div></div>${f0.uzatim?`<div><span class="muted">Uzatım talebi</span><div>${fmt(f0.uzatim.tarih)} · ${esc(f0.uzatim.durum)} · ${esc(f0.uzatim.gerekce)}</div></div>`:""}</div>
   ${f0.status==="dogrulamada"&&canReview()?`<button class="btn pri" style="margin-top:12px" data-act="verify" data-id="${f0.id}">Kanıtı incele</button>`:""}</div></div>`;
 }
 return topbar(`<span class="mono" style="font-weight:500">${esc(fcode(f0))}</span> ${esc(f0.konu)}`,backBtn(a,"testler"),fChip(f0)) + (f0.status==="onay_bekliyor"&&canApproveB(f0)?`<div class="notice warn" style="margin-bottom:14px"><div><b>Bu bulgu gözden geçirmenizi bekliyor.</b> Gerekirse düzeltip onaylayabilirsiniz; gönderilen ve onaylanan sürüm ayrı saklanır, değişiklikler kayda alınır.</div></div>`:"") + links +
  `<div class="tabs">${tabs.map(t=>`<button class="${tab===t[0]?"on":""}" data-act="btab" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>` + body;
}

/* ---- Görevler ---- */
function isNewTask(t){ return t.durum==="acik" && t.created && daysBetween(t.created, iso(new Date()))<=3; }
function taskActions(t){ const b=[];
 if(t.sorumlu===S.me && t.durum==="acik") b.push(`<button class="btn sm" data-act="taskStart" data-id="${t.id}">Başla</button>`);
 if(t.sorumlu===S.me && ["acik","devam"].includes(t.durum)){
  if(t.formKey) b.push(`<button class="btn sm" data-act="go" data-v="form" data-id="${t.auditId}" data-key="${t.formKey}">Formu aç</button>`);
  else if(t.testId) b.push(`<button class="btn sm" data-act="go" data-v="audit" data-id="${t.auditId}" data-tab="testler">Teste git</button>`);
  else b.push(`<button class="btn sm pri" data-act="taskDoneModal" data-id="${t.id}">${isMudur()?"Tamamla":"Tamamladım, onaya gönder"}</button>`); }
 if(isMudur() && t.durum==="onay_bekliyor") b.push(t.formKey&&t.auditId&&formOf(audit(t.auditId),t.formKey).status==="onay_bekliyor" ? `<button class="btn sm pri" data-act="go" data-v="form" data-id="${t.auditId}" data-key="${t.formKey}">Formu onayla ve puanla</button>` : `<button class="btn sm pri" data-act="taskPuan" data-id="${t.id}">Puanla</button>`);
 return b.join(""); }
function taskTable(ts,showCtx){
 return `<div class="tw"><table class="t"><tr><th>Görev</th>${showCtx?"<th>Bağlı olduğu iş</th>":"<th>Alan · sıklık</th>"}<th>Talep</th><th>Sorumlu</th><th>Atandı</th><th>Termin</th><th>Durum</th><th>Puan</th><th></th></tr>${ts.map(t=>`<tr${isNewTask(t)?' class="newrow"':""}><td><b>${esc(t.baslik)}</b> ${isNewTask(t)?`<span class="chip c-acc nodot">Yeni</span>`:""}${t.aciklama?`<div class="li-sub">${esc(t.aciklama)}</div>`:""}${t.cikti||t.sonuc?`<div class="li-sub">Sonuç: ${esc(t.sonuc||"")}${t.cikti?` · <span class="mono">${esc(t.cikti)}</span>`:""}</div>`:""}${t.tespit?`<div><span class="chip c-warn">Tespit: ${esc(t.tespit)}</span></div>`:""}${t.yorum?`<div class="li-sub">Müdür notu: ${esc(t.yorum)}</div>`:""}</td>
  <td>${showCtx?taskCtx(t):t.surekli?`${esc(t.surekli.alan)}<div class="li-sub">${esc(t.surekli.siklik)}</div>`:"—"}</td><td class="small">${esc(KAYNAK[t.kaynak]||"")}${t.kaynak==="sozlu"?`<div class="li-sub">${esc(user(t.atayan).name)} söyledi, ${esc(user(t.kaydeden).name)} girdi</div>`:t.kaynak==="sistem"?`<div class="li-sub">${esc(user(t.atayan).name)}</div>`:""}</td><td>${esc(user(t.sorumlu).name)}</td><td class="num">${fmt(t.created)}</td><td class="num">${fmt(t.termin)}${t.durum!=="kapandi"?"<div>"+dayTxt(t.termin)+"</div>":""}</td><td>${chip(T_ST[t.durum])}</td><td class="num">${t.puan?t.puan+" / 5":"—"}</td><td><div class="btns">${taskActions(t)}</div></td></tr>`).join("")||`<tr><td colspan="9" class="muted">Bu sekmede görev yok.</td></tr>`}</table></div>`;
}
function taskTabs(){ return canReview()
 ? [["aktif","Aktif (devam eden)",t=>t.durum==="devam"],["bekleyen","Bekleyen (atanmış, başlanmamış)",t=>t.durum==="acik"],["puan",isMudur()?"Puanınızı bekleyen":"Puan bekleyen",t=>t.durum==="onay_bekliyor"],["tamam","Tamamlanan",t=>t.durum==="kapandi"]]
 : [["aktif","Aktif",t=>["acik","devam"].includes(t.durum)],["puan","Puan bekleyen",t=>t.durum==="onay_bekliyor"],["tamam","Tamamlanan",t=>t.durum==="kapandi"]]; }
function renderTasks(){
 const tabs=taskTabs(), cur=tabs.find(x=>x[0]===S.ui.filter)||tabs[0];
 const base=S.tasks.filter(t=>canReview()||t.sorumlu===S.me).filter(t=>!S.ui.kisi||t.sorumlu===S.ui.kisi);
 const ts=base.filter(cur[2]).sort(cur[0]==="tamam"?(a,b)=>(b.bitis||b.termin||"").localeCompare(a.bitis||a.termin||""):(a,b)=>(b.created||"").localeCompare(a.created||"")||a.termin.localeCompare(b.termin));
 return topbar("Görevler",null,`<button class="btn pri" data-act="taskModal">Görev ekle</button>`) +
  `<div class="notice info" style="margin-bottom:12px">${canReview()?"Ekibin tüm görevlerini görüyorsunuz.":"Yalnızca size ait görevleri görürsünüz."} Yeni atanan görevler en üstte. Her görev bir denetime ya da sürekli denetime bağlıdır; tamamlanınca müdüre bildirim gider ve müdür puanlamadan kapanmaz.</div>
  <div class="spread" style="margin-bottom:4px"><div class="tabs" role="tablist" style="margin:0;flex:1">${tabs.map(x=>`<button class="${cur[0]===x[0]?"on":""}" data-act="filter" data-f="${x[0]}">${x[1]} <span class="cnt-pill">${base.filter(x[2]).length}</span></button>`).join("")}</div>${canReview()?`<select class="input" id="kisi" data-act-change="kisi" style="max-width:200px" aria-label="Kişiye göre süz"><option value="">Herkes</option>${S.users.filter(u=>u.role!=="mudur").map(u=>`<option value="${u.id}" ${S.ui.kisi===u.id?"selected":""}>${esc(u.name)}</option>`).join("")}</select>`:""}</div>
  <div style="margin-top:12px">${taskTable(ts,true)}</div>`;
}
function renderSurekli(){
 const all=S.tasks.filter(t=>t.surekli), mine=canReview()?all:all.filter(t=>t.sorumlu===S.me);
 const openT=mine.filter(t=>t.durum!=="kapandi"), doneT=mine.filter(t=>t.durum==="kapandi"), puanli=doneT.filter(t=>t.puan);
 const byAlan={}; openT.forEach(t=>(byAlan[t.surekli.alan]=byAlan[t.surekli.alan]||[]).push(t));
 const tespit=all.filter(t=>t.tespit);
 const k=(n,l)=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`;
 return topbar("Sürekli Denetim",null,`<button class="btn pri" data-act="taskModal" data-surekli="1">Sürekli denetim görevi ekle</button>`) +
  `<p class="muted" style="margin-top:0">Bir denetim görevine bağlanmayan işler: periyodik kontroller, veri analizleri, mevzuat takibi, raporlama. Tekrarlayan görevler puanlanınca bir sonraki dönem için kendiliğinden yeniden açılır.</p>
  <div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">${k(openT.length,"Açık görev")}${k(openT.filter(t=>daysUntil(t.termin)<0).length,"Termini geçen")}${k(doneT.length,"Tamamlanan")}${k(puanli.length?num2(puanli.reduce((s,t)=>s+t.puan,0)/puanli.length):"—","Ortalama müdür puanı")}</div>
  <div class="cols"><div class="stack">${Object.keys(byAlan).length?Object.entries(byAlan).map(([al,ts])=>`<div class="card"><div class="card-head"><h2>${esc(al)}</h2><span class="muted small">${ts.length} açık</span></div>${ts.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.baslik)}</b><div class="li-sub">${esc(user(t.sorumlu).name)} · ${esc(t.surekli.siklik)} · ${esc(KAYNAK[t.kaynak])} · termin ${fmt(t.termin)} · ${dayTxt(t.termin)}</div></div><div class="btns">${chip(T_ST[t.durum])}${taskActions(t)}</div></div>`).join("")}</div>`).join(""):`<div class="card empty">Açık sürekli denetim görevi yok.</div>`}
   <div class="card"><div class="card-head"><h2>Tamamlananlar</h2></div>${taskTable(doneT,false)}</div></div>
   <div class="stack"><div class="card"><div class="card-head"><h2>Denetim gerektiren tespitler</h2></div>${tespit.length?tespit.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.tespit)}</b><div class="li-sub">${esc(t.baslik)} · ${esc(user(t.sorumlu).name)}</div></div></div>`).join(""):`<div class="empty">Kayıtlı tespit yok.</div>`}<p class="small muted" style="margin:8px 0 0">Bu tespitler Denetim Planı ekranında da görünür ve bir sonraki makro risk puanlamasına girdi olur.</p></div></div></div>`;
}

/* ---- İzleme ---- */
function renderFindings(){
 const flt=S.ui.filter||"acik";
 const OPEN=["paylasildi","uzlasildi","uzlasilmadi","aksiyonda","gecikti","dogrulamada"];
 const base=S.findings.filter(f=>!["taslak","onay_bekliyor","onayli"].includes(f.status));
 let fs=base.slice();
 if(flt==="acik") fs=fs.filter(f=>OPEN.includes(effStatus(f)));
 if(flt==="gecikti") fs=fs.filter(f=>effStatus(f)==="gecikti");
 if(flt==="dogrulamada") fs=fs.filter(f=>f.status==="dogrulamada");
 if(flt==="kapandi") fs=fs.filter(f=>f.status==="kapandi");
 if(S.ui.birim) fs=fs.filter(f=>f.birim===S.ui.birim);
 fs.sort((a,b)=>(a.termin||"9").localeCompare(b.termin||"9"));
 const birims=[...new Set(base.map(f=>f.birim))].sort((a,b)=>a.localeCompare(b,"tr"));
 const summary=birims.map(bi=>{ const x=base.filter(f=>f.birim===bi), o=x.filter(f=>OPEN.includes(effStatus(f))), l=x.filter(f=>effStatus(f)==="gecikti"), mx=l.length?Math.max(...l.map(f=>-daysUntil(f.termin))):0, dg=x.filter(f=>f.status==="dogrulamada").length, kp=x.filter(f=>f.status==="kapandi").length;
  return {bi,o:o.length,l:l.length,mx,dg,kp,n:x.length}; }).sort((a,b)=>b.l-a.l||b.o-a.o);
 const act=f=>{ const s=effStatus(f), b=[];
  if(["aksiyonda","gecikti"].includes(s)) b.push(`<button class="btn sm" data-act="durum" data-id="${f.id}" data-p="devam">Durum gir</button>`);
  if(s==="dogrulamada"&&canReview()) b.push(`<button class="btn sm pri" data-act="verify" data-id="${f.id}">Kanıtı incele</button>`);
  if(f.uzatim&&f.uzatim.durum==="bekliyor") b.push(isMudur()?`<button class="btn sm pri" data-act="uzatim" data-id="${f.id}" data-ok="1">Uzatımı onayla</button>`:`<span class="chip c-warn">Uzatım bekliyor</span>`);
  return b.join(""); };
 return topbar("İzleme") + `<p class="muted" style="margin-top:0">Bulgular denetlenen birim bazında izlenir. Denetimi tamamlanan veya raporu kesinleşen bulgular kapanana kadar burada kalır; ekipteki herkes durum girebilir.</p>
 <div class="tw" style="margin-bottom:16px"><table class="t"><tr><th>Denetlenen birim</th><th>Açık</th><th>Geciken</th><th>En uzun gecikme</th><th>Doğrulamada</th><th>Kapanan</th><th>Kapanma oranı</th></tr>${summary.map(s=>`<tr class="click" data-act="birimSec" data-b="${esc(s.bi)}"><td><b>${esc(s.bi)}</b></td><td class="num">${s.o}</td><td class="num ${s.l?"late":""}">${s.l}</td><td class="num">${s.mx?s.mx+" gün":"—"}</td><td class="num">${s.dg}</td><td class="num">${s.kp}</td><td class="num">%${Math.round(s.kp/s.n*100)}</td></tr>`).join("")}</table></div>
 <div class="spread" style="margin-bottom:12px"><div class="seg">${[["acik","Açık"],["gecikti","Geciken"],["dogrulamada","Doğrulamada"],["kapandi","Kapanan"],["tum","Tümü"]].map(x=>`<button class="${flt===x[0]?"on":""}" data-act="filter" data-f="${x[0]}">${x[1]}</button>`).join("")}</div><select class="input" id="birim" data-act-change="birim" style="max-width:280px" aria-label="Birime göre süz"><option value="">Tüm birimler</option>${birims.map(bi=>`<option ${S.ui.birim===bi?"selected":""}>${esc(bi)}</option>`).join("")}</select></div>
 <div class="tw"><table class="t"><tr><th>Bulgu</th><th>Denetlenen birim</th><th>Denetim</th><th>Önem</th><th>Durum</th><th>Termin</th><th>Birimdeki eylem sorumlusu</th><th></th></tr>${fs.map(f=>{const a=audit(f.auditId); return `<tr><td><span class="mono small">${esc(fcode(f))}</span><div><button class="btn ghost" style="padding:0;text-align:left;white-space:normal" data-act="go" data-v="bulgu" data-id="${f.id}" data-tab="takip"><b>${esc(f.konu)}</b></button></div></td><td>${esc(f.birim)}</td><td>${esc(a.surec)}<div>${stageChip(a)}</div></td><td>${onemChip(onemOf(f))}</td><td>${fChip(f)}</td><td class="num">${fmt(f.termin)}${f.status!=="kapandi"&&f.termin?"<div>"+dayTxt(f.termin)+"</div>":""}</td><td>${esc((f.ek10.eylemler[0]||{}).sorumlu||"—")}</td><td><div class="btns">${act(f)}</div></td></tr>`;}).join("")||`<tr><td colspan="8" class="muted">Bu filtrede bulgu yok.</td></tr>`}</table></div>`;
}
/* ---- Plan ---- */
function renderPlan(){
 const kap = 1888, denetci = S.users.filter(u=>u.role!=="mudur").length;
 const dKap = Math.round(kap*.65*denetci), cKap=Math.round(kap*.15*denetci);
 const dPlan = S.plan.filter(p=>p.tur==="D").reduce((t,p)=>t+p.saat,0), cPlan=S.plan.filter(p=>p.tur==="C").reduce((t,p)=>t+p.saat,0);
 const bar=(l,v,m)=>`<div><div class="spread small"><span>${l}</span><span class="mono">${v.toLocaleString("tr-TR")} / ${m.toLocaleString("tr-TR")} saat</span></div><div class="progress" style="height:10px;margin-top:4px"><i style="width:${Math.min(100,Math.round(v/m*100))}%;${v>m?"background:var(--crit)":""}"></i></div></div>`;
 const tespit=S.tasks.filter(t=>t.tespit);
 return topbar("2026 Denetim Planı",null,`<button class="btn pri" data-act="yeni">Yeni denetim</button>`) + `<div class="notice info" style="margin-bottom:14px">Örnek plan. Faz 2'de makro risk değerlendirmesi (45 alt süreç, 6 risk faktörü) ve yıllık puanlama bu ekrandan yönetilir.</div>
 <div class="card grid2" style="margin-bottom:14px">${bar("Denetim kapasitesi (%65)",dPlan,dKap)}${bar("Danışmanlık kapasitesi (%15)",cPlan,cKap)}<p class="small muted" style="margin:0;grid-column:1/-1">${denetci} denetçi × 1.888 saat/yıl. Eğitim, izleme, yönetim ve ihtiyat için %5'er ayrılır.</p></div>
 ${tespit.length?`<div class="card" style="margin-bottom:14px"><div class="card-head"><h2>Sürekli denetimden gelen tespitler</h2></div>${tespit.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.tespit)}</b><div class="li-sub">${esc(t.baslik)} · ${esc(t.surekli?t.surekli.alan:"")}</div></div></div>`).join("")}</div>`:""}
 <div class="tw"><table class="t"><tr><th>Süreç</th><th>Fonksiyon</th><th>Makro puan</th><th>Risk düzeyi</th><th>Tür</th><th>Saat</th><th>Durum</th></tr>${S.plan.slice().sort((a,b)=>b.puan-a.puan).map(p=>{ const as=S.audits.filter(a=>a.planId===p.id&&a.no.startsWith("2026"));
  return `<tr><td><b>${esc(p.surec)}</b></td><td>${esc(p.fonksiyon)}</td><td class="num">${num2(p.puan)}</td><td>${onemChip(p.duzey)}</td><td>${p.tur==="C"?"Danışmanlık":"Denetim"}</td><td class="num">${p.saat}</td><td>${as.length?as.map(a=>`<button class="btn sm ghost" data-act="go" data-v="audit" data-id="${a.id}"><span class="mono">${a.no}</span></button>`).join(""):isMudur()?`<button class="btn sm" data-act="openAudit" data-p="${p.id}">Denetimi aç</button>`:`<span class="muted small">Planlandı</span>`}</td></tr>`;}).join("")}</table></div>`;
}

/* ---- Performans ---- */
function renderPerf(){
 const people = S.users.filter(u=>u.role!=="mudur" && (isMudur()||u.id===S.me));
 const rows = people.map(u=>{
  const ts=S.tasks.filter(t=>t.sorumlu===u.id&&t.puan), avg=ts.length?ts.reduce((s,t)=>s+t.puan,0)/ts.length:null;
  const e14=[]; S.audits.forEach(a=>{ const d=(a.forms.EK14||{}).data||{}; if(d[u.id]&&d[u.id].c) d[u.id].c.forEach(v=>v!=null&&e14.push(4-v)); });
  const done=S.tasks.filter(t=>t.sorumlu===u.id&&t.durum==="kapandi"), onTime=done.filter(t=>!t.bitis||t.bitis<=t.termin).length;
  const cks=S.audits.reduce((n,a)=>n+a.ek4.filter(w=>w.hazirlayan===u.id).length,0);
  return `<tr><td><b>${esc(u.name)}</b><div class="li-sub">${esc(u.title)}</div></td><td class="num">${avg?num2(avg)+" / 5":"—"} <span class="muted">(${ts.length})</span></td><td class="num">${e14.length?num2(e14.reduce((a,b)=>a+b,0)/e14.length)+" / 4":"—"}</td><td class="num">${done.length?"%"+Math.round(onTime/done.length*100):"—"}</td><td class="num">${cks}</td></tr>`; }).join("");
 const notes = S.tasks.filter(t=>t.puan&&(isMudur()||t.sorumlu===S.me)).slice(0,8);
 return topbar("Denetçi Performansı") + `<div class="tw" style="margin-bottom:16px"><table class="t"><tr><th>Denetçi</th><th>Görev puanı ort.</th><th>EK-14 ort.</th><th>Zamanında tamamlanan görev</th><th>Çalışma kağıdı</th></tr>${rows}</table></div>
 <div class="card"><div class="card-head"><h2>Son puanlanan görevler</h2>${isMudur()?"":`<span class="small muted">Yalnızca kendi puanlarınızı görürsünüz</span>`}</div>${notes.map(t=>`<div class="li"><div class="li-main"><b>${esc(t.baslik)}</b><div class="li-sub">${esc(user(t.sorumlu).name)} · ${taskCtx(t)}${t.yorum?" · "+esc(t.yorum):""}</div></div><span class="mono">${t.puan} / 5</span></div>`).join("")}</div>`;
}
function renderLog(){
 if(!isMudur()) return topbar("Değişiklik Kaydı")+`<div class="card empty">Bu kaydı yalnızca müdür görür.</div>`;
 return topbar("Değişiklik Kaydı") + `<p class="muted" style="margin-top:0">Kayıtlar silinemez. Kim, neyi, ne zaman değiştirdi.</p><div class="tw"><table class="t"><tr><th>Zaman</th><th>Kullanıcı</th><th>İşlem</th></tr>${S.log.map(l=>`<tr><td class="num">${esc(fmt(l.at.slice(0,10)))} ${esc(l.at.slice(11))}</td><td>${esc(user(l.by).name)}</td><td>${esc(l.text)}</td></tr>`).join("")}</table></div>`;
}

/* ---- Çerçeve ---- */
function renderDrawer(){
 const ns=S.notifs.filter(n=>n.to===S.me);
 return `<div class="drawer" role="dialog" aria-label="Bildirimler"><div class="modal-h"><h3>Bildirimler</h3><div class="btns"><button class="btn sm" data-act="readAll">Tümünü okundu say</button><button class="btn sm ghost" data-act="drawer" aria-label="Kapat">Kapat</button></div></div>
  <div class="modal-b" style="gap:0">${ns.length?ns.map(n=>`<div class="li" data-act="notif" data-id="${n.id}" style="cursor:pointer"><div class="li-main"><div style="${n.read?"":"font-weight:600"}">${esc(n.text)}</div><div class="li-sub">${fmt(n.at)}${mailEtiket(n)?" · "+mailEtiket(n):""}</div></div>${n.read?"":`<span class="chip c-acc nodot">Yeni</span>`}</div>`).join(""):`<div class="empty">Bildirim yok.</div>`}</div></div>`;
}
function render(){
 const views={panel:renderPanel,audits:renderAudits,audit:renderAudit,form:renderForm,bulgu:renderBulgu,tasks:renderTasks,surekli:renderSurekli,findings:renderFindings,plan:renderPlan,perf:renderPerf,yeni:renderYeni,log:renderLog};
 const main=(views[S.ui.v]||renderPanel)();
 document.getElementById("root").innerHTML = `<div class="app">${renderSide()}<main class="main" id="main">${main}</main></div>` + (DRAWER?renderDrawer():"") +
  (MODAL?`<div class="scrim" data-act="scrim"><div class="modal ${MODAL.wide?"wide":""}" role="dialog" aria-modal="true" aria-label="${esc(MODAL.title)}"><div class="modal-h"><h3>${esc(MODAL.title)}</h3><button class="btn sm ghost" data-act="closeModal" aria-label="Kapat">Kapat</button></div><div class="modal-b">${MODAL.body}</div>${MODAL.foot?`<div class="modal-f">${MODAL.foot}</div>`:""}</div></div>`:"");
}
