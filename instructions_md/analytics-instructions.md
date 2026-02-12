# Analytics Implementation Requirements

## Context
- We need anonymous user analytics tracking. 
- Currently on branch with backend in place. But for the time being want accounts to become invisible - no sign ins needed and all questions available to all users. No login/signup UI — just silent background tracking. 

## Important Notes
- Reuse the existing Supabase client — don't create a new one url: (https://pzqzuolcnkvlvwrtmnnv.supabase.co) Publishable key: sb_publishable_ogWb8wr11UjDfM7fuoXZOQ_oDjrtIll
- Analytics tracking should be completely invisible to the user
- Will likely place accounts back so leave code for future, just make invisible.

## What to track
I need user information to improve experience. For this I would like to track:
- Number of unique users.
- Number of times users returned to site for each unique user.
- Time spent per session and total time spent for each unique user.
- How many times each question was answered (including each individual part of the questions). This should include data on which parts of the questions were left blank. Include question views, answers, skips, completion %

## Display
Need to build Admin Analytics Dashboard
Create a dashboard page at route `/admin/analytics` (no link in the nav, just accessible by URL). It should:
- Call the Supabase RPC functions to fetch all metrics
- Display summary cards at the top: unique users, total visits, average session duration, average questions answered per session
- Track this over time - make graph of daily averages
- Show a table of most-skipped questions
- Show a table of question completion rates (question_id, views, answers, skips, completion %)
- Style it to match the existing site theme
- No auth protection needed yet

