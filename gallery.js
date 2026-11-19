const money = n => 'Rp' + n.toLocaleString('id-ID');
const photo = look => 'foto/model-' + look.id + '.webp';
const gallery = document.querySelector('#gallery');
const dialog = document.querySelector('#details');
const closeButton = document.querySelector('#close');
let opener = null;

function make(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}
function linkTo(look, slug) {
  return '/look/' + look.id + '/' + (slug ? '?barang=' + encodeURIComponent(slug) : '');
}
function image(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}
for (const look of looks) {
  const card = make('article','card');
  card.dataset.look = look.id;
  const frame = make('div','frame');
  const cover = make('a','cover');
  cover.href = linkTo(look);
  cover.setAttribute('aria-label','Lihat semua barang · ' + look.title);
  const portrait=image(photo(look),'Model mengenakan ' + look.tags.map(([id]) => products[id].name).join(', '));
  portrait.loading = gallery.children.length < 4 ? 'eager' : 'lazy';
  portrait.decoding='async';
  cover.append(portrait);
  frame.append(cover);
  for (const [id,x,y] of look.tags) {
    const pin = make('a','pin','+');
    pin.href = linkTo(look,id);
    pin.title = products[id].name;
    pin.setAttribute('aria-label','Lihat ' + products[id].name);
    pin.style.left = x + '%';
    pin.style.top = y + '%';
    frame.append(pin);
  }
  const title = make('a','card-title',look.title);
  title.href = linkTo(look);
  const total = look.tags.reduce((sum,[id]) => sum + products[id].price,0);
  card.append(frame,title,make('p','meta',look.tags.length + ' barang · Total ' + money(total)));
  card.append(social.card(look.id));
  gallery.append(card);
}
function productRow(product) {
  const row = make('a','product');
  row.href = product.url;
  const info = make('div');
  info.append(make('small',null,({GOOD:'Baik',EXCELLENT:'Sangat baik',LIKE_NEW:'Seperti baru'})[product.condition] || product.condition),make('h3',null,product.name),make('strong',null,money(product.price)),make('span','shop','Lihat di Nemu ↗'));
  row.append(image(product.image,'Foto asli ' + product.name),info);
  return row;
}
function renderSelection() {
  const legacy = location.hash.startsWith('#look/');
  const [route,lookId,oldSlug] = (legacy ? location.hash.slice(1) : location.pathname.slice(1)).split('/');
  const slug = legacy ? oldSlug : new URLSearchParams(location.search).get('barang');
  const look = looks.find(item => item.id === lookId);
  if (route !== 'look' || !look || (slug && !look.tags.some(([id]) => id === slug))) {
    if (dialog.open) dialog.close();
    return;
  }
  if(legacy) history.replaceState(history.state,'',linkTo(look,slug));
  const model = document.querySelector('#look-photo');
  model.src = photo(look);
  model.alt = 'Inspirasi ' + look.title;
  document.querySelector('#share-look').dataset.id = look.id;
  document.querySelector('#share-status').textContent = '';
  const ids = slug ? [slug] : look.tags.map(([id]) => id);
  document.querySelector('#type').textContent = slug ? look.title : 'Isi outfit';
  document.querySelector('#look-title').textContent = slug ? 'Pilihanmu' : look.title;
  document.querySelector('#summary').textContent = slug ? '' : ids.length + ' barang · Total ' + money(ids.reduce((sum,id) => sum + products[id].price,0));
  document.querySelector('#items').replaceChildren(...ids.map(id => productRow(products[id])));
  if (!dialog.open) { dialog.showModal(); closeButton.focus(); }
  social.open(look.id);
}
gallery.addEventListener('click', event => { opener = event.target.closest('a'); });
function dismiss() {
  if (history.state?.fromGallery) history.back();
  else { history.replaceState(null,'','/'); renderSelection(); }
}
gallery.addEventListener('click',event => {
  const link = event.target.closest('a');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState({fromGallery:true},'',link.href);
  renderSelection();
});
window.addEventListener('hashchange',renderSelection);
window.addEventListener('popstate',renderSelection);
closeButton.addEventListener('click',dismiss);
dialog.addEventListener('cancel',event => { event.preventDefault(); dismiss(); });
dialog.addEventListener('click',event => { if(event.target === dialog) dismiss(); });
dialog.addEventListener('close',() => {social.close();opener?.focus({preventScroll:true});});
social.init();
renderSelection();

const filters = [
  ['Semua', null], ['Denim', /denim|jeans/i], ['Rajut', /rajut|cardigan/i],
  ['Sporty', /jersey|track pants|hoodie|windbreaker|olahraga/i], ['Linen', /linen/i]
];
const filterBar = document.querySelector('#filters');
for (const [label,match] of filters) {
  const button = make('button','filter',label);
  button.setAttribute('aria-pressed',String(!match));
  button.onclick = () => {
    for(const sibling of filterBar.children) sibling.setAttribute('aria-pressed',String(sibling===button));
    let total=0;
    for(const [i,look] of looks.entries()) {
      const visible = !match || match.test(look.title+' '+look.tags.map(([id])=>products[id].name).join(' '));
      gallery.children[i].hidden = !visible;
      if(visible) total++;
    }
    document.querySelector('#result-count').textContent=total+' look';
  };
  filterBar.append(button);
}
document.querySelector('#share-look').onclick = async event => {
  const look = looks.find(item=>item.id===event.currentTarget.dataset.id);
  const url = new URL(linkTo(look),location.origin).href;
  try {
    if(navigator.share) await navigator.share({title:look.title+' · Nemu',url});
    else {await navigator.clipboard.writeText(url);document.querySelector('#share-status').textContent='Link disalin.';}
  } catch(error) {
    if(error.name!=='AbortError') document.querySelector('#share-status').textContent=url;
  }
};
