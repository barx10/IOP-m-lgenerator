import type { CurriculumData, CrossCurricularTheme } from '../types';

export const curriculumSubjects: string[] = [
    'Norsk',
    'Samfunnsfag',
    'Engelsk',
    'KRLE',
    'Kroppsøving',
    'Kunst og håndverk',
    'Matematikk',
    'Mat og helse',
    'Musikk',
    'Naturfag',
];

export const vgsSubjects: string[] = [
    'Norsk VGS',
    'Matematikk VGS',
];

export const allSubjects: string[] = [...curriculumSubjects, ...vgsSubjects];

export const curriculumData: CurriculumData = {
    'Norsk': {
        coreElements: [
            { name: "Tekst i kontekst", description: "Forstå hvordan tekster påvirkes av tid, sted og kultur" },
            { name: "Kritisk tilnærming til tekst", description: "Vurdere troverdighet, hensikt og perspektiver i tekster" },
            { name: "Muntlig kommunikasjon", description: "Lytte, snakke og presentere i varierte sammenhenger" },
            { name: "Skriftlig tekstskaping", description: "Skape egne tekster med ulike formål og for ulike mottakere" },
            { name: "Språket som system og mulighet", description: "Forstå språkets oppbygging og bruke det kreativt" },
            { name: "Språklig mangfold", description: "Utforske ulike språk, dialekter og språklige uttrykksformer" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Uttrykke følelser, tanker og erfaringer gjennom språk og litteratur for identitetsutvikling og relasjoner" },
            { name: "Demokrati og medborgerskap", description: "Retorikk og kritisk lesing for å delta i meningsbrytning og samfunnsliv" },
            { name: "Bærekraftig utvikling", description: "Forstå hvordan tekster framstiller natur og samfunn og håndtere interessekonflikter" }
        ],
        goals: []
    },
    'Samfunnsfag': {
        coreElements: [
            { name: "Undring og utforsking", description: "Stille spørsmål og undersøke samfunnsfenomener systematisk" },
            { name: "Samfunnskritisk tenkning og sammenhenger", description: "Analysere maktforhold, urettferdighet og sammenhenger i samfunnet" },
            { name: "Demokrati og medborgerskap", description: "Delta aktivt og ta ansvar i demokratiske prosesser" },
            { name: "Bærekraftig utvikling", description: "Forstå sammenhenger mellom miljø, økonomi og sosial utvikling" },
            { name: "Historie, kultur og identitet", description: "Utforske hvordan historie og kultur former identitet" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Identitet, tilhørighet og livsvalg inkludert økonomi, utenforskap og digital samhandling" },
            { name: "Demokrati og medborgerskap", description: "Kunnskaper og ferdigheter for å delta i demokratiske prosesser, inkl. arbeid med 22. juli" },
            { name: "Bærekraftig utvikling", description: "Se sammenhenger mellom miljø, økonomi og sosiale forhold og drøfte dilemma" }
        ],
        goals: []
    },
    'Engelsk': {
        coreElements: [
            { name: "Kommunikasjon", description: "Bruke engelsk muntlig og skriftlig i ulike situasjoner" },
            { name: "Språklæring", description: "Utvikle strategier for å lære og mestre engelsk" },
            { name: "Språk og kultur", description: "Utforske engelskspråklige kulturer og sammenhenger mellom språk og kultur" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Uttrykke seg på engelsk for å sette ord på følelser, erfaringer og bygge trygg identitet" },
            { name: "Demokrati og medborgerskap", description: "Møte ulike kulturer og perspektiver for å motvirke fordommer og forstå kulturavhengighet" }
        ],
        goals: []
    },
    'KRLE': {
        coreElements: [
            { name: "Kjennskap til religioner og livssyn", description: "Lære om ulike religioners og livssyns tro, praksiser og tradisjoner" },
            { name: "Utforsking av religioner og livssyn med ulike metoder", description: "Bruke varierte metoder for å utforske religiøse fenomener" },
            { name: "Utforsking av eksistensielle spørsmål og svar", description: "Reflektere over livets store spørsmål og ulike svar" },
            { name: "Kunne ta andres perspektiv", description: "Forstå og respektere andres synspunkter og levemåter" },
            { name: "Etisk refleksjon", description: "Vurdere etiske dilemmaer og reflektere over rett og galt" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Utforske eksistensielle spørsmål, menneskeverd, identitet, kjønn, seksualitet og psykisk helse" },
            { name: "Demokrati og medborgerskap", description: "Etisk refleksjon, perspektivtaking og kritisk holdning til normer og makt" },
            { name: "Bærekraftig utvikling", description: "Etisk refleksjon over menneske–natur–samfunn og ansvarlige valg" }
        ],
        goals: []
    },
    'Kroppsøving': {
        coreElements: [
            { name: "Bevegelse og kroppslig læring", description: "Utvikle ferdigheter gjennom variert fysisk aktivitet" },
            { name: "Deltakelse og samspill i bevegelsesaktiviteter", description: "Samarbeide, konkurrere og inkludere i fysiske aktiviteter" },
            { name: "Uteaktiviteter og naturferdsel", description: "Bevege seg trygt og ansvarlig i naturen" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Styrke fysisk og psykisk helse og gjøre ansvarlige livsvalg gjennom bevegelse" },
            { name: "Demokrati og medborgerskap", description: "Samspill, medvirkning, ansvar og håndtering av uenighet i aktiviteter" },
            { name: "Bærekraftig utvikling", description: "Trygg og bærekraftig ferdsel og forstå konsekvenser av egne valg i naturen" }
        ],
        goals: []
    },
    'Kunst og håndverk': {
        coreElements: [
            { name: "Håndverksferdigheter", description: "Utvikle tekniske ferdigheter med ulike materialer og verktøy" },
            { name: "Materialer og teknologi", description: "Utforske og eksperimentere med materialer og digitale verktøy" },
            { name: "Kunst- og designprosesser", description: "Utvikle ideer fra skisse til ferdig produkt" },
            { name: "Visuell kommunikasjon", description: "Uttrykke budskap gjennom bilder og visuelle uttrykk" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Skapende arbeid som utvikler praktiske ferdigheter, identitet og uttrykksevne" },
            { name: "Demokrati og medborgerskap", description: "Kritisk refleksjon og visuelle ytringer som tolker og påvirker samfunnet" },
            { name: "Bærekraftig utvikling", description: "Undersøke forbruk, materialbruk, gjenbruk og etiske valg i design og produksjon" }
        ],
        goals: []
    },
    'Matematikk': {
        coreElements: [
            { name: "Utforsking og problemløsing", description: "Utforske matematiske sammenhenger og løse problemer kreativt" },
            { name: "Modellering og anvendelser", description: "Bruke matematikk til å beskrive og forstå virkeligheten" },
            { name: "Resonnering og argumentasjon", description: "Forklare matematisk tenkning og begrunne løsninger" },
            { name: "Representasjon og kommunikasjon", description: "Bruke symboler, grafer og språk for å uttrykke matematikk" },
            { name: "Abstraksjon og generalisering", description: "Se mønstre og utvikle generelle regler" },
            { name: "Matematiske kunnskapsområder", description: "Utvikle forståelse innenfor tall, algebra, funksjoner, geometri, statistikk og sannsynlighet" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Problemløsing, statistikk og personlig økonomi for ansvarlige livsvalg" },
            { name: "Demokrati og medborgerskap", description: "Analysere reelle datasett og vurdere gyldighet for å kunne argumentere i samfunnsdebatt" }
        ],
        goals: []
    },
    'Naturfag': {
        coreElements: [
            { name: "Naturvitenskapelige praksiser og tenkemåter", description: "Bruke naturvitenskapelige metoder for å utforske naturen" },
            { name: "Teknologi", description: "Forstå og utvikle teknologiske løsninger" },
            { name: "Energi og materie", description: "Forstå teorier om energi, stoffer og partikler for å forklare vår fysiske verden" },
            { name: "Jorda og livet på jorda", description: "Utforske naturfenomener og livets mangfold" },
            { name: "Kropp og helse", description: "Lære om kroppen og hva som påvirker helse" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Forstå egen kropp og bruke helseinformasjon til trygge valg" },
            { name: "Demokrati og medborgerskap", description: "Skille vitenskapsbasert kunnskap fra ikke-vitenskapelige påstander, inkludert samisk kunnskap" },
            { name: "Bærekraftig utvikling", description: "Handle miljøbevisst, forstå klima og naturressurser og bevare biologisk mangfold" }
        ],
        goals: []
    },
    'Musikk': {
        coreElements: [
            { name: "Musisere", description: "Synge, spille og danse alene og sammen med andre" },
            { name: "Komponere", description: "Skape, improvisere og sette sammen musikalske uttrykk" },
            { name: "Lytte", description: "Oppleve, reflektere over og analysere musikk" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Musikalsk utfoldelse for identitet, mestring og sosialt fellesskap" },
            { name: "Demokrati og medborgerskap", description: "Musikkens rolle i samfunnet og kritisk refleksjon over musikalske ytringer" },
            { name: "Bærekraftig utvikling", description: "Musikk som kulturarv og uttrykk for miljøengasjement" }
        ],
        goals: []
    },
    'Mat og helse': {
        coreElements: [
            { name: "Mat og måltider", description: "Planlegge, lage mat og skape trivelige måltider" },
            { name: "Mat og helse", description: "Forstå sammenhengen mellom kosthold, helse og livskvalitet" },
            { name: "Mat og kultur", description: "Utforske mattradisjoner og måltiders sosiale betydning" },
            { name: "Mat og forbruk", description: "Gjøre bevisste og bærekraftige matvalg" },
            { name: "Mat og livsstil", description: "Utvikle positive holdninger til mat og sunne levevaner" }
        ],
        crossCurricularThemes: [
            { name: "Folkehelse og livsmestring", description: "Mat, måltider og kosthold for god helse og trivsel" },
            { name: "Demokrati og medborgerskap", description: "Kritisk forbruk og forbrukermakt i matproduksjon" },
            { name: "Bærekraftig utvikling", description: "Bærekraftig matproduksjon, matsvinn og klimaavtrykk" }
        ],
        goals: []
    }
};