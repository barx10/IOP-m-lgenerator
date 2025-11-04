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

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
    jspdf: {
      jsPDF: new (options?: any) => any;
    };
  }
}

const difficultyLabels = ['Enkelt', 'Middels', 'Utfordrende'];

const initialProfile: StudentProfile = {
  grade: '',
  subject: '',
  topic: '',
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
    const [pastedGoals, setPastedGoals] = useState<string>('');
    const [expertAssessment, setExpertAssessment] = useState<string>('');
    const [showCoreElementsModal, setShowCoreElementsModal] = useState(false);

    const [status, setStatus] = useState<AppStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [iopResult, setIopResult] = useState<IopConstructionKit | null>(null);
    const [selections, setSelections] = useState<Selections>({ skills: null, knowledge: null });
    const [isDownloading, setIsDownloading] = useState(false);

    const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
    
        if (name === 'subject') {
            // When subject changes, reset related state separately for robustness.
            setPastedGoals('');
            setProfile(prev => ({
                ...prev,
                subject: value,
                selectedCoreElements: [],
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value,
            }));
        }
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
        return profile.grade !== '' && profile.subject !== '' && profile.topic.trim() !== '' && pastedGoals.trim() !== '';
    }, [profile.grade, profile.subject, profile.topic, pastedGoals]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setStatus('loading');
        setError(null);
        setIopResult(null);
        setSelections({ skills: null, knowledge: null });
        try {
            const goalsArray = pastedGoals.split('\n').filter(g => g.trim() !== '');
            const result = await generateIopGoals(
                profile,
                framework,
                goalsArray,
                hardcodedDocuments,
                expertAssessment
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
        setPastedGoals('');
        setExpertAssessment('');
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

    const handleDownloadPdf = async () => {
      if (!iopResult || !selections.skills || !selections.knowledge) return;
  
      if (!window.html2canvas || !window.jspdf) {
          setError("PDF-bibliotekene kunne ikke lastes. Prøv å laste siden på nytt.");
          console.error("html2canvas or jspdf not found on window object");
          return;
      }
  
      setIsDownloading(true);
      setError(null);
      const reportElement = document.getElementById('printable-report-area');
      if (!reportElement) {
          setError("Rapportelementet ble ikke funnet.");
          setIsDownloading(false);
          return;
      }
  
      // The printable area is styled with `hidden print:block`. We need to make it visible for capture.
      reportElement.classList.remove('hidden');
  
      try {
          const canvas = await window.html2canvas(reportElement, {
              scale: 2, // for better resolution
              useCORS: true,
              logging: false,
              windowWidth: reportElement.scrollWidth,
              windowHeight: reportElement.scrollHeight
          });
          
          const imgData = canvas.toDataURL('image/png');
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
          });
  
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = imgWidth / imgHeight;
          
          let imgHeightOnPdf = pdfWidth / ratio;
          let heightLeft = imgHeightOnPdf;
          let position = 0;
  
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
          heightLeft -= pdfHeight;
  
          while (heightLeft > 0) {
              position -= pdfHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
              heightLeft -= pdfHeight;
          }
          
          pdf.save('IOP-plan.pdf');
  
      } catch (e) {
          console.error("Error generating PDF:", e);
          setError("En feil oppstod under generering av PDF-filen.");
      } finally {
          reportElement.classList.add('hidden');
          setIsDownloading(false);
      }
  };
    
    const renderIopResult = () => {
        if (!iopResult) return null;
    
        const { coreElementsInfluenceNote, skillsSuggestions, knowledgeSuggestions, overallBenefitSuggestion } = iopResult;
        const isPrintable = !!(selections.skills && selections.knowledge);
    
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <button onClick={handleReset} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        <ArrowLeftIcon className="mr-2" />
                        Start på nytt
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">Resultater</h1>
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={!isPrintable || isDownloading}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={!isPrintable ? "Velg et mål for både ferdigheter og kunnskap for å laste ned" : "Last ned / Skriv ut"}
                    >
                         {isDownloading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Laster ned...
                            </>
                        ) : (
                            <>
                                <DownloadIcon className="mr-2" />
                                Last ned / Skriv ut
                            </>
                        )}
                    </button>
                </div>
                {status === 'error' && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

                <Card title="Sammendrag og notater" icon={<DocumentIcon />}>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Hvordan kjerneelementene påvirker målene</h3>
                            <p className="text-gray-700 mt-1 text-base leading-relaxed">{coreElementsInfluenceNote}</p>
                        </div>
                    </div>
                </Card>

                <Card title="Velg mål for ferdigheter" icon={<CheckCircleIcon />}>
                    <div className="space-y-4">
                        {skillsSuggestions?.map((suggestion, index) => (
                            <div key={index} className={`p-4 rounded-lg border cursor-pointer transition-all ${selections.skills?.goal === suggestion.goal ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`} onClick={() => handleSelectionChange('skills', suggestion)}>
                                <div className="flex justify-between items-start gap-4">
                                    <p className="font-medium text-gray-800 flex-grow text-base">{suggestion.goal}</p>
                                    {difficultyLabels[index] && (
                                         <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">{difficultyLabels[index]}</span>
                                    )}
                                </div>
                                {selections.skills?.goal === suggestion.goal && (
                                    <div className="mt-4 text-base text-gray-700 space-y-3 leading-relaxed">
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
                        {knowledgeSuggestions?.map((suggestion, index) => (
                            <div key={index} className={`p-4 rounded-lg border cursor-pointer transition-all ${selections.knowledge?.goal === suggestion.goal ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`} onClick={() => handleSelectionChange('knowledge', suggestion)}>
                                <div className="flex justify-between items-start gap-4">
                                    <p className="font-medium text-gray-800 flex-grow text-base">{suggestion.goal}</p>
                                    {difficultyLabels[index] && (
                                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">{difficultyLabels[index]}</span>
                                    )}
                                </div>
                                {selections.knowledge?.goal === suggestion.goal && (
                                    <div className="mt-4 text-base text-gray-700 space-y-3 leading-relaxed">
                                        <p><span className="font-semibold">Tiltak:</span> {suggestion.measures}</p>
                                        <p><span className="font-semibold">Forankring:</span> {suggestion.anchoring}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Samlet vurdering" icon={<DocumentIcon />}>
                    {overallBenefitSuggestion ? (
                         <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Individuelle læringsmål</h4>
                                <p className="mt-1 text-base text-gray-800 leading-relaxed">{overallBenefitSuggestion.goal}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Vurdering (hvordan eleven viser kompetanse)</h4>
                                <p className="mt-1 text-base text-gray-800 leading-relaxed">{overallBenefitSuggestion.measures}</p>
                            </div>
                            {overallBenefitSuggestion.evaluation && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Evaluering av utvikling</h4>
                                    <p className="mt-1 text-base text-gray-800 leading-relaxed">{overallBenefitSuggestion.evaluation}</p>
                                </div>
                            )}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Forankring</h4>
                                <p className="mt-1 text-base text-gray-800 leading-relaxed">{overallBenefitSuggestion.anchoring}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Forslag til samlet vurdering kunne ikke genereres.</p>
                    )}
                </Card>

                <div id="printable-report-area" className="hidden">
                    {isPrintable && (
                        <div className="pt-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-gray-900">Ferdigstilt plan</h2>
                                <p className="mt-2 text-lg text-gray-500">Klar for utskrift</p>
                            </div>
                            <div className="mt-8 p-8 sm:p-12 bg-white rounded-lg shadow-lg border border-gray-200">
                                <div className="space-y-10">
                                    <div className="text-center border-b pb-6">
                                        <h2 className="text-3xl font-bold text-gray-900">Individuell Opplæringsplan</h2>
                                        <p className="mt-2 text-lg text-gray-600">Forslag for {profile.subject}</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Elevprofil</h3>
                                            <p className="mt-2 text-base text-gray-800 leading-relaxed">
                                                <span className="font-semibold">Fag:</span> {profile.subject}<br/>
                                                <span className="font-semibold">Trinn:</span> {profile.grade}. trinn<br/>
                                                <span className="font-semibold">Tema:</span> {profile.topic}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tidsramme</h3>
                                            <p className="mt-2 text-base text-gray-800 leading-relaxed">
                                            {new Date(framework.startDate).toLocaleDateString('nb-NO')} – {new Date(framework.endDate).toLocaleDateString('nb-NO')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Notater</h3>
                                        <div className="mt-4 space-y-4 text-base text-gray-700 leading-relaxed">
                                            <div>
                                                <h4 className="font-semibold">Hvordan kjerneelementene påvirker målene</h4>
                                                <p>{coreElementsInfluenceNote}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Valgte Mål</h3>
                                        <div className="space-y-6">
                                            {selections.skills && (
                                                <div className="p-4 bg-gray-50 rounded-md">
                                                    <h4 className="text-lg font-semibold text-brand-blue">Ferdigheter</h4>
                                                    <div className="mt-2 space-y-2 text-base text-gray-700 leading-relaxed">
                                                        <p><span className="font-semibold">Mål:</span> {selections.skills.goal}</p>
                                                        <p><span className="font-semibold">Tiltak:</span> {selections.skills.measures}</p>
                                                        <p><span className="font-semibold">Forankring:</span> {selections.skills.anchoring}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selections.knowledge && (
                                                <div className="p-4 bg-gray-50 rounded-md">
                                                    <h4 className="text-lg font-semibold text-brand-blue">Kunnskap</h4>
                                                    <div className="mt-2 space-y-2 text-base text-gray-700 leading-relaxed">
                                                        <p><span className="font-semibold">Mål:</span> {selections.knowledge.goal}</p>
                                                        <p><span className="font-semibold">Tiltak:</span> {selections.knowledge.measures}</p>
                                                        <p><span className="font-semibold">Forankring:</span> {selections.knowledge.anchoring}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {overallBenefitSuggestion && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Samlet vurdering</h3>
                                            <div className="space-y-3 text-base text-gray-700 leading-relaxed">
                                                <p><span className="font-semibold">Individuelle læringsmål:</span> {overallBenefitSuggestion.goal}</p>
                                                <p><span className="font-semibold">Vurdering (hvordan eleven viser kompetanse):</span> {overallBenefitSuggestion.measures}</p>
                                                {overallBenefitSuggestion.evaluation && <p><span className="font-semibold">Evaluering av utvikling:</span> {overallBenefitSuggestion.evaluation}</p>}
                                                <p><span className="font-semibold">Forankring:</span> {overallBenefitSuggestion.anchoring}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
                             </div>
                        </Card>

                        <Card title="Tilråding om tiltak" icon={<DocumentIcon />}>
                            <TextAreaField
                                id="expertAssessment"
                                label="Lim inn relevant tekst fra sakkyndig vurdering her"
                                value={expertAssessment}
                                onChange={(e) => setExpertAssessment(e.target.value)}
                                placeholder="F.eks. 'Eleven har behov for utstrakt bruk av visuell støtte og struktur i alle fag...'"
                                rows={4}
                            />
                        </Card>

                        {/* Framework */}
                        <Card title="Tidsramme" icon={<CalendarIcon />}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Startdato</label>
                                    <div className="relative mt-1">
                                        <input type="date" name="startDate" id="startDate" value={framework.startDate} onChange={handleFrameworkChange} className="focus:ring-brand-blue focus:border-brand-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2 pr-10"/>
                                        <label htmlFor="startDate" className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3">
                                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Sluttdato</label>
                                     <div className="relative mt-1">
                                        <input type="date" name="endDate" id="endDate" value={framework.endDate} onChange={handleFrameworkChange} className="focus:ring-brand-blue focus:border-brand-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2 pr-10"/>
                                        <label htmlFor="endDate" className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3">
                                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                                        </label>
                                    </div>
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
                            pastedGoals={pastedGoals}
                            setPastedGoals={setPastedGoals}
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