import { GoogleGenAI, Type } from "@google/genai";
import type { StudentProfile, Framework, UploadedFile, IopGoal } from '../types';

export const generateIopGoals = async (
  profile: StudentProfile,
  framework: Framework,
  selectedGoals: string[],
  files: Record<string, UploadedFile[]>
): Promise<IopGoal[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `Du er en erfaren spesialpedagog som lager forslag til mål i en Individuell Opplæringsplan (IOP). Alle elevene det skrives for har vedtak om spesialundervisning.
Dine hovedoppgaver er:
1.  **Formuler VELDIG ENKLE mål:** Målene skal være konkrete, lett forståelige og oppnåelige for en elev med betydelige læringsutfordringer. Bryt ned komplekse ferdigheter i små, håndterbare delmål basert på de valgte kompetansemålene.
2.  **Struktur per kjerneområde:**
    - For **'Ferdigheter'** og **'Kunnskap'**: \`goal\`-feltet inneholder det spesifikke målet, og \`measures\`-feltet inneholder tiltakene for å nå målet.
    - For **'Samlet utbytte'**: \`goal\`-feltet inneholder **'individuelle læringsmål'** (basert på ferdigheter og kunnskap). \`measures\`-feltet inneholder **'vurdering'** (hvordan eleven skal vise kompetanse). \`evaluation\`-feltet inneholder en beskrivelse for **"Evaluering av utvikling sett opp mot mål i perioden"**, som forklarer hvordan man vurderer om de individuelle læringsmålene er nådd.
3.  **Bruk enkelt språk:** Unngå all form for pedagogisk sjargong og byråkratisk språk. Skriv slik at både elever og foresatte lett kan forstå hva målet er og hvordan det skal nås.
4.  **Koble til opplastede kilder:** Forankre målene i de vedlagde dokumentene (Opplæringsloven, Overordnet del) og de valgte kompetansemålene. Siter på en enkel måte.
5.  **Struktur:** Følg det vedlagte JSON-skjemaet for å strukturere responsen din.`;

  const goalsList = selectedGoals.map(goal => `- ${goal}`).join('\n');

  const userPrompt = `
Generer IOP-mål basert på følgende informasjon, de vedlagde kildedokumentene (Opplæringsloven, Overordnet del), og de spesifikke kompetansemålene fra læreplanen som er valgt for denne perioden.

**Tema for IOP:**
- Trinn: ${profile.grade}
- Fag: ${profile.subject}
- Tema: ${profile.topic}
- Tidligere temaer (for kontekst): ${profile.previousTopics}

**Tidsramme:**
- Fra: ${framework.startDate} til ${framework.endDate}

**Valgte kompetansemål for perioden:**
${goalsList}

Vennligst analyser de vedlagde kildedokumentene og bruk de valgte kompetansemålene som hovedfokus for å generere konkrete og enkle mål.
`;

    const fileParts = Object.values(files)
    .flat()
    .map(file => {
        let mimeType = '';
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
            mimeType = 'application/pdf';
        } else if (extension === 'html') {
            mimeType = 'text/html';
        } else if (extension === 'txt') {
            mimeType = 'text/plain';
        }
        if (!mimeType) return null;
        
        return {
            inlineData: {
                mimeType,
                data: file.content,
            },
        };
    })
    .filter((part): part is { inlineData: { mimeType: string; data: string; } } => part !== null);

  const promptParts = [
      ...fileParts,
      { text: userPrompt }
  ];
  
  const iopGoalSchema = {
    type: Type.OBJECT,
    properties: {
        coreArea: {
            type: Type.STRING,
            enum: ['Ferdigheter', 'Kunnskap', 'Samlet utbytte'],
            description: 'Kjerneområdet målet tilhører.'
        },
        goal: {
            type: Type.STRING,
            description: "Det konkrete, enkle målet for eleven. For 'Samlet utbytte' skal dette feltet inneholde de individuelle læringsmålene."
        },
        measures: {
            type: Type.STRING,
            description: "Spesifikke tiltak og metoder for å nå målet. For 'Samlet utbytte' skal dette feltet beskrive vurderingen (hvordan eleven skal vise oppnådd kompetanse)."
        },
        evaluation: {
            type: Type.STRING,
            description: "Kun for 'Samlet utbytte'. Beskriver hvordan man evaluerer utviklingen mot målene i perioden."
        },
        anchoring: {
            type: Type.STRING,
            description: 'Forankring i læreplanverk (spesifikt de valgte kompetansemålene) eller lovverk.'
        }
    },
    required: ['coreArea', 'goal', 'measures', 'anchoring']
  };

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: promptParts },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: iopGoalSchema,
            },
        }
    });
    
    const textResponse = response.text;
    const parsedGoals: IopGoal[] = JSON.parse(textResponse);
    return parsedGoals;
  } catch (error) {
    console.error("Error generating IOP goals:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("API-nøkkelen er ugyldig. Vennligst sjekk konfigurasjonen.");
    }
    throw new Error("Kunne ikke generere mål. Det kan være et problem med de interne dokumentene, eller API-nøkkelen er ugyldig. Vennligst prøv igjen.");
  }
};