import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, Routine, SubscriptionData } from '../types';
import { getAllUsers, assignRoutineToUser, updateUserSubscription } from '../services/db';
import { DialogConfig } from './Dialog';
import { ROUTINES, getLevelColor, getTitleColor } from '../constants';

interface TrainerDashboardProps {
  onBack: () => void;
  currentRole?: string;
  currentUserUid?: string;
  onShowDialog: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onBack, currentRole, currentUserUid, onShowDialog }) => {
  const [trainees, setTrainees] = useState<UserProfile[]>([]);
  const [allStaff, setAllStaff] = useState<UserProfile[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigningTrainer, setIsAssigningTrainer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'trainee' | 'trainer' | 'admin' | 'requests'>('trainee');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      
      // Store all staff for assignment dropdown (admin only)
      if (currentRole === 'admin') {
        const staff = users.filter(u => u.role === 'admin' || u.role === 'trainer');
        setAllStaff(staff);
      }

      // Filter trainees based on role
      if (currentRole === 'trainer') {
        // Trainers only see their assigned trainees (must be role 'trainee')
        setTrainees(users.filter(u => u.role === 'trainee' && u.trainerId === currentUserUid));
      } else if (currentRole === 'admin') {
        // Admins see everyone to perform assignments/role changes
        // But we can filter to only trainees for the main list if desired
        setTrainees(users); 
      } else {
        setTrainees([]);
      }
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
      onShowDialog({
        type: 'success',
        title: 'RUTINA ASIGNADA',
        message: `La rutina "${routine.name}" ha sido vinculada con éxito a ${selectedTrainee.displayName}.`,
        confirmText: 'ENTENDIDO'
      });
    } catch (err) {
      console.error(err);
      onShowDialog({
        type: 'error',
        title: 'ERROR DE ASIGNACIÓN',
        message: 'No pudimos vincular la rutina en este momento. Inténtalo de nuevo.',
        confirmText: 'REINTENTAR'
      });
    }
  };

  const handleTrainerAssignment = async (trainer: UserProfile) => {
    if (!selectedTrainee) return;
    try {
      const { assignTrainerToUser } = await import('../services/db');
      await assignTrainerToUser(selectedTrainee.uid, trainer.uid, trainer.displayName || trainer.email || 'Entrenador');
      
      // Update local state
      setSelectedTrainee(prev => prev ? { ...prev, trainerId: trainer.uid, trainerName: trainer.displayName } : null);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? { ...t, trainerId: trainer.uid, trainerName: trainer.displayName } : t));
      
      setIsAssigningTrainer(false);
      onShowDialog({
        type: 'success',
        title: 'COACH ASIGNADO',
        message: `Has vinculado a ${trainer.displayName} como el nuevo coach oficial de ${selectedTrainee.displayName}.`,
        confirmText: 'GENIAL'
      });
    } catch (err) {
      console.error("Error asignando entrenador:", err);
      onShowDialog({
        type: 'error',
        title: 'ERROR DE VÍNCULO',
        message: 'Hubo un fallo al asignar el entrenador. Por favor, verifica la conexión.',
        confirmText: 'CERRAR'
      });
    }
  };

  const handleRoleChange = async (newRole: "admin" | "trainer" | "trainee") => {
    if (!selectedTrainee || currentRole !== 'admin') return;
    try {
      const { updateUserProfile } = await import('../services/db');
      await updateUserProfile(selectedTrainee.uid, { role: newRole });
      
      setSelectedTrainee(prev => prev ? { ...prev, role: newRole } : null);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? { ...t, role: newRole } : t));
      
      onShowDialog({
        type: 'success',
        title: 'ROL ACTUALIZADO',
        message: `El perfil de ${selectedTrainee.displayName} ahora tiene privilegios de ${newRole.toUpperCase()}.`,
        confirmText: 'ENTENDIDO'
      });
    } catch (err) {
      console.error("Error cambiando rol:", err);
      onShowDialog({
        type: 'error',
        title: 'ERROR DE SISTEMA',
        message: 'No pudimos actualizar el rol del usuario. Verifica los permisos del administrador.',
        confirmText: 'CERRAR'
      });
    }
  };

  const handleSubscriptionUpdate = async (planId: '1month' | '6months' | '1year') => {
    if (!selectedTrainee) return;
    
    const now = new Date();
    let startDate = now;
    
    // Renewal logic: if there's an active sub, start from its end date
    if (selectedTrainee.subscription && selectedTrainee.subscription.status === 'active') {
      const currentEnd = new Date(selectedTrainee.subscription.endDate);
      if (currentEnd > now) {
        startDate = currentEnd;
      }
    }

    const endDate = new Date(startDate);
    if (planId === '1month') endDate.setMonth(endDate.getMonth() + 1);
    else if (planId === '6months') endDate.setMonth(endDate.getMonth() + 6);
    else if (planId === '1year') endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription: SubscriptionData = {
      planId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active'
    };

    try {
      await updateUserSubscription(selectedTrainee.uid, subscription);
      
      // Update local state (including history)
      const updatedHistory = [...(selectedTrainee.subscriptionHistory || []), subscription];
      const updatedTrainee = { ...selectedTrainee, subscription, subscriptionHistory: updatedHistory };
      
      setSelectedTrainee(updatedTrainee);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? updatedTrainee : t));
      
      onShowDialog({
        type: 'success',
        title: 'MEMBRESÍA ACTUALIZADA',
        message: `El plan de ${planId === '1month' ? '1 mes' : planId === '6months' ? '6 meses' : '1 año'} ha sido registrado. Comienza el ${startDate.toLocaleDateString()} y vence el ${endDate.toLocaleDateString()}.`,
        confirmText: 'EXCELENTE'
      });
    } catch (err) {
      console.error("Error actualizando suscripción:", err);
      onShowDialog({
        type: 'error',
        title: 'FALLO EN REGISTRO',
        message: 'No pudimos actualizar la suscripción. Inténtalo de nuevo.',
        confirmText: 'CERRAR'
      });
    }
  };

  const handleCancelSubscription = async (reason: string) => {
    if (!selectedTrainee || !reason.trim()) return;
    try {
      const { cancelMembership } = await import('../services/db');
      await cancelMembership(selectedTrainee.uid, reason);
      
      const now = new Date().toISOString();
      const updatedSub: SubscriptionData = {
        ...selectedTrainee.subscription!,
        status: 'canceled',
        endDate: now,
        cancelReason: reason
      };

      const updatedHistory = (selectedTrainee.subscriptionHistory || []).map(sub => {
        if (sub.startDate === selectedTrainee.subscription?.startDate) {
          return updatedSub;
        }
        return sub;
      });

      const updatedTrainee = { 
        ...selectedTrainee, 
        subscription: updatedSub,
        subscriptionHistory: updatedHistory,
        membershipRequest: null 
      };
      
      setSelectedTrainee(updatedTrainee);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? updatedTrainee : t));
      
      onShowDialog({
        type: 'info',
        title: 'PLAN CANCELADO',
        message: 'La membresía ha sido revocada inmediatamente. El motivo ha quedado registrado en el historial.',
        confirmText: 'ENTENDIDO'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRequest = async (user: UserProfile) => {
    if (!user.membershipRequest) return;
    try {
      const planId = user.membershipRequest.planId;
      const now = new Date();
      let startDate = now;
      
      // Calculate dates locally for immediate state update
      if (user.subscription && user.subscription.status === 'active') {
        const currentEnd = new Date(user.subscription.endDate);
        if (currentEnd > now) {
          startDate = currentEnd;
        }
      }

      const endDate = new Date(startDate);
      if (planId === '1month') endDate.setMonth(endDate.getMonth() + 1);
      else if (planId === '6months') endDate.setMonth(endDate.getMonth() + 6);
      else if (planId === '1year') endDate.setFullYear(endDate.getFullYear() + 1);

      const newSubscription: SubscriptionData = {
        planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active'
      };

      const { approveMembership } = await import('../services/db');
      await approveMembership(user.uid, planId);
      
      // Update local state with calculated values & history
      setTrainees(prev => prev.map(t => t.uid === user.uid ? { 
        ...t, 
        subscription: newSubscription, 
        subscriptionHistory: [...(t.subscriptionHistory || []), newSubscription],
        membershipRequest: null 
      } : t));
      
      onShowDialog({
        type: 'success',
        title: 'MEMBRESÍA ACTIVADA',
        message: `El plan de ${user.displayName} ha sido aprobado y activado con éxito. Inicia el ${startDate.toLocaleDateString()} y vence el ${endDate.toLocaleDateString()}.`,
        confirmText: 'EXCELENTE'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveRoutine = async (routineId: string) => {
    if (!selectedTrainee) return;
    try {
      const { updateUserProfile } = await import('../services/db');
      const updatedRoutines = (selectedTrainee.assignedRoutines || []).filter(r => r.id !== routineId);
      await updateUserProfile(selectedTrainee.uid, { assignedRoutines: updatedRoutines });
      
      const updatedTrainee = { ...selectedTrainee, assignedRoutines: updatedRoutines };
      setSelectedTrainee(updatedTrainee);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? updatedTrainee : t));
      
      onShowDialog({
        type: 'info',
        title: 'RUTINA ELIMINADA',
        message: 'La rutina ha sido removida del perfil del alumno.',
        confirmText: 'OK'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGlobalCleanup = async () => {
    onShowDialog({
      type: 'confirm',
      title: '¿LIMPIEZA TOTAL?',
      message: 'Esta acción borrará todas las rutinas asignadas a TODOS los clientes del sistema. Es una tarea de mantenimiento irreversible.',
      confirmText: 'SÍ, BORRAR TODO',
      onConfirm: async () => {
        try {
          const { clearAllRoutines } = await import('../services/db');
          await clearAllRoutines();
          onShowDialog({
            type: 'success',
            title: 'SISTEMA REINICIADO',
            message: 'Se han eliminado todas las rutinas de todos los usuarios con éxito.',
            confirmText: 'ENTENDIDO'
          });
          
          await loadUsers(); // Refresh list
          // CRITICAL: Update/Reset selected trainee to reflect clouds state
          if (selectedTrainee) {
            setSelectedTrainee(prev => prev ? { ...prev, assignedRoutines: [] } : null);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleRejectRequest = async (user: UserProfile) => {
    try {
      const { rejectMembership } = await import('../services/db');
      await rejectMembership(user.uid);
      
      // Update local state
      setTrainees(prev => prev.map(t => t.uid === user.uid ? { ...t, membershipRequest: { ...t.membershipRequest!, status: 'rejected' } } : t));
      
      onShowDialog({
        type: 'info',
        title: 'SOLICITUD RECHAZADA',
        message: `La petición de ${user.displayName} ha sido marcada como rechazada.`,
        confirmText: 'ENTENDIDO'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering logic
  const filteredUsers = trainees.filter(u => {
    if (activeTab === 'requests') {
      return u.membershipRequest?.status === 'pending';
    }
    const role = u.role || 'trainee';
    const matchesTab = role === activeTab;
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return 'admin_panel_settings';
      case 'trainer': return 'school';
      default: return 'person';
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'border-error/40 text-error shadow-error/10';
      case 'trainer': return 'border-secondary/40 text-secondary shadow-secondary/10';
      default: return 'border-outline-variant/10 text-primary-container shadow-primary/5';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-4 space-y-8 pb-32"
    >
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all active:scale-95">
            <span className="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl sm:text-4xl font-black tracking-tight uppercase italic leading-none text-white">CENTRAL STAFF</h1>
            <p className="text-[9px] sm:text-[10px] font-black text-secondary uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-2">
              {currentRole === 'admin' ? 'Administración Global de Kinetic' : 'Gestión de Alumnos'}
            </p>
          </div>
          {currentRole === 'admin' && !selectedTrainee && (
            <button 
              onClick={handleGlobalCleanup}
              className="ml-auto w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-all active:scale-95 border border-error/20"
              title="Limpieza Global de Rutinas"
            >
              <span className="material-symbols-outlined text-xl">mop</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        {!selectedTrainee && (
          <div className="relative group mx-0.5">
            <div className="absolute inset-0 bg-secondary/5 rounded-[24px] blur-xl group-focus-within:bg-secondary/10 transition-all" />
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/10 rounded-[24px] px-5 py-3.5 sm:px-6 sm:py-4 transition-all focus-within:border-secondary/30 focus-within:ring-1 focus-within:ring-secondary/20">
              <span className="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors mr-3 text-xl">search</span>
              <input 
                type="text" 
                placeholder={`Buscar...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-bold text-white placeholder:text-outline/50 w-full uppercase tracking-widest"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-surface-container-high rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        {!selectedTrainee && currentRole === 'admin' && (
          <div className="flex bg-surface-container-high/40 p-1.5 rounded-[28px] gap-1.5 mx-0.5 border border-outline-variant/5">
            {[
              { id: 'trainee', label: 'CLIENTES', icon: 'person' },
              { id: 'trainer', label: 'COACHES', icon: 'fitness_center' },
              { id: 'admin', label: 'ADMINS', icon: 'security' },
              { id: 'requests', label: 'PENDIENTES', icon: 'notifications_active' }
            ].map(tab => {
              const hasRequests = tab.id === 'requests' && trainees.some(u => u.membershipRequest?.status === 'pending');
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-2 rounded-[22px] transition-all relative overflow-hidden active:scale-95 ${
                    isActive 
                      ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/15' 
                      : 'text-outline-variant hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? 'scale-110' : 'opacity-70'} transition-transform`} style={{ fontSize: '20px' }}>
                    {tab.icon}
                  </span>
                  <span className="hidden md:inline text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                  {hasRequests && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-surface-container-high animate-pulse" />
                  )}
                  {isActive && (
                    <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-secondary -z-10" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-surface-container-high rounded-full" />
            <div className="absolute inset-0 border-4 border-t-secondary rounded-full animate-spin" />
            <div className="absolute inset-0 border-4 border-r-secondary/30 rounded-full animate-spin [animation-duration:1.5s]" />
          </div>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em] animate-pulse">Sincronizando Base de Datos...</p>
        </div>
      ) : !selectedTrainee ? (
        <section className="space-y-6">
          <div className="flex justify-between items-center px-1 sm:px-4">
            <h3 className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.4em] uppercase text-on-surface-variant flex items-center gap-2">
              <span className="w-4 sm:w-6 h-px bg-outline-variant/30" />
              Directorio de {activeTab === 'trainee' ? 'Clientes' : activeTab === 'trainer' ? 'Staff' : 'Control'}
            </h3>
            <div className="bg-surface-container-high px-3 py-1 rounded-full border border-secondary/20 shadow-lg shadow-black/10">
              <span className="text-[9px] font-black text-secondary tracking-widest">{filteredUsers.length}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map((t, index) => (
              <motion.div 
                key={t.uid || `trainee-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { setSelectedTrainee(t); window.scrollTo(0, 0); }}
                className={`bg-surface-container-high border ${getRoleColor(t.role || 'trainee')} p-6 rounded-[32px] cursor-pointer hover:bg-surface-container-low transition-all group relative overflow-hidden flex flex-col justify-between h-full`}
              >
                {/* Background Role Icon */}
                <span className="absolute -bottom-4 -right-4 material-symbols-outlined text-8xl italic opacity-5 group-hover:scale-110 transition-transform -rotate-12">
                  {getRoleIcon(t.role || 'trainee')}
                </span>

                <div className="flex items-center gap-5 mb-6">
                  <div className="relative shrink-0">
                    <img 
                      src={t.avatarUrl || `https://ui-avatars.com/api/?name=${t.displayName || (t.email ? t.email.split('@')[0] : 'Alumno')}&background=${t.role === 'admin' ? 'FF4444' : 'CCFF00'}&color=121212&bold=true`} 
                      className="w-16 h-16 rounded-[24px] border-2 border-outline-variant/10 shadow-lg group-hover:border-secondary/30 transition-colors" 
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-surface-container-high flex items-center justify-center ${t.role === 'admin' ? 'bg-error' : t.role === 'trainer' ? 'bg-secondary' : 'bg-primary'}`}>
                      <span className="material-symbols-outlined text-[12px] text-black font-black">
                        {getRoleIcon(t.role || 'trainee')}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-headline font-black text-xl uppercase tracking-tight leading-none group-hover:text-secondary transition-colors truncate">{t.displayName || (t.email ? t.email.split('@')[0] : 'Usuario')}</h4>
                    <p className="text-outline text-[9px] font-bold uppercase tracking-[0.2em] mt-2 truncate opacity-70 italic">{t.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Rol de Acceso</span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.role === 'admin' ? 'text-error' : t.role === 'trainer' ? 'text-secondary' : 'text-primary'}`}>
                        {t.role || 'TRAINEE'}
                      </span>
                    </div>
                    {t.role === 'trainee' && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Membresía</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${t.subscription && new Date(t.subscription.endDate) > new Date() ? 'bg-primary-container/20 text-primary-container' : 'bg-error/10 text-error'}`}>
                          {t.subscription ? (new Date(t.subscription.endDate) > new Date() ? 'ACTIVA' : 'VENCIDA') : 'SIN PLAN'}
                        </span>
                      </div>
                    )}
                    {t.role === 'trainee' && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Coach Responsable</span>
                        <span className={`text-[9px] font-black uppercase flex items-center gap-1.5 ${t.trainerName ? 'text-secondary' : 'text-error'}`}>
                          <span className="material-symbols-outlined text-[14px]">{t.trainerName ? 'school' : 'person_off'}</span>
                          {t.trainerName || 'SIN ASIGNAR'}
                        </span>
                      </div>
                    )}
                    {t.role === 'trainer' && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Dashboard</span>
                        <span className="text-[12px] font-black text-secondary flex items-center gap-1">
                           <span className="material-symbols-outlined text-sm">bolt</span> COACH
                        </span>
                      </div>
                    )}
                    {activeTab === 'requests' && t.membershipRequest && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-secondary uppercase tracking-widest mb-1 animate-pulse">Solicita Plan</span>
                        <span className="text-[11px] font-black text-white uppercase tracking-tighter italic">
                          {t.membershipRequest.planId === '1month' ? 'Mensual' : t.membershipRequest.planId === '6months' ? 'Semestral' : 'Anual'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {activeTab === 'requests' && (
                    <div className="flex gap-2 pt-4 mt-2 border-t border-secondary/10 relative z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleApproveRequest(t); }}
                        className="flex-1 bg-secondary text-black py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20"
                      >
                        Aprobar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRejectRequest(t); }}
                        className="flex-1 bg-surface-container-highest text-outline py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-error transition-all"
                      >
                        Ignorar
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[8px] font-black text-outline-variant/60 uppercase tracking-widest mt-1 group-hover:text-secondary/50 transition-colors">
                    <span>Ver Detalles Completos</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 bg-surface-container-low/30 rounded-[48px] border-2 border-dashed border-outline-variant/10">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant/30 italic">person_search</span>
              </div>
              <p className="text-outline text-[11px] font-black uppercase tracking-[0.4em] italic mb-2">Sin resultados cargados</p>
              <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest">Intenta cambiar la categoría o el término de búsqueda</p>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[40px] border border-outline-variant/10 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-9xl italic">person</span>
            </div>

            <div className="flex items-center gap-6 relative z-10">
              <img src={selectedTrainee.avatarUrl || `https://ui-avatars.com/api/?name=${selectedTrainee.displayName || (selectedTrainee.email ? selectedTrainee.email.split('@')[0] : 'Alumno')}&background=CCFF00&color=121212&bold=true`} className="w-24 h-24 rounded-[32px] border-2 border-primary-container/20 shadow-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2 leading-none">Gestión Especializada</p>
                <h4 className="font-headline text-3xl font-black uppercase italic leading-none truncate mb-3">{selectedTrainee.displayName || (selectedTrainee.email ? selectedTrainee.email.split('@')[0] : 'Alumno')}</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[9px] font-black uppercase tracking-widest text-secondary">{selectedTrainee.role || 'TRAINEE'}</span>
                  {selectedTrainee.trainerName ? (
                    <span className="px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-[9px] font-black uppercase tracking-widest text-primary-container flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">school</span> {selectedTrainee.trainerName}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-error/10 border border-error/20 rounded-full text-[9px] font-black uppercase tracking-widest text-error">Sin Entrenador</span>
                  )}
                </div>

                {/* Assigned Routines List (Individual Removal) */}
                {selectedTrainee.assignedRoutines && selectedTrainee.assignedRoutines.length > 0 && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-outline-variant/10">
                    <p className="text-[9px] font-black text-outline uppercase tracking-widest ml-1">Rutinas Asignadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrainee.assignedRoutines.map((routine, idx) => (
                        <div key={`${routine.id}-${idx}`} className="flex items-center gap-2 bg-surface-container-highest px-3 py-2 rounded-xl group/routine hover:bg-surface-container-high transition-colors border border-outline-variant/5">
                          <span className="text-[10px] font-black text-on-surface uppercase tracking-tight italic">{routine.name}</span>
                          <button 
                            onClick={() => handleRemoveRoutine(routine.id)}
                            className="w-5 h-5 rounded-lg hover:bg-error/10 text-outline hover:text-error transition-all flex items-center justify-center opacity-0 group-hover/routine:opacity-100"
                            title="Eliminar de este perfil"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex gap-3 relative z-10">
              <button onClick={() => setSelectedTrainee(null)} className="flex-1 bg-surface-container-highest py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-outline hover:text-on-surface transition-all">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Volver
              </button>
              {currentRole === 'admin' && selectedTrainee.role === 'trainee' && (
                <button onClick={() => setIsAssigningTrainer(!isAssigningTrainer)} className="flex-1 kinetic-gradient py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-primary-container shadow-xl shadow-primary/20">
                  <span className="material-symbols-outlined text-lg">school</span> {selectedTrainee.trainerId ? 'Cambiar PT' : 'Asignar PT'}
                </button>
              )}
            </div>

            {/* Admin Role Toggle (Inline) */}
            {currentRole === 'admin' && (
              <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-4">
                <span className="text-[9px] font-black text-outline uppercase tracking-widest">Nivel de Acceso:</span>
                <div className="flex gap-2">
                  {['admin', 'trainer', 'trainee'].map(roleOption => (
                    <button
                      key={roleOption}
                      onClick={() => handleRoleChange(roleOption as any)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        selectedTrainee.role === roleOption 
                          ? 'bg-secondary text-on-secondary shadow-lg' 
                          : 'bg-surface-container-high text-outline hover:text-on-surface'
                      }`}
                    >
                      {roleOption}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Subscription Management (Inline) */}
            {currentRole === 'admin' && selectedTrainee.role === 'trainee' && (
              <div className="mt-4 pt-4 border-t border-outline-variant/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-outline uppercase tracking-widest">Estado Membresía:</span>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-[8px] font-black text-secondary hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">{showHistory ? 'visibility_off' : 'history'}</span>
                    {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
                  </button>
                </div>

                {selectedTrainee.subscription ? (
                  <div className="bg-surface-container-high rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-[8px] font-black uppercase tracking-widest">
                        PLAN {selectedTrainee.subscription.planId === '1month' ? 'MENSUAL' : selectedTrainee.subscription.planId === '6months' ? 'SEMESTRAL' : 'ANUAL'}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${new Date(selectedTrainee.subscription.endDate) < new Date() ? 'text-error' : 'text-primary-container'}`}>
                        {new Date(selectedTrainee.subscription.endDate) < new Date() ? 'VENCIDO' : 'ACTIVO'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Inició</p>
                        <p className="text-[10px] font-black text-on-surface uppercase">{new Date(selectedTrainee.subscription.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Vence</p>
                        <p className="text-[10px] font-black text-on-surface uppercase">{new Date(selectedTrainee.subscription.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-high/50 rounded-2xl p-4 text-center border-2 border-dashed border-outline-variant/10">
                    <p className="text-[8px] font-black text-outline uppercase tracking-widest">Sin membresía registrada</p>
                  </div>
                )}

                {/* Renewal/Assignment Buttons */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-outline uppercase tracking-widest ml-1">
                    {selectedTrainee.subscription ? 'Renovar / Cambiar Plan:' : 'Asignar Nuevo Plan:'}
                  </p>
                  <div className="flex gap-2">
                    {[
                      { id: '1month', label: '1 Mes' },
                      { id: '6months', label: '6 Meses' },
                      { id: '1year', label: '1 Año' }
                    ].map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => handleSubscriptionUpdate(plan.id as any)}
                        className="flex-1 px-3 py-3 rounded-xl bg-surface-container-highest text-[9px] font-black uppercase tracking-widest text-outline hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg transition-all"
                      >
                        {plan.label}
                      </button>
                    ))}
                  </div>
                  
                  {selectedTrainee.subscription && selectedTrainee.subscription.status === 'active' && (
                    <button
                      onClick={() => {
                        onShowDialog({
                          type: 'confirm',
                          title: '¿CANCELAR MEMBRESÍA?',
                          message: 'Se revocará el acceso de forma inmediata. Debes ingresar una justificación técnica.',
                          showInput: true,
                          inputPlaceholder: "Motivo de la baja...",
                          confirmText: 'PROCESAR BAJA',
                          onConfirm: (val) => {
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
                      className="w-full py-4 rounded-xl border-2 border-error/20 text-error text-[10px] font-black uppercase tracking-widest hover:bg-error/5 transition-all mt-2"
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-2">cancel</span>
                      Cancelar Plan Vigente
                    </button>
                  )}
                </div>

                {/* History List */}
                {showHistory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 mt-2">
                    <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Registro Histórico</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {(selectedTrainee.subscriptionHistory || []).slice().reverse().map((sub, idx) => (
                        <div key={idx} className="bg-surface-container-low border border-outline-variant/10 p-3 rounded-xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                          <div>
                            <p className="text-[8px] font-black text-on-surface uppercase tracking-tight">
                              Plan {sub.planId === '1month' ? 'Mensual' : sub.planId === '6months' ? 'Semestral' : 'Anual'}
                              {sub.status === 'canceled' && <span className="ml-2 text-error font-black italic">[CANCELADO]</span>}
                            </p>
                            <p className="text-[7px] font-bold text-outline uppercase mt-0.5">{new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}</p>
                            {sub.cancelReason && (
                              <p className="text-[7px] font-black text-error/60 uppercase mt-1 italic leading-relaxed">Motivo: {sub.cancelReason}</p>
                            )}
                          </div>
                          <span className="text-[7px] font-black text-outline-variant uppercase bg-surface-container-highest px-2 py-1 rounded-full">Registro #{selectedTrainee.subscriptionHistory!.length - idx}</span>
                        </div>
                      ))}
                      {(!selectedTrainee.subscriptionHistory || selectedTrainee.subscriptionHistory.length === 0) && (
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest text-center py-4 italic">No hay historial previo</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Trainer Assignment Modal/Section (Admin Only) */}
          {isAssigningTrainer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">Seleccionar Entrenador Responsable</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allStaff
                  .filter(staff => staff.uid !== selectedTrainee.uid) // Prevent self-assignment if trainee is somehow staff
                  .map(staff => (
                  <button 
                    key={staff.uid}
                    onClick={() => handleTrainerAssignment(staff)}
                    className={`flex items-center gap-3 p-4 rounded-3xl border transition-all text-left ${
                      selectedTrainee.trainerId === staff.uid 
                        ? 'bg-secondary/10 border-secondary' 
                        : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container-high'
                    }`}
                  >
                    <img src={staff.avatarUrl || `https://ui-avatars.com/api/?name=${staff.displayName || 'Staff'}&background=CCFF00&color=121212`} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-headline font-black text-sm uppercase italic leading-none">{staff.displayName || staff.email}</p>
                      <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] mt-1">{staff.role}</p>
                    </div>
                    {selectedTrainee.trainerId === staff.uid && <span className="material-symbols-outlined text-secondary ml-auto">check_circle</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Routine Assignment Section */}
          {(currentRole === 'admin' || (currentRole === 'trainer' && selectedTrainee.trainerId === currentUserUid)) ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">Catálogo de Entrenamiento</h4>
                <span className="text-[9px] font-bold text-outline-variant uppercase">Asignar para Hoy</span>
              </div>
              <div className="space-y-4">
                {ROUTINES.map(routine => (
                  <div key={routine.id} className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 group hover:border-primary-container/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getLevelColor(routine.level)}`}>
                            {routine.level}
                          </span>
                        </div>
                        <h3 className={`font-headline text-2xl font-black uppercase tracking-tight italic leading-none mb-2 ${getTitleColor(routine.level)} group-hover:text-primary-container transition-colors`}>
                          {routine.name}
                        </h3>
                        <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed line-clamp-1 opacity-60">{routine.description}</p>
                      </div>
                      <button 
                        onClick={() => handleAssign(routine)}
                        className="bg-primary-container text-on-primary-container text-[10px] uppercase tracking-widest font-black px-6 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shrink-0 shadow-lg shadow-primary-container/10"
                      >
                        Asignar Plan
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-outline text-[9px] font-black uppercase tracking-[0.3em] pt-4 border-t border-outline-variant/5">
                      <span className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-sm opacity-50">fitness_center</span> {routine.exercisesCount} Bloques
                      </span>
                      <span className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-sm opacity-50">category</span> {routine.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-high/30 rounded-[40px] p-8 border-2 border-dashed border-outline-variant/10 text-center space-y-4">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl text-outline-variant/50">lock</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.3em]">Acceso Restringido</p>
                <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed">
                  Solo el Entrenador designado ({selectedTrainee.trainerName || 'N/A'}) <br /> puede asignar rutinas a este alumno.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </motion.div>
  );
};
