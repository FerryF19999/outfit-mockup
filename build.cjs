const fs=require('node:fs');
const path=require('node:path');
const output=process.argv[2] || 'public';
fs.mkdirSync(output,{recursive:true});
for(const file of ['index.html','nemu.svg','style.css','catalog.js','looks.js','social-ui.js','gallery.js','foto']){
  fs.cpSync(path.join(__dirname,file),path.join(output,file),{recursive:true});
}
