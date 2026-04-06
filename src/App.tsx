import { useState, useEffect, useRef } from 'react';
import { Screen, WorkoutSession, Routine, ProgressLog, WorkoutState, UserProfile, RestState } from './types';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Workout } from './components/Workout';
import { History } from './components/History';
import { Rest } from './components/Rest';
import { Exercises } from './components/Exercises';
import { Progress } from './components/Progress';
import { Settings } from './components/Settings';
import { TrainerDashboard } from './components/TrainerDashboard';
import { Leaderboard } from './components/Leaderboard';
import { GymInfo } from './components/GymInfo';
import { Hub } from './components/Hub';
import { RoutineManager } from './components/RoutineManager';
import { Login } from './components/Login';
import { Assessment } from './components/Assessment';
import { EXERCISES } from './constants';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { initializeUser, listenToUserData, saveWorkoutSession, deleteWorkoutSession, saveProgressLog, getAllUsers, listenToGymInfo } from './services/db';
import { Dialog, DialogConfig } from './components/Dialog';
import { SessionWarningDialog } from './components/SessionWarningDialog';
import { MembershipGate } from './components/MembershipGate';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';



export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [activeScreen, setActiveScreen] = useState<Screen>('inicio');
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<ProgressLog[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [gymInfo, setGymInfo] = useState<any>(null);
  const [preSelectedRoutine, setPreSelectedRoutine] = useState<Routine | null>(null);
  const [isEditingAssessment, setIsEditingAssessment] = useState(false);

  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    isActive: false,
    selectedRoutine: null,
    activeExercises: [],
    elapsedSeconds: 0
  });
  
  const [restState, setRestState] = useState<RestState>({
    isActive: false,
    timeLeft: 90,
    totalTime: 90
  });

  const lastActivityRef = useRef<number>(Date.now());
  // Stable refs to avoid remounting the session interval when state changes
  const gymInfoRef = useRef<any>(null);
  const workoutActiveRef = useRef<boolean>(false);
  const userRef = useRef<User | null>(null);

  // Global Dialog State
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  const hasShownSubscriptionAlert = useRef(false);
  const hasShownTimeoutWarningRef = useRef(false);
  const sessionNonceRef = useRef<string>(Math.random().toString(36).substring(7));

  // State for the dedicated session warning dialog (separate from global Dialog)
  const [sessionWarning, setSessionWarning] = useState<{ show: boolean; totalSeconds: number; secondsLeft: number }>({
    show: false,
    totalSeconds: 0,
    secondsLeft: 0,
  });

  // Debug Timer State (only for testing as requested)
  const [debugTimeLeft, setDebugTimeLeft] = useState<string>('--:--');

  const showDialog = (config: Omit<DialogConfig, 'isOpen'>) => {
    setDialogConfig({ ...config, isOpen: true });
  };

  // Stable ref to handleLogout so the interval always calls the latest version
  const handleLogoutRef = useRef<() => Promise<void>>(async () => {});

  // Function to completely clear all user data and sign out
  const handleLogout = async (nonce?: string) => {
    // If a nonce is provided, only proceed if it matches the current session ticket
    if (nonce && nonce !== sessionNonceRef.current) {
      console.warn("Logout attempt blocked: Stale session ticket (nonce).");
      return;
    }

    try {
      await signOut(auth);
      // Reset all states
      setUser(null);
      setUserProfile(null);
      setHistory([]);
      setProgress([]);
      setAllUsers([]);
      setPreSelectedRoutine(null);
      setIsEditingAssessment(false);
      setActiveScreen('inicio');
      
      // CLEANUP: Close all session-related dialogs and warnings
      setSessionWarning({ show: false, totalSeconds: 0, secondsLeft: 0 });
      setDialogConfig({ isOpen: false, type: 'info', title: '', message: '' });
      hasShownTimeoutWarningRef.current = false;
      hasShownSubscriptionAlert.current = false;
      
      // PERSISTENT CLEANUP: Scrub all activity history from storage
      localStorage.removeItem('kinetic_last_activity');
      localStorage.removeItem('kinetic_session_nonce');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Keep stable refs in sync with state (these don't cause re-renders)
  useEffect(() => { gymInfoRef.current = gymInfo; }, [gymInfo]);
  useEffect(() => { workoutActiveRef.current = workoutState.isActive; }, [workoutState.isActive]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { handleLogoutRef.current = handleLogout; });

  // Native Mobile Initialization
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0e0e0e' });
    }
  }, []);

  // Activity Tracking — mounted ONCE, reads dynamic values via stable refs
  useEffect(() => {
    const handleActivity = () => {
      // THE VAULT: If the warning is showing, ignore absolutely ALL background activity.
      if (hasShownTimeoutWarningRef.current === true) return;
      
      const now = Date.now();
      localStorage.setItem('kinetic_last_activity', now.toString());

      // Sincronización instantánea para el hilo actual (además del listener global)
      lastActivityRef.current = now;

      // Instant refresh of the debug timer label
      if (userRef.current) {
        const timeoutMin = Number(gymInfoRef.current?.sessionTimeoutMinutes) || 30;
        setDebugTimeLeft(`[VIVO] ${timeoutMin}:00`);
      }
    };

    window.addEventListener('mousemove', handleActivity, true);
    window.addEventListener('mousedown', handleActivity, true);
    window.addEventListener('scroll', handleActivity, true);
    window.addEventListener('wheel', handleActivity, true);
    window.addEventListener('click', handleActivity, true);
    window.addEventListener('pointerdown', handleActivity, true);
    window.addEventListener('keydown', handleActivity, true);
    window.addEventListener('touchstart', handleActivity, true);
    
    // Cross-Tab Sync: If last activity changes in another tab, update here instantly
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kinetic_last_activity' && e.newValue) {
        lastActivityRef.current = parseInt(e.newValue);
      }
      if (e.key === 'kinetic_session_nonce' && e.newValue) {
        sessionNonceRef.current = e.newValue;
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Interval runs ONCE for the lifetime of the app — reads master state from localStorage
    const interval = setInterval(() => {
      if (!userRef.current) return;

      // Current session ticket ID
      const currentNonce = sessionNonceRef.current;

      const timeoutMin = Number(gymInfoRef.current?.sessionTimeoutMinutes) || 30;
      const warningMin = Number(gymInfoRef.current?.sessionWarningMinutes) || 5;
      const timeoutMs = timeoutMin * 60 * 1000;
      const warningMs = Math.min(warningMin * 60 * 1000, timeoutMs * 0.8);

      const lastActivityStr = localStorage.getItem('kinetic_last_activity');
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr) : Date.now();
      
      if (workoutActiveRef.current) {
        localStorage.setItem('kinetic_last_activity', Date.now().toString());
      }

      const now = Date.now();
      const elapsedMs = Math.max(0, now - lastActivity);
      const timeRemainingMs = timeoutMs - elapsedMs;
      const currentSecondsLeft = Math.floor(timeRemainingMs / 1000);

      if (hasShownTimeoutWarningRef.current) {
        if (currentSecondsLeft <= 0) {
          hasShownTimeoutWarningRef.current = false;
          handleLogoutRef.current(currentNonce); // Passing nonce for validation
          return;
        }
        
        setSessionWarning(prev => ({ 
          ...prev, 
          show: true,
          secondsLeft: currentSecondsLeft > 0 ? currentSecondsLeft : 0 
        }));
        
        setDebugTimeLeft(`[TICKET:${currentNonce.toUpperCase()}] Quedan: ${currentSecondsLeft}s | E:${Math.floor(elapsedMs/1000)}s`);
      } else {
        if (elapsedMs >= timeoutMs) {
          handleLogoutRef.current(currentNonce); // Passing nonce for validation
          return;
        }

        if (timeRemainingMs > 0) {
          const m = Math.floor(currentSecondsLeft / 60);
          const s = currentSecondsLeft % 60;
          setDebugTimeLeft(`[SISTEMA] ${m}:${s.toString().padStart(2, '0')} | TICKET: ${currentNonce.toUpperCase()} | E:${Math.floor(elapsedMs/1000)}s`);
        }

        if (timeRemainingMs <= warningMs && timeRemainingMs > 0) {
          hasShownTimeoutWarningRef.current = true;
          setSessionWarning({ 
            show: true, 
            totalSeconds: Math.floor(warningMs / 1000), 
            secondsLeft: currentSecondsLeft 
          });
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity, true);
      window.removeEventListener('mousedown', handleActivity, true);
      window.removeEventListener('scroll', handleActivity, true);
      window.removeEventListener('wheel', handleActivity, true);
      window.removeEventListener('click', handleActivity, true);
      window.removeEventListener('pointerdown', handleActivity, true);
      window.removeEventListener('keydown', handleActivity, true);
      window.removeEventListener('touchstart', handleActivity, true);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  // Empty deps: mounts ONCE, all dynamic values read through stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (workoutState.isActive) {
      interval = setInterval(() => {
        setWorkoutState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [workoutState.isActive]);

  // Global Rest Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (restState.isActive && restState.timeLeft > 0) {
      interval = setInterval(() => {
        setRestState(prev => {
          if (prev.timeLeft <= 1) {
            playNotificationSound();
            if (Capacitor.isNativePlatform()) {
              Haptics.notification({ type: NotificationType.Success });
            }
            return { ...prev, timeLeft: 0, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [restState.isActive, restState.timeLeft]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn('Audio not supported', e);
    }
  };

  useEffect(() => {
    let unsubscribeDB: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // DEEP RESET: Ensure a clean slate whenever auth state changes (Login or Logout)
      setSessionWarning({ show: false, totalSeconds: 0, secondsLeft: 0 });
      setDialogConfig({ isOpen: false, type: 'info', title: '', message: '' });
      hasShownTimeoutWarningRef.current = false;
      hasShownSubscriptionAlert.current = false;

      if (currentUser) {
        // RESET: Ensure session activity starts from now upon login in PERSISTENT storage
        localStorage.setItem('kinetic_last_activity', Date.now().toString());
        const newNonce = Math.random().toString(36).substring(7);
        sessionNonceRef.current = newNonce;
        localStorage.setItem('kinetic_session_nonce', newNonce);
        
        try {
          // Initialize user doc if empty
          await initializeUser(currentUser.uid, currentUser.email || 'user@kinetic.app');
          
          // Listen to their data in real-time
          unsubscribeDB = listenToUserData(currentUser.uid, (data) => {
            if (data) {
              setUserProfile(data);
              const hist = Array.isArray(data.history) ? [...data.history].reverse() : [];
              const prog = Array.isArray(data.progress) ? [...data.progress].reverse() : [];
              setHistory(hist);
              setProgress(prog);

              // 5-day alert logic for trainees
              if (data.role === 'trainee' && data.subscription && !hasShownSubscriptionAlert.current) {
                const daysRemaining = Math.max(0, Math.ceil((new Date(data.subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                if (daysRemaining <= 5) {
                  showDialog({
                    type: 'info',
                    title: daysRemaining === 0 ? 'MEMBRESÍA VENCIDA' : 'RENOVACIÓN PRÓXIMA',
                    message: daysRemaining === 0 
                      ? `Tu acceso a Kinetic ha vencido. Por favor, contacta a la administración para renovar tu plan.`
                      : `¡Atención Guerrero! Tu membresía de Kinetic vencerá en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}. Asegura tu cupo renovando a tiempo.`,
                    confirmText: 'ENTENDIDO'
                  });
                  hasShownSubscriptionAlert.current = true;
                }
              }
            }
          });
        } catch (error: any) {
          console.error("Error conectando a Firestore. Revisa las reglas de seguridad:", error);
          if (error.code === 'permission-denied') {
            showDialog({
              type: 'error',
              title: 'ACCESO DENEGADO',
              message: 'Tu perfil no tiene permisos suficientes en Firestore para esta operación. Revisa la consola de Firebase.',
              confirmText: 'ENTENDIDO'
            });
          }
        }
      } else {
        // CLEANUP: Reset all states when no user is authenticated
        setHistory([]);
        setProgress([]);
        setUserProfile(null);
        setActiveScreen('inicio');
        hasShownSubscriptionAlert.current = false;
        
        // Reset workout/rest states to prevent leakage
        setWorkoutState({
          isActive: false,
          selectedRoutine: null,
          activeExercises: [],
          elapsedSeconds: 0
        });
        setRestState({
          isActive: false,
          timeLeft: 90,
          totalTime: 90
        });

        if (unsubscribeDB) unsubscribeDB();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDB) unsubscribeDB();
    };
  }, []);

  // Listen to Global Gym Info
  useEffect(() => {
    const unsubscribe = listenToGymInfo(setGymInfo);
    return () => unsubscribe();
  }, []);

  // Fetch all users for Leaderboard when screen is active
  useEffect(() => {
    if (activeScreen === 'ranking') {
      getAllUsers().then(setAllUsers).catch(console.error);
    }
  }, [activeScreen]);

  // Proactive Role & Screen Validation
  // Ensures that users always land in allowed screens for their role
  useEffect(() => {
    if (user && userProfile) {
      const isAdmin = ['admin', 'trainer'].includes(userProfile.role);
      
      // If a trainee is trying to access admin-only screens, redirect to home
      if (!isAdmin && activeScreen === 'entrenador') {
        setActiveScreen('inicio');
      }
      
      // Safety: if the screen is not recognized or belongs to a different state, 
      // the layout/render logic covers it, but this adds an extra layer.
    }
  }, [user, userProfile, activeScreen]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-surface-container-high border-t-primary-container rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Intercept if assessment is missing
  if (userProfile && !userProfile.assessment) {
    return (
      <Assessment 
        uid={user.uid} 
        userName={userProfile.displayName} 
        onComplete={() => {
          // The real-time listener will update userProfile anyway, 
          // but we can force it if needed.
        }} 
        onShowDialog={showDialog}
      />
    );
  }

  const handleAddSession = async (session: WorkoutSession) => {
    // Optimistic Update
    setHistory([session, ...history]);
    
    // Cloud Persistence
    try {
      if (user) await saveWorkoutSession(user.uid, session);
    } catch (err) {
      console.error("Error guardando sesión:", err);
      // Revert if error
    }
  };

  const handleDeleteSession = async (session: WorkoutSession) => {
    // Optimistic Update
    setHistory(history.filter(s => s.id !== session.id));
    
    // Cloud Persistence
    try {
      if (user) await deleteWorkoutSession(user.uid, session);
    } catch (err) {
      console.error("Error eliminando sesión:", err);
    }
  };

  const handleAddProgressLog = async (log: ProgressLog) => {
    // Optimistic Update
    setProgress([log, ...progress]);
    
    // Cloud Persistence
    try {
      if (user) await saveProgressLog(user.uid, log);
    } catch (err) {
      console.error("Error guardando progreso:", err);
    }
  };

  const handleStartRoutine = (routine: Routine) => {
    setPreSelectedRoutine(routine);
    setActiveScreen('entrenar');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio': return (
        <Home 
          sessions={history} 
          progress={progress}
          exercises={EXERCISES} 
          onNavigate={setActiveScreen}
          onStartRoutine={handleStartRoutine}
          assignedRoutines={userProfile?.assignedRoutines || []}
          gymInfo={gymInfo}
          userProfile={userProfile}
        />
      );
      case 'entrenar': return (
        <Workout 
          onFinish={handleAddSession} 
          sessions={history}
          initialRoutine={preSelectedRoutine} 
          onCancel={() => setPreSelectedRoutine(null)}
          workoutState={workoutState}
          setWorkoutState={setWorkoutState}
          restState={restState}
          setRestState={setRestState}
          onScreenChange={setActiveScreen}
          userRole={userProfile?.role}
          onShowDialog={showDialog}
        />
      );
      case 'historial': return <History sessions={history} onDeleteSession={handleDeleteSession} onShowDialog={showDialog} />;
      case 'descanso': return <Rest restState={restState} setRestState={setRestState} />;
      case 'ejercicios': return <Exercises onBack={() => setActiveScreen('explorar')} />;
      case 'progreso': return (
        <Progress 
          user={user}
          userProfile={userProfile!}
          logs={progress} 
          onAdd={handleAddProgressLog} 
          onEditAssessment={() => setIsEditingAssessment(true)}
          onBack={() => setActiveScreen('explorar')} 
          onShowDialog={showDialog}
        />
      );
      case 'ajustes': return userProfile ? <Settings profile={userProfile} onBack={() => setActiveScreen('inicio')} onShowDialog={showDialog} /> : (
        <Home 
          sessions={history} 
          progress={progress}
          exercises={EXERCISES} 
          onNavigate={setActiveScreen}
          onStartRoutine={handleStartRoutine}
          assignedRoutines={userProfile?.assignedRoutines || []}
          gymInfo={gymInfo}
          userProfile={userProfile}
        />
      );
      case 'entrenador': return (
        <TrainerDashboard 
          onBack={() => setActiveScreen('inicio')} 
          currentRole={userProfile?.role} 
          currentUserUid={user?.uid} 
          onShowDialog={showDialog} 
        />
      );
      case 'ranking': return <Leaderboard users={allUsers} currentUserUid={user?.uid} onBack={() => setActiveScreen('explorar')} />;
      case 'info': 
        if (!gymInfo) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center gap-6">
              <div className="w-12 h-12 border-4 border-surface-container-high border-t-secondary rounded-full animate-spin" />
              <div className="space-y-2">
                <p className="text-on-surface-variant text-sm font-bold animate-pulse">Sincronizando con la nube...</p>
                <p className="text-[10px] text-outline uppercase tracking-widest max-w-[200px] mx-auto">Si esto tarda mucho, puede que falten permisos en las reglas de Firestore.</p>
              </div>
              <details className="mt-4 text-left bg-surface-container-low p-4 rounded-2xl w-full max-w-sm border border-outline-variant/10">
                <summary className="text-[10px] font-black uppercase cursor-pointer text-secondary">¿Aun cargando? Revisa tus reglas</summary>
                <div className="mt-4 space-y-3">
                  <p className="text-[10px] font-bold text-on-surface">Copia esto en tus reglas de Firestore en la consola de Firebase:</p>
                  <pre className="text-[9px] bg-background p-3 rounded-lg overflow-auto font-mono text-outline-variant leading-relaxed">
{`match /gym_configs/{docId} {
  allow read: if true;
  allow write: if request.auth != null;
}`}
                  </pre>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-secondary/10 text-secondary py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/20"
                  >
                    Reintentar Conexión
                  </button>
                </div>
              </details>
            </div>
          );
        }
        return <GymInfo info={gymInfo} userProfile={userProfile} onBack={() => setActiveScreen('explorar')} onShowDialog={showDialog} />;
      case 'rutinas': return <RoutineManager onBack={() => setActiveScreen('explorar')} onShowDialog={showDialog} />;
      case 'explorar': return <Hub onNavigate={setActiveScreen} userProfile={userProfile} />;
      default: return (
        <Home 
          sessions={history} 
          progress={progress} 
          exercises={EXERCISES} 
          onNavigate={setActiveScreen}
          onStartRoutine={handleStartRoutine}
          assignedRoutines={userProfile?.assignedRoutines || []}
          gymInfo={gymInfo}
          userProfile={userProfile}
          onShowDialog={showDialog}
        />
      );
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Membership Access Gate Logic
  const isMembershipExpired = () => {
    if (!userProfile || userProfile.role !== 'trainee') return false;
    if (!userProfile.subscription) return true;
    return new Date(userProfile.subscription.endDate) < new Date();
  };

  const showMembershipGate = isMembershipExpired();

  if (showMembershipGate && gymInfo) {
    return (
      <MembershipGate 
        userProfile={userProfile!} 
        onLogout={handleLogout} 
        onBack={handleLogout}
        plans={gymInfo.membershipPlans}
      />
    );
  }

  return (
    <Layout activeScreen={activeScreen} onScreenChange={setActiveScreen} userProfile={userProfile} onLogout={handleLogout}>
      {renderScreen()}

      {/* Progress Overlays (Modals for Editing) */}
      {isEditingAssessment && userProfile?.assessment && (
        <Assessment 
          uid={user!.uid} 
          userName={userProfile.displayName} 
          initialData={userProfile.assessment}
          onClose={() => setIsEditingAssessment(false)}
          onComplete={() => setIsEditingAssessment(false)}
          onShowDialog={showDialog}
        />
      )}

      {/* Floating Active Workout Widget */}
      {workoutState.isActive && activeScreen !== 'entrenar' && (
        <div 
          onClick={() => setActiveScreen('entrenar')}
          className="fixed bottom-28 md:bottom-12 right-6 md:right-12 z-[100] bg-surface-container-high border border-outline-variant/10 rounded-[32px] p-4 pr-6 shadow-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] hover:scale-105 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors" />
          
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full kinetic-gradient shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container">fitness_center</span>
            <div className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error border-2 border-surface-container-high"></span>
            </div>
          </div>
          
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline leading-none mb-1">En Progreso</p>
            <p className="font-headline font-black text-2xl leading-none tracking-tight text-white group-hover:text-primary-container transition-colors italic">
              {formatTime(workoutState.elapsedSeconds)}
            </p>
          </div>
        </div>
      )}

      {/* Floating REST Widget */}
      {restState.isActive && activeScreen !== 'descanso' && (
        <div 
          onClick={() => setActiveScreen('descanso')}
          className="fixed bottom-48 md:bottom-32 right-6 md:right-12 z-[100] bg-surface-container-high border border-outline-variant/10 rounded-[32px] p-4 pr-6 shadow-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] hover:scale-105 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-secondary/10 group-hover:bg-secondary/20 transition-colors animate-pulse" />
          
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-secondary shadow-lg shadow-secondary/30">
            <span className="material-symbols-outlined text-on-secondary">timer</span>
            <div className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-secondary"></span>
            </div>
          </div>
          
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary leading-none mb-1 animate-pulse">Descansando</p>
            <p className="font-headline font-black text-2xl leading-none tracking-tight text-white group-hover:text-secondary transition-colors tabular-nums">
              {formatTime(restState.timeLeft)}
            </p>
          </div>
        </div>
      )}
      {/* Live Debug Timer (Pruebas - Solo en Desarrollo) */}
      {import.meta.env.DEV && user && (
        <div className="fixed top-0 left-0 right-0 z-[1001] flex justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md px-4 py-1 rounded-b-2xl border-x border-b border-outline-variant/10 shadow-xl flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-outline">Sesión Restante:</span>
            <span className={`font-headline font-black text-xs tabular-nums ${debugTimeLeft === '00:00' ? 'text-error' : 'text-secondary'}`}>
              {debugTimeLeft}
            </span>
          </div>
        </div>
      )}

      {/* Global Dialog Component */}
      <Dialog 
        {...dialogConfig} 
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Session Warning Dialog — dedicated component, NOT dismissible by mouse/scroll */}
      <SessionWarningDialog
        isOpen={sessionWarning.show}
        totalSeconds={sessionWarning.totalSeconds}
        secondsLeft={sessionWarning.secondsLeft}
        onKeepSession={() => {
          const now = Date.now();
          const nextNonce = Math.random().toString(36).substring(7);
          
          // MASTER GENERATIVE RESET
          localStorage.setItem('kinetic_last_activity', now.toString());
          localStorage.setItem('kinetic_session_nonce', nextNonce);
          
          lastActivityRef.current = now; 
          sessionNonceRef.current = nextNonce; // Any OLD logouts from PREVIOUS tickets will be ignored
          
          hasShownTimeoutWarningRef.current = false;
          setSessionWarning({ show: false, totalSeconds: 0, secondsLeft: 0 });

          // Force instant timer jump to full time
          const timeoutMin = Number(gymInfoRef.current?.sessionTimeoutMinutes) || 30;
          setDebugTimeLeft(`[NUEVO TICKET] ${timeoutMin}:00`);
        }}
        onLogout={() => {
          hasShownTimeoutWarningRef.current = false;
          setSessionWarning({ show: false, totalSeconds: 0, secondsLeft: 0 });
          handleLogoutRef.current();
        }}
      />
    </Layout>
  );
}
