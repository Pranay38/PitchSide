import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[8px_8px_0px_rgba(57,255,20,0.1)] relative">
        <h2 className="text-2xl font-outfit font-black uppercase text-white mb-2">{title}</h2>
        <p className="text-zinc-400 font-inter mb-8">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 font-outfit font-bold uppercase tracking-wider text-white border-2 border-zinc-800 hover:bg-zinc-900 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-3 font-outfit font-bold uppercase tracking-wider text-black transition-transform hover:-translate-y-1 active:translate-y-0 ${
              isDestructive 
                ? 'bg-red-500 hover:shadow-[4px_4px_0px_#7f1d1d]' 
                : 'bg-[#39FF14] hover:shadow-[4px_4px_0px_#166534]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
