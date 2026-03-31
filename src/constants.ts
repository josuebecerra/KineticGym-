import { Exercise, WorkoutSession, Routine, ProgressLog } from "./types";

export const ROUTINES: Routine[] = [
  {
    id: 'r1',
    name: 'Push Day A',
    description: 'Enfoque en pecho, hombros y tríceps. Fuerza máxima.',
    exercisesCount: 5,
    level: 'Avanzado',
    category: 'Empuje',
    exerciseIds: ['e1', 'e2', 'e3', 'e11', 'e15']
  },
  {
    id: 'r2',
    name: 'Pull Day B',
    description: 'Enfoque en espalda y bíceps. Hipertrofia controlada.',
    exercisesCount: 4,
    level: 'Intermedio',
    category: 'Tracción',
    exerciseIds: ['e4', 'e5', 'e6', 'e14']
  },
  {
    id: 'r3',
    name: 'Leg Day Power',
    description: 'Sentadillas y peso muerto rumano. Fuerza explosiva.',
    exercisesCount: 4,
    level: 'Avanzado',
    category: 'Piernas',
    exerciseIds: ['e7', 'e8', 'e9', 'e10']
  },
  {
    id: 'r4',
    name: 'Torso Dominante',
    description: 'Estructura clásica de torso para ganar densidad.',
    exercisesCount: 4,
    level: 'Intermedio',
    category: 'Torso',
    exerciseIds: ['e1', 'e4', 'e11', 'e5']
  },
  {
    id: 'r5',
    name: 'Full Body Kinetic',
    description: 'Cuerpo completo para máxima quema calórica y fuerza.',
    exercisesCount: 4,
    level: 'Básico',
    category: 'Full Body',
    exerciseIds: ['e7', 'e1', 'e4', 'e16']
  }
];

export const EXERCISES: Exercise[] = [
  // PECHO
  {
    id: 'e1',
    name: 'Press de Banca con Barra',
    muscle: 'Pecho',
    primaryMuscles: ['Pectoral Mayor', 'Tríceps Braquial'],
    secondaryMuscles: ['Deltoides Anterior'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    level: 'Principiante',
    image: '/exercises/bench_press.png',
    description: 'Acuéstate en un banco plano. Baja la barra hasta la parte media del pecho y empuja explosivamente hacia arriba sin bloquear los codos.',
    benefits: ['Aumento de fuerza general', 'Hipertrofia de pectoral'],
    safety: ['Mantén los glúteos en el banco', 'No arques la espalda en exceso']
  },
  {
    id: 'e2',
    name: 'Aperturas con Mancuernas',
    muscle: 'Pecho',
    primaryMuscles: ['Pectoral Mayor'],
    secondaryMuscles: ['Deltoides Anterior'],
    equipment: 'Mancuernas',
    difficulty: 'Intermedio',
    level: 'Intermedio',
    image: '/exercises/bench_press.png',
    description: 'Con los brazos ligeramente flexionados, baja las mancuernas lateralmente hasta sentir un estiramiento en el pecho y vuelve al centro.',
    benefits: ['Mejora la flexibilidad torácica', 'Aislamiento del pectoral'],
    safety: ['Evita bajar excesivamente los hombros', 'Controla el peso en todo momento']
  },
  {
    id: 'e3',
    name: 'Press Inclinado con Mancuernas',
    muscle: 'Pecho',
    primaryMuscles: ['Pectoral Superior', 'Tríceps'],
    secondaryMuscles: ['Deltoides Anterior'],
    equipment: 'Mancuernas',
    difficulty: 'Intermedio',
    level: 'Intermedio',
    image: '/exercises/bench_press.png',
    description: 'Banco a 30-45 grados. Empuja las mancuernas hacia arriba controlando la fase excéntrica y manteniendo los codos en un ángulo de 45 grados.',
    benefits: ['Desarrollo del pecho superior', 'Rango de movimiento completo'],
    safety: ['No bajes de más si tienes problemas articulares', 'Codos por debajo de la línea de los hombros']
  },

  // ESPALDA
  {
    id: 'e4',
    name: 'Dominadas Pronas',
    muscle: 'Espalda',
    primaryMuscles: ['Dorsal Ancho', 'Redondo Mayor'],
    secondaryMuscles: ['Bíceps Braquial', 'Braquial'],
    equipment: 'Barra',
    difficulty: 'Avanzado',
    level: 'Intermedio',
    image: '/exercises/pull_up.png',
    description: 'Cuélgate con agarre ancho. Eleva el pecho hacia la barra controlando el descenso.',
    benefits: ['Espalda ancha (V-Taper)', 'Fuerza funcional superior'],
    safety: ['No te balancees', 'Retrae las escápulas al inicio']
  },
  {
    id: 'e5',
    name: 'Remo con Mancuerna',
    muscle: 'Espalda',
    primaryMuscles: ['Dorsal Ancho', 'Trapecio'],
    secondaryMuscles: ['Bíceps', 'Erectores Espinales'],
    equipment: 'Mancuernas',
    difficulty: 'Intermedio',
    level: 'Intermedio',
    image: '/exercises/dumbbell_row.png',
    description: 'Apoya una mano en el banco e inclina el torso. Tira de la mancuerna hacia la cadera manteniendo el codo cerca del cuerpo.',
    benefits: ['Densidad de espalda', 'Fuerza de tracción unilateral'],
    safety: ['No jorobes la espalda baja', 'Mantén el cuello alineado']
  },
  {
    id: 'e6',
    name: 'Jalón al Pecho',
    muscle: 'Espalda',
    primaryMuscles: ['Dorsal Ancho'],
    secondaryMuscles: ['Trapecio Inferior', 'Bíceps'],
    equipment: 'Máquina',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/pull_up.png',
    description: 'Sentado en la máquina, tira de la barra hacia la parte superior del pecho echando los codos hacia atrás.',
    benefits: ['Desarrollo dorsal seguro', 'Tensión constante'],
    safety: ['No tires detrás de nuca', 'No te balancees hacia atrás excesivamente']
  },

  // PIERNAS
  {
    id: 'e7',
    name: 'Sentadilla Pro',
    muscle: 'Piernas',
    primaryMuscles: ['Cuádriceps', 'Glúteos'],
    secondaryMuscles: ['Isquios', 'Core', 'Erectores'],
    equipment: 'Barra',
    difficulty: 'Avanzado',
    level: 'Intermedio',
    image: '/exercises/squat.png',
    description: 'Baja repartiendo el peso en los talones hasta que los muslos pasen la paralela.',
    benefits: ['Máxima fuerza inferior', 'Gasto calórico elevado'],
    safety: ['Rodillas fuera', 'Mirada al frente']
  },
  {
    id: 'e8',
    name: 'Peso Muerto Rumano',
    muscle: 'Piernas',
    primaryMuscles: ['Isquiosurales', 'Glúteo Mayor'],
    secondaryMuscles: ['Erectores de la columna'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    level: 'Intermedio',
    image: '/exercises/deadlift.png',
    description: 'Baja la barra pegada a las piernas con las rodillas ligeramente flexionadas hasta sentir tensión en los isquios.',
    benefits: ['Postura fuerte', 'Cadena posterior'],
    safety: ['No flexiones el torso', 'Movimiento de cadera (bisagra)']
  },
  {
    id: 'e9',
    name: 'Prensa de Piernas',
    muscle: 'Piernas',
    primaryMuscles: ['Cuádriceps'],
    secondaryMuscles: ['Glúteos', 'Aductores'],
    equipment: 'Máquina',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/leg_press.png',
    description: 'Baja la plataforma lentamente y empuja sin bloquear totalmente las rodillas.',
    benefits: ['Aislamiento de cuádriceps', 'Seguridad lumbar'],
    safety: ['No separes la espalda del respaldo', 'Controla el descenso']
  },
  {
    id: 'e10',
    name: 'Elevación de Gemelos',
    muscle: 'Piernas',
    primaryMuscles: ['Gastronemio', 'Sóleo'],
    secondaryMuscles: [],
    equipment: 'Máquina',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/squat.png',
    description: 'De pie o sentado, eleva los talones lo más alto posible contrayendo los gemelos y baja estirando por completo.',
    benefits: ['Estabilidad de tobillo', 'Hipertrofia de pantorrillas'],
    safety: ['Rebote al mínimo', 'Rango completo de movimiento']
  },

  // HOMBROS
  {
    id: 'e11',
    name: 'Press Militar',
    muscle: 'Hombros',
    primaryMuscles: ['Deltoides Anterior', 'Medio'],
    secondaryMuscles: ['Tríceps', 'Pectoral Superior'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    level: 'Intermedio',
    image: '/exercises/shoulder_press.png',
    description: 'Empuja la barra sobre la cabeza hasta extender los brazos completamente.',
    benefits: ['Hombros masivos', 'Fuerza estabilidad core'],
    safety: ['Activa el core para no arquearte', 'Inicia desde la barbilla']
  },
  {
    id: 'e12',
    name: 'Elevaciones Laterales',
    muscle: 'Hombros',
    primaryMuscles: ['Deltoides Lateral'],
    secondaryMuscles: ['Supraespinoso'],
    equipment: 'Mancuernas',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/lateral_raise.png',
    description: 'Eleva el brazo lateralmente hasta 90 grados manteniendo la tensión constante.',
    benefits: ['V-Taper acentuado', 'Hombros esféricos'],
    safety: ['Codo ligeramente flexionado', 'No jales con el trapecio']
  },
  {
    id: 'e13',
    name: 'Face Pulls',
    muscle: 'Hombros',
    primaryMuscles: ['Deltoides Posterior', 'Manguito Rotador'],
    secondaryMuscles: ['Trapecio Medio/Superior'],
    equipment: 'Máquina',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/lateral_raise.png',
    description: 'Tira de la cuerda hacia la cara, separando los extremos y rotando externamente los hombros.',
    benefits: ['Salud del hombro', 'Postura erguida'],
    safety: ['Usa un peso moderado', 'Céntrate en la contracción lenta']
  },

  // BRAZOS
  {
    id: 'e14',
    name: 'Curl con Barra Z',
    muscle: 'Brazos',
    primaryMuscles: ['Bíceps Braquial'],
    secondaryMuscles: ['Braquiorradial'],
    equipment: 'Barra',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/bicep_curl.png',
    description: 'Flexiona los codos subiendo la barra hacia los hombros sin balancear el torso.',
    benefits: ['Pico de bíceps', 'Menor tensión en muñecas'],
    safety: ['Codos pegados al cuerpo', 'Control en la bajada']
  },
  {
    id: 'e15',
    name: 'Extensiones de Tríceps Polea Alta',
    muscle: 'Brazos',
    primaryMuscles: ['Tríceps Braquial'],
    secondaryMuscles: ['Ancóneo'],
    equipment: 'Máquina',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/bicep_curl.png',
    description: 'Empuja la cuerda hacia abajo separando los extremos al final del movimiento.',
    benefits: ['Aislamiento de tríceps', 'Bombeo superior'],
    safety: ['Hombros estables', 'No uses impulso del pecho']
  },

  // CORE
  {
    id: 'e16',
    name: 'Abdominales Crunch',
    muscle: 'Core',
    primaryMuscles: ['Recto Abdominal'],
    secondaryMuscles: ['Oblicuos'],
    equipment: 'Peso Corporal',
    difficulty: 'Básico',
    level: 'Principiante',
    image: '/exercises/ab_crunch.png',
    description: 'Tumbado boca arriba con rodillas flexionadas, eleva ligeramente el torso contrayendo el abdomen.',
    benefits: ['Trabajo directo de abdomen', 'Seguridad espinal inicial'],
    safety: ['No tires del cuello', 'Movimiento corto e intenso']
  },
  {
    id: 'e17',
    name: 'Plancha Frontal (Plank)',
    muscle: 'Core',
    primaryMuscles: ['Transverso Abdominal', 'Core Estabilizador'],
    secondaryMuscles: ['Hombros', 'Glúteos'],
    equipment: 'Peso Corporal',
    difficulty: 'Intermedio',
    level: 'Principiante',
    image: '/exercises/ab_crunch.png',
    description: 'Sostén tu peso corporal apoyado en antebrazos y puntas de los pies trazando una línea recta.',
    benefits: ['Fuerza isométrica central', 'Resistencia postural'],
    safety: ['Glúteos apretados', 'No hundir la cadera']
  }
];

export const HISTORY: WorkoutSession[] = [
  {
    id: 'h1',
    name: 'Espalda y Tracción',
    date: 'Hoy, 29 Marzo',
    duration: '1h 12m',
    volume: '8,450 kg',
    category: 'Tracción',
    exercises: [
      { 
        name: 'Dominadas Pronas', 
        muscle: 'Espalda',
        sets: [
          { id: 's1', weight: 0, reps: 12, completed: true },
          { id: 's2', weight: 10, reps: 10, completed: true },
          { id: 's3', weight: 15, reps: 8, completed: true }
        ]
      },
      { 
        name: 'Remo con Mancuerna', 
        muscle: 'Espalda',
        sets: [
          { id: 's4', weight: 24, reps: 10, completed: true },
          { id: 's5', weight: 26, reps: 8, completed: true }
        ]
      }
    ]
  }
];

export const INITIAL_PROGRESS: ProgressLog[] = [
  {
    id: 'p1',
    date: '2026-03-01',
    weight: 82.5,
    measurements: { waist: 88, chest: 102, hips: 98 },
    photos: []
  },
  {
    id: 'p2',
    date: '2026-03-15',
    weight: 81.2,
    measurements: { waist: 86, chest: 103, hips: 97 },
    photos: []
  },
  {
    id: 'p3',
    date: '2026-03-29',
    weight: 79.8,
    measurements: { waist: 84, chest: 104, hips: 96 },
    photos: []
  }
];
