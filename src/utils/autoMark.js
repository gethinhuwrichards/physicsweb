export function autoMarkSingleChoice(part, selectedIndex) {
  const isCorrect = selectedIndex === part.correctAnswer;
  return {
    score: isCorrect ? part.marks : 0,
    isCorrect,
    selectedIndex,
    correctIndex: part.correctAnswer,
  };
}

export function autoMarkMultiChoice(part, selectedIndices) {
  const selected = selectedIndices || [];
  const correctSet = new Set(part.correctAnswers);

  if (part.scoring === 'partial') {
    const score = Math.min(selected.filter(i => correctSet.has(i)).length, part.marks);
    return { score, selectedIndices: selected, correctAnswers: part.correctAnswers };
  }

  // all-or-nothing (default)
  const allCorrect = selected.length === correctSet.size && selected.every(i => correctSet.has(i));
  return {
    score: allCorrect ? part.marks : 0,
    isCorrect: allCorrect,
    selectedIndices: selected,
    correctAnswers: part.correctAnswers,
  };
}

export function autoMarkGapFill(part, userAnswers) {
  const results = part.correctAnswers.map((correct, i) => {
    const userAnswer = (userAnswers[i] || '').trim().toLowerCase();
    const isCorrect = userAnswer === correct.toLowerCase();
    return { isCorrect, userAnswer, correctAnswer: correct };
  });
  const correctCount = results.filter(r => r.isCorrect).length;
  return {
    score: Math.min(correctCount, part.marks),
    results,
  };
}

export function autoMarkTickBoxTable(part, selections) {
  const sel = selections || [];
  const results = part.rows.map((row, i) => {
    const isCorrect = sel[i] === row.correctColumn;
    return { isCorrect, selected: sel[i] ?? null, correctColumn: row.correctColumn };
  });
  const score = Math.min(results.filter(r => r.isCorrect).length, part.marks);
  return { score, results };
}

export function autoMarkMatchUp(part, links) {
  const userLinks = links || {};
  const results = part.correctLinks.map(([leftIdx, rightIdx]) => {
    const isCorrect = userLinks[leftIdx] === rightIdx;
    return { isCorrect, leftIdx, rightIdx, userLinked: userLinks[leftIdx] };
  });
  const score = Math.min(results.filter(r => r.isCorrect).length, part.marks);
  return { score, results, userLinks };
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isCloseEnough(input, target) {
  if (input === target) return true;
  const len = target.length;
  // Very short words (1-2 chars like "DC"): exact only
  if (len <= 2) return false;
  const maxDist = len <= 5 ? 1 : 2;
  return levenshtein(input, target) <= maxDist;
}

function isCloseEnoughPhrase(studentWords, phrase) {
  const phraseWords = phrase.toLowerCase().split(/\s+/);
  if (phraseWords.length === 1) {
    return studentWords.some(w => isCloseEnough(w, phraseWords[0]));
  }
  // Multi-word phrase: sliding window over student words
  for (let i = 0; i <= studentWords.length - phraseWords.length; i++) {
    const allMatch = phraseWords.every((pw, j) => isCloseEnough(studentWords[i + j], pw));
    if (allMatch) return true;
  }
  return false;
}

function matchesKeywords(rawLower, keywords) {
  const studentWords = rawLower.split(/\s+/).filter(w => w.length > 0);
  if (studentWords.length === 0) return false;
  return keywords.every(synonymGroup =>
    synonymGroup.some(synonym => isCloseEnoughPhrase(studentWords, synonym.toLowerCase()))
  );
}

export function autoMarkShortAnswer(part, userAnswer) {
  const raw = (userAnswer || '').trim();
  const accepted = part.acceptedAnswers || [];

  // Numerical short-answer: compare as numbers, skip fuzzy text matching
  if (part.numerical) {
    const cleaned = raw.replace(/,/g, '').replace(/\s+/g, '');
    const student = parseFloat(cleaned);
    const correct = parseFloat(accepted[0]);
    let isCorrect = false;
    if (!isNaN(student) && !isNaN(correct)) {
      const tol = part.tolerance || 0;
      if (tol === 0) {
        isCorrect = student === correct;
      } else if (correct !== 0) {
        isCorrect = Math.abs((student - correct) / correct) <= tol;
      } else {
        isCorrect = Math.abs(student) <= tol;
      }
    }
    return {
      score: isCorrect ? part.marks : 0,
      isCorrect,
      misspelt: false,
      keywordMatched: false,
      userAnswer: raw,
      correctAnswer: accepted[0] || '',
    };
  }

  const rawLower = raw.toLowerCase();
  let isCorrect = false;
  let misspelt = false;
  let keywordMatched = false;
  if (raw.length > 0) {
    const exactMatch = accepted.some(ans => ans.toLowerCase() === rawLower);
    if (exactMatch) {
      isCorrect = true;
    } else {
      const fuzzyMatch = accepted.some(ans => isCloseEnough(rawLower, ans.toLowerCase()));
      if (fuzzyMatch) {
        isCorrect = true;
        misspelt = true;
      } else if (part.keywords && part.keywords.length > 0) {
        if (matchesKeywords(rawLower, part.keywords)) {
          isCorrect = true;
          keywordMatched = true;
        }
      }
    }
  }
  return {
    score: isCorrect ? part.marks : 0,
    isCorrect,
    misspelt,
    keywordMatched,
    userAnswer: raw,
    correctAnswer: accepted[0] || '',
  };
}

export function autoMarkSelectAndExplain(part, answer) {
  const selected = answer ? answer.selectedOption : null;
  const selectionCorrect = selected === part.correctAnswer;
  return {
    score: selectionCorrect ? 1 : 0,
    selectionCorrect,
    selectedOption: selected,
    correctAnswer: part.correctAnswer,
  };
}

export function autoMarkTableFill(part, userAnswers) {
  const answers = userAnswers || [];
  const results = part.correctAnswers.map((entry, i) => {
    const accepted = Array.isArray(entry) ? entry : [entry];
    const raw = (answers[i] || '').trim();
    const rawLower = raw.toLowerCase();
    let isCorrect = false;
    let misspelt = false;
    if (raw.length > 0) {
      const exactMatch = accepted.some(ans => ans.toLowerCase() === rawLower);
      if (exactMatch) {
        isCorrect = true;
      } else {
        const fuzzyMatch = accepted.some(ans => isCloseEnough(rawLower, ans.toLowerCase()));
        if (fuzzyMatch) {
          isCorrect = true;
          misspelt = true;
        }
      }
    }
    return { isCorrect, misspelt, userAnswer: raw, correctAnswer: accepted[0] };
  });
  const correctCount = results.filter(r => r.isCorrect).length;
  return {
    score: Math.min(correctCount, part.marks),
    results,
  };
}

export function autoMarkCalculation(part, answer) {
  const raw = answer && answer.finalAnswer != null ? String(answer.finalAnswer).trim() : '';
  const parsed = parseFloat(raw);
  const correct = part.correctAnswer;
  const tolerance = part.tolerance || 0.01;

  let isCorrect = false;
  if (!isNaN(parsed) && correct !== 0) {
    isCorrect = Math.abs((parsed - correct) / correct) <= tolerance;
  } else if (!isNaN(parsed) && correct === 0) {
    isCorrect = Math.abs(parsed) <= tolerance;
  }

  return {
    score: isCorrect ? part.marks : 0,
    isCorrect,
    userAnswer: raw,
    correctAnswer: correct,
  };
}
