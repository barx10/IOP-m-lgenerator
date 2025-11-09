import { GoogleGenAI, Type } from "@google/genai";

// Simple in-memory rate limiting (resets on function cold start)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests per window (balanced for school/individual use)
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      error: 'For mange forespørsler. Vennligst prøv igjen om en time.',
      retryAfter: 3600 
    });
  }

  try {
    const { profile, framework, selectedGoals, expertAssessment } = req.body;

    if (!profile || !framework || !selectedGoals) {
      return res.status(400).json({ error: 'Mangler påkrevde felter' });
    }

    // Initialize Gemini with server-side API key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `Du er spesialpedagog. Du skriver konkrete forslag til IOP for elever med spesialundervisning.

Basert på input skal du generere:
1) 1 kort note som kobler sakkyndig vurdering, kjerneelementer og kompetansemål til elevens behov
2) 2 ferdighetsmål (praktiske ferdigheter)
3) 2 kunnskapsmål (teoretisk kunnskap)
4) 1 kort samlet vurdering av om målene er realistiske og i tråd med alder
5) 1 kort plan for hvordan målene skal evalueres i perioden

For både ferdighetsmål og kunnskapsmål skal du lage:
- Ett Tilpasset nivå (realistisk oppnåelig med støtte)
- Ett Utfordrende nivå (strekker eleven videre)

VIKTIG: Skriv BARE selve målet i 'goal'-feltet, IKKE inkluder nivå-teksten "Tilpasset" eller "Utfordrende" i målteksten.`;

    const goalsList = selectedGoals.map((goal: string) => `- ${goal}`).join('\n');

    let coreElementText = '';
    if (profile.selectedCoreElement) {
      coreElementText = `**Kjerneelement:** ${profile.selectedCoreElement}\n`;
    }

    let crossCurricularText = '';
    if (profile.selectedCrossCurricularTheme) {
      crossCurricularText = `**Tverrfaglig tema:** ${profile.selectedCrossCurricularTheme}\n`;
    }

    // Map grade value to readable text
    const gradeLabels: Record<string, string> = {
      '2': 'etter 2. trinn',
      '4': 'etter 4. trinn',
      '7': 'etter 7. trinn',
      '10': 'etter 10. trinn',
      'vg1': 'Vg1',
      'vg2': 'Vg2',
      'vg3': 'Vg3'
    };
    const gradeText = gradeLabels[profile.grade] || profile.grade;

    const userPrompt = `
**Kompetansemål-nivå:** ${gradeText}
**Fag:** ${profile.subject}
**Tema:** ${profile.topic}
${expertAssessment ? `**Sakkyndig:** ${expertAssessment}\n` : ''}${coreElementText}${crossCurricularText}**Kompetansemål:**
${goalsList}
`.trim();

    const iopGoalSchema = {
      type: Type.OBJECT,
      properties: {
        goal: {
          type: Type.STRING,
          description: "Selve målet (kort og konkret). IKKE inkluder 'Tilpasset' eller 'Utfordrende' i teksten."
        },
        measures: {
          type: Type.STRING,
          description: "Hvordan målet skal oppnås (konkrete tiltak og metoder)"
        },
        evaluation: {
          type: Type.STRING,
          description: "Hvordan målet skal vurderes/evalueres",
          nullable: true
        },
        anchoring: {
          type: Type.STRING,
          description: "Kobling til kompetansemål og/eller kjerneelementer fra læreplanen"
        }
      },
      required: ["goal", "measures", "anchoring"]
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        coreElementsInfluenceNote: {
          type: Type.STRING,
          description: "En kort note (2-4 setninger) som beskriver hvordan kjerneelementer og kompetansemål passer til elevens behov basert på sakkyndig vurdering"
        },
        skillsSuggestions: {
          type: Type.ARRAY,
          items: iopGoalSchema,
          description: "Forslag til ferdighetsmål (praktiske ferdigheter eleven skal utvikle). 1 tilpasset nivå + 1 utfordrende nivå.",
          minItems: 2,
          maxItems: 2
        },
        knowledgeSuggestions: {
          type: Type.ARRAY,
          items: iopGoalSchema,
          description: "Forslag til kunnskapsmål (teoretisk kunnskap og forståelse). 1 tilpasset nivå + 1 utfordrende nivå.",
          minItems: 2,
          maxItems: 2
        },
        overallBenefitSuggestion: {
          type: Type.OBJECT,
          properties: {
            goal: {
              type: Type.STRING,
              description: "Samlet vurdering: En konkret setning som oppsummerer de valgte målene (både ferdigheter og kunnskap) i ett felles, praktisk mål for eleven"
            },
            measures: {
              type: Type.STRING,
              description: "Hvordan eleven skal vise at kompetansen er oppnådd (konkrete eksempler på vurdering)"
            },
            evaluation: {
              type: Type.STRING,
              description: "Plan for hvordan måloppnåelse skal evalueres gjennom perioden",
              nullable: true
            }
          },
          required: ["goal", "measures"]
        }
      },
      required: ["coreElementsInfluenceNote", "skillsSuggestions", "knowledgeSuggestions", "overallBenefitSuggestion"]
    };

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: { parts: [{ text: userPrompt }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.5, // Lower for faster, more consistent responses
        maxOutputTokens: 2048, // Limit response size to prevent timeouts
        topP: 0.9,
        topK: 40
      }
    });

    const responseText = result.text;
    const parsedResult = JSON.parse(responseText);

    return res.status(200).json(parsedResult);

  } catch (error: any) {
    console.error('Error generating IOP:', error);
    
    // Better error handling
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Serveren brukte for lang tid. Prøv med færre kompetansemål.',
        details: 'Gateway Timeout'
      });
    }
    
    return res.status(500).json({ 
      error: 'Kunne ikke generere IOP-forslag. Prøv igjen senere.',
      details: error.message 
    });
  }
}
