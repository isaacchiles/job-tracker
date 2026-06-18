import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Reads persisted data DIRECTLY from localStorage (not the Zustand store, which
// may be the thing that crashed) and downloads it, so the user can always
// recover a backup even when the app itself is broken.
function exportFromStorage() {
  try {
    const raw = localStorage.getItem('jobtracker:data') ?? '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtracker-recovery-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    alert('Could not read saved data from this browser.');
  }
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full rounded-lg border bg-card p-6 space-y-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The app hit an unexpected error. Your data is still saved in this browser —
            export a backup before reloading, just to be safe.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportFromStorage}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Export my data (JSON)
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
            >
              Reload app
            </button>
          </div>
          {this.state.error?.message && (
            <p className="text-xs text-muted-foreground break-words">
              Details: {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
