<div align="center">
  <img src="public/og-image.png" alt="IOP Målbygger Banner" width="1200" />
  
  # IOP Målbygger
  
  **Kraftig KI-drevet verktøy for individuelle opplæringsplaner**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)
  [![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285F4?logo=google)](https://ai.google.dev/)
  
  [📚 Dokumentasjon](#-kom-i-gang) • [🐛 Rapporter Bug](https://github.com/barx10/IOP-m-lgenerator/issues) • [💡 Feature Request](https://github.com/barx10/IOP-m-lgenerator/issues)
</div>

---

## ✨ Om prosjektet

IOP Målbygger er et AI-drevet verktøy designet for norske lærere og spesialpedagoger. Med kunstig intelligens fra OpenAI eller Google Gemini genererer verktøyet skreddersydde kompetansemål for elever med spesialundervisning, basert på læreplanen (LK20).

Appen bruker **BYOK (Bring Your Own Key)**: du legger inn din egen API-nøkkel i appen og velger selv mellom OpenAI (`gpt-5.6-luna`) og Google Gemini (`gemini-3.6-flash`). Nøkkelen lagres kun i nettleseren din.

### 🎯 Hovedfunksjoner

- 🤖 **AI-genererte mål** - Automatisk generering basert på kompetansemål fra læreplanen
- 📚 **Alle fag og trinn** - Støtte for 1.-10. trinn på barneskole og ungdomsskole
- 🎓 **To vanskelighetsgrader** - Tilpasset og utfordrende nivå for hver elev
- 💾 **Sammenlign fag** - Lagre og arbeide med flere fag samtidig
- 🖨️ **Utskriftsvennlig** - Generer kompakte rapporter for alle fag
- 🔒 **Personvernsikker** - Ingen permanent lagring, data slettes ved refresh
- ⚡ **Rask og responsiv** - Optimalisert brukeropplevelse med moderne teknologi

---

## 🚀 Kom i gang

### Forutsetninger

- **Node.js** (v18 eller nyere)
- **npm** eller **yarn**
- **Egen API-nøkkel** fra [OpenAI](https://platform.openai.com/api-keys) eller [Google AI Studio](https://aistudio.google.com/apikey) (legges inn i appen, ikke i koden)

### Installasjon (Lokal utvikling)

1. **Clone repositoryet:**
   ```bash
   git clone https://github.com/barx10/IOP-m-lgenerator.git
   cd IOP-m-lgenerator
   ```

2. **Installer avhengigheter:**
   ```bash
   npm install
   ```

3. **Start utviklingsserver:**
   ```bash
   npm run dev
   ```

4. **Åpne i nettleseren:**

   Gå til http://localhost:3000 (eller porten som vises i terminalen)

5. **Legg inn API-nøkkel:**

   Klikk «⚙️ KI-innstillinger» oppe til høyre i appen, velg leverandør og lim inn nøkkelen din.

---

## 🌐 Deploy til produksjon

For sikker deployment med backend API og rate limiting, se vår detaljerte guide:

📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Komplett Vercel deployment-guide

**Kort oppsummert:**
- BYOK: brukerne tar med egen API-nøkkel – ingen API-kostnader for deg
- Ren statisk frontend – ingen backend eller miljøvariabler
- Automatisk deployment via GitHub
- Gratis hosting på Vercel

---

## 🛠️ Teknologi

<div align="center">

| Frontend | Deployment | AI |
|----------|------------|-----|
| React 19 | Vercel | OpenAI gpt-5.6-luna |
| TypeScript | GitHub Actions | Google Gemini 3.6 Flash |
| Tailwind CSS | - | BYOK (egen API-nøkkel) |
| Vite | - | JSON Schema Output |

</div>

---

## 📖 Slik bruker du verktøyet

1. **Velg fag og trinn** - F.eks. Matematikk, 5. trinn
2. **Velg tema** - F.eks. "Tallforståelse og brøk"
3. **Lim inn kompetansemål** - Fra læreplanen (LK20)
4. **Legg til sakkyndig vurdering** (valgfritt)
5. **Klikk "Generer IOP-forslag"** - AI genererer tilpassede mål
6. **Velg beste mål** - Velg ett ferdighetsmål og ett kunnskapsmål
7. **Lagre og utskriv** - Få en kompakt rapport for alle fag

---

## 🔒 Personvern og sikkerhet

- ✅ **Ingen permanent lagring** - Data slettes ved refresh
- ✅ **BYOK** - Din API-nøkkel lagres kun i din egen nettleser, aldri på server
- ✅ **Direkte til leverandør** - Forespørsler går rett fra nettleseren til OpenAI/Google
- ✅ **GDPR-vennlig** - Ingen personopplysninger lagres
- ⚠️ **Viktig:** Anonymiser alltid elevdata før bruk

---

## 🤝 Bidra

Vi setter pris på alle bidrag! Se vår [CONTRIBUTING.md](CONTRIBUTING.md) for retningslinjer.

### Rapporter bugs eller foreslå funksjoner:
- 🐛 [Rapporter en bug](https://github.com/barx10/IOP-m-lgenerator/issues/new?template=bug_report.yml)
- 💡 [Foreslå en funksjon](https://github.com/barx10/IOP-m-lgenerator/issues/new?template=feature_request.yml)

---

## 📄 Lisens

Dette prosjektet er lisensiert under MIT License - se [LICENSE](LICENSE) for detaljer.

---

## 👨‍💻 Om utvikler

**Kenneth Bareksten** - [Lærerliv](https://www.laererliv.no/)

Lærer og utvikler med lidenskap for å lage verktøy som gjør hverdagen enklere for lærere.

- 🌐 Website: [laererliv.no](https://www.laererliv.no/)
- 📧 Email: kenneth@laererliv.no
- 💼 GitHub: [@barx10](https://github.com/barx10)

---

## 🙏 Takk til

- **Google Gemini** - For kraftig og rimelig AI
- **Vercel** - For enkel og gratis hosting
- **Alle lærere** - Som tester og gir feedback

---

## 📊 Statistikk

- ⚡ **~30 sekunder** generering per IOP
- 💰 **Typisk under én krone** per generering (betales via din egen API-nøkkel)
- 🔑 **BYOK** - du velger selv mellom OpenAI og Google Gemini
- 📈 **Gratis å drifte** - ingen API-kostnader på server

---

<div align="center">
  
  **Laget med ❤️ for norske lærere**
  
  [⭐ Gi oss en stjerne](https://github.com/barx10/IOP-m-lgenerator) hvis du liker prosjektet!
  
</div>
