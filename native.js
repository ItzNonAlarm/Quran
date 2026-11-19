/* native.js: مصحف مضمَّن + أذان في الخلفية + ضبط الأسطر */
const NAT=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const LN=NAT&&Capacitor.Plugins&&Capacitor.Plugins.LocalNotifications;

/* 1) المصحف داخل التطبيق: لا تحميل ولا إصلاح */
async function init(){
  try{D=await (await fetch('quran-data.json')).json()}catch(e){D=await dbGet('all')}
  if(!D){el('dlst').textContent='ملف المصحف غير موجود داخل التطبيق.';return}
  byId={};VM={};chJuz={};jmap={};
  D.ch.forEach(c=>byId[c.id]=c);
  D.vi.forEach(x=>{
    VM[x[0]+':'+x[1]]={h:x[2],j:x[3],p:x[4]};
    (chJuz[x[0]]=chJuz[x[0]]||{})[x[3]]=1;
    const a=(jmap[x[3]]=jmap[x[3]]||[]);
    if(a[a.length-1]!==x[0])a.push(x[0]);
  });
  el('dlcard').style.display='none';el('menu').style.display='block';
  [...el('menu').querySelectorAll('button')].forEach(b=>{if(/^(🛠|↩|♻)/.test(b.textContent))b.remove()});
  const s=saved();el('resume').style.display=s?'flex':'none';
  if(s)el('rlbl').textContent='متابعة القراءة · صفحة '+toAr(s);
}
(()=>{const l=document.createElement('link');l.rel='stylesheet';l.href='font.css';l.onload=()=>setTimeout(fitAll,60);document.head.appendChild(l)})();

/* 2) البسملة لكل سورة عدا التوبة (والفاتحة بسملتها آية) */
function buildPage(p,box){
  const pvl=[],seen={};let ml=0,prev=0,shift=0;
  const put=(n,row)=>{n.style.gridRow=row;box.appendChild(n)};
  D.pages[p-1].forEach(ln=>{
    const L=ln[0],ws=ln[1],f=ws[0];
    ws.forEach(w=>{const k=w[1]+':'+w[2];if(!seen[k]){seen[k]=1;pvl.push({c:w[1],v:w[2],key:k})}});
    if(f[2]===1&&f[3]===1){
      const n=(f[1]!==1&&f[1]!==9)?2:1,g=L-prev-1;
      if(g<n)shift+=n-g;
      const row=L+shift,b=document.createElement('div');b.className='banner';
      b.textContent='سورة '+byId[f[1]].name_arabic;put(b,row-n);
      if(n===2){const bs=document.createElement('div');bs.className='bism';bs.textContent='بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';put(bs,row-1)}
    }
    const d=document.createElement('div');d.className='line';
    ws.forEach(w=>{
      const s=document.createElement('span');s.className='w'+(w[4]?' e':'');
      s.dataset.k=w[1]+':'+w[2];s.textContent=w[4]?'﴿'+toAr(w[2])+'﴾':w[0];d.appendChild(s);
    });
    put(d,L+shift);ml=Math.max(ml,L+shift);prev=L;
  });
  return {pv:pvl,ml:ml};
}

/* 3) ضبط الأسطر: كل سطر يُكبَّر قليلًا ليملأ العرض بدل الفراغات الواسعة */
function fitPane(o,W,H){
  const b=o.el,rh=H/Math.max(15,o.ml),BASE=30;
  b.style.setProperty('--rh',rh+'px');
  b.style.gridTemplateRows='repeat('+Math.max(o.ml,1)+',var(--rh))';
  b.style.setProperty('--fs',BASE+'px');
  const L=[...b.querySelectorAll('.line')];
  L.forEach(l=>{l.style.fontSize='';l.classList.remove('mid')});
  const nat=L.map(l=>{let s=0;l.childNodes.forEach(c=>s+=c.offsetWidth);return s});
  const fs=Math.max(12,Math.min(Math.floor(BASE*Math.min(1,W/Math.max(...nat,1))*0.985),Math.floor(rh/1.5)));
  b.style.setProperty('--fs',fs+'px');
  L.forEach((l,i)=>{
    const n=nat[i]*fs/BASE;
    if(n<0.72*W)return l.classList.add('mid');
    const k=Math.min(W*0.985/n,1.14,(rh/1.3)/fs);
    if(k>1.01)l.style.fontSize=(fs*k).toFixed(1)+'px';
  });
}

/* 4) فحص السلامة مقابل فهرس السور */
function verifyQuran(){
  if(!D)return alert('المصحف غير محمّل');
  const bad=[],cnt={},seen={};let total=0;
  D.pages.forEach((pg,i)=>{
    if(!pg||!pg.length)return bad.push('صفحة فارغة '+(i+1));
    pg.forEach(ln=>ln[1].forEach(w=>{
      if(!w[4]&&!w[0])bad.push('كلمة فارغة في صفحة '+(i+1));
      if(!w[4])return;
      const k=w[1]+':'+w[2];
      if(seen[k])bad.push('آية مكررة '+k);else{seen[k]=1;cnt[w[1]]=(cnt[w[1]]||0)+1;total++}
    }));
  });
  D.ch.forEach(c=>{if((cnt[c.id]||0)!==c.verses_count)bad.push('سورة '+c.name_arabic+': '+(cnt[c.id]||0)+' من '+c.verses_count)});
  if(total!==6236)bad.push('المجموع '+total+' بدل 6236');
  alert(bad.length?'وجدت '+bad.length+' ملاحظة:\n'+bad.slice(0,10).join('\n'):'✓ الفحص سليم: 604 صفحة، 114 سورة، 6236 آية.');
}

/* 5) الأذان في الخلفية: إشعارات مجدولة بصوت الأذان (14 يومًا، وتتجدد عند فتح التطبيق) */
let SIG='',READY=false;
async function nativeReady(){
  if(READY||!LN)return;READY=true;
  try{
    await LN.requestPermissions();
    const ch=(id,name,sound)=>LN.createChannel({id,name,description:'تنبيه أوقات الصلاة',sound,importance:5,visibility:1,vibration:true});
    await ch('adhan','الأذان','adhan');await ch('fajr','أذان الفجر','adhan_fajr');
  }catch(e){}
}
async function scheduleAdhan(){
  if(!LN||!PS.loc)return;
  try{
    await nativeReady();
    const pend=await LN.getPending();
    if(pend.notifications.length)await LN.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
    const list=[],now=Date.now();
    for(let d=0;d<14;d++){
      const t=ptimes(new Date(now+d*864e5));
      PK.forEach((k,i)=>{
        if(PS.al[k]&&+t[k]>now+5000)list.push({id:1000+d*10+i,title:'🕌 حان وقت صلاة '+PN[k],body:PM[PS.method].n,schedule:{at:t[k],allowWhileIdle:true},channelId:k==='fajr'?'fajr':'adhan',smallIcon:'ic_stat_adhan'});
      });
    }
    if(list.length)await LN.schedule({notifications:list});
  }catch(e){}
}
if(NAT){
  ring=function(){};
  setInterval(()=>{const s=JSON.stringify([PS.loc,PS.method,PS.asr,PS.al]);if(s!==SIG){SIG=s;scheduleAdhan()}},3000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleAdhan()});
  const s=document.querySelector('#adhanp .sub');
  if(s)s.textContent='يصلك الأذان كإشعار بصوت الأذان حتى والتطبيق مغلق. فعّل 🔊 بجانب كل صلاة في الرئيسية. في هونر: الإعدادات ← البطارية ← تشغيل التطبيقات ← القرآني ← إدارة يدوية، وفعّل التشغيل التلقائي والخلفية.';
}
init();
