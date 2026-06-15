import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t flex justify-end gap-2 bg-muted/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
