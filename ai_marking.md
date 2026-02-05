
AI Review mode 

Plan is to integrate AI marking into the site. It will check students answers against mark scheme by making an api call to google gemini.


Lets make the AI mode toggleable for now. put it into a menu along with day night mode in top right. if toggle is off no changes to site - everything functions as is.

How it should function:
-AI mode exists as a seperate mode which is accessed after self review. 
-In AI mode instead of submit marks button at end of self review, button says 'check marks'.  
-API call made to gemini. Gemini is instructed to check student answer against mark scheme and award marks. This only applies to self-marked questions, automarked questions should not be queried.
-Gemini returns a true/false for each marking point.
-Gemini returns a short comment on why a mark was or wasn't awarded (for each marking point).
- When data is returned students are given new question review screen. Screen has a header with their self awarded marks total on the left, and the AI awarded marking total on the right.  Keep the styling of red/green/yellow.  header should remain visible through scroll. 
- below that the questions are shown in a similar format to the question page.  answers are locked and can't be changed. below each answer is the mark scheme with a tick or cross on each marking point and the returned comment. 
- students scroll down the page until reaching the bottom - where the try another question appears.
- site navigation breadcrumb not shown in this mode.
- Try to keep the UI style in line with rest of the site. for example answers should appear as they do in review mode. 
