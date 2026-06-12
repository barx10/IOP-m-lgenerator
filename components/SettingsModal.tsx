import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import {
    LlmProvider,
    PROVIDERS,
    getProvider,
    setProvider,
    getApiKey,
    setApiKey,
} from '../services/llmService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [selectedProvider, setSelectedProvider] = useState<LlmProvider>('google');
    const [keys, setKeys] = useState<Record<LlmProvider, string>>({ openai: '', google: '' });
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load stored settings each time the modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedProvider(getProvider());
            setKeys({
                openai: getApiKey('openai'),
                google: getApiKey('google'),
            });
            setShowKey(false);
            setSaved(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const providerInfo = PROVIDERS[selectedProvider];
    const currentKey = keys[selectedProvider];

    const handleSave = () => {
        setProvider(selectedProvider);
        setApiKey('openai', keys.openai);
        setApiKey('google', keys.google);
        setSaved(true);
        setTimeout(onClose, 600);
    };

    const handleClearKey = () => {
        setKeys(prev => ({ ...prev, [selectedProvider]: '' }));
        setSaved(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">⚙️ KI-innstillinger</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Lukk"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Provider selection */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Velg KI-leverandør</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Object.keys(PROVIDERS) as LlmProvider[]).map(provider => (
                                <button
                                    key={provider}
                                    type="button"
                                    onClick={() => { setSelectedProvider(provider); setShowKey(false); }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                        selectedProvider === provider
                                            ? 'border-brand-blue bg-blue-50 ring-2 ring-brand-blue shadow-md'
                                            : 'border-gray-200 bg-white hover:border-brand-blue hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900">{PROVIDERS[provider].label}</span>
                                        {keys[provider] && (
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                ✓ Nøkkel lagret
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Modell: {PROVIDERS[provider].model}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* API key input */}
                    <section>
                        <label htmlFor="apiKey" className="block text-lg font-semibold text-gray-900 mb-2">
                            API-nøkkel for {providerInfo.label}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type={showKey ? 'text' : 'password'}
                                id="apiKey"
                                value={currentKey}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setKeys(prev => ({ ...prev, [selectedProvider]: value }));
                                    setSaved(false);
                                }}
                                placeholder={providerInfo.keyPlaceholder}
                                autoComplete="off"
                                spellCheck={false}
                                className="flex-grow px-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue rounded-lg bg-white shadow-sm transition-all font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(prev => !prev)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                title={showKey ? 'Skjul nøkkel' : 'Vis nøkkel'}
                            >
                                {showKey ? '🙈' : '👁️'}
                            </button>
                            {currentKey && (
                                <button
                                    type="button"
                                    onClick={handleClearKey}
                                    className="px-3 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    title="Fjern nøkkel"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Har du ikke nøkkel?{' '}
                            <a
                                href={providerInfo.keyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-blue hover:underline font-medium"
                            >
                                Hent API-nøkkel hos {providerInfo.label} →
                            </a>
                        </p>
                    </section>

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <p className="font-semibold text-blue-900 text-sm">🔑 Slik fungerer det (BYOK – bruk din egen nøkkel):</p>
                        <ul className="text-blue-800 text-sm space-y-1 list-disc pl-5">
                            <li>Nøkkelen lagres <strong>kun i din egen nettleser</strong> (localStorage) og sendes aldri til appens server.</li>
                            <li>Forespørsler går direkte fra nettleseren din til {providerInfo.label}.</li>
                            <li>Du betaler selv for bruken via din konto hos leverandøren. Hver generering koster typisk under én krone.</li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800 text-sm">
                            ⚠️ Husk: Anonymiser alltid elevdata før du genererer. Innholdet du legger inn sendes til {providerInfo.label}.
                        </p>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        Avbryt
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue/90 transition-colors font-semibold"
                    >
                        {saved ? '✓ Lagret!' : 'Lagre'}
                    </button>
                </div>
            </div>
        </div>
    );
};
