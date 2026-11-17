(function(){
  const m=document.getElementById('menu');
  if(!m)return;
  const b=document.createElement('button');
  b.textContent='🛠 إصلاح الآيات الناقصة';
  b.style.cssText='display:block;margin:8px auto;font-size:13px';
  b.onclick=()=>repairQuran();
  m.appendChild(b);
})();

function rpStatus(t){
  let d=document.getElementById('rpmsg');
  if(!t){if(d)d.remove();return}
  if(!d){d=document.createElement('div');d.id='rpmsg';d.className='ptoast';document.body.appendChild(d)}
  d.textContent=t;
}

async function repairQuran(){
  if(!D)return alert('حمّل المصحف أولًا');
  if(!navigator.onLine)return alert('الإصلاح يحتاج إنترنت (مرة واحدة فقط).');
  const seen={};
  D.pages.forEach(pg=>(pg||[]).forEach(ln=>ln[1].forEach(w=>{if(w[4])seen[w[1]+':'+w[2]]=1})));
  const miss=[];
  D.ch.forEach(c=>{for(let v=1;v<=c.verses_count;v++)if(!seen[c.id+':'+v])miss.push([c.id,v])});
  if(!miss.length)return alert('✓ لا توجد آيات ناقصة.');
  if(!confirm('وجدتُ '+miss.length+' آية ناقصة. سأجلبها من الإنترنت وأصلح المصحف المحفوظ. متابعة؟'))return;
  const got=[];let fail=0;
  for(let i=0;i<miss.length;i++){
    rpStatus('جلب الآيات الناقصة: '+toAr(i+1)+' / '+toAr(miss.length));
    try{
      const j=await jget(API+'verses/by_key/'+miss[i][0]+':'+miss[i][1]+'?words=true&word_fields=text_uthmani,line_number,page_number');
      if(!j.verse||!(j.verse.words||[]).length)throw 0;
      got.push(j.verse);
    }catch(e){fail++}
  }
  if(!got.length){rpStatus();return alert('تعذّر جلب الآيات. تأكد من الإنترنت وجرّب لاحقًا.')}
  rpStatus('جاري الإصلاح والحفظ...');
  try{await dbSet('all_bak',D)}catch(e){}
  const ok=new Set(got.map(v=>v.verse_key));
  D.pages.forEach(pg=>{
    if(!pg)return;
    for(let i=pg.length-1;i>=0;i--){
      pg[i][1]=pg[i][1].filter(w=>!ok.has(w[1]+':'+w[2]));
      if(!pg[i][1].length)pg.splice(i,1);
    }
  });
  const touched=new Set();
  const have=new Set(D.vi.map(x=>x[0]+':'+x[1]));
  got.forEach(v=>{
    const k=v.verse_key.split(':'),c=+k[0],n=+k[1];
    v.words.forEach(w=>{
      const p=w.page_number||v.page_number;
      if(!p||p<1||p>604)return;
      const L=w.line_number||1;
      const pg=D.pages[p-1]=D.pages[p-1]||[];
      let ln=pg.find(x=>x[0]===L);
      if(!ln){ln=[L,[]];pg.push(ln);pg.sort((a,b)=>a[0]-b[0])}
      ln[1].push([w.text_uthmani||'',c,n,w.position,w.char_type_name==='end'?1:0]);
      touched.add(ln);
    });
    if(!have.has(v.verse_key))D.vi.push([c,n,v.hizb_number,v.juz_number,v.page_number]);
  });
  touched.forEach(ln=>ln[1].sort((a,b)=>a[1]-b[1]||a[2]-b[2]||a[3]-b[3]));
  D.vi.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  await dbSet('all',D);
  VIDX=null;
  await init();
  rpStatus();
  alert('تم إصلاح '+toAr(got.length)+' آية'+(fail?(' وتعذّر '+toAr(fail)+' آية. اضغط الإصلاح مرة أخرى لإكمالها.'):'')+'. سأعيد الفحص الآن.');
  verifyQuran();
         }
