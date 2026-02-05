import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Mock AI marking for local development
function mockAIMarkingPlugin(apiKey) {
  return {
    name: 'mock-ai-marking',
    configureServer(server) {
      server.middlewares.use('/api/mark', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { parts } = JSON.parse(body);
            console.log('[Dev API] Received request with', parts?.length || 0, 'parts');
            console.log('[Dev API] API key available:', !!apiKey);

            if (!parts || parts.length === 0) {
              console.log('[Dev API] No parts to mark');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ questions: [] }));
              return;
            }

            // Set to true to use mock responses for testing UI without API
            const USE_MOCK = false;

            if (apiKey && !USE_MOCK) {
              // Use real Gemini API if key is available
              console.log('[Dev API] Calling Gemini API...');
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: buildPrompt(parts) }] }],
                    generationConfig: {
                      temperature: 0.1,
                      maxOutputTokens: 4096,
                      responseMimeType: 'application/json',
                    },
                  }),
                }
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.error('[Dev API] Gemini error response:', errorText);
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
              }

              const data = await response.json();
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

              if (!content) {
                throw new Error('Empty response from Gemini');
              }

              const parsed = JSON.parse(content);
              console.log('[Dev API] Gemini response parsed successfully:', JSON.stringify(parsed).slice(0, 200));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(parsed));
            } else {
              // Return mock response for testing UI
              console.log('[Dev] Using mock AI response for testing');
              const mockResponse = {
                questions: parts.map(p => ({
                  partLabel: p.partLabel,
                  marks: p.markScheme.map((ms, i) => ({
                    point: ms,
                    awarded: Math.random() > 0.4, // Random for testing
                    comment: 'Mock feedback: This is a test response to verify the UI works correctly.',
                  })),
                })),
              };

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(mockResponse));
            }
          } catch (error) {
            console.error('[Dev] AI marking error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    },
  };
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
          "comment": "Brief explanation (1-2 sentences) of why mark was/wasn't awarded, addressing the student as 'you'"
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), mockAIMarkingPlugin(env.GEMINI_API_KEY)],
  };
});
