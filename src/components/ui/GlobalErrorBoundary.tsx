import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught application render error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0C0A09',
          color: '#F5F0E8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem', color: '#D4622A' }}>
            SOMETHING WENT WRONG
          </h1>
          <p style={{ maxWidth: '30rem', fontSize: '1rem', lineHeight: '1.6', color: '#DDD0B8', marginBottom: '2rem' }}>
            The application encountered an unexpected runtime error and was forced to reload. If this issue persists, please check your network connection or contact customer operations.
          </p>
          <button
            onClick={() => { window.location.reload(); }}
            style={{
              backgroundColor: '#B5533C',
              color: '#0C0A09',
              border: 'none',
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            RELOAD APPLICATION
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
