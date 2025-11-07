<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# IOP Målbygger

AI-drevet verktøy for å generere individuelle opplæringsplaner (IOP) for elever med spesialundervisning.

## ✨ Funksjoner

- 🤖 AI-genererte IOP-mål basert på kompetansemål fra læreplanen
- 📚 Støtte for flere fag og trinn
- 🎯 Ferdighetsmål og kunnskapsmål på tilpasset og utfordrende nivå
- 💾 Lagre og sammenligne flere fag
- 🖨️ Print kompakt rapport for alle fag
- 🔒 Personvernsikker - ingen permanent lagring

## 🚀 Kom i gang

### Lokal utvikling

**Forutsetninger:** Node.js installert

1. **Installer avhengigheter:**
   ```bash
   npm install
   ```

2. **Sett opp API-nøkkel:**
   - Kopier `.env.example` til `.env`
   - Legg til din Gemini API-nøkkel fra [Google AI Studio](https://aistudio.google.com/app/apikey)

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Åpne i nettleser:**
   http://localhost:3000 (eller port som vises i terminal)

### Deploy til produksjon

For sikker offentlig tilgjengelig deployment, se [DEPLOYMENT.md](DEPLOYMENT.md) for komplett guide til Vercel-oppsett med backend API.
