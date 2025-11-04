import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { XIcon } from './icons/XIcon';
import type { CoreElement } from '../types';

interface CoreElementsModalProps {
    subject: string;
    coreElements: CoreElement[];
    selectedCoreElement: string;
    onToggleCoreElement: (element: string) => void;
    onClose: () => void;
    title?: string; // Optional custom title
}

export const CoreElementsModal: React.FC<CoreElementsModalProps> = React.memo(({ subject, coreElements, selectedCoreElement, onToggleCoreElement, onClose, title }) => {
    const modalTitle = title || `Velg kjerneelementer for ${subject}`;
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full relative transform transition-all flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-200/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="text-brand-blue bg-brand-lightblue p-2 rounded-lg">
                            <BookOpenIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">{modalTitle}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue rounded-full p-1">
                        <span className="sr-only">Lukk</span>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-3">
                        {coreElements.map((element, index) => (
                            <label key={index} htmlFor={`element-${index}`} className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                                <input
                                    type="radio"
                                    name="coreElement"
                                    id={`element-${index}`}
                                    checked={selectedCoreElement === element.name}
                                    onChange={() => onToggleCoreElement(element.name)}
                                    className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue mt-1 flex-shrink-0"
                                />
                                <div className="ml-3 flex-1">
                                    <span className="text-sm font-medium text-gray-900 block">{element.name}</span>
                                    <span className="text-xs text-gray-600 block mt-1">{element.description}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
                 <div className="p-4 bg-gray-50/50 text-right rounded-b-xl border-t border-gray-200/80 mt-auto">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-brand-blue text-white text-sm font-medium rounded-md shadow-sm hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                    >
                        Lukk
                    </button>
                </div>
            </div>
        </div>
    );
});