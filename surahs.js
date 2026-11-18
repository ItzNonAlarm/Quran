/* ===== جدول السور: [الرقم، الاسم، عدد الآيات] بترتيب المصحف ===== */
const SURAHS=[
[1,'الفاتحة',7],
[2,'البقرة',286],
[3,'آل عمران',200],
[4,'النساء',176],
[5,'المائدة',120],
[6,'الأنعام',165],
[7,'الأعراف',206],
[8,'الأنفال',75],
[9,'التوبة',129],
[10,'يونس',109],
[11,'هود',123],
[12,'يوسف',111],
[13,'الرعد',43],
[14,'إبراهيم',52],
[15,'الحجر',99],
[16,'النحل',128],
[17,'الإسراء',111],
[18,'الكهف',110],
[19,'مريم',98],
[20,'طه',135],
[21,'الأنبياء',112],
[22,'الحج',78],
[23,'المؤمنون',118],
[24,'النور',64],
[25,'الفرقان',77],
[26,'الشعراء',227],
[27,'النمل',93],
[28,'القصص',88],
[29,'العنكبوت',69],
[30,'الروم',60],
[31,'لقمان',34],
[32,'السجدة',30],
[33,'الأحزاب',73],
[34,'سبأ',54],
[35,'فاطر',45],
[36,'يس',83],
[37,'الصافات',182],
[38,'ص',88],
[39,'الزمر',75],
[40,'غافر',85],
[41,'فصلت',54],
[42,'الشورى',53],
[43,'الزخرف',89],
[44,'الدخان',59],
[45,'الجاثية',37],
[46,'الأحقاف',35],
[47,'محمد',38],
[48,'الفتح',29],
[49,'الحجرات',18],
[50,'ق',45],
[51,'الذاريات',60],
[52,'الطور',49],
[53,'النجم',62],
[54,'القمر',55],
[55,'الرحمن',78],
[56,'الواقعة',96],
[57,'الحديد',29],
[58,'المجادلة',22],
[59,'الحشر',24],
[60,'الممتحنة',13],
[61,'الصف',14],
[62,'الجمعة',11],
[63,'المنافقون',11],
[64,'التغابن',18],
[65,'الطلاق',12],
[66,'التحريم',12],
[67,'الملك',30],
[68,'القلم',52],
[69,'الحاقة',52],
[70,'المعارج',44],
[71,'نوح',28],
[72,'الجن',28],
[73,'المزمل',20],
[74,'المدثر',56],
[75,'القيامة',40],
[76,'الإنسان',31],
[77,'المرسلات',50],
[78,'النبأ',40],
[79,'النازعات',46],
[80,'عبس',42],
[81,'التكوير',29],
[82,'الانفطار',19],
[83,'المطففين',36],
[84,'الانشقاق',25],
[85,'البروج',22],
[86,'الطارق',17],
[87,'الأعلى',19],
[88,'الغاشية',26],
[89,'الفجر',30],
[90,'البلد',20],
[91,'الشمس',15],
[92,'الليل',21],
[93,'الضحى',11],
[94,'الشرح',8],
[95,'التين',8],
[96,'العلق',19],
[97,'القدر',5],
[98,'البينة',8],
[99,'الزلزلة',8],
[100,'العاديات',11],
[101,'القارعة',11],
[102,'التكاثر',8],
[103,'العصر',3],
[104,'الهمزة',9],
[105,'الفيل',5],
[106,'قريش',4],
[107,'الماعون',7],
[108,'الكوثر',3],
[109,'الكافرون',6],
[110,'النصر',3],
[111,'المسد',5],
[112,'الإخلاص',4],
[113,'الفلق',5],
[114,'الناس',6]
];
const SURAH_TOTAL=SURAHS.reduce((s,x)=>s+x[2],0);
/* الفاتحة: بسملتها آية أولى. التوبة: بلا بسملة. وغيرهما: بسملة قبل الآية الأولى */
const needsBism=c=>c!==1&&c!==9;
const BISM_TEXT="بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

/* بناء الصفحة: إطار اسم السورة + البسملة، ويزيد سطرًا عند الحاجة */
function buildPage(p,box){
  const pvl=[],seen={};let ml=0,prev=0,shift=0;
  const put=(n,row)=>{n.style.gridRow=row;box.appendChild(n)};
  D.pages[p-1].forEach(ln=>{
    const L=ln[0],ws=ln[1],f=ws[0];
    ws.forEach(w=>{
      const k=w[1]+":"+w[2];
      if(!seen[k]){seen[k]=1;pvl.push({c:w[1],v:w[2],key:k})}
    });
    if(f[2]===1&&f[3]===1){
      const n=needsBism(f[1])?2:1,g=L-prev-1;
      if(g<n)shift+=n-g;
      const row=L+shift;
      const b=document.createElement('div');b.className='banner';
      b.textContent="سورة "+(SURAHS[f[1]-1]?SURAHS[f[1]-1][1]:f[1]);
      put(b,row-n);
      if(n===2){
        const bs=document.createElement('div');bs.className='bism';
        bs.textContent=BISM_TEXT;
        put(bs,row-1);
      }
    }
    const d=document.createElement('div');d.className='line';
    ws.forEach(w=>{
      const s=document.createElement('span');
      s.className='w'+(w[4]?' e':'');
      s.dataset.k=w[1]+":"+w[2];
      s.textContent=w[4]?"﴿"+toAr(w[2])+"﴾":w[0];
      d.appendChild(s);
    });
    put(d,L+shift);
    ml=Math.max(ml,L+shift);prev=L;
  });
  return {pv:pvl,ml:ml};
}

/* ضبط الخط: الصفحة ١٥ سطرًا، أو ١٦ إن احتاجت بسملة إضافية */
function fitPane(o,W,H){
  const b=o.el,rh=H/Math.max(15,o.ml);
  b.style.setProperty('--rh',rh+'px');
  b.style.gridTemplateRows='repeat('+Math.max(o.ml,1)+',var(--rh))';
  b.style.setProperty('--fs','30px');
  const lines=b.querySelectorAll('.line'),nat=[];
  let max=0;
  lines.forEach(l=>{let s=0;l.childNodes.forEach(c=>s+=c.offsetWidth);nat.push(s);max=Math.max(max,s)});
  let fs=max>W?Math.floor(30*W/max*0.97):30;
  fs=Math.max(12,Math.min(fs,Math.floor(rh/1.5)));
  b.style.setProperty('--fs',fs+'px');
  lines.forEach((l,i)=>l.classList.toggle('mid',nat[i]*fs/30<0.7*W));
}

/* الفحص مقابل الجدول الثابت: الترتيب وعدد الآيات والمجموع */
function verifyQuran(){
  if(!D)return alert('حمّل المصحف أولًا');
  const bad=[],cnt={},seen={};let total=0,lastC=0;
  if(D.pages.length!==604)bad.push('عدد الصفحات '+D.pages.length+' بدل 604');
  D.pages.forEach((pg,i)=>{
    if(!pg||!pg.length)return bad.push('صفحة فارغة: '+(i+1));
    pg.forEach(ln=>ln[1].forEach(w=>{
      if(!w[4]&&!w[0])bad.push('كلمة فارغة في صفحة '+(i+1));
      if(w[1]<lastC)bad.push('ترتيب غير صحيح في صفحة '+(i+1));
      lastC=Math.max(lastC,w[1]);
      if(!w[4])return;
      const k=w[1]+':'+w[2];
      if(seen[k])bad.push('آية مكررة '+k);
      else{seen[k]=1;cnt[w[1]]=(cnt[w[1]]||0)+1;total++}
    }));
  });
  SURAHS.forEach((s,i)=>{
    const n=cnt[s[0]]||0;
    if(n!==s[2])bad.push('سورة '+s[1]+': وجدت '+n+' آية والمتوقع '+s[2]);
    for(let v=1;v<=s[2];v++)if(!seen[s[0]+':'+v]){bad.push('ناقصة: '+s[1]+' آية '+v);break}
    const c=D.ch[i];
    if(!c||c.id!==s[0]||c.verses_count!==s[2])bad.push('فهرس السور لا يطابق الجدول عند: '+s[1]);
  });
  if(total!==SURAH_TOTAL)bad.push('مجموع الآيات '+total+' بدل '+SURAH_TOTAL);
  alert(bad.length?('وجدت '+bad.length+' ملاحظة:\n'+bad.slice(0,12).join('\n')):'✓ الفحص سليم: ٦٠٤ صفحة، ١١٤ سورة بترتيبها، ٦٢٣٦ آية، ولا نقص ولا تكرار.');
 } 
/* ===== إصلاح آمن: استعادة + ترميم حسب ترتيب الآيات ===== */
function orderIssues(data){
  let prev=0,n=0;
  data.pages.forEach(pg=>(pg||[]).forEach(ln=>ln[1].forEach(w=>{
    const k=w[1]*1000+w[2];
    if(k<prev)n++;else prev=k;
  })));
  return n;
}
(function(){
  const m=document.getElementById('menu');
  if(!m)return;
  const mkb=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='display:block;margin:8px auto;font-size:13px';b.onclick=f;m.appendChild(b)};
  mkb('↩ استعادة المصحف قبل الإصلاح',()=>restoreQuran());
  mkb('♻ إعادة تحميل المصحف نظيفًا',()=>resetQuran());
})();
async function restoreQuran(){
  const bak=await dbGet('all_bak');
  if(!bak)return alert('لا توجد نسخة احتياطية. استخدم «إعادة تحميل المصحف نظيفًا».');
  if(orderIssues(bak))return alert('النسخة الاحتياطية نفسها مختلة. استخدم «إعادة تحميل المصحف نظيفًا».');
  if(!confirm('سأستعيد المصحف كما كان قبل الإصلاح. متابعة؟'))return;
  await dbSet('all',bak);VIDX=null;await init();
  alert('تمت الاستعادة. اضغط «فحص سلامة المصحف» للتأكد.');
}
async function resetQuran(){
  if(!confirm('سأحذف نص المصحف المحفوظ لتحمّله من جديد (الصوت المحفوظ لا يُحذف). متابعة؟'))return;
  await dbDel('all');await dbDel('all_bak');VIDX=null;D=null;await init();
}

const chunk=(a,n)=>{const r=[];for(let i=0;i<a.length;i+=n)r.push(a.slice(i,i+n));return r};
function findEnd(c,v){
  for(let pi=0;pi<D.pages.length;pi++){
    const pg=D.pages[pi];if(!pg)continue;
    for(let li=0;li<pg.length;li++){
      const ws=pg[li][1];
      for(let wi=0;wi<ws.length;wi++)if(ws[wi][4]&&ws[wi][1]===c&&ws[wi][2]===v)return [pi,li,wi];
    }
  }
  return null;
}
function insertAfter(pi,li,wi,words){
  const pg=D.pages[pi],ln=pg[li],L=ln[0];
  const rest=ln[1].splice(wi+1);
  const parts=chunk(words,7);
  if(rest.length)parts.push(rest);
  for(let k=li+1;k<pg.length;k++)pg[k][0]+=parts.length;
  pg.splice(li+1,0,...parts.map((p,i)=>[L+1+i,p]));
}
async function repairQuran(){
  const st=t=>{if(typeof rpStatus==='function')rpStatus(t)};
  if(!D)return alert('حمّل المصحف أولًا');
  if(!navigator.onLine)return alert('الإصلاح يحتاج إنترنت (مرة واحدة فقط).');
  if(orderIssues(D))return alert('المصحف المحفوظ مختل الترتيب بسبب الإصلاح القديم. اضغط «استعادة المصحف قبل الإصلاح» أولًا.');
  const have={};
  D.pages.forEach(pg=>(pg||[]).forEach(ln=>ln[1].forEach(w=>{if(w[4])have[w[1]+':'+w[2]]=1})));
  const miss=[];
  SURAHS.forEach(s=>{for(let v=1;v<=s[2];v++)if(!have[s[0]+':'+v])miss.push([s[0],v])});
  if(!miss.length)return alert('✓ لا توجد آيات ناقصة.');
  if(!confirm('وجدتُ '+miss.length+' آية ناقصة. سأجلبها وأضعها بعد الآية التي قبلها مباشرة. متابعة؟'))return;
  const got=[];let fail=0;
  for(let i=0;i<miss.length;i++){
    st('جلب الآيات: '+toAr(i+1)+' / '+toAr(miss.length));
    try{
      const [c,v]=miss[i];
      const j=await jget(API+'verses/by_key/'+c+':'+v+'?words=true&word_fields=text_uthmani');
      const ws=(j.verse.words||[]).slice().sort((a,b)=>a.position-b.position);
      if(!ws.length)throw 0;
      const w=ws.map(x=>[x.text_uthmani||'',c,v,x.position,x.char_type_name==='end'?1:0]);
      if(!w[w.length-1][4])w.push(['',c,v,w.length+1,1]);
      got.push({c:c,v:v,h:j.verse.hizb_number,j:j.verse.juz_number,w:w});
    }catch(e){fail++}
  }
  if(!got.length){st();return alert('تعذّر جلب الآيات. تأكد من الإنترنت وجرّب لاحقًا.')}
  st('جاري الترميم...');
  await dbSet('all_bak',D);
  let placed=0;
  got.forEach(g=>{
    const a=g.v>1?findEnd(g.c,g.v-1):null;
    if(!a){fail++;return}
    insertAfter(a[0],a[1],a[2],g.w);
    D.vi.push([g.c,g.v,g.h,g.j,a[0]+1]);
    placed++;
  });
  D.vi.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  await dbSet('all',D);VIDX=null;await init();st();
  alert('أُضيفت '+toAr(placed)+' آية'+(fail?(' وتعذّر '+toAr(fail)+'. اضغط الإصلاح مرة أخرى.'):'')+'. سأعيد الفحص.');
  verifyQuran();
        }
