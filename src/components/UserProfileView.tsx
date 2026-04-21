import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, SubscriptionData, Routine } from '../types';

interface UserProfileViewProps {
  user: UserProfile;
  currentRole: string | undefined;
  currentUserUid: string | undefined;
  allStaff: UserProfile[];
  allUsers: UserProfile[];
  ROUTINES: Routine[];
  onBack: () => void;
  onShowDialog: (config: any) => void;
  handleRoleChange: (newRole: 'admin' | 'trainer' | 'trainee') => void;
  handleSubscriptionUpdate: (planId: string) => void;
  handleCancelSubscription: (reason: string) => void;
  handleRemoveRoutine: (routineId: string) => void;
  handleClearAllRoutines: () => void;
  handleTrainerAssignment: (trainer: UserProfile) => void;
  handleAssign: (routine: Routine) => void;
  getLevelColor: (level: string) => string;
  getTitleColor: (level: string) => string;
  isAssigningTrainer: boolean;
  setIsAssigningTrainer: (val: boolean) => void;
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  currentRole,
  currentUserUid,
  allStaff,
  allUsers,
  ROUTINES,
  onBack,
  onShowDialog,
  handleRoleChange,
  handleSubscriptionUpdate,
  handleCancelSubscription,
  handleRemoveRoutine,
  handleClearAllRoutines,
  handleTrainerAssignment,
  handleAssign,
  getLevelColor,
  getTitleColor,
  isAssigningTrainer,
  setIsAssigningTrainer,
  showHistory,
  setShowHistory
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'membership' | 'admin' | 'clients'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  const ROUTINE_CATEGORIES = ['TODOS', 'FULL BODY', 'EMPUJE', 'TRACCIÓN', 'PIERNAS', 'TORSO', 'BRAZOS', 'CORE', 'GLÚTEOS'];

  const now = new Date();
  const isStaff = user.role === 'admin' || user.role === 'trainer';
  const subStatus = isStaff 
    ? (user.isActive !== false ? 'ACTIVO' : 'DESACTIVADO')
    : (user.subscription?.status === 'active' && new Date(user.subscription.endDate) > now ? 'ACTIVO' : 'INACTIVO');
  const subColor = (subStatus === 'ACTIVO' || subStatus === 'STAFF') ? 'text-secondary border-secondary/30 bg-secondary/10' : 'text-error border-error/30 bg-error/10';

  // Calculate some stats
  const totalWorkouts = user.history?.length || 0;
  const lastWorkout = user.history && user.history.length > 0 
    ? new Date(user.history[0].date).toLocaleDateString() 
    : 'NINGUNO';
    
  const daysRemaining = user.subscription?.status === 'active' 
    ? Math.max(0, Math.ceil((new Date(user.subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: 'grid_view' },
    { id: 'training', label: 'Entrenamiento', icon: 'fitness_center' },
    ...(!isStaff ? [{ id: 'membership', label: 'Membresía', icon: 'payments' }] : []),
    ...((user.role === 'trainer') ? [{ id: 'clients', label: 'Alumnos', icon: 'group' }] : []),
    ...(user.role === 'admin' ? [{ id: 'clients', label: 'Equipo', icon: 'diversity_3' }] : []),
    ...(currentRole === 'admin' ? [{ id: 'admin', label: 'Admin', icon: 'shield_person' }] : [])
  ];

  const StatCard = ({ label, value, icon, color = "text-secondary" }: any) => (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute -right-2 -top-2 opacity-5 scale-150 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-6xl italic">{icon}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
        <span className="text-[9px] font-black text-outline uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black italic uppercase leading-none">{value}</span>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Premium Hero Section */}
      <section className="bg-surface-container-low rounded-[48px] border border-outline-variant/10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 kinetic-gradient opacity-[0.03]" />
        
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar with animated effects */}
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`absolute -inset-2 border-2 border-dashed ${subStatus === 'ACTIVO' ? 'border-secondary/30' : 'border-error/30'} rounded-[40px] opacity-50`}
              />
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName || 'Alumno'}&background=${subStatus === 'ACTIVO' ? 'CCFF00' : 'FF4444'}&color=121212&bold=true`} 
                className="w-32 h-32 rounded-[36px] border-4 border-surface-container-high shadow-2xl object-cover relative z-10" 
              />
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl ${subStatus === 'ACTIVO' ? 'bg-secondary' : 'bg-error'} flex items-center justify-center text-black z-20 shadow-lg border-2 border-surface-container-low`}>
                <span className="material-symbols-outlined text-sm font-black">{subStatus === 'ACTIVO' ? 'check' : 'priority_high'}</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <span className="px-3 py-1 bg-surface-container-highest border border-outline-variant/10 rounded-full text-[9px] font-black uppercase tracking-widest text-outline h-[26px] flex items-center">
                  {user.role || 'TRAINEE'}
                </span>
                <span className={`px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${subColor} h-[26px] flex items-center`}>
                  {subStatus}
                </span>
                {user.trainerName && user.role === 'trainee' && (
                  <span className="px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-[9px] font-black uppercase tracking-widest text-primary-container flex items-center gap-1.5 h-[26px]">
                    <span className="material-symbols-outlined text-[14px]">school</span> {user.trainerName}
                  </span>
                )}
                {user.bossName && user.role === 'trainer' && (
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5 h-[26px]">
                    <span className="material-symbols-outlined text-[14px]">security</span> {user.bossName}
                  </span>
                )}
              </div>
              <h2 className="font-headline text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-4 truncate text-white">
                {user.displayName || user.email.split('@')[0]}
              </h2>
              <p className="text-outline text-xs font-bold uppercase tracking-[0.2em] opacity-60 italic truncate max-w-md">{user.email}</p>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <button 
                onClick={onBack}
                className="w-full py-4 rounded-2xl bg-surface-container-highest text-outline text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3 border border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span> Volver al Directorio
              </button>
              {(currentRole === 'admin' || currentRole === 'trainer') && user.role === 'trainee' && (
                <button 
                  onClick={() => setIsAssigningTrainer(!isAssigningTrainer)}
                  className="w-full py-4 rounded-2xl kinetic-gradient text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-base">sports</span> 
                  COACHES
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-8 pt-0 relative z-10">
          <StatCard label="Sesiones Totales" value={totalWorkouts} icon="history" />
          <StatCard label="Último Registro" value={lastWorkout} icon="event_available" color="text-primary-container" />
          <StatCard label="Meta Actual" value={user.assessment?.goal ? (user.assessment.goal === 'weight_loss' ? 'Pérdida Peso' : user.assessment.goal === 'muscle_gain' ? 'Ganancia Muscular' : 'Fitness') : 'Sin definir'} icon="target" color="text-secondary" />
          <StatCard label="Días de Plan" value={daysRemaining} icon="schedule" color={daysRemaining < 5 ? "text-error" : "text-secondary"} />
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-[2rem] border border-outline-variant/10 w-fit mx-auto sticky top-4 z-50 backdrop-blur-xl shadow-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
              activeTab === tab.id ? 'text-black' : 'text-outline hover:text-white'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeProfileTab"
                className="absolute inset-0 bg-secondary rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="material-symbols-outlined text-base leading-none">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Assessment Card */}
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] italic">Evaluación Física</h5>
                  <span className="material-symbols-outlined text-outline/30">monitoring</span>
                </div>
                {user.assessment ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[8px] font-black text-outline/60 uppercase tracking-widest mb-1">Estatura</p>
                      <p className="text-xl font-black italic">{user.assessment.height} <span className="text-[10px] text-outline font-bold">CM</span></p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-outline/60 uppercase tracking-widest mb-1">Peso Inicial</p>
                      <p className="text-xl font-black italic">{user.assessment.weight} <span className="text-[10px] text-outline font-bold">KG</span></p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-outline/60 uppercase tracking-widest mb-1">Conocimiento</p>
                      <p className="text-[10px] font-black uppercase text-on-surface">{user.assessment.knowledge}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-outline/60 uppercase tracking-widest mb-1">Frecuencia Meta</p>
                      <p className="text-[10px] font-black uppercase text-secondary">{user.assessment.targetFrequency}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-outline/40 text-[9px] font-bold uppercase tracking-widest italic py-4">Sin datos de evaluación</p>
                )}
                <div className="pt-6 border-t border-outline-variant/5">
                  <p className="text-[8px] font-black text-outline/60 uppercase tracking-widest mb-3 italic">Condiciones Especiales:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.assessment?.conditions && user.assessment.conditions.length > 0 ? (
                      user.assessment.conditions.map((c, i) => (
                        <span key={i} className="px-3 py-1.5 bg-error/5 text-error text-[8px] font-black uppercase tracking-widest border border-error/10 rounded-lg">{c}</span>
                      ))
                    ) : (
                      <span className="text-[8px] font-black text-success uppercase tracking-widest">Ninguna reportada</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Summary Card (Quick view of logs) */}
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-primary-container uppercase tracking-[0.4em] italic">Bitácora de Progreso</h5>
                  <span className="material-symbols-outlined text-outline/30">photo_library</span>
                </div>
                {user.progress && user.progress.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-outline uppercase tracking-widest italic">Últimos Registros:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {user.progress.slice(0, 4).map((log, i) => (
                        <div key={i} className="bg-surface-container-high rounded-2xl p-3 border border-outline-variant/5">
                          <p className="text-[8px] font-black text-outline/50 uppercase mb-1">{new Date(log.date).toLocaleDateString()}</p>
                          <p className="text-lg font-black italic leading-none">{log.weight} KG</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-outline/20 text-4xl mb-3">camera_enhance</span>
                    <p className="text-outline/40 text-[9px] font-bold uppercase tracking-widest italic">Sin registros de fotos o medidas</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div 
              key="training"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Assigned Routines */}
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h5 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] italic">Programación Actual</h5>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-1 opacity-50 italic">Control de Rutinas Asignadas</p>
                  </div>
                  {user.assignedRoutines && user.assignedRoutines.length > 0 && (
                     <button 
                      onClick={handleClearAllRoutines}
                      className="text-[9px] font-black text-error hover:bg-error/10 transition-all border border-error/20 px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-base">delete_sweep</span> Limpiar Todo
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {user.assignedRoutines?.map((routine: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-outline group-hover:text-secondary transition-colors shadow-lg shadow-black/10">
                          <span className="material-symbols-outlined">fitness_center</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-black uppercase italic text-white group-hover:text-secondary transition-colors">
                              {routine.name}
                            </p>
                            <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)}`}>
                              {routine.level}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-outline uppercase tracking-widest opacity-60">
                            {routine.category} • {routine.exercisesCount || 0} EJERCICIOS
                          </p>
                        </div>
                      </div>
                      {(currentRole === 'admin' || (currentRole === 'trainer' && user.trainerId === currentUserUid)) && (
                        <button 
                          onClick={() => handleRemoveRoutine(routine.id)}
                          className="w-8 h-8 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {(!user.assignedRoutines || user.assignedRoutines.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed border-outline-variant/10 rounded-2xl">
                      <p className="text-[10px] font-black text-outline/30 uppercase tracking-[0.3em] italic">Sin rutinas asignadas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Training Progress (History) Table */}
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h5 className="text-[11px] font-black text-outline uppercase tracking-[0.4em] italic">Actividad Reciente</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/10 italic">
                        <th className="pb-4 text-[9px] font-black text-outline uppercase tracking-widest">Fecha</th>
                        <th className="pb-4 text-[9px] font-black text-outline uppercase tracking-widest">Nombre del Entreno</th>
                        <th className="pb-4 text-[9px] font-black text-outline uppercase tracking-widest hidden sm:table-cell">Duración</th>
                        <th className="pb-4 text-[9px] font-black text-outline uppercase tracking-widest text-right">Volumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5 text-[10px]">
                      {user.history?.slice(0, 5).map((session, i) => (
                        <tr key={session.id || i} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4 font-black italic">{new Date(session.date).toLocaleDateString()}</td>
                          <td className="py-4 font-black uppercase text-white truncate max-w-[200px]">{session.name}</td>
                          <td className="py-4 text-outline hidden sm:table-cell">{session.duration}</td>
                          <td className="py-4 text-right font-black italic text-secondary">{session.volume}</td>
                        </tr>
                      ))}
                      {(!user.history || user.history.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-outline/30 italic uppercase tracking-widest">Sin sesiones registradas aún</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Routine Assignment Catalog Section (REFACTORED TO LIST & SEARCH) */}
              {(currentRole === 'admin' || (currentRole === 'trainer' && user.trainerId === currentUserUid)) ? (
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <h5 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] italic">Catálogo de Entrenamiento</h5>
                      <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest mt-1 opacity-50 italic">Expande el programa del alumno</p>
                    </div>
                    
                    {/* Compact Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar rutina..."
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest placeholder:opacity-30 focus:border-secondary outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                    {ROUTINE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all border ${
                          selectedCategory === cat 
                            ? 'bg-secondary text-black border-secondary' 
                            : 'bg-surface-container-high text-outline border-outline-variant/10 hover:border-outline'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {ROUTINES
                      .filter(r => {
                        const isAlreadyAssigned = user.assignedRoutines?.some(ar => ar.id === r.id);
                        if (isAlreadyAssigned) return false;

                        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          r.category.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedCategory === 'TODOS' || r.category === selectedCategory;
                        
                        return matchesSearch && matchesCategory;
                      })
                      .map((routine, rIdx) => (
                        <motion.div 
                          key={routine.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: rIdx * 0.03 }}
                          className="bg-surface-container-high/40 rounded-3xl p-4 border border-outline-variant/10 group hover:border-secondary/30 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-outline group-hover:text-secondary transition-colors shadow-lg shadow-black/10">
                              <span className="material-symbols-outlined text-2xl">fitness_center</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-black uppercase italic tracking-tight text-white group-hover:text-secondary transition-colors">
                                  {routine.name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)}`}>
                                  {routine.level}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[8px] font-black text-outline uppercase tracking-widest opacity-60">
                                  {routine.category} • {routine.exercisesCount} EJERCICIOS
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              handleAssign(routine);
                              setSearchTerm(''); // Clear search on assign
                            }}
                            className="bg-secondary/10 text-secondary text-[8px] uppercase tracking-widest font-black px-4 py-2.5 rounded-xl hover:bg-secondary hover:text-black active:scale-95 transition-all shadow-lg shadow-black/10 border border-secondary/20"
                          >
                            ASIGNAR
                          </button>
                        </motion.div>
                      ))}
                      
                    {/* Empty State for Search */}
                    {ROUTINES.filter(r => {
                      const isAlreadyAssigned = user.assignedRoutines?.some(ar => ar.id === r.id);
                      if (isAlreadyAssigned) return false;
                      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        r.category.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCategory = selectedCategory === 'TODOS' || r.category === selectedCategory;
                      return matchesSearch && matchesCategory;
                    }).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-outline-variant/10 rounded-[32px]">
                        <span className="material-symbols-outlined text-4xl text-outline/20 mb-3 italic">inventory_2</span>
                        <p className="text-[10px] font-black text-outline/30 uppercase tracking-[0.3em] italic">No hay rutinas disponibles</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-[32px] border border-dashed border-outline-variant/10 p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-3xl text-outline-variant/40">lock</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-outline uppercase tracking-[0.3em] italic">Vínculo Restringido</p>
                    <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed opacity-60">
                      Solo el Entrenador designado ({user.trainerName || 'N/A'}) <br /> puede asignar rutinas a este perfil.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'membership' && (
            <motion.div 
              key="membership"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Active Plan Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform">
                    <span className="material-symbols-outlined text-9xl italic">badge</span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <h5 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] italic mb-3 leading-none">Membresía Vigente</h5>
                      {user.subscription ? (
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-black italic uppercase leading-none text-white tracking-tighter">
                            {user.subscription.planId === '1month' ? 'Mensual' : user.subscription.planId === '6months' ? 'Semestral' : 'Anual'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${subColor}`}>
                            {subStatus}
                          </span>
                        </div>
                      ) : (
                        <p className="text-4xl font-black italic uppercase leading-none text-outline/20 tracking-tighter">Sin Plan</p>
                      )}
                    </div>
                    {user.subscription && subStatus === 'ACTIVO' && (
                      <button 
                        onClick={() => {
                          onShowDialog({
                            type: 'confirm',
                            title: '¿CANCELAR MEMBRESÍA?',
                            message: 'Se revocará el acceso de forma inmediata. Debes ingresar una justificación técnica.',
                            showInput: true,
                            inputPlaceholder: "Motivo de la baja...",
                            confirmText: 'PROCESAR BAJA',
                            onConfirm: (val: any) => {
                              if (!val || val.trim().length < 4) {
                                onShowDialog({
                                  type: 'error',
                                  title: 'JUSTIFICACIÓN REQUERIDA',
                                  message: 'Es obligatorio ingresar un motivo válido para autorizar la cancelación.',
                                  confirmText: 'REINTENTAR'
                                });
                                return;
                              }
                              handleCancelSubscription(val);
                            }
                          });
                        }}
                        className="px-6 py-3 rounded-2xl border-2 border-error/20 text-error text-[10px] font-black uppercase tracking-widest hover:bg-error/5 transition-all flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-base">cancel</span> Cancelar
                      </button>
                    )}
                  </div>

                  {user.subscription && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-surface-container-high/40 rounded-3xl border border-outline-variant/10">
                      <div>
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1 opacity-50 italic">Inició el</p>
                        <p className="text-sm font-black italic uppercase text-white">{new Date(user.subscription.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1 opacity-50 italic">Días Restantes</p>
                        <p className={`text-sm font-black italic uppercase ${daysRemaining < 5 ? 'text-error' : 'text-secondary'}`}>{daysRemaining}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub History List (PERMANENTLY VISIBLE) */}
                {user.subscriptionHistory && user.subscriptionHistory.length > 0 && (
                  <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="material-symbols-outlined text-secondary text-base">history_edu</span>
                       <h6 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] italic">Historial de Membresías</h6>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {user.subscriptionHistory.slice().reverse().map((sub, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 group hover:border-outline-variant/20 transition-all">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black italic uppercase text-white">{sub.planId === '1month' ? 'Mensual' : sub.planId === '6months' ? 'Semestral' : sub.planId === '1year' ? 'Anual' : 'Staff'}</span>
                            <span className="text-[8px] font-bold text-outline uppercase tracking-widest">{new Date(sub.startDate).toLocaleDateString()} al {new Date(sub.endDate).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${sub.status === 'active' ? 'border-primary-container/20 text-primary-container bg-primary-container/5' : 'border-outline-variant/20 text-outline-variant bg-outline-variant/5'}`}>
                            {sub.status === 'active' ? 'Finalizado' : sub.status === 'canceled' ? 'Cancelado' : 'Expirado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assignments / Renewals */}
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 flex flex-col gap-6 relative overflow-hidden">
                {subStatus === 'ACTIVO' && (
                  <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-4 border border-secondary/20 shadow-2xl shadow-secondary/10">
                      <span className="material-symbols-outlined text-secondary text-3xl">verified_user</span>
                    </div>
                    <h4 className="text-secondary text-xs font-black uppercase tracking-[0.3em] mb-2 italic">Membresía Vigente</h4>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest leading-relaxed max-w-[200px]">
                      Para registrar un nuevo plan, primero debes <span className="text-white">vencer</span> o <span className="text-error">cancelar</span> la membresía actual.
                    </p>
                  </div>
                )}

                <div>
                  <h5 className="text-[11px] font-black text-outline uppercase tracking-[0.4em] italic mb-2 leading-none">Gestión de Pago</h5>
                  <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest italic leading-none opacity-50">Renovaciones rápidas</p>
                </div>

                <div className="space-y-3">
                  {(allStaff.find(s => s.uid === 'gym_info_dummy')?.membershipPlans || [])
                    .filter(plan => {
                      if (user.role === 'trainer' || user.role === 'admin') {
                        return plan.type === 'staff';
                      }
                      return plan.type === 'standard' || !plan.type;
                    })
                    .map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => handleSubscriptionUpdate(plan.id as any)}
                      className="w-full p-4 rounded-3xl bg-surface-container-high border border-outline-variant/5 hover:border-secondary/30 hover:bg-surface-container-highest transition-all group flex items-center justify-between text-left"
                    >
                      <div className="flex flex-col">
                        <span className={`text-base font-black italic uppercase leading-none mb-1 text-white group-hover:text-secondary`}>{plan.name}</span>
                        <span className="text-[8px] font-black text-outline uppercase tracking-widest opacity-40">{plan.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black italic text-secondary">${plan.price}</span>
                        <span className="material-symbols-outlined text-outline group-hover:text-secondary translate-x-1 group-hover:translate-x-2 transition-transform">add_circle</span>
                      </div>
                    </button>
                  ))}
                  {/* Fallback en caso de que no haya planes cargados dinámicamente aún */}
                  {(!allStaff.find(s => s.uid === 'gym_info_dummy')?.membershipPlans) && [
                    { id: '1month', label: 'Plan 1 Mes', price: '$40', color: 'text-secondary' },
                    ...(user.role === 'trainee' ? [
                      { id: '6months', label: 'Plan 6 Meses', price: '$200', color: 'text-primary-container' },
                      { id: '1year', label: 'Plan 1 Año', price: '$350', color: 'text-amber-400' }
                    ] : [])
                  ].map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => handleSubscriptionUpdate(plan.id as any)}
                      className="w-full p-4 rounded-3xl bg-surface-container-high border border-outline-variant/5 hover:border-secondary/30 hover:bg-surface-container-highest transition-all group flex items-center justify-between text-left"
                    >
                      <div className="flex flex-col">
                        <span className={`text-base font-black italic uppercase leading-none mb-1 text-white group-hover:text-secondary`}>{plan.label}</span>
                        <span className="text-[8px] font-black text-outline uppercase tracking-widest opacity-40">Pago Contado / Tarjeta</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black italic text-secondary">{plan.price}</span>
                        <span className="material-symbols-outlined text-outline group-hover:text-secondary translate-x-1 group-hover:translate-x-2 transition-transform">add_circle</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-outline-variant/10 mt-auto">
                   <p className="text-[8px] font-black text-outline-variant uppercase tracking-widest text-center italic"> Kinetic Gym Management v2.5</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Management */}
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-8">
                  <div>
                    <h5 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] italic mb-3 leading-none">Nivel de Acceso</h5>
                    <p className="text-sm font-black text-white italic uppercase leading-none">Permisos del Sistema</p>
                  </div>
                  
                   <div className="flex flex-col gap-3">
                     {[
                       { id: 'admin', label: 'Administrador Total', desc: 'Acceso a facturación y ajustes globales.' },
                       { id: 'trainer', label: 'Staff / Entrenador', desc: 'Gestión de rutinas y alumnos.' },
                       { id: 'trainee', label: 'Atleta / Cliente', desc: 'Acceso estándar a la aplicación.' }
                     ].map(role => (
                       <button
                         key={role.id}
                         onClick={() => handleRoleChange(role.id as any)}
                         className={`p-5 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                           user.role === role.id 
                             ? 'bg-secondary/10 border-secondary text-white' 
                             : 'bg-surface-container-high border-transparent text-outline hover:border-outline-variant/20'
                         }`}
                       >
                         <div className="flex flex-col gap-1">
                           <span className={`text-sm font-black uppercase italic ${user.role === role.id ? 'text-secondary' : 'text-outline group-hover:text-white'}`}>{role.label}</span>
                           <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 max-w-[200px]">{role.desc}</span>
                         </div>
                         {user.role === role.id && <span className="material-symbols-outlined text-secondary">verified</span>}
                       </button>
                     ))}
                   </div>

                  {/* Activation Status Toggle */}
                  <div className="pt-6 border-t border-outline-variant/10">
                    <button
                      onClick={async () => {
                        const newStatus = user.isActive === false;
                        const { toggleUserStatus } = await import('../services/db');
                        await toggleUserStatus(user.uid, newStatus);
                        // The real-time listener in the parent will update the UI automatically
                      }}
                      className={`w-full p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                        user.isActive === false 
                          ? 'bg-error/10 border-error text-error' 
                          : 'bg-primary-container/10 border-primary-container text-primary-container'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black uppercase italic">Estado de Cuenta</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                          {user.isActive === false ? 'Acceso suspendido actualmente' : 'Acceso activo al sistema'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined shrink-0">
                        {user.isActive === false ? 'block' : 'check_circle'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-6">
                  {user.role === 'trainer' ? (
                    <>
                      <div>
                        <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.4em] italic mb-3 leading-none">Jefe Administrativo</h5>
                        <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest opacity-50 italic">Supervisor responsable del entrenador</p>
                      </div>
                      
                      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {allStaff
                          .filter(staff => staff.role === 'admin' && staff.uid !== user.uid)
                          .map(admin => (
                            <button 
                              key={admin.uid}
                              onClick={async () => {
                                const { assignBossToStaff } = await import('../services/db');
                                await assignBossToStaff(user.uid, admin.uid, admin.displayName || admin.email);
                                // The real-time listener in the parent will update the UI automatically
                              }}
                              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                user.bossId === admin.uid 
                                  ? 'bg-amber-400/10 border-amber-400' 
                                  : 'bg-surface-container-high border-outline-variant/5 hover:bg-surface-container-highest'
                              }`}
                            >
                              <img 
                                src={admin.avatarUrl || `https://ui-avatars.com/api/?name=${admin.displayName || 'Admin'}&background=FF4444&color=FFFFFF`} 
                                className="w-10 h-10 rounded-xl border border-outline-variant/10 shadow-lg object-cover" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase italic truncate text-white leading-none mb-1 group-hover:text-amber-400 transition-colors">{admin.displayName || admin.email}</p>
                                <p className="text-[8px] font-black text-outline uppercase tracking-widest opacity-40 leading-none">Administrador Maestro</p>
                              </div>
                              {user.bossId === admin.uid && <span className="material-symbols-outlined text-amber-400 text-base">security</span>}
                            </button>
                          ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h5 className="text-[11px] font-black text-primary-container uppercase tracking-[0.4em] italic mb-3">Vínculo de Coach</h5>
                        <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest opacity-50 italic">Responsable técnico del alumno</p>
                      </div>
                      
                      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {allStaff
                          .filter(staff => staff.role === 'trainer')
                          .map(staff => (
                            <button 
                              key={staff.uid}
                              onClick={() => handleTrainerAssignment(staff)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                user.trainerId === staff.uid 
                                  ? 'bg-secondary/10 border-secondary' 
                                  : 'bg-surface-container-high border-outline-variant/5 hover:bg-surface-container-highest'
                              }`}
                            >
                              <img 
                                src={staff.avatarUrl || `https://ui-avatars.com/api/?name=${staff.displayName || 'Staff'}&background=CCFF00&color=121212`} 
                                className="w-10 h-10 rounded-xl border border-outline-variant/10 shadow-lg object-cover" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase italic truncate text-white leading-none mb-1 group-hover:text-secondary transition-colors">{staff.displayName || staff.email}</p>
                                <p className="text-[8px] font-black text-outline uppercase tracking-widest opacity-40 leading-none">{staff.role}</p>
                              </div>
                              {user.trainerId === staff.uid && <span className="material-symbols-outlined text-secondary text-base">verified</span>}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* High Risk Actions Section moved below in a separate row */}
              <div className="bg-surface-container-low/50 rounded-[32px] border border-dashed border-error/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-3xl">warning</span>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-error uppercase tracking-[0.4em] italic mb-1 leading-none">Zona Crítica</h5>
                    <p className="text-outline text-[9px] font-bold uppercase tracking-widest opacity-60 italic">Acciones Administrativas Irrevocables</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    onShowDialog({
                      type: 'confirm',
                      title: '¿REINICIAR CUENTA?',
                      message: `¿Estás seguro de que deseas eliminar TODOS los datos históricos de sesiones y progreso de ${user.displayName}? Esta acción NO se puede deshacer.`,
                      confirmText: 'BORRAR HISTORIAL',
                      onConfirm: () => {
                        alert("Funcionalidad de limpieza profunda en desarrollo.");
                      }
                    });
                  }}
                  className="px-8 py-4 rounded-2xl bg-error/10 hover:bg-error text-error hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-error/20 shadow-xl shadow-error/5"
                >
                  <span className="material-symbols-outlined text-lg">delete_forever</span> Reiniciar Datos Biométricos
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div 
              key="clients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h5 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] italic mb-3 leading-none">
                      {user.role === 'admin' ? 'Personal y Clientes' : 'Alumnos a Cargo'}
                    </h5>
                    <p className="text-sm font-black text-white italic uppercase leading-none">
                      {user.role === 'admin' ? 'Equipo bajo supervisión' : 'Gestión de Atletas Asignados'}
                    </p>
                  </div>
                  
                  <div className="relative w-full md:w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre..."
                      className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest placeholder:opacity-30 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers
                    .filter(u => {
                      // Filtrado base por supervisor
                      const isAssigned = user.role === 'admin' ? u.bossId === user.uid : u.trainerId === user.uid;
                      const matchesSearch = (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
                      return isAssigned && matchesSearch;
                    })
                    .map((client, idx) => {
                      const isActive = client.subscription?.status === 'active' && new Date(client.subscription.endDate) > now;
                      return (
                        <motion.div 
                          key={client.uid}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-surface-container-high/40 rounded-3xl p-5 border border-outline-variant/10 group hover:border-secondary/30 transition-all flex items-center gap-4"
                        >
                          <div className="relative">
                            <img 
                              src={client.avatarUrl || `https://ui-avatars.com/api/?name=${client.displayName || 'Usuario'}&background=${client.role === 'trainer' ? 'FFB74D' : (isActive ? 'CCFF00' : 'FF4444')}&color=121212&bold=true`} 
                              className="w-12 h-12 rounded-2xl border border-outline-variant/10 object-cover" 
                            />
                            {client.role === 'trainer' && (
                              <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-lg p-0.5 shadow-lg border border-surface-container-low">
                                <span className="material-symbols-outlined text-[10px] font-black">sports</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[11px] font-black uppercase italic truncate text-white group-hover:text-secondary transition-colors leading-none">
                                {client.displayName || client.email.split('@')[0]}
                              </p>
                              {client.role === 'trainer' && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[6px] font-black uppercase tracking-tighter">COACH</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${client.role === 'trainer' ? 'bg-amber-400' : (isActive ? 'bg-secondary' : 'bg-error')}`} />
                              <span className="text-[8px] font-black text-outline uppercase tracking-widest opacity-60">
                                {client.role === 'trainer' ? 'Entrenador' : (isActive ? 'Activo' : 'Vencido')}
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-outline/20 group-hover:text-secondary transition-colors">chevron_right</span>
                        </motion.div>
                      );
                    })}

                  {allUsers.filter(u => user.role === 'admin' ? u.bossId === user.uid : u.trainerId === user.uid).length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4 bg-surface-container-high/20 rounded-[32px] border-2 border-dashed border-outline-variant/10">
                      <span className="material-symbols-outlined text-4xl text-outline/20 italic animate-pulse">
                        {user.role === 'admin' ? 'diversity_3' : 'person_off'}
                      </span>
                      <p className="text-[10px] text-outline/30 italic uppercase tracking-[0.3em]">
                        {user.role === 'admin' ? 'No hay equipo asignado a esta cuenta' : 'No hay alumnos vinculados a este coach'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trainer Selection Modal */}
      <AnimatePresence>
        {isAssigningTrainer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 cursor-default">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssigningTrainer(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-low border border-outline-variant/20 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-outline-variant/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline text-2xl font-black uppercase italic text-white leading-none">SELECCIONAR COACH</h3>
                  <button 
                    onClick={() => setIsAssigningTrainer(false)}
                    className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-outline hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] italic">Vincular responsable técnico</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {allStaff
                  .filter(staff => staff.uid !== user.uid)
                  .map(staff => (
                    <button 
                      key={staff.uid}
                      onClick={() => handleTrainerAssignment(staff)}
                      className={`w-full flex items-center gap-4 p-4 rounded-3xl border transition-all text-left group ${
                        user.trainerId === staff.uid 
                          ? 'bg-secondary/10 border-secondary' 
                          : 'bg-surface-container-high/50 border-outline-variant/5 hover:bg-surface-container-high hover:border-outline-variant/20'
                      }`}
                    >
                      <img 
                        src={staff.avatarUrl || `https://ui-avatars.com/api/?name=${staff.displayName || 'Staff'}&background=CCFF00&color=121212`} 
                        className="w-12 h-12 rounded-2xl border border-outline-variant/10 shadow-lg object-cover" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black uppercase italic truncate text-white leading-none mb-1 group-hover:text-secondary transition-colors">
                          {staff.displayName || staff.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                            staff.role === 'admin' ? 'border-error/20 text-error' : 'border-secondary/20 text-secondary font-black'
                          }`}>
                            {staff.role}
                          </span>
                        </div>
                      </div>
                      {user.trainerId === staff.uid ? (
                        <span className="material-symbols-outlined text-secondary font-black">verified</span>
                      ) : (
                        <span className="material-symbols-outlined text-outline/20 group-hover:text-secondary/50 transition-colors">add_circle</span>
                      )}
                    </button>
                  ))}
                {allStaff.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <span className="material-symbols-outlined text-4xl text-outline/20 animate-pulse">group_off</span>
                    <p className="text-[10px] text-outline/30 italic uppercase tracking-widest">No hay staff disponible para asignar</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-surface-container-high/30 border-t border-outline-variant/10">
                <p className="text-[8px] font-black text-outline/40 text-center uppercase tracking-widest italic">
                  Kinetic Staff Management • 2026
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfileView;
