import React from 'react';
import { Card } from './Card';
import { DocumentIcon } from './icons/DocumentIcon';
import { TextAreaField } from './TextAreaField';

interface CompetenceGoalSelectorProps {
    selectedSubject: string;
    pastedGoals: string;
    setPastedGoals: (goals: string) => void;
}

export const CompetenceGoalSelector: React.FC<CompetenceGoalSelectorProps> = React.memo(({ selectedSubject, pastedGoals, setPastedGoals }) => {
    
    if (!selectedSubject) {
        return (
            <Card title="Kompetansemål" icon={<DocumentIcon />}>
                <p className="text-gray-500">Velg et fag i "Tema"-kortet over for å lime inn kompetansemål her.</p>
            </Card>
        );
    }

    return (
        <Card title={`Kompetansemål for ${selectedSubject}`} icon={<DocumentIcon />}>
            <TextAreaField
                id="competenceGoals"
                label="Lim inn relevante kompetansemål her"
                value={pastedGoals}
                onChange={(e) => setPastedGoals(e.target.value)}
                placeholder="Lim inn ett eller flere kompetansemål fra læreplanen, ett per linje for best resultat."
                rows={6}
            />
        </Card>
    );
});