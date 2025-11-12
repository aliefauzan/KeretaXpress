import React from 'react';
import Button from '../Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  loadingText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  confirmText = 'OK',
  cancelText = 'Batal',
  onConfirm,
  isLoading = false,
  loadingText = 'Memproses...',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'confirm':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-primary hover:bg-primary-dark';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        
        <div className={`flex ${type === 'confirm' ? 'space-x-3' : 'justify-end'}`}>
          {type === 'confirm' && (
            <Button
              onClick={onClose}
              variant="outline"
              size="md"
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            variant="primary"
            size="md"
            disabled={isLoading}
            className={`${type === 'confirm' ? 'flex-1' : 'px-8'} ${getButtonColor()}`}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
