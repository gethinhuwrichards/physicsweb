
# Change to how short answer are marked
## Problem
- Currently some answers which should be accepted evaluate false (no mark). 
- The issue is for even short answers there are too many possible ways to phrase a question.

## Solution
- Answers still evaluate true or false the same as now.
- But if answer evaluates false it should still be possible for user to change to true. 
- When displaying automatically answered questions text in a yellow badge should show above to the effect: 'Question has been automarked. If question has been evaluated incorrectly you may change'.


## Additional Problem
- Misspelling is being applied to numbers, so for example 25000 would evaluate as true when answer is 23000.

## Solution to additional problem
- Short answers requiring a numerical answer are similarly as numerical questions. 
- Answer is only correct if same as answer given in mark scheme or within tolerance given by the mark scheme.
- Should not provide space for working out (as in numerical questions).
- I would suggest maintaining questions as 'short numerical answer' type but adding a new method of evaluation.  If you disagree please give me reasons why.
- After you have decided go through existing jsons with numerical short answers and check they now evaluate correctly.
