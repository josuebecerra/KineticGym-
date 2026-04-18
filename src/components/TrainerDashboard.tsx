import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Routine, SubscriptionData } from '../types';
import UserProfileView from './UserProfileView';
import { 
  assignRoutineToUser, 
  updateUserSubscription, 
  requestElectronicInvoice,
  getUsersPaginated,
  getStaffUsers,
  searchUsers,
  getGlobalDashboardStats
} from '../services/db';
import { DialogConfig } from './Dialog';
import { ROUTINES, getLevelColor, getTitleColor } from '../constants';
import { InvoicingConfig } from './InvoicingConfig';
import { InvoicingDashboard } from './InvoicingDashboard';
import { migrateBase64ToStorage } from '../utils/migration_utils';

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
  const [activeTab, setActiveTab] = useState<'trainee' | 'trainer' | 'admin' | 'requests' | 'invoices'>('trainee');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({ 
    field: 'displayName', 
    direction: 'asc' 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvoicingConfig, setShowInvoicingConfig] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<any[]>([null]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, expired: 0, pending: 0 });

  const [pageSize, setPageSize] = useState(5);

  // Unified effect for search, tab changes and initial load
  useEffect(() => {
    if (searchQuery.length === 0) {
      // Immediate load for empty search or tab switch
      setCursorStack([null]);
      setCurrentPage(1);
      loadUsers(1, [null]);
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performGlobalSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, pageSize]);

  useEffect(() => {
    refreshGlobalStats();
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const staff = await getStaffUsers();
      setAllStaff(staff);
    } catch (error) {
      console.error("Error fetching staff for assignment:", error);
    }
  };

  const refreshGlobalStats = async () => {
    try {
      const gStats = await getGlobalDashboardStats();
      setGlobalStats(gStats);
    } catch (error) {
      console.error("Error fetching global stats:", error);
    }
  };

  const performGlobalSearch = async () => {
    // Silent loading for search
    setIsLoading(false); // In case it was true, don't flicker full screen
    setIsSearchingGlobal(true);
    try {
      const { users, lastDoc, hasMore: more } = await searchUsers(searchQuery, pageSize);
      setTrainees(users);
      setLastVisibleDoc(lastDoc);
      setHasMore(more);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async (page: number = 1, stack: any[] = cursorStack) => {
    // Only show full-screen loader on first load or if list is empty
    if (trainees.length === 0) {
      setIsLoading(true);
    }
    
    setIsSearchingGlobal(false);
    
    try {
      // Determine filters based on role and tab
      const filters: any = {};
      
      if (currentRole === 'trainer') {
        filters.role = 'trainee';
        filters.trainerId = currentUserUid;
      } else if (currentRole === 'admin') {
        if (activeTab === 'requests') {
          filters.role = 'trainee';
          filters.membershipRequestStatus = 'pending';
        } else {
          filters.role = activeTab; // 'trainee', 'trainer', or 'admin'
        }
      }

      const cursor = stack[page - 1];
      const { users, lastDoc, hasMore: more } = await getUsersPaginated(
        pageSize, 
        cursor,
        filters,
        sortConfig.field,
        sortConfig.direction
      );
      
      setTrainees(users);

      if (lastDoc && stack.length <= page) {
        setCursorStack([...stack, lastDoc]);
      }

      setCurrentPage(page);
      setHasMore(more);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    // Reset to first page on sort change
    setCursorStack([null]);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCursorStack([null]);
    setCurrentPage(1);
  };

  // Trigger reload on sort change or page size change
  useEffect(() => {
    if (!selectedTrainee) {
      loadUsers(1, [null]);
    }
  }, [sortConfig, pageSize]);

  const handleAssign = async (routine: Routine) => {
    if (!selectedTrainee) return;
    try {
      const trainerProfile = allStaff.find(s => s.uid === currentUserUid) || { uid: currentUserUid, displayName: 'Entrenador' };
      await assignRoutineToUser(
        selectedTrainee.uid, 
        routine, 
        currentUserUid, 
        trainerProfile.displayName || 'Entrenador'
      );
      
      // Update local state to show author info immediately
      const routineWithAuthor = {
        ...routine,
        authorId: currentUserUid,
        authorName: trainerProfile.displayName || 'Entrenador'
      };
      
      const updatedTrainee = { 
        ...selectedTrainee, 
        assignedRoutines: [...(selectedTrainee.assignedRoutines || []), routineWithAuthor] 
      };
      
      setSelectedTrainee(updatedTrainee);
      setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? updatedTrainee : t));

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
        message: 'El nuevo coach ha sido vinculado exitosamente a este perfil.',
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
      refreshGlobalStats();
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
      refreshGlobalStats();
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
      refreshGlobalStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveRoutine = async (routineId: string) => {
    if (!selectedTrainee) return;
    
    // Check permissions: only author or admin can remove
    const routine = selectedTrainee.assignedRoutines?.find((r, idx) => `${r.id}-${idx}` === routineId || r.id === routineId);
    const isOwner = routine?.authorId === currentUserUid;
    const isAdmin = currentRole === 'admin';

    if (!isOwner && !isAdmin) {
      onShowDialog({
        type: 'error',
        title: 'ACCESO DENEGADO',
        message: 'Solo el entrenador que asignó esta rutina (o un Administrador) puede eliminarla.',
        confirmText: 'ENTENDIDO'
      });
      return;
    }

    try {
      const { updateUserProfile } = await import('../services/db');
      // We use index-based identification or similar if IDs repeat, but for simplicity:
      const updatedRoutines = (selectedTrainee.assignedRoutines || []).filter((r, idx) => `${r.id}-${idx}` !== routineId && r.id !== routineId);
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

  const handleClearAllRoutines = async () => {
    if (!selectedTrainee) return;
    
    onShowDialog({
      type: 'confirm',
      title: '¿LIMPIAR TODAS LAS RUTINAS?',
      message: `¿Estás seguro de que deseas eliminar TODAS las rutinas asignadas a ${selectedTrainee.displayName}? Esta acción no se puede deshacer.`,
      confirmText: 'SÍ, BORRAR TODO',
      cancelText: 'CANCELAR',
      onConfirm: async () => {
        try {
          const { updateUserProfile } = await import('../services/db');
          await updateUserProfile(selectedTrainee.uid, { assignedRoutines: [] });
          
          const updatedTrainee = { ...selectedTrainee, assignedRoutines: [] };
          setSelectedTrainee(updatedTrainee);
          setTrainees(prev => prev.map(t => t.uid === selectedTrainee.uid ? updatedTrainee : t));
          
          onShowDialog({
            type: 'success',
            title: 'LIMPIEZA COMPLETA',
            message: `Todas las rutinas de ${selectedTrainee.displayName} han sido eliminadas.`,
            confirmText: 'ENTENDIDO'
          });
          refreshGlobalStats();
        } catch (err) {
          console.error(err);
          onShowDialog({
            type: 'error',
            title: 'ERROR DE LIMPIEZA',
            message: 'No pudimos limpiar las rutinas de este usuario.',
            confirmText: 'REINTENTAR'
          });
        }
      }
    });
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
          refreshGlobalStats();
          
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
      refreshGlobalStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStorageMigration = async () => {
    onShowDialog({
      type: 'confirm',
      title: '¿MIGRAR IMÁGENES A LA NUBE?',
      message: 'Esta acción buscará todas las fotos guardadas como texto (antiguas) y las subirá a Google Cloud Storage para mejorar la velocidad. Podría tardar unos minutos.',
      confirmText: 'SÍ, INICIAR MIGRACIÓN',
      onConfirm: async () => {
        setIsMigrating(true);
        try {
          const result = await migrateBase64ToStorage((msg) => {
            console.log(msg);
          });
          
          onShowDialog({
            type: 'success',
            title: 'MIGRACIÓN COMPLETADA',
            message: `Se han migrado con éxito ${result.migratedAvatars} avatares y ${result.migratedProgressPhotos} fotos de progreso. ¡Tu app ahora es más rápida!`,
            confirmText: 'ENTENDIDO'
          });
          
          await loadUsers(); // Refresh list to see new URLs
        } catch (err) {
          console.error("Migration failed:", err);
          onShowDialog({
            type: 'error',
            title: 'FALLO EN MIGRACIÓN',
            message: 'Hubo un error al subir las fotos. Revisa la consola para más detalles.',
            confirmText: 'CERRAR'
          });
        } finally {
          setIsMigrating(false);
        }
      }
    });
  };

  // Filtering logic
  const filteredUsers = trainees.filter(u => {
    if (activeTab === 'requests') {
      return u.membershipRequest?.status === 'pending';
    }
    const role = u.role || 'trainee';
    const matchesTab = role === activeTab;
    
    // If searching globally, we don't apply the tab filter strictly if we want to find them 
    // BUT the user usually stays in a tab. For now, if searching global, we show all results 
    // that match the tab if we are in one.
    if (isSearchingGlobal) return true; 

    return matchesTab;
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

  const stats = globalStats;

  const getMembershipStatus = (u: UserProfile) => {
    if (!u.subscription) return { label: 'Sin Plan', color: 'text-outline bg-outline/10' };
    const isExpired = new Date(u.subscription.endDate) <= new Date();
    if (u.subscription.status === 'canceled') return { label: 'Cancelado', color: 'text-error bg-error/10' };
    return isExpired 
      ? { label: 'Vencido', color: 'text-error bg-error/10' }
      : { label: 'Activo', color: 'text-primary-container bg-primary-container/20' };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-3 sm:px-6 pt-4 space-y-6 sm:space-y-8 pb-32"
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
            <div className="ml-auto flex gap-2">
              <button 
                onClick={handleStorageMigration}
                disabled={isMigrating}
                className={`w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center hover:bg-secondary/20 transition-all active:scale-95 border border-secondary/20 ${isMigrating ? 'animate-pulse opacity-50' : ''}`}
                title="Migrar Imágenes a Cloud Storage"
              >
                <span className="material-symbols-outlined text-xl">{isMigrating ? 'sync' : 'cloud_sync'}</span>
              </button>
              <button 
                onClick={handleGlobalCleanup}
                className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-all active:scale-95 border border-error/20"
                title="Limpieza Global de Rutinas"
              >
                <span className="material-symbols-outlined text-xl">mop</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {!selectedTrainee && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-0.5 mt-2">
            {[
              { label: 'Total Usuarios', value: stats.total, icon: 'groups', color: 'text-white' },
              { label: 'Planes Activos', value: stats.active, icon: 'check_circle', color: 'text-primary-container' },
              { label: 'Membresías Vencidas', value: stats.expired, icon: 'history', color: 'text-error' },
              { label: 'Solicitudes', value: stats.pending, icon: 'notifications_active', color: 'text-secondary', alert: stats.pending > 0 }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-low p-5 sm:p-6 rounded-[32px] border border-outline-variant/10 shadow-sm relative overflow-hidden group"
              >
                <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl opacity-5 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </span>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-sm ${stat.color}`}>{stat.icon}</span>
                    <span className="text-[9px] font-black text-outline uppercase tracking-[0.2em]">{stat.label}</span>
                    {stat.alert && <span className="w-1.5 h-1.5 bg-error rounded-full animate-ping" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl sm:text-3xl font-headline font-black italic leading-none ${stat.color}`}>{stat.value}</span>
                    <span className="text-[10px] font-black text-outline/40 uppercase tracking-widest ml-1">Reg</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}


        {/* Tab Switcher */}
        {!selectedTrainee && currentRole === 'admin' && (
          <div className="flex bg-surface-container-high/40 p-1.5 rounded-[28px] gap-1.5 mx-0.5 border border-outline-variant/5">
            {[
              { id: 'trainee', label: 'CLIENTES', icon: 'person' },
              { id: 'trainer', label: 'COACHES', icon: 'fitness_center' },
              { id: 'admin', label: 'ADMINS', icon: 'security' },
              { id: 'requests', label: 'PENDIENTES', icon: 'notifications_active' },
              { id: 'invoices', label: 'FACTURACIÓN', icon: 'receipt_long' }
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
      ) : activeTab === 'invoices' ? (
        <InvoicingDashboard onOpenConfig={() => setShowInvoicingConfig(true)} />
      ) : !selectedTrainee ? (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 sm:px-4">
            <div className="flex items-center gap-4">
              <h3 className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase text-on-surface-variant flex items-center gap-2">
                <span className="w-4 sm:w-6 h-px bg-outline-variant/30" />
                Directorio de {activeTab === 'trainee' ? 'Clientes' : activeTab === 'trainer' ? 'Staff' : 'Control'}
              </h3>
              <div className="bg-surface-container-high px-3 py-1 rounded-full border border-secondary/20 shadow-lg shadow-black/10">
                <span className="text-[9px] font-black text-secondary tracking-widest">{filteredUsers.length}</span>
              </div>
            </div>

            <div className="relative group flex-1 sm:min-w-[280px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg group-focus-within:text-secondary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="BUSCAR EN ESTA SECCIÓN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-outline-variant/40 focus:ring-1 focus:ring-secondary/30 transition-all outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-container-high rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-[40px] border border-outline-variant/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                    <th className="px-6 py-5">
                      <button 
                        onClick={() => handleSort('displayName')}
                        className="flex items-center gap-1.5 group outline-none"
                      >
                        <span className="text-[9px] font-black text-outline uppercase tracking-[0.2em] group-hover:text-secondary transition-colors">Cliente</span>
                        <span className={`material-symbols-outlined text-[14px] transition-all ${sortConfig.field === 'displayName' ? 'text-secondary opacity-100' : 'text-outline opacity-0 group-hover:opacity-40'}`}>
                          {sortConfig.field === 'displayName' && sortConfig.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-5">
                      <button 
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-1.5 group outline-none"
                      >
                        <span className="text-[9px] font-black text-outline uppercase tracking-[0.2em] group-hover:text-secondary transition-colors">Rol</span>
                        <span className={`material-symbols-outlined text-[14px] transition-all ${sortConfig.field === 'role' ? 'text-secondary opacity-100' : 'text-outline opacity-0 group-hover:opacity-40'}`}>
                          {sortConfig.field === 'role' && sortConfig.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-5">
                      <span className="text-[9px] font-black text-outline uppercase tracking-[0.2em]">Estado</span>
                    </th>
                    <th className="px-6 py-5 hidden md:table-cell">
                      <button 
                        onClick={() => handleSort('trainerName')}
                        className="flex items-center gap-1.5 group outline-none"
                      >
                        <span className="text-[9px] font-black text-outline uppercase tracking-[0.2em] group-hover:text-secondary transition-colors">Coach</span>
                        <span className={`material-symbols-outlined text-[14px] transition-all ${sortConfig.field === 'trainerName' ? 'text-secondary opacity-100' : 'text-outline opacity-0 group-hover:opacity-40'}`}>
                          {sortConfig.field === 'trainerName' && sortConfig.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-5 text-right">
                      <span className="text-[9px] font-black text-outline uppercase tracking-[0.2em]">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {filteredUsers.map((t, index) => {
                    const status = getMembershipStatus(t);
                    return (
                      <motion.tr 
                        key={t.uid || `trainee-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => { setSelectedTrainee(t); window.scrollTo(0, 0); }}
                        className="group hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                              <img 
                                src={t.avatarUrl || `https://ui-avatars.com/api/?name=${t.displayName || (t.email ? t.email.split('@')[0] : 'Alumno')}&background=${t.role === 'admin' ? 'FF4444' : 'CCFF00'}&color=121212&bold=true`} 
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-outline-variant/10 group-hover:border-secondary/30 transition-colors shadow-lg" 
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-headline font-black text-xs sm:text-sm uppercase tracking-tight group-hover:text-secondary transition-colors truncate">{t.displayName || (t.email ? t.email.split('@')[0] : 'Usuario')}</p>
                              <p className="text-outline text-[7px] sm:text-[8px] font-bold uppercase tracking-widest truncate opacity-50 italic">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getRoleColor(t.role || 'trainee')}`}>
                            {t.role || 'trainee'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit ${status.color}`}>
                              {status.label}
                            </span>
                            {t.subscription && t.subscription.status === 'active' && (
                              <span className="text-[8px] font-bold text-outline uppercase tracking-widest opacity-40">
                                Vence: {new Date(t.subscription.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-xs">
                          {t.role === 'trainee' ? (
                            <div className={`flex items-center gap-2 ${t.trainerName ? 'text-secondary' : 'text-outline/40 italic'}`}>
                              <span className="material-symbols-outlined text-sm">{t.trainerName ? 'sports' : 'person_off'}</span>
                              <span className="text-[9px] font-black uppercase tracking-wider">{t.trainerName || 'Sin asignar'}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-outline/20 uppercase italic tracking-widest">---</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                            {activeTab === 'requests' && (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleApproveRequest(t); }}
                                  className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary hover:text-black transition-all flex items-center justify-center shadow-lg shadow-black/10"
                                >
                                  <span className="material-symbols-outlined text-sm">check</span>
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRejectRequest(t); }}
                                  className="w-8 h-8 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-all flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </>
                            )}
                            <button className="w-8 h-8 rounded-lg bg-surface-container-highest text-outline group-hover:text-secondary group-hover:bg-secondary/10 transition-all flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low/30 border-t border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-4">person_search</span>
                <p className="text-outline text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Sin registros</p>
              </div>
            )}
          </div>

          {/* Premium Pagination */}
          {!isSearchingGlobal && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-8">
              <div className="flex items-center gap-6 order-2 sm:order-1">
                {/* Rows Selector */}
                <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10">
                  <span className="text-[9px] font-black text-outline uppercase tracking-widest whitespace-nowrap">Filas</span>
                  <div className="flex items-center gap-1">
                    {[5, 10, 20, 50].map((size) => (
                      <button
                        key={size}
                        onClick={() => handlePageSizeChange(size)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                          pageSize === size 
                            ? 'bg-secondary text-background shadow-[0_0_10px_rgba(202,253,0,0.2)]' 
                            : 'text-outline hover:text-white hover:bg-surface-container-high'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => loadUsers(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-outline hover:text-secondary hover:border-secondary/30 disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                  
                  <div className="flex items-center gap-1.5 mx-2">
                    {Array.from({ length: Math.max(currentPage, cursorStack.length) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => loadUsers(pageNum)}
                        className={`min-w-[40px] h-10 rounded-xl font-headline font-black italic text-[11px] transition-all border ${
                          currentPage === pageNum 
                            ? 'bg-secondary text-background border-secondary transform scale-110 shadow-[0_0_15px_rgba(202,253,0,0.3)]' 
                            : 'bg-surface-container-low text-outline border-outline-variant/10 hover:border-secondary/40 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => loadUsers(currentPage + 1)}
                        className="min-w-[40px] h-10 rounded-xl bg-surface-container-low text-outline-variant/30 border border-outline-variant/10 font-headline font-black italic text-[11px] flex items-center justify-center gap-0.5 hover:text-white hover:border-secondary/40 transition-all"
                      >
                        ...
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => loadUsers(currentPage + 1)}
                    disabled={!hasMore || isLoading}
                    className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-outline hover:text-secondary hover:border-secondary/30 disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:ml-auto order-1 sm:order-2">
                {isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-outline-variant/10 border-t-secondary rounded-full animate-spin" />
                    <span className="text-[9px] font-black text-outline uppercase tracking-widest animate-pulse">Cargando...</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[9px] font-black text-outline uppercase tracking-widest leading-none">Página Actual</p>
                  <p className="text-xl font-headline font-black italic text-secondary mt-1">{currentPage}</p>
                </div>
              </div>
            </div>
          )}

        </section>
      ) : (
        <UserProfileView 
          user={selectedTrainee}
          currentRole={currentRole}
          currentUserUid={currentUserUid}
          allStaff={allStaff}
          ROUTINES={ROUTINES}
          onBack={() => {
            setSelectedTrainee(null);
            setIsAssigningTrainer(false);
          }}
          onShowDialog={onShowDialog}
          handleRoleChange={handleRoleChange}
          handleSubscriptionUpdate={handleSubscriptionUpdate}
          handleCancelSubscription={handleCancelSubscription}
          handleRemoveRoutine={handleRemoveRoutine}
          handleClearAllRoutines={handleClearAllRoutines}
          handleTrainerAssignment={handleTrainerAssignment}
          handleAssign={handleAssign}
          getLevelColor={getLevelColor}
          getTitleColor={getTitleColor}
          isAssigningTrainer={isAssigningTrainer}
          setIsAssigningTrainer={setIsAssigningTrainer}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
        />
      )}
      {showInvoicingConfig && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
          <InvoicingConfig onClose={() => setShowInvoicingConfig(false)} />
        </div>
      )}
    </motion.div>
  );
};
