# 🚀 Deployment Guide - Vercel

## Slik fungerer appen (BYOK)

Appen bruker **BYOK (Bring Your Own Key)**: hver bruker legger inn sin egen
API-nøkkel under «⚙️ KI-innstillinger» i appen, og velger selv leverandør:

- **OpenAI** (`gpt-5.4-mini`)
- **Google Gemini** (`gemini-3.1-flash-lite`)

Nøkkelen lagres kun i brukerens nettleser (localStorage), og forespørslene går
direkte fra nettleseren til leverandøren. Det betyr:

- ✅ Ingen `GEMINI_API_KEY` trengs på serveren lenger
- ✅ Ingen API-kostnader for deg som drifter appen
- ✅ Ingen backend-funksjon for generering (`api/generate-iop.ts` er fjernet)

Det eneste som kjører server-side er PIN-gaten (`api/verify-pin.ts`), som
styrer hvem som får tilgang til appen.

## Deploy til Vercel

### Metode 1: Via Vercel Dashboard (anbefalt for første gang)

1. **Gå til [vercel.com](https://vercel.com)** og logg inn med GitHub
2. **Klikk "Add New Project"**
3. **Import repoet ditt** (`IOP-m-lgenerator`)
4. **Konfigurer miljøvariabler:**
   - **Name:** `PINGATE_CODE`
   - **Value:** `[ønsket PIN-kode for tilgang til appen]`
   - **Environment:** Production, Preview, Development (velg alle)
5. **Klikk "Deploy"**

### Metode 2: Via CLI

```bash
# Fra prosjektmappen:
vercel

# Legg til miljøvariabel for PIN-gate:
vercel env add PINGATE_CODE production

# Deploy:
vercel --prod
```

## Etter deployment

1. Åpne URL-en Vercel gir deg
2. Logg inn med PIN-koden
3. Åpne «⚙️ KI-innstillinger», velg leverandør og legg inn en API-nøkkel
4. Test å generere en IOP

## Lokal utvikling

```bash
npm install
npm run dev
```

Ingen miljøvariabler trengs for generering – du legger inn API-nøkkel i selve
appen. (Uten `PINGATE_CODE` slipper PIN-gaten alle gjennom lokalt.)

## Feilsøking

### "API-nøkkelen er ugyldig"

- Sjekk at nøkkelen er limt inn riktig under KI-innstillinger
- Sjekk at nøkkelen er aktiv hos leverandøren
  ([OpenAI](https://platform.openai.com/api-keys) /
  [Google AI Studio](https://aistudio.google.com/apikey))

### "Kvoten er brukt opp"

- Brukeren har gått tom for kreditt/kvote hos leverandøren sin – dette styres
  av brukerens egen konto, ikke av appen

## Support

Spørsmål? Ta kontakt på kenneth@laererliv.no
