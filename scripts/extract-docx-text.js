// Usage: node extract-docx-text.js <temp_dir>
// Extracts text + image markers from document.xml
// Outputs question structure with text and image references

const fs = require('fs');
const path = require('path');

const tempDir = process.argv[2];
if (!tempDir) { console.error('Usage: node extract-docx-text.js <temp_dir>'); process.exit(1); }

// Read rels file to map rId -> image filename
const relsPath = path.join(tempDir, 'word/_rels/document.xml.rels');
const relsXml = fs.readFileSync(relsPath, 'utf8');
const imageRels = {};
const relRegex = /Relationship\s+Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g;
let match;
while ((match = relRegex.exec(relsXml)) !== null) {
  imageRels[match[1]] = match[2];
}

// Get file sizes
const mediaDir = path.join(tempDir, 'word/media');
const fileSizes = {};
if (fs.existsSync(mediaDir)) {
  for (const f of fs.readdirSync(mediaDir)) {
    fileSizes[f] = fs.statSync(path.join(mediaDir, f)).size;
  }
}

// Read document.xml
const docPath = path.join(tempDir, 'word/document.xml');
const docXml = fs.readFileSync(docPath, 'utf8');

// Split into paragraphs (w:p elements)
const paragraphs = [];
// Simple regex-based extraction of text from paragraphs
// Split on <w:p to get paragraph boundaries
const pSplit = docXml.split(/<w:p[\s>]/);

for (let i = 1; i < pSplit.length; i++) {
  const pContent = pSplit[i].split('</w:p>')[0];

  // Extract text runs
  let text = '';
  const textMatches = pContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (textMatches) {
    for (const tm of textMatches) {
      const val = tm.replace(/<w:t[^>]*>/, '').replace('</w:t>', '');
      text += val;
    }
  }

  // Check for images (both w:drawing and w:pict)
  const imageIds = [];
  // Modern drawing format: a:blip r:embed="rIdN"
  const blipMatches = pContent.match(/r:embed="(rId\d+)"/g);
  if (blipMatches) {
    for (const bm of blipMatches) {
      const rId = bm.match(/rId\d+/)[0];
      if (imageRels[rId]) {
        const file = imageRels[rId];
        const size = fileSizes[file] || 0;
        if (size > 500) {
          imageIds.push({ rId, file, size });
        }
      }
    }
  }
  // Legacy VML format: v:imagedata r:id="rIdN"
  const vmlMatches = pContent.match(/r:id="(rId\d+)"/g);
  if (vmlMatches) {
    for (const vm of vmlMatches) {
      const rId = vm.match(/rId\d+/)[0];
      if (imageRels[rId] && !imageIds.find(x => x.rId === rId)) {
        const file = imageRels[rId];
        const size = fileSizes[file] || 0;
        if (size > 500) {
          imageIds.push({ rId, file, size });
        }
      }
    }
  }

  // Check for table content
  const hasTable = pContent.includes('<w:tbl>') || pContent.includes('<w:tbl ');

  if (text.trim() || imageIds.length > 0) {
    const entry = { text: text.trim() };
    if (imageIds.length > 0) entry.images = imageIds;
    if (hasTable) entry.hasTable = true;
    paragraphs.push(entry);
  }
}

// Also extract tables separately
const tables = [];
const tblSplit = docXml.split(/<w:tbl[\s>]/);
for (let i = 1; i < tblSplit.length; i++) {
  const tblContent = tblSplit[i].split('</w:tbl>')[0];
  // Extract rows
  const rows = [];
  const rowSplit = tblContent.split(/<w:tr[\s>]/);
  for (let j = 1; j < rowSplit.length; j++) {
    const rowContent = rowSplit[j].split('</w:tr>')[0];
    const cells = [];
    const cellSplit = rowContent.split(/<w:tc[\s>]/);
    for (let k = 1; k < cellSplit.length; k++) {
      const cellContent = cellSplit[k].split('</w:tc>')[0];
      let cellText = '';
      const cellTextMatches = cellContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (cellTextMatches) {
        for (const tm of cellTextMatches) {
          cellText += tm.replace(/<w:t[^>]*>/, '').replace('</w:t>', '');
        }
      }
      // Check for images in cell
      const cellImages = [];
      const cellBlips = cellContent.match(/r:embed="(rId\d+)"/g);
      if (cellBlips) {
        for (const bm of cellBlips) {
          const rId = bm.match(/rId\d+/)[0];
          if (imageRels[rId]) {
            const file = imageRels[rId];
            const size = fileSizes[file] || 0;
            if (size > 500) cellImages.push({ file, size });
          }
        }
      }
      if (cellImages.length > 0) {
        cells.push({ text: cellText.trim(), images: cellImages });
      } else {
        cells.push(cellText.trim());
      }
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length > 0) tables.push(rows);
}

// Output
console.log('=== PARAGRAPHS ===');
for (let i = 0; i < paragraphs.length; i++) {
  const p = paragraphs[i];
  let line = p.text;
  if (p.images) {
    line += ' [IMAGES: ' + p.images.map(img => img.file + '(' + img.size + 'b)').join(', ') + ']';
  }
  if (line.trim()) console.log(line);
}

console.log('\n=== TABLES ===');
for (let t = 0; t < tables.length; t++) {
  console.log(`\nTable ${t + 1}:`);
  for (const row of tables[t]) {
    console.log('  | ' + row.map(c => typeof c === 'object' ? c.text + '[IMG]' : c).join(' | ') + ' |');
  }
}
