import React from 'react';
import { motion } from 'motion/react';
import { Screen, WorkoutSession, Exercise, Routine, ProgressLog, GymInfo } from '../types';
import { ROUTINES, getLevelColor, getTitleColor } from '../constants';
import { formatKineticDate } from '../utils/date';
import { DialogConfig } from './Dialog';

interface HomeProps {
  sessions: WorkoutSession[];
  progress: ProgressLog[];
  exercises: Exercise[];
  assignedRoutines?: Routine[];
  gymInfo: GymInfo | null;
  onNavigate: (screen: Screen) => void;
  onStartRoutine: (routine: Routine) => void;
  userProfile?: any;
  onShowDialog?: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

export const Home: React.FC<HomeProps> = ({ 
  sessions, 
  progress, 
  exercises, 
  assignedRoutines = [],
  gymInfo,
  onNavigate, 
  onStartRoutine,
  userProfile,
  onShowDialog
}) => {
  // 1. Weekly Activity Calculation
  // Assuming target is 5 sessions per week.
  const weeklySessions = sessions.length > 5 ? 5 : sessions.length; // Simplified for prototype
  const weeklyTarget = 5;
  const activityPercentage = (weeklySessions / weeklyTarget) * 100;

  // 2. Last Session Summary
  const lastSession = sessions[0]; // Assuming order is newest first

  // 3. Last Record (Max weight in the latest session)
  const lastRecord = (lastSession && lastSession.exercises) ? lastSession.exercises.reduce((max, ex) => {
    const exMaxSet = (ex.sets || []).reduce((sMax, s) => Math.max(sMax, s.weight), 0);
    if (exMaxSet > max.weight) {
      return { name: ex.name, weight: exMaxSet };
    }
    return max;
  }, { name: 'Ninguno', weight: 0 }) : { name: 'Sin Récords', weight: 0 };

  // 4. Latest Progress
  const latestProgress = progress[0];

  // 5. Latest Gym News
  const latestNews = gymInfo?.news && gymInfo.news.length > 0 
    ? [...gymInfo.news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  // 6. Subscription Calculation
  const subscription = userProfile?.subscription;
  const daysRemaining = subscription ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
  const totalDays = subscription ? Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const progressPercentage = subscription ? Math.max(0, Math.min(100, 100 - (daysRemaining! / totalDays) * 100)) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 space-y-8 pt-4 pb-24"
    >
      {/* Welcome */}
      <section className="space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-secondary font-headline font-black text-[10px] uppercase tracking-[0.2em]">{userProfile?.role === 'admin' ? 'PANEL ADMINISTRATIVO' : 'SISTEMA KINETIC v1.0'}</p>
            <h1 className="font-headline text-4xl font-black tracking-tight uppercase italic leading-none text-white">
              {userProfile?.role === 'admin' ? 'HOLA, ' : 'BIENVENIDO, '}
              <span className="text-secondary">{userProfile?.displayName?.split(' ')[0] || 'GUERRERO'}</span>
            </h1>
          </div>
          {userProfile?.role === 'trainee' && userProfile?.trainerId && (
            <div className="bg-surface-container-high px-4 py-2 rounded-2xl border border-outline-variant/10 flex flex-col items-end">
              <span className="text-[8px] font-black text-outline uppercase tracking-widest">Tu Coach</span>
              <span className="text-[10px] font-black text-secondary uppercase tracking-tight italic">{userProfile.trainerName || 'Asignado'}</span>
            </div>
          )}
        </div>
      </section>

      {/* Membership Alert Banner */}
      {userProfile?.role === 'trainee' && (daysRemaining === 0 || !subscription) && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => onNavigate('training')}
          className="bg-error/10 border-2 border-error/30 rounded-[32px] p-6 flex items-center justify-between group cursor-pointer hover:bg-error/20 transition-all shadow-xl shadow-error/5"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-error text-on-error flex items-center justify-center shadow-lg shadow-error/20">
              <span className="material-symbols-outlined font-black">payments</span>
            </div>
            <div>
              <h3 className="font-headline text-xl font-black text-white uppercase italic leading-none mb-1">Membresía Vencida</h3>
              <p className="text-[10px] font-bold text-error uppercase tracking-widest">Renueva ahora para desbloquear tus rutinas</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-error group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </motion.div>
      )}

      {/* Membership Warning (Expiring Soon) */}
      {userProfile?.role === 'trainee' && daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3 && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-secondary/10 border-2 border-secondary/30 rounded-[32px] p-6 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-black flex items-center justify-center shadow-lg shadow-secondary/20">
              <span className="material-symbols-outlined font-black">notification_important</span>
            </div>
            <div>
              <h3 className="font-headline text-xl font-black text-white uppercase italic leading-none mb-1">Vence Pronto</h3>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Tu plan expira en {daysRemaining} día{daysRemaining > 1 ? 's' : ''}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Latest News Highlight */}
      {latestNews && (
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => onNavigate('info')}
          className="bg-surface-container-high rounded-[32px] p-6 border-2 border-secondary/20 shadow-2xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all mb-8"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-start gap-5 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
              latestNews.type === 'alert' ? 'bg-error/10 border-error/20 text-error' : 
              latestNews.type === 'promo' ? 'bg-secondary/10 border-secondary/20 text-secondary' : 
              'bg-primary-container/10 border-primary-container/20 text-primary-container'
            }`}>
              <span className="material-symbols-outlined font-black">
                {latestNews.type === 'alert' ? 'warning' : latestNews.type === 'promo' ? 'campaign' : 'info'}
              </span>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Última Noticia</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
                <span className="text-[8px] font-bold text-outline uppercase">
                  {formatKineticDate(latestNews.date)}
                </span>
              </div>
              <h2 className="font-headline text-xl font-black uppercase italic tracking-tight leading-tight mb-2 truncate">
                {latestNews.title}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium line-clamp-2 leading-relaxed opacity-80">
                {latestNews.content}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Activity Card */}
        <motion.div 
          onClick={() => onNavigate('historial')}
          whileTap={{ scale: 0.98 }}
          className="col-span-2 bg-surface-container-high rounded-[32px] p-8 relative overflow-hidden group cursor-pointer border border-outline-variant/5 shadow-xl"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px]">analytics</span>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex justify-between items-start">
              <div className="bg-secondary/10 p-3 rounded-2xl border border-secondary/20">
                <span className="material-symbols-outlined text-secondary text-2xl">monitoring</span>
              </div>
              <span className="text-secondary font-headline text-4xl font-black italic">{Math.round(activityPercentage)}%</span>
            </div>
            <div>
              <h2 className="text-on-surface-variant font-black text-[10px] uppercase tracking-[0.2em] mb-2">Actividad de la Semana</h2>
              <p className="font-headline text-3xl font-black leading-none uppercase italic">{weeklySessions} de {weeklyTarget} <span className="text-sm font-bold text-outline uppercase not-italic">Entrenamientos</span></p>
              <div className="mt-6 flex gap-1.5 h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                {Array.from({ length: weeklyTarget }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-colors duration-1000 ${i < weeklySessions ? 'bg-secondary' : 'bg-outline-variant opacity-20'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Last Session Card */}
        <motion.div 
          onClick={() => onNavigate('historial')}
          whileTap={{ scale: 0.95 }}
          className="col-span-1 bg-surface-container-high rounded-[32px] p-6 flex flex-col justify-between min-h-[220px] cursor-pointer hover:bg-surface-container-highest transition-colors border border-outline-variant/5 shadow-lg"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center border border-primary-container/30">
              <span className="material-symbols-outlined text-primary-container text-2xl">fitness_center</span>
            </div>
            <div>
              <h3 className="text-outline font-black text-[10px] uppercase tracking-[0.2em]">Último Esfuerzo</h3>
              <p className="font-headline text-xl font-black leading-tight mt-2 uppercase italic truncate">{lastSession?.name || '¡EMPIEZA YA!'}</p>
            </div>
          </div>
          <div className="space-y-1 mt-4 pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span className="text-xs font-bold">{lastSession?.date || 'Sin fecha'}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-base">schedule</span>
              <span className="text-xs font-bold">{lastSession?.duration || '--:--'}</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Record & Rest */}
        <div className="col-span-1 space-y-4 flex flex-col">
          <motion.div 
            onClick={() => onNavigate('historial')}
            whileTap={{ scale: 0.95 }}
            className="bg-surface-container-high rounded-[32px] p-6 flex flex-col justify-between flex-1 cursor-pointer border border-outline-variant/5 shadow-lg"
          >
            <div>
              <h3 className="text-outline font-black text-[10px] uppercase tracking-[0.2em] mb-3">Último Récord</h3>
              <p className="font-bold text-xs uppercase text-on-surface truncate">{lastRecord.name}</p>
              <p className="font-headline text-4xl font-black text-secondary italic leading-none mt-1">
                {lastRecord.weight}<span className="text-xs font-bold not-italic ml-1 text-on-surface-variant">KG</span>
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            onClick={() => onNavigate('descanso')}
            whileTap={{ scale: 0.95 }}
            className="bg-secondary text-on-secondary rounded-[32px] p-6 flex items-center gap-4 cursor-pointer shadow-lg shadow-secondary/20 active:brightness-95 transition-all"
          >
            <span className="material-symbols-outlined text-3xl">timer</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80">Descanso</p>
              <p className="font-headline font-black text-2xl leading-none italic">90S</p>
            </div>
          </motion.div>
        </div>

        {/* Library Card */}
        <motion.div 
          onClick={() => onNavigate('ejercicios')}
          whileTap={{ scale: 0.98 }}
          className="col-span-1 bg-on-surface text-surface rounded-[32px] p-5 flex flex-col justify-between group cursor-pointer shadow-xl min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-xl bg-surface/10 flex items-center justify-center text-surface">
            <span className="material-symbols-outlined text-2xl">menu_book</span>
          </div>
          <div>
            <p className="font-headline font-black text-lg uppercase tracking-tight leading-none mb-1">Biblioteca</p>
            <p className="text-[8px] uppercase font-black tracking-widest opacity-60">+{exercises.length} Movimientos</p>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div 
          onClick={() => onNavigate('progreso')}
          whileTap={{ scale: 0.98 }}
          className="col-span-1 bg-surface-container-high rounded-[32px] p-5 flex flex-col justify-between group cursor-pointer border border-outline-variant/5 shadow-xl min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
            <span className="material-symbols-outlined text-2xl">show_chart</span>
          </div>
          <div>
            <p className="font-headline font-black text-lg uppercase tracking-tight leading-none mb-1 text-on-surface">Progreso</p>
            <p className="text-[8px] uppercase font-black tracking-widest text-secondary">{latestProgress?.weight} KG Registrados</p>
          </div>
        </motion.div>
      </div>

      {/* Rutinas Asignadas */}
      {assignedRoutines.length > 0 && (
        <section className="pt-8 mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-headline text-2xl font-black uppercase italic tracking-tight text-secondary">Tus Programas</h2>
              <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mt-1">Asignados por tu entrenador</p>
            </div>
          </div>
          <div className="space-y-4">
            {assignedRoutines.map((routine, i) => (
              <div key={`${routine.id}-${i}`} className="bg-surface-container-high rounded-[32px] p-6 shadow-xl border border-outline-variant/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 shrink-0 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                <div className="flex flex-wrap justify-between items-start mb-4 relative z-10 gap-x-4 gap-y-2">
                  <div className="flex-1 min-w-[120px]">
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
                    onClick={() => onStartRoutine(routine)}
                    className="bg-secondary text-background hover:bg-white text-[10px] uppercase tracking-widest font-black px-6 py-3 rounded-full hover:scale-105 active:scale-[0.98] transition-all shrink-0 shadow-lg shadow-secondary/20"
                  >
                    Iniciar
                  </button>
                </div>
                <div className="flex items-center gap-4 text-outline text-[9px] font-black uppercase tracking-[0.2em] relative z-10 pt-4 border-t border-outline-variant/5">
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

      {/* Featured Workout */}
      <section className="pt-8">
        <div 
          onClick={() => onStartRoutine(ROUTINES[0])}
          className="relative w-full aspect-[16/9] rounded-[40px] overflow-hidden shadow-2xl cursor-pointer group active:scale-[0.98] transition-all"
        >
          <img 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Push Day A"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-6 right-6">
            <div className="bg-secondary text-on-secondary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">SUGERIDO</div>
          </div>
          <div className="absolute inset-0 p-8 flex flex-col justify-end pointer-events-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div className="max-w-full sm:max-w-[70%]">
                <p className="text-secondary font-black text-[10px] uppercase tracking-[0.3em] mb-1">RETO DEL DÍA</p>
                <h3 className="font-headline text-3xl md:text-5xl font-black leading-none uppercase italic tracking-tighter animate-in fade-in slide-in-from-bottom-2">{ROUTINES[0].name}</h3>
                <p className="text-on-surface-variant text-xs font-bold mt-2 opacity-80 line-clamp-2 md:line-clamp-none leading-relaxed">{ROUTINES[0].description}</p>
              </div>
              <div className="w-16 h-16 kinetic-gradient rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-90 transition-transform shrink-0 self-end sm:self-auto pointer-events-auto">
                <span className="material-symbols-outlined text-on-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
