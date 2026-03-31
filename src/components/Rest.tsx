import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Rest: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(90);
  const [totalTime, setTotalTime] = useState(90);
  const [isActive, setIsActive] = useState(false);

  // Sound notification using Web Audio API
  const playEndSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn('Audio not supported or blocked', e);
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playEndSound();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playEndSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
  };

  const handleAdd = (secs: number) => {
    setTimeLeft((prev) => prev + secs);
    // Adjust totalTime if we exceed it to avoid negative offset
    if (timeLeft + secs > totalTime) {
      setTotalTime(timeLeft + secs);
    }
  };

  const selectPreset = (secs: number) => {
    setIsActive(false);
    setTotalTime(secs);
    setTimeLeft(secs);
  };

  // SVG Ring calculation
  const radius = 48; // Percentage
  const circumference = 2 * Math.PI * radius;
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 pt-8 pb-24 space-y-12"
    >
      {/* Header */}
      <div>
        <span className="text-secondary font-headline font-bold uppercase tracking-[0.2em] text-[10px]">Tiempo de Recuperación</span>
        <h1 className="text-on-surface font-headline font-black text-5xl mt-1 tracking-tight">DESCANSO</h1>
      </div>

      {/* Timer Module */}
      <section className="relative flex flex-col items-center justify-center">
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              className="text-surface-container-highest" 
              cx="50" cy="50" fill="transparent" r={radius} 
              stroke="currentColor" strokeWidth="4" 
            />
            <motion.circle 
              className="text-primary-container" 
              cx="50" cy="50" fill="transparent" r={radius} 
              stroke="currentColor" strokeWidth="4" 
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ ease: "linear", duration: 1 }}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0px 0px 8px rgba(243, 255, 202, 0.4))' }}
            />
          </svg>
          <div className="text-center z-10">
            <motion.div 
              key={timeLeft}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-headline font-black text-7xl md:text-9xl tracking-tighter text-on-surface tabular-nums"
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className="text-secondary font-headline font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Segundos Restantes</div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-6 mt-12 w-full max-w-md">
          <button 
            onClick={handleReset}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary-container transition-colors active:scale-90 duration-200 shadow-lg"
          >
            <span className="material-symbols-outlined text-2xl">refresh</span>
            <span className="text-[9px] font-black uppercase mt-1">Reiniciar</span>
          </button>
          
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${isActive ? 'bg-surface-container-highest text-secondary border-2 border-secondary' : 'secondary-gradient text-on-secondary shadow-secondary/30'}`}
          >
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isActive ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button 
            onClick={() => handleAdd(30)}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary-container transition-colors active:scale-90 duration-200 shadow-lg"
          >
            <span className="font-headline font-black text-lg">+30s</span>
            <span className="text-[9px] font-black uppercase">Añadir</span>
          </button>
        </div>

        {/* Preset & Rapid Add Row */}
        <div className="flex gap-2 mt-8 overflow-x-auto pb-4 w-full max-w-md justify-center no-scrollbar">
           {[30, 60, 90, 120, 180].map(s => (
             <button 
               key={s}
               onClick={() => selectPreset(s)} 
               className="px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/10 font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant hover:border-primary-container shrink-0"
             >
               {s < 60 ? `${s}s` : `${s/60}m`}
             </button>
           ))}
           <button onClick={() => handleAdd(60)} className="px-5 py-2 rounded-full kinetic-gradient font-headline font-black text-[10px] uppercase tracking-widest text-on-primary-container shrink-0">+1m</button>
        </div>
      </section>

      {/* Bento Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-high rounded-[32px] p-8 overflow-hidden relative group min-h-[200px] border border-outline-variant/5 shadow-xl">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 group-hover:opacity-40 transition-opacity">
            <img 
              alt="Next exercise" 
              className="w-full h-full object-cover grayscale" 
              src="https://images.unsplash.com/photo-1541534741688-6078c64b52d3?q=80&w=2070&auto=format&fit=crop"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">SIGUIENTE EJERCICIO</span>
              <h2 className="text-on-surface font-headline font-black text-3xl mt-4 leading-none uppercase tracking-tighter">Sentadilla con <br/>Barra Trasera</h2>
            </div>
            <div className="mt-8 flex gap-8">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-outline block mb-1">SERIES</span>
                <span className="text-primary-container font-headline font-black text-2xl">3 / 4</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-outline block mb-1">PESO</span>
                <span className="text-primary-container font-headline font-black text-2xl">85 KG</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-outline block mb-1">REPS</span>
                <span className="text-primary-container font-headline font-black text-2xl">10</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[32px] p-8 flex flex-col justify-between border border-outline-variant/5 shadow-md">
          <div>
            <span className="material-symbols-outlined text-secondary text-4xl mb-4">monitor_heart</span>
            <h3 className="text-outline font-black text-[10px] uppercase tracking-widest">Rendimiento Cardiaco</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-on-surface font-headline font-black text-5xl"
              >
                124
              </motion.span>
              <span className="text-secondary font-black text-xs">BPM</span>
            </div>
          </div>
          <div className="mt-6 h-12 flex items-end gap-1.5 grayscale opacity-50">
            {[40, 60, 30, 80, 50, 70, 90, 60, 45].map((h, i) => (
              <div key={i} className="flex-1 bg-secondary rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
