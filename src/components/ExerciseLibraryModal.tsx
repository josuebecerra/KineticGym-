import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Exercise } from '../types';

interface ExerciseLibraryModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({ exercise, onClose }) => {
  return (
    <AnimatePresence>
      {exercise && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-surface-container-low border border-outline-variant/20 rounded-[40px] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Banner */}
            <div className="relative h-48 sm:h-64 bg-surface-container-high overflow-hidden">
              {exercise.image ? (
                <img 
                  src={exercise.image} 
                  alt={exercise.name} 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                  <span className="material-symbols-outlined text-6xl text-secondary/20">fitness_center</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />
              
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-secondary hover:text-black transition-all group"
              >
                <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-90">close</span>
              </button>

              <div className="absolute bottom-6 left-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-secondary text-background text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {exercise.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface text-[10px] font-black uppercase tracking-widest rounded-full border border-outline-variant/20">
                    {exercise.muscle}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-headline font-black italic uppercase tracking-tighter text-white">
                  {exercise.name}
                </h2>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 space-y-8">
              {/* Muscles Section */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Músculos Primarios</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.primaryMuscles?.map((m) => (
                      <span key={m} className="px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-xl text-[11px] font-bold text-secondary uppercase tracking-wider">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Músculos Secundarios</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.secondaryMuscles?.map((m) => (
                      <span key={m} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-outline uppercase tracking-wider">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] border-b border-outline-variant/10 pb-2">Técnica y Ejecución</h4>
                <p className="text-on-surface/80 text-sm leading-relaxed font-medium">
                  {exercise.description}
                </p>
              </div>

              {/* Pro Tips & Safety */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-[32px] bg-secondary/5 border border-secondary/10 space-y-3">
                  <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-sm font-black">verified</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Kinetic Tip</span>
                  </div>
                  <ul className="space-y-2">
                    {exercise.benefits?.map((b, i) => (
                      <li key={i} className="text-[11px] font-bold text-on-surface opacity-70 flex gap-2">
                        <span className="text-secondary">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-[32px] bg-error/5 border border-error/10 space-y-3">
                  <div className="flex items-center gap-2 text-error">
                    <span className="material-symbols-outlined text-sm font-black">warning</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Seguridad</span>
                  </div>
                  <ul className="space-y-2">
                    {exercise.safety?.map((s, i) => (
                      <li key={i} className="text-[11px] font-bold text-on-surface opacity-70 flex gap-2">
                        <span className="text-error">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-outline-variant/10 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.95]"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
