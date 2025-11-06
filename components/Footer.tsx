import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 py-6 mt-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <img 
                        src="/laererliv-logo.png" 
                        alt="Lærerliv logo" 
                        className="h-10 w-auto"
                    />
                    <p className="text-sm text-gray-600 font-medium">
                        Lærerliv © 2025
                    </p>
                </div>
            </div>
        </footer>
    );
};
