import React from 'react';

interface AlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50">
      <div className="flex items-center">
        <span className="text-sm">⚠️ {message}</span>
        <button
          onClick={onClose}
          className="ml-3 text-yellow-700 hover:text-yellow-900"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Alert;