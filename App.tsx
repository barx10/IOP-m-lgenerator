import React, { useState, useCallback, useMemo } from 'react';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';
import {
  StudentProfile,
  Framework,
  IopConstructionKit,
  Selections,
  SavedSubject,
  AppStatus,
  IopGoal
} from './types';
import { generateIopGoals } from './services/geminiService.backend';
import { curriculumData, curriculumSubjects, vgsSubjects } from './services/curriculumData';

import { Card } from './components/Card';
import { CompetenceGoalSelector } from './components/CompetenceGoalSelector';
import { TextAreaField } from './components/TextAreaField';
import { CoreElementsModal } from './components/CoreElementsModal';
import { AboutModal } from './components/AboutModal';
import { Footer } from './components/Footer';
import { SocialGoalsSelector } from './components/SocialGoalsSelector';
import { OtherNeedsSelector } from './components/OtherNeedsSelector';
import socialGoalsData from './data/socialGoals.json';
import otherNeedsData from './data/otherNeeds.json';
import { EditableField } from './components/EditableField';

import { DocumentIcon } from './components/icons/DocumentIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { ArrowLeftIcon } from './components/icons/ArrowLeftIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

declare global {
  interface Window {
    // Removed html2canvas and jspdf - using native print instead
  }
}

const difficultyLabels = ['Tilpasset', 'Utfordrende'];

const initialProfile: StudentProfile = {
  grade: '',
  subject: '',
  topic: '',
  selectedCoreElement: '',
  selectedCrossCurricularTheme: '',
  selectedSocialGoals: [],
  selectedOtherNeeds: [],
};

const initialFramework: Framework = {
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
};

const App: React.FC = () => {
    // State management
    const [profile, setProfile] = useState<StudentProfile>(initialProfile);
    const [framework, setFramework] = useState<Framework>(initialFramework);
    const [pastedGoals, setPastedGoals] = useState<string>('');
    const [expertAssessment, setExpertAssessment] = useState<string>('');
    const [showCoreElementsModal, setShowCoreElementsModal] = useState(false);
    const [showCrossCurricularModal, setShowCrossCurricularModal] = useState(false);

    const [status, setStatus] = useState<AppStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [iopResult, setIopResult] = useState<IopConstructionKit | null>(null);
    const [selections, setSelections] = useState<Selections>({ skills: null, knowledge: null });
    const [selectedIndices, setSelectedIndices] = useState<{ skills: number | null; knowledge: number | null }>({ skills: null, knowledge: null });
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [savedSubjects, setSavedSubjects] = useState<SavedSubject[]>([]);
    const [studentCode, setStudentCode] = useState<string>(''); // For student initials/code
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [editedSocialGoals, setEditedSocialGoals] = useState<Record<string, any>>({});
    const [editedOtherNeedsMeasures, setEditedOtherNeedsMeasures] = useState<Record<string, string[]>>({});
    const [editedLearningActivities, setEditedLearningActivities] = useState<string>('');
    const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null); // Track which subject is being edited

    // Get available subjects based on selected grade level
    const availableSubjects = useMemo(() => {
        if (!profile.grade) return curriculumSubjects;
        
        // For VGS levels, show both curriculum subjects and VGS-only subjects
        if (profile.grade.startsWith('Vg')) {
            // Combine and remove duplicates
            return [...new Set([...curriculumSubjects, ...vgsSubjects])].sort();
        }
        
        // For grunnskole, only show curriculum subjects
        return curriculumSubjects;
    }, [profile.grade]);

    const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
    
        if (name === 'subject') {
            // When subject changes, reset related state separately for robustness.
            setPastedGoals('');
            setProfile(prev => ({
                ...prev,
                subject: value,
                selectedCoreElement: '',
                selectedCrossCurricularTheme: '',
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
        setProfile(prev => ({
            ...prev,
            selectedCoreElement: prev.selectedCoreElement === element ? '' : element
        }));
    }, []);

    const handleToggleCrossCurricularTheme = useCallback((theme: string) => {
        setProfile(prev => ({
            ...prev,
            selectedCrossCurricularTheme: prev.selectedCrossCurricularTheme === theme ? '' : theme
        }));
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
        setLoadingProgress(0);
        
        // Smooth progress animation - continues to 98% then waits for completion
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 98) return prev;
                // Slower progress as we get closer to 98%
                const increment = Math.max(0.5, (98 - prev) / 20);
                return Math.min(prev + increment, 98);
            });
        }, 200);
        
        try {
            // Single goal - trim and wrap in array
            const goalsArray = [pastedGoals.trim()];
            
            // Generate IOP goals (streaming callback may not trigger incrementally due to JSON parsing)
            const result = await generateIopGoals(
                profile,
                framework,
                goalsArray,
                expertAssessment,
                (partial) => {
                    // Update UI when complete JSON is received
                    setIopResult(prev => ({ ...prev, ...partial } as IopConstructionKit));
                    
                    // Initialize editedSocialGoals with AI-generated descriptions if available
                    if (partial.socialGoalDescriptions && Object.keys(partial.socialGoalDescriptions).length > 0) {
                        setEditedSocialGoals(prev => {
                            const newGoals: Record<string, any> = { ...prev };
                            Object.entries(partial.socialGoalDescriptions).forEach(([goalId, data]: [string, any]) => {
                                if (!prev[goalId]) {
                                    newGoals[goalId] = {
                                        description: data.description,
                                        examples: JSON.stringify(data.examples)
                                    };
                                }
                            });
                            return newGoals;
                        });
                    }
                    
                    // Initialize editedOtherNeedsMeasures with AI-generated measures if available
                    if (partial.otherNeedsMeasures && Object.keys(partial.otherNeedsMeasures).length > 0) {
                        setEditedOtherNeedsMeasures(prev => ({
                            ...prev,
                            ...partial.otherNeedsMeasures
                        }));
                    }
                }
            );
            
            clearInterval(progressInterval);
            setLoadingProgress(100);
            setIopResult(result);
            
            // Initialize editedSocialGoals with AI-generated descriptions if available
            if (result.socialGoalDescriptions && Object.keys(result.socialGoalDescriptions).length > 0) {
                const newSocialGoals: Record<string, any> = {};
                Object.entries(result.socialGoalDescriptions).forEach(([goalId, data]: [string, any]) => {
                    newSocialGoals[goalId] = {
                        description: data.description,
                        examples: JSON.stringify(data.examples)
                    };
                });
                setEditedSocialGoals(newSocialGoals);
            }
            
            // Initialize editedOtherNeedsMeasures with AI-generated measures if available
            if (result.otherNeedsMeasures && Object.keys(result.otherNeedsMeasures).length > 0) {
                setEditedOtherNeedsMeasures(result.otherNeedsMeasures);
            }
            
            setStatus('success');
            
            // Scroll to top when results are shown
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            clearInterval(progressInterval);
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
        setSelectedIndices({ skills: null, knowledge: null });
        setLoadingProgress(0);
    };

    const handleSelectionChange = (type: 'skills' | 'knowledge', goal: IopGoal, index: number) => {
        const isSelected = selectedIndices[type] === index;
        setSelections(prev => ({
            ...prev,
            [type]: isSelected ? null : goal
        }));
        setSelectedIndices(prev => ({
            ...prev,
            [type]: isSelected ? null : index
        }));
    };

    // Update functions for editable fields
    const handleUpdateSelection = (type: 'skills' | 'knowledge', field: keyof IopGoal, value: string) => {
        setSelections(prev => {
            if (!prev[type]) return prev;
            return {
                ...prev,
                [type]: {
                    ...prev[type]!,
                    [field]: value
                }
            };
        });
    };

    const handleUpdateOverallBenefit = (field: keyof IopGoal, value: string) => {
        if (!iopResult?.overallBenefitSuggestion) return;
        setIopResult(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                overallBenefitSuggestion: {
                    ...prev.overallBenefitSuggestion!,
                    [field]: value
                }
            };
        });
    };

    const handleUpdateSocialGoal = (goalId: string, field: string, value: string) => {
        setEditedSocialGoals(prev => ({
            ...prev,
            [goalId]: {
                ...prev[goalId],
                [field]: value
            }
        }));
    };

    const handleUpdateOtherNeedMeasure = (needId: string, measureIndex: number, value: string) => {
        setEditedOtherNeedsMeasures(prev => {
            const currentMeasures = prev[needId] || otherNeedsData.otherNeeds.find((n: any) => n.id === needId)?.measures || [];
            const newMeasures = [...currentMeasures];
            newMeasures[measureIndex] = value;
            return {
                ...prev,
                [needId]: newMeasures
            };
        });
    };

    const handleSaveSubject = () => {
        if (!selections.skills || !selections.knowledge || !iopResult?.overallBenefitSuggestion) {
            alert('Vennligst velg både ferdighets- og kunnskapsmål før du lagrer.');
            return;
        }

        const newSavedSubject: SavedSubject = {
            subject: profile.subject,
            profile: { ...profile },
            framework: { ...framework },
            selections: {
                skills: selections.skills,
                knowledge: selections.knowledge,
            },
            overallBenefit: iopResult.overallBenefitSuggestion,
            coreElementsNote: iopResult.coreElementsInfluenceNote || '',
            recommendations: iopResult.recommendations || '',
            learningActivities: editedLearningActivities || iopResult.learningActivities || '',
            editedSocialGoals: { ...editedSocialGoals }, // Save edited social goals
            editedOtherNeedsMeasures: { ...editedOtherNeedsMeasures }, // Save edited measures
        };

        // If we're editing an existing subject, replace it; otherwise add new
        if (editingSubjectIndex !== null) {
            setSavedSubjects(prev => {
                const updated = [...prev];
                updated[editingSubjectIndex] = newSavedSubject;
                return updated;
            });
            setEditingSubjectIndex(null); // Clear editing state
        } else {
            setSavedSubjects(prev => [...prev, newSavedSubject]);
        }
        
        // Reset for next subject
        setProfile(initialProfile);
        setPastedGoals('');
        setExpertAssessment('');
        setStatus('idle');
        setError(null);
        setIopResult(null);
        setSelections({ skills: null, knowledge: null });
        setSelectedIndices({ skills: null, knowledge: null });
        setLoadingProgress(0);
        setEditedSocialGoals({}); // Reset edited social goals
        setEditedOtherNeedsMeasures({}); // Reset edited other needs measures
        setEditedLearningActivities(''); // Reset edited learning activities
        setEditedLearningActivities(''); // Reset edited learning activities
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRemoveSavedSubject = (index: number) => {
        setSavedSubjects(prev => prev.filter((_, i) => i !== index));
    };

    const handleEditSavedSubject = (index: number) => {
        const saved = savedSubjects[index];
        
        // Track that we're editing this subject (so we can replace it when saving)
        setEditingSubjectIndex(index);
        
        // Load the saved subject data back into the form
        setProfile(saved.profile);
        setFramework(saved.framework);
        setSelections(saved.selections);
        setSelectedIndices({ skills: 0, knowledge: 0 }); // Set to 0 since we only have one suggestion each when editing
        setIopResult({
            skillsSuggestions: [saved.selections.skills],
            knowledgeSuggestions: [saved.selections.knowledge],
            overallBenefitSuggestion: saved.overallBenefit,
            coreElementsInfluenceNote: saved.coreElementsNote,
            recommendations: saved.recommendations || '',
            learningActivities: saved.learningActivities || ''
        });
        setEditedSocialGoals(saved.editedSocialGoals || {});
        setEditedOtherNeedsMeasures(saved.editedOtherNeedsMeasures || {});
        setEditedLearningActivities(saved.learningActivities || '');
        setStatus('idle'); // Keep status as idle so form is still visible
        
        // Scroll down to show the result
        setTimeout(() => {
            const resultElement = document.querySelector('[data-result-section]');
            if (resultElement) {
                resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleDownloadWord = async () => {
        if (savedSubjects.length === 0) return;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Header
                    new Paragraph({
                        text: "Individuell opplæringsplan (IOP)",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Elev: ", bold: true }),
                            new TextRun(studentCode || savedSubjects[0]?.profile.studentName || "Ikke oppgitt")
                        ],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Klassetrinn: ", bold: true }),
                            new TextRun(savedSubjects[0]?.profile.grade || "Ikke oppgitt")
                        ],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Periode: ", bold: true }),
                            new TextRun(`${savedSubjects[0]?.profile.startDate || ''} til ${savedSubjects[0]?.profile.endDate || ''}`)
                        ],
                        spacing: { after: 400 }
                    }),
                    
                    // Add each saved subject
                    ...savedSubjects.flatMap((saved, idx) => {
                        const sections: Paragraph[] = [];
                        
                        // Subject heading
                        sections.push(new Paragraph({
                            text: `Fag ${idx + 1}: ${saved.subject}`,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 }
                        }));
                        
                        // Ferdighetsmål
                        sections.push(new Paragraph({
                            text: "Ferdighetsmål",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Mål: ", bold: true }), new TextRun(saved.selections.skills.goal)],
                            spacing: { after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Tilpasninger/tiltak: ", bold: true }), new TextRun(saved.selections.skills.measures)],
                            spacing: { after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Forankring: ", bold: true }), new TextRun(saved.selections.skills.anchoring)],
                            spacing: { after: 200 }
                        }));
                        
                        // Kunnskapsmål
                        sections.push(new Paragraph({
                            text: "Kunnskapsmål",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Mål: ", bold: true }), new TextRun(saved.selections.knowledge.goal)],
                            spacing: { after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Tilpasninger/tiltak: ", bold: true }), new TextRun(saved.selections.knowledge.measures)],
                            spacing: { after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Forankring: ", bold: true }), new TextRun(saved.selections.knowledge.anchoring)],
                            spacing: { after: 200 }
                        }));
                        
                        // IOP-mål
                        sections.push(new Paragraph({
                            text: "IOP-mål",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Individuelle læringsmål: ", bold: true }), new TextRun(saved.overallBenefit.goal)],
                            spacing: { after: 100 }
                        }));
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: "Vurdering: ", bold: true }), new TextRun(saved.overallBenefit.measures)],
                            spacing: { after: 100 }
                        }));
                        if (saved.overallBenefit.evaluation) {
                            sections.push(new Paragraph({
                                children: [new TextRun({ text: "Evaluering: ", bold: true }), new TextRun(saved.overallBenefit.evaluation)],
                                spacing: { after: 200 }
                            }));
                        }
                        
                        // Sosiale mål
                        if (saved.profile.selectedSocialGoals && saved.profile.selectedSocialGoals.length > 0) {
                            sections.push(new Paragraph({
                                text: "Sosiale mål for perioden",
                                heading: HeadingLevel.HEADING_3,
                                spacing: { before: 300, after: 100 }
                            }));
                            
                            saved.profile.selectedSocialGoals.forEach(goalId => {
                                const originalGoal = socialGoalsData.categories.find((g: any) => g.id === goalId);
                                if (!originalGoal) return;
                                
                                const editedGoals = saved.editedSocialGoals || {};
                                const description = editedGoals[goalId]?.description || originalGoal.description;
                                
                                sections.push(new Paragraph({
                                    children: [new TextRun({ text: `${originalGoal.name}: `, bold: true }), new TextRun(description)],
                                    spacing: { after: 100 }
                                }));
                            });
                        }
                        
                        // Andre behov
                        if (saved.profile.selectedOtherNeeds && saved.profile.selectedOtherNeeds.length > 0) {
                            sections.push(new Paragraph({
                                text: "Andre behov og fokusområder",
                                heading: HeadingLevel.HEADING_3,
                                spacing: { before: 300, after: 100 }
                            }));
                            
                            saved.profile.selectedOtherNeeds.forEach(needId => {
                                const need = otherNeedsData.otherNeeds.find((n: any) => n.id === needId);
                                if (!need) return;
                                
                                sections.push(new Paragraph({
                                    children: [new TextRun({ text: `${need.name}: `, bold: true }), new TextRun(need.description)],
                                    spacing: { after: 50 }
                                }));
                                
                                // Use edited measures if available, otherwise use original
                                const measures = saved.editedOtherNeedsMeasures?.[needId] || need.measures || [];
                                
                                if (measures.length > 0) {
                                    sections.push(new Paragraph({
                                        text: "Konkrete tiltak:",
                                        spacing: { before: 50, after: 50 },
                                        indent: { left: 360 }
                                    }));
                                    
                                    measures.forEach((measure: string) => {
                                        sections.push(new Paragraph({
                                            text: `• ${measure}`,
                                            spacing: { after: 50 },
                                            indent: { left: 720 }
                                        }));
                                    });
                                    
                                    sections.push(new Paragraph({
                                        text: "",
                                        spacing: { after: 100 }
                                    }));
                                }
                            });
                        }
                        
                        // Sammendrag og anbefalinger
                        if (saved.coreElementsNote) {
                            sections.push(new Paragraph({
                                text: "Sammendrag og anbefalinger",
                                heading: HeadingLevel.HEADING_3,
                                spacing: { before: 300, after: 100 }
                            }));
                            
                            sections.push(new Paragraph({
                                children: [new TextRun({ text: "Tilrettelegging og tiltak: ", bold: true })],
                                spacing: { after: 50 }
                            }));
                            sections.push(new Paragraph({
                                text: saved.coreElementsNote,
                                spacing: { after: 200 }
                            }));
                            
                            // Add recommendations if present
                            if (saved.recommendations) {
                                sections.push(new Paragraph({
                                    children: [new TextRun({ text: "Konkrete anbefalinger: ", bold: true })],
                                    spacing: { before: 100, after: 50 }
                                }));
                                sections.push(new Paragraph({
                                    text: saved.recommendations,
                                    spacing: { after: 200 }
                                }));
                            }
                            
                            // Add learning activities if present
                            if (saved.learningActivities) {
                                sections.push(new Paragraph({
                                    children: [new TextRun({ text: "Læringsaktiviteter: ", bold: true })],
                                    spacing: { before: 100, after: 50 }
                                }));
                                sections.push(new Paragraph({
                                    text: saved.learningActivities,
                                    spacing: { after: 200 }
                                }));
                            }
                            
                            // Add social goals summary if present
                            if (saved.profile.selectedSocialGoals && saved.profile.selectedSocialGoals.length > 0) {
                                const socialGoalNames = saved.profile.selectedSocialGoals
                                    .map(goalId => socialGoalsData.categories.find((g: any) => g.id === goalId)?.name)
                                    .filter(Boolean)
                                    .join(', ');
                                sections.push(new Paragraph({
                                    text: `Sosiale mål i fokus: ${socialGoalNames}.`,
                                    spacing: { after: 100 }
                                }));
                            }
                            
                            // Add other needs summary if present
                            if (saved.profile.selectedOtherNeeds && saved.profile.selectedOtherNeeds.length > 0) {
                                const needNames = saved.profile.selectedOtherNeeds
                                    .map(needId => otherNeedsData.otherNeeds.find((n: any) => n.id === needId)?.name)
                                    .filter(Boolean)
                                    .join(', ');
                                sections.push(new Paragraph({
                                    text: `Tilretteleggingen tar hensyn til: ${needNames}.`,
                                    spacing: { after: 200 }
                                }));
                            }
                        }
                        
                        return sections;
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `IOP_${studentCode || 'elev'}_${new Date().toISOString().split('T')[0]}.docx`);
    };
    
    const renderIopResult = () => {
        if (!iopResult) return null;
    
        const { coreElementsInfluenceNote, recommendations, learningActivities, socialGoalDescriptions, otherNeedsMeasures, skillsSuggestions, knowledgeSuggestions, overallBenefitSuggestion } = iopResult;
        const isPrintable = !!(selections.skills && selections.knowledge);
    
        return (
            <div className="space-y-8 animate-fade-in" data-result-section>
                <div className="flex justify-between items-center">
                    <button onClick={handleReset} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        <ArrowLeftIcon className="mr-2" />
                        Start på nytt
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900">Resultater - {profile.subject}</h1>
                    <div className="w-32"></div> {/* Spacer for alignment */}
                </div>
                {status === 'error' && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

                <Card title="Velg mål for ferdigheter" icon={<CheckCircleIcon />} className="border-l-4 border-accent-purple">
                    <div className="space-y-4">
                        {skillsSuggestions && skillsSuggestions.length > 0 ? (
                            skillsSuggestions.map((suggestion, index) => (
                                <div key={index} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedIndices.skills === index ? 'bg-accent-purple-light border-accent-purple ring-2 ring-accent-purple shadow-md' : 'bg-white border-gray-200 hover:border-accent-purple hover:shadow-md'}`} onClick={() => handleSelectionChange('skills', suggestion, index)}>
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="font-medium text-gray-800 flex-grow text-base">{suggestion.goal}</p>
                                        {difficultyLabels[index] && (
                                             <span className="text-xs font-semibold text-accent-purple bg-accent-purple-light px-2.5 py-1 rounded-full whitespace-nowrap">{difficultyLabels[index]}</span>
                                        )}
                                    </div>
                                    {selectedIndices.skills === index && (
                                        <div className="mt-4 text-base text-gray-700 space-y-3 leading-relaxed">
                                            <div>
                                                <span className="font-semibold">Mål:</span>
                                                <EditableField
                                                    value={selections.skills.goal}
                                                    onSave={(value) => handleUpdateSelection('skills', 'goal', value)}
                                                    multiline
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <span className="font-semibold">Tiltak:</span>
                                                <EditableField
                                                    value={selections.skills.measures}
                                                    onSave={(value) => handleUpdateSelection('skills', 'measures', value)}
                                                    multiline
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <span className="font-semibold">Forankring:</span>
                                                <EditableField
                                                    value={selections.skills.anchoring}
                                                    onSave={(value) => handleUpdateSelection('skills', 'anchoring', value)}
                                                    multiline
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            // Loading placeholders
                            <>
                                <div className="p-4 rounded-lg border border-gray-200 bg-white animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                                <div className="p-4 rounded-lg border border-gray-200 bg-white animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                <Card title="Velg mål for kunnskap" icon={<CheckCircleIcon />} className="border-l-4 border-accent-orange">
                     <div className="space-y-4">
                        {knowledgeSuggestions && knowledgeSuggestions.length > 0 ? (
                            knowledgeSuggestions.map((suggestion, index) => (
                                <div key={index} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedIndices.knowledge === index ? 'bg-accent-orange-light border-accent-orange ring-2 ring-accent-orange shadow-md' : 'bg-white border-gray-200 hover:border-accent-orange hover:shadow-md'}`} onClick={() => handleSelectionChange('knowledge', suggestion, index)}>
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="font-medium text-gray-800 flex-grow text-base">{suggestion.goal}</p>
                                        {difficultyLabels[index] && (
                                            <span className="text-xs font-semibold text-accent-orange bg-accent-orange-light px-2.5 py-1 rounded-full whitespace-nowrap">{difficultyLabels[index]}</span>
                                        )}
                                    </div>
                                    {selectedIndices.knowledge === index && (
                                        <div className="mt-4 text-base text-gray-700 space-y-3 leading-relaxed">
                                            <div>
                                                <span className="font-semibold">Mål:</span>
                                                <EditableField
                                                    value={selections.knowledge.goal}
                                                    onSave={(value) => handleUpdateSelection('knowledge', 'goal', value)}
                                                    multiline
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <span className="font-semibold">Tiltak:</span>
                                                <EditableField
                                                    value={selections.knowledge.measures}
                                                    onSave={(value) => handleUpdateSelection('knowledge', 'measures', value)}
                                                    multiline
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <span className="font-semibold">Forankring:</span>
                                                <EditableField
                                                    value={selections.knowledge.anchoring}
                                                    onSave={(value) => handleUpdateSelection('knowledge', 'anchoring', value)}
                                                    multiline
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            // Loading placeholders
                            <>
                                <div className="p-4 rounded-lg border border-gray-200 bg-white animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                                <div className="p-4 rounded-lg border border-gray-200 bg-white animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* Show selected social goals if any - MOVED BEFORE IOP goals */}
                {profile.selectedSocialGoals && profile.selectedSocialGoals.length > 0 && (
                    <Card title="Sosiale mål for perioden" icon={<span className="text-2xl">👥</span>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {profile.selectedSocialGoals.map((goalId) => {
                                const originalGoal = socialGoalsData.categories.find((g: any) => g.id === goalId);
                                if (!originalGoal) return null;
                                
                                // Use edited values if available, otherwise use AI-generated, then fallback to original
                                const aiGenerated = socialGoalDescriptions?.[goalId];
                                const goal = {
                                    ...originalGoal,
                                    description: editedSocialGoals[goalId]?.description 
                                        || aiGenerated?.description 
                                        || originalGoal.description,
                                    examples: editedSocialGoals[goalId]?.examples 
                                        ? JSON.parse(editedSocialGoals[goalId].examples)
                                        : (aiGenerated?.examples || originalGoal.examples)
                                };
                                
                                return (
                                    <div key={goalId} className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{goal.icon}</span>
                                            <span className="font-semibold text-gray-900">{goal.name}</span>
                                        </div>
                                        <EditableField
                                            value={goal.description}
                                            onSave={(value) => handleUpdateSocialGoal(goalId, 'description', value)}
                                            multiline
                                            className="text-sm text-gray-600 mb-3"
                                        />
                                        <div className="mt-3 pt-3 border-t border-purple-200">
                                            <p className="text-xs font-semibold text-purple-700 mb-2">Forslag til tiltak:</p>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {goal.examples.slice(0, 3).map((example: string, idx: number) => (
                                                    <li key={idx} className="flex items-start">
                                                        <span className="mr-1">•</span>
                                                        <EditableField
                                                            value={example}
                                                            onSave={(value) => {
                                                                const updatedExamples = [...goal.examples];
                                                                updatedExamples[idx] = value;
                                                                handleUpdateSocialGoal(goalId, 'examples', JSON.stringify(updatedExamples));
                                                            }}
                                                            className="flex-1"
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-sm text-gray-500 italic">
                            💡 Disse sosiale målene er vevd inn i ferdighetsmål og kunnskapsmål ovenfor
                        </p>
                    </Card>
                )}

                {/* Show selected other needs if any - MOVED BEFORE IOP goals */}
                {profile.selectedOtherNeeds && profile.selectedOtherNeeds.length > 0 && (
                    <Card title="Andre behov og fokusområder" icon={<span className="text-2xl">🎯</span>}>
                        <div className="space-y-3">
                            {profile.selectedOtherNeeds.map((needId) => {
                                const need = otherNeedsData.otherNeeds.find((n: any) => n.id === needId);
                                if (!need) return null;
                                
                                // Use edited measures if available, otherwise use AI-generated or fallback to JSON
                                const measures = editedOtherNeedsMeasures[needId] 
                                    || otherNeedsMeasures?.[needId] 
                                    || need.measures 
                                    || [];
                                
                                return (
                                    <div key={needId} className="p-4 bg-teal-50 border-2 border-teal-200 rounded-lg">
                                        <p className="font-semibold text-gray-900 text-sm mb-2">{need.name}</p>
                                        <p className="text-xs text-gray-600 mb-3">{need.description}</p>
                                        <div className="pt-3 mt-3 border-t border-teal-300">
                                            <p className="text-xs font-semibold text-teal-800 mb-2">📋 Konkrete tiltak:</p>
                                            <ul className="space-y-2">
                                                {measures.map((measure: string, idx: number) => (
                                                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                                        <span className="text-teal-600 mt-0.5 flex-shrink-0">•</span>
                                                        <EditableField
                                                            value={measure}
                                                            onSave={(value) => handleUpdateOtherNeedMeasure(needId, idx, value)}
                                                            className="flex-1"
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-sm text-gray-500 italic">
                            🎯 Disse behovene er tatt hensyn til i utformingen av målene
                        </p>
                    </Card>
                )}

                {/* Learning Activities - REMOVED, now inside IOP-mål */}

                <Card title="IOP-mål" icon={<DocumentIcon />}>
                    {overallBenefitSuggestion ? (
                         <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Individuelle læringsmål</h4>
                                <EditableField
                                    value={overallBenefitSuggestion.goal}
                                    onSave={(value) => handleUpdateOverallBenefit('goal', value)}
                                    multiline
                                />
                            </div>
                            
                            {/* Learning Activities inside IOP-mål */}
                            {learningActivities && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Læringsaktiviteter</h4>
                                    <p className="text-xs text-gray-500 mb-2">Konkrete aktiviteter basert på ferdighetsmål og kunnskapsmål</p>
                                    <EditableField
                                        value={editedLearningActivities || learningActivities}
                                        onSave={(value) => setEditedLearningActivities(value)}
                                        multiline
                                    />
                                </div>
                            )}
                            
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Vurdering (hvordan eleven viser kompetanse)</h4>
                                <EditableField
                                    value={overallBenefitSuggestion.measures}
                                    onSave={(value) => handleUpdateOverallBenefit('measures', value)}
                                    multiline
                                />
                            </div>
                            {overallBenefitSuggestion.evaluation && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Evaluering av utvikling</h4>
                                    <EditableField
                                        value={overallBenefitSuggestion.evaluation}
                                        onSave={(value) => handleUpdateOverallBenefit('evaluation', value)}
                                        multiline
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">Forslag til IOP-mål kunne ikke genereres.</p>
                    )}
                </Card>

                {/* Summary with recommendations - placed before save button */}
                <Card title="Sammendrag og anbefalinger" icon={<DocumentIcon />} className="border-l-4 border-brand-blue">
                    {coreElementsInfluenceNote ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Sammendrag</h4>
                                <p className="text-gray-700 text-base leading-relaxed">{coreElementsInfluenceNote}</p>
                            </div>
                            
                            {recommendations && (
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Konkrete anbefalinger</h4>
                                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                                        {recommendations}
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-gray-200 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                                <p className="text-sm text-gray-600 italic">
                                    💡 Dette sammendraget gir et helhetlig bilde av elevens IOP og anbefales inkludert i dokumentet.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    )}
                </Card>

                {/* Save button at the bottom */}
                <div className="flex justify-center pt-4">
                    <button 
                        onClick={handleSaveSubject}
                        disabled={!isPrintable}
                        className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-base font-semibold rounded-lg text-white bg-accent-green hover:bg-accent-green/90 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={!isPrintable ? "Velg et mål for både ferdigheter og kunnskap før du lagrer" : "Lagre dette faget og legg til nytt fag"}
                    >
                        💾 Lagre fag
                    </button>
                </div>
            </div>
        );
    };

    if (status === 'success' || status === 'loading') {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
                {/* Progress Bar */}
                {status === 'loading' && (
                    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b-2 border-brand-blue">
                        <div className="max-w-4xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-700">🤖 Genererer IOP-forslag...</p>
                                <p className="text-sm font-bold text-brand-blue">{Math.round(loadingProgress)}%</p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-blue via-purple-600 to-pink-600 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                                    style={{ width: `${loadingProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {loadingProgress >= 95 
                                    ? '🎯 Legger de siste tingene på plass...' 
                                    : '✨ AI analyserer kompetansemål og genererer tilpassede forslag...'}
                            </p>
                        </div>
                    </div>
                )}
                <div className="max-w-4xl mx-auto" style={{ marginTop: status === 'loading' ? '120px' : '0' }}>{renderIopResult()}</div>
                <Footer />
            </div>
        );
    }

    return (
        <>
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
                {/* Om button in top right corner */}
                <div className="fixed top-4 right-4 z-40">
                    <button
                        onClick={() => setShowAboutModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                        title="Info, bruk og retningslinjer"
                    >
                        ℹ️ Info, bruk og retningslinjer
                    </button>
                </div>

                <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 animate-fade-in">
                        <div className="inline-block mb-8">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-blue via-purple-600 to-pink-600 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3">
                                <DocumentIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-purple-600 to-pink-600 tracking-tight mb-8 pb-2">
                            IOP Målbygger
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-700 font-medium">
                            ✨Kraftig KI-drevet verktøy for individuelle opplæringsplaner ✨
                        </p>
                    </div>

                    {/* Saved subjects display */}
                    {savedSubjects.length > 0 && (
                        <Card title={`📚 Lagrede fag (${savedSubjects.length})`} icon={<CheckCircleIcon className="w-5 h-5" />} className="mb-6 border-l-4 border-accent-green">
                            <div className="space-y-2">
                                {savedSubjects.map((saved, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-accent-green hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-gray-800">{saved.subject}</p>
                                                <p className="text-sm text-gray-600">{saved.profile.topic}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditSavedSubject(index)}
                                                className="px-3 py-1 text-sm text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-all"
                                                title="Rediger dette faget"
                                            >
                                                ✏️ Rediger
                                            </button>
                                            <button
                                                onClick={() => handleRemoveSavedSubject(index)}
                                                className="px-3 py-1 text-sm text-red-600 hover:text-white hover:bg-red-600 rounded transition-all"
                                                title="Fjern dette faget"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={handleDownloadWord}
                                    className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-brand-blue hover:bg-blue-700 hover:shadow-md transition-all duration-200"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    📄 Last ned som Word-dokument
                                </button>
                            </div>
                        </Card>
                    )}

                    <div className="space-y-6 animate-slide-up">
                        {/* Student code/initials */}
                        <Card title="Elevidentifikasjon" icon={<DocumentIcon />}>
                            <div>
                                <label htmlFor="studentCode" className="block text-sm font-semibold text-gray-700 mb-1">
                                    Initialer eller kode
                                    <span className="text-xs font-normal text-gray-500 ml-2">(vises diskret i rapporten)</span>
                                </label>
                                <input
                                    type="text"
                                    id="studentCode"
                                    value={studentCode}
                                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                                    placeholder="F.eks. 'AB' eller 'ELV-01'"
                                    maxLength={10}
                                    className="mt-1 block w-full px-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue rounded-lg bg-white shadow-sm transition-all"
                                />
                            </div>
                        </Card>

                        {/* Student profile and topic */}
                        <Card title="Tema" icon={<DocumentIcon />}>
                             <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="grade" className="block text-sm font-semibold text-gray-700 mb-1">
                                        Kompetansemålnivå
                                        <span className="text-gray-500 text-xs ml-2 font-normal">
                                            (Velg nærmeste sluttvurderingstidspunkt)
                                        </span>
                                    </label>
                                    <select id="grade" name="grade" value={profile.grade} onChange={handleProfileChange} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-lg bg-white shadow-sm transition-all">
                                        <option value="" disabled>Velg kompetansemålnivå</option>
                                        <option value="2">Etter 2. trinn (1-2)</option>
                                        <option value="4">Etter 4. trinn (3-4)</option>
                                        <option value="7">Etter 7. trinn (5-7)</option>
                                        <option value="10">Etter 10. trinn (8-10)</option>
                                        <option value="Vg1">Vg1</option>
                                        <option value="Vg2">Vg2</option>
                                        <option value="Vg3">Vg3</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-3">
                                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1">Fag</label>
                                    <select id="subject" name="subject" value={profile.subject} onChange={handleProfileChange} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-lg bg-white shadow-sm transition-all">
                                        <option value="" disabled>Velg fag</option>
                                        {availableSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-6">
                                     <TextAreaField id="topic" label="Tema for perioden" value={profile.topic} onChange={handleProfileChange} placeholder="F.eks. 'Å skrive en fortelling' eller 'Fotosyntesen'" />
                                </div>
                             </div>
                        </Card>

                        <Card title="Tilråding om tiltak" icon={<DocumentIcon />}>
                            <div className="space-y-2">
                                <TextAreaField
                                    id="expertAssessment"
                                    label="Lim inn relevant tekst fra sakkyndig vurdering her"
                                    value={expertAssessment}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.length <= 150) {
                                            setExpertAssessment(value);
                                        }
                                    }}
                                    placeholder="F.eks. 'Eleven har behov for utstrakt bruk av visuell støtte...'"
                                    rows={3}
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <p className="text-gray-500">
                                        💡 Valgfritt - Kun det mest essensielle
                                    </p>
                                    <p className={`font-medium ${expertAssessment.length > 130 ? 'text-orange-600' : 'text-gray-500'}`}>
                                        {150 - expertAssessment.length} tegn igjen
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Framework */}
                        <Card title="Tidsramme" icon={<CalendarIcon />}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-1">Startdato</label>
                                    <input type="date" name="startDate" id="startDate" value={framework.startDate} onChange={handleFrameworkChange} className="focus:ring-2 focus:ring-brand-blue focus:border-brand-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 px-3 py-2.5 mt-1 transition-all"/>
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-1">Sluttdato</label>
                                    <input type="date" name="endDate" id="endDate" value={framework.endDate} onChange={handleFrameworkChange} className="focus:ring-2 focus:ring-brand-blue focus:border-brand-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 px-3 py-2.5 mt-1 transition-all"/>
                                </div>
                            </div>
                        </Card>

                        {/* Core Elements */}
                        {profile.subject && curriculumData[profile.subject]?.coreElements.length > 0 && (
                             <Card title={`Kjerneelement for ${profile.subject}`} icon={<BookOpenIcon className="text-brand-blue" />} className="border-l-4 border-brand-blue shadow-blue-200">
                                <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-transparent rounded-xl">
                                    <p className="text-base text-gray-700">
                                        Valgt kjerneelement: <span className="font-bold text-brand-blue text-lg">{profile.selectedCoreElement || 'Ingen valgt.'}</span>
                                    </p>
                                    <button onClick={() => setShowCoreElementsModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-blue to-blue-700 rounded-lg hover:from-blue-700 hover:to-brand-blue transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-xl">
                                        ⚙️ Endre valgt kjerneelement
                                    </button>
                                </div>
                            </Card>
                        )}

                        {/* Cross-Curricular Themes */}
                        {profile.subject && curriculumData[profile.subject]?.crossCurricularThemes.length > 0 && (
                             <Card title={`Tverrfaglig tema for ${profile.subject}`} icon={<BookOpenIcon className="text-accent-green" />} className="border-l-4 border-accent-green shadow-green-200">
                                <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-transparent rounded-xl">
                                    <p className="text-base text-gray-700">
                                        Valgt tema: <span className="font-bold text-accent-green text-lg">{profile.selectedCrossCurricularTheme || 'Ingen valgt (valgfritt).'}</span>
                                    </p>
                                    <button onClick={() => setShowCrossCurricularModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-accent-green to-green-700 rounded-lg hover:from-green-700 hover:to-accent-green transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-xl">
                                        🌿 {profile.selectedCrossCurricularTheme ? 'Endre' : 'Velg'} tverrfaglig tema
                                    </button>
                                </div>
                            </Card>
                        )}

                        {/* Social Goals */}
                        <Card title="Sosiale mål" icon={<span className="text-2xl">👥</span>}>
                            <SocialGoalsSelector
                                selectedGoals={profile.selectedSocialGoals || []}
                                onSelectionChange={(goals) => setProfile(prev => ({ ...prev, selectedSocialGoals: goals }))}
                                maxSelections={3}
                            />
                        </Card>

                        {/* Other Needs */}
                        <Card title="Andre behov" icon={<span className="text-2xl">🎯</span>}>
                            <OtherNeedsSelector
                                selectedNeeds={profile.selectedOtherNeeds || []}
                                onSelectionChange={(needs) => setProfile(prev => ({ ...prev, selectedOtherNeeds: needs }))}
                                maxSelections={5}
                            />
                        </Card>

                        {/* Competence Goals */}
                        <CompetenceGoalSelector
                            selectedSubject={profile.subject}
                            selectedLevel={profile.grade}
                            pastedGoals={pastedGoals}
                            setPastedGoals={setPastedGoals}
                        />

                        {/* Submission */}
                        <div className="pt-5">
                            {/* Debug info - fjern senere */}
                            {!isFormValid && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                    <p className="font-medium mb-1">⚠️ Mangler:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {!profile.grade && <li>Kompetansemålnivå</li>}
                                        {!profile.subject && <li>Fag</li>}
                                        {!profile.topic.trim() && <li>Tema for perioden</li>}
                                        {!pastedGoals.trim() && <li>Kompetansemål (velg fra bibliotek eller lim inn)</li>}
                                    </ul>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!isFormValid || status === 'loading'}
                                    className="w-full sm:w-auto inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-lg text-base font-medium rounded-xl text-white bg-gradient-to-r from-brand-blue to-indigo-600 hover:from-brand-blue/90 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Genererer forslag...
                                        </>
                                    ) : 'Generer forslag til IOP'}
                                </button>
                            </div>
                            {status === 'error' && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
                        </div>
                    </div>

                    {/* Show IOP result if available (for editing saved subjects) */}
                    {iopResult && (
                        <div className="max-w-4xl mx-auto mt-8">
                            {renderIopResult()}
                        </div>
                    )}
                </main>
                <Footer />
            </div>

            {showCoreElementsModal && profile.subject && curriculumData[profile.subject] && (
                <CoreElementsModal
                    subject={profile.subject}
                    coreElements={curriculumData[profile.subject].coreElements}
                    selectedCoreElement={profile.selectedCoreElement}
                    onToggleCoreElement={handleToggleCoreElement}
                    onClose={() => setShowCoreElementsModal(false)}
                />
            )}

            {showCrossCurricularModal && profile.subject && curriculumData[profile.subject] && (
                <CoreElementsModal
                    subject={profile.subject}
                    coreElements={curriculumData[profile.subject].crossCurricularThemes}
                    selectedCoreElement={profile.selectedCrossCurricularTheme}
                    onToggleCoreElement={handleToggleCrossCurricularTheme}
                    onClose={() => setShowCrossCurricularModal(false)}
                    title="Velg tverrfaglig tema"
                />
            )}

            {/* Print area for multi-subject report */}
            <div id="printable-report-area" className="hidden">
                {savedSubjects.length > 0 && (
                    <div className="pt-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">Individuell Opplæringsplan</h2>
                            {studentCode && (
                                <p className="mt-2 text-sm text-gray-400">Elev: {studentCode}</p>
                            )}
                            <p className="mt-2 text-lg text-gray-600">{savedSubjects.length} fag</p>
                        </div>
                        <div className="mt-8 p-8 sm:p-12 bg-white rounded-lg shadow-lg border border-gray-200">
                            <div className="space-y-12">
                                {/* Each subject */}
                                {savedSubjects.map((saved, index) => (
                                    <div key={index} className="print-page-break space-y-6 border-b last:border-b-0 pb-10 last:pb-0">
                                        <div className="text-center bg-gradient-to-r from-brand-blue to-purple-600 text-white py-4 rounded-lg">
                                            <h2 className="text-2xl font-bold">{saved.subject}</h2>
                                            <p className="text-sm mt-1 opacity-90">{saved.profile.topic}</p>
                                        </div>

                                        {/* Subject-specific info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md">
                                            <div>
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kompetansemålnivå</h3>
                                                <p className="mt-1 text-sm text-gray-800">
                                                    {(() => {
                                                        const gradeLabels: Record<string, string> = {
                                                            '2': 'Etter 2. trinn',
                                                            '4': 'Etter 4. trinn',
                                                            '7': 'Etter 7. trinn',
                                                            '10': 'Etter 10. trinn',
                                                            'vg1': 'Vg1',
                                                            'vg2': 'Vg2',
                                                            'vg3': 'Vg3'
                                                        };
                                                        return gradeLabels[saved.profile.grade] || saved.profile.grade;
                                                    })()}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tidsramme</h3>
                                                <p className="mt-1 text-sm text-gray-800">
                                                    {new Date(saved.framework.startDate).toLocaleDateString('nb-NO')} – {new Date(saved.framework.endDate).toLocaleDateString('nb-NO')}
                                                </p>
                                            </div>
                                        </div>

                                        {saved.coreElementsNote && (
                                            <div>
                                                <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Kjerneelementer</h4>
                                                <p className="mt-1 text-base text-gray-700 leading-relaxed">{saved.coreElementsNote}</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Valgte mål</h3>
                                            
                                            <div className="p-4 bg-purple-50 rounded-md border-l-4 border-accent-purple">
                                                <h4 className="text-base font-semibold text-accent-purple">Ferdigheter</h4>
                                                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{saved.selections.skills.goal}</p>
                                            </div>

                                            <div className="p-4 bg-orange-50 rounded-md border-l-4 border-accent-orange">
                                                <h4 className="text-base font-semibold text-accent-orange">Kunnskap</h4>
                                                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{saved.selections.knowledge.goal}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 rounded-md border-l-4 border-brand-blue">
                                            <h3 className="text-base font-semibold text-brand-blue">Samlet vurdering</h3>
                                            <div className="mt-2 space-y-2 text-sm text-gray-700 leading-relaxed">
                                                <p><span className="font-semibold">Individuelle læringsmål:</span> {saved.overallBenefit.goal}</p>
                                                <p><span className="font-semibold">Vurdering (hvordan eleven viser kompetanse):</span> {saved.overallBenefit.measures}</p>
                                                {saved.overallBenefit.evaluation && <p><span className="font-semibold">Evaluering av utvikling:</span> {saved.overallBenefit.evaluation}</p>}
                                            </div>
                                        </div>

                                        {/* Social Goals in Print */}
                                        {saved.profile.selectedSocialGoals && saved.profile.selectedSocialGoals.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Sosiale mål for perioden</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {saved.profile.selectedSocialGoals.map((goalId) => {
                                                        const originalGoal = socialGoalsData.categories.find((g: any) => g.id === goalId);
                                                        if (!originalGoal) return null;
                                                        
                                                        // Use edited values if available from saved data
                                                        const editedGoals = saved.editedSocialGoals || {};
                                                        const goal = {
                                                            ...originalGoal,
                                                            description: editedGoals[goalId]?.description || originalGoal.description,
                                                            examples: editedGoals[goalId]?.examples 
                                                                ? JSON.parse(editedGoals[goalId].examples)
                                                                : originalGoal.examples
                                                        };
                                                        
                                                        return (
                                                            <div key={goalId} className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xl">{goal.icon}</span>
                                                                    <span className="font-semibold text-gray-900 text-sm">{goal.name}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                                                                <div className="mt-2 pt-2 border-t border-purple-200">
                                                                    <p className="text-xs font-semibold text-purple-700 mb-1">Eksempler:</p>
                                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                                        {goal.examples.slice(0, 3).map((example: string, idx: number) => (
                                                                            <li key={idx} className="flex items-start">
                                                                                <span className="mr-1">•</span>
                                                                                <span>{example}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <p className="mt-3 text-xs text-gray-500 italic">
                                                    💡 Disse sosiale målene er vevd inn i ferdighetsmål og kunnskapsmål ovenfor
                                                </p>
                                            </div>
                                        )}

                                        {/* Other Needs in Print */}
                                        {saved.profile.selectedOtherNeeds && saved.profile.selectedOtherNeeds.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Andre behov og fokusområder</h3>
                                                <div className="space-y-3">
                                                    {saved.profile.selectedOtherNeeds.map((needId) => {
                                                        const need = otherNeedsData.otherNeeds.find((n: any) => n.id === needId);
                                                        if (!need) return null;
                                                        
                                                        // Use edited measures if available, otherwise use original
                                                        const measures = saved.editedOtherNeedsMeasures?.[needId] || need.measures || [];
                                                        
                                                        return (
                                                            <div key={needId} className="p-4 bg-teal-50 border-2 border-teal-200 rounded-lg">
                                                                <p className="font-semibold text-gray-900 text-sm mb-2">{need.name}</p>
                                                                <p className="text-xs text-gray-600 mb-3">{need.description}</p>
                                                                {measures.length > 0 && (
                                                                    <div className="pt-3 mt-3 border-t border-teal-300">
                                                                        <p className="text-xs font-semibold text-teal-800 mb-2">📋 Konkrete tiltak:</p>
                                                                        <ul className="space-y-1.5">
                                                                            {measures.map((measure: string, idx: number) => (
                                                                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                                                                    <span className="text-teal-600 mt-0.5">•</span>
                                                                                    <span>{measure}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* About Modal */}
            <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
        </>
    );
};

export default App;