import React, { useState, useMemo, useCallback } from 'react';
import { renderLatex } from '../../utils/renderLatex';

function safeEval(expr) {
  // Whitelist: digits, operators, parentheses, decimal point, caret, spaces
  const sanitised = expr.replace(/\^/g, '**');
  if (!/^[\d+\-*/().e\s*]+$/.test(sanitised)) return null;
  try {
    const result = Function('"use strict"; return (' + sanitised + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    // Round to 12 significant figures to eliminate floating-point noise
    // e.g. 85/0.68 gives 124.99999999999999 instead of 125
    return parseFloat(result.toPrecision(12));
  } catch {
    return null;
  }
}

export default function NumericalInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answer = value || {};
  const [workingOpen, setWorkingOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState(null);

  const update = useCallback((field, val) => {
    onChange({ ...answer, [field]: val });
  }, [answer, onChange]);

  const renderedFormulas = useMemo(() => {
    if (!part.formulas) return [];
    return part.formulas.map(f => renderLatex(f));
  }, [part.formulas]);

  const handleCalc = useCallback(() => {
    const result = safeEval(calcExpr);
    setCalcResult(result);
    if (result !== null) {
      onChange({ ...answer, finalAnswer: String(result) });
    }
  }, [calcExpr, answer, onChange]);

  const handleCalcKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalc();
    }
  }, [handleCalc]);

  const isCorrect = autoMarkResult?.isCorrect;
  const showFeedback = autoMarkResult != null;

  return (
    <div className="numerical-container">
      <div className="numerical-final-answer">
        <label className="numerical-final-label">Answer:</label>
        <div className="numerical-final-row">
          <input
            type="text"
            inputMode="numeric"
            className={`numerical-final-input${showFeedback ? (isCorrect ? ' correct' : ' incorrect') : ''}`}
            value={answer.finalAnswer ?? ''}
            onChange={e => update('finalAnswer', e.target.value)}
            disabled={disabled}
            readOnly={disabled}
            placeholder="Enter your answer"
          />
          {part.showUnit && part.unit && (
            <span className="numerical-unit">{part.unit}</span>
          )}
        </div>
        {showFeedback && !isCorrect && (
          <div className="numerical-correct-answer">
            Correct answer: {autoMarkResult.correctAnswer}{part.showUnit && part.unit ? ` ${part.unit}` : ''}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`numerical-working-toggle${workingOpen ? ' open' : ''}`}
        onClick={() => setWorkingOpen(o => !o)}
        disabled={false}
      >
        {workingOpen ? 'Hide working' : 'Show working'}
      </button>

      {workingOpen && (
        <div className="numerical-working">
          {part.formulas && part.formulas.length > 0 && (
            <div className="numerical-working-section">
              <div className="numerical-working-label">Select formula:</div>
              <div className="numerical-formula-list">
                {part.formulas.map((f, i) => (
                  <label
                    key={i}
                    className={`numerical-formula-option${answer.selectedFormula === i ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`formula-${part.partLabel}`}
                      checked={answer.selectedFormula === i}
                      onChange={() => update('selectedFormula', i)}
                      disabled={disabled}
                    />
                    <span dangerouslySetInnerHTML={{ __html: renderedFormulas[i] }} />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="numerical-working-section">
            <label className="numerical-working-label">Substitution:</label>
            <input
              type="text"
              className="numerical-working-input"
              value={answer.substitution ?? ''}
              onChange={e => update('substitution', e.target.value)}
              disabled={disabled}
              readOnly={disabled}
              placeholder="e.g. 0.5 x 1500 x 30^2"
            />
          </div>

          {part.requiresRearrangement && (
            <div className="numerical-working-section">
              <label className="numerical-working-label">Rearrangement:</label>
              <input
                type="text"
                className="numerical-working-input"
                value={answer.rearrangement ?? ''}
                onChange={e => update('rearrangement', e.target.value)}
                disabled={disabled}
                readOnly={disabled}
                placeholder="Show rearranged formula"
              />
            </div>
          )}

          {!disabled && (
            <div className="numerical-calculator">
              <div className="numerical-working-label">Calculator:</div>
              <div className="numerical-calc-row">
                <input
                  type="text"
                  className="numerical-calc-input"
                  value={calcExpr}
                  onChange={e => setCalcExpr(e.target.value)}
                  onKeyDown={handleCalcKeyDown}
                  placeholder="e.g. 0.5 * 1500 * 30^2"
                />
                <button
                  type="button"
                  className="numerical-calc-btn"
                  onClick={handleCalc}
                >=</button>
                <span className="numerical-calc-result">
                  {calcResult !== null ? calcResult : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
