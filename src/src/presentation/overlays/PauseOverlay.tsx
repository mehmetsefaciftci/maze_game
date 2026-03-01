import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { createPortal } from 'react-dom';
import styles from './PauseOverlay.module.css';
import { useReducedMotion } from './hooks/useReducedMotion';
import { usePressFeedback } from './hooks/usePressFeedback';

type PauseAction = 'resume' | 'restart' | 'settings' | 'quit' | 'dismiss';

interface PauseOverlayProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onOpenSettings?: () => void;
  onRequestClose?: () => void;
}

const CLOSE_MS = 180;

function PauseIcon({ kind }: { kind: PauseAction }) {
  if (kind === 'resume') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'restart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5a7 7 0 1 0 6.55 9.45" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 3h5v5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === 'settings') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ActionButton({
  variant,
  label,
  icon,
  onClick,
  pulse,
  buttonRef,
}: {
  variant: 'primary' | 'secondary' | 'danger';
  label: string;
  icon: PauseAction;
  onClick: () => void;
  pulse?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const { pressed, handlers } = usePressFeedback();
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        variant === 'danger' ? styles.danger : '',
        pulse ? styles.primaryGlow : '',
        pressed ? styles.buttonPressed : '',
      ].join(' ')}
      {...handlers}
    >
      <span className={styles.icon}>
        <PauseIcon kind={icon} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function PauseOverlay({
  isOpen,
  onResume,
  onRestart,
  onQuit,
  onOpenSettings,
  onRequestClose,
}: PauseOverlayProps) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    if (reduceMotion) {
      setRendered(false);
      return;
    }
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, reduceMotion, rendered]);

  useEffect(() => {
    if (!rendered) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [rendered]);

  useEffect(() => {
    if (!rendered) return;
    const id = window.setTimeout(() => {
      firstButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [rendered]);

  useEffect(() => {
    if (!rendered) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        (onRequestClose ?? onResume)();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [rendered, onRequestClose, onResume]);

  // Mobile back button integration point:
  // On Capacitor/Android, subscribe App.addListener('backButton', ...) and call onRequestClose/onResume.

  const frameClass = useMemo(() => {
    if (reduceMotion) return '';
    return closing ? styles.close : styles.open;
  }, [closing, reduceMotion]);

  if (!rendered) return null;

  return createPortal(
    <div className={styles.portalRoot}>
      <div
        className={styles.overlay}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            (onRequestClose ?? onResume)();
          }
        }}
      >
        <div
          ref={dialogRef}
          className={`${styles.cardShell} ${frameClass}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className={styles.card}>
            <div className={styles.specular} />
            <div className={styles.ambientA} />
            <div className={styles.ambientB} />

            <div className={styles.content}>
              <h2 id="pause-title" className={styles.title}>
                Paused
              </h2>
              <p className={styles.subtitle}>Take a breath — you can resume anytime.</p>

              <div className={styles.actions}>
                <ActionButton
                  variant="primary"
                  label="Continue"
                  icon="resume"
                  onClick={onResume}
                  pulse={!reduceMotion}
                  buttonRef={firstButtonRef}
                />

                <div className={styles.row}>
                  <ActionButton variant="secondary" label="Restart" icon="restart" onClick={onRestart} />
                  <ActionButton
                    variant="secondary"
                    label="Settings"
                    icon="settings"
                    onClick={() => {
                      if (onOpenSettings) onOpenSettings();
                    }}
                  />
                  <ActionButton variant="danger" label="Quit" icon="quit" onClick={onQuit} />
                </div>

                <div className={styles.toggleRow}>
                  <button type="button" className={styles.toggleStub} aria-label="Toggle sound (stub)">
                    Sound
                  </button>
                  <button type="button" className={styles.toggleStub} aria-label="Toggle music (stub)">
                    Music
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/*
How to integrate
---------------
1) Keep your pause state in parent:
   const [paused, setPaused] = useState(false);

2) Render:
   <PauseOverlay
     isOpen={paused}
     onResume={() => setPaused(false)}
     onRestart={handleRestartLevel}
     onQuit={handlePauseMenu}
     onOpenSettings={handleOpenSettings}
     onRequestClose={() => setPaused(false)}
   />

3) Remove old pause modal markup to avoid duplicate overlays.
*/
