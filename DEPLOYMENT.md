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
- ✅ Ingen backend i det hele tatt – appen er en ren statisk frontend

## Deploy til Vercel

### Metode 1: Via Vercel Dashboard (anbefalt for første gang)

1. **Gå til [vercel.com](https://vercel.com)** og logg inn med GitHub
2. **Klikk "Add New Project"**
3. **Import repoet ditt** (`IOP-m-lgenerator`)
4. **Klikk "Deploy"** – ingen miljøvariabler trengs

### Metode 2: Via CLI

```bash
# Fra prosjektmappen:
vercel

# Deploy:
vercel --prod
```

## Etter deployment

1. Åpne URL-en Vercel gir deg
2. Åpne «⚙️ KI-innstillinger», velg leverandør og legg inn en API-nøkkel
3. Test å generere en IOP

## Lokal utvikling

```bash
npm install
npm run dev
```

Ingen miljøvariabler trengs – API-nøkkelen legges inn i selve appen.

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
