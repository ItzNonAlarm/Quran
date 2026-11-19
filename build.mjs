import fs from 'node:fs';
import path from 'node:path';
const API='https://api.quran.com/api/v4/';
const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const die=m=>{console.error('❌ '+m);process.exit(1)};
async function jget(u){let e;for(let i=0;i<6;i++){try{const r=await fetch(u);if(r.ok)return await r.json();e=new Error(r.status+' '+u)}catch(x){e=x}await sleep(1500*(i+1))}throw e}

async function web(){
  fs.rmSync('www',{recursive:true,force:true});fs.mkdirSync('www');
  if(COUNTS.length!==114||COUNTS.reduce((a,b)=>a+b)!==6236)die('جدول الأعداد الداخلي خاطئ');
  const chs=(await jget(API+'chapters?language=ar')).chapters;
  if(chs.length!==114)die('عدد السور من الخدمة '+chs.length);
  const res=new Array(114);let nx=0;
  async function chap(i){
    const all=new Map();let extra='';
    for(let p=1;p<=30;p++){
      const u=`${API}verses/by_chapter/${i+1}?words=true&word_fields=text_uthmani,line_number,page_number&per_page=50&page=${p}`;
      let j=await jget(u+extra);
      if(p===1&&j.verses[0]&&!j.verses[0].juz_number){extra='&fields=juz_number,hizb_number,page_number';j=await jget(u+extra)}
      j.verses.forEach(v=>all.set(+v.verse_key.split(':')[1],v));
      if(!j.pagination||!j.pagination.next_page)break;
    }
    return all;
  }
  await Promise.all([0,1,2].map(async()=>{for(;;){const i=nx++;if(i>=114)return;res[i]=await chap(i);console.log('سورة',i+1)}}));
  const pg=Array.from({length:604},()=>({})),vi=[],ch=[],bad=[];
  for(let i=0;i<114;i++){
    const c=chs[i],m=res[i],exp=COUNTS[i];let first=0,last=0;
    if(m.size!==exp)bad.push(`${c.name_arabic}: ${m.size} آية والمتوقع ${exp}`);
    if(c.verses_count!==exp)bad.push(`فهرس الخدمة لسورة ${c.name_arabic}: ${c.verses_count}`);
    for(let n=1;n<=exp;n++){
      const v=m.get(n);
      if(!v){bad.push(`ناقصة ${i+1}:${n}`);continue}
      const ws=(v.words||[]).slice().sort((a,b)=>a.position-b.position);
      if(!ws.length||ws[ws.length-1].char_type_name!=='end'){bad.push(`آية بلا خاتمة ${i+1}:${n}`);continue}
      if(!v.hizb_number||!v.juz_number)bad.push(`بلا جزء/حزب ${i+1}:${n}`);
      ws.forEach(w=>{
        const p=w.page_number||v.page_number,l=w.line_number,e=w.char_type_name==='end'?1:0;
        if(!(p>=1&&p<=604&&l>=1&&l<=15)){bad.push(`موضع خاطئ ${i+1}:${n}`);return}
        if(!e&&!w.text_uthmani)bad.push(`كلمة فارغة ${i+1}:${n}`);
        (pg[p-1][l]=pg[p-1][l]||[]).push([w.text_uthmani||'',i+1,n,w.position,e]);
      });
      const fp=ws[0].page_number||v.page_number;
      if(n===1)first=fp;last=ws[ws.length-1].page_number||fp;
      vi.push([i+1,n,v.hizb_number,v.juz_number,fp]);
    }
    ch.push({id:i+1,name_arabic:c.name_arabic,verses_count:exp,pages:[first,last]});
  }
  const pages=pg.map((p,i)=>{const L=Object.keys(p).map(Number).sort((a,b)=>a-b);if(!L.length)bad.push('صفحة فارغة '+(i+1));return L.map(l=>[l,p[l]])});
  if(vi.length!==6236)bad.push('مجموع الآيات '+vi.length);
  if(bad.length){console.error(bad.slice(0,40).join('\n'));die('فشل التحقق: '+bad.length+' ملاحظة. لم يُبنَ التطبيق حتى لا يُنشر مصحف ناقص.')}
  fs.writeFileSync('www/quran-data.json',JSON.stringify({v:2,ch,pages,vi}));
  console.log('✓ المصحف كامل: 604 صفحة، 114 سورة، 6236 آية');
  const ua={'User-Agent':'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'};
  let css=await (await fetch('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap',{headers:ua})).text();
  const urls=[...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
  if(!urls.length)die('تعذّر تحميل الخط');
  for(const u of urls)css=css.split(u).join('data:font/woff2;base64,'+Buffer.from(await (await fetch(u)).arrayBuffer()).toString('base64'));
  fs.writeFileSync('www/font.css',css);
  let h=fs.readFileSync('index.html','utf8');
  h=h.replace(/^\s*init\(\);\s*$/m,'').replace(/<script src="(repair|surahs|native|pre)\.js"><\/script>\s*/g,'');
  h=h.replace('<head>','<head>\n<script src="pre.js"></script>').replace('</body>','<script src="native.js"></script>\n</body>');
  fs.writeFileSync('www/index.html',h);
  fs.copyFileSync('native.js','www/native.js');
  fs.writeFileSync('www/pre.js',PRE);
}

const PRE=`(function(){
if(window.SpeechRecognition||window.webkitSpeechRecognition)return;
var C=window.Capacitor;
if(!(/; wv\\)/.test(navigator.userAgent)||(C&&C.isNativePlatform&&C.isNativePlatform())))return;
function P(){return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.SpeechRecognition}
function SR(){this.lang='ar-SA';this._on=false;this._hs=[]}
SR.prototype._emit=function(t){if(this.onresult)this.onresult({results:[Object.assign([{transcript:t}],{isFinal:false})]})};
SR.prototype._clean=function(){this._hs.forEach(function(h){try{h.remove()}catch(e){}});this._hs=[]};
SR.prototype._finish=function(){if(!this._on)return;this._on=false;this._clean();if(this.onend)this.onend()};
SR.prototype.start=async function(){
var s=this,p=P();if(!p||s._on)return;s._on=true;
var fail=function(c){s._on=false;if(s.onerror)s.onerror({error:c});if(s.onend)s.onend()};
try{
var pm=await p.requestPermissions();
if(pm.speechRecognition!=='granted')return fail('not-allowed');
var av=await p.available();
if(!av.available)return fail('service-not-allowed');
s._hs.push(await p.addListener('partialResults',function(d){if(s._on&&d.matches&&d.matches[0])s._emit(d.matches[0])}));
s._hs.push(await p.addListener('listeningState',function(d){if(d.status==='stopped')s._finish()}));
await p.start({language:s.lang,maxResults:1,partialResults:true,popup:false});
}catch(e){fail('audio-capture')}
};
SR.prototype.stop=SR.prototype.abort=function(){var p=P(),w=this._on;this._on=false;this._clean();try{p&&p.stop()}catch(e){}if(w&&this.onend)this.onend()};
window.SpeechRecognition=SR;
})();`;

function tone(){
  const sr=22050,n=sr*6,b=Buffer.alloc(44+n*2);
  b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++){const t=i/sr,e=(t%0.75)/0.75,env=e<0.05?e/0.05:Math.max(0,1-(e-0.05)/0.7);b.writeInt16LE(Math.round(Math.sin(2*Math.PI*(Math.floor(t/0.75)%2?660:880)*t)*env*0.8*32767),44+i*2)}
  return b;
}
function android(){
  const res='android/app/src/main/res';
  const find=n=>{for(const d of ['.','native'])for(const e of ['mp3','ogg','wav','m4a']){const p=path.join(d,n+'.'+e);if(fs.existsSync(p))return p}return null};
  fs.mkdirSync(res+'/raw',{recursive:true});fs.mkdirSync(res+'/drawable',{recursive:true});
  const a=find('adhan'),f=find('adhan_fajr')||a;
  a?fs.copyFileSync(a,res+'/raw/adhan'+path.extname(a)):fs.writeFileSync(res+'/raw/adhan.wav',tone());
  f?fs.copyFileSync(f,res+'/raw/adhan_fajr'+path.extname(f)):fs.writeFileSync(res+'/raw/adhan_fajr.wav',tone());
  console.log('صوت الأذان:',a||'نغمة افتراضية','| الفجر:',f||'نغمة افتراضية');
  fs.writeFileSync(res+'/drawable/ic_stat_adhan.xml','<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFF" android:pathData="M5,5h14v14H5z M12,1.5l10.5,10.5l-10.5,10.5l-10.5,-10.5z"/></vector>');
  const mf='android/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(mf,'utf8');
  const add=['INTERNET','POST_NOTIFICATIONS','SCHEDULE_EXACT_ALARM','USE_EXACT_ALARM','RECEIVE_BOOT_COMPLETED','VIBRATE','WAKE_LOCK','RECORD_AUDIO'].filter(p=>!m.includes('permission.'+p+'"')).map(p=>`    <uses-permission android:name="android.permission.${p}" />`).join('\n');
  m=m.replace('<application',add+'\n    <queries><intent><action android:name="android.speech.RecognitionService" /></intent></queries>\n\n    <application');
  fs.writeFileSync(mf,m);
}
const mode=process.argv[2];
if(mode==='web')await web();
else if(mode==='config')fs.writeFileSync('capacitor.config.json',JSON.stringify({appId:'app.quran.reader',appName:'القرآني',webDir:'www',plugins:{LocalNotifications:{smallIcon:'ic_stat_adhan'}}},null,1));
else if(mode==='android')android();
else die('وضع غير معروف');
