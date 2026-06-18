import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from '../Modal';

afterEach(cleanup);

function renderOpen(extra = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Modal isOpen onClose={onClose} title="Test Modal" {...extra}>
      <button>Inside</button>
    </Modal>,
  );
  return { onClose, ...utils };
}

describe('Modal', () => {
  it('does not render when closed', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Hidden"><div>x</div></Modal>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders an accessible dialog when open', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test Modal');
  });

  it('closes on Escape', () => {
    const { onClose } = renderOpen();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not on content click', () => {
    const { onClose } = renderOpen();
    fireEvent.click(screen.getByText('Inside')); // content -> stopPropagation
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement); // backdrop
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on close', () => {
    const { unmount } = renderOpen();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
