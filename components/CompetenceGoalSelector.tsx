import React, { useCallback } from 'react';
import { Card } from './Card';
import { DocumentIcon } from './icons/DocumentIcon';
import { curriculumData } from '../services/curriculumData';

interface CompetenceGoalSelectorProps {
    selectedSubject: string;
    selectedGoals: string[];
    setSelectedGoals: (goals: string[]) => void;
}

export const CompetenceGoalSelector: React.FC<CompetenceGoalSelectorProps> = React.memo(({ selectedSubject, selectedGoals, setSelectedGoals }) => {
    
    const handleGoalChange = useCallback((goal: string) => {
        if (selectedGoals.includes(goal)) {
            setSelectedGoals(selectedGoals.filter(g => g !== goal));
        } else {
            setSelectedGoals([...selectedGoals, goal]);
        }
    }, [selectedGoals, setSelectedGoals]);

    const subjectData = curriculumData[selectedSubject];

    if (!selectedSubject || !subjectData) {
        return (
            <Card title="Velg kompetansemål" icon={<DocumentIcon />}>
                <p className="text-gray-500">Velg et fag i "Tema"-kortet over for å se relevante kompetansemål her.</p>
            </Card>
        );
    }

    return (
        <Card title={`Velg kompetansemål for ${selectedSubject}`} icon={<DocumentIcon />}>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {subjectData.goals.map((goal, index) => (
                    <label key={index} htmlFor={`goal-${index}`} className="flex items-start p-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            id={`goal-${index}`}
                            checked={selectedGoals.includes(goal)}
                            onChange={() => handleGoalChange(goal)}
                            className="h-4 w-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue mt-1"
                        />
                        <span className="ml-3 text-sm text-gray-700">{goal}</span>
                    </label>
                ))}
            </div>
        </Card>
    );
});