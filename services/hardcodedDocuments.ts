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

// Summarized version of opplaeringsloven.txt
const opplaeringslovenSummary = `Opplæringsloven:
- Sikrer god opplæring i trygt miljø for barn, unge, voksne (grunnskole, videregående).
- Baseres på kristen/humanistisk tradisjon, fremmer menneskerettigheter, demokrati, likestilling, vitenskap.
- Elever skal utvikle kunnskap, ferdigheter, holdninger for å mestre liv/samfunn, tenke kritisk, handle etisk/miljøbevisst, oppleve respekt/medvirkning uten diskriminering.`;

// Summarized version of overordnet-del.txt
const overordnetDelSummary = `Overordnet del av læreplanen:
- Bygger på Opplæringslovens formålsparagraf: menneskeverd, demokrati, likestilling, kritisk tenkning, mangfold.
- Gir historisk/kulturell forankring, fremmer skaperglede, engasjement, etisk bevissthet, medvirkning.
- Dobbelt oppdrag: utdanning og danning. Elever skal utvikle sosial/faglig kompetanse, grunnleggende ferdigheter, refleksjon, selvstendig læring.
- Tverrfaglige temaer: folkehelse/livsmestring, demokrati/medborgerskap, bærekraftig utvikling.
- Skal ha inkluderende læringsmiljø, møte elever med respekt/krav, tilpasse opplæring for faglig/personlig utvikling.`;

export const hardcodedDocuments: Record<string, UploadedFile[]> = {
  educationAct: [{ name: 'opplaeringsloven.txt', content: toBase64(opplaeringslovenSummary) }],
  coreCurriculum: [{ name: 'overordnet-del.txt', content: toBase64(overordnetDelSummary) }],
};