
import React from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface DocumentUploaderProps {
    // Define props if needed in the future
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = () => {
    // A placeholder implementation for the document uploader.
    // This component is not currently used in the main App, but filling it
    // prevents potential 'Uncaught' errors if it's imported elsewhere.
    return (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                    <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-brand-blue hover:text-brand-blue/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-blue"
                    >
                        <span>Last opp en fil</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">eller dra og slipp</p>
                </div>
                <p className="text-xs text-gray-500">PDF, TXT, HTML</p>
            </div>
        </div>
    );
};
