import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if in input/textarea or modals handling their own
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          // allow global esc to close things via other listeners
        } else {
          return;
        }
      }

      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        (window as any).openOpportunityForm?.();
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        // Focus first search input if present on page, or global
        const search = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
        if (search) search.focus();
      }
      if (e.key.toLowerCase() === 'k' && !e.metaKey) {
        e.preventDefault();
        // Quick nav hint - could expand to command palette
        window.location.hash = '#kanban'; // simple
        // Better: use router but for now
      }
      // Escape is handled by each Modal itself (close-on-Escape).
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
