import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, Routine } from '../types';
import { getAllUsers, assignRoutineToUser } from '../services/db';
import { ROUTINES, getLevelColor, getTitleColor } from '../constants';

interface TrainerDashboardProps {
  onBack: () => void;
  currentRole?: string;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onBack, currentRole }) => {
  const [trainees, setTrainees] = useState<UserProfile[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      // Only show other users except the currently logged in person (optional, but good practice).
      // Here we just list all profiles so admin can manage them.
      setTrainees(users);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (routine: Routine) => {
    if (!selectedTrainee) return;
    try {
      await assignRoutineToUser(selectedTrainee.uid, routine);
      alert(`Rutina "${routine.name}" asignada con éxito a ${selectedTrainee.displayName}`);
    } catch (err) {
      console.error(err);
      alert("Error asignando rutina.");
    }
  };

  const handleRoleChange = async (newRole: "admin" | "trainer" | "trainee") => {
    if (!selectedTrainee || currentRole !== 'admin') return;
    try {
      // Use existing updateUserProfile service but from current admin context
      // Note: we assume updateUserProfile(uid, data) works on other profiles based on firestore rules
      const { updateUserProfile } = await import('../services/db');
      await updateUserProfile(selectedTrainee.uid, { role: newRole });
      
      // Update local state
      setSelectedTrainee(prev => prev ? { ...prev, role: newRole } : null);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? { ...t, role: newRole } : t));
      
      alert(`Rol cambiado exitosamente a ${newRole.toUpperCase()}`);
    } catch (err) {
      console.error("Error cambiando rol:", err);
      alert("Error al actualizar el rol.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-4 space-y-8 pb-32"
    >
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight uppercase italic leading-none">STAFF</h1>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">Panel de Entrenamiento</p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-surface-container-high border-t-primary-container rounded-full animate-spin" />
        </div>
      ) : !selectedTrainee ? (
        <section className="space-y-4">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase ml-2 text-on-surface-variant">Alumnos Activos</h3>
          <div className="space-y-2">
            {trainees.map((t, index) => (
              <div 
                key={t.uid || `trainee-${index}`}
                onClick={() => setSelectedTrainee(t)}
                className="bg-surface-container-high border border-outline-variant/10 p-4 rounded-[28px] cursor-pointer flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img src={t.avatarUrl || `https://ui-avatars.com/api/?name=${t.displayName || (t.email ? t.email.split('@')[0] : 'Alumno')}&background=CCFF00&color=121212&bold=true`} className="w-12 h-12 rounded-full border border-outline-variant/10" />
                  <div>
                    <h4 className="font-headline font-black text-lg uppercase tracking-tight leading-none">{t.displayName || (t.email ? t.email.split('@')[0] : 'Alumno')}</h4>
                    <p className="text-secondary text-[10px] font-bold mt-1 tracking-widest">{t.role?.toUpperCase() || 'TRAINEE'}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </div>
            ))}
            {trainees.length === 0 && (
              <p className="text-outline text-sm text-center py-8 font-bold uppercase tracking-widest text-[10px]">No hay alumnos registrados</p>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[32px] flex items-center gap-4 border border-outline-variant/5">
            <img src={selectedTrainee.avatarUrl || `https://ui-avatars.com/api/?name=${selectedTrainee.displayName || (selectedTrainee.email ? selectedTrainee.email.split('@')[0] : 'Alumno')}&background=CCFF00&color=121212&bold=true`} className="w-16 h-16 rounded-full border border-outline-variant/10 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Manejo de Alumno</p>
              <h4 className="font-headline text-2xl font-black uppercase leading-none truncate">{selectedTrainee.displayName || (selectedTrainee.email ? selectedTrainee.email.split('@')[0] : 'Alumno')}</h4>
              
              {currentRole === 'admin' ? (
                <div className="mt-3 flex gap-2 overflow-x-auto hide-scroll-bar">
                  {['admin', 'trainer', 'trainee'].map(roleOption => (
                    <button
                      key={roleOption}
                      onClick={() => handleRoleChange(roleOption as any)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        selectedTrainee.role === roleOption 
                          ? 'bg-secondary text-on-secondary shadow-md' 
                          : 'bg-surface-container-high text-outline hover:text-on-surface border border-outline-variant/20'
                      }`}
                    >
                      {roleOption}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-bold mt-2 text-outline uppercase tracking-widest">Rol: {selectedTrainee.role?.toUpperCase() || 'TRAINEE'}</p>
              )}
              
              <button 
                onClick={() => setSelectedTrainee(null)}
                className="text-[10px] text-outline hover:text-on-surface font-bold uppercase mt-3 tracking-widest flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Volver
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {ROUTINES.map(routine => (
              <div key={routine.id} className="bg-surface-container-high rounded-[32px] p-6 border border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)}`}>
                        {routine.level}
                      </span>
                    </div>
                    <h3 className={`font-headline text-2xl font-black uppercase tracking-tight italic leading-none mb-2 ${getTitleColor(routine.level)}`}>
                      {routine.name}
                    </h3>
                    <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed line-clamp-1">{routine.description}</p>
                  </div>
                  <button 
                    onClick={() => handleAssign(routine)}
                    className="bg-primary-container text-on-primary-container text-[10px] uppercase tracking-widest font-black px-6 py-3 rounded-full hover:scale-105 active:scale-[0.98] transition-all shrink-0 shadow-lg shadow-primary-container/20"
                  >
                    Asignar
                  </button>
                </div>
                <div className="flex items-center gap-4 text-outline text-[9px] font-black uppercase tracking-[0.2em] pt-4 border-t border-outline-variant/5">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm opacity-50">fitness_center</span> {routine.exercisesCount} Ejercicios
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm opacity-50">category</span> {routine.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};
