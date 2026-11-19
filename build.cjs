const fs=require('node:fs');
const path=require('node:path');
const {page,looks}=require('./share-pages.cjs');
const output=process.argv[2] || 'public';
fs.mkdirSync(output,{recursive:true});
for(const file of ['nemu.svg','style.css','catalog.js','looks.js','social-ui.js','gallery.js','foto','share']){
  fs.cpSync(path.join(__dirname,file),path.join(output,file),{recursive:true});
}
const template=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
fs.writeFileSync(path.join(output,'index.html'),page(template));
for(const look of looks){
  const dir=path.join(output,'look',look.id);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(template,look));
}
