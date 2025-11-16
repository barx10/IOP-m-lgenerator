import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
    value: string;
    onSave: (newValue: string) => void;
    label?: string;
    multiline?: boolean;
    className?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onSave,
    label,
    multiline = false,
    className = ''
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    // Sync editValue when value prop changes
    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className={`group relative ${className}`}>
                <p className="text-base text-gray-800 leading-relaxed pr-8 whitespace-pre-line">{value}</p>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent parent click handlers
                        setIsEditing(true);
                    }}
                    className="absolute top-0 right-0 opacity-50 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                    title="Klikk for å redigere"
                >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className={className} onClick={(e) => e.stopPropagation()}>
            {multiline ? (
                <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-base text-gray-800 leading-relaxed"
                    rows={4}
                    autoFocus
                />
            ) : (
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-base text-gray-800"
                    autoFocus
                />
            )}
            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-brand-blue text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                    ✓ Lagre
                </button>
                <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                >
                    ✕ Avbryt
                </button>
            </div>
        </div>
    );
};
