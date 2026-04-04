import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './common/Button';

interface SessionWarningDialogProps {
  isOpen: boolean;
  totalSeconds: number;       // total duration of the warning
  secondsLeft: number;        // current remaining seconds (from Parent)
  onKeepSession: () => void;  // user wants to stay
  onLogout: () => void;       // user wants to leave
}

export const SessionWarningDialog: React.FC<SessionWarningDialogProps> = ({
  isOpen,
  totalSeconds,
  secondsLeft,
  onKeepSession,
  onLogout,
}) => {
  // Logic removed: now a pure visual component controlled by App.tsx

  // Circular progress vars
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  // Color changes as time runs low
  const isUrgent = secondsLeft <= Math.floor(totalSeconds * 0.3);
  const circleColor = isUrgent ? '#ef4444' : '#cbf243'; // red or chartreuse

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 pointer-events-auto">
          {/* Backdrop — intentionally NOT dismissible on click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="relative w-full max-w-sm bg-surface-container rounded-[40px] p-8 border border-outline-variant/10 shadow-2xl flex flex-col items-center text-center gap-8"
          >
            {/* Circular countdown */}
            <div className="relative flex items-center justify-center">
              <svg width="140" height="140" className="-rotate-90">
                {/* Track */}
                <circle
                  cx="70" cy="70" r={radius}
                  strokeWidth="8"
                  stroke="rgba(255,255,255,0.06)"
                  fill="none"
                />
                {/* Progress arc */}
                <circle
                  cx="70" cy="70" r={radius}
                  strokeWidth="8"
                  stroke={circleColor}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
              </svg>

              {/* Time label in center */}
              <div className="absolute flex flex-col items-center leading-none">
                <span
                  className="font-headline font-black tabular-nums"
                  style={{
                    fontSize: secondsLeft >= 60 ? '2rem' : '2.5rem',
                    color: circleColor,
                    transition: 'color 0.5s ease',
                  }}
                >
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-outline mt-1">
                  {secondsLeft >= 60 ? 'min' : 'seg'}
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h3 className="font-headline text-2xl font-black uppercase italic leading-tight text-white tracking-tight">
                ¿SIGUES AHÍ?
              </h3>
              <p className="text-on-surface-variant text-xs font-medium leading-relaxed max-w-[260px]">
                Tu sesión de Kinetic está por vencer por inactividad. El contador se cerrará automáticamente.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full">
              <Button
                onClick={onLogout}
                variant="surface"
                className="flex-1 py-4 text-[10px] tracking-[0.2em] text-outline-variant"
              >
                Cerrar Ahora
              </Button>
              <Button
                onClick={onKeepSession}
                variant="secondary"
                className="flex-1 py-4 text-[10px] tracking-[0.3em] shadow-xl"
              >
                Seguir Aquí
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
