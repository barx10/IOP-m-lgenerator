# Tilgangskontroll med PIN-kode

Dette prosjektet bruker en PIN-kode for å kontrollere tilgang til IOP-generatoren.

## For utviklere

### Lokal utvikling
1. Lag en `.env` fil i rot-mappen (se `.env.example`)
2. Kontakt prosjekteier for å få PIN-koden
3. Legg til PIN-koden i `.env`:
   ```
   PINGATE_CODE=din-pin-kode-her
   ```

### Produksjon (Vercel)
PIN-koden er lagret som en miljøvariabel i Vercel:
1. Gå til Vercel Dashboard → Settings → Environment Variables
2. Oppdater `PINGATE_CODE` med den nye PIN-koden
3. Redeploy prosjektet for å aktivere endringen

## For brukere

Kontakt prosjekteier for å få tilgang:
- **E-post**: kenneth@laererliv.no
- **Nettside**: laererliv.no

---

⚠️ **VIKTIG**: PIN-koden skal ALDRI committes til Git eller deles offentlig. Den lagres kun som miljøvariabel.
