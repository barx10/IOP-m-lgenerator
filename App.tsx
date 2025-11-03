import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { StudentProfile, Framework, IopConstructionKit, AppStatus, IopGoal } from './types';
import { generateIopGoals } from './services/geminiService';
import { hardcodedDocuments } from './services/hardcodedDocuments';
import { curriculumSubjects, curriculumData } from './services/curriculumData';
import { Card } from './components/Card';
import { DocumentIcon } from './components/icons/DocumentIcon';
import { TextAreaField } from './components/TextAreaField';
import { CompetenceGoalSelector } from './components/CompetenceGoalSelector';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { ArrowLeftIcon } from './components/icons/ArrowLeftIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { CoreElementsModal } from './components/CoreElementsModal';

declare const html2canvas: any;
declare const jspdf: any;

const InputField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}> = ({ id, label, value, onChange, type = 'text' }) => {

    if (type === 'date') {
        return (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    {/* Visual representation */}
                    <div className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 sm:text-sm flex justify-between items-center h-[38px]">
                        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || 'yyyy-mm-dd'}</span>
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Invisible but functional input */}
                    <input
                        type="date"
                        id={id}
                        name={id}
                        value={value}
                        onChange={onChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label={label}
                    />
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1">
                 <input
                    type={type}
                    id={id}
                    name={id}
                    value={value}
                    onChange={onChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm focus:ring-brand-blue focus:border-brand-blue"
                />
            </div>
        </div>
    );
};


type Selections = {
    skills: IopGoal | null;
    knowledge: IopGoal | null;
};

const GoalCard: React.FC<{ goal: IopGoal }> = ({ goal }) => (
    <>
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${
            goal.coreArea === 'Ferdigheter' ? 'bg-blue-100 text-blue-800' :
            goal.coreArea === 'Kunnskap' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
        }`}>{goal.coreArea}</span>
        {goal.coreArea === 'Samlet vurdering' ? (
            <>
                <h4 className="font-semibold text-gray-800">Individuelle læringsmål:</h4>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.goal}</p>
                <h4 className="font-semibold text-gray-800">Vurdering:</h4>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.measures}</p>
                {goal.evaluation && (
                    <>
                        <h4 className="font-semibold text-gray-800">Evaluering av utvikling sett opp mot mål i perioden:</h4>
                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.evaluation}</p>
                    </>
                )}
            </>
        ) : (
            <>
                <h4 className="font-semibold text-gray-800">Mål:</h4>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.goal}</p>
                <h4 className="font-semibold text-gray-800">Tiltak:</h4>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.measures}</p>
            </>
        )}
        <h4 className="font-semibold text-gray-800">Forankring:</h4>
        <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{goal.anchoring}</p>
    </>
);


const App: React.FC = () => {
    const [profile, setProfile] = useState<StudentProfile>({ grade: '', subject: '', topic: '', previousTopics: '', selectedCoreElements: [] });
    const [framework, setFramework] = useState<Framework>({ startDate: '', endDate: '' });
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [constructionKit, setConstructionKit] = useState<IopConstructionKit | null>(null);
    const [selections, setSelections] = useState<Selections>({ skills: null, knowledge: null });
    const [status, setStatus] = useState<AppStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isSpecialEducation, setIsSpecialEducation] = useState<boolean>(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showCoreElements, setShowCoreElements] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'subject') {
            setSelectedGoals([]); // Nullstill valgte mål når faget endres
            setProfile(p => ({ ...p, [name]: value, selectedCoreElements: [] }));
        } else {
            setProfile({ ...profile, [name]: value });
        }
    };
    
    const handleToggleCoreElement = (element: string) => {
        setProfile(p => {
            const currentElements = p.selectedCoreElements;
            if (currentElements.includes(element)) {
                return { ...p, selectedCoreElements: currentElements.filter(el => el !== element) };
            } else {
                return { ...p, selectedCoreElements: [...currentElements, element] };
            }
        });
    };

    const handleFrameworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFramework({ ...framework, [e.target.name]: e.target.value });
    };

    const isFormValid = useMemo(() => {
        return (
            profile.grade && profile.subject && profile.topic &&
            framework.startDate && framework.endDate &&
            selectedGoals.length > 0
        );
    }, [profile, framework, selectedGoals]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            setError("Vennligst fyll ut alle obligatoriske felt og velg minst ett kompetansemål.");
            return;
        }
        setStatus('loading');
        setError(null);
        setConstructionKit(null);
        setSelections({ skills: null, knowledge: null });

        try {
            const result = await generateIopGoals(profile, framework, selectedGoals, hardcodedDocuments, isSpecialEducation);
            setConstructionKit(result);
            // Pre-select the first option for each category
            setSelections({
                skills: (result.skillsSuggestions || [])[0] || null,
                knowledge: (result.knowledgeSuggestions || [])[0] || null,
            });
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'En ukjent feil oppstod.');
        }
    };
    
    const handleGoBack = () => {
        setStatus('idle');
        setConstructionKit(null);
        setError(null);
        setSelections({ skills: null, knowledge: null });
    };

    const handleDownloadPdf = () => {
        const input = summaryRef.current;
        if (!input) {
            console.error("Summary element not found");
            return;
        }
        setIsDownloading(true);

        html2canvas(input, { scale: 2, useCORS: true, logging: false })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = jspdf;
                const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;

                let imgWidth = pdfWidth - 20; // with margin
                let imgHeight = imgWidth / ratio;

                if (imgHeight > pdfHeight - 20) {
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * ratio;
                }

                const x = (pdfWidth - imgWidth) / 2;
                const y = 10; // top margin

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                pdf.save(`IOP-utkast-${profile.topic || 'plan'}.pdf`);
            })
            .finally(() => {
                setIsDownloading(false);
            });
    };

    useEffect(() => {
        setConstructionKit(null);
        setStatus('idle');
    }, [profile, framework, selectedGoals]);

    const isSummaryComplete = useMemo(() => {
        return selections.skills && selections.knowledge && constructionKit?.continuityNote && constructionKit?.overallBenefitSuggestion && constructionKit?.coreElementsInfluenceNote;
    }, [selections, constructionKit]);

    return (
        <div className="min-h-screen bg-brand-gray text-gray-900">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-3">
                    <div className="p-2 bg-brand-lightblue rounded-lg">
                        <DocumentIcon className="w-6 h-6 text-brand-blue"/>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">IOP Målgenerator</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <form onSubmit={handleSubmit}>
                    {status === 'success' && (
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                            >
                                <ArrowLeftIcon />
                                <span>Tilbake til skjema</span>
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-8">
                           <Card title="Tema">
                                <InputField id="grade" label="Trinn" value={profile.grade} onChange={handleProfileChange} />
                                 <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Fag</label>
                                    <select
                                      id="subject"
                                      name="subject"
                                      value={profile.subject}
                                      onChange={handleProfileChange}
                                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
                                    >
                                      <option value="" disabled>Velg et fag...</option>
                                      {curriculumSubjects.map((subject) => (
                                        <option key={subject} value={subject}>
                                          {subject}
                                        </option>
                                      ))}
                                    </select>
                                </div>
                                <InputField id="topic" label="Tema" value={profile.topic} onChange={handleProfileChange} />
                                <TextAreaField id="previousTopics" label="Tidligere temaer (valgfritt, for å skape kontinuitet)" value={profile.previousTopics} onChange={(e) => setProfile({...profile, previousTopics: e.target.value})} />
                            </Card>
                             <Card title="Rammer">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField id="startDate" label="Fra-dato" value={framework.startDate} onChange={handleFrameworkChange} type="date" />
                                    <InputField id="endDate" label="Til-dato" value={framework.endDate} onChange={handleFrameworkChange} type="date" />
                                </div>
                            </Card>
                            
                            <div className="-mt-6">
                               <button
                                   type="button"
                                   onClick={() => setShowCoreElements(true)}
                                   disabled={!profile.subject}
                                   className="w-full inline-flex justify-center items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                               >
                                   <BookOpenIcon />
                                   <span>
                                        Vis kjerneelementer 
                                        {profile.selectedCoreElements.length > 0 && ` (${profile.selectedCoreElements.length} valgt)`}
                                    </span>
                               </button>
                           </div>

                            <CompetenceGoalSelector
                                selectedSubject={profile.subject}
                                selectedGoals={selectedGoals}
                                setSelectedGoals={setSelectedGoals}
                            />

                        </div>
                        <div className="lg:sticky top-24 self-start space-y-8">
                             <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
                                <h2 className="text-lg font-semibold text-gray-800">Generer forslag</h2>
                                <p className="text-sm text-gray-600 mt-2 mb-4">Når all informasjon er fylt ut og minst ett kompetansemål er valgt, kan du generere et utkast med byggeklosser.</p>
                                
                                <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                                     <span className="text-sm font-medium text-gray-700">
                                        Tilpass for spesialundervisning
                                     </span>
                                     <button
                                        type="button"
                                        onClick={() => setIsSpecialEducation(!isSpecialEducation)}
                                        className={`${isSpecialEducation ? 'bg-brand-blue' : 'bg-gray-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2`}
                                        role="switch"
                                        aria-checked={isSpecialEducation}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`${isSpecialEducation ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                        />
                                    </button>
                                </div>


                                <button
                                    type="submit"
                                    disabled={!isFormValid || status === 'loading'}
                                    className="mt-6 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyserer og genererer...
                                        </>
                                    ) : 'Generer forslag'}
                                </button>
                                {status === 'error' && error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                             </div>
                             
                            {status === 'success' && constructionKit && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-800">Forslag til IOP</h2>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-6">Velg ett ferdighetsmål og ett kunnskapsmål. Sammendraget nederst oppdateres automatisk.</p>
                                    <div className="space-y-8">
                                        
                                        <Card title="Bro til tidligere temaer">
                                           <p className="text-sm text-gray-800 whitespace-pre-wrap">{constructionKit.continuityNote}</p>
                                        </Card>
                                        
                                        {constructionKit.coreElementsInfluenceNote && (
                                            <Card title="Påvirkning av kjerneelementer på mål">
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{constructionKit.coreElementsInfluenceNote}</p>
                                            </Card>
                                        )}

                                        <Card title="Velg ferdighetsmål">
                                             <div className="space-y-2">
                                                {(constructionKit.skillsSuggestions || []).map((goal, index) => (
                                                    goal && (
                                                        <div key={index} onClick={() => setSelections(s => ({...s, skills: goal}))} className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selections.skills?.goal === goal.goal ? 'border-brand-blue bg-brand-lightblue/50' : 'border-gray-200 hover:border-gray-400'}`}>
                                                            <p className="font-medium text-sm text-gray-800">{goal.goal}</p>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </Card>

                                        <Card title="Velg kunnskapsmål">
                                             <div className="space-y-2">
                                                {(constructionKit.knowledgeSuggestions || []).map((goal, index) => (
                                                    goal && (
                                                        <div key={index} onClick={() => setSelections(s => ({...s, knowledge: goal}))} className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selections.knowledge?.goal === goal.goal ? 'border-brand-blue bg-brand-lightblue/50' : 'border-gray-200 hover:border-gray-400'}`}>
                                                            <p className="font-medium text-sm text-gray-800">{goal.goal}</p>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </Card>

                                        {isSummaryComplete && (
                                            <div ref={summaryRef} className="bg-white rounded-xl shadow-sm border border-green-300">
                                                <div className="p-6">
                                                    <div className="flex items-center justify-between space-x-3 mb-4 pb-4 border-b border-gray-200">
                                                        <div className="flex items-center space-x-3">
                                                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                                            <h3 className="text-xl font-semibold text-gray-800">
                                                                Ferdig sammendrag
                                                            </h3>
                                                        </div>
                                                         <button
                                                            onClick={handleDownloadPdf}
                                                            disabled={isDownloading}
                                                            className="flex items-center space-x-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                                                        >
                                                            {isDownloading ? 'Lager PDF...' : (
                                                                <>
                                                                    <DownloadIcon />
                                                                    <span>Last ned PDF</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Bro til tidligere temaer:</h4>
                                                            <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{constructionKit.continuityNote}</p>
                                                        </div>
                                                        {constructionKit.coreElementsInfluenceNote && (
                                                            <div>
                                                                <h4 className="font-semibold text-sm text-gray-700 mb-1">Påvirkning av kjerneelementer på mål:</h4>
                                                                <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{constructionKit.coreElementsInfluenceNote}</p>
                                                            </div>
                                                        )}
                                                        {selections.skills && <div className="bg-brand-lightblue/40 p-4 rounded-lg"><GoalCard goal={selections.skills} /></div>}
                                                        {selections.knowledge && <div className="bg-brand-lightblue/40 p-4 rounded-lg"><GoalCard goal={selections.knowledge} /></div>}
                                                        {constructionKit.overallBenefitSuggestion && <div className="bg-brand-lightblue/40 p-4 rounded-lg"><GoalCard goal={constructionKit.overallBenefitSuggestion} /></div>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </main>
            {showCoreElements && profile.subject && curriculumData[profile.subject] && (
                <CoreElementsModal
                    subject={profile.subject}
                    coreElements={curriculumData[profile.subject].coreElements}
                    selectedCoreElements={profile.selectedCoreElements}
                    onToggleCoreElement={handleToggleCoreElement}
                    onClose={() => setShowCoreElements(false)}
                />
            )}
        </div>
    );
};

export default App;