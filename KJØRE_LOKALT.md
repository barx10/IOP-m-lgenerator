# 🚀 Kjøre IOP Målbygger Lokalt

## 📋 Forutsetninger
- Node.js installert (versjon 18+)
- Google Gemini API-nøkkel

## 🔑 Skaff API-nøkkel

1. Gå til https://aistudio.google.com/app/apikey
2. Logg inn med Google-konto
3. Klikk "Create API Key"
4. Kopier nøkkelen

## ⚙️ Oppsett

### 1. Installer avhengigheter
```bash
npm install
```

### 2. Sett opp miljøvariabler
Legg til din API-nøkkel i `.env` filen:
```bash
GEMINI_API_KEY=din-faktiske-api-nøkkel-her
```

⚠️ **VIKTIG:** Aldri commit `.env` filen til Git!

## 🏃 Kjør utviklingsserver

```bash
npm run dev
```

Applikasjonen vil være tilgjengelig på: http://localhost:3000

## 🧪 Test funksjonalitet

1. Velg trinn (f.eks. 3. trinn)
2. Velg fag (f.eks. Norsk)
3. Skriv inn tema (f.eks. "Å skrive en fortelling")
4. Lim inn kompetansemål (ett per linje)
5. Klikk "Generer forslag til IOP"
6. Vent 5-12 sekunder (optimalisert responstid!)

## 📦 Bygg for produksjon

```bash
npm run build
```

Bygget vil ligge i `dist/` mappen.

## 🔍 Feilsøking

### Problem: "API key not valid"
**Løsning:** Sjekk at API-nøkkelen er korrekt i `.env` filen

### Problem: "Cannot find module '@google/genai'"
**Løsning:** Kjør `npm install` på nytt

### Problem: Timeout eller lang responstid
**Løsning:** 
- Sjekk internettforbindelsen
- Verifiser at du bruker `gemini-2.0-flash-001` modell (nå implementert)
- Sjekk Google Cloud console for API-kvote

### Problem: Kompileringsfeil
**Løsning:** Kjør `npm install @types/node --save-dev`

## 📊 Ytelsesoptimaliseringer implementert

✅ Fjernet unødvendige dokumentvedlegg  
✅ Byttet til raskere AI-modell (gemini-2.0-flash-001)  
✅ Optimalisert prompt-struktur  
✅ Hardkodet statisk innhold  

**Forventet responstid:** 5-12 sekunder (ned fra 15-30 sekunder)

## 🛡️ Sikkerhet

⚠️ **VIKTIG ADVARSEL:**  
API-nøkkelen er for øyeblikket eksponert i frontend-koden. For produksjon bør du:
1. Lage en backend API-proxy
2. Holde API-nøkkelen på server-side
3. Implementere rate limiting

## 📚 Dokumentasjon

Se `ANALYSE_OG_FORBEDRINGER.md` for detaljert gjennomgang av koden.
