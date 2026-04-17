import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, SubscriptionData, Routine } from '../types';

interface UserProfileViewProps {
  user: UserProfile;
  currentRole: string | undefined;
  currentUserUid: string | undefined;
  allStaff: UserProfile[];
  ROUTINES: Routine[];
  onBack: () => void;
  onShowDialog: (config: any) => void;
  handleRoleChange: (newRole: 'admin' | 'trainer' | 'trainee') => void;
  handleSubscriptionUpdate: (planId: '1month' | '6months' | '1year') => void;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'membership' | 'admin'>('overview');

  const now = new Date();
  const subStatus = user.subscription?.status === 'active' && new Date(user.subscription.endDate) > now ? 'ACTIVO' : 'INACTIVO';
  const subColor = subStatus === 'ACTIVO' ? 'text-secondary border-secondary/30 bg-secondary/10' : 'text-error border-error/30 bg-error/10';

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
    { id: 'membership', label: 'Membresía', icon: 'payments' },
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
                <span className="px-3 py-1 bg-surface-container-highest border border-outline-variant/10 rounded-full text-[9px] font-black uppercase tracking-widest text-outline">
                  {user.role || 'TRAINEE'}
                </span>
                <span className={`px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${subColor}`}>
                  {subStatus}
                </span>
                {user.trainerName && (
                  <span className="px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-[9px] font-black uppercase tracking-widest text-primary-container flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">school</span> {user.trainerName}
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
              {currentRole === 'admin' && user.role === 'trainee' && (
                <button 
                  onClick={() => setIsAssigningTrainer(!isAssigningTrainer)}
                  className="w-full py-4 rounded-2xl kinetic-gradient text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-base">school</span> 
                  {user.trainerId ? 'Cambiar PT' : 'Asignar PT'}
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
                        <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container">
                          <span className="material-symbols-outlined">fitness_center</span>
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase italic text-white group-hover:text-primary-container transition-colors">{routine.name}</p>
                          <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{routine.category} • {routine.level}</p>
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

              {/* Routine Assignment Catalog Section (INSIDE THE TAB) */}
              {(currentRole === 'admin' || (currentRole === 'trainer' && user.trainerId === currentUserUid)) ? (
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-6">
                  <div className="flex flex-col">
                    <h5 className="text-[11px] font-black text-primary-container uppercase tracking-[0.4em] italic">Catálogo de Entrenamiento</h5>
                    <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest mt-1 opacity-50 italic">Expande el programa del alumno</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ROUTINES.map(routine => (
                      <div key={routine.id} className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 group hover:border-primary-container/30 transition-all shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)}`}>
                              {routine.level}
                            </span>
                          </div>
                          <h3 className={`font-headline text-xl font-black uppercase tracking-tight italic leading-none mb-3 ${getTitleColor(routine.level)} group-hover:text-primary-container transition-colors`}>
                            {routine.name}
                          </h3>
                          <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed line-clamp-2 opacity-60 mb-6">{routine.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                           <div className="flex items-center gap-3 text-outline text-[8px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs opacity-50">fitness_center</span> {routine.exercisesCount}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleAssign(routine)}
                            className="bg-primary-container text-on-primary-container text-[8px] uppercase tracking-widest font-black px-4 py-2.5 rounded-xl hover:scale-105 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/10 border border-primary-container/20"
                          >
                            ASIGNAR AHORA
                          </button>
                        </div>
                      </div>
                    ))}
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
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1 opacity-50 italic">Vence el</p>
                        <p className="text-sm font-black italic uppercase text-white">{new Date(user.subscription.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1 opacity-50 italic">Días Restantes</p>
                        <p className={`text-sm font-black italic uppercase ${daysRemaining < 5 ? 'text-error' : 'text-secondary'}`}>{daysRemaining}</p>
                      </div>
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => setShowHistory(!showHistory)}
                          className="w-10 h-10 rounded-xl bg-surface-container-highest text-secondary hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg"
                        >
                          <span className="material-symbols-outlined text-lg">{showHistory ? 'visibility_off' : 'history'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub History List */}
                <AnimatePresence>
                  {showHistory && user.subscriptionHistory && user.subscriptionHistory.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-4"
                    >
                      <h6 className="text-[9px] font-black text-outline uppercase tracking-widest italic ml-1">Historial de Registros:</h6>
                      <div className="space-y-3">
                        {user.subscriptionHistory.slice().reverse().map((sub, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black italic uppercase text-white">{sub.planId === '1month' ? 'Mensual' : sub.planId === '6months' ? 'Semestral' : 'Anual'}</span>
                              <span className="text-[8px] font-bold text-outline uppercase tracking-widest">{new Date(sub.startDate).toLocaleDateString()} al {new Date(sub.endDate).toLocaleDateString()}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${sub.status === 'active' ? 'border-primary-container/20 text-primary-container bg-primary-container/5' : 'border-outline-variant/20 text-outline-variant bg-outline-variant/5'}`}>
                              {sub.status === 'active' ? 'Finalizado' : sub.status === 'canceled' ? 'Cancelado' : 'Expirado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Assignments / Renewals */}
              <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 flex flex-col gap-6">
                <div>
                  <h5 className="text-[11px] font-black text-outline uppercase tracking-[0.4em] italic mb-2 leading-none">Gestión de Pago</h5>
                  <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest italic leading-none opacity-50">Renovaciones rápidas</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: '1month', label: 'Plan 1 Mes', price: '$40', color: 'text-secondary' },
                    { id: '6months', label: 'Plan 6 Meses', price: '$200', color: 'text-primary-container' },
                    { id: '1year', label: 'Plan 1 Año', price: '$350', color: 'text-amber-400' }
                  ].map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => handleSubscriptionUpdate(plan.id as any)}
                      className="w-full p-4 rounded-3xl bg-surface-container-high border border-outline-variant/5 hover:border-secondary/30 hover:bg-surface-container-highest transition-all group flex items-center justify-between text-left"
                    >
                      <div className="flex flex-col">
                        <span className={`text-base font-black italic uppercase leading-none mb-1 text-white group-hover:${plan.color}`}>{plan.label}</span>
                        <span className="text-[8px] font-black text-outline uppercase tracking-widest opacity-40">Pago Contado / Tarjeta</span>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-secondary translate-x-1 group-hover:translate-x-2 transition-transform">add_circle</span>
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
                </div>

                {/* Trainer Management Section (INSIDE THE ADMIN TAB) */}
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 space-y-6">
                  <div>
                    <h5 className="text-[11px] font-black text-primary-container uppercase tracking-[0.4em] italic mb-3">Vínculo de Coach</h5>
                    <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest opacity-50 italic">Responsable técnico del alumno</p>
                  </div>
                  
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {allStaff
                      .filter(staff => staff.uid !== user.uid)
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
                    {allStaff.length === 0 && (
                      <p className="text-[10px] text-outline/30 italic uppercase text-center py-10">Cargando Staff disponible...</p>
                    )}
                  </div>
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
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default UserProfileView;
