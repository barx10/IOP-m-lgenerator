import OpenAI from "openai";
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
  const openai = new OpenAI({ 
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  const systemInstruction = `Du er spesialpedagog som lager IOP for elever i spesialundervisning.

**Oppgave:** Generer 1 note om kjerneelementer, 2 ferdighets-mål, 2 kunnskaps-mål, og 1 samlet vurdering.

**To vanskelighetsgrader:**
1. **Tilpasset:** Realistisk oppnåelig mål med støtte. Konkret og enkelt.
2. **Utfordrende:** Strekker eleven. Mer selvstendighet og kompleksitet.

**VIKTIG - Målformulering:**
- Skriv BARE målet i 'goal'-feltet, IKKE inkluder vanskelighetsgrad
- Eksempel RIKTIG: "Lese en kort novelle og identifisere hovedtema ved hjelp av støttespørsmål"
- Eksempel FEIL: "**Tilpasset:** Lese en kort novelle..."
- Vanskelighetsgraden vises automatisk i UI

**Krav:**
- Enkelt språk, konkrete mål
- Forankret i kompetansemål og kjerneelementer
- Oppnåelig for elever med læringsutfordringer

**Lovverk og føringer:**
- Opplæringsloven §5-1: Rett til tilpasset opplæring i inkluderende fellesskap
- Overordnet del: Grunnleggende ferdigheter, danning, demokrati, kritisk tenkning
- Tverrfaglige temaer: Folkehelse og livsmestring, demokrati og medborgerskap
- Prinsipper: Likeverd, inkludering, universell utforming, elevmedvirkning

**Du må svare med gyldig JSON i følgende format:**
{
  "coreElementsInfluenceNote": "Forklaring på hvordan kjerneelementene påvirker målene",
  "skillsSuggestions": [
    {
      "coreArea": "Ferdigheter",
      "goal": "Konkret, enkelt mål",
      "measures": "Spesifikke tiltak og metoder",
      "anchoring": "Forankring i læreplanverk eller lovverk"
    },
    {
      "coreArea": "Ferdigheter",
      "goal": "Konkret, enkelt mål",
      "measures": "Spesifikke tiltak og metoder",
      "anchoring": "Forankring i læreplanverk eller lovverk"
    }
  ],
  "knowledgeSuggestions": [
    {
      "coreArea": "Kunnskap",
      "goal": "Konkret, enkelt mål",
      "measures": "Spesifikke tiltak og metoder",
      "anchoring": "Forankring i læreplanverk eller lovverk"
    },
    {
      "coreArea": "Kunnskap",
      "goal": "Konkret, enkelt mål",
      "measures": "Spesifikke tiltak og metoder",
      "anchoring": "Forankring i læreplanverk eller lovverk"
    }
  ],
  "overallBenefitSuggestion": {
    "coreArea": "Samlet vurdering",
    "goal": "De individuelle læringsmålene",
    "measures": "Vurderingen (hvordan eleven skal vise oppnådd kompetanse)",
    "evaluation": "Hvordan man evaluerer utviklingen mot målene",
    "anchoring": "Forankring i læreplanverk eller lovverk"
  }
}`;

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

  const userPrompt = `
**Trinn:** ${profile.grade} (ca. ${parseInt(profile.grade) + 5} år)
**Fag:** ${profile.subject}
**Tema:** ${profile.topic}
${expertAssessment ? `**Sakkyndig:** ${expertAssessment}\n` : ''}${coreElementText ? `**Kjerneelement:** ${coreElementText}\n` : ''}${crossCurricularText ? `**Tverrfaglig tema:** ${crossCurricularText}\n` : ''}**Kompetansemål:**
${goalsList}
`.trim();

  try {
    // Use streaming if callback provided
    if (onStream) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        stream: true,
        temperature: 0.7,
      });

      let accumulatedText = '';
      
      // Stream chunks as they arrive
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          accumulatedText += content;
          
          // Try to parse partial JSON and send updates
          try {
            const partial = JSON.parse(accumulatedText);
            onStream(partial);
          } catch {
            // Not yet valid JSON, continue accumulating
          }
        }
      }
      
      // Final parse
      const parsedResult: IopConstructionKit = JSON.parse(accumulatedText);
      return parsedResult;
      
    } else {
      // Non-streaming (original behavior)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      
      const textResponse = response.choices[0]?.message?.content || '{}';
      const parsedResult: IopConstructionKit = JSON.parse(textResponse);
      return parsedResult;
    }
  } catch (error) {
    console.error("Error generating IOP goals:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        throw new Error("API-nøkkelen er ugyldig. Vennligst sjekk konfigurasjonen.");
    }
    throw new Error("Kunne ikke generere mål. Vennligst prøv igjen.");
  }
};
