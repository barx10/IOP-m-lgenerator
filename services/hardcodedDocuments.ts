import type { UploadedFile } from '../types';

// More robust Base64 encoding for UTF-8 strings
const toBase64 = (str: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let binaryString = '';
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }
  return btoa(binaryString);
};

const opplaeringslovenText = `Loven skal sikre god opplæring for barn, unge og voksne i et trygt miljø. Den gjelder for grunnskole og videregående opplæring, men ikke for privatskoler.
Opplæringen skal i samarbeid med hjemmet gi historisk, kulturell og verdimessig forankring, bygge på kristen og humanistisk tradisjon, og fremme menneskerettigheter, demokrati, likestilling og vitenskapelig tenkning.
Elever og lærlinger skal utvikle kunnskap, ferdigheter og holdninger for å mestre liv og samfunn, tenke kritisk, handle etisk og miljøbevisst, og oppleve respekt, medvirkning og lærelyst uten diskriminering. § 1-1 Formål, § 1-2 Virkeområde, § 1-3 Opplæring`;

const overordnetDelText = `Skolen skal bygge på verdiene i opplæringslovens formålsparagraf: menneskeverd, demokrati, likestilling, kritisk tenkning og respekt for mangfold.
Opplæringen skal gi historisk og kulturell forankring, fremme skaperglede, engasjement og etisk bevissthet, og gi rom for medvirkning og demokrati i praksis.
Skolen har et dobbelt oppdrag: utdanning og danning. Elevene skal utvikle sosial og faglig kompetanse, grunnleggende ferdigheter, evne til refleksjon og selvstendig læring.
De tverrfaglige temaene er folkehelse og livsmestring, demokrati og medborgerskap, og bærekraftig utvikling.
Skolen skal ha et inkluderende læringsmiljø, møte elevene med respekt og krav, og tilpasse opplæringen slik at alle får utvikle seg faglig og personlig.`;

export const hardcodedDocuments: Record<string, UploadedFile[]> = {
  educationAct: [{ name: 'opplaeringsloven.txt', content: toBase64(opplaeringslovenText) }],
  coreCurriculum: [{ name: 'overordnet-del.txt', content: toBase64(overordnetDelText) }],
};