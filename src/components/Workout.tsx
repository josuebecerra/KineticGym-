import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTINES, EXERCISES, getLevelColor, getTitleColor } from '../constants';
import { Routine, Exercise, WorkoutSession, Set, ActiveExercise, WorkoutState, RestState, Screen } from '../types';

type WorkoutView = 'selection' | 'active' | 'create' | 'preview';

interface WorkoutProps {
  onFinish: (session: WorkoutSession) => void;
  sessions: WorkoutSession[];
  initialRoutine?: Routine | null;
  onCancel?: () => void;
  workoutState: WorkoutState;
  setWorkoutState: React.Dispatch<React.SetStateAction<WorkoutState>>;
  restState: RestState;
  setRestState: React.Dispatch<React.SetStateAction<RestState>>;
  onScreenChange: (screen: Screen) => void;
  userRole?: string;
}

export const Workout: React.FC<WorkoutProps> = ({ onFinish, sessions, initialRoutine, onCancel, workoutState, setWorkoutState, restState, setRestState, onScreenChange, userRole }) => {
  const [view, setView] = useState<WorkoutView>(workoutState.isActive ? 'active' : (initialRoutine ? 'preview' : 'selection'));
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(initialRoutine || null);
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [routineCategory, setRoutineCategory] = useState('Todas');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  
  // Custom Confirmation UI State
  const [confirmAction, setConfirmAction] = useState<'stop' | 'finish' | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<ActiveExercise | null>(null);
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  // Sync internal state if initialRoutine prop changes (only if not active)
  useEffect(() => {
    if (initialRoutine && !workoutState.isActive) {
      setSelectedRoutine(initialRoutine);
      setView('preview');
    }
  }, [initialRoutine, workoutState.isActive]);

  const activeExercises = workoutState.activeExercises;
  const elapsedSeconds = workoutState.elapsedSeconds;
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRoutine = (routine: Routine) => {
    let templateExercises: ActiveExercise[] = [];
    if (routine.exerciseIds && routine.exerciseIds.length > 0) {
      templateExercises = routine.exerciseIds.map(id => {
        const exercise = EXERCISES.find(ex => ex.id === id);
        if (!exercise) return null;

        // Smart weight loading: find last time this exercise was performed
        let lastSets: Set[] = [{ id: Math.random().toString(36).substr(2, 9), weight: 0, reps: 0, completed: false }];
        
        for (const session of sessions) {
          const prevEx = session.exercises.find(e => e.name === exercise.name);
          if (prevEx && prevEx.sets.length > 0) {
            lastSets = prevEx.sets.map(s => ({
              ...s,
              id: Math.random().toString(36).substr(2, 9),
              completed: false // Reset completion status
            }));
            break;
          }
        }

        return {
          ...exercise,
          sets: lastSets
        } as ActiveExercise;
      }).filter(Boolean) as ActiveExercise[];
    }

    setWorkoutState({
      isActive: true,
      selectedRoutine: routine,
      activeExercises: templateExercises,
      elapsedSeconds: 0
    });
    setView('active');
  };

  const handleStartFreeSession = () => {
    setWorkoutState({
      isActive: true,
      selectedRoutine: null,
      activeExercises: [],
      elapsedSeconds: 0
    });
    setView('active');
  };

  const addExercise = (exercise: Exercise) => {
    const newActiveEx: ActiveExercise = {
      ...exercise,
      sets: [{ id: Math.random().toString(36).substr(2, 9), weight: 0, reps: 0, completed: false }]
    };
    setWorkoutState(prev => ({ ...prev, activeExercises: [...prev.activeExercises, newActiveEx] }));
    setIsSelectorOpen(false);
    setSearchQuery('');
  };

  const addSet = (exerciseId: string) => {
    setWorkoutState(prev => ({
      ...prev,
      activeExercises: prev.activeExercises.map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [...ex.sets, { 
              id: Math.random().toString(36).substr(2, 9), 
              weight: lastSet?.weight || 0, 
              reps: lastSet?.reps || 0, 
              completed: false 
            }]
          };
        }
        return ex;
      })
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof Set, value: any) => {
    setWorkoutState(prev => ({
      ...prev,
      activeExercises: prev.activeExercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
          };
        }
        return ex;
      })
    }));
  };

  const cancelWorkout = () => {
    setConfirmAction(null);
    setWorkoutState({
      isActive: false,
      selectedRoutine: null,
      activeExercises: [],
      elapsedSeconds: 0
    });
    setView('selection');
    onCancel?.();
  };

  const finishWorkout = () => {
    const totalVolume = activeExercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
    , 0);

    const completedExercises = activeExercises.map(ex => ({
      name: ex.name,
      muscle: ex.muscle,
      sets: ex.sets.filter(s => s.completed)
    })).filter(ex => ex.sets.length > 0);

    if (completedExercises.length === 0) {
      setUiMessage("No has marcado ninguna serie completada. Marca al menos una para guardar.");
      return;
    }

    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: workoutState.selectedRoutine?.name || 'Sesión Libre',
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
      duration: formatTime(elapsedSeconds),
      volume: totalVolume.toLocaleString() + ' kg',
      category: workoutState.selectedRoutine?.category || 'General',
      exercises: completedExercises
    };

    console.log('Finalizando y guardando sesión:', session);
    onFinish(session);
    setWorkoutState({
      isActive: false,
      selectedRoutine: null,
      activeExercises: [],
      elapsedSeconds: 0
    });
    setView('selection');
    onCancel?.();
  };

  if (view === 'selection') {
    const filteredRoutines = ROUTINES.filter(r => routineCategory === 'Todas' || r.category === routineCategory);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-4 pb-24 space-y-10"
      >
        <section>
          <span className="text-secondary font-headline font-bold uppercase tracking-[0.2em] text-[10px]">Preparación</span>
          <h1 className="font-headline text-4xl font-black tracking-tight mt-1">Entrenar</h1>
        </section>

        <div className="grid grid-cols-2 gap-4">
          {(userRole === 'admin' || userRole === 'trainer') && (
            <button 
              onClick={() => setView('create')}
              className="bg-surface-container-high p-6 rounded-2xl flex flex-col items-center justify-center gap-3 border border-outline-variant/10 hover:bg-surface-container-highest transition-colors active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined">add_circle</span>
              </div>
              <span className="font-headline font-bold text-sm uppercase tracking-widest">Nueva Rutina</span>
            </button>
          )}
          <button 
            onClick={handleStartFreeSession}
            className={`bg-surface-container-high p-6 rounded-2xl flex flex-col items-center justify-center gap-3 border border-outline-variant/10 hover:bg-surface-container-highest transition-colors active:scale-[0.98] ${(userRole === 'admin' || userRole === 'trainer') ? '' : 'col-span-2'}`}
          >
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <span className="font-headline font-bold text-sm uppercase tracking-widest">Sesión Libre</span>
          </button>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline font-bold text-xl uppercase tracking-tighter">Tus Rutinas</h2>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{filteredRoutines.length} Disponibles</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scroll-bar">
            {['Todas', ...Array.from(new globalThis.Set(ROUTINES.map(r => r.category)))].map(category => (
              <button
                key={category}
                onClick={() => setRoutineCategory(category)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all ${
                  routineCategory === category 
                    ? 'bg-primary-container text-on-primary-container' 
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            {filteredRoutines.map((routine) => (
              <div 
                key={routine.id}
                onClick={() => {
                  setSelectedRoutine(routine);
                  setView('preview');
                }}
                className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10 hover:bg-surface-container-high transition-all cursor-pointer group active:scale-[0.98] shadow-sm hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)} shadow-sm shadow-black/10`}>
                        {routine.level}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-outline opacity-40">
                        {routine.category}
                      </span>
                    </div>
                    <h3 className={`font-headline text-2xl font-black uppercase italic tracking-tighter leading-none mb-3 ${getTitleColor(routine.level)} transition-colors`}>
                      {routine.name}
                    </h3>
                    <p className="text-[11px] font-bold text-outline-variant uppercase tracking-wider leading-relaxed max-w-lg opacity-80 line-clamp-1">
                      {routine.description}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-highest/40 flex items-center justify-center text-outline group-hover:text-primary-container group-hover:bg-primary-container/10 transition-all shadow-inner">
                    <span className="material-symbols-outlined text-2xl">play_arrow</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-outline-variant/5">
                  <div className="flex items-center gap-2 text-outline text-[9px] font-black uppercase tracking-[0.2em]">
                    <span className="material-symbols-outlined text-sm opacity-50">fitness_center</span> 
                    {routine.exercisesCount} Movimientos
                  </div>
                  <div className="flex items-center gap-2 text-outline text-[9px] font-black uppercase tracking-[0.2em]">
                    <span className="material-symbols-outlined text-sm opacity-50">timer</span> 
                    ~45 MIN
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    );
  }

  if (view === 'preview' && selectedRoutine) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-6 pt-4 pb-24 space-y-8 h-full flex flex-col"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setView('selection');
              onCancel?.();
            }} 
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-[10px] font-black uppercase text-secondary tracking-[0.2em]">{selectedRoutine.category}</span>
        </div>

        <div className="space-y-6 flex-1">
          <div className="bg-surface-container-high rounded-[32px] p-8 border border-outline-variant/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined text-9xl">inventory_2</span>
            </div>
            <h2 className="text-4xl font-headline font-black text-on-surface uppercase italic leading-tight mb-4">{selectedRoutine.name}</h2>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed">{selectedRoutine.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5">
                <p className="text-[9px] font-black uppercase text-outline tracking-widest mb-1">Dificultad</p>
                <p className="font-headline font-bold text-secondary uppercase italic">{selectedRoutine.level}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5">
                <p className="text-[9px] font-black uppercase text-outline tracking-widest mb-1">Ejercicios</p>
                <p className="font-headline font-bold text-on-surface uppercase italic">{selectedRoutine.exercisesCount}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-[0.3em] ml-2">Objetivo de la Sesión</h4>
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 italic text-on-surface-variant text-sm">
              "Esta rutina está enfocada en maximizar la {selectedRoutine.category.toLowerCase()} mediante un volumen de {selectedRoutine.exercisesCount} bloques. Prepárate para una sesión de alta intensidad."
            </div>
          </div>
        </div>

        <button 
          onClick={() => handleStartRoutine(selectedRoutine)}
          className="w-full kinetic-gradient py-6 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl shadow-primary/20 active:scale-[0.98] transition-transform text-lg"
        >
          Iniciar Entrenamiento
        </button>
      </motion.div>
    );
  }

  if (view === 'create') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-6 pt-4 pb-24 space-y-8"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => { setView('selection'); setWorkoutState(prev => ({ ...prev, activeExercises: [] })); }} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline text-3xl font-black tracking-tight">Crear Rutina</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Nombre de la Rutina</label>
            <input 
              type="text" 
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              placeholder="Ej. Push Day Explosivo"
              className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Descripción</label>
            <textarea 
              value={newRoutineDesc}
              onChange={(e) => setNewRoutineDesc(e.target.value)}
              placeholder="Enfoque en hipertrofia de pecho..."
              rows={3}
              className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all resize-none outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Ejercicios ({activeExercises.length})</label>
            {activeExercises.length > 0 && (
              <div className="space-y-2 mb-4">
                {activeExercises.map(ex => (
                  <div key={ex.id} className="bg-surface-container-high p-3 rounded-xl flex items-center justify-between border border-outline-variant/10">
                    <span className="font-headline font-bold text-sm text-on-surface">{ex.name}</span>
                    <button onClick={() => setWorkoutState(prev => ({ ...prev, activeExercises: prev.activeExercises.filter(e => e.id !== ex.id) }))} className="text-outline hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={() => setIsSelectorOpen(true)}
              className="w-full bg-surface-container-low p-6 rounded-2xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center gap-4 text-outline hover:border-primary-container/40 hover:text-on-surface transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_box</span>
              <span className="font-headline font-bold text-sm uppercase tracking-widest">Añadir Ejercicios</span>
            </button>
          </div>

          <button 
            onClick={() => {
              if (!newRoutineName) return setUiMessage('Ingresa un nombre para la rutina');
              if (activeExercises.length === 0) return setUiMessage('Añade al menos un ejercicio');
              
              const newRoutine: Routine = {
                id: Math.random().toString(36).substr(2, 9),
                name: newRoutineName,
                description: newRoutineDesc,
                exercisesCount: activeExercises.length,
                level: 'Personalizada' as any,
                category: 'General',
                exerciseIds: activeExercises.map(ex => ex.id)
              };
              
              setWorkoutState(prev => ({
                ...prev,
                isActive: true,
                selectedRoutine: newRoutine,
                elapsedSeconds: 0
              }));
              setView('active');
            }}
            className="w-full kinetic-gradient py-5 rounded-xl font-headline font-black text-on-primary-container tracking-widest uppercase shadow-2xl shadow-primary-container/20 active:scale-[0.98] transition-transform"
          >
            Iniciar Esta Rutina
          </button>
        </div>

        <AnimatePresence>
          {isSelectorOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSelectorOpen(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-surface-container-high rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[80vh] flex flex-col"
              >
                <div className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto mb-6 sm:hidden" />
                <h2 className="font-headline text-2xl font-black mb-4">AÑADIR EJERCICIO</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="relative group/search">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within/search:text-secondary mb-1 transition-colors">search</span>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Buscar ejercicio..."
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-4 pl-12 pr-6 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-secondary/50 outline-none transition-all shadow-inner"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scroll-bar">
                    {['Todos', ...Array.from(new globalThis.Set(EXERCISES.map(e => e.muscle)))].map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all ${
                          selectedCategory === category 
                            ? 'bg-primary-container text-on-primary-container' 
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/10'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {EXERCISES
                    .filter(ex => selectedCategory === 'Todos' || ex.muscle === selectedCategory)
                    .filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(exercise => (
                    <button 
                      key={exercise.id}
                      onClick={() => addExercise(exercise)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container-highest transition-colors text-left group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-low shrink-0 shadow-sm border border-outline-variant/10">
                        <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-headline font-bold text-on-surface leading-tight">{exercise.name}</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">{exercise.muscle} • {exercise.equipment}</p>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-primary-container">add_circle</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-4 pb-24 space-y-8"
    >
      <section>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setView('selection')} className="text-on-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline text-2xl font-black tracking-tight text-primary-container uppercase truncate">{workoutState.selectedRoutine?.name || 'SESIÓN LIBRE'}</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant font-medium tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">location_on</span> GIMNASIO CENTRAL
          </p>
          <div className="bg-surface-container-high px-4 py-2 rounded-xl border-l-4 border-secondary shadow-lg">
            <p className="font-headline text-2xl font-bold tabular-nums">{formatTime(elapsedSeconds)}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-4 relative z-20">
        <button 
          type="button"
          onClick={() => setConfirmAction('stop')}
          className="flex-1 bg-surface-container-high py-4 rounded-2xl flex items-center justify-center gap-2 font-headline font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-transform text-error border border-error/10 hover:bg-error/5"
        >
          <span className="material-symbols-outlined text-lg">stop_circle</span> Detener Sesión
        </button>
        <button 
          type="button"
          onClick={() => {
            const hasCompleted = activeExercises.some(ex => ex.sets.some(s => s.completed));
            if (!hasCompleted) {
              setUiMessage("Marca al menos una serie para finalizar.");
            } else {
              setConfirmAction('finish');
            }
          }}
          className="flex-1 secondary-gradient py-4 rounded-2xl flex items-center justify-center gap-2 font-headline font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-transform text-white shadow-xl shadow-secondary/10"
        >
          <span className="material-symbols-outlined text-lg">check_circle</span> Finalizar y Guardar
        </button>
      </div>

      <button 
        type="button"
        onClick={() => setIsSelectorOpen(true)}
        className="w-full bg-surface-container-high py-4 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm tracking-wider active:scale-[0.98] transition-transform text-on-surface-variant border border-outline-variant/10 relative z-10"
      >
        <span className="material-symbols-outlined text-lg">add</span> AÑADIR EJERCICIO
      </button>

      <div className="space-y-6">
        {activeExercises.map((exercise) => (
          <div key={exercise.id} className="bg-surface-container-high rounded-xl overflow-hidden shadow-md">
            <div className="p-5 flex justify-between items-start border-b border-outline-variant/10">
              <div>
                <h2 className="font-headline text-lg font-extrabold text-on-surface leading-tight uppercase">{exercise.name}</h2>
                <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mt-1">{exercise.muscle} • {exercise.equipment}</p>
              </div>
              <button 
                type="button"
                onClick={() => setExerciseToDelete(exercise)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error/5 transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-12 gap-2 text-[9px] font-black tracking-widest text-outline uppercase px-2 mb-1">
                <div className="col-span-1 text-center">SET</div>
                <div className="col-span-4 text-center">PESO (KG)</div>
                <div className="col-span-4 text-center">REPS</div>
                <div className="col-span-3"></div>
              </div>
              
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-primary-container/20' : 'bg-surface-container-highest'}`}>
                  <div className="col-span-1 text-center font-headline font-bold text-on-surface-variant">{setIndex + 1}</div>
                  <div className="col-span-4">
                    <input 
                      className="w-full bg-surface-container-low border-none rounded-lg text-center font-headline font-bold text-on-surface focus:ring-1 focus:ring-primary-container py-2" 
                      type="number" 
                      value={set.weight || ''} 
                      onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-4">
                    <input 
                      className="w-full bg-surface-container-low border-none rounded-lg text-center font-headline font-bold text-on-surface focus:ring-1 focus:ring-primary-container py-2" 
                      type="number" 
                      value={set.reps || ''} 
                      onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-3 flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        const newCompleted = !set.completed;
                        updateSet(exercise.id, set.id, 'completed', newCompleted);
                        if (newCompleted) {
                          // Suggest rest
                          setRestState({ isActive: true, timeLeft: 90, totalTime: 90 });
                          onScreenChange('descanso');
                        }
                      }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-primary-container text-on-primary-container' : 'bg-outline-variant/20 text-outline'} active:scale-90`}
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: set.completed ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span>
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => addSet(exercise.id)}
                className="w-full py-2 mt-2 rounded-lg border border-dashed border-outline-variant/30 text-outline text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-low transition-colors"
              >
                + Añadir Serie
              </button>
            </div>
          </div>
        ))}

        {activeExercises.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <span className="material-symbols-outlined text-5xl mb-4">fitness_center</span>
            <p className="font-headline font-bold uppercase tracking-widest text-sm">Añade tu primer ejercicio</p>
          </div>
        )}
      </div>

      {/* Quick Exercise Selector Modal */}
      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-surface-container-high rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto mb-6 sm:hidden" />
              <h2 className="font-headline text-2xl font-black mb-4">AÑADIR EJERCICIO</h2>
              
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Buscar ejercicio..."
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 pl-12 pr-6 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scroll-bar">
                  {['Todos', ...Array.from(new globalThis.Set(EXERCISES.map(e => e.muscle)))].map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all ${
                        selectedCategory === category 
                          ? 'bg-primary-container text-on-primary-container' 
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/10'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {EXERCISES
                  .filter(ex => selectedCategory === 'Todos' || ex.muscle === selectedCategory)
                  .filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(exercise => (
                  <button 
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container-highest transition-colors text-left group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-low shrink-0 shadow-sm border border-outline-variant/10">
                      <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-headline font-bold text-on-surface leading-tight">{exercise.name}</p>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">{exercise.muscle} • {exercise.equipment}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary-container">add_circle</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Notification/Message */}
      <AnimatePresence>
        {uiMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-6">
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface-container-highest border-l-4 border-secondary p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <span className="material-symbols-outlined text-secondary">info</span>
              <p className="font-headline font-bold text-[10px] uppercase tracking-widest flex-1">{uiMessage}</p>
              <button onClick={() => setUiMessage(null)} className="text-outline">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmAction(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high p-8 rounded-[40px] border border-outline-variant/10 shadow-2xl flex flex-col items-center text-center gap-6"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${confirmAction === 'stop' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
                <span className="material-symbols-outlined text-4xl">{confirmAction === 'stop' ? 'warning' : 'check_circle'}</span>
              </div>
              
              <div>
                <h3 className="font-headline text-2xl font-black uppercase italic leading-tight mb-2">
                  {confirmAction === 'stop' ? '¿DETENER SESIÓN?' : '¿FINALIZAR SESIÓN?'}
                </h3>
                <p className="text-on-surface-variant text-xs font-bold leading-relaxed px-4">
                  {confirmAction === 'stop' 
                    ? 'Esta acción descartará todo el progreso actual y no se guardará en el historial.' 
                    : 'Asegúrate de haber marcado todas tus series antes de guardar.'}
                </p>
              </div>

              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-4 rounded-xl bg-surface-container-high border border-outline-variant/20 font-headline font-black text-[10px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
                >
                  Regresar
                </button>
                <button 
                  onClick={confirmAction === 'stop' ? cancelWorkout : finishWorkout}
                  className={`flex-1 py-4 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest text-on-primary-container shadow-xl ${confirmAction === 'stop' ? 'bg-error text-white shadow-error/10' : 'kinetic-gradient shadow-primary/10'}`}
                >
                  {confirmAction === 'stop' ? 'Confirmar Stop' : 'Confirmar Guardar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise Deletion Confirmation */}
      <AnimatePresence>
        {exerciseToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExerciseToDelete(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high p-8 rounded-[40px] border border-outline-variant/10 shadow-2xl flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">delete_sweep</span>
              </div>
              
              <div>
                <h3 className="font-headline text-2xl font-black uppercase italic leading-tight mb-2">
                  ¿QUITAR EJERCICIO?
                </h3>
                <p className="text-on-surface-variant text-xs font-bold leading-relaxed px-4">
                  ¿Seguro que quieres eliminar "{exerciseToDelete.name}" de esta sesión? Se perderán las series de este ejercicio.
                </p>
              </div>

              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setExerciseToDelete(null)}
                  className="flex-1 py-4 rounded-xl bg-surface-container-high border border-outline-variant/20 font-headline font-black text-[10px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
                >
                  Regresar
                </button>
                <button 
                  onClick={() => {
                    setWorkoutState(prev => ({ ...prev, activeExercises: prev.activeExercises.filter(ex => ex.id !== exerciseToDelete.id) }));
                    setExerciseToDelete(null);
                  }}
                  className="flex-1 py-4 rounded-xl bg-error font-headline font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-error/20 active:scale-[0.98] transition-transform"
                >
                  Quitar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
