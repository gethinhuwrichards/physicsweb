const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const VALID_TYPES = [
  'single-choice', 'multi-choice', 'gap-fill', 'extended-written',
  'extended-written-levels', 'calculation', 'equation-choice',
  'tick-box-table', 'match-up', 'short-answer', 'select-and-explain', 'table-fill'
];

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_SOURCES = ['original', 'pastpaper'];
const VALID_BOARDS = ['AQA', 'Edexcel', 'OCR', 'iGCSE Edexcel', 'iGCSE Cambridge'];
const VALID_TIERS = ['combined', 'separate'];

// Collect all question files (skip archive)
const questionFiles = [];
function findJsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'archive old') continue;
      findJsonFiles(full);
    } else if (entry.name.endsWith('.json') && entry.name !== 'topics.json') {
      questionFiles.push(full);
    }
  }
}
findJsonFiles(DATA_DIR);

let totalErrors = 0;
let totalWarnings = 0;
const allIds = new Map(); // id -> file
const allDiagrams = new Set();
const fileCounts = {}; // relative path -> question count

function err(file, msg) {
  console.log(`  ERROR: ${msg}`);
  totalErrors++;
}
function warn(file, msg) {
  console.log(`  WARN: ${msg}`);
  totalWarnings++;
}

// Get all existing images
const existingImages = new Set();
if (fs.existsSync(IMAGES_DIR)) {
  for (const f of fs.readdirSync(IMAGES_DIR)) {
    existingImages.add(f);
  }
}

console.log(`\n=== Phase 4: Final Validation ===\n`);
console.log(`Found ${questionFiles.length} question files\n`);

// 1. JSON validity + field compliance
for (const filePath of questionFiles) {
  const rel = path.relative(DATA_DIR, filePath).replace(/\\/g, '/');
  console.log(`--- ${rel} ---`);

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    err(rel, `Cannot read file: ${e.message}`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    err(rel, `Invalid JSON: ${e.message}`);
    continue;
  }

  // Top-level fields
  if (!data.subtopic) err(rel, 'Missing "subtopic" field');
  if (!data.mainTopic) err(rel, 'Missing "mainTopic" field');
  if (!Array.isArray(data.questions)) {
    err(rel, 'Missing or invalid "questions" array');
    continue;
  }

  fileCounts[rel] = data.questions.length;

  // Difficulty ordering
  const diffOrder = { easy: 0, medium: 1, hard: 2 };
  let lastDiff = -1;
  let diffOrderOk = true;

  for (let qi = 0; qi < data.questions.length; qi++) {
    const q = data.questions[qi];
    const qLabel = q.id || `question[${qi}]`;

    // Question-level fields
    if (!q.id) err(rel, `${qLabel}: Missing "id"`);
    else {
      if (allIds.has(q.id)) {
        err(rel, `${qLabel}: Duplicate ID "${q.id}" (also in ${allIds.get(q.id)})`);
      } else {
        allIds.set(q.id, rel);
      }
    }

    if (!q.topic) err(rel, `${qLabel}: Missing "topic"`);
    if (!q.title) err(rel, `${qLabel}: Missing "title"`);

    if (!q.difficulty || !VALID_DIFFICULTIES.includes(q.difficulty)) {
      err(rel, `${qLabel}: Invalid difficulty "${q.difficulty}"`);
    } else {
      const d = diffOrder[q.difficulty];
      if (d < lastDiff && diffOrderOk) {
        warn(rel, `${qLabel}: Difficulty "${q.difficulty}" appears after harder question (not in easy→medium→hard order)`);
        diffOrderOk = false; // only warn once per file
      }
      lastDiff = d;
    }

    if (!q.source || !VALID_SOURCES.includes(q.source)) {
      err(rel, `${qLabel}: Invalid source "${q.source}"`);
    }
    if (!q.examBoard || !VALID_BOARDS.includes(q.examBoard)) {
      err(rel, `${qLabel}: Invalid examBoard "${q.examBoard}"`);
    }
    if (!q.tier || !VALID_TIERS.includes(q.tier)) {
      err(rel, `${qLabel}: Invalid tier "${q.tier}"`);
    }
    if (q.subject !== 'physics') {
      err(rel, `${qLabel}: Invalid subject "${q.subject}"`);
    }
    if (q.level !== 'GCSE') {
      err(rel, `${qLabel}: Invalid level "${q.level}"`);
    }

    if (!Array.isArray(q.parts) || q.parts.length === 0) {
      err(rel, `${qLabel}: Missing or empty "parts" array`);
      continue;
    }

    // Part-level validation
    for (let pi = 0; pi < q.parts.length; pi++) {
      const p = q.parts[pi];
      const pLabel = `${qLabel}(${p.partLabel || pi})`;

      // Common fields
      if (!p.partLabel) err(rel, `${pLabel}: Missing "partLabel"`);
      if (!p.type || !VALID_TYPES.includes(p.type)) {
        err(rel, `${pLabel}: Invalid type "${p.type}"`);
        continue;
      }
      if (typeof p.text !== 'string') err(rel, `${pLabel}: Missing "text"`);
      if (typeof p.marks !== 'number' || p.marks < 1 || p.marks > 6) {
        err(rel, `${pLabel}: Invalid marks "${p.marks}" (must be 1-6)`);
      }
      if (!Array.isArray(p.markScheme) || p.markScheme.length === 0) {
        err(rel, `${pLabel}: Missing or empty "markScheme"`);
      }
      if (!Array.isArray(p.diagrams)) {
        err(rel, `${pLabel}: Missing "diagrams" array`);
      } else {
        for (const d of p.diagrams) {
          allDiagrams.add(d);
          if (!existingImages.has(d)) {
            err(rel, `${pLabel}: Diagram "${d}" not found in public/images/`);
          }
        }
      }

      // Type-specific validation
      switch (p.type) {
        case 'single-choice': {
          if (!Array.isArray(p.options) || p.options.length < 3 || p.options.length > 4) {
            err(rel, `${pLabel}: single-choice needs 3-4 options, got ${p.options ? p.options.length : 0}`);
          }
          if (typeof p.correctAnswer !== 'number' || p.correctAnswer < 0 || (p.options && p.correctAnswer >= p.options.length)) {
            err(rel, `${pLabel}: Invalid correctAnswer ${p.correctAnswer}`);
          }
          break;
        }
        case 'multi-choice': {
          if (!Array.isArray(p.options) || p.options.length < 4) {
            err(rel, `${pLabel}: multi-choice needs 4+ options`);
          }
          if (!Array.isArray(p.correctAnswers)) {
            err(rel, `${pLabel}: Missing correctAnswers array`);
          }
          if (typeof p.selectCount !== 'number' || p.selectCount < 1) {
            err(rel, `${pLabel}: Invalid selectCount`);
          }
          break;
        }
        case 'gap-fill': {
          if (!Array.isArray(p.segments)) err(rel, `${pLabel}: Missing segments`);
          if (!Array.isArray(p.wordBank)) err(rel, `${pLabel}: Missing wordBank`);
          if (!Array.isArray(p.correctAnswers)) err(rel, `${pLabel}: Missing correctAnswers`);
          if (p.segments) {
            const blankCount = p.segments.filter(s => typeof s === 'object' && s.blank !== undefined).length;
            if (p.correctAnswers && blankCount !== p.correctAnswers.length) {
              err(rel, `${pLabel}: ${blankCount} blanks but ${p.correctAnswers.length} correctAnswers`);
            }
          }
          break;
        }
        case 'extended-written': {
          // No additional required fields
          if (p.options || p.correctAnswer !== undefined || p.correctAnswers || p.acceptedAnswers) {
            warn(rel, `${pLabel}: extended-written has unexpected auto-mark fields`);
          }
          break;
        }
        case 'extended-written-levels': {
          if (p.markScheme && p.markScheme.length <= p.marks) {
            warn(rel, `${pLabel}: extended-written-levels should have more markScheme entries (${p.markScheme.length}) than marks (${p.marks})`);
          }
          break;
        }
        case 'calculation': {
          if (![2, 3, 4].includes(p.marks)) {
            err(rel, `${pLabel}: calculation marks must be 2, 3, or 4 (got ${p.marks})`);
          }
          if (!Array.isArray(p.equations) || p.equations.length !== 3) {
            err(rel, `${pLabel}: calculation needs exactly 3 equations`);
          }
          if (typeof p.correctEquation !== 'number' || p.correctEquation < 0 || p.correctEquation > 2) {
            err(rel, `${pLabel}: Invalid correctEquation ${p.correctEquation}`);
          }
          if (typeof p.correctAnswer !== 'number') {
            err(rel, `${pLabel}: Missing numeric correctAnswer`);
          }
          if (p.markScheme && p.markScheme.length !== p.marks) {
            err(rel, `${pLabel}: markScheme length (${p.markScheme.length}) != marks (${p.marks})`);
          }
          break;
        }
        case 'equation-choice': {
          if (!Array.isArray(p.options) || p.options.length !== 4) {
            err(rel, `${pLabel}: equation-choice needs exactly 4 options`);
          }
          if (typeof p.correctAnswer !== 'number' || p.correctAnswer < 0 || p.correctAnswer > 3) {
            err(rel, `${pLabel}: Invalid correctAnswer ${p.correctAnswer}`);
          }
          if (p.marks !== 1) {
            err(rel, `${pLabel}: equation-choice must be 1 mark`);
          }
          break;
        }
        case 'tick-box-table': {
          if (!Array.isArray(p.columnHeaders) || p.columnHeaders.length < 2) {
            err(rel, `${pLabel}: tick-box-table needs 2+ columnHeaders`);
          }
          if (!Array.isArray(p.rows)) {
            err(rel, `${pLabel}: Missing rows`);
          } else {
            if (p.marks !== p.rows.length) {
              err(rel, `${pLabel}: marks (${p.marks}) != rows count (${p.rows.length})`);
            }
            for (const row of p.rows) {
              if (!row.label) err(rel, `${pLabel}: Row missing label`);
              if (typeof row.correctColumn !== 'number') err(rel, `${pLabel}: Row missing correctColumn`);
            }
          }
          break;
        }
        case 'match-up': {
          if (!Array.isArray(p.leftItems)) err(rel, `${pLabel}: Missing leftItems`);
          if (!Array.isArray(p.rightItems)) err(rel, `${pLabel}: Missing rightItems`);
          if (!Array.isArray(p.correctLinks)) err(rel, `${pLabel}: Missing correctLinks`);
          if (p.leftItems && p.rightItems && p.rightItems.length < p.leftItems.length) {
            err(rel, `${pLabel}: rightItems (${p.rightItems.length}) < leftItems (${p.leftItems.length})`);
          }
          if (p.correctLinks && p.marks !== p.correctLinks.length) {
            err(rel, `${pLabel}: marks (${p.marks}) != correctLinks count (${p.correctLinks.length})`);
          }
          break;
        }
        case 'short-answer': {
          if (!Array.isArray(p.acceptedAnswers) || p.acceptedAnswers.length === 0) {
            err(rel, `${pLabel}: Missing acceptedAnswers`);
          }
          break;
        }
        case 'select-and-explain': {
          if (!Array.isArray(p.options) || p.options.length < 3 || p.options.length > 4) {
            err(rel, `${pLabel}: select-and-explain needs 3-4 options`);
          }
          if (typeof p.correctAnswer !== 'number') {
            err(rel, `${pLabel}: Missing correctAnswer`);
          }
          if (p.marks < 2) {
            err(rel, `${pLabel}: select-and-explain needs at least 2 marks`);
          }
          break;
        }
        case 'table-fill': {
          if (!Array.isArray(p.headers)) err(rel, `${pLabel}: Missing headers`);
          if (!Array.isArray(p.rows)) err(rel, `${pLabel}: Missing rows`);
          if (!Array.isArray(p.correctAnswers)) err(rel, `${pLabel}: Missing correctAnswers`);
          if (p.rows) {
            let blankCount = 0;
            for (const row of p.rows) {
              if (Array.isArray(row.cells)) {
                blankCount += row.cells.filter(c => typeof c === 'object' && c.blank !== undefined).length;
              }
            }
            if (p.correctAnswers && blankCount !== p.correctAnswers.length) {
              err(rel, `${pLabel}: ${blankCount} blanks but ${p.correctAnswers.length} correctAnswers`);
            }
          }
          break;
        }
      }
    }
  }
  console.log(`  ${data.questions.length} questions OK`);
}

// 2. Check topics.json question counts
console.log(`\n--- topics.json ---`);
const topicsPath = path.join(DATA_DIR, 'topics.json');
let topics;
try {
  topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
} catch (e) {
  err('topics.json', `Invalid JSON: ${e.message}`);
}

if (topics) {
  const countMismatches = [];
  for (const topic of (topics.mainTopics || topics)) {
    if (Array.isArray(topic.subtopics)) {
      for (const st of topic.subtopics) {
        const stFile = st.file;
        if (stFile && fileCounts[stFile] !== undefined) {
          if (st.questionCount !== fileCounts[stFile]) {
            countMismatches.push({
              name: st.name,
              file: stFile,
              listed: st.questionCount,
              actual: fileCounts[stFile]
            });
          }
        } else if (stFile) {
          err('topics.json', `Subtopic "${st.name}" references "${stFile}" which was not found`);
        }
      }
    }
  }

  if (countMismatches.length > 0) {
    console.log(`  Question count mismatches:`);
    for (const m of countMismatches) {
      console.log(`    ${m.name} (${m.file}): listed=${m.listed}, actual=${m.actual}`);
    }
  } else {
    console.log(`  All question counts match`);
  }
}

// 3. Summary
console.log(`\n=== SUMMARY ===`);
console.log(`Total question files: ${questionFiles.length}`);
console.log(`Total questions: ${Object.values(fileCounts).reduce((a, b) => a + b, 0)}`);
console.log(`Total unique IDs: ${allIds.size}`);
console.log(`Total diagram references: ${allDiagrams.size}`);
console.log(`Total images in public/images/: ${existingImages.size}`);
console.log(`Errors: ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);

if (totalErrors > 0) {
  process.exit(1);
}
