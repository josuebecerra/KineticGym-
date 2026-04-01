import { useState, useEffect } from 'react';
import { Screen, WorkoutSession, Routine, ProgressLog, WorkoutState, UserProfile } from './types';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Workout } from './components/Workout';
import { History } from './components/History';
import { Rest } from './components/Rest';
import { Exercises } from './components/Exercises';
import { Progress } from './components/Progress';
import { Settings } from './components/Settings';
import { TrainerDashboard } from './components/TrainerDashboard';
import { Login } from './components/Login';
import { EXERCISES } from './constants';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { initializeUser, listenToUserData, saveWorkoutSession, saveProgressLog } from './services/db';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [activeScreen, setActiveScreen] = useState<Screen>('inicio');
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<ProgressLog[]>([]);
  const [preSelectedRoutine, setPreSelectedRoutine] = useState<Routine | null>(null);

  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    isActive: false,
    selectedRoutine: null,
    activeExercises: [],
    elapsedSeconds: 0
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    // El cronómetro corre solo si hay un entreno activo y no estamos en la pantalla de descanso
    if (workoutState.isActive && activeScreen !== 'descanso') {
      interval = setInterval(() => {
        setWorkoutState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workoutState.isActive, activeScreen]);

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
              setHistory(data.history ? [...data.history].reverse() : []);
              setProgress(data.progress ? [...data.progress].reverse() : []);
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
          userRole={userProfile?.role}
        />
      );
      case 'historial': return <History sessions={history} />;
      case 'descanso': return <Rest />;
      case 'ejercicios': return <Exercises />;
      case 'progreso': return (
        <Progress 
          user={user}
          logs={progress} 
          onAdd={handleAddProgressLog} 
          onBack={() => setActiveScreen('inicio')} 
        />
      );
      case 'ajustes': return userProfile ? <Settings profile={userProfile} onBack={() => setActiveScreen('inicio')} /> : <Home />;
      case 'entrenador': return <TrainerDashboard onBack={() => setActiveScreen('inicio')} currentRole={userProfile?.role} />;
      default: return <Home />;
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

      {/* Floating Active Workout Widget */}
      {workoutState.isActive && activeScreen !== 'entrenar' && (
        <div 
          onClick={() => setActiveScreen('entrenar')}
          className="fixed bottom-28 md:bottom-12 right-6 md:right-12 z-[100] bg-surface-container-high border border-outline-variant/10 rounded-[32px] p-4 pr-6 shadow-2xl flex items-center gap-4 cursor-pointer active:scale-95 hover:scale-105 transition-all group overflow-hidden"
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
    </Layout>
  );
}

