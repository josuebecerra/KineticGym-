import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RestState } from '../types';

interface RestProps {
  restState: RestState;
  setRestState: React.Dispatch<React.SetStateAction<RestState>>;
  onBack?: () => void;
}

export const Rest: React.FC<RestProps> = ({ restState, setRestState, onBack }) => {
  const { timeLeft, totalTime, isActive } = restState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setRestState(prev => ({ ...prev, isActive: false, timeLeft: prev.totalTime }));
  };

  const handleToggle = () => {
    setRestState(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleAdd = (secs: number) => {
    setRestState(prev => {
      const newTimeLeft = prev.timeLeft + secs;
      return {
        ...prev,
        timeLeft: newTimeLeft,
        totalTime: newTimeLeft > prev.totalTime ? newTimeLeft : prev.totalTime
      };
    });
  };

  const selectPreset = (secs: number) => {
    setRestState({
      isActive: true,
      totalTime: secs,
      timeLeft: secs
    });
  };

  // SVG Ring calculation
  const radius = 43; // Radios menores previenen el recorte en los bordes del viewBox
  const circumference = 2 * Math.PI * radius;
  const percentage = (totalTime && totalTime > 0) ? (timeLeft / totalTime) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col px-6 py-8 pb-32 overflow-hidden"
    >
      {/* Simplified Background Glow - No overflow-hidden container */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? [0.1, 0.2, 0.1] : 0.05
          }}
          transition={{ repeat: Infinity, duration: 5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center flex-1 justify-between gap-12">
        {/* Header */}
        <div className="text-center">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-secondary font-headline font-bold uppercase tracking-[0.3em] text-[10px]"
          >
            Recuperación Activa
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface font-headline font-black text-6xl mt-2 tracking-tighter"
          >
            DESCANSO
          </motion.h1>
        </div>

        {/* Immersive Timer Ring */}
        <div className="relative w-[70vw] h-[70vw] max-w-[320px] max-h-[320px] md:max-w-[450px] md:max-h-[450px] flex items-center justify-center bg-transparent shrink-0">
          <svg className="absolute w-full h-full -rotate-90 bg-transparent overflow-visible" viewBox="0 0 100 100">
            <circle 
              className="text-surface-container-highest/30" 
              cx="50" cy="50" fill="none" r={radius} 
              stroke="var(--color-surface-container-highest, #262626)" strokeWidth="3" 
            />
            <motion.circle 
              className="text-secondary drop-shadow-[0_0_8px_rgba(255,116,65,0.4)]" 
              cx="50" cy="50" fill="none" r={radius} 
              stroke="var(--color-secondary, #ff7441)" strokeWidth="4" 
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ ease: "linear", duration: 1 }}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="text-center z-10">
            <AnimatePresence mode="wait">
              <motion.div 
                key={timeLeft}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-headline font-black text-7xl sm:text-8xl md:text-[140px] tracking-tighter text-on-surface tabular-nums leading-none"
              >
                {formatTime(timeLeft)}
              </motion.div>
            </AnimatePresence>
            <motion.div 
              animate={{ opacity: isActive ? [0.4, 1, 0.4] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-outline font-headline font-bold text-[10px] uppercase tracking-[0.4em] mt-4"
            >
              {isActive ? 'Cronómetro Corriendo' : 'Pausado'}
            </motion.div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="w-full max-w-lg space-y-10">
          <div className="flex items-center justify-center gap-8">
            <button 
              onClick={handleReset}
              className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface hover:text-secondary transition-all active:scale-90 flex items-center justify-center border border-outline-variant/10 group"
            >
              <span className="material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform duration-500">refresh</span>
            </button>
            
            <button 
              onClick={handleToggle}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl active:scale-[0.98] transition-all relative overflow-hidden group ${isActive ? 'bg-surface-container-highest text-secondary border border-secondary/30' : 'bg-secondary text-on-secondary shadow-secondary/40'}`}
            >
              <AnimatePresence mode="wait">
                <motion.span 
                  key={isActive ? 'pause' : 'play'}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  className="material-symbols-outlined text-5xl relative z-10" 
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isActive ? 'pause' : 'play_arrow'}
                </motion.span>
              </AnimatePresence>
              {!isActive && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
            </button>

            <button 
              onClick={() => handleAdd(30)}
              className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface hover:text-secondary transition-all active:scale-90 flex items-center justify-center border border-outline-variant/10"
            >
              <span className="font-headline font-black text-sm">+30s</span>
            </button>
          </div>

          {/* Quick Targets Row */}
          <div className="flex gap-3 overflow-x-auto pb-4 justify-start no-scrollbar px-1">
             {[30, 60, 90, 120, 180].map(s => (
               <button 
                 key={s}
                 onClick={() => selectPreset(s)} 
                 className={`px-6 py-2.5 rounded-full font-headline font-bold text-[10px] uppercase tracking-widest transition-all shrink-0 border ${totalTime === s ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-secondary'}`}
               >
                 {s < 60 ? `${s}s` : `${s/60}m`}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Info Sections - More integrated */}
      <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface-container-high/50 backdrop-blur-md rounded-[32px] p-8 border border-outline-variant/10 flex flex-col justify-between group overflow-hidden"
        >
          <div className="relative">
            <span className="text-secondary font-black text-[10px] uppercase tracking-widest block mb-1">Próxima Misión</span>
            <h2 className="text-3xl font-headline font-black text-on-surface uppercase italic">Sentadilla con Barra</h2>
            <div className="mt-6 flex gap-6">
              <div>
                <p className="text-[10px] font-black text-outline uppercase tracking-widest">Serie</p>
                <p className="text-xl font-headline font-black text-primary-container">3 / 4</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-outline uppercase tracking-widest">Carga</p>
                <p className="text-xl font-headline font-black text-primary-container">85 KG</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-outline group-hover:text-secondary transition-colors cursor-pointer">
            <span className="text-[10px] font-bold uppercase tracking-widest">Ver Detalles Técnica</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
          
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <span className="material-symbols-outlined text-9xl">fitness_center</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-surface-container-low/50 backdrop-blur-md rounded-[32px] p-8 border border-outline-variant/10 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-outline font-black text-[10px] uppercase tracking-widest">Ritmo Cardiaco</span>
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="material-symbols-outlined text-secondary text-2xl"
              >
                favorite
              </motion.span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-on-surface font-headline font-black text-5xl">124</span>
              <span className="text-secondary font-bold text-xs uppercase italic">bpm</span>
            </div>
          </div>
          
          <div className="mt-8 h-12 flex items-end gap-1.5 opacity-40">
            {[40, 60, 30, 80, 50, 70, 90, 60, 45, 70, 30, 50].map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="flex-1 bg-secondary rounded-full" 
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Action Button */}
      {onBack && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex justify-center w-full z-20"
        >
          <button 
            onClick={onBack}
            className="w-full max-w-md bg-secondary text-on-secondary font-headline font-black uppercase tracking-widest text-[12px] py-5 rounded-[24px] shadow-xl active:scale-95 transition-all shadow-secondary/20"
          >
            VOLVER AL ENTRENAMIENTO
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
;
