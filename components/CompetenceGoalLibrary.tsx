import React, { useState, useMemo } from 'react';
import competenceGoalsData from '../data/competenceGoals.json';

interface CompetenceGoal {
    code: string;
    text: string;
    coreElements: string[];
}

interface CompetenceGoalLibraryProps {
    selectedSubject: string;
    selectedLevel: string;
    onSelectGoals: (goals: string[]) => void;
    currentlySelected: string[];
}

export const CompetenceGoalLibrary: React.FC<CompetenceGoalLibraryProps> = ({
    selectedSubject,
    selectedLevel,
    onSelectGoals,
    currentlySelected
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGoals, setSelectedGoals] = useState<string[]>(currentlySelected);

    // Map subject names to codes
    const subjectCodeMap: Record<string, string> = {
        'Matematikk': 'MAT',
        'Norsk': 'NOR',
        'Engelsk': 'ENG',
        'Engelsk (5.-10. årstrinn)': 'ENG',
        'KRLE': 'RLE',
        'Kristendom, religion, livssyn og etikk (KRLE)': 'RLE',
        'Naturfag': 'NAT',
        'Samfunnsfag': 'SAF',
        'Kroppsøving': 'KRO',
        'Kunst og håndverk': 'KHV',
        'Musikk': 'MUS'
    };

    const subjectCode = subjectCodeMap[selectedSubject];

    // Get available goals for selected subject and level
    const availableGoals: CompetenceGoal[] = useMemo(() => {
        if (!subjectCode || !selectedLevel) return [];
        
        const subjectData = (competenceGoalsData as any)[subjectCode];
        if (!subjectData || !subjectData.levels[selectedLevel]) return [];
        
        return subjectData.levels[selectedLevel];
    }, [subjectCode, selectedLevel]);

    // Filter goals based on search term
    const filteredGoals = useMemo(() => {
        if (!searchTerm) return availableGoals;
        
        const lowerSearch = searchTerm.toLowerCase();
        return availableGoals.filter(goal => 
            goal.text.toLowerCase().includes(lowerSearch) ||
            goal.code.toLowerCase().includes(lowerSearch) ||
            goal.coreElements.some(elem => elem.toLowerCase().includes(lowerSearch))
        );
    }, [availableGoals, searchTerm]);

    const handleToggleGoal = (goalText: string) => {
        setSelectedGoals(prev => {
            let newSelection: string[];
            
            // If deselecting, remove it
            if (prev.includes(goalText)) {
                newSelection = prev.filter(g => g !== goalText);
            } 
            // If selecting and already have 1 goal, replace it
            else if (prev.length >= 1) {
                newSelection = [goalText]; // Replace the existing goal
            }
            else {
                newSelection = [goalText];
            }
            
            // Notify parent of change
            onSelectGoals(newSelection);
            return newSelection;
        });
    };

    const handleSelectAll = () => {
        // Only select the first goal when "select all" is clicked
        if (filteredGoals.length > 0) {
            const firstGoal = filteredGoals[0].text;
            setSelectedGoals([firstGoal]);
            onSelectGoals([firstGoal]);
        }
    };

    const handleClearAll = () => {
        setSelectedGoals([]);
        onSelectGoals([]);
    };

    if (!subjectCode) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Kompetansemålbibliotek</p>
                <p>Velg fag og kompetansemål-nivå over for å se tilgjengelige kompetansemål.</p>
            </div>
        );
    }

    if (!selectedLevel) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Kompetansemålbibliotek</p>
                <p>Velg kompetansemål-nivå over for å se tilgjengelige kompetansemål for {selectedSubject}.</p>
            </div>
        );
    }

    if (availableGoals.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ Ingen kompetansemål tilgjengelig</p>
                <p>Det finnes ingen kompetansemål for {selectedSubject} på nivå {selectedLevel} i biblioteket ennå.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-blue to-purple-600 text-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-1">📚 Kompetansemålbibliotek</h3>
                <p className="text-sm opacity-90">
                    {(competenceGoalsData as any)[subjectCode].name} - Etter {selectedLevel === '2' ? '2.' : selectedLevel === '4' ? '4.' : selectedLevel === '7' ? '7.' : '10.'} trinn
                </p>
                <p className="text-xs opacity-75 mt-1">
                    💡 Velg ETT kompetansemål som er mest relevant
                </p>
            </div>

            {/* Search and actions */}
            <div className="space-y-3">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Søk i kompetansemål..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    />
                    <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        {selectedGoals.length > 0 ? '✓ 1 kompetansemål valgt' : 'Velg 1 kompetansemål'}
                    </span>
                    {selectedGoals.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Fjern valg
                        </button>
                    )}
                </div>
            </div>

            {/* Goals list */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {filteredGoals.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>Ingen kompetansemål matcher søket "{searchTerm}"</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredGoals.map((goal) => (
                            <label
                                key={goal.code}
                                className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedGoals.includes(goal.text)}
                                    onChange={() => handleToggleGoal(goal.text)}
                                    className="mt-1 h-5 w-5 text-brand-blue border-gray-300 rounded focus:ring-brand-blue flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">
                                            {goal.code}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-900 leading-relaxed">
                                        {goal.text}
                                    </p>
                                    {goal.coreElements.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {goal.coreElements.map((element, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                                                >
                                                    {element}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Help text */}
            {selectedGoals.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    <p className="font-medium">✓ 1 kompetansemål valgt</p>
                    <p className="text-xs mt-1 text-green-700">
                        Dette vil bli brukt til å generere fokuserte IOP-mål når du klikker "Generer mål"
                    </p>
                </div>
            )}
        </div>
    );
};
