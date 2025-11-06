import React from 'react';
import { XIcon } from './icons/XIcon';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Om IOP-målgenerator</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Lukk"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
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
                                Gjennom arbeid med <a href="https://lærerLiv.no" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">lærerLiv</a> jobber 
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
                                <p className="font-medium text-amber-700 mt-2">
                                    💡 Anbefaling: Anonymiser elevdata før du bruker appen. Unngå personnavn, 
                                    fødselsnummer og andre direkte identifiserbare opplysninger.
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
                                    <a href="https://lærerLiv.no" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                                        lærerLiv.no
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
