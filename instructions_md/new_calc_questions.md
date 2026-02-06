
Categorisation of numerical questions
All numerical calculations (2–4 marks) are a single question type. Question type is 'Single equation calculation'

## UI Layout
- Students are first presented with a final answer box for their numerical answer.
- A "Show Working" button is available. Clicking it reveals the full working interface (equation selection, steps, calculator).
- Units are not required for final answer and do not carry marks.

## Equation Selection
- Before any working steps, students are presented with three equations to choose from.
- All three must be real, distinct equations from the relevant topic area (not variations of the same equation).
- Selecting the correct equation is part of the first mark (equation + substitution together).

## Working Steps UI
- After equation selection, students see a Step 1 text entry box.
- A clickable "Add a step" button to the right adds Step 2, Step 3, etc. (up to 6 steps max).
- All steps remain editable — students can go back and change any step at any time.
- Placeholder text: "Show your substitution, rearrangement, or calculation here"

## Calculator Input
- Displayed alongside the working steps.
- Buttons: digits 0–9, decimal point, basic operators (+, −, ×, ÷), squared (²), power (^), brackets ( ), equals (=).
- Symbols: θ, λ, ρ.
- Clicking a button types into the currently selected step box.
- Squared/power applies to the last digit only, unless brackets are used.

## Equals / Evaluation
- Pressing equals evaluates the expression in the last step.
- Valid form: a single symbol as the subject on the left, a computable arithmetic expression on the right (e.g. `P = 3 × 4`, `E = 0.5 × 12 × 3^2`).
- "Single symbol as subject" means no operations on the left side — the symbol must already be isolated (any symbol is acceptable).
- If valid: evaluate the right-hand side and place the result in the final answer box.
- If not valid (e.g. `12 = P / 3`): do not evaluate. Display message below calculator: "Rearrange the equation so the unknown is the subject."
- Standard form expressions (e.g. `3.2 × 10^8`) must be supported.

## Final Answer
- Separate box for the numerical answer, populated by evaluation or manual entry.
- Units are not required and do not carry marks.

## Mark Scheme
- First mark: correct equation selected AND correct substitution of values (always assessed together).
- Subsequent marks: rearrangement, calculation, final answer as appropriate to the question.

## Example Mark Scheme Structure by Marks
These are typical marks scheme that might be expected but aren't rigid and order is loose. 
### 2 marks — Substitute and calculate
- Mark 1: Correct equation selected + correct substitution of values
- Mark 2: Correct final answer
### 3 marks — Substitute, rearrange, and calculate
- Mark 1: Correct equation selected + correct substitution of values
- Mark 2: Correct rearrangement to isolate the unknown
- Mark 3: Correct final answer
### 4 marks — Unit conversion, substitute, rearrange, and calculate
- Mark 1: Correct unit conversion (e.g. km to m, kW to W, minutes to seconds)
- Mark 2: Correct equation selected + correct substitution of values
- Mark 3: Correct rearrangement to isolate the unknown
- Mark 4: Correct final answer

## Marking Approach
- Correct final answer which rounds to final answer on mark scheme always evaluates as correct to full marks. 
- Working is self-evaluated: as long as the relevant step is present and correct, the mark is awarded regardless of the order steps were completed in.



# Bug Fixes — Numerical Questions

1. **Substitution should match equation form**: Questions should expect students to substitute into the equation exactly as given in the equation selection. e.g. if the selected equation is V = I × R, the expected substitution is V = 5 × 4, not a rearranged form. The subject stays on the left; values replace the other symbols.

2. **Allow pure arithmetic evaluation**: Pressing equals should evaluate pure arithmetic expressions (e.g. `3 × 4`, `12 / 3`) without requiring a symbol on the left. Place the result in the final answer box. The only case that should fail is when a symbol appears but is NOT isolated as the subject on the left (e.g. `12 = P / 3`, `3 × R = 12`).

3. **Fix special character rendering**: Greek letters and symbols (e.g. Ω, θ, λ, ρ) in the question are displaying as raw escape codes or LaTeX strings instead of rendered characters (example: A 12 V battery is connected to a 48 \u03A9 resistor. Calculate the current flowing through the resistor.
Answer:). Ensure all special characters display correctly using proper Unicode or rendered symbols.

4. **Calculator button layout**: Digits 0–9 should be in a grid on the left, with operators and symbols aligned on the right.
```