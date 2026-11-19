const social = (() => {
  const cardStats = new Map();
  const pending = new Map();
  let ready;
  let active = '';
  const dialogControls = document.querySelector('#discussion');
  const list = document.querySelector('#comment-list');
  const form = document.querySelector('#comment-form');
  const field = form.elements.comment;
  const feedback = document.querySelector('#social-status');
  const latest = new Map();
  const drafts = new Map();
  const icons = {
    views:'<path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    likes:'<path d="M20.7 5.8a5 5 0 0 0-7.2 0L12 7.3l-1.5-1.5a5 5 0 1 0-7.2 7L12 21l8.7-8.2a5 5 0 0 0 0-7Z"/>',
    comments:'<path d="M21 11.5a9 9 0 0 1-9 9c-1.7 0-3.1-.3-4.5-1L3 21l1.4-4.4A9 9 0 1 1 21 11.5Z"/>'
  };
  const labels={views:'Tayangan', likes:'Suka', comments:'Komentar'};
  const bars = new Map();
  function controls(id) {
    const wrap=make('div','engagement');
    for(const key of Object.keys(icons)){
      const el=make(key==='views'?'span':'button','metric');
      el.dataset.metric=key;
      el.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+icons[key]+'</svg><span>–</span>';
      el.title=labels[key];el.setAttribute('aria-label',labels[key]);
      if(key==='likes') el.onclick=()=>toggle(id);
      if(key==='comments') el.onclick=()=>{
        if(!dialog.open){opener=el;history.pushState({fromGallery:true},'', '/look/'+id+'/');renderSelection();}
        field.focus();
      };
      wrap.append(el);
    }
    return wrap;
  }
  function paint(id){
    const s=cardStats.get(id);
    for(const wrap of [bars.get(id),active===id?dialogControls.firstElementChild:null]){
      if(!wrap)continue;
      for(const el of wrap.querySelectorAll('.metric')){
        const k=el.dataset.metric;
        el.lastElementChild.textContent=s?String(s[k]||0):'–';
        el.setAttribute('aria-label',labels[k]+' · '+(s?s[k]||0:'belum tersedia'));
        if(k==='likes')el.setAttribute('aria-pressed',String(!!s?.liked));
      }
    }
  }
  async function api(body,id){
    const url='/api/social'+(id?'?id='+encodeURIComponent(id):'');
    const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
    const result=await response.json();
    if(!response.ok)throw Error(result.error || 'Interaksi belum tersedia.');
    return result;
  }
  function announce(msg){document.querySelector('#gallery-status').textContent=msg;if(dialog.open)feedback.textContent=msg;}
  function run(id,action){
    const work=(pending.get(id)||Promise.resolve()).catch(()=>{}).then(async()=>{await ready;return action();});
    pending.set(id,work);return work;
  }
  function update(id,data){
    cardStats.set(id,data);paint(id);
    if(id!==active || !data.entries)return;
    list.replaceChildren();
    document.querySelector('#comments-title').textContent='Komentar ('+data.comments+')';
    if(!data.entries.length)list.append(make('li','note','Belum ada komentar.'));
    for(const entry of data.entries){
      const line=make('li');
      line.append(make('small',null,'Pengunjung · '+new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short'}).format(new Date(entry.at))),make('p',null,entry.text));list.append(line);
    }
  }
  function toggle(id){
    run(id,async()=>update(id,await api({id,action:'like',value:!cardStats.get(id)?.liked}))).catch(()=>announce('Suka belum tersimpan. Coba lagi.'));
  }
  function open(id){
    if(active===id)return;
    active=id;feedback.textContent='';list.replaceChildren();document.querySelector('#comments-title').textContent='Komentar';field.value=drafts.get(id)||'';
    dialogControls.replaceChildren(controls(id));paint(id);
    run(id,async()=>update(id,await api({id,action:'view'}))).catch(()=>announce('Interaksi belum terhubung. Coba lagi nanti.'));
  }
  field.addEventListener('input',()=>{drafts.set(active,field.value);latest.delete(active);});
  form.onsubmit=async e=>{
    e.preventDefault();const id=active,value=field.value.trim();if(!id||!value)return;
    const key=latest.get(id)||crypto.randomUUID();latest.set(id,key);
    const btn=form.querySelector('button');btn.disabled=true;
    try{await run(id,async()=>update(id,await api({id,action:'comment',value,requestId:key})));
      latest.delete(id);drafts.delete(id);if(active===id){field.value='';feedback.textContent='Komentar terkirim.';}
    }catch(err){announce(err.message.includes('Tunggu')?err.message:'Komentar belum terkirim. Coba lagi.');}
    finally{btn.disabled=false;}
  };
  function init(){
    ready=api().then(data=>{
      const liked=new Set(data.liked);
      for(const look of looks){cardStats.set(look.id,{...data.counts[look.id],liked:liked.has(look.id)});paint(look.id);}
    }).catch(()=>announce('Data interaksi belum tersedia.'));
  }
  return {init,open,close(){active='';},card(id){const el=controls(id);bars.set(id,el);return el;}};
})();
