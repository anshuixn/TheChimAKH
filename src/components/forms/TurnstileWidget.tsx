import React, { useEffect, useRef, useState } from 'react';
import { getTurnstileSiteKey, isTurnstileConfigured } from '../../lib/clientEnv';
import styles from './TurnstileWidget.module.css';

export type TurnstileState = 'idle' | 'loading' | 'verified' | 'expired' | 'error';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
}

// Declares the Turnstile global object
interface TurnstileInstance {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      theme?: 'light' | 'dark' | 'auto';
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
    onloadTurnstileCallback?: () => void;
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onExpire,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<TurnstileState>('idle');

  useEffect(() => {
    // If turnstile site key is unconfigured (development mode), skip loading widget
    if (!isTurnstileConfigured()) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setStatus('verified');
      onVerify('development_bypass_token');
      return;
    }

    setStatus('loading');

    // Callback when script loads
    window.onloadTurnstileCallback = () => {
      renderWidget();
    };

    // Load Turnstile script if not already present
    let script = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    }

    function renderWidget() {
      if (!window.turnstile || !containerRef.current) return;

      try {
        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: getTurnstileSiteKey(),
          theme: 'dark',
          callback: (token) => {
            setStatus('verified');
            onVerify(token);
          },
          'expired-callback': () => {
            setStatus('expired');
            onExpire();
          },
          'error-callback': () => {
            setStatus('error');
            onError();
          },
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('[TurnstileWidget] Render failed:', err);
        setStatus('error');
        onError();
      }
    }

    return () => {
      // Cleanup widget instance on unmount
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Silent catch
        }
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onExpire, onError]);

  // Accessible descriptive status labels
  const getStatusText = (): string => {
    switch (status) {
      case 'loading':
        return 'SECURE CONNECTIONS ARE SYNCHRONIZING — PLEASE WAIT.';
      case 'verified':
        return 'VERIFICATION COMPLETE. SECURITY CLEARANCE CONFIRMED.';
      case 'expired':
        return 'SECURITY CHALLENGE TOKEN EXPIRED. REQUESTING RE-VERIFICATION.';
      case 'error':
        return 'SECURITY VERIFICATION OUTAGE. PLEASE REFRESH THE WEB PAGE.';
      case 'idle':
      default:
        return 'SECURITY AUDIT INITIALIZED.';
    }
  };

  return (
    <div className={styles.widgetWrapper}>
      <div 
        ref={containerRef} 
        className={styles.widgetContainer}
        aria-hidden="true" // Hide raw widget internals from screen readers
      />
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
      >
        {getStatusText()}
      </div>
    </div>
  );
};

export default TurnstileWidget;
