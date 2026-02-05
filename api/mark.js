export const config = {
  runtime: 'edge',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const allEnvKeys = Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('gemini'));
    return new Response(JSON.stringify({
      error: 'API key not configured. Set GEMINI_API_KEY in Vercel environment variables.',
      debug: `Found env keys matching "gemini": ${allEnvKeys.length ? allEnvKeys.join(', ') : 'none'}`,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { parts } = body;

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return new Response(JSON.stringify({ error: 'No parts provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildPrompt(parts);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(content);
    validateResponse(parsed);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI marking error:', error);
    return new Response(JSON.stringify({ error: error.message || 'AI marking failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function buildPrompt(parts) {
  return `You are a strict GCSE Physics examiner. Mark the following student answers against the mark schemes provided.

For each marking point, determine if the student has earned the mark. Be strict but fair — the student must demonstrate the required understanding to earn each mark.

IMPORTANT: In your comments, address the student directly using "you" / "your answer" (e.g. "You correctly identified..." or "Your answer does not mention..."). Never refer to "the student" in third person.

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no code blocks, just JSON):
{
  "questions": [
    {
      "partLabel": "a",
      "marks": [
        {
          "point": "the mark scheme point text",
          "awarded": true,
          "comment": "Brief explanation (1-2 sentences) of why mark was/wasn't awarded"
        }
      ]
    }
  ]
}

Here are the questions to mark:

${parts.map((p) => `
---
PART ${p.partLabel}:
Question: ${p.questionText}

Student's answer: ${p.answer || '(no answer provided)'}

Mark scheme points to check:
${p.markScheme.map((ms, j) => `${j + 1}. ${ms}`).join('\n')}
---
`).join('\n')}

Remember: Return ONLY the JSON object, no other text or formatting.`;
}

function validateResponse(parsed) {
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid response structure: missing questions array');
  }
  for (const q of parsed.questions) {
    if (!q.partLabel || !Array.isArray(q.marks)) {
      throw new Error('Invalid question structure: missing partLabel or marks');
    }
    for (const m of q.marks) {
      if (typeof m.awarded !== 'boolean') {
        throw new Error('Invalid mark structure: awarded must be boolean');
      }
      if (typeof m.comment !== 'string') {
        m.comment = '';
      }
    }
  }
}
