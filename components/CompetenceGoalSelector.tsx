import React from 'react';
import { Card } from './Card';
import { DocumentIcon } from './icons/DocumentIcon';
import { TextAreaField } from './TextAreaField';

interface CompetenceGoalSelectorProps {
    selectedSubject: string;
    pastedGoals: string;
    setPastedGoals: (goals: string) => void;
}

const MAX_GOAL_LENGTH = 200;

export const CompetenceGoalSelector: React.FC<CompetenceGoalSelectorProps> = React.memo(({ selectedSubject, pastedGoals, setPastedGoals }) => {
    
    const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_GOAL_LENGTH) {
            setPastedGoals(value);
        }
    };

    const remainingChars = MAX_GOAL_LENGTH - pastedGoals.length;
    const isNearLimit = remainingChars < 30;

    if (!selectedSubject) {
        return (
            <Card title="Kompetansemål" icon={<DocumentIcon />}>
                <p className="text-gray-500">Velg et fag i "Tema"-kortet over for å lime inn kompetansemål her.</p>
            </Card>
        );
    }

    return (
        <Card title={`Kompetansemål for ${selectedSubject}`} icon={<DocumentIcon />}>
            <div className="space-y-2">
                <TextAreaField
                    id="competenceGoals"
                    label="Lim inn det kompetansemålet som dekker best"
                    value={pastedGoals}
                    onChange={handleGoalChange}
                    placeholder="Lim inn ETT kompetansemål fra læreplanen som er mest relevant for temaet."
                    rows={6}
                />
                <div className="flex items-center justify-between text-xs">
                    <p className="text-gray-500">
                        💡 Tips: Velg det kompetansemålet som er mest relevant
                    </p>
                    <p className={`font-medium ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
                        {remainingChars} tegn igjen
                    </p>
                </div>
            </div>
        </Card>
    );
});