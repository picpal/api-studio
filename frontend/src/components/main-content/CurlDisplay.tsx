import React from 'react';
import Button from '../ui/Button';

interface CurlDisplayProps {
    generateCurl: () => string;
    setShowCopyAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

const CurlDisplay: React.FC<CurlDisplayProps> = ({ generateCurl, setShowCopyAlert }) => {
    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-700">Generated cURL Command</h4>
                <Button
                    onClick={() => {
                        navigator.clipboard.writeText(generateCurl());
                        setShowCopyAlert(true);
                        setTimeout(() => setShowCopyAlert(false), 3000);
                    }}
                    variant="primary"
                    size="sm"
                >
                    Copy cURL
                </Button>
            </div>
            <pre className="flex-1 p-4 bg-gray-50 border border-gray-300 rounded text-sm font-mono overflow-auto whitespace-pre-wrap">
                {generateCurl()}
            </pre>
        </div>
    );
};

export default CurlDisplay;
