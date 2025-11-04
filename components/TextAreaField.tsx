import React from 'react';

export const TextAreaField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    rows?: number;
    placeholder?: string;
}> = React.memo(({ id, label, value, onChange, rows = 3, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <textarea
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            rows={rows}
            className="mt-1 block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900 transition-all"
            placeholder={placeholder}
        />
    </div>
));