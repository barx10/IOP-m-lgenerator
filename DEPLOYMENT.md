# 🚀 Deployment Guide - Vercel

## Forberedelser

### 1. Bytt til backend-versjon av geminiService

For å bruke backend API (sikker for offentlig bruk), bytt ut importen i `App.tsx`:

```typescript
// Erstatt denne linjen:
import { generateIopGoals } from './services/geminiService';

// Med denne:
import { generateIopGoals } from './services/geminiService.backend';
```

### 2. Installer Vercel CLI (valgfritt)

```bash
npm install -g vercel
```

## Deploy til Vercel

### Metode 1: Via Vercel Dashboard (anbefalt for første gang)

1. **Gå til [vercel.com](https://vercel.com)** og logg inn med GitHub
2. **Klikk "Add New Project"**
3. **Import repoet ditt** (`IOP-m-lgenerator`)
4. **Konfigurer miljøvariabler:**
   - Klikk "Environment Variables"
   - Legg til:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** `[din-gemini-api-nøkkel]`
     - **Environment:** Production, Preview, Development (velg alle)
5. **Klikk "Deploy"**

### Metode 2: Via CLI

```bash
# Fra prosjektmappen:
vercel

# Følg instruksjonene:
# - Link to existing project? No
# - Project name? iop-malbygger
# - Directory? ./
# - Override settings? No

# Legg til miljøvariabel:
vercel env add GEMINI_API_KEY production
# Lim inn din Gemini API-nøkkel

# Deploy:
vercel --prod
```

## Etter deployment

### Test appen

1. Åpne URL-en Vercel gir deg (f.eks. `iop-malbygger.vercel.app`)
2. Test å generere en IOP
3. Sjekk at rate limiting fungerer (prøv > 10 forespørsler på en time)

### Overvåk bruken

1. Gå til [Vercel Dashboard](https://vercel.com/dashboard)
2. Velg prosjektet ditt
3. Se "Analytics" for bruksstatistikk
4. Se "Logs" for eventuelle feil

### Overvåk API-kostnader

1. Gå til [Google AI Studio](https://aistudio.google.com)
2. Se "API Usage" for å overvåke Gemini API-kostnader
3. Sett opp varslinger i Google Cloud Console

## Rate Limiting

Backend-en har innebygd rate limiting:
- **10 forespørsler per IP per time**
- Ved overskridelse: "429 Too Many Requests"
- Brukeren får beskjed om å vente en time

## Sikkerhet

✅ **API-nøkkel** er trygt lagret på server-siden
✅ **Rate limiting** forhindrer misbruk
✅ **CORS** tillater kun forespørsler fra din frontend

## Oppdatering

For å oppdatere appen etter deployment:

```bash
# Commit endringene dine
git add .
git commit -m "Din commit-melding"
git push

# Vercel deployer automatisk ved push til main-branch
```

## Tilbake til lokal utvikling

For lokal utvikling med direkte Gemini API (uten backend):

1. Bytt tilbake til original geminiService:
   ```typescript
   import { generateIopGoals } from './services/geminiService';
   ```

2. Kjør dev server:
   ```bash
   npm run dev
   ```

## Feilsøking

### "Failed to fetch" error

- Sjekk at `GEMINI_API_KEY` er lagt til i Vercel Environment Variables
- Sjekk at API-nøkkelen er gyldig i Google AI Studio
- Se Vercel Function Logs for detaljer

### Rate limiting for streng?

Endre verdiene i `api/generate-iop.ts`:
```typescript
const RATE_LIMIT = 20; // Øk antall forespørsler
const RATE_WINDOW = 60 * 60 * 1000; // Eller reduser tidsvinduet
```

### Trege responser?

- Gemini 2.0 Flash er rask (~5-10s)
- Hvis tregere: sjekk Vercel Function Logs
- Vurder å øke timeout i vercel.json (standard 10s)

## Support

Spørsmål? Ta kontakt på kenneth@laererliv.no
