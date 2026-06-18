import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

afterEach(cleanup);

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(<ErrorBoundary><div>safe content</div></ErrorBoundary>);
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('shows the recovery UI (with data export) when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument();
    spy.mockRestore();
  });
});
