# Types of questions

TYPE 1: Single-choice conceptual (MCQ – one correct)
Multiple choice questions with usually either three or four options.
Examples
-Definitions
-Simple comparisons
-Recall of facts
-Student task
-Select exactly one correct option.
UI
-Radio-button style options
-Large clickable option cards
-Enforce exactly one selection
Marking
-Auto-marked
-1 mark if correct, 0 otherwise
-No partial credit
Notes
-Used heavily for low-load conceptual checks
-Should support diagrams alongside text

TYPE 2: Multiple-choice (multiple correct)
Multiple choice questions with usually four or more options.
Examples
-“Tick two boxes”
-Field/property identification
Student task
-Select a fixed number of correct options (usually 2).
UI
-Checkbox list
-Explicit instruction: “Select 2”
-Prevent selecting more than allowed
Marking
-auto marked
-GCSE-faithful options either:
--All-or-nothing or
--Partial credit with penalty for extra selections (configurable)
Notes
-Must enforce selection count
-Should visually show how many selections remain

TYPE 3: Gap-fill / sentence completion
Fill in the gap with options from a box included in the question
Examples
-Choose-from-the-box statements
-Unit completion
-Short factual insertions
-Fill in the blanks
Student task
-Insert the correct word/value into one or more blanks.
UI
-Dropdown per blank or drag-and-drop tokens
-Each blank is explicit (no parsing “___” from text)
Marking
-Auto-marked
-Each blank independently scored
-Exact match or synonym list
Notes
-Order-sensitive when required
-Avoid free-text spelling where possible


TYPE 4: Extended Written Answers
A written answer to a question. Can be 1 to 6 marks.
Examples
-Describe or explain questions.
-Describe data in a graph or table
-Write a method for an experiment
UI
-Simple textbox with characters. Character limit around 50 words per mark (say 8 characters per word average).
Student task
-Fill in a written answer to a question
Marking
-Self marked by student in marking mode

TYPE 5: Short numerical questions
A numerical question requiring a numerical answer and someway of demonstrating working. Usually 2 or 3 marks (3 when rearrangement required)
Examples
-Calculate using the formula
-Show that..
UI
-Final answer entry: a plain numeric input (plus optional unit handling, can be toggled on/off in JSON).
-Working entry: a guided workflow that lets students show method without us “giving hints” in the prompt. Students can:
--choose a formula
--substitute values
--optionally rearrange
--use an in-built calculator to compute.
--This working area exists to award method marks. It should be structured enough to mark, but not so “tutorial” that it spoon-feeds.
Marking
-Self marked by student in marking mode for each marking point
-If final numerical answer correct award all marks, no need for self-marking

TYPE 6: Write down the correct equation
Students choose an equation
Examples
-Write down the equation for...
UI
-Select equation from four options (radio buttons)
Marking
-Automarked

Type 7: Tick the boxes
Student tick boxes in a table. 
Examples
Put a tick in each row...
UI
-Radio boxes for each row so only one is selectable per row
- Radio boxes are contained in a table - left side shows information - right side two radio boxes. options are indicated by the header.
Marking
-Auto marked
-Strictly one mark per row. 

