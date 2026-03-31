export type Screen = 'login' | 'inicio' | 'entrenar' | 'historial' | 'descanso' | 'ejercicios' | 'progreso';

export interface Routine {
  id: string;
  name: string;
  description: string;
  exercisesCount: number;
  level: 'Básico' | 'Intermedio' | 'Avanzado';
  category: string;
  exerciseIds?: string[];
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string; // Grupo principal para filtros
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto';
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  image: string;
  description: string;
  benefits: string[];
  safety: string[];
}

export interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string;
  duration: string;
  volume: string;
  exercises: {
    name: string;
    muscle: string;
    sets: Set[];
  }[];
  category: string;
}

export interface ProgressLog {
  id: string;
  date: string;
  weight: number;
  measurements: {
    waist: number;
    chest: number;
    hips: number;
  };
  photos: string[]; // Base64 strings or URLs
}

export interface ActiveExercise extends Exercise {
  sets: Set[];
}

export interface WorkoutState {
  isActive: boolean;
  selectedRoutine: Routine | null;
  activeExercises: ActiveExercise[];
  elapsedSeconds: number;
}
