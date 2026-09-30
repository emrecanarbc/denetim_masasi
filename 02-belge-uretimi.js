"use strict";
/* ============ Belge üretimi (önizleme, Word, PDF) ============
   Blok modeli: {t:"org"}, {t:"title",text}, {t:"center",text,bold,size,color}, {t:"h1",text}, {t:"h2",text},
   {t:"p",text}, {t:"label",label,text}, {t:"kv",rows}, {t:"table",head,rows}, {t:"list",items}, {t:"sign",cols}, {t:"break"}, {t:"space",n} */
const ORG = "ÖRNEK DAĞITIM A.Ş.";

function blocksToHtml(blocks, opts){
 opts = opts||{};
 const pages=[[]];
 blocks.forEach(b=>{ if(b.t==="break") pages.push([]); else pages[pages.length-1].push(b); });
 const cell = v => esc(v==null?"":v);
 const one = b => {
  switch(b.t){
   case "org": return `<div class="d-center" style="font-weight:700;font-size:12px;margin-bottom:4px">${esc(ORG)} · İÇ DENETİM MÜDÜRLÜĞÜ</div>`;
   case "title": return `<div class="d-title">${esc(b.text)}</div>`;
   case "center": return `<div class="d-center${b.color?" d-red":""}" style="font-size:${b.size||12.5}px;${b.bold?"font-weight:700;":""}margin:${b.mt||0}px 0 ${b.mb==null?6:b.mb}px">${esc(b.text)}</div>`;
   case "h1": return `<div class="d-h1">${esc(b.text)}</div>`;
   case "h2": return `<div class="d-h2">${esc(b.text)}</div>`;
   case "p": return `<p class="d-p">${esc(b.text||"")}</p>`;
   case "label": return `<p class="d-p d-label"><b>${esc(b.label)}</b> ${esc(b.text||"")}</p>`;
   case "kv": return `<table class="d-table">${b.rows.map(r=>`<tr><td class="k" style="width:34%">${cell(r[0])}</td><td>${cell(r[1])}</td></tr>`).join("")}</table>`;
   case "table": return `<table class="d-table"><tr>${b.head.map(h=>`<th>${cell(h)}</th>`).join("")}</tr>${b.rows.map(r=>`<tr>${r.map(c=>`<td>${cell(c)}</td>`).join("")}</tr>`).join("")}</table>`;
   case "list": return `<ul class="d-list">${b.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
   case "sign": return `<div class="d-sign">${b.cols.map(c=>`<div>${esc(c[0])}<br>${esc(c[1]||"")}<br><span style="font-style:normal;font-weight:700">İMZA</span></div>`).join("")}</div>`;
   case "space": return `<div style="height:${(b.n||1)*24}px"></div>`;
  }
  return "";
 };
 return pages.map(p=>`<div class="docpage${opts.pdf?" pdf":""}">${opts.wm?`<div class="wm">GİZLİ</div>`:""}${p.map(one).join("")}</div>`).join(opts.pdf?`<div class="html2pdf__page-break"></div>`:"");
}

/* ---- DOCX ---- */
const xesc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function wRun(text,o){
 o=o||{};
 const rpr = `<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>${o.bold?"<w:b/>":""}${o.italic?"<w:i/>":""}${o.color?`<w:color w:val="${o.color}"/>`:""}<w:sz w:val="${o.sz||22}"/></w:rPr>`;
 const lines = String(text==null?"":text).split("\n");
 return lines.map((l,i)=>`<w:r>${rpr}${i?"<w:br/>":""}<w:t xml:space="preserve">${xesc(l)}</w:t></w:r>`).join("");
}
function wP(runs,o){
 o=o||{};
 return `<w:p><w:pPr>${o.keep?"<w:keepNext/>":""}<w:spacing w:before="${o.before||0}" w:after="${o.after==null?120:o.after}"/>${o.jc?`<w:jc w:val="${o.jc}"/>`:""}</w:pPr>${runs}</w:p>`;
}
function wTable(rows,o){
 o=o||{};
 const n = Math.max(...rows.map(r=>r.length)); const total=9638;
 const widths = o.widths || Array(n).fill(Math.floor(total/n));
 const b = o.noBorder ? "nil" : "single";
 const borders = ["top","left","bottom","right","insideH","insideV"].map(k=>`<w:${k} w:val="${b}" w:sz="4" w:space="0" w:color="8F999C"/>`).join("");
 const tr = rows.map((r,ri)=>`<w:tr>${r.map((c,ci)=>{
   const shade = (o.header&&ri===0)||(o.keyCol&&ci===0);
   return `<w:tc><w:tcPr><w:tcW w:w="${widths[ci]||widths[0]}" w:type="dxa"/>${shade&&!o.noBorder?`<w:shd w:val="clear" w:color="auto" w:fill="E9EEF0"/>`:""}</w:tcPr>${wP(wRun(c,{bold:shade||(o.boldAll),sz:o.sz||20,italic:o.italic}),{after:40,jc:o.jc})}</w:tc>`;}).join("")}</w:tr>`).join("");
 return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${tr}</w:tbl>${wP("",{after:120})}`;
}
function blocksToDocxXml(blocks){
 const body = blocks.map(b=>{
  switch(b.t){
   case "org": return wP(wRun(ORG+" · İÇ DENETİM MÜDÜRLÜĞÜ",{bold:true,sz:20}),{jc:"center",after:60});
   case "title": return wP(wRun(b.text,{bold:true,sz:28}),{jc:"center",after:240});
   case "center": return wP(wRun(b.text,{bold:b.bold,sz:Math.round((b.size||12.5)*1.7),color:b.color?"C00000":null}),{jc:"center",before:(b.mt||0)*15,after:b.mb==null?120:b.mb*15});
   case "h1": return wP(wRun(b.text,{bold:true,sz:24}),{before:240,after:120,keep:true});
   case "h2": return wP(wRun(b.text,{bold:true,sz:22}),{before:160,after:80,keep:true});
   case "p": return wP(wRun(b.text||""));
   case "label": return wP(wRun(b.label+" ",{bold:true})+wRun(b.text||""));
   case "kv": return wTable(b.rows,{keyCol:true,widths:[3277,6361]});
   case "table": return wTable([b.head,...b.rows],{header:true,sz:18});
   case "list": return b.items.map(i=>wP(wRun("•  "+i),{after:60})).join("");
   case "sign": return wTable([b.cols.map(c=>c[0]),b.cols.map(c=>c[1]||""),b.cols.map(()=>"İMZA")],{noBorder:true,jc:"center",italic:true});
   case "break": return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
   case "space": return wP("",{after:(b.n||1)*240});
  }
  return "";
 }).join("");
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
async function buildDocx(blocks){
 if(!window.JSZip) throw new Error("Word kütüphanesi yüklenemedi.");
 const z = new JSZip();
 z.file("[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
 z.file("_rels/.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
 z.file("word/document.xml",blocksToDocxXml(blocks));
 return await z.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
}
async function buildPdf(blocks,wm){
 if(!window.html2pdf) throw new Error("PDF kütüphanesi yüklenemedi.");
 const host=document.createElement("div");
 host.style.cssText="position:fixed;left:-10000px;top:0;width:794px;background:#fff";
 host.innerHTML=`<div class="docroot">${blocksToHtml(blocks,{pdf:true})}</div>`;
 document.body.appendChild(host);
 try{
  const pdf = await html2pdf().set({margin:[14,12,14,12],image:{type:"jpeg",quality:0.96},html2canvas:{scale:2,backgroundColor:"#ffffff"},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},pagebreak:{mode:["css","legacy"],avoid:["tr",".d-p",".d-h1",".d-h2"]}}).from(host.firstChild).toPdf().get("pdf");
  const n = pdf.internal.getNumberOfPages();
  if(wm){
   const c=document.createElement("canvas"); c.width=1400; c.height=520; const g=c.getContext("2d");
   g.fillStyle="rgba(0,0,0,0.07)"; g.font="700 300px 'IBM Plex Sans', Arial, sans-serif"; g.textAlign="center"; g.textBaseline="middle"; g.fillText("GİZLİ",700,270);
   const img=c.toDataURL("image/png");
   for(let i=1;i<=n;i++){ pdf.setPage(i); pdf.addImage(img,"PNG",20,110,170,63); }
  }
  for(let i=1;i<=n;i++){ pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(120); pdf.text(i+" / "+n,200,290,{align:"right"}); }
  return pdf.output("blob");
 } finally { host.remove(); }
}
let _dl=null;
async function getDownloads(){
 if(_dl) return _dl;
 try{ _dl = (window.claude && window.claude.use) ? await window.claude.use("downloads") : null; }catch(e){ _dl=null; }
 return _dl;
}
async function exportDoc(name, blocks, kind, wm){
 const safe = name.replace(/[\\/:*?"<>|]/g,"-");
 const filename = safe + (kind==="pdf"?".pdf":".docx");
 let blob;
 try{ toast(kind==="pdf"?"PDF hazırlanıyor…":"Word dosyası hazırlanıyor…"); blob = kind==="pdf" ? await buildPdf(blocks,wm) : await buildDocx(blocks); }
 catch(e){ toast("Dosya oluşturulamadı: "+e.message); return; }
 const dl = await getDownloads();
 if(!dl){ try{ const u=URL.createObjectURL(blob), x=document.createElement("a"); x.href=u; x.download=filename; document.body.appendChild(x); x.click(); x.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); toast(filename+" indirildi."); }catch(e){ openPreview(name,blocks,wm,"Dosya indirilemedi. Belgenin önizlemesi aşağıda."); } return; }
 try{ await dl.save({filename,data:blob}); toast(filename+" kaydedildi."); }
 catch(e){
  const c=e&&e.code;
  if(c==="declined") toast("İndirme iptal edildi.");
  else if(c==="rate_limited") toast("Açık bir indirme onayı var; biraz sonra tekrar deneyin.");
  else openPreview(name,blocks,wm,"Dosya bu görünümde kaydedilemedi. Belgenin önizlemesi aşağıda.");
 }
}
