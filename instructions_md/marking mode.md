Marking mode
General framework
- After 'lock in answers' has been pressed page should enter new state where score is calculated.
- Auto marked questions are immediately tallied.
- Self marked questions are marked by user.
- answers are never editable in marking mode

Self Marking
- The page should change and a new box should appear with the title 'Self Marking'
- on the left of the box there is the title 'Student's answer', the question appears below and then below that is users answer. 
- on the right are the marking points, each should have a tick or cross below it which user must click. 
- each click of a tick adds one to the score tally.  
- user can only click next when all marks on a given question have been entered.
- marking mode then moves on to next unmarked question until no more remain.
- At the end we should return to the question page where each question has a clear mark. the total is displayed clearly at the bottom.
- a rough mockup of what this will look like is provided in the design inspo folder (writtenanswermockup.png) though it will vary slightly by question type

TYPE 4: Extended Written Answers
- Answer is shown in full on the left.  if answer is too long for box user can scroll to see what is written.
- all marking points for the question should be queried.
- a specific mock up can be found in design inspo folder (writtenanswermockup.png). 
- Each marking point is scored independently
- Keywords which must be included by student are highlighted in bold

TYPE 5: Short numerical questions
- Answer is shown in full on the left.  
- all marking points for the question should be queried.
- use a similar style to extended written answers except equations/formula should be rendered in latex
- Each marking point is scored independently
- Marking points are:
    correct substitution
    correct rearrangement (only for rearrangement)
    final answer (always wrong in marking mode, just show for clarity)

TYPE 6: Write down the correct equation
- Automarked

Type 7: Tick the boxes
- Auto marked
- Strictly one mark per row (must include this in question-format for llm to parse correctly)