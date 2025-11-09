import React, { useState } from 'react';
import { Card } from './Card';
import { DocumentIcon } from './icons/DocumentIcon';
import { TextAreaField } from './TextAreaField';
import { CompetenceGoalLibrary } from './CompetenceGoalLibrary';

interface CompetenceGoalSelectorProps {
    selectedSubject: string;
    selectedLevel: string;
    pastedGoals: string;
    setPastedGoals: (goals: string) => void;
}

const MAX_GOAL_LENGTH = 800; // Increased to support multiple goals

export const CompetenceGoalSelector: React.FC<CompetenceGoalSelectorProps> = React.memo(({ 
    selectedSubject, 
    selectedLevel,
    pastedGoals, 
    setPastedGoals 
}) => {
    const [inputMode, setInputMode] = useState<'library' | 'manual'>('library');

    const handleLibrarySelection = (goals: string[]) => {
        setPastedGoals(goals.join('\n\n'));
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_GOAL_LENGTH) {
            setPastedGoals(value);
        }
    };

    // Parse currently pasted goals into array
    const currentGoalsArray = pastedGoals
        .split('\n\n')
        .map(g => g.trim())
        .filter(g => g.length > 0);

    const remainingChars = MAX_GOAL_LENGTH - pastedGoals.length;
    const isNearLimit = remainingChars < 100;

    if (!selectedSubject) {
        return (
            <Card title="Kompetansemål" icon={<DocumentIcon />}>
                <p className="text-gray-500">Velg et fag i "Tema"-kortet over for å velge kompetansemål.</p>
            </Card>
        );
    }

    return (
        <Card title={`Kompetansemål for ${selectedSubject}`} icon={<DocumentIcon />}>
            <div className="space-y-4">
                {/* Toggle between library and manual input */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setInputMode('library')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${
                            inputMode === 'library'
                                ? 'bg-white text-brand-blue shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📚 Bibliotek
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMode('manual')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${
                            inputMode === 'manual'
                                ? 'bg-white text-brand-blue shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        ✍️ Lim inn selv
                    </button>
                </div>

                {/* Library mode */}
                {inputMode === 'library' && (
                    <CompetenceGoalLibrary
                        selectedSubject={selectedSubject}
                        selectedLevel={selectedLevel}
                        onSelectGoals={handleLibrarySelection}
                        currentlySelected={currentGoalsArray}
                    />
                )}

                {/* Manual input mode */}
                {inputMode === 'manual' && (
                    <div className="space-y-2">
                        <TextAreaField
                            id="competenceGoals"
                            label="Lim inn kompetansemål fra læreplanen"
                            value={pastedGoals}
                            onChange={handleManualChange}
                            placeholder="Lim inn ett eller flere kompetansemål fra læreplanen. Skill flere mål med dobbel linjeskift."
                            rows={8}
                        />
                        <div className="flex items-center justify-between text-xs">
                            <p className="text-gray-500">
                                💡 Tips: Skill flere mål med en tom linje mellom
                            </p>
                            <p className={`font-medium ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
                                {remainingChars} tegn igjen
                            </p>
                        </div>
                    </div>
                )}

                {/* Show selected goals count */}
                {pastedGoals.trim() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="text-blue-900 font-medium">
                            ✓ {currentGoalsArray.length} kompetansemål valgt
                        </p>
                        {inputMode === 'library' && (
                            <p className="text-blue-700 text-xs mt-1">
                                Du kan bytte til "✍️ Lim inn selv" for å redigere eller legge til egne mål
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
});