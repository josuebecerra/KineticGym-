import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EXERCISES } from '../constants';
import { Exercise } from '../types';

interface ExercisesProps {
  onBack?: () => void;
}

export const Exercises: React.FC<ExercisesProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];
  const equipmentTypes = ['Todos', 'Barra', 'Mancuernas', 'Máquina', 'Peso Corporal'];

  const filteredExercises = useMemo(() => {
    return EXERCISES.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscles.length === 0 || selectedMuscles.includes(ex.muscle);
      const matchesEquipment = selectedEquipment === 'Todos' || ex.equipment === selectedEquipment;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [searchQuery, selectedMuscles, selectedEquipment]);

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 pb-32 space-y-8"
    >
      {/* Header */}
      <header className="flex flex-col gap-6 mt-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack} 
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary shrink-0 transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <h1 className="font-headline font-black text-4xl md:text-6xl text-on-surface tracking-tighter uppercase leading-none">
            Biblioteca <span className="text-secondary">Pro</span>
          </h1>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high border-none rounded-2xl py-5 pl-12 pr-6 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-secondary/50 transition-all text-lg shadow-xl" 
            placeholder="¿Qué músculo atacamos hoy?" 
            type="text" 
          />
        </div>
      </header>

      {/* Filters Section */}
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-outline">Filtrar por Grupo</h3>
            {selectedMuscles.length > 0 && (
              <button 
                onClick={() => setSelectedMuscles([])}
                className="text-secondary text-[10px] font-black uppercase tracking-widest"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {muscleGroups.map((m) => {
              const isActive = selectedMuscles.includes(m);
              return (
                <button 
                  key={m} 
                  onClick={() => toggleMuscle(m)}
                  className={`px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${isActive ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surface-container-highest text-on-surface-variant border-transparent hover:border-outline-variant'}`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-outline px-1">Equipamiento</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {equipmentTypes.map((e) => (
              <button 
                key={e} 
                onClick={() => setSelectedEquipment(e)}
                className={`px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap border transition-all ${selectedEquipment === e ? 'bg-on-surface text-surface border-on-surface shadow-md' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredExercises.map((ex) => (
            <motion.div 
              layout
              key={ex.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={() => setSelectedExercise(ex)}
              className="group bg-surface-container-high rounded-3xl overflow-hidden hover:bg-surface-container-highest transition-all duration-300 border border-outline-variant/10 cursor-pointer shadow-lg active:scale-[0.98]"
            >
              <div className="aspect-video relative overflow-hidden">
                <img alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[0.5] group-hover:grayscale-0" src={ex.image} />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-surface/80 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-on-surface">{ex.level}</span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-headline font-black text-xl text-on-surface leading-tight uppercase tracking-tighter mb-2 line-clamp-2 min-h-[3rem]">{ex.name}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-on-surface-variant text-[9px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> {ex.muscle}</span>
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">fitness_center</span> {ex.equipment}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredExercises.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <span className="material-symbols-outlined text-6xl text-outline-variant">search_off</span>
          <p className="text-on-surface-variant font-headline font-bold">No encontramos ejercicios con esos filtros.</p>
        </div>
      )}

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedExercise && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 h-[85vh] bg-surface-container-lowest rounded-t-[40px] z-[101] shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 p-4 sm:p-6 flex justify-between items-center bg-surface-container-lowest/90 backdrop-blur-md z-50 border-b border-outline-variant/10">
                <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
                <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-outline truncate mr-4">Detalles del Movimiento</h3>
                <button 
                  onClick={() => setSelectedExercise(null)} 
                  className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:text-error transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="px-6 pb-20 space-y-10">
                {/* Header Info */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedExercise.muscle}</span>
                    <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedExercise.level}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-headline font-black text-on-surface uppercase tracking-tighter leading-none mb-6">
                    {selectedExercise.name}
                  </h2>
                  <img src={selectedExercise.image} alt="" className="w-full aspect-video object-cover rounded-[32px] shadow-2xl" />
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-secondary tracking-[0.3em] mb-3">Técnica de Ejecución</h4>
                      <p className="text-on-surface-variant leading-relaxed text-lg">{selectedExercise.description}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase text-secondary tracking-[0.3em] mb-4">Músculos Implicados</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedExercise.primaryMuscles.map(m => (
                          <span key={m} className="px-4 py-1.5 rounded-lg bg-on-surface text-surface text-xs font-black uppercase leading-none">{m}</span>
                        ))}
                        {selectedExercise.secondaryMuscles.map(m => (
                          <span key={m} className="px-4 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-black uppercase leading-none">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 bg-surface-container rounded-[32px] p-8">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-primary-container tracking-[0.3em] mb-4">
                        <span className="material-symbols-outlined text-sm">stars</span> Beneficios Pro
                      </h4>
                      <ul className="space-y-3">
                        {selectedExercise.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-3 text-on-surface-variant text-sm font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" /> {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 bg-secondary/10 rounded-2xl border border-secondary/20">
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-secondary tracking-[0.3em] mb-4 uppercase">
                        <span className="material-symbols-outlined text-sm">security</span> Seguridad
                      </h4>
                      <ul className="space-y-2">
                        {selectedExercise.safety.map((s, i) => (
                          <li key={i} className="text-on-surface-variant text-xs font-medium leading-relaxed italic">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
