import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkoutState, RestState, Screen } from '../types';
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';

interface FloatingTimerProps {
  type: 'workout' | 'rest';
  workoutState?: WorkoutState;
  restState?: RestState;
  setRestState?: React.Dispatch<React.SetStateAction<RestState>>;
  onNavigate: (screen: Screen) => void;
  isVisible: boolean;
}

export const FloatingTimer: React.FC<FloatingTimerProps> = ({ 
  type,
  workoutState, 
  restState, 
  setRestState, 
  onNavigate,
  isVisible
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Persistence state
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem(`kinetic_drag_v2_${type}`);
    if (saved) return JSON.parse(saved);
    // Initial separation
    return type === 'workout' ? { x: 0, y: -70 } : { x: 0, y: 0 };
  });

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAdd30s = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Capacitor.isNativePlatform()) Haptics.selectionChanged();
    if (setRestState) {
      setRestState(prev => ({ 
        ...prev, 
        timeLeft: prev.timeLeft + 30,
        totalTime: prev.totalTime + 30
      }));
    }
  };

  const handleSkipRest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Capacitor.isNativePlatform()) Haptics.selectionChanged();
    if (setRestState) {
      setRestState(prev => ({ ...prev, isActive: false, timeLeft: 0 }));
    }
  };

  if (!isVisible) return null;

  const isResting = type === 'rest' && restState && restState.isActive && restState.timeLeft > 0;
  
  // Percentage for ring (only if rest)
  const percentage = (isResting && restState) ? (restState.timeLeft / restState.totalTime) * 100 : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className="fixed right-6 z-[100] pointer-events-none"
      style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <motion.div 
        drag
        dragMomentum={false}
        // Use animate to drive position for persistence to work with motion's mount/unmount
        animate={{ x: pos.x, y: pos.y }}
        onDragEnd={(_, info) => {
          const newPos = { x: pos.x + info.offset.x, y: pos.y + info.offset.y };
          setPos(newPos);
          localStorage.setItem(`kinetic_drag_v2_${type}`, JSON.stringify(newPos));
        }}
        className="pointer-events-auto flex flex-col items-end gap-3"
      >
        <AnimatePresence>
          {isExpanded && isResting && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="flex gap-2"
            >
              <button 
                onClick={handleAdd30s}
                className="bg-surface-container-highest border-2 border-outline-variant/20 px-4 py-2 rounded-2xl text-[10px] font-black text-secondary uppercase tracking-widest shadow-xl active:scale-90 transition-transform"
              >
                +30s
              </button>
              <button 
                onClick={handleSkipRest}
                className="bg-secondary text-on-secondary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-90 transition-transform border-b-4 border-black/20"
              >
                SALTAR
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          onClick={() => {
            if (isResting) {
              setIsExpanded(!isExpanded);
            } else {
              onNavigate('entrenar');
            }
          }}
          className={`relative group flex items-center gap-3 p-3 pr-5 rounded-[28px] border-2 shadow-2xl cursor-grab active:cursor-grabbing transition-all active:scale-[0.98] overflow-hidden ${
            isResting 
              ? 'bg-secondary border-black shadow-black/40' 
              : 'bg-surface-container-high border-outline-variant/10 shadow-black/20'
          }`}
        >
          {/* Progress Ring / Icon */}
          <div className="relative w-10 h-10 shrink-0 pointer-events-none">
            <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 40 40">
              <circle 
                cx="20" cy="20" r={radius} 
                fill="none" 
                stroke={isResting ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'} 
                strokeWidth="3" 
              />
              {isResting && restState && (
                <motion.circle 
                  cx="20" cy="20" r={radius} 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="3" 
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ ease: "linear", duration: 1 }}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`material-symbols-outlined text-xl ${isResting ? 'text-white' : 'text-primary-container'}`}>
                {isResting ? 'timer' : 'fitness_center'}
              </span>
            </div>
          </div>

          {/* Labels & Time */}
          <div className="flex flex-col select-none pointer-events-none">
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${isResting ? 'text-black/60' : 'text-outline'}`}>
              {isResting ? 'Descansando' : 'Entrenando'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-headline font-black text-xl tabular-nums leading-none italic tracking-tight ${isResting ? 'text-white underline decoration-black/20 underline-offset-4' : 'text-white'}`}>
                {formatTime(isResting ? restState?.timeLeft || 0 : workoutState?.elapsedSeconds || 0)}
              </span>
              {isResting && restState && restState.timeLeft < 10 && (
                <motion.span 
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="w-1.5 h-1.5 bg-white rounded-full ml-1"
                />
              )}
            </div>
          </div>

          {/* Adrenaline pulse for last bits of rest */}
          {isResting && restState && restState.timeLeft < 10 && (
            <motion.div 
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute inset-0 bg-white"
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
