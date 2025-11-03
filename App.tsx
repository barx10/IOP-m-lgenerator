import React, { useState, useMemo, useEffect } from 'react';
import type { StudentProfile, Framework, IopGoal, AppStatus } from './types';
import { generateIopGoals } from './services/geminiService';
import { hardcodedDocuments } from './services/hardcodedDocuments';
import { curriculumSubjects } from './services/curriculumData';
import { Card } from './components/Card';
import { DocumentIcon } from './components/icons/DocumentIcon';
import { TextAreaField } from './components/TextAreaField';
import { CompetenceGoalSelector } from './components/CompetenceGoalSelector';

const InputField: React.FC<{ id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }> = ({ id, label, value, onChange, type = 'text' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} id={id} name={id} value={value} onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
    </div>
);

const App: React.FC = () => {
    const [profile, setProfile] = useState<StudentProfile>({ grade: '', subject: '', topic: '', previousTopics: '' });
    const [framework, setFramework] = useState<Framework>({ startDate: '', endDate: '' });
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [goals, setGoals] = useState<IopGoal[]>([]);
    const [status, setStatus] = useState<AppStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'subject') {
            setSelectedGoals([]); // Nullstill valgte mål når faget endres
        }

        setProfile({ ...profile, [name]: value });
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
        setGoals([]);

        try {
            const result = await generateIopGoals(profile, framework, selectedGoals, hardcodedDocuments);
            setGoals(result);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'En ukjent feil oppstod.');
        }
    };
    
    useEffect(() => {
        setGoals([]);
        setStatus('idle');
    }, [profile, framework, selectedGoals]);


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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-8">
                           <Card title="Tema">
                                <InputField id="grade" label="Trinn (f.eks. '2' eller '4')" value={profile.grade} onChange={handleProfileChange} />
                                 <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Fag</label>
                                    <select
                                      id="subject"
                                      name="subject"
                                      value={profile.subject}
                                      onChange={handleProfileChange}
                                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
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
                                <TextAreaField id="previousTopics" label="Tidligere temaer (valgfritt, for å sjekke overlapp)" value={profile.previousTopics} onChange={(e) => setProfile({...profile, previousTopics: e.target.value})} />
                            </Card>
                             <Card title="Rammer">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField id="startDate" label="Fra-dato" value={framework.startDate} onChange={handleFrameworkChange} type="date" />
                                    <InputField id="endDate" label="Til-dato" value={framework.endDate} onChange={handleFrameworkChange} type="date" />
                                </div>
                            </Card>
                            
                            <CompetenceGoalSelector
                                selectedSubject={profile.subject}
                                selectedGoals={selectedGoals}
                                setSelectedGoals={setSelectedGoals}
                            />

                        </div>
                        <div className="lg:sticky top-24 self-start">
                             <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 sticky top-24">
                                <h2 className="text-lg font-semibold text-gray-800">Generer mål</h2>
                                <p className="text-sm text-gray-600 mt-2">Når all informasjon er fylt ut og minst ett kompetansemål er valgt, kan du generere et utkast.</p>
                                <button
                                    type="submit"
                                    disabled={!isFormValid || status === 'loading'}
                                    className="mt-6 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyserer og genererer...
                                        </>
                                    ) : 'Generer IOP-mål'}
                                </button>
                                {status === 'error' && error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                             </div>
                             
                             {status === 'success' && goals.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Genererte mål</h2>
                                    <div className="space-y-4">
                                        {goals.map((goal, index) => (
                                            <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200/80">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${
                                                    goal.coreArea === 'Ferdigheter' ? 'bg-blue-100 text-blue-800' :
                                                    goal.coreArea === 'Kunnskap' ? 'bg-green-100 text-green-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>{goal.coreArea}</span>
                                                {goal.coreArea === 'Samlet utbytte' ? (
                                                    <>
                                                        <h3 className="font-semibold text-gray-800">Individuelle læringsmål:</h3>
                                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.goal}</p>
                                                        <h3 className="font-semibold text-gray-800">Vurdering:</h3>
                                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.measures}</p>
                                                        {goal.evaluation && (
                                                            <>
                                                                <h3 className="font-semibold text-gray-800">Evaluering av utvikling sett opp mot mål i perioden:</h3>
                                                                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.evaluation}</p>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="font-semibold text-gray-800">Mål:</h3>
                                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.goal}</p>
                                                        <h3 className="font-semibold text-gray-800">Tiltak:</h3>
                                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{goal.measures}</p>
                                                    </>
                                                )}
                                                <h3 className="font-semibold text-gray-800">Forankring:</h3>
                                                <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{goal.anchoring}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default App;