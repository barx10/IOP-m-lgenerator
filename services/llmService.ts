import { GoogleGenAI } from "@google/genai";
import type { StudentProfile, Framework, IopConstructionKit } from '../types';
import { curriculumData } from './curriculumData';

// ---------------------------------------------------------------------------
// BYOK (Bring Your Own Key): brukeren velger KI-leverandør og legger inn sin
// egen API-nøkkel. Nøkkelen lagres kun i nettleserens localStorage og sendes
// direkte til leverandøren – aldri via egen server.
// ---------------------------------------------------------------------------

export type LlmProvider = 'openai' | 'google';

export interface ProviderInfo {
    label: string;
    model: string;
    keyUrl: string;
    keyPlaceholder: string;
}

export const PROVIDERS: Record<LlmProvider, ProviderInfo> = {
    openai: {
        label: 'OpenAI',
        model: 'gpt-5.6-luna',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyPlaceholder: 'sk-...',
    },
    google: {
        label: 'Google Gemini',
        model: 'gemini-3.6-flash',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyPlaceholder: 'AIza...',
    },
};

const PROVIDER_STORAGE_KEY = 'iop-llm-provider';
const API_KEY_STORAGE_PREFIX = 'iop-llm-key-';

export const getProvider = (): LlmProvider => {
    try {
        const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
        if (stored === 'openai' || stored === 'google') return stored;
    } catch {
        // Ignore storage errors
    }
    return 'google';
};

export const setProvider = (provider: LlmProvider): void => {
    try {
        localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
    } catch {
        // Ignore storage errors
    }
};

export const getApiKey = (provider: LlmProvider): string => {
    try {
        return localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${provider}`) || '';
    } catch {
        return '';
    }
};

export const setApiKey = (provider: LlmProvider, key: string): void => {
    try {
        const trimmed = key.trim();
        if (trimmed) {
            localStorage.setItem(`${API_KEY_STORAGE_PREFIX}${provider}`, trimmed);
        } else {
            localStorage.removeItem(`${API_KEY_STORAGE_PREFIX}${provider}`);
        }
    } catch {
        // Ignore storage errors
    }
};

export const clearApiKey = (provider: LlmProvider): void => {
    setApiKey(provider, '');
};

// Has the user configured a key for the currently selected provider?
export const hasApiKey = (): boolean => getApiKey(getProvider()).length > 0;

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `Du er spesialpedagog. Du skriver konkrete forslag til IOP for elever med spesialundervisning.

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

const gradeLabels: Record<string, string> = {
    '2': 'etter 2. trinn',
    '4': 'etter 4. trinn',
    '7': 'etter 7. trinn',
    '10': 'etter 10. trinn',
    'Vg1': 'Vg1',
    'Vg2': 'Vg2',
    'Vg3': 'Vg3'
};

const buildUserPrompt = async (
    profile: StudentProfile,
    selectedGoals: string[],
    expertAssessment: string
): Promise<string> => {
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

    const gradeText = gradeLabels[profile.grade] || profile.grade;
    const gradeAge = parseInt(profile.grade);
    const ageText = Number.isNaN(gradeAge) ? '' : ` (ca. ${gradeAge + 5} år)`;

    return `
**Trinn:** ${gradeText}${ageText}
**Fag:** ${profile.subject}
**Tema:** ${profile.topic}
${expertAssessment ? `**Sakkyndig:** ${expertAssessment}\n` : ''}${coreElementText ? `**Kjerneelement:** ${coreElementText}\n` : ''}${crossCurricularText ? `**Tverrfaglig tema:** ${crossCurricularText}\n` : ''}${socialGoalsText}${otherNeedsText}**Kompetansemål:**
${goalsList}
`.trim();
};

// ---------------------------------------------------------------------------
// Responsskjema (standard JSON Schema, konverteres per leverandør)
// ---------------------------------------------------------------------------

const buildResponseSchema = (profile: StudentProfile) => {
    const iopGoalSchema = {
        type: 'object',
        properties: {
            coreArea: {
                type: 'string',
                enum: ['Ferdigheter', 'Kunnskap', 'Samlet vurdering'],
                description: 'Kjerneområdet målet tilhører.'
            },
            goal: {
                type: 'string',
                description: "Det konkrete, enkle målet for eleven. For 'Samlet vurdering' skal dette feltet inneholde elevens individuelle læringsmål - en konkret formulering av både praktiske ferdigheter og teoretisk kunnskap eleven skal mestre i perioden."
            },
            measures: {
                type: 'string',
                description: "Spesifikke tiltak og metoder for å nå målet. For 'Samlet vurdering' skal dette feltet beskrive vurderingen (hvordan eleven skal vise oppnådd kompetanse)."
            },
            evaluation: {
                type: ['string', 'null'],
                description: "Plan for evaluering av utvikling. Skal fylles ut for 'Samlet vurdering', kan være null for andre."
            },
            anchoring: {
                type: 'string',
                description: 'Forankring i læreplanverk (spesifikt de valgte kompetansemålene og kjerneelementene) eller lovverk.'
            }
        },
        required: ['coreArea', 'goal', 'measures', 'anchoring']
    };

    const properties: any = {
        coreElementsInfluenceNote: {
            type: 'string',
            description: "En forklaring på hvordan de valgte kjerneelementene påvirker målene."
        },
        recommendations: {
            type: 'string',
            description: "En liste med 4-6 konkrete, praktiske anbefalinger for læreren. Hver anbefaling skal være et eget punkt (bruk • eller -) og være 1-2 setninger lang."
        },
        learningActivities: {
            type: 'string',
            description: "En liste med 4-6 konkrete læringsaktiviteter basert på ferdighetsmål og kunnskapsmål. Hver aktivitet skal være et eget punkt (bruk • eller -) og være handlingsrettet og praktisk gjennomførbar."
        },
        skillsSuggestions: {
            type: 'array',
            description: "Nøyaktig 2 forslag til mål under 'Ferdigheter' (Tilpasset, Utfordrende).",
            items: iopGoalSchema,
            minItems: 2,
            maxItems: 2
        },
        knowledgeSuggestions: {
            type: 'array',
            description: "Nøyaktig 2 forslag til mål under 'Kunnskap' (Tilpasset, Utfordrende).",
            items: iopGoalSchema,
            minItems: 2,
            maxItems: 2
        },
        overallBenefitSuggestion: {
            ...iopGoalSchema,
            description: "Ett enkelt forslag til mål under 'Samlet vurdering'."
        }
    };

    const required = ['coreElementsInfluenceNote', 'recommendations', 'learningActivities', 'skillsSuggestions', 'knowledgeSuggestions', 'overallBenefitSuggestion'];

    // Add socialGoalDescriptions if social goals are selected
    if (profile.selectedSocialGoals && profile.selectedSocialGoals.length > 0) {
        properties.socialGoalDescriptions = {
            type: 'object',
            description: "Et objekt med kontekstspesifikke beskrivelser og eksempler for hvert valgte sosiale mål. Nøklene skal være goal-IDene.",
            properties: profile.selectedSocialGoals.reduce((acc: any, goalId: string) => {
                acc[goalId] = {
                    type: 'object',
                    description: `Kontekstspesifikk beskrivelse og 1 konkret eksempel for ${goalId}, tilpasset tema og kompetansemål.`,
                    properties: {
                        description: {
                            type: 'string',
                            description: "En kontekstspesifikk beskrivelse av det sosiale målet, tilpasset tema og fagkontekst."
                        },
                        examples: {
                            type: 'array',
                            description: "1 konkret eksempel/tiltak knyttet direkte til fagstoffet og kompetansemålene.",
                            items: { type: 'string' },
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
        required.push('socialGoalDescriptions');
    }

    // Add otherNeedsMeasures if other needs are selected
    if (profile.selectedOtherNeeds && profile.selectedOtherNeeds.length > 0) {
        properties.otherNeedsMeasures = {
            type: 'object',
            description: "Et objekt med tiltak for hvert valgte behov. Nøklene skal være need-IDene, verdiene skal være arrays med 1 spesifikt tiltak.",
            properties: profile.selectedOtherNeeds.reduce((acc: any, needId: string) => {
                acc[needId] = {
                    type: 'array',
                    description: `1 spesifikt tiltak for ${needId}, tilpasset tema og kompetansemål.`,
                    items: { type: 'string' },
                    minItems: 1,
                    maxItems: 1
                };
                return acc;
            }, {}),
            required: profile.selectedOtherNeeds
        };
        required.push('otherNeedsMeasures');
    }

    return {
        type: 'object',
        description: "Et bygge-sett for en IOP. Inneholder ett forslag for kontinuitet og samlet vurdering, og to forslag for ferdigheter og kunnskap.",
        properties,
        required
    };
};

// Gemini bruker egne typenavn (OBJECT/STRING/...) og `nullable` i stedet for
// union-typer med null.
const toGeminiSchema = (schema: any): any => {
    const out: any = {};

    let type = schema.type;
    if (Array.isArray(type)) {
        if (type.includes('null')) out.nullable = true;
        type = type.find((t: string) => t !== 'null');
    }
    if (type) out.type = String(type).toUpperCase();

    for (const key of ['description', 'enum', 'required', 'minItems', 'maxItems']) {
        if (schema[key] !== undefined) out[key] = schema[key];
    }
    if (schema.properties) {
        out.properties = Object.fromEntries(
            Object.entries(schema.properties).map(([k, v]) => [k, toGeminiSchema(v)])
        );
    }
    if (schema.items) out.items = toGeminiSchema(schema.items);

    return out;
};

// OpenAI strict mode krever additionalProperties: false og at alle felter er
// listet i required, og støtter ikke minItems/maxItems.
const toOpenAISchema = (schema: any): any => {
    const out: any = {};

    if (schema.type) out.type = schema.type;
    for (const key of ['description', 'enum']) {
        if (schema[key] !== undefined) out[key] = schema[key];
    }
    if (schema.properties) {
        out.properties = Object.fromEntries(
            Object.entries(schema.properties).map(([k, v]) => [k, toOpenAISchema(v)])
        );
        out.required = Object.keys(schema.properties);
        out.additionalProperties = false;
    }
    if (schema.items) out.items = toOpenAISchema(schema.items);

    return out;
};

// ---------------------------------------------------------------------------
// Leverandør-kall
// ---------------------------------------------------------------------------

const newError = (message: string, code?: string): Error => {
    const error = new Error(message);
    if (code) (error as any).code = code;
    return error;
};

const invalidKeyError = (provider: LlmProvider) =>
    newError(`API-nøkkelen for ${PROVIDERS[provider].label} er ugyldig. Sjekk nøkkelen under KI-innstillinger.`, 'INVALID_API_KEY');

const quotaError = (provider: LlmProvider) =>
    newError(`Kvoten for ${PROVIDERS[provider].label}-nøkkelen din er brukt opp, eller du sender for mange forespørsler. Sjekk kontoen din hos leverandøren og prøv igjen senere.`);

const callGemini = async (apiKey: string, userPrompt: string, schema: any): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: PROVIDERS.google.model,
            contents: { parts: [{ text: userPrompt }] },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: toGeminiSchema(schema)
            }
        });
        return response.text;
    } catch (error: any) {
        const message = String(error?.message || error);
        if (message.includes('API key not valid') || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
            throw invalidKeyError('google');
        }
        if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
            throw quotaError('google');
        }
        throw error;
    }
};

const callOpenAI = async (apiKey: string, userPrompt: string, schema: any): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: PROVIDERS.openai.model,
                messages: [
                    { role: 'system', content: SYSTEM_INSTRUCTION },
                    { role: 'user', content: userPrompt }
                ],
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'iop_construction_kit',
                        strict: true,
                        schema: toOpenAISchema(schema)
                    }
                }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw invalidKeyError('openai');
            }
            if (response.status === 429) {
                throw quotaError('openai');
            }
            const errorData = await response.json().catch(() => null);
            throw newError(errorData?.error?.message || `OpenAI svarte med feil (${response.status}). Prøv igjen.`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw newError('OpenAI returnerte et tomt svar. Prøv igjen.');
        }
        return content;
    } finally {
        clearTimeout(timeoutId);
    }
};

// ---------------------------------------------------------------------------
// Hovedfunksjon
// ---------------------------------------------------------------------------

export const generateIopGoals = async (
    profile: StudentProfile,
    framework: Framework,
    selectedGoals: string[],
    expertAssessment: string
): Promise<IopConstructionKit> => {
    const provider = getProvider();
    const apiKey = getApiKey(provider);

    if (!apiKey) {
        throw newError('Du må legge inn din egen API-nøkkel under KI-innstillinger før du kan generere forslag.', 'NO_API_KEY');
    }

    const userPrompt = await buildUserPrompt(profile, selectedGoals, expertAssessment);
    const schema = buildResponseSchema(profile);

    try {
        const textResponse = provider === 'google'
            ? await callGemini(apiKey, userPrompt, schema)
            : await callOpenAI(apiKey, userPrompt, schema);

        return JSON.parse(textResponse) as IopConstructionKit;
    } catch (error: any) {
        console.error('Error generating IOP goals:', error);

        if (error?.code === 'INVALID_API_KEY') throw error;
        if (error?.name === 'AbortError') {
            throw newError('Forespørselen brukte for lang tid. Prøv med færre kompetansemål eller enklere beskrivelse.');
        }
        if (String(error?.message || '').includes('Failed to fetch') || String(error?.message || '').includes('NetworkError')) {
            throw newError('Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.');
        }
        if (error instanceof SyntaxError) {
            throw newError('KI-tjenesten returnerte et uventet svar. Prøv igjen.');
        }
        throw newError(error?.message || 'Kunne ikke generere mål. Prøv igjen.');
    }
};
