import React from 'react';
import socialGoalsData from '../data/socialGoals.json';

interface SocialGoal {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: string[];
}

interface SocialGoalsSelectorProps {
  selectedGoals: string[];
  onSelectionChange: (goals: string[]) => void;
  maxSelections?: number;
}

export const SocialGoalsSelector: React.FC<SocialGoalsSelectorProps> = ({
  selectedGoals,
  onSelectionChange,
  maxSelections = 3
}) => {
  const socialGoals = socialGoalsData.categories as SocialGoal[];

  const handleToggle = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      // Fjern mål
      onSelectionChange(selectedGoals.filter(id => id !== goalId));
    } else if (selectedGoals.length < maxSelections) {
      // Legg til mål
      onSelectionChange([...selectedGoals, goalId]);
    }
  };

  const isSelected = (goalId: string) => selectedGoals.includes(goalId);
  const isDisabled = (goalId: string) => 
    !isSelected(goalId) && selectedGoals.length >= maxSelections;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Velg opptil {maxSelections} sosiale mål som er relevante for eleven
        </p>
        <span className="text-sm font-medium text-brand-blue">
          {selectedGoals.length} / {maxSelections} valgt
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {socialGoals.map((goal) => {
          const selected = isSelected(goal.id);
          const disabled = isDisabled(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => handleToggle(goal.id)}
              disabled={disabled}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center justify-center text-center
                min-h-[100px]
                ${
                  selected
                    ? 'bg-purple-100 text-purple-900 border-purple-400 shadow-md scale-105'
                    : disabled
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-102'
                }
              `}
              title={goal.description}
            >
              <span className="text-3xl mb-2">{goal.icon}</span>
              <span className="text-sm font-medium leading-tight">
                {goal.name}
              </span>
              {selected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-2">Valgte sosiale mål:</h4>
          <ul className="space-y-2">
            {selectedGoals.map((goalId) => {
              const goal = socialGoals.find((g) => g.id === goalId);
              return goal ? (
                <li key={goalId} className="flex items-start space-x-2">
                  <span className="text-lg">{goal.icon}</span>
                  <div>
                    <span className="font-medium text-gray-900">{goal.name}</span>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
