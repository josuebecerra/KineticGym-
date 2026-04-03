import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routine, Exercise } from '../types';
import { ROUTINES, EXERCISES, getLevelColor, getTitleColor } from '../constants';

interface RoutineManagerProps {
  onBack: () => void;
}

const MUSCLE_CATEGORIES = ['TODOS', 'PECHO', 'ESPALDA', 'PIERNAS', 'HOMBROS', 'BRAZOS', 'CORE'];
const ROUTINE_CATEGORIES = ['FULL BODY', 'EMPUJE', 'TRACCIÓN', 'PIERNAS', 'TORSO', 'BRAZOS', 'CORE', 'GLÚTEOS'];

export const RoutineManager: React.FC<RoutineManagerProps> = ({ onBack }) => {
  const [localRoutines, setLocalRoutines] = useState<Routine[]>(ROUTINES);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  
  // Create Form State
  const [newRoutine, setNewRoutine] = useState<Partial<Routine>>({
    name: '',
    description: '',
    level: 'Principiante',
    category: 'FULL BODY',
    defaultExercises: []
  });

  // Theme is now consistently orange (secondary) as per user request
  const themeAccent = 'text-secondary';
  const themeBg = 'bg-secondary';
  const themeBorder = 'border-secondary/30';
  const themeShadow = 'shadow-secondary/20';

  const getExerciseById = (id: string): Exercise | undefined => {
    return EXERCISES.find(e => e.id === id);
  };

  const filteredExercises = useMemo(() => {
    return EXERCISES.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'TODOS' || ex.muscle.toUpperCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleAddExerciseToNew = (exerciseId: string) => {
    const defaultSets = [
      { reps: 12, weight: 10 },
      { reps: 12, weight: 10 },
      { reps: 12, weight: 10 }
    ];
    setNewRoutine(prev => ({
      ...prev,
      defaultExercises: [...(prev.defaultExercises || []), { exerciseId, sets: defaultSets }]
    }));
  };

  const handleRemoveExerciseFromNew = (exerciseId: string) => {
    setNewRoutine(prev => ({
      ...prev,
      defaultExercises: prev.defaultExercises?.filter(d => d.exerciseId !== exerciseId)
    }));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setNewRoutine(prev => ({
      ...prev,
      defaultExercises: prev.defaultExercises?.map(ex => 
        ex.exerciseId === exerciseId 
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) => 
                idx === setIndex ? { ...set, [field]: value } : set
              )
            }
          : ex
      )
    }));
  };

  const addSetToExercise = (exerciseId: string) => {
    setNewRoutine(prev => ({
      ...prev,
      defaultExercises: prev.defaultExercises?.map(ex => 
        ex.exerciseId === exerciseId 
          ? {
              ...ex,
              sets: [...ex.sets, { reps: 10, weight: 10 }]
            }
          : ex
      )
    }));
  };

  const removeSetFromExercise = (exerciseId: string, setIndex: number) => {
    setNewRoutine(prev => ({
      ...prev,
      defaultExercises: prev.defaultExercises?.map(ex => {
        if (ex.exerciseId === exerciseId) {
          const newSets = ex.sets.filter((_, idx) => idx !== setIndex);
          return { ...ex, sets: newSets };
        }
        return ex;
      })
    }));
  };

  const handleOpenEdit = (routine: Routine) => {
    setEditingId(routine.id);
    setNewRoutine({
      ...routine
    });
    setIsCreating(true);
  };

  const handleSaveRoutine = () => {
    if (!newRoutine.name) {
      alert("Por favor ponle un nombre a la rutina.");
      return;
    }

    if (editingId) {
      // UPDATE EXISTING
      const updatedRoutines = localRoutines.map(r => 
        r.id === editingId 
          ? { ...r, ...newRoutine, exercisesCount: newRoutine.defaultExercises?.length || 0 } as Routine
          : r
      );
      setLocalRoutines(updatedRoutines);
    } else {
      // CREATE NEW
      const fullRoutine: Routine = {
        ...newRoutine as Routine,
        id: `r-custom-${Date.now()}`,
        exercisesCount: newRoutine.defaultExercises?.length || 0
      };
      setLocalRoutines([fullRoutine, ...localRoutines]);
    }

    setIsCreating(false);
    setEditingId(null);
    setNewRoutine({ name: '', description: '', level: 'Principiante', category: 'FULL BODY', defaultExercises: [] });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 pt-4 pb-32 min-h-screen relative"
    >
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary shrink-0 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight uppercase italic leading-none">GESTIÓN DE RUTINAS</h1>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">Biblioteca Maestra Kinetic</p>
        </div>
      </header>

      {/* Stats / Action Row */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 bg-surface-container rounded-[28px] p-4 border border-outline-variant/10 text-center">
          <p className="text-[9px] font-black uppercase text-outline tracking-widest mb-1">Total</p>
          <p className="font-headline text-2xl font-black italic">{localRoutines.length}</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex-[2] secondary-gradient rounded-[28px] p-4 flex items-center justify-center gap-2 group active:scale-95 transition-all outline-none border-none shadow-lg shadow-secondary/20"
        >
          <span className="material-symbols-outlined text-white group-hover:rotate-90 transition-transform">add</span>
          <span className="font-headline font-black text-xs text-white uppercase italic tracking-wider">Crear Nueva</span>
        </button>
      </div>

      <div className="space-y-4">
        {localRoutines.map((routine, idx) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-surface-container-high rounded-[40px] border border-outline-variant/10 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)} shadow-md shadow-black/10`}>
                      {routine.level}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-outline opacity-40">
                      {routine.category}
                    </span>
                  </div>
                  <h3 className={`font-headline text-2xl font-black uppercase italic tracking-tighter leading-none mb-3 ${getTitleColor(routine.level)}`}>
                    {routine.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(routine)}
                    className="w-12 h-12 rounded-2xl bg-surface-container-highest/40 text-outline hover:text-secondary flex items-center justify-center transition-all shadow-lg"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button 
                    onClick={() => setSelectedRoutine(selectedRoutine?.id === routine.id ? null : routine)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${selectedRoutine?.id === routine.id ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest/40 text-outline hover:text-secondary'}`}
                  >
                    <span className="material-symbols-outlined text-xl">{selectedRoutine?.id === routine.id ? 'close' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider leading-relaxed max-w-lg opacity-80">
                {routine.description}
              </p>
            </div>

            <AnimatePresence>
              {selectedRoutine?.id === routine.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-surface-container-low/50"
                >
                  <div className="p-6 border-t border-outline-variant/10 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Estructura Detallada</h4>
                    
                    <div className="space-y-3">
                      {routine.defaultExercises?.map((def, eIdx) => {
                        const exercise = getExerciseById(def.exerciseId);
                        return (
                          <div 
                            key={`${routine.id}-${eIdx}`}
                            className="bg-surface-container-highest/50 rounded-2xl p-4 flex flex-col gap-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-headline font-black text-xs uppercase italic tracking-wider text-on-surface">{exercise?.name || 'Ejercicio'}</span>
                              <span className="text-[8px] font-black text-outline uppercase tracking-widest bg-background px-2 py-1 rounded-md">{exercise?.muscle}</span>
                            </div>
                            
                            <div className="flex gap-4">
                              {def.sets.map((set, sIdx) => (
                                <div key={sIdx} className="flex flex-col items-center">
                                  <span className="text-[8px] font-black text-outline uppercase mb-1">Set {sIdx + 1}</span>
                                  <div className="flex items-center gap-1 bg-background rounded-lg px-2 py-1">
                                    <span className="text-[10px] font-black text-secondary">{set.reps}</span>
                                    <span className="text-[8px] font-black text-outline uppercase opacity-50">x</span>
                                    <span className="text-[10px] font-black text-on-surface">{set.weight}kg</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`relative w-full max-w-2xl bg-surface-container rounded-t-[40px] sm:rounded-[48px] border-t sm:border ${themeBorder} p-6 sm:p-10 shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]`}
            >
              <div className="flex justify-between items-start mb-8 shrink-0">
                <div>
                  <h2 className="font-headline text-4xl font-black uppercase italic leading-none tracking-tighter">
                    {editingId ? 'EDITAR RUTINA' : 'CONFIGURAR RUTINA'}
                  </h2>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-2 ${themeAccent}`}>Motor Maestra de Entrenamiento</p>
                </div>
                <button 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setNewRoutine({ name: '', description: '', level: 'Principiante', category: 'FULL BODY', defaultExercises: [] });
                  }}
                  className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
                {/* Basic Info Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors">edit</span>
                      <input 
                        type="text"
                        value={newRoutine.name}
                        onChange={(e) => setNewRoutine({...newRoutine, name: e.target.value})}
                        placeholder="NOMBRE DE LA RUTINA..."
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm font-black uppercase italic tracking-wider placeholder:opacity-20 focus:border-secondary outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4 block">NIVEL DE EXIGENCIA</label>
                    <div className="flex gap-2">
                      {['Principiante', 'Intermedio', 'Avanzado'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setNewRoutine({...newRoutine, level: lvl as any})}
                          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border ${
                            newRoutine.level === lvl 
                              ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20'
                              : 'bg-surface-container-high text-outline border-outline-variant/10'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4 block">CATEGORÍA</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ROUTINE_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setNewRoutine({...newRoutine, category: cat})}
                          className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all border ${
                            newRoutine.category === cat 
                              ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/10'
                              : 'bg-surface-container-high text-outline border-outline-variant/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROUTINE STRUCTURE SECTION */}
                {newRoutine.defaultExercises && newRoutine.defaultExercises.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex items-end justify-between px-2">
                       <div className="space-y-1">
                          <h4 className="font-headline text-2xl font-black uppercase italic leading-none text-on-surface">ESTRUCTURA DE LA RUTINA</h4>
                          <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mt-1">AJUSTA SERIES Y CARGAS</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                      {newRoutine.defaultExercises.map((def, defIdx) => {
                        const exercise = getExerciseById(def.exerciseId);
                        return (
                          <motion.div 
                            key={def.exerciseId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-surface-container-low/30 rounded-[32px] p-5 border border-outline-variant/5"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h5 className="font-headline text-lg font-black uppercase leading-none tracking-tight text-on-surface">{exercise?.name}</h5>
                                <p className="text-[8px] font-black text-outline uppercase tracking-[0.2em] mt-1">{exercise?.muscle}</p>
                              </div>
                              <button 
                                onClick={() => handleRemoveExerciseFromNew(def.exerciseId)}
                                className="w-8 h-8 rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all flex items-center justify-center outline-none"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>

                            <div className="space-y-3">
                              {def.sets.map((set, setIdx) => (
                                <div key={setIdx} className="flex items-center gap-3 bg-background/20 p-2 rounded-2xl border border-outline-variant/5">
                                  <div className="w-10 text-[8px] font-black text-outline uppercase tracking-tighter text-center">SET {setIdx + 1}</div>
                                  <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[6px] font-black text-outline-variant uppercase tracking-widest ml-1">REPS</span>
                                      <input 
                                        type="number"
                                        value={set.reps}
                                        onChange={(e) => updateSet(def.exerciseId, setIdx, 'reps', parseInt(e.target.value) || 0)}
                                        className="w-full bg-surface-container-high/50 border border-outline-variant/5 rounded-xl p-2 text-xs font-black text-secondary outline-none focus:border-secondary/50 transition-all text-center"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[6px] font-black text-outline-variant uppercase tracking-widest ml-1">PESO (KG)</span>
                                      <input 
                                        type="number"
                                        value={set.weight}
                                        onChange={(e) => updateSet(def.exerciseId, setIdx, 'weight', parseInt(e.target.value) || 0)}
                                        className="w-full bg-surface-container-high/50 border border-outline-variant/5 rounded-xl p-2 text-xs font-black text-on-surface outline-none focus:border-secondary/50 transition-all text-center"
                                      />
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => removeSetFromExercise(def.exerciseId, setIdx)}
                                    className="w-8 h-8 rounded-lg text-outline-variant hover:text-error transition-all flex items-center justify-center"
                                  >
                                    <span className="material-symbols-outlined text-base">close</span>
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => addSetToExercise(def.exerciseId)}
                                className="w-full py-3 rounded-2xl border border-dashed border-outline-variant/20 text-[8px] font-black uppercase tracking-[0.2em] text-outline hover:text-secondary hover:border-secondary/30 transition-all bg-surface-container-high/10"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <span className="material-symbols-outlined text-sm">add</span> AÑADIR SET
                                </span>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ADVANCED EXERCISE PICKER */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-end justify-between px-2">
                    <div className="space-y-1">
                      <h4 className="font-headline text-2xl font-black uppercase italic leading-none">AÑADIR EJERCICIO</h4>
                      <p className="text-[9px] font-bold text-outline uppercase tracking-widest">AÑADIDOS: {newRoutine.defaultExercises?.length || 0}</p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar ejercicio..."
                      className="w-full bg-background border border-outline-variant/20 rounded-2xl p-4 pl-12 text-sm font-bold placeholder:opacity-30 focus:border-secondary outline-none transition-all"
                    />
                  </div>

                  {/* Category Filter Horizontal Scroll */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                    {MUSCLE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                          selectedCategory === cat 
                            ? 'bg-primary-container text-on-primary-container border-primary-container' 
                            : 'bg-surface-container-high text-outline border-outline-variant/10 hover:border-outline'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Exercise Results List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                    {filteredExercises.map(ex => {
                      const isAdded = newRoutine.defaultExercises?.some(d => d.exerciseId === ex.id);
                      return (
                        <div
                          key={ex.id}
                          className={`group relative bg-surface-container-low rounded-3xl p-3 flex items-center gap-4 border transition-all ${
                            isAdded 
                              ? 'border-secondary/40 bg-secondary/5' 
                              : 'border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-container-high'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-background shrink-0 border border-outline-variant/10">
                            <img src={ex.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={ex.name} />
                          </div>
                          
                          <div className="flex-1">
                            <h5 className="font-headline text-lg font-black uppercase leading-none tracking-tight group-hover:text-primary-container transition-colors">{ex.name}</h5>
                            <p className="text-[9px] font-black text-outline uppercase tracking-widest mt-1">
                              {ex.muscle} • {ex.equipment}
                            </p>
                          </div>

                          <button
                            onClick={() => isAdded ? handleRemoveExerciseFromNew(ex.id) : handleAddExerciseToNew(ex.id)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              isAdded 
                                ? 'bg-secondary text-on-secondary' 
                                : 'bg-surface-container-highest text-outline hover:text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {isAdded ? 'remove' : 'add'}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 shrink-0">
                <button 
                  onClick={handleSaveRoutine}
                  className="w-full p-6 rounded-[32px] font-headline font-black uppercase italic tracking-[0.2em] text-white shadow-2xl transition-all active:scale-[0.98] secondary-gradient shadow-secondary/30"
                >
                  {editingId ? 'ACTUALIZAR RUTINA KINETIC' : 'PUBLICAR RUTINA KINETIC'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-12 p-8 bg-surface-container rounded-[40px] border border-dashed border-outline-variant/30 text-center">
        <span className="material-symbols-outlined text-outline text-4xl mb-4 opacity-30">science</span>
        <h4 className="font-headline font-black text-lg uppercase italic text-on-surface opacity-50">Algoritmo de IA en desarrollo</h4>
        <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest mt-2">Próximamente: Generación de rutinas automáticas basadas en objetivos del alumno.</p>
      </div>
    </motion.div>
  );
};
