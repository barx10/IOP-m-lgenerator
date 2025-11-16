import React from 'react';
import otherNeedsData from '../data/otherNeeds.json';

interface OtherNeed {
  id: string;
  name: string;
  description: string;
}

interface OtherNeedsSelectorProps {
  selectedNeeds: string[];
  onSelectionChange: (needs: string[]) => void;
  maxSelections?: number;
}

export const OtherNeedsSelector: React.FC<OtherNeedsSelectorProps> = ({
  selectedNeeds,
  onSelectionChange,
  maxSelections = 5
}) => {
  const otherNeeds = otherNeedsData.otherNeeds as OtherNeed[];

  const handleToggle = (needId: string) => {
    if (selectedNeeds.includes(needId)) {
      // Fjern behov
      onSelectionChange(selectedNeeds.filter(id => id !== needId));
    } else if (selectedNeeds.length < maxSelections) {
      // Legg til behov
      onSelectionChange([...selectedNeeds, needId]);
    }
  };

  const isSelected = (needId: string) => selectedNeeds.includes(needId);
  const isDisabled = (needId: string) => 
    !isSelected(needId) && selectedNeeds.length >= maxSelections;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Velg relevante behov eller fokusområder for eleven
        </p>
        <span className="text-sm font-medium text-brand-blue">
          {selectedNeeds.length} / {maxSelections} valgt
        </span>
      </div>

      <div className="space-y-2">
        {otherNeeds.map((need) => {
          const selected = isSelected(need.id);
          const disabled = isDisabled(need.id);

          return (
            <button
              key={need.id}
              onClick={() => handleToggle(need.id)}
              disabled={disabled}
              className={`
                w-full p-4 rounded-lg border-2 transition-all duration-200
                text-left
                ${
                  selected
                    ? 'bg-teal-50 text-teal-900 border-teal-400 shadow-md'
                    : disabled
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium mb-1">{need.name}</div>
                  <div className="text-sm text-gray-600">{need.description}</div>
                </div>
                {selected && (
                  <div className="ml-3 flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-teal-600"
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
              </div>
            </button>
          );
        })}
      </div>

      {selectedNeeds.length === 0 && (
        <p className="text-sm text-gray-500 italic text-center py-4">
          Velg de behovene som er relevante for denne eleven
        </p>
      )}
    </div>
  );
};
