import { useState, useEffect } from 'react';
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
import { onAuthStateChanged, User } from 'firebase/auth';
import { initializeUser, listenToUserData, saveWorkoutSession, deleteWorkoutSession, saveProgressLog, getAllUsers, listenToGymInfo } from './services/db';

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
      
      if (currentUser) {
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
            }
          });
        } catch (error: any) {
          console.error("Error conectando a Firestore. Revisa las reglas de seguridad:", error);
          if (error.code === 'permission-denied') {
            alert("⚠️ Acceso denegado a la Base de Datos. Necesitas abrir las reglas de Firestore en tu consola (ver chat =)).");
          }
        }
      } else {
        setHistory([]);
        setProgress([]);
        setUserProfile(null);
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
        />
      );
      case 'historial': return <History sessions={history} onDeleteSession={handleDeleteSession} />;
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
        />
      );
      case 'ajustes': return userProfile ? <Settings profile={userProfile} onBack={() => setActiveScreen('inicio')} /> : (
        <Home 
          sessions={history} 
          progress={progress}
          exercises={EXERCISES} 
          onNavigate={setActiveScreen}
          onStartRoutine={handleStartRoutine}
          assignedRoutines={userProfile?.assignedRoutines || []}
          gymInfo={gymInfo}
        />
      );
      case 'entrenador': return <TrainerDashboard onBack={() => setActiveScreen('inicio')} currentRole={userProfile?.role} />;
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
        return <GymInfo info={gymInfo} userProfile={userProfile} onBack={() => setActiveScreen('explorar')} />;
      case 'rutinas': return <RoutineManager onBack={() => setActiveScreen('explorar')} />;
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
        />
      );
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Layout activeScreen={activeScreen} onScreenChange={setActiveScreen} userProfile={userProfile}>
      {renderScreen()}

      {/* Progress Overlays (Modals for Editing) */}
      {isEditingAssessment && userProfile?.assessment && (
        <Assessment 
          uid={user!.uid} 
          userName={userProfile.displayName} 
          initialData={userProfile.assessment}
          onClose={() => setIsEditingAssessment(false)}
          onComplete={() => setIsEditingAssessment(false)}
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
    </Layout>
  );
}

