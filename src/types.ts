export type Screen = 'login' | 'inicio' | 'entrenar' | 'historial' | 'descanso' | 'ejercicios' | 'progreso' | 'ajustes' | 'entrenador' | 'ranking' | 'info' | 'explorar' | 'rutinas';

export interface GymSchedule {
  day: string;
  open: string;
  close: string;
}

export interface MembershipPlan {
  id: '1month' | '6months' | '1year';
  name: string;
  price: string;
  description: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'promo' | 'alert' | 'event';
}

export interface GymInfo {
  schedules: GymSchedule[];
  news: NewsItem[];
  membershipPlans?: MembershipPlan[];
  sessionTimeoutMinutes?: number;
  sessionWarningMinutes?: number;
}

export interface AssessmentData {
  goal: 'weight_loss' | 'fitness' | 'muscle_gain';
  history4Months: 'none' | '1x' | '2-3x' | '4x_plus';
  knowledge: 'first_time' | 'little' | 'good' | 'autonomous';
  targetFrequency: '1x' | '2x' | '3x_plus';
  weight?: number;
  height?: number;
  conditions: string[];
  completedAt: string;
}

export interface SubscriptionData {
  planId: '1month' | '6months' | '1year';
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'canceled';
  cancelReason?: string;
}

export interface TaxData {
  id: string; // Cédula
  type: 'fisica' | 'juridica' | 'dimex' | 'pasaporte';
  name: string;
  email: string;
  phone?: string;
  address?: {
    province: string;
    canton: string;
    district: string;
    neighborhood?: string;
    other?: string;
  };
}

export interface Invoice {
  id: string;
  consecutive: string;
  clave: string;
  date: string;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'error';
  urlXml?: string;
  urlPdf?: string;
  message?: string;
  planId: string;
  emisorName: string;
  emisorId: string;
  receptorName: string;
  receptorId: string;
  currency: string;
  condition: '01' | '02' | '03' | '04' | '05' | '99'; // 01 = Contado
  method: '01' | '02' | '03' | '04'; // 04 = Tarjeta
  planStartDate?: string;
}

export interface GymTaxConfig extends TaxData {
  haciendaUser?: string;
  haciendaPass?: string;
  isStaging: boolean;
  lastConsecutive: number;
  activityCode?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'admin' | 'trainer' | 'trainee';
  settings: {
    soundEnabled: boolean;
  };
  history: WorkoutSession[];
  progress: ProgressLog[];
  assignedRoutines: Routine[];
  assessment?: AssessmentData;
  trainerId?: string;
  trainerName?: string;
  subscription?: SubscriptionData;
  subscriptionHistory?: SubscriptionData[];
  membershipRequest?: {
    planId: '1month' | '6months' | '1year';
    requestDate: string;
    status: 'pending' | 'rejected';
  };
  taxData?: TaxData;
  invoices?: Invoice[];
  isActive?: boolean;
  bossId?: string;
  bossName?: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  exercisesCount: number;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  category: string;
  authorId?: string;
  authorName?: string;
  exerciseIds?: string[];
  defaultExercises?: {
    exerciseId: string;
    sets: { reps: number; weight: number }[];
  }[];
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
    arms?: number;
    legs?: number;
    calves?: number;
    bodyFat?: number;
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

export interface RestState {
  isActive: boolean;
  timeLeft: number;
  totalTime: number;
}
