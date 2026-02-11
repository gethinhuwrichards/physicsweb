Bug Report – Question Rendering & Mark Scheme Issues
Environment

Platform: Physics exam question website

Context: Parsed questions (docx → JSON pipeline)

Date: 11 Feb

Affected topics: Forces, Particle Model, Electricity

Summary

Multiple questions are rendering incorrectly on the frontend. The issues fall into four categories:

Incorrect or missing diagrams

Graphs not displaying

Incorrect mark scheme values

Incorrect contextual visuals (e.g. wrong component image)

These errors suggest issues in:

Asset linking during parsing

Figure/graph reference mapping

JSON → component rendering

Mark scheme value parsing

Detailed Issues
1. Wrong Diagram Displayed
Question ID	Title	Topic	Issue
rf-4	Forces on a swimmer	Forces	Wrong diagram shown
rf-2	Sky-diver in free fall	Forces	Wrong diagram shown

Expected:
Diagram matches question text and mark scheme context.

Actual:
Unrelated diagram rendered.

Likely Cause:

Incorrect figure index mapping

Shared figure references between questions

Caching issue in diagram component

2. Diagram Missing
Question ID	Title	Topic	Issue
forces-motion2	Speed, velocity and...	Forces	Diagram missing
forces-motion3	Newton's third law...	Forces	Diagram missing

Expected:
Diagram should render inline with question.

Actual:
No diagram displayed.

Likely Cause:

Missing asset in JSON

Parsing skipped embedded image

Incorrect relative path

3. Graph Not Displayed
Question ID	Title	Topic	Issue
forces-motion10	Stopping distances...	Forces	No graph
forces-motion15	Falling objects and...	Forces	No graph

Expected:
Distance-time or relevant graph should render.

Actual:
Graph absent.

Likely Cause:

Graph treated as image but not extracted

Table/graph object not converted to image during parsing

Figure reference not attached to question JSON

4. Incorrect Data / Mark Scheme Error
Question ID	Title	Topic	Issue
forces-motion16	Distance-time graph...	Forces	Mark scheme shows 125 instead of 25

Expected:
Correct numerical mark scheme value: 25

Actual:
Displays: 125

Likely Cause:

OCR digit duplication

String concatenation bug during parsing

Numeric conversion issue

5. Contextual Asset Incorrect
Question ID	Title	Topic	Issue
dom-elec4	Three-pin plugs and...	Electricity	Metal case shown incorrectly

Expected:
Correct plug casing image.

Actual:
Incorrect or misleading visual.

6. Missing Visual Element
Question ID	Title	Topic	Issue
gas-pressure9	Kinetic theory of solids...	Particle Model	Box not shown

Expected:
Box/container diagram visible.

Actual:
Not rendered.

Impact

Students cannot answer correctly without diagrams/graphs.

Marking may produce incorrect results.

Reduces trust in system accuracy.

High cognitive load due to missing context.

Suggested Fixes
1. Parsing Layer

Validate that every figureRef in JSON corresponds to a real asset.

Add post-parse validation:

If question text references “diagram” or “graph”, assert presence of figure.

Add checksum validation for numeric values in mark scheme.

2. Frontend Rendering

Add fallback error logging when image fails to load.

Console warning if figureRef undefined.

Add visual placeholder for missing images (e.g. "⚠ Diagram missing").

3. QA Script

Create automated validation:

Loop through all questions:

If contains("graph") → must have figure asset.

If markValue > 50 for 1–3 mark questions → flag.

If mainTopic = Forces AND subtopic = Resolving Forces → ensure diagram exists.