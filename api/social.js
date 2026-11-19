const {randomUUID}=require('node:crypto');
const ids = new Set(['linen','satin','terracotta','sage', ...Array.from({length:96},(_,i)=>'edit-'+(i+1))]);
const namespace = 'nemu-gallery-v1:';
const statsKey = namespace+'counts';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

async function command(args) {
  const url=process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw Error('Storage unavailable');
  const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw Error('Storage unavailable');
  const payload=await response.json();
  if(payload.error) throw Error('Storage unavailable');
  return payload.result;
}
const updateScript = `
local id,action,body,ttl = ARGV[1],ARGV[2],ARGV[3],tonumber(ARGV[4])
if action=='view' then
  if redis.call('SET',KEYS[3],1,'EX',ttl,'NX') then redis.call('HINCRBY',KEYS[1],id..'/views',1) end
elseif action=='like' then
  local added
  if body=='true' then added=redis.call('SADD',KEYS[2],id)
  else added=-redis.call('SREM',KEYS[2],id) end
  redis.call('HINCRBY',KEYS[1],id..'/likes',added)
elseif action=='comment' then
  if redis.call('EXISTS',KEYS[5])==1 then return 1 end
  if not redis.call('SET',KEYS[6],1,'EX',5,'NX') then return 0 end
  redis.call('SET',KEYS[5],1,'EX',86400)
  redis.call('LPUSH',KEYS[4],body)
  redis.call('LTRIM',KEYS[4],0,49)
  redis.call('HINCRBY',KEYS[1],id..'/comments',1)
end
return 1`;
async function redisStore(visitor, op) {
  const {id,action,value,requestId}=op;
  const userKey=namespace+'likes:'+visitor;
  const commentsKey=namespace+'comments:'+id;
  if(action){
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta'}).format(new Date());
    const body=action==='comment'?JSON.stringify(value):String(value);
    const ok=await command(['EVAL',updateScript,6,statsKey,userKey,namespace+'seen:'+today+':'+visitor+':'+id,commentsKey,namespace+'posted:'+visitor+':'+id+':'+requestId,namespace+'cooldown:'+visitor,id,action,body,172800]);
    if (!ok) return {status:429,error:'Tunggu sebentar sebelum mengirim komentar lagi.'};
  }
  if(id) {
    const [values,liked,comments]=await Promise.all([command(['HMGET',statsKey,...['views','likes','comments'].map(k=>id+'/'+k)]),command(['SISMEMBER',userKey,id]),command(['LRANGE',commentsKey,0,49])]);
    return {views:+values[0],likes:+values[1],comments:+values[2],liked:!!liked,entries:comments.map(JSON.parse)};
  }
  const [fields,liked]=await Promise.all([command(['HGETALL',statsKey]),command(['SMEMBERS',userKey])]);
  const counts={};
  for(let i=0;i<fields.length;i+=2){const [key,field]=fields[i].split('/');(counts[key]??={})[field]=+fields[i+1];}
  return {counts,liked};
}
async function handle(req,res,store=redisStore) {
  const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
  res.setHeader('Cache-Control','private, no-store');
  try {
    if(!['GET','POST'].includes(req.method)) return send(405,{error:'Metode tidak tersedia.'});
    let visitor=req.headers.cookie?.match(/(?:^|; *)nemu_guest=([^;]+)/)?.[1];
    if(!uuid.test(visitor||'')){visitor=randomUUID();res.setHeader('Set-Cookie','nemu_guest='+visitor+'; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax'+(process.env.VERCEL?'; Secure':''));}
    let id=new URL(req.url,'http://localhost').searchParams.get('id');
    let op={id};
    if(req.method==='POST'){
      if(req.headers.origin && new URL(req.headers.origin).host!==req.headers.host) return send(403,{error:'Permintaan ditolak.'});
      if(!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'Gunakan JSON.'});
      let body=req.body;
      if(body===undefined){let chunks='';for await(const part of req){chunks+=part;if(chunks.length>4000)return send(413,{error:'Terlalu panjang.'});}body=chunks;}
      if(typeof body==='string'){try{body=JSON.parse(body)}catch{return send(400,{error:'Isi tidak valid.'})}}
      if(!body || typeof body!=='object')return send(400,{error:'Isi tidak valid.'});
      id=body.id;const {action}=body;
      if(!ids.has(id)||!['view','like','comment'].includes(action))return send(400,{error:'Pilihan tidak valid.'});
      op={id,action,value:body.value,requestId:body.requestId};
      if(action==='like'&&typeof body.value!=='boolean')return send(400,{error:'Pilihan tidak valid.'});
      if(action==='comment'){
        const text=typeof body.value==='string'?body.value.trim():'';
        if(!text || text.length>280 || !uuid.test(body.requestId||''))return send(400,{error:'Tulis komentar 1–280 karakter.'});
        op.value={text,at:new Date().toISOString()};
      }
    }
    if(id!==null && !ids.has(id))return send(404,{error:'Look tidak ditemukan.'});
    const result=await store(visitor,op);send(result.status||200,result);
  }catch{send(503,{error:'Interaksi belum terhubung. Coba lagi nanti.'});}
}
module.exports=(req,res)=>handle(req,res);
module.exports.handle=handle;
