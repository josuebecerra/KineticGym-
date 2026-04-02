import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkoutSession } from '../types';

interface HistoryProps {
  sessions: WorkoutSession[];
  onDeleteSession?: (session: WorkoutSession) => void;
}

export const History: React.FC<HistoryProps> = ({ sessions, onDeleteSession }) => {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 pt-4 pb-24 space-y-8"
    >
      {/* Editorial Header */}
      <section>
        <span className="font-label text-primary-container uppercase tracking-[0.2em] text-[10px] font-bold">Registro de Rendimiento</span>
        <h1 className="font-headline text-4xl font-black tracking-tighter mt-1">Historial</h1>
        <div className="flex gap-2 mt-4">
          <div className="bg-surface-container-high px-3 py-1 rounded-full text-[12px] font-semibold text-on-surface-variant">
            {new Date().toLocaleString('es-ES', { month: 'long' })}
          </div>
          <div className="bg-surface-container-high px-3 py-1 rounded-full text-[12px] font-semibold text-on-surface-variant">
            {sessions.length} Sesiones
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {sessions.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">history</span>
            <p className="font-headline font-bold uppercase tracking-widest text-sm">No hay registros aún</p>
          </div>
        ) : sessions.map((session, index) => (
          <article 
            key={session.id} 
            onClick={() => setSelectedSession(session)}
            className={index === 0 
              ? "bg-surface-container-high rounded-xl overflow-hidden relative shadow-lg active:scale-[0.98] transition-transform cursor-pointer" 
              : "bg-surface-container-low p-6 rounded-xl flex justify-between items-center group active:scale-[0.98] transition-transform cursor-pointer border border-outline-variant/5"
            }
          >
            {index === 0 ? (
              <>
                <div className="absolute top-0 right-0 p-4 flex gap-2 items-center">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session);
                    }}
                    className="relative z-[60] w-12 h-12 rounded-full bg-error/10 backdrop-blur-md flex items-center justify-center text-error hover:bg-error/20 transition-all active:scale-[0.85]"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                  <span className="bg-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase text-on-secondary tracking-widest shadow-lg">Última</span>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <p className="font-label text-on-surface-variant text-xs mb-1 uppercase tracking-widest font-bold opacity-70">{session.date}</p>
                    <h2 className="font-headline text-3xl font-black tracking-tight uppercase leading-none">{session.name}</h2>
                  </div>
                  <div className="flex gap-8 mb-8">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] text-outline mb-1 font-black">Duración</p>
                      <p className="font-headline text-2xl font-bold text-on-surface">{session.duration}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] text-outline mb-1 font-black">Volumen</p>
                      <p className="font-headline text-2xl font-bold text-secondary">{session.volume}</p>
                    </div>
                  </div>
                  <div className="space-y-4 border-t border-outline-variant/15 pt-6">
                    {session.exercises.slice(0, 3).map((ex, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="font-black text-xs uppercase tracking-wider text-on-surface">{ex.name}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-70 uppercase tracking-tighter">
                            {ex.sets.length} series • {Math.max(...ex.sets.map(s => s.reps))} reps máx
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    ))}
                    {session.exercises.length > 3 && (
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest text-center pt-2">
                        + {session.exercises.length - 3} ejercicios más
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-2 kinetic-gradient w-full" />
              </>
            ) : (
              <>
                <div>
                  <p className="font-label text-on-surface-variant text-[10px] mb-1 font-bold opacity-60 uppercase tracking-widest">{session.date}</p>
                  <h3 className="font-headline text-xl font-extrabold tracking-tight mb-2 uppercase leading-none">{session.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
                      <span className="text-xs font-bold text-on-surface-variant">{session.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">fitness_center</span>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">{session.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-outline uppercase tracking-widest">Volumen</p>
                    <p className="font-headline font-bold text-sm">{session.volume}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session);
                    }}
                    className="relative z-50 w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-error hover:bg-error/5 transition-all active:scale-[0.85]"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors">chevron_right</span>
                </div>
              </>
            )}
          </article>
        ))}

        {/* Aesthetic Card */}
        <div className="relative h-48 rounded-xl overflow-hidden mt-8 flex flex-col justify-end p-6 border border-outline-variant/10 shadow-xl">
          <img 
            alt="Gym mood" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 scale-110" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrxkIA3RBgeg10PDKSQ8eWPRdiqBrDGnYMG6uSZX9dAYuMGiQb3cwse7PAZmtPjuPepcQnxC4FEhZHJ-iUsLlsdVNB09ou-Rvqso3ujuz9vIadv903Q7YLV-NaoQQHIYW2tZ1C7wD8Hr66Au54ehKn3giICRNREp8106eDfN_yl5pbb5yY-knmrm829uN2WH8X_JelM9-kFsgipKMFFoGD2LX9DuMeDHGAUtR5Daot5g5uUSJZy8jUl7q6hY0PqNZ7CqOFvMSnFAc"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="relative z-10">
            <p className="font-headline text-4xl font-black italic tracking-tighter text-primary-container leading-none uppercase">Consistencia.</p>
            <p className="text-xs font-bold text-on-surface-variant mt-2 max-w-[220px] uppercase tracking-wide opacity-80">Tu disciplina es lo único que separa tus metas de tu realidad.</p>
          </div>
        </div>
      </div>

      {/* Session Detail Overlay */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSession(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-surface-container-highest rounded-t-[40px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border-t border-outline-variant/20"
            >
              <div className="w-16 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-6 shrink-0" />
              
              <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
                <header className="mb-10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-2">{selectedSession.date} • {selectedSession.category}</p>
                  <h2 className="font-headline text-4xl font-black uppercase tracking-tight leading-none mb-4">{selectedSession.name}</h2>
                  <div className="flex justify-center gap-12 mt-6">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Duración</p>
                      <p className="font-headline text-2xl font-bold">{selectedSession.duration}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Volumen Total</p>
                      <p className="font-headline text-2xl font-bold text-secondary">{selectedSession.volume}</p>
                    </div>
                  </div>
                </header>

                {/* Mini Graph Section */}
                <section className="mb-12 bg-surface-container-high p-6 rounded-[32px] border border-outline-variant/10 shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-headline font-black text-xs uppercase tracking-widest">Intensidad por Ejercicio</h3>
                    <span className="material-symbols-outlined text-secondary text-sm">monitoring</span>
                  </div>
                  <div className="space-y-4">
                    {selectedSession.exercises.map((ex, i) => {
                      const exVolume = ex.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
                      const maxExVolume = Math.max(...selectedSession.exercises.map(e => e.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0)));
                      const percentage = maxExVolume > 0 ? (exVolume / maxExVolume) * 100 : 0;
                      
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="truncate max-w-[200px] text-on-surface">{ex.name}</span>
                            <span className="text-on-surface-variant opacity-70">{exVolume.toLocaleString()} kg</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className="h-full kinetic-gradient"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Detailed Exercise List */}
                <section className="space-y-8">
                  {selectedSession.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-black text-xs">
                          {exIndex + 1}
                        </div>
                        <div>
                          <h4 className="font-headline font-black text-lg uppercase tracking-tight leading-none">{exercise.name}</h4>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{exercise.muscle}</p>
                        </div>
                      </div>

                      <div className="bg-surface-container-low rounded-[24px] overflow-hidden border border-outline-variant/5">
                        <div className="grid grid-cols-3 p-3 bg-surface-container-high text-[9px] font-black text-outline uppercase tracking-[0.2em] text-center">
                          <div>Serie</div>
                          <div>Peso</div>
                          <div>Reps</div>
                        </div>
                        <div className="divide-y divide-outline-variant/10">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="grid grid-cols-3 p-4 items-center text-center">
                              <span className="font-headline font-black text-xs text-on-surface-variant">{setIndex + 1}</span>
                              <span className="font-headline font-bold text-sm text-on-surface">{set.weight} <span className="text-[8px] font-black text-outline">KG</span></span>
                              <span className="font-headline font-bold text-sm text-on-surface">{set.reps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                <button 
                  onClick={() => setSelectedSession(null)}
                  className="w-full mt-12 py-5 kinetic-gradient rounded-[24px] font-headline font-black text-on-primary-container tracking-[0.3em] uppercase shadow-2xl active:scale-[0.98] transition-transform"
                >
                  Cerrar Detalles
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {sessionToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSessionToDelete(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high p-8 rounded-[40px] border border-outline-variant/10 shadow-2xl flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
              
              <div>
                <h3 className="font-headline text-2xl font-black uppercase italic leading-tight mb-2">
                  ¿ELIMINAR SESIÓN?
                </h3>
                <p className="text-on-surface-variant text-xs font-bold leading-relaxed px-4">
                  Esta acción eliminará definitivamente el registro de "{sessionToDelete.name}" de tu historial. No se puede deshacer.
                </p>
              </div>

              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setSessionToDelete(null)}
                  className="flex-1 py-4 rounded-xl bg-surface-container-high border border-outline-variant/20 font-headline font-black text-[10px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onDeleteSession?.(sessionToDelete);
                    setSessionToDelete(null);
                  }}
                  className="flex-1 py-4 rounded-xl bg-error font-headline font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-error/20 active:scale-[0.98] transition-transform"
                >
                  Confirmar Borrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
