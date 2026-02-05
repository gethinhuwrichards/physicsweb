
New logic:
- keep toggle for ai mode
- score page shows as default in ai mode (like in non-ai mode), even when self marked questions.


- new button available called "ai review" available when ai mode on, it replaces review mode. button is same format as 'try another question'.
- on clicking "ai review" self marked questions are processed as before by gemini. 
- in ai review, questions and student student answer are shown, on the right the marking done by ai is shown, along with the comment from each marking point.  
- the students self review is not displayed in any part. the only exception is that the 'your mark' still displays in the header. keep the header the same.
- automarked questions are also shown but are de-emphasised. lets make them slightly transparent and make it clear in the space to the right they were automarked.  
- at the bottom place the 'try another question' button and the smaller 'report bug' and 'reset' buttons.
- if student navigates back to that question all this information should be redisplayed (though with the breadcrumb and question at the header).  the 'your score' and 'true score' display at the bottom.
- if ai review was never requested navigating back to question should display standard review (as if ai mode were not on).  ai review button then also becomes available, in which case we go through same ai review process described above.
