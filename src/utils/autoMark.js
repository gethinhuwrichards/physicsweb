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
    let score = 0;
    selected.forEach(i => {
      if (correctSet.has(i)) score++;
      else score--;
    });
    score = Math.max(0, Math.min(score, part.marks));
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

export function autoMarkNumerical(part, answer) {
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
