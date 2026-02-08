// Usage: node map-docx-images.js <temp_dir>
// Reads document.xml.rels and document.xml to map images to question/figure numbers
// Outputs JSON: { "rIdN": { file: "imageN.ext", question: N, figure: N } }

const fs = require('fs');
const path = require('path');

const tempDir = process.argv[2];
if (!tempDir) { console.error('Usage: node map-docx-images.js <temp_dir>'); process.exit(1); }

// Read rels file to map rId -> image filename
const relsPath = path.join(tempDir, 'word/_rels/document.xml.rels');
const relsXml = fs.readFileSync(relsPath, 'utf8');
const imageRels = {};
const relRegex = /Relationship\s+Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g;
let match;
while ((match = relRegex.exec(relsXml)) !== null) {
  imageRels[match[1]] = match[2];
}

// Read document.xml
const docPath = path.join(tempDir, 'word/document.xml');
const docXml = fs.readFileSync(docPath, 'utf8');

// Get file sizes to filter artifacts
const mediaDir = path.join(tempDir, 'word/media');
const fileSizes = {};
if (fs.existsSync(mediaDir)) {
  for (const f of fs.readdirSync(mediaDir)) {
    fileSizes[f] = fs.statSync(path.join(mediaDir, f)).size;
  }
}

// Output: all image relationships with file sizes
const result = {};
for (const [rId, filename] of Object.entries(imageRels)) {
  result[rId] = {
    file: filename,
    size: fileSizes[filename] || 0
  };
}

// Also output total image count and list of images > 500 bytes
const realImages = Object.values(result).filter(r => r.size > 500);
const artifacts = Object.values(result).filter(r => r.size <= 500);

console.log(JSON.stringify({
  totalImages: Object.keys(result).length,
  realImages: realImages.length,
  artifacts: artifacts.length,
  images: result
}, null, 2));
