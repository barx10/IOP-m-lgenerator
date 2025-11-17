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

VIKTIG: Du skal ALLTID skrive på norsk (bokmål). ALDRI bytt til andre språk.

Basert på input skal du generere:
1) 1 sammendrag (ca. 3-5 setninger) som:
   - Kobler sakkyndig vurdering, kjerneelementer og kompetansemål til elevens behov
   - Forklarer HVORDAN eleven skal støttes i å nå målene (metoder, verktøy, arbeidsmåter)
   - Tar hensyn til at målene finnes på både tilpasset og utfordrende nivå
   - Nevner sosiale mål og spesielle behov hvis oppgitt
2) 1 liste med konkrete anbefalinger (4-6 punkter) som:
   - Gir praktiske, spesifikke tiltak læreren kan bruke
   - Dekker ulike områder: undervisningsmetoder, vurdering, samarbeid, tilrettelegging
   - Er direkte anvendelige i klasserommet
   - Tar hensyn til sosiale mål og spesielle behov hvis oppgitt
   - Skrives som korte, klare punkter (1-2 setninger per punkt)
3) 1 liste med læringsaktiviteter (4-6 konkrete aktiviteter) som:
   - Er praktiske, gjennomførbare aktiviteter basert på ferdighetsmål og kunnskapsmål
   - Dekker både praktiske og teoretiske aspekter
   - Tilpasses elevens nivå og behov
   - Inkluderer varierte arbeidsformer (individuelt, i gruppe, med støtte)
   - Tar hensyn til sosiale mål og spesielle behov hvis oppgitt
   - Skrives som konkrete, handlingsrettede punkter
4) 2 ferdighetsmål (praktiske ferdigheter)
5) 2 kunnskapsmål (teoretisk kunnskap)
6) 1 samlet vurdering (Individuelle læringsmål) som:
   - Oppsummerer både ferdighets- og kunnskapsmål på et overordnet nivå
   - Tar hensyn til både tilpasset og utfordrende nivå
   - Integrerer sosiale mål og spesielle behov naturlig
   - Er formulert som konkrete, oppnåelige mål for eleven
7) 1 beskrivelse av hvordan eleven skal vise kompetanse (Vurdering)
8) 1 plan for evaluering av utvikling i perioden

For både ferdighetsmål og kunnskapsmål skal du lage:
- Ett Tilpasset nivå (realistisk oppnåelig med støtte)
- Ett Utfordrende nivå (strekker eleven videre)

Hvis sosiale mål er oppgitt, skal du:
- Integrere disse naturlig i ferdighetsmål, kunnskapsmål OG i sammendraget/anbefalingene/læringsaktivitetene
- Generere KONTEKSTSPESIFIKKE beskrivelser og 1 konkret eksempel/tiltak for hvert sosiale mål
- Beskrivelser og eksempler skal være tilpasset temaet, kompetansemålene og fagkonteksten
- Eksemplene skal være praktiske og direkte knyttet til fagstoffet
- Sosiale mål kan handle om samarbeid, kommunikasjon, selvregulering, empati, selvstendighet, konfliktløsning, struktur/rutiner og inkludering

Hvis andre behov og fokusområder er oppgitt (som ASK, syn, hørsel, vedlikehold av ferdigheter, eller ADL), skal du:
- Generere 1 SPESIFIKT tiltak for hvert valgte behov som er tilpasset temaet og kompetansemålene
- Tiltakene skal være konkrete og praktisk gjennomførbare i klasserommet
- Tiltakene skal knyttes direkte til fagstoffet og de valgte kompetansemålene
- Ta hensyn til behovene i utformingen av alle mål OG nevne dem i sammendraget/anbefalingene/læringsaktivitetene

HUSK: Skriv BARE selve målet i 'goal'-feltet, IKKE inkluder nivå-teksten "Tilpasset" eller "Utfordrende" i målteksten. Alt skal være på NORSK (bokmål).`;

    const goalsList = selectedGoals.map((goal: string) => `- ${goal}`).join('\n');

    let coreElementText = '';
    if (profile.selectedCoreElement) {
      coreElementText = `**Kjerneelement:** ${profile.selectedCoreElement}\n`;
    }

    let crossCurricularText = '';
    if (profile.selectedCrossCurricularTheme) {
      crossCurricularText = `**Tverrfaglig tema:** ${profile.selectedCrossCurricularTheme}\n`;
    }

    // Get social goals (if selected)
    let socialGoalsText = '';
    if (profile.selectedSocialGoals && profile.selectedSocialGoals.length > 0) {
      socialGoalsText = `**Sosiale mål:** ${profile.selectedSocialGoals.join(', ')}\n`;
    }

    // Get other needs (if selected)
    let otherNeedsText = '';
    if (profile.selectedOtherNeeds && profile.selectedOtherNeeds.length > 0) {
      otherNeedsText = `**Andre behov og fokusområder:** ${profile.selectedOtherNeeds.join(', ')}\n`;
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
**Trinn:** ${gradeText} (ca. ${parseInt(profile.grade) + 5} år)
**Fag:** ${profile.subject}
**Tema:** ${profile.topic}
${expertAssessment ? `**Sakkyndig:** ${expertAssessment}\n` : ''}${coreElementText}${crossCurricularText}${socialGoalsText}${otherNeedsText}**Kompetansemål:**
${goalsList}
`.trim();

    const iopGoalSchema = {
      type: Type.OBJECT,
      properties: {
        coreArea: {
          type: Type.STRING,
          enum: ['Ferdigheter', 'Kunnskap', 'Samlet vurdering'],
          description: 'Kjerneområdet målet tilhører.'
        },
        goal: {
          type: Type.STRING,
          description: "Det konkrete, enkle målet for eleven. For 'Samlet vurdering' skal dette feltet inneholde elevens individuelle læringsmål - en konkret formulering av både praktiske ferdigheter og teoretisk kunnskap eleven skal mestre i perioden."
        },
        measures: {
          type: Type.STRING,
          description: "Spesifikke tiltak og metoder for å nå målet. For 'Samlet vurdering' skal dette feltet beskrive vurderingen (hvordan eleven skal vise oppnådd kompetanse)."
        },
        evaluation: {
          type: Type.STRING,
          description: "Plan for evaluering av utvikling. Kun påkrevd for 'Samlet vurdering', valgfritt for andre.",
          nullable: true
        },
        anchoring: {
          type: Type.STRING,
          description: 'Forankring i læreplanverk (spesifikt de valgte kompetansemålene og kjerneelementene) eller lovverk.'
        }
      },
      required: ['coreArea', 'goal', 'measures', 'anchoring']
    };

    // Build response schema dynamically
    const baseProperties: any = {
      coreElementsInfluenceNote: {
        type: Type.STRING,
        description: "En forklaring på hvordan de valgte kjerneelementene påvirker målene."
      },
      recommendations: {
        type: Type.STRING,
        description: "En liste med 4-6 konkrete, praktiske anbefalinger for læreren. Hver anbefaling skal være et eget punkt (bruk • eller -) og være 1-2 setninger lang."
      },
      learningActivities: {
        type: Type.STRING,
        description: "En liste med 4-6 konkrete læringsaktiviteter basert på ferdighetsmål og kunnskapsmål. Hver aktivitet skal være et eget punkt (bruk • eller -) og være handlingsrettet og praktisk gjennomførbar."
      },
      skillsSuggestions: {
        type: Type.ARRAY,
        description: "2 forslag til mål under 'Ferdigheter' (Tilpasset, Utfordrende).",
        items: iopGoalSchema,
        minItems: 2,
        maxItems: 2
      },
      knowledgeSuggestions: {
        type: Type.ARRAY,
        description: "2 forslag til mål under 'Kunnskap' (Tilpasset, Utfordrende).",
        items: iopGoalSchema,
        minItems: 2,
        maxItems: 2
      },
      overallBenefitSuggestion: {
        ...iopGoalSchema,
        description: "Ett enkelt forslag til mål under 'Samlet vurdering'."
      }
    };

    const requiredFields = ['coreElementsInfluenceNote', 'recommendations', 'learningActivities', 'skillsSuggestions', 'knowledgeSuggestions', 'overallBenefitSuggestion'];

    // Add socialGoalDescriptions if social goals are selected
    if (profile.selectedSocialGoals && profile.selectedSocialGoals.length > 0) {
      baseProperties.socialGoalDescriptions = {
        type: Type.OBJECT,
        description: "Et objekt med kontekstspesifikke beskrivelser og eksempler for hvert valgte sosiale mål. Nøklene skal være goal-IDene.",
        properties: profile.selectedSocialGoals.reduce((acc: any, goalId: string) => {
          acc[goalId] = {
            type: Type.OBJECT,
            description: `Kontekstspesifikk beskrivelse og 1 konkret eksempel for ${goalId}, tilpasset tema og kompetansemål.`,
            properties: {
              description: {
                type: Type.STRING,
                description: "En kontekstspesifikk beskrivelse av det sosiale målet, tilpasset tema og fagkontekst."
              },
              examples: {
                type: Type.ARRAY,
                description: "1 konkret eksempel/tiltak knyttet direkte til fagstoffet og kompetansemålene.",
                items: { type: Type.STRING },
                minItems: 1,
                maxItems: 1
              }
            },
            required: ['description', 'examples']
          };
          return acc;
        }, {}),
        required: profile.selectedSocialGoals
      };
      requiredFields.push('socialGoalDescriptions');
    }

    // Add otherNeedsMeasures if other needs are selected
    if (profile.selectedOtherNeeds && profile.selectedOtherNeeds.length > 0) {
      baseProperties.otherNeedsMeasures = {
        type: Type.OBJECT,
        description: "Et objekt med tiltak for hvert valgte behov. Nøklene skal være need-IDene, verdiene skal være arrays med 1 spesifikt tiltak.",
        properties: profile.selectedOtherNeeds.reduce((acc: any, needId: string) => {
          acc[needId] = {
            type: Type.ARRAY,
            description: `1 spesifikt tiltak for ${needId}, tilpasset tema og kompetansemål.`,
            items: { type: Type.STRING },
            minItems: 1,
            maxItems: 1
          };
          return acc;
        }, {}),
        required: profile.selectedOtherNeeds
      };
      requiredFields.push('otherNeedsMeasures');
    }

    const responseSchema = {
      type: Type.OBJECT,
      description: "Et bygge-sett for en IOP. Inneholder ett forslag for kontinuitet og samlet vurdering, og to forslag for ferdigheter og kunnskap.",
      properties: baseProperties,
      required: requiredFields
    };

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: { parts: [{ text: userPrompt }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
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
