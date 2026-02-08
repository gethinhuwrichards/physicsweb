const fs = require('fs');
const path = require('path');
const imgDir = 'F:/Projects/physics website/public/images';
const dataDir = 'F:/Projects/physics website/public/data';

const images = fs.readdirSync(imgDir).filter(f => /\.(jpeg|jpg|png|gif|svg|webp)$/i.test(f));

const referenced = new Set();
function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.isDirectory()) scanDir(path.join(dir, entry.name));
    else if (entry.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, entry.name), 'utf8'));
        if (data.questions) {
          for (const q of data.questions) {
            for (const p of q.parts) {
              if (p.diagrams) p.diagrams.forEach(d => referenced.add(d));
              if (p.options) p.options.forEach(o => {
                if (typeof o === 'object' && o.image) referenced.add(o.image);
              });
            }
          }
        }
      } catch(e) {}
    }
  }
}
scanDir(dataDir);

const unreferenced = images.filter(i => !referenced.has(i));
console.log('Total images:', images.length);
console.log('Referenced:', referenced.size);
console.log('Unreferenced:', unreferenced.length);
console.log('');
unreferenced.forEach(i => console.log(i));
