const originalLooks = [
  { id:'terracotta', title:'Terakota & denim', tags:[['blouse-satin-terracota',48,31],['rok-jeans-mango-jeans',49,56]] },
  { id:'linen', title:'Sabtu pakai linen', tags:[['kemeja-kuning',61,32],['tank-top-stripes-bw',48,47],['celana-panjang-linen',47,73]] },
  { id:'satin', title:'Satin selepas sore', tags:[['jumpsuit-satin',51,47]] },
  { id:'sage', title:'Hijau di sudut kota', tags:[['blouse-lengan-kerut-hijau',50,28],['jeans-selutut',50,58]] }
];
const looks = [...additionalLooks];
[0,5,11,19].forEach((position,i) => looks.splice(position,0,originalLooks[i]));
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
  return '#look/' + look.id + (slug ? '/' + slug : '');
}
function image(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}
for (const look of looks) {
  const card = make('article','card');
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
  const [route,lookId,slug] = location.hash.slice(1).split('/');
  const look = looks.find(item => item.id === lookId);
  if (route !== 'look' || !look || (slug && !look.tags.some(([id]) => id === slug))) {
    if (dialog.open) dialog.close();
    return;
  }
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
  else { history.replaceState(null,'',location.pathname + location.search); renderSelection(); }
}
gallery.addEventListener('click',event => {
  const link = event.target.closest('a');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState({fromGallery:true},'',link.hash);
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
