import { GoogleGenAI, Type } from "@google/genai";
import type { StudentProfile, Framework, UploadedFile, IopConstructionKit } from '../types';

export const generateIopGoals = async (
  profile: StudentProfile,
  framework: Framework,
  selectedGoals: string[],
  files: Record<string, UploadedFile[]>,
  isSpecialEducation: boolean
): Promise<IopConstructionKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const persona = isSpecialEducation
    ? "Du er en erfaren spesialpedagog som fungerer som en assistent for å bygge en Individuell Opplæringsplan (IOP)."
    : "Du er en erfaren faglærer som fungerer som en assistent for å lage et undervisningsopplegg.";
    
  const goalInstruction = isSpecialEducation
    ? `4.  **Formuler VELDIG ENKLE mål:** Målene skal være konkrete, lett forståelige og oppnåelige for en elev med betydelige læringsutfordringer. Bryt ned komplekse ferdigheter i små, håndterbare delmål basert på de valgte kompetansemålene og kjerneelementene.`
    : `4.  **Formuler tydelige og konkrete mål:** Målene skal være på nivå med forventet progresjon for trinnet. De skal være utfordrende, men oppnåelige for en ordinær elev, og direkte knyttet til de valgte kompetansemålene og kjerneelementene.`;


  const systemInstruction = `${persona} Din oppgave er å generere forslag som læreren kan bruke til å sette sammen en helhetlig plan.
Dine hovedoppgaver er:
1.  **Generer ETT forslag til 'Bro til tidligere temaer' ('continuityNote').** Dette skal være en kort, sammenhengende tekst.
2.  **Generer ETT forslag til 'Påvirkning av kjerneelementer på mål' ('coreElementsInfluenceNote').** Dette skal være en kort, sammenhengende tekst som forklarer hvordan de valgte kjerneelementene har påvirket og formet de foreslåtte målene. Hvis ingen kjerneelementer er valgt, skriv en standard melding som indikerer dette.
3.  **Generer TRE alternativer for 'Ferdigheter' og 'Kunnskap'.** For disse skal du lage tre separate og distinkte forslag. Hvert forslag må være et komplett objekt med mål, tiltak og forankring. Læreren vil se en forenklet liste med bare målene, og velge ett.
4.  **Generer ETT forslag til 'Samlet vurdering' ('overallBenefitSuggestion').** Dette skal være ett enkelt, helhetlig forslag.
${goalInstruction}
5.  **Tilpass etter alder:** Målene skal være alderstilpassede for trinnet som er oppgitt (${profile.grade}. trinn). For en elev på 8. trinn (ca. 13 år) skal innholdet og eksemplene være annerledes enn for en elev på 10. trinn (ca. 15 år), selv om selve ferdighetene som trenes på er enkle. Innholdet skal oppleves som relevant og modent for alderen, men oppgavene skal være på et tilpasset, enkelt nivå.
6.  **Struktur per kjerneområde:**
    - For **'Ferdigheter'** og **'Kunnskap'**: \`goal\`-feltet inneholder det spesifikke målet, og \`measures\`-feltet inneholder tiltakene for å nå målet.
    - For **'Samlet vurdering'**: \`goal\`-feltet inneholder **'individuelle læringsmål'** (basert på ferdigheter og kunnskap). \`measures\`-feltet inneholder **'vurdering'** (hvordan eleven skal vise kompetanse). \`evaluation\`-feltet inneholder en beskrivelse for **"Evaluering av utvikling sett opp mot mål i perioden"**, som forklarer hvordan man vurderer om de individuelle læringsmålene er nådd.
7.  **Bruk enkelt språk:** Unngå all form for pedagogisk sjargong og byråkratisk språk. Skriv slik at både elever og foresatte lett kan forstå hva målet er og hvordan det skal nås.
8.  **Koble til opplastede kilder:** Forankre målene i de vedlagde dokumentene (Opplæringsloven, Overordnet del), de valgte kjerneelementene og de valgte kompetansemålene. Siter på en enkel måte.
9.  **Struktur:** Følg det vedlagte JSON-skjemaet for å strukturere responsen din. Toppnivået skal være ett enkelt JSON-objekt.`;

  const goalsList = selectedGoals.map(goal => `- ${goal}`).join('\n');
  const coreElementsList = profile.selectedCoreElements.map(element => `- ${element}`).join('\n');

  const userPrompt = `
Generer forslag til en IOP basert på informasjonen under, de vedlagde kildedokumentene, de valgte kjerneelementene og de valgte kompetansemålene.

**Tema for IOP:**
- Trinn: ${profile.grade}
- Fag: ${profile.subject}
- Tema: ${profile.topic}
- Tidligere temaer (for kontekst): ${profile.previousTopics || 'Ingen oppgitt'}
- Målgruppe: ${isSpecialEducation ? 'Elev i spesialundervisning' : 'Ordinær elev'}

**Tidsramme:**
- Fra: ${framework.startDate} til ${framework.endDate}

**Valgte kjerneelementer for perioden:**
${coreElementsList.length > 0 ? coreElementsList : 'Ingen spesifikke kjerneelementer valgt.'}

**Valgte kompetansemål for perioden:**
${goalsList}

Vennligst generer ETT forslag til kontinuitet, ETT forslag til hvordan kjerneelementer påvirker mål, TRE forslag til ferdigheter, TRE forslag til kunnskap, og ETT forslag til samlet vurdering.
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
                    continuityNote: {
                        type: Type.STRING,
                        description: "Ett enkelt forslag til 'Bro til tidligere temaer'."
                    },
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
                required: ['continuityNote', 'coreElementsInfluenceNote', 'skillsSuggestions', 'knowledgeSuggestions', 'overallBenefitSuggestion']
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