# AI Review Mode

## Overview
Integrate AI marking into the site. It will check student answers against the mark scheme by making an API call to Google Gemini (gemini-2.5-flash).

## API Key Handling
- API key stored in `.env.local` as `GEMINI_API_KEY` (never committed to repo — .env.local is gitignored by default in Next.js).
- All Gemini calls proxied through a Vercel API route (`/api/mark`) so the key stays server-side.
- Client sends question data to `/api/mark`, server attaches key and forwards to Gemini, returns result to client.

## Toggle
- AI mode is toggleable. Add a settings/menu area in the top right alongside day/night mode toggle.
- If toggle is off, no changes to site — everything functions as-is.

## How It Should Function
- AI mode is a separate step accessed after self-review.
- In AI mode, instead of the "submit marks" button at end of self-review, the button says "check marks".
- Clicking "check marks" sends a single batched API call to `/api/mark` containing all self-marked questions (not automarked questions).
- The API route constructs a prompt instructing Gemini to check each student answer against its mark scheme and return structured JSON.

## Prompt / Response Contract
- Prompt explicitly requests JSON-only output in this schema:
```json
{
  "questions": [
    {
      "questionId": "string",
      "marks": [
        {
          "point": "mark scheme point text",
          "awarded": true,
          "comment": "Brief explanation of why mark was/wasn't awarded"
        }
      ]
    }
  ]
}
```
- Parse the response with error handling — if JSON parsing fails or response is malformed, fall back to standard review mode (standard submit - show score page). Give a message like "AI marking unavailable right now — here are the mark scheme answers."

## AI Review Screen
- Header shows self-awarded marks total on the left, AI-awarded marks total on the right. Use the existing red/green/yellow colour styling. Header stays fixed/sticky through scroll.
- Below the header, questions are displayed in a similar format to the existing review mode. Answers are locked and not editable.
- Below each answer, the mark scheme is shown with a tick or cross on each marking point, plus the AI comment for that point.
- Students scroll down through all questions. At the bottom, "try another question" button appears.
- Site navigation breadcrumb is not shown in this mode.

## Error Handling
- Loading state while waiting for API response (spinner or skeleton).
- If API call fails, times out (suggest ~15s timeout), or returns unparseable data: fall back to standard review mode with a brief message ("AI marking unavailable right now").
- If a student submits a blank or very short answer, still send it — let Gemini mark it as 0 with comments, which is useful feedback.

## UI Notes
- Keep styling consistent with the rest of the site — answers should appear as they do in existing review mode.
- AI comments should be visually distinct but not dominant — secondary text style beneath each mark point.
- The comparison header should include brief framing copy to manage expectations, e.g. "AI marks like a strict examiner — use any differences to spot where you can improve."