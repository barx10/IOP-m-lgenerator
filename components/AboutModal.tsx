import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'om' | 'retningslinjer'>('om');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Om IOP-målgenerator</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Lukk"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('om')}
                            className={`pb-2 px-1 font-medium transition-colors ${
                                activeTab === 'om'
                                    ? 'text-brand-blue border-b-2 border-brand-blue'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Om appen
                        </button>
                        <button
                            onClick={() => setActiveTab('retningslinjer')}
                            className={`pb-2 px-1 font-medium transition-colors ${
                                activeTab === 'retningslinjer'
                                    ? 'text-brand-blue border-b-2 border-brand-blue'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📋 Retningslinjer
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {activeTab === 'om' && (
                        <>
                            {/* Om appen */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Om appen</h3>
                                <div className="text-gray-700 space-y-2">
                                    <p>
                                        IOP-målgenerator er et verktøy som hjelper lærere og spesialpedagoger med å lage 
                                        konkrete, strukturerte mål for elever med individuell opplæringsplan (IOP).
                                    </p>
                                    <p>
                                        Appen bruker kunstig intelligens (Google Gemini) til å foreslå realistiske 
                                        ferdighetsmål og kunnskapsmål basert på kompetansemål fra læreplanen, 
                                        kjerneelementer, og sakkyndig vurdering.
                                    </p>
                                    <p className="font-medium text-amber-700">
                                        ⚠️ Viktig: AI-genererte forslag må alltid kvalitetssikres og tilpasses av fagperson. 
                                        Dette verktøyet er en hjelp, ikke en erstatning for profesjonell vurdering.
                                    </p>
                                </div>
                            </section>

                            {/* Om utvikler */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Om utvikler</h3>
                                <div className="text-gray-700 space-y-2">
                                    <p>
                                        <strong>Kenneth Bareksten</strong>
                                    </p>
                                    <p>
                                        Jeg er lærer og utvikler med lidenskap for edtech og digital kompetanse i skolen. 
                                        Gjennom arbeid med <a href="https://www.laererliv.no/" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Lærerliv</a> jobber 
                                        jeg for å gjøre læreres hverdag enklere og bedre.
                                    </p>
                                    <p>
                                        Dette prosjektet startet som et forsøk på å gjøre IOP-skrivinga mer presis, 
                                        og har utviklet seg til en ressurs jeg håper kan være nyttig for andre lærere.
                                    </p>
                                </div>
                            </section>

                            {/* Personvern */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personvern & datasikkerhet</h3>
                                <div className="text-gray-700 space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Hva lagres?</h4>
                                        <p>
                                            Data lagres kun midlertidig i nettleserens minne mens du bruker appen. 
                                            Alt slettes automatisk når du lukker eller laster siden på nytt. 
                                            Ingen data lagres permanent på servere eller i nettleseren.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Sending til AI-tjeneste</h4>
                                        <p>
                                            Informasjonen du legger inn (kompetansemål, sakkyndig vurdering, etc.) sendes til 
                                            Google Gemini API for å generere IOP-mål. Google behandler data i henhold til deres 
                                            personvernregler og tjenestevilkår.
                                        </p>
                                        <p className="font-semibold text-red-600 mt-2 flex items-start gap-2">
                                            <span className="text-lg flex-shrink-0">⚠️</span>
                                            <span>Lovpålagt krav: Du må anonymisere elevdata før bruk. Ikke bruk personnavn, 
                                            fødselsnummer eller andre direkte identifiserbare opplysninger.</span>
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">GDPR og ansvar</h4>
                                        <p>
                                            Som bruker er du ansvarlig for å følge skolens retningslinjer for 
                                            personvern og GDPR ved bruk av AI-verktøy. Denne appen er et hjelpemiddel 
                                            og erstatter ikke profesjonell vurdering eller etablerte rutiner for IOP-arbeid.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Kontakt */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Kontakt</h3>
                                <div className="text-gray-700 space-y-2">
                                    <p>
                                        Har du spørsmål, tilbakemeldinger eller forslag?
                                    </p>
                                    <ul className="space-y-1">
                                        <li>
                                            <strong>E-post:</strong>{' '}
                                            <a href="mailto:kenneth@laererliv.no" className="text-brand-blue hover:underline">
                                                kenneth@laererliv.no
                                            </a>
                                        </li>
                                        <li>
                                            <strong>Nettside:</strong>{' '}
                                            <a href="https://www.laererliv.no/" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                                                www.laererliv.no
                                            </a>
                                        </li>
                                        <li>
                                            <strong>GitHub:</strong>{' '}
                                            <a href="https://github.com/barx10" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                                                @barx10
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Versjon */}
                            <section className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                                <p>Versjon 1.0 • Sist oppdatert november 2025</p>
                            </section>
                        </>
                    )}

                    {activeTab === 'retningslinjer' && (
                        <>
                            {/* Tips for bruk av AI */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Tips før du bruker AI-forslag</h3>
                                <p className="text-blue-800 text-sm">
                                    AI kan gi gode forslag, men du som fagperson må alltid vurdere om målene er realistiske, 
                                    relevante og tilpasset den enkelte eleven. Bruk AI som et utgangspunkt, ikke som fasit.
                                </p>
                            </div>

                            {/* § 8.1 Skolen skal utarbeide IOP */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">§ 8-1. Skolen skal utarbeide IOP</h3>
                                <div className="text-gray-700 space-y-3">
                                    <p>
                                        Når en elev får spesialundervisning, skal skolen umiddelbart utarbeide en individuell 
                                        opplæringsplan (IOP) for eleven. IOP skal vise hva elevens opplæring skal inneholde, 
                                        og hvordan opplæringen skal gjennomføres.
                                    </p>
                                    <p>
                                        Planen skal utarbeides i samarbeid med eleven og elevens foreldre, og skal bygge på 
                                        den sakkyndige vurderingen. For elever som får spesialundervisning etter § 2-6, skal 
                                        planen også ta utgangspunkt i den individuelle helhetlige planen etter barnehageloven § 30.
                                    </p>
                                </div>
                            </section>

                            {/* § 8.2 Samarbeid og medvirkning */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">§ 8-2. Samarbeid og medvirkning</h3>
                                <div className="text-gray-700 space-y-3">
                                    <p>
                                        Skolen skal samarbeide med eleven og elevens foreldre om utarbeidelse og oppfølging av IOP. 
                                        Eleven og elevens foreldre skal få medvirke ved utarbeidelse, gjennomføring og vurdering 
                                        av opplæringen.
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        Underveisvurdering:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Skolen skal gi eleven og foreldrene jevnlig informasjon om utviklingen</li>
                                        <li>Underveisvurdering skal være en integrert del av opplæringen</li>
                                        <li>Det skal gis kontinuerlig veiledning om hvordan eleven kan forbedre seg</li>
                                    </ul>
                                </div>
                            </section>

                            {/* § 8.3 Innhold i IOP */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">§ 8-3. Innhold i IOP</h3>
                                <div className="text-gray-700 space-y-3">
                                    <p className="font-medium text-gray-900">IOP skal inneholde:</p>
                                    
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">8.3.1 Mål for opplæringen</h4>
                                        <p>
                                            IOP skal angi mål for elevens opplæring. Målene skal være konkrete og ta utgangspunkt i:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-1 mt-2">
                                            <li>Læreplanen eller individuelle læreplanmål</li>
                                            <li>Elevens forutsetninger og behov</li>
                                            <li>Sakkyndig vurdering</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">8.3.2 Innhold i opplæringen</h4>
                                        <p>
                                            IOP skal beskrive hva opplæringen skal inneholde, inkludert:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-1 mt-2">
                                            <li>Fag og emner som skal undervises</li>
                                            <li>Arbeidsmåter og metoder</li>
                                            <li>Læremidler og hjelpemidler</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">8.3.3 Gjennomføring av opplæringen</h4>
                                        <p>
                                            IOP skal beskrive hvordan opplæringen skal organiseres:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-1 mt-2">
                                            <li>Antall timer spesialundervisning</li>
                                            <li>Organisering (gruppe/individuelt)</li>
                                            <li>Hvem som skal ha ansvaret</li>
                                            <li>Tidsperspektiv og vurdering av måloppnåelse</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* § 8.4 Avvik mellom opplæring og vedtak */}
                            <section>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">§ 8-4. Avvik mellom opplæring og vedtak</h3>
                                <div className="text-gray-700 space-y-3">
                                    <p>
                                        Dersom opplæringen som gis i henhold til IOP avviker vesentlig fra det som er bestemt 
                                        i enkeltvedtaket, skal skolen vurdere om det er grunnlag for å gjøre endringer i vedtaket.
                                    </p>
                                    <p>
                                        Dette innebærer at IOP skal følges opp aktivt, og at eventuelle avvik skal dokumenteres 
                                        og vurderes med tanke på om vedtaket må endres.
                                    </p>
                                </div>
                            </section>

                            {/* Sjekkliste før bruk */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-green-900 mb-3">✅ Sjekkliste før du bruker AI-forslag</h3>
                                <ul className="space-y-2 text-green-800 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">☑️</span>
                                        <span>Har jeg anonymisert all elevdata?</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">☑️</span>
                                        <span>Er målene basert på sakkyndig vurdering og elevens behov?</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">☑️</span>
                                        <span>Skal jeg kvalitetssikre og tilpasse forslagene før de brukes?</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">☑️</span>
                                        <span>Har jeg involvert eleven og foreldrene i prosessen?</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">☑️</span>
                                        <span>Er IOP i samsvar med vedtaket om spesialundervisning?</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Kilde */}
                            <section className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                                <p>
                                    Kilde:{' '}
                                    <a 
                                        href="https://www.udir.no/laring-og-trivsel/spesialpedagogikk/individuell-opplaringsplan/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-brand-blue hover:underline"
                                    >
                                        Utdanningsdirektoratet (Udir)
                                    </a>
                                </p>
                            </section>
                        </>
                    )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue/90 transition-colors"
                    >
                        Lukk
                    </button>
                </div>
            </div>
        </div>
    );
};
