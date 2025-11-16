import { GoogleGenAI, Type } from "@google/genai";
import type { StudentProfile, Framework, IopConstructionKit } from '../types';
import { curriculumData } from './curriculumData';

// Callback type for streaming updates
type StreamCallback = (partial: Partial<IopConstructionKit>) => void;

export const generateIopGoals = async (
  profile: StudentProfile,
  framework: Framework,
  selectedGoals: string[],
  expertAssessment: string,
  onStream?: StreamCallback
): Promise<IopConstructionKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `Du er spesialpedagog. Du skriver konkrete forslag til IOP for elever med spesialundervisning.

VIKTIG: Du skal ALLTID skrive på norsk (bokmål). ALDRI bytt til andre språk.

Basert på input skal du generere:
1) 1 sammendrag (ca. 3-5 setninger) som:
   - Kobler sakkyndig vurdering, kjerneelementer og kompetansemål til elevens behov
   - Gir konkrete forslag til tilrettelegging og tiltak på alle relevante områder
   - Forklarer HVORDAN eleven skal støttes i å nå målene (metoder, verktøy, arbeidsmåter)
   - Tar hensyn til at målene finnes på både tilpasset og utfordrende nivå
   - Nevner sosiale mål og spesielle behov hvis oppgitt
   - Er praktisk anvendelig for lærere som skal følge opp eleven
2) 2 ferdighetsmål (praktiske ferdigheter)
3) 2 kunnskapsmål (teoretisk kunnskap)
4) 1 samlet vurdering (Individuelle læringsmål) som:
   - Oppsummerer både ferdighets- og kunnskapsmål på et overordnet nivå
   - Tar hensyn til både tilpasset og utfordrende nivå
   - Integrerer sosiale mål og spesielle behov naturlig
   - Er formulert som konkrete, oppnåelige mål for eleven
5) 1 beskrivelse av hvordan eleven skal vise kompetanse (Vurdering)
6) 1 plan for evaluering av utvikling i perioden

For både ferdighetsmål og kunnskapsmål skal du lage:
- Ett Tilpasset nivå (realistisk oppnåelig med støtte)
- Ett Utfordrende nivå (strekker eleven videre)

Hvis sosiale mål er oppgitt, skal du integrere disse naturlig i ferdighetsmål, kunnskapsmål OG i sammendraget. Sosiale mål kan handle om samarbeid, kommunikasjon, selvregulering, empati, selvstendighet, konfliktløsning, struktur/rutiner og inkludering.

Hvis andre behov og fokusområder er oppgitt (som ASK, syn, hørsel, vedlikehold av ferdigheter, eller ADL), skal du ta hensyn til disse i utformingen av alle mål OG nevne dem i sammendraget. Tilpass språk, innhold og evalueringsmetoder til disse spesifikke behovene.

HUSK: Skriv BARE selve målet i 'goal'-feltet, IKKE inkluder nivå-teksten "Tilpasset" eller "Utfordrende" i målteksten. Alt skal være på NORSK (bokmål).`;

  const goalsList = selectedGoals.map(goal => `- ${goal}`).join('\n');
  
  // Get core element description
  let coreElementText = '';
  if (profile.selectedCoreElement) {
    const subject = curriculumData[profile.subject];
    if (subject) {
      const element = subject.coreElements.find(el => el.name === profile.selectedCoreElement);
      coreElementText = element ? `${element.name}: ${element.description}` : profile.selectedCoreElement;
    }
  }

  // Get cross-curricular theme description (only if selected)
  let crossCurricularText = '';
  if (profile.selectedCrossCurricularTheme) {
    const subject = curriculumData[profile.subject];
    if (subject) {
      const theme = subject.crossCurricularThemes.find(t => t.name === profile.selectedCrossCurricularTheme);
      crossCurricularText = theme ? `${theme.name}: ${theme.description}` : profile.selectedCrossCurricularTheme;
    }
  }

  // Get social goals (if selected)
  let socialGoalsText = '';
  if (profile.selectedSocialGoals && profile.selectedSocialGoals.length > 0) {
    const socialGoalsData = await import('../data/socialGoals.json');
    const selectedGoalNames = profile.selectedSocialGoals
      .map(id => socialGoalsData.categories.find((g: any) => g.id === id))
      .filter(Boolean)
      .map((g: any) => `${g.icon} ${g.name} - ${g.description}`)
      .join('\n');
    socialGoalsText = selectedGoalNames ? `**Sosiale mål:**\n${selectedGoalNames}\n` : '';
  }

  // Get other needs (if selected)
  let otherNeedsText = '';
  if (profile.selectedOtherNeeds && profile.selectedOtherNeeds.length > 0) {
    const otherNeedsData = await import('../data/otherNeeds.json');
    const selectedNeedNames = profile.selectedOtherNeeds
      .map(id => otherNeedsData.otherNeeds.find((n: any) => n.id === id))
      .filter(Boolean)
      .map((n: any) => `${n.name} - ${n.description}`)
      .join('\n');
    otherNeedsText = selectedNeedNames ? `**Andre behov og fokusområder:**\n${selectedNeedNames}\n` : '';
  }

  const userPrompt = `
**Trinn:** ${profile.grade} (ca. ${parseInt(profile.grade) + 5} år)
**Fag:** ${profile.subject}
**Tema:** ${profile.topic}
${expertAssessment ? `**Sakkyndig:** ${expertAssessment}\n` : ''}${coreElementText ? `**Kjerneelement:** ${coreElementText}\n` : ''}${crossCurricularText ? `**Tverrfaglig tema:** ${crossCurricularText}\n` : ''}${socialGoalsText}${otherNeedsText}**Kompetansemål:**
${goalsList}
`.trim();

  // Removed file attachments - they add significant overhead without much value
  // The model already has knowledge of Norwegian education law and curriculum principles
  const promptParts = [
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
            description: "Det konkrete, enkle målet for eleven. For 'Samlet vurdering' skal dette feltet inneholde elevens individuelle læringsmål - en konkret formulering av både praktiske ferdigheter og teoretisk kunnskap eleven skal mestre i perioden."
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
    // Use streaming if callback provided
    if (onStream) {
      const streamResponse = await ai.models.generateContentStream({
          model: 'gemini-2.0-flash-001',
          contents: { parts: promptParts },
          config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  description: "Et bygge-sett for en IOP. Inneholder ett forslag for kontinuitet og samlet vurdering, og to forslag for ferdigheter og kunnskap.",
                  properties: {
                      coreElementsInfluenceNote: {
                          type: Type.STRING,
                          description: "En forklaring på hvordan de valgte kjerneelementene påvirker målene."
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
                  },
                  required: ['coreElementsInfluenceNote', 'skillsSuggestions', 'knowledgeSuggestions', 'overallBenefitSuggestion']
              },
          }
      });

      let accumulatedText = '';
      
      // Stream chunks as they arrive
      for await (const chunk of streamResponse) {
        const chunkText = chunk.text;
        accumulatedText += chunkText;
        
        // Try to parse partial JSON and send updates
        try {
          const partial = JSON.parse(accumulatedText);
          onStream(partial);
        } catch {
          // Not yet valid JSON, continue accumulating
        }
      }
      
      // Final parse
      const parsedResult: IopConstructionKit = JSON.parse(accumulatedText);
      return parsedResult;
      
    } else {
      // Non-streaming (original behavior)
      const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-001',
          contents: { parts: promptParts },
          config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  description: "Et bygge-sett for en IOP. Inneholder ett forslag for kontinuitet og samlet vurdering, og to forslag for ferdigheter og kunnskap.",
                  properties: {
                      coreElementsInfluenceNote: {
                          type: Type.STRING,
                          description: "En forklaring på hvordan de valgte kjerneelementene påvirker målene."
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
                  },
                  required: ['coreElementsInfluenceNote', 'skillsSuggestions', 'knowledgeSuggestions', 'overallBenefitSuggestion']
              },
          }
      });
      
      const textResponse = response.text;
      const parsedResult: IopConstructionKit = JSON.parse(textResponse);
      return parsedResult;
    }
  } catch (error) {
    console.error("Error generating IOP goals:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("API-nøkkelen er ugyldig. Vennligst sjekk konfigurasjonen.");
    }
    throw new Error("Kunne ikke generere mål. Det kan være et problem med de interne dokumentene, eller API-nøkkelen er ugyldig. Vennligst prøv igjen.");
  }
};