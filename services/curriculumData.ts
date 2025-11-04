import type { CurriculumData } from '../types';

export const curriculumSubjects: string[] = [
    'Norsk',
    'Samfunnsfag',
    'Engelsk',
    'KRLE',
    'Kroppsøving',
    'Kunst og håndverk',
    'Matematikk',
    'Naturfag',
];

export const curriculumData: CurriculumData = {
    'Norsk': {
        coreElements: [
            "Tekst i kontekst",
            "Kritisk tilnærming til tekst",
            "Språklig mangfold",
            "Skriftlig tekstskaping",
            "Muntlig kommunikasjon"
        ],
        goals: []
    },
    'Samfunnsfag': {
        coreElements: [
            "Utforsking og refleksjon",
            "Samfunnskritisk tenkning",
            "Identitet og fellesskap",
            "Demokrati og medborgerskap",
            "Bærekraftige samfunn"
        ],
        goals: []
    },
    'Engelsk': {
        coreElements: [
            "Kommunikasjon",
            "Språklæring",
            "Møte med engelskspråklige tekster"
        ],
        goals: []
    },
    'KRLE': {
        coreElements: [
            "Kunnskap om religioner og livssyn",
            "Utforsking av religioner og livssyn med ulike metoder",
            "Utforsking av eksistensielle spørsmål og svar",
            "Etisk refleksjon og handlingskompetanse"
        ],
        goals: []
    },
    'Kroppsøving': {
        coreElements: [
            "Bevegelse og kroppslig læring",
            "Deltakelse og samspill i bevegelsesaktiviteter",
            "Uteaktiviteter og naturferdsel"
        ],
        goals: []
    },
    'Kunst og håndverk': {
        coreElements: [
            "Håndverksferdigheter",
            "Materialer og teknologi",
            "Kunst- og designprosesser",
            "Visuell kommunikasjon"
        ],
        goals: []
    },
    'Matematikk': {
        coreElements: [
            "Utforsking og problemløsning",
            "Modellering og anvendelser",
            "Resonnering og argumentasjon",
            "Representasjon og kommunikasjon",
            "Abstraksjon og generalisering"
        ],
        goals: []
    },
    'Naturfag': {
        coreElements: [
            "Naturvitenskapelige praksiser og tenkemåter",
            "Teknologi",
            "Jorda og livet på jorda",
            "Kropp og helse"
        ],
        goals: []
    }
};