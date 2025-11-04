import { GoogleGenAI, Type } from "@google/genai";
import type { StudentProfile, Framework, UploadedFile, IopConstructionKit } from '../types';

export const generateIopGoals = async (
  profile: StudentProfile,
  framework: Framework,
  selectedGoals: string[],
  files: Record<string, UploadedFile[]>,
  expertAssessment: string
): Promise<IopConstructionKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `Du er en erfaren spesialpedagog som assistent for å bygge en Individuell Opplæringsplan (IOP). Generer forslag til en helhetlig plan basert på vedlagte data.

**Hovedoppgaver:**
1.  **'Påvirkning av kjerneelementer på mål' ('coreElementsInfluenceNote'):** Generer ETT kort, sammenhengende forslag som forklarer kjerneelementenes innflytelse på målene. Hvis ingen kjerneelementer er valgt, skriv en standard melding.
2.  **'Ferdigheter' og 'Kunnskap':** Generer TRE alternativer for hver kategori med STIGENDE VANSKELIGHETSGRAD (Enkel, Middels, Utfordrende). Hvert forslag skal være et komplett objekt med 'goal', 'measures' og 'anchoring'.
    *   **Enkelt:** Grunnleggende mål, mye støtte.
    *   **Middels:** Forventet nivå for trinnet, noe selvstendighet.
    *   **Utfordrende:** Strekker eleven, høyere krav til selvstendighet/kompleksitet.
3.  **'Samlet vurdering' ('overallBenefitSuggestion'):** Generer ETT helhetlig forslag.
    *   'goal': individuelle læringsmål (basert på ferdigheter/kunnskap).
    *   'measures': hvordan eleven skal vise kompetanse (vurdering).
    *   'evaluation': evaluering av utvikling mot mål i perioden.
4.  **Målformulering:**
    *   **Veldig enkle:** Konkrete, lettforståelige, oppnåelige for elever med læringsutfordringer. Bryt ned komplekse ferdigheter.
    *   **Alderstilpassede:** Relevant innhold for ${profile.grade}. trinn (ca. ${parseInt(profile.grade) + 5} år), men med oppgaver på tilpasset, enkelt nivå.
    *   **Enkelt språk:** Unngå pedagogisk sjargong.
5.  **Forankring:** Knytt målene til de vedlagte dokumentene (Opplæringsloven, Overordnet del), valgte kjerneelementer, kompetansemål og tilråding fra sakkyndig vurdering. Siter enkelt.
6.  **Struktur:** Følg det vedlagte JSON-skjemaet for responsen. Toppnivået skal være ett enkelt JSON-objekt.`;

  const goalsList = selectedGoals.map(goal => `- ${goal}`).join('\n');
  const coreElementsList = profile.selectedCoreElements.map(element => `- ${element}`).join('\n');

  const userPrompt = `
Generer forslag til en IOP basert på informasjonen under, de vedlagde kildedokumentene, de valgte kjerneelementene og de valgte kompetansemålene.

**Tema for IOP:**
- Trinn: ${profile.grade}
- Fag: ${profile.subject}
- Tema: ${profile.topic}
- Målgruppe: Elev i spesialundervisning

**Tidsramme:**
- Fra: ${framework.startDate} til ${framework.endDate}

**Tilråding fra sakkyndig vurdering:**
${expertAssessment || 'Ingen oppgitt.'}

**Valgte kjerneelementer for perioden:**
${coreElementsList.length > 0 ? coreElementsList : 'Ingen spesifikke kjerneelementer valgt.'}

**Valgte kompetansemål for perioden:**
${goalsList}

Vennligst generer ETT forslag til hvordan kjerneelementer påvirker mål, TRE forslag til ferdigheter, TRE forslag til kunnskap, og ETT forslag til samlet vurdering.
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
            enum: ['Ferdigheter', 'Kunnskap', 'Samlet vurdering'],
            description: 'Kjerneområdet målet tilhører.'
        },
        goal: {
            type: Type.STRING,
            description: "Det konkrete, enkle målet for eleven. For 'Samlet vurdering' skal dette feltet inneholde de individuelle læringsmålene."
        },
        measures: {
            type: Type.STRING,
            description: "Spesifikke tiltak og metoder for å nå målet. For 'Samlet vurdering' skal dette feltet beskrive vurderingen (hvordan eleven skal vise oppnådd kompetanse)."
        },
        evaluation: {
            type: Type.STRING,
            description: "Kun for 'Samlet vurdering'. Beskriver hvordan man evaluerer utviklingen mot målene i perioden."
        },
        anchoring: {
            type: Type.STRING,
            description: 'Forankring i læreplanverk (spesifikt de valgte kompetansemålene og kjerneelementene) eller lovverk.'
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
                type: Type.OBJECT,
                description: "Et bygge-sett for en IOP. Inneholder ett forslag for kontinuitet og samlet vurdering, og tre forslag for ferdigheter og kunnskap.",
                properties: {
                    coreElementsInfluenceNote: { // Added to schema
                        type: Type.STRING,
                        description: "En forklaring på hvordan de valgte kjerneelementene påvirker målene."
                    },
                    skillsSuggestions: {
                        type: Type.ARRAY,
                        description: "En liste med 3 forslag til mål under 'Ferdigheter'.",
                        items: iopGoalSchema
                    },
                    knowledgeSuggestions: {
                        type: Type.ARRAY,
                        description: "En liste med 3 forslag til mål under 'Kunnskap'.",
                        items: iopGoalSchema
                    },
                    overallBenefitSuggestion: {
                        ...iopGoalSchema,
                        description: "Ett enkelt forslag til mål under 'Samlet vurdering'."
                    }
                },
                required: ['coreElementsInfluenceNote', 'skillsSuggestions', 'knowledgeSuggestions', 'overallBenefitSuggestion']
            },
        }
    });
    
    const textResponse = response.text;
    const parsedResult: IopConstructionKit = JSON.parse(textResponse);
    return parsedResult;
  } catch (error) {
    console.error("Error generating IOP goals:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("API-nøkkelen er ugyldig. Vennligst sjekk konfigurasjonen.");
    }
    throw new Error("Kunne ikke generere mål. Det kan være et problem med de interne dokumentene, eller API-nøkkelen er ugyldig. Vennligst prøv igjen.");
  }
};