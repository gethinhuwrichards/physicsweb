import React, { useState, useMemo, useCallback, useRef } from 'react';
import { renderLatex } from '../../utils/renderLatex';

function safeEval(expr) {
  // Normalise display characters to JS operators
  let sanitised = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '**2')
    .replace(/\^/g, '**');
  // Handle √: parenthesized expression or number — convert to **0.5
  sanitised = sanitised.replace(/√\(([^)]+)\)/g, '(($1)**0.5)');
  sanitised = sanitised.replace(/√([\d.]+)/g, '(($1)**0.5)');
  // Whitelist: digits, operators, parentheses, decimal point, spaces, scientific e
  if (!/^[\d+\-*/().e\s]+$/.test(sanitised)) return null;
  try {
    const result = Function('"use strict"; return (' + sanitised + ')')();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function cleanResult(n) {
  return parseFloat(n.toPrecision(12));
}

// Pattern: a single symbol as subject on LHS, expression on RHS
const SYMBOL_EQUALS_PATTERN = /^([A-Za-z\u03B8\u03BB\u03C1_][A-Za-z0-9_]*)\s*=\s*(.+)$/;
// Pattern: expression on LHS, single symbol on RHS (e.g. "3 × 4 = k")
const EXPR_EQUALS_SYMBOL_PATTERN = /^(.+?)\s*=\s*([A-Za-z\u03B8\u03BB\u03C1_][A-Za-z0-9_]*)\s*$/;
// Pattern: expression followed by trailing equals (e.g. "3 × 4 =")
const EXPR_TRAILING_EQUALS = /^(.+?)\s*=\s*$/;
// Pattern: detects any letter/symbol anywhere in the expression
const HAS_SYMBOL = /[A-Za-z\u03B8\u03BB\u03C1_]/;

// Digit pad (3 columns)
const DIGIT_BUTTONS = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '0', value: '0' },
  { label: '.', value: '.' },
  { label: '=', value: '=', className: 'calc-btn-operator' },
];

// Operators (2-column grid, top to bottom: ⌫/√, ^/x², ×/÷, +/−)
const OPERATOR_BUTTONS = [
  { label: '√', value: '√', className: 'calc-btn-operator' },
  { label: '⌫', isBackspace: true, className: 'calc-btn-operator' },
  { label: '^', value: '^', className: 'calc-btn-operator' },
  { label: 'x²', value: '²', className: 'calc-btn-operator' },
  { label: '×', value: '×', className: 'calc-btn-operator' },
  { label: '÷', value: '÷', className: 'calc-btn-operator' },
  { label: '+', value: '+', className: 'calc-btn-operator' },
  { label: '−', value: '−', className: 'calc-btn-operator' },
];

// Symbols alphabetically: Latin then Greek (6 columns)
const SYMBOL_BUTTONS = [
  { label: 'a', value: 'a', className: 'calc-btn-symbol' },
  { label: 'c', value: 'c', className: 'calc-btn-symbol' },
  { label: 'd', value: 'd', className: 'calc-btn-symbol' },
  { label: 'E', value: 'E', className: 'calc-btn-symbol' },
  { label: 'F', value: 'F', className: 'calc-btn-symbol' },
  { label: 'f', value: 'f', className: 'calc-btn-symbol' },
  { label: 'g', value: 'g', className: 'calc-btn-symbol' },
  { label: 'I', value: 'I', className: 'calc-btn-symbol' },
  { label: 'k', value: 'k', className: 'calc-btn-symbol' },
  { label: 'm', value: 'm', className: 'calc-btn-symbol' },
  { label: 'P', value: 'P', className: 'calc-btn-symbol' },
  { label: 'p', value: 'p', className: 'calc-btn-symbol' },
  { label: 'Q', value: 'Q', className: 'calc-btn-symbol' },
  { label: 'R', value: 'R', className: 'calc-btn-symbol' },
  { label: 's', value: 's', className: 'calc-btn-symbol' },
  { label: 'T', value: 'T', className: 'calc-btn-symbol' },
  { label: 't', value: 't', className: 'calc-btn-symbol' },
  { label: 'u', value: 'u', className: 'calc-btn-symbol' },
  { label: 'V', value: 'V', className: 'calc-btn-symbol' },
  { label: 'v', value: 'v', className: 'calc-btn-symbol' },
  { label: 'W', value: 'W', className: 'calc-btn-symbol' },
  { label: '\u03B8', value: '\u03B8', className: 'calc-btn-symbol-greek' },
  { label: '\u03BB', value: '\u03BB', className: 'calc-btn-symbol-greek' },
  { label: '\u03C1', value: '\u03C1', className: 'calc-btn-symbol-greek' },
];

const MAX_STEPS = 6;

export default function CalculationInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answer = value || {};
  const steps = answer.steps || [''];
  const [workingOpen, setWorkingOpen] = useState(false);
  const [calcMessage, setCalcMessage] = useState(null);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const focusedStepRef = useRef(0);
  const stepInputRefs = useRef([]);
  const finalAnswerRef = useRef(null);

  const update = useCallback((field, val) => {
    onChange({ ...answer, [field]: val });
  }, [answer, onChange]);

  const updateStep = useCallback((index, val) => {
    const newSteps = [...steps];
    newSteps[index] = val;
    onChange({ ...answer, steps: newSteps });
  }, [answer, steps, onChange]);

  const addStep = useCallback(() => {
    if (steps.length >= MAX_STEPS) return;
    const newSteps = [...steps, ''];
    onChange({ ...answer, steps: newSteps });
  }, [answer, steps, onChange]);

  const removeStep = useCallback((index) => {
    if (steps.length <= 1 || index === 0) return;
    const newSteps = steps.filter((_, i) => i !== index);
    onChange({ ...answer, steps: newSteps });
    if (focusedStepRef.current >= newSteps.length) {
      focusedStepRef.current = newSteps.length - 1;
    }
  }, [answer, steps, onChange]);

  const renderedEquations = useMemo(() => {
    if (!part.equations) return [];
    return part.equations.map(eq => renderLatex(eq));
  }, [part.equations]);

  const handleEquals = useCallback(() => {
    // Find the last non-empty step
    let stepText = '';
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].trim()) { stepText = steps[i].trim(); break; }
    }
    if (!stepText) { setCalcMessage(null); return; }

    // Case 1: symbol = expression (e.g. "P = 3 × 4")
    const match = stepText.match(SYMBOL_EQUALS_PATTERN);
    if (match) {
      const raw = safeEval(match[2]);
      if (raw === null) {
        setCalcMessage('Could not evaluate the expression. Check your working.');
        return;
      }
      const result = cleanResult(raw);
      setCalcMessage(null);
      onChange({ ...answer, finalAnswer: String(result) });
      requestAnimationFrame(() => {
        finalAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    // Case 2: expression = symbol (e.g. "3 × 4 = k")
    const matchReverse = stepText.match(EXPR_EQUALS_SYMBOL_PATTERN);
    if (matchReverse) {
      const raw = safeEval(matchReverse[1]);
      if (raw === null) {
        setCalcMessage('Could not evaluate the expression. Check your working.');
        return;
      }
      const result = cleanResult(raw);
      setCalcMessage(null);
      onChange({ ...answer, finalAnswer: String(result) });
      requestAnimationFrame(() => {
        finalAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    // Case 3: expression followed by trailing equals (e.g. "3 × 4 =")
    const matchTrailing = stepText.match(EXPR_TRAILING_EQUALS);
    if (matchTrailing) {
      const raw = safeEval(matchTrailing[1]);
      if (raw === null) {
        setCalcMessage('Could not evaluate the expression. Check your working.');
        return;
      }
      const result = cleanResult(raw);
      setCalcMessage(null);
      onChange({ ...answer, finalAnswer: String(result) });
      requestAnimationFrame(() => {
        finalAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    // Case 4: pure arithmetic with no symbols (e.g. "3 × 4", "12 / 3")
    if (!HAS_SYMBOL.test(stepText)) {
      const raw = safeEval(stepText);
      if (raw === null) {
        setCalcMessage('Could not evaluate the expression. Check your working.');
        return;
      }
      const result = cleanResult(raw);
      setCalcMessage(null);
      onChange({ ...answer, finalAnswer: String(result) });
      requestAnimationFrame(() => {
        finalAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    // Case 3: has symbols but not in valid "subject = expression" form
    setCalcMessage('Rearrange the equation so the unknown is the subject.');
  }, [steps, answer, onChange]);

  const handleCalcButton = useCallback((btn) => {
    if (btn.isEquals) {
      handleEquals();
      return;
    }
    setCalcMessage(null);
    const idx = focusedStepRef.current;
    if (idx == null || idx >= steps.length) return;
    const currentVal = steps[idx] || '';
    const newSteps = [...steps];
    if (btn.isBackspace) {
      newSteps[idx] = currentVal.slice(0, -1);
    } else {
      newSteps[idx] = currentVal + btn.value;
    }
    onChange({ ...answer, steps: newSteps });

    // Restore focus to the step input after button press
    requestAnimationFrame(() => {
      const input = stepInputRefs.current[idx];
      if (input) input.focus();
    });
  }, [steps, answer, onChange, handleEquals]);

  const isCorrect = autoMarkResult?.isCorrect;
  const showFeedback = autoMarkResult != null;

  return (
    <div className="numerical-container">
      <div className="numerical-final-answer" ref={finalAnswerRef}>
        <label className="numerical-final-label">Answer:</label>
        <div className="numerical-final-row">
          <input
            type="text"
            inputMode="decimal"
            className={`numerical-final-input${showFeedback ? (isCorrect ? ' correct' : ' incorrect') : ''}`}
            value={answer.finalAnswer ?? ''}
            onChange={e => update('finalAnswer', e.target.value)}
            disabled={disabled}
            readOnly={disabled}
            placeholder="Enter your answer"
          />
        </div>
        {showFeedback && !isCorrect && (
          <div className="numerical-correct-answer">
            Correct answer: {autoMarkResult.correctAnswer}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`numerical-working-toggle${workingOpen ? ' open' : ''}`}
        onClick={() => setWorkingOpen(o => !o)}
      >
        {workingOpen ? 'Hide working' : 'Show working'}
      </button>

      {workingOpen && (
        <div className="numerical-working">
          {part.equations && part.equations.length > 0 && (
            <div className="numerical-working-section">
              <div className="numerical-working-label">Select equation:</div>
              <div className="numerical-formula-list">
                {part.equations.map((eq, i) => (
                  <label
                    key={i}
                    className={`numerical-formula-option${answer.selectedEquation === i ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`equation-${part.partLabel}`}
                      checked={answer.selectedEquation === i}
                      onChange={() => update('selectedEquation', i)}
                      disabled={disabled}
                    />
                    <span dangerouslySetInnerHTML={{ __html: renderedEquations[i] }} />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="numerical-working-section">
            <div className="numerical-working-label">Working:</div>
            <div className="calc-steps-container">
              {steps.map((step, i) => (
                <div key={i} className="calc-step-row">
                  <span className="calc-step-label">Step {i + 1}</span>
                  <input
                    type="text"
                    ref={el => stepInputRefs.current[i] = el}
                    className="calc-step-input"
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'x') {
                        e.preventDefault();
                        const input = e.target;
                        const start = input.selectionStart;
                        const end = input.selectionEnd;
                        const newVal = step.slice(0, start) + '×' + step.slice(end);
                        updateStep(i, newVal);
                        requestAnimationFrame(() => {
                          input.setSelectionRange(start + 1, start + 1);
                        });
                      }
                    }}
                    onFocus={() => { focusedStepRef.current = i; }}
                    disabled={disabled}
                    readOnly={disabled}
                    placeholder="Show your unit conversion, substitution, rearrangement, or calculation here"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="calc-equals-btn"
                      onMouseDown={e => e.preventDefault()}
                      onClick={handleEquals}
                      style={i !== steps.length - 1 ? { visibility: 'hidden' } : undefined}
                    >
                      Evaluate
                    </button>
                  )}
                </div>
              ))}
              {!disabled && (
                <div className="calc-step-actions">
                  {calcMessage && (
                    <div className="calc-message calc-message-error">
                      {calcMessage}
                    </div>
                  )}
                  <button
                    type="button"
                    className="calc-remove-step-btn"
                    onClick={() => removeStep(steps.length - 1)}
                    disabled={steps.length <= 1}
                  >
                    − Remove step
                  </button>
                  <button
                    type="button"
                    className="calc-add-step-btn"
                    onClick={addStep}
                    disabled={steps.length >= MAX_STEPS}
                  >
                    + Add a step
                  </button>
                </div>
              )}
            </div>
          </div>

          {!disabled && (
            <div className="calc-btn-layout">
              <div className="calc-btn-left">
                <div className="calc-btn-numpad">
                  {DIGIT_BUTTONS.map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      className={btn.className || ''}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleCalcButton(btn)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div className="calc-btn-ops">
                  {OPERATOR_BUTTONS.map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      className={btn.className || ''}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleCalcButton(btn)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="calc-btn-symbols">
                {SYMBOL_BUTTONS.map((btn, i) => (
                  <button
                    key={i}
                    type="button"
                    className={btn.className || ''}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleCalcButton(btn)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="calc-help-btn"
                onClick={() => setHelpExpanded(true)}
              >
                How to use
              </button>
            </div>
          )}
        </div>
      )}

      {helpExpanded && (
        <div className="calc-help-overlay" onClick={() => setHelpExpanded(false)}>
          <div className="calc-help-modal" onClick={e => e.stopPropagation()}>
            <div className="calc-help-title">How to use</div>
            <ol className="calc-help-list">
              <li>Use the <strong>number pad</strong>, <strong>operators</strong>, and <strong>symbol buttons</strong> to type into the working step boxes. You can also type directly with your keyboard.</li>
              <li>Use <strong>+ Add a step</strong> and <strong>− Remove step</strong> to manage your working. Show each stage of your calculation on a separate line.</li>
              <li>Your final step should have the <strong>unknown symbol as the subject</strong> on the left, with a numerical expression on the right. For example:
                <span className="calc-help-example">P = 4.0 × 230</span>
                <span className="calc-help-example">I = 12 ÷ 48</span>
                <span className="calc-help-example">E = 0.5 × 2 × 5²</span>
                You can also enter a pure arithmetic expression without a symbol, e.g. <span className="calc-help-example">3 × 4</span>
              </li>
              <li>Press <strong>Evaluate</strong> to calculate the result of your last step. The answer will be placed in the final answer box above.</li>
            </ol>
            <button
              type="button"
              className="calc-help-ok-btn"
              onClick={() => setHelpExpanded(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
