import React, { useState, useCallback, useMemo } from 'react';
import {
  StudentProfile,
  Framework,
  IopConstructionKit,
  Selections,
  AppStatus,
  IopGoal
} from './types';
import { generateIopGoals } from './services/geminiService';
import { hardcodedDocuments } from './services/hardcodedDocuments';
import { curriculumData, curriculumSubjects } from './services/curriculumData';

import { Card } from './components/Card';
import { CompetenceGoalSelector } from './components/CompetenceGoalSelector';
import { TextAreaField } from './components/TextAreaField';
import { CoreElementsModal } from './components/CoreElementsModal';

import { DocumentIcon } from './components/icons/DocumentIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { ArrowLeftIcon } from './components/icons/ArrowLeftIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

const difficultyLabels = ['Enkelt', 'Middels', 'Utfordrende'];

const initialProfile: StudentProfile = {
  grade: '',
  subject: '',
  topic: '',
  previousTopics: '',
  selectedCoreElements: [],
};

const initialFramework: Framework = {
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
};

const App: React.FC = () => {
    // State management
    const [profile, setProfile] = useState<StudentProfile>(initialProfile);
    const [framework, setFramework] = useState<Framework>(initialFramework);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [isSpecialEducation, setIsSpecialEducation] = useState<boolean>(true);
    const [showCoreElementsModal, setShowCoreElementsModal] = useState(false);

    const [status, setStatus] = useState<AppStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [iopResult, setIopResult] = useState<IopConstructionKit | null>(null);
    const [selections, setSelections] = useState<Selections>({ skills: null, knowledge: null });

    const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => {
            const newProfile = { ...prev, [name]: value };
            if (name === 'subject') {
                newProfile.selectedCoreElements = [];
                setSelectedGoals([]);
            }
            return newProfile;
        });
    }, []);

    const handleFrameworkChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFramework(prev => ({ ...prev, [name]: value }));
    }, []);
    
    const handleToggleCoreElement = useCallback((element: string) => {
        setProfile(prev => {
            const selected = prev.selectedCoreElements;
            const newSelected = selected.includes(element)
                ? selected.filter(el => el !== element)
                : [...selected, element];
            return { ...prev, selectedCoreElements: newSelected };
        });
    }, []);

    const isFormValid = useMemo(() => {
        return profile.grade !== '' && profile.subject !== '' && profile.topic.trim() !== '' && selectedGoals.length > 0;
    }, [profile.grade, profile.subject, profile.topic, selectedGoals]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setStatus('loading');
        setError(null);
        setIopResult(null);
        setSelections({ skills: null, knowledge: null });
        try {
            const result = await generateIopGoals(
                profile,
                framework,
                selectedGoals,
                hardcodedDocuments,
                isSpecialEducation
            );
            setIopResult(result);
            setStatus('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setStatus('error');
        }
    };
    
    const handleReset = () => {
        setProfile(initialProfile);
        setFramework(initialFramework);
        setSelectedGoals([]);
        setIsSpecialEducation(true);
        setStatus('idle');
        setError(null);
        setIopResult(null);
        setSelections({ skills: null, knowledge: null });
    };

    const handleSelectionChange = (type: 'skills' | 'knowledge', goal: IopGoal) => {
        setSelections(prev => ({
            ...prev,
            [type]: prev[type]?.goal === goal.goal ? null : goal
        }));
    };
    
    const renderIopResult = () => {
        if (!iopResult) return null;
    
        const { continuityNote, coreElementsInfluenceNote, skillsSuggestions, knowledgeSuggestions, overallBenefitSuggestion } = iopResult;
    
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <button onClick={handleReset} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        <ArrowLeftIcon className="mr-2" />
                        Start på nytt
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">Resultater</h1>
                    <button onClick={() => window.print()} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        <DownloadIcon className="mr-2" />
                        Last ned / Skriv ut
                    </button>
                </div>

                <Card title="Sammendrag og notater" icon={<DocumentIcon />}>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Bro til tidligere temaer</h3>
                            <p className="text-gray-600 mt-1">{continuityNote}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Hvordan kjerneelementene påvirker målene</h3>
                            <p className="text-gray-600 mt-1">{coreElementsInfluenceNote}</p>
                        </div>
                    </div>
                </Card>

                <Card title="Velg mål for ferdigheter" icon={<CheckCircleIcon />}>
                    <div className="space-y-4">
                        {skillsSuggestions.map((suggestion, index) => (
                            <div key={index} className={`p-4 rounded-lg border cursor-pointer transition-all ${selections.skills?.goal === suggestion.goal ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`} onClick={() => handleSelectionChange('skills', suggestion)}>
                                <div className="flex justify-between items-start gap-4">
                                    <p className="font-medium text-gray-800 flex-grow">{suggestion.goal}</p>
                                    {difficultyLabels[index] && (
                                         <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">{difficultyLabels[index]}</span>
                                    )}
                                </div>
                                {selections.skills?.goal === suggestion.goal && (
                                    <div className="mt-3 text-sm text-gray-600 space-y-2">
                                        <p><span className="font-semibold">Tiltak:</span> {suggestion.measures}</p>
                                        <p><span className="font-semibold">Forankring:</span> {suggestion.anchoring}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Velg mål for kunnskap" icon={<CheckCircleIcon />}>
                     <div className="space-y-4">
                        {knowledgeSuggestions.map((suggestion, index) => (
                            <div key={index} className={`p-4 rounded-lg border cursor-pointer transition-all ${selections.knowledge?.goal === suggestion.goal ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`} onClick={() => handleSelectionChange('knowledge', suggestion)}>
                                <div className="flex justify-between items-start gap-4">
                                    <p className="font-medium text-gray-800 flex-grow">{suggestion.goal}</p>
                                    {difficultyLabels[index] && (
                                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">{difficultyLabels[index]}</span>
                                    )}
                                </div>
                                {selections.knowledge?.goal === suggestion.goal && (
                                    <div className="mt-3 text-sm text-gray-600 space-y-2">
                                        <p><span className="font-semibold">Tiltak:</span> {suggestion.measures}</p>
                                        <p><span className="font-semibold">Forankring:</span> {suggestion.anchoring}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Samlet vurdering" icon={<DocumentIcon />}>
                    <div className="space-y-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Individuelle læringsmål:</span> {overallBenefitSuggestion.goal}</p>
                        <p><span className="font-semibold">Vurdering (hvordan eleven viser kompetanse):</span> {overallBenefitSuggestion.measures}</p>
                        {overallBenefitSuggestion.evaluation && <p><span className="font-semibold">Evaluering av utvikling:</span> {overallBenefitSuggestion.evaluation}</p>}
                        <p><span className="font-semibold">Forankring:</span> {overallBenefitSuggestion.anchoring}</p>
                    </div>
                </Card>
            </div>
        );
    };

    if (status === 'success') {
        return <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">{renderIopResult()}</div>;
    }

    return (
        <>
            <div className="bg-brand-gray min-h-screen">
                <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">IOP Målbygger</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">Et verktøy for å generere forslag til individuelle opplæringsplaner.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Student profile and topic */}
                        <Card title="Tema" icon={<DocumentIcon />}>
                             <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Trinn</label>
                                    <select id="grade" name="grade" value={profile.grade} onChange={handleProfileChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md bg-white text-gray-900">
                                        <option value="" disabled>Velg trinn</option>
                                        {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}. trinn</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-3">
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Fag</label>
                                    <select id="subject" name="subject" value={profile.subject} onChange={handleProfileChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md bg-white text-gray-900">
                                        <option value="" disabled>Velg fag</option>
                                        {curriculumSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-6">
                                     <TextAreaField id="topic" label="Tema for perioden" value={profile.topic} onChange={handleProfileChange} placeholder="F.eks. 'Å skrive en fortelling' eller 'Fotosyntesen'" />
                                </div>
                                 <div className="sm:col-span-6">
                                     <TextAreaField id="previousTopics" label="Tidligere relevante temaer (valgfritt)" value={profile.previousTopics} onChange={handleProfileChange} placeholder="Nevn temaer som bygger opp mot dette, for kontekst." />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Målgruppe</label>
                                    <fieldset className="mt-2">
                                        <div className="space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-4">
                                            <div className="flex items-center">
                                                <input id="special-education" name="audience" type="radio" checked={isSpecialEducation} onChange={() => setIsSpecialEducation(true)} className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue" />
                                                <label htmlFor="special-education" className="ml-3 block text-sm font-medium text-gray-700">Elev i spesialundervisning</label>
                                            </div>
                                            <div className="flex items-center">
                                                <input id="regular-education" name="audience" type="radio" checked={!isSpecialEducation} onChange={() => setIsSpecialEducation(false)} className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue" />
                                                <label htmlFor="regular-education" className="ml-3 block text-sm font-medium text-gray-700">Ordinær elev</label>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                             </div>
                        </Card>

                        {/* Framework */}
                        <Card title="Tidsramme" icon={<CalendarIcon />}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Startdato</label>
                                    <input type="date" name="startDate" id="startDate" value={framework.startDate} onChange={handleFrameworkChange} className="mt-1 focus:ring-brand-blue focus:border-brand-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"/>
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Sluttdato</label>
                                    <input type="date" name="endDate" id="endDate" value={framework.endDate} onChange={handleFrameworkChange} className="mt-1 focus:ring-brand-blue focus:border-brand-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"/>
                                </div>
                            </div>
                        </Card>

                        {/* Core Elements */}
                        {profile.subject && curriculumData[profile.subject]?.coreElements.length > 0 && (
                             <Card title={`Kjerneelementer for ${profile.subject}`} icon={<BookOpenIcon />}>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Valgte kjerneelementer: {profile.selectedCoreElements.length > 0 ? profile.selectedCoreElements.join(', ') : 'Ingen valgt.'}
                                    </p>
                                    <button onClick={() => setShowCoreElementsModal(true)} className="text-sm font-medium text-brand-blue hover:text-brand-blue/80">
                                        Endre valgte kjerneelementer
                                    </button>
                                </div>
                            </Card>
                        )}

                        {/* Competence Goals */}
                        <CompetenceGoalSelector
                            selectedSubject={profile.subject}
                            selectedGoals={selectedGoals}
                            setSelectedGoals={setSelectedGoals}
                        />

                        {/* Submission */}
                        <div className="pt-5">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!isFormValid || status === 'loading'}
                                    className="w-full sm:w-auto inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? 'Genererer forslag...' : 'Generer forslag til IOP'}
                                </button>
                            </div>
                            {status === 'error' && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
                        </div>
                    </div>
                </main>
            </div>

            {showCoreElementsModal && profile.subject && curriculumData[profile.subject] && (
                <CoreElementsModal
                    subject={profile.subject}
                    coreElements={curriculumData[profile.subject].coreElements}
                    selectedCoreElements={profile.selectedCoreElements}
                    onToggleCoreElement={handleToggleCoreElement}
                    onClose={() => setShowCoreElementsModal(false)}
                />
            )}
        </>
    );
};

export default App;