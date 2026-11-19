const fs=require('node:fs'), path=require('node:path'), os=require('node:os');
const http=require('node:http');
const {handle}=require('./api/social');
const file=process.env.NEMU_LOCAL_DB || path.join(os.homedir(),'.nemu-gallery-local.json');
const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{looks:{},guests:{}};
function store(visitor,{id,action,value,requestId}) {
  const guest=state.guests[visitor]??={likes:{},views:{},posted:{}};
  if(!id)return {counts:Object.fromEntries(Object.entries(state.looks).map(([id,{views,likes,comments}])=>[id,{views,likes,comments}])),liked:Object.keys(guest.likes)};
  const look=state.looks[id]??={views:0,likes:0,comments:0,entries:[]};
  if(action==='view'){const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta'}).format(new Date());if(guest.views[id]!==day){guest.views[id]=day;look.views++;}}
  if(action==='like' && !!guest.likes[id]!==value){if(value){guest.likes[id]=true;look.likes++;}else{delete guest.likes[id];look.likes--;}}
  if(action==='comment' && !guest.posted[requestId]){
    if(Date.now()-(guest.lastComment||0)<5000)return {status:429,error:'Tunggu sebentar sebelum mengirim komentar lagi.'};
    guest.lastComment=Date.now();guest.posted[requestId]=true;look.entries.unshift(value);look.entries.length=Math.min(50,look.entries.length);look.comments++;
  }
  if(action){fs.writeFileSync(file+'.tmp',JSON.stringify(state));fs.renameSync(file+'.tmp',file);}
  return {...look,liked:!!guest.likes[id]};
}
const {page,looks}=require('./share-pages.cjs');
const template=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/social')return handle(req,res,store);
 const look=looks.find(item=>url.pathname==='/look/'+item.id+'/' || url.pathname==='/look/'+item.id);
 const galleryAlias = /^\/lookbook\/?$/.test(url.pathname);
 if(url.pathname==='/' || galleryAlias || look){res.writeHead(200,{'Content-Type':mime['.html']});return res.end(page(template,look,galleryAlias ? '/lookbook/' : '/'));}
 const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(!/^(index\.html|nemu\.svg|(?:catalog|looks|gallery|social-ui)\.js|style\.css|foto\/[\w-]+\.webp|share\/[\w-]+\.jpg)$/.test(name)){res.writeHead(404);return res.end();}
 fs.readFile(path.join(__dirname,name),(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(name)]});res.end(err?'':data);});
}).listen(Number(process.env.PORT||62155),'127.0.0.1');
