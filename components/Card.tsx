
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-200/80 bg-gray-50/50 flex items-center space-x-3">
        {icon && <div className="text-brand-blue">{icon}</div>}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        {children}
      </div>
    </div>
  );
};
