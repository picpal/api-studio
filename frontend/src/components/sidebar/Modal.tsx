import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  error?: string | null;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  value,
  placeholder,
  onValueChange,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  error
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-80">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onConfirm();
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          autoFocus
        />
        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
            disabled={!value.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;