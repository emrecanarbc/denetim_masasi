"use strict";
/* ============ E-posta bildirimleri ============
   Her bildirim (notify) kullanıcının tanımlı e-posta adresine de gönderilir.
   Tercihler: "anlik" (her bildirimde), "ozet" (günlük özet), "kapali".

   Prototipte gerçek gönderim için bir webhook tanımlanabilir. Örneğin Microsoft Power Automate:
     Tetikleyici "When a HTTP request is received" → eylem "Send an email (V2)".
   Webhook'a şu JSON gönderilir: {"to":"...","subject":"...","body":"...","html":"..."}
   Webhook tanımlı değilse e-postalar yalnızca "Giden e-postalar" kaydında görünür (demo).
   Kurumsal sürümde gönderim sunucu tarafında kurum e-posta sunucusu (SMTP / Exchange) üzerinden yapılır. */
const MAIL_AYAR = {
 webhook: "",                                  // ör. "https://prod-00.westeurope.logic.azure.com/workflows/..."
 gonderen: "Denetim Masası <denetim-masasi@ornek.example>",
 ozetSaati: "08:30"
};
const MAIL_TERCIH = {anlik:"Her bildirimde anında",ozet:"Günlük özet ("+MAIL_AYAR.ozetSaati+")",kapali:"E-posta gönderme"};
const VARSAYILAN_EPOSTA = {u1:"ayse.tan@ornek.example",u2:"burak.sen@ornek.example",u3:"can.yildiz@ornek.example",u4:"deniz.ak@ornek.example"};

function epostaMigrate(){
 S.mails = S.mails || [];
 S.users.forEach(u=>{ if(u.email==null) u.email=VARSAYILAN_EPOSTA[u.id]||""; if(!u.bildirim) u.bildirim="anlik"; });
}
epostaMigrate();

const mailKonu = text => "Denetim Masası: " + (text.length>80 ? text.slice(0,77)+"…" : text);
function mailGovde(u,satirlar){
 const adres = (typeof location!=="undefined" && /^https?:/.test(location.href)) ? location.href.split("#")[0] : "";
 return `Merhaba ${u.name.split(" ")[0]},\n\n${satirlar.map(s=>"• "+s).join("\n")}\n\n${adres?"Denetim Masası: "+adres+"\n\n":""}Bu e-posta Denetim Masası tarafından otomatik gönderildi. Bildirim tercihinizi Denetim Masası'nda "Profil ve e-posta" bölümünden değiştirebilirsiniz.`;
}
function mailHtml(govde){ return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.5;color:#162126">${esc(govde).replace(/\n/g,"<br>")}</div>`; }

async function webhookGonder(m){
 if(!MAIL_AYAR.webhook) return;
 try{
  await fetch(MAIL_AYAR.webhook,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify({to:m.email,subject:m.konu,body:m.govde,html:mailHtml(m.govde)})});
  m.durum="Gönderildi";
 }catch(e){ m.durum="Gönderilemedi"; }
 save();
}
function mailKaydet(u,konu,govde,tur){
 const m={id:uid("m"),to:u.id,email:u.email,konu,govde,at:nowStamp(),tur,durum:MAIL_AYAR.webhook?"Gönderiliyor":"Demo: kayda alındı"};
 S.mails.unshift(m); if(S.mails.length>300) S.mails.length=300;
 webhookGonder(m); return m;
}
/* notify() her bildirimde bunu çağırır; bildirim kaydına e-posta durumunu yazar */
function epostaBildir(n){
 const u=user(n.to); if(!u||!u.email||u.bildirim==="kapali"){ n.mail="yok"; return; }
 if(u.bildirim==="ozet"){ n.mail="ozet"; return; }
 mailKaydet(u,mailKonu(n.text),mailGovde(u,[n.text]),"anlik"); n.mail="gonderildi";
}
function ozetGonder(uid_){
 const u=user(uid_), bek=S.notifs.filter(n=>n.to===uid_&&n.mail==="ozet");
 if(!bek.length) return 0;
 mailKaydet(u,`Denetim Masası günlük özet: ${bek.length} yeni bildirim`,mailGovde(u,bek.map(n=>`${fmt(n.at)} · ${n.text}`)),"ozet");
 bek.forEach(n=>n.mail="ozet-gonderildi"); return bek.length;
}
const mailEtiket = n => ({gonderildi:"e-posta gönderildi",ozet:"günlük özete eklendi","ozet-gonderildi":"özet e-postasıyla gönderildi"})[n.mail]||"";

function profilModal(){
 const u=me(), ms=S.mails.filter(m=>m.to===u.id).slice(0,8), bek=S.notifs.filter(n=>n.to===u.id&&n.mail==="ozet").length;
 modal("Profil ve e-posta bildirimleri",`<div class="grid2"><div><span class="muted small">Kullanıcı</span><div><b>${esc(u.name)}</b> · ${esc(u.title)}</div></div><div><span class="muted small">Gönderen adres</span><div class="small">${esc(MAIL_AYAR.gonderen)}</div></div></div>
  <label class="field"><span>E-posta adresi</span><input class="input" type="email" id="pr-mail" value="${esc(u.email||"")}" placeholder="ad.soyad@kurum.com.tr"></label>
  <div class="field"><span>Bildirimler e-postayla</span><div class="stack" style="gap:6px">${Object.entries(MAIL_TERCIH).map(([k,l])=>`<label class="row"><input type="radio" name="pr-tercih" value="${k}" ${u.bildirim===k?"checked":""}> ${l}</label>`).join("")}</div></div>
  ${bek?`<div class="notice info"><div style="flex:1">Günlük özette bekleyen ${bek} bildirim var.</div><button class="btn sm" data-act="ozetSimdi">Özeti şimdi gönder</button></div>`:""}
  ${MAIL_AYAR.webhook?"":`<div class="notice warn"><div>Gerçek gönderim için <span class="mono">js/09-eposta-bildirimleri.js</span> dosyasında bir webhook tanımlanmalı. Şu an e-postalar yalnızca aşağıdaki kayıtta görünür.</div></div>`}
  <div><div class="section-label" style="margin-bottom:4px">Giden e-postalar</div>${ms.length?ms.map(m=>`<div class="li" data-act="mailGor" data-id="${m.id}" style="cursor:pointer"><div class="li-main"><div>${esc(m.konu)}</div><div class="li-sub">${esc(fmt(String(m.at).slice(0,10)))} ${esc(String(m.at).slice(11))} · ${esc(m.email)} · ${esc(m.durum)}</div></div><span class="chip nodot">Gör</span></div>`).join(""):`<div class="empty">Henüz e-posta gönderilmedi.</div>`}</div>`,
  `<button class="btn" data-act="closeModal">Kapat</button><button class="btn pri" data-act="profilKaydet">Kaydet</button>`,true);
}

const EPOSTA_ACT = {
 profil(){ profilModal(); },
 profilKaydet(){ const u=me(), e=val("pr-mail"), r=document.querySelector('input[name="pr-tercih"]:checked');
  if(e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return toast("Geçerli bir e-posta adresi yazın.");
  u.email=e; u.bildirim=r?r.value:"anlik"; log(`${u.name} e-posta bildirim ayarını güncelledi (${MAIL_TERCIH[u.bildirim]}).`); MODAL=null; commit("E-posta ayarları kaydedildi."); },
 ozetSimdi(){ const n=ozetGonder(S.me); save(); profilModal(); toast(`${n} bildirim tek e-postada gönderildi.`); },
 mailGor(d){ const m=S.mails.find(x=>x.id===d.id); if(!m) return;
  modal("E-posta önizleme",`<div class="card small"><div><span class="muted">Kime:</span> ${esc(user(m.to).name)} &lt;${esc(m.email)}&gt;</div><div><span class="muted">Kimden:</span> ${esc(MAIL_AYAR.gonderen)}</div><div><span class="muted">Konu:</span> <b>${esc(m.konu)}</b></div><div><span class="muted">Tarih:</span> ${esc(fmt(String(m.at).slice(0,10)))} ${esc(String(m.at).slice(11))} · ${esc(m.durum)}</div></div><div class="card" style="white-space:pre-wrap">${esc(m.govde)}</div>`,
   `<button class="btn" data-act="profil">Geri</button>`); }
};
