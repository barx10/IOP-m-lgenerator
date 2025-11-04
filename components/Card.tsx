import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = React.memo(({ title, children, icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-brand-blue/30 ${className}`}>
      <div className="p-5 sm:p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center space-x-3">
        {icon && <div className="text-brand-blue transform transition-transform duration-300 hover:scale-110">{icon}</div>}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6 sm:p-8 space-y-4">
        {children}
      </div>
    </div>
  );
});