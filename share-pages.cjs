const looks = require('./looks');
const products = require('./catalog');
const origin = 'https://outfit-mockup.vercel.app';
const esc = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function page(template, look, galleryPath = '/') {
  const id = look?.id || 'nemu-lookbook';
  const url = origin + (look ? '/look/'+id+'/' : galleryPath);
  const total = look?.tags.reduce((sum,[key]) => sum+products[key].price,0);
  const title = look ? look.title+' · Nemu Versi Hemat' : '100 inspirasi outfit preloved · Nemu Versi Hemat';
  const description = look ? look.tags.map(([key])=>products[key].name).join(' + ')+'. Total Rp'+total.toLocaleString('id-ID')+' sebelum ongkir. Bisa dibeli satuan di Nemu.' : 'Temukan gaya dari 100 look preloved. Ketuk pakaian yang kamu suka untuk lihat foto asli dan harga barangnya di Nemu.';
  const picture = origin+'/share/'+id+'.jpg';
  const alt = look ? 'Inspirasi '+look.title+' dan pilihan barang preloved Nemu.' : 'Kolase gaya preloved dari Nemu Versi Hemat.';
  const og = {'og:type':'website','og:site_name':'Nemu Versi Hemat','og:locale':'id_ID','og:url':url,'og:title':title,'og:description':description,'og:image':picture,'og:image:secure_url':picture,'og:image:width':'1200','og:image:height':'630','og:image:type':'image/jpeg','og:image:alt':alt};
  const twitter = {'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':picture,'twitter:image:alt':alt};
  const tags = (attr,obj)=>Object.entries(obj).map(([key,value])=>'<meta '+attr+'="'+key+'" content="'+esc(value)+'">').join('\n');
  const metadata = [
    '<title>'+esc(title)+'</title>',
    '<meta name="description" content="'+esc(description)+'">',
    tags('property',og),
    tags('name',twitter),
    '<link rel="canonical" href="'+url+'">'
  ].join('\n');
  return template.replace(/<title>[\s\S]*?<\/title>\s*<meta name="description" content="[^"]*">/,metadata);
}
module.exports={page,looks};
