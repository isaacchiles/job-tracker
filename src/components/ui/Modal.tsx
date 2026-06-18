import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Ref-counted body scroll lock so that opening/closing stacked modals (or one
// modal handing off to another) can never leave the page permanently locked.
let openModalCount = 0;
function lockBodyScroll() {
  openModalCount += 1;
  if (openModalCount === 1) document.body.style.overflow = 'hidden';
}
function unlockBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) document.body.style.overflow = '';
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  // Close on Escape.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  // Move focus into the dialog on open; restore it to the trigger on close.
  React.useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused.current?.focus?.();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="bg-card rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden border outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">✕</button>
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
    </div>,
    document.body
  );
}
