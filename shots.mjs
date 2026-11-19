import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.json':'application/json'};
const srv=createServer((q,r)=>{
  let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';
  fs.readFile(path.join('www',u),(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':T[path.extname(u)]||'application/octet-stream'});r.end(d)});
}).listen(8123);
fs.mkdirSync('shots',{recursive:true});
const b=await chromium.launch();
const pg=await (await b.newContext({viewport:{width:360,height:760},deviceScaleFactor:2})).newPage();
const log=[];
pg.on('pageerror',e=>log.push('خطأ في الصفحة: '+e.message));
await pg.goto('http://localhost:8123/');
await pg.waitForFunction(()=>typeof D!=='undefined'&&D&&document.fonts.status==='loaded',null,{timeout:60000});
await pg.screenshot({path:'shots/home.png'});
for(const p of [1,77,187,208,322,531,603]){
  await pg.evaluate(n=>openPage(n,null,false),p);
  await pg.waitForTimeout(800);
  const r=await pg.evaluate(()=>{
    const pane=document.querySelectorAll('#pg .pane')[1];
    const ls=[...pane.querySelectorAll('.line')];
    const wide=ls.filter(l=>l.scrollWidth>l.clientWidth+1).length;
    return {banner:pane.querySelectorAll('.banner').length,bism:pane.querySelectorAll('.bism').length,lines:ls.length,overflow:wide};
  });
  log.push(`صفحة ${p}: إطارات=${r.banner} بسملة=${r.bism} أسطر=${r.lines} أسطر تتجاوز العرض=${r.overflow}`);
  await pg.screenshot({path:`shots/p${p}.png`});
}
fs.writeFileSync('shots/report.txt',log.join('\n'));
console.log(log.join('\n'));
await b.close();srv.close();
