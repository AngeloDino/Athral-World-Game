// ─── Mission System ───────────────────────────────────────────────────────────

export const EXERCISES = {
  pushups: { label: "Flexiones",   emoji: "💪", stat: "STR", secondaryStat: "END" },
  squats:  { label: "Sentadillas", emoji: "🦵", stat: "AGI", secondaryStat: "VIT" },
  situps:  { label: "Abdominales", emoji: "🔥", stat: "END", secondaryStat: "STR" },
};

export const MISSION_TIME = {
  easy:   2 * 60,
  medium: 4 * 60,
  hard:   6 * 60,
};

const BASE_REPS = {
  easy:   { min: 8,  max: 15 },   // Reducido para curva más accesible
  medium: { min: 18, max: 30 },
  hard:   { min: 35, max: 55 },
};

export const MISSION_XP = {
  easy:   60,    // Subido de 50
  medium: 120,   // Subido de 100
  hard:   200,   // Subido de 175
};

export const FREE_TRAIN_DURATIONS  = [5, 10, 15, 20];
export const POMODORO_DURATIONS   = [25, 45, 60];

// Tipos de misión para variedad
const MISSION_TYPES = [
  { type: "reps",    label: "Reps normales",   desc: (reps, ex) => `Completa ${reps} ${ex}` },
  { type: "reps",    label: "Reps normales",   desc: (reps, ex) => `Completa ${reps} ${ex}` }, // mayor peso = más frecuente
  { type: "reps",    label: "Reps normales",   desc: (reps, ex) => `Completa ${reps} ${ex}` },
];

// Genera misiones del día con variedad según clase y enfoque del jugador
export function generateDailyMissions(playerLevel = 1, playerClass = null, playerFocus = null) {
  const scale        = 1 + Math.floor(playerLevel / 10) * 0.15;
  const exerciseKeys = Object.keys(EXERCISES);

  // Si el jugador tiene clase/enfoque, priorizar sus ejercicios favoritos
  let pool = [...exerciseKeys];
  if (playerClass || playerFocus) {
    pool = buildExercisePool(playerClass, playerFocus, exerciseKeys);
  }

  // Mezclar y asignar
  const shuffled = pool.sort(() => Math.random() - 0.5);

  return {
    easy: {
      exercise: shuffled[0] ?? exerciseKeys[0],
      reps:     randomReps(BASE_REPS.easy, scale),
      completed: false,
      xp:        MISSION_XP.easy,
    },
    medium: {
      exercise: shuffled[1] ?? exerciseKeys[1],
      reps:     randomReps(BASE_REPS.medium, scale),
      completed: false,
      xp:        MISSION_XP.medium,
    },
    hard: {
      exercise: shuffled[2] ?? exerciseKeys[2],
      reps:     randomReps(BASE_REPS.hard, scale),
      completed: false,
      xp:        MISSION_XP.hard,
    },
  };
}

// Construye un pool de ejercicios priorizando la clase/enfoque del jugador
function buildExercisePool(classId, focusId, allExercises) {
  const CLASS_EXERCISES = {
    knight:    ["pushups", "pushups", "squats", "situps"],
    gladiator: ["pushups", "pushups", "squats", "situps"],
    barbarian: ["pushups", "pushups", "situps", "squats"],
    mage:      ["situps",  "situps",  "pushups", "squats"],
    archer:    ["squats",  "squats",  "pushups", "situps"],
    assassin:  ["squats",  "pushups", "squats",  "situps"],
    scientist: ["situps",  "situps",  "squats",  "pushups"],
  };

  const FOCUS_EXERCISES = {
    strength:  ["pushups", "pushups", "squats", "situps"],
    cardio:    ["situps",  "squats",  "situps",  "pushups"],
    agility:   ["squats",  "squats",  "pushups", "situps"],
    balanced:  ["pushups", "squats",  "situps"],
    endurance: ["situps",  "situps",  "squats",  "pushups"],
  };

  const classPool = CLASS_EXERCISES[classId] ?? allExercises;
  const focusPool = FOCUS_EXERCISES[focusId] ?? allExercises;

  // Mezcla 60% clase + 40% enfoque
  return [...classPool, ...classPool, ...focusPool].sort(() => Math.random() - 0.5);
}

function randomReps({ min, max }, scale) {
  const base = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.floor(base * scale);
}

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function statPointsFromReps(reps) {
  if (reps >= 100) return { primary: 5, secondary: 3 };
  if (reps >= 50)  return { primary: 3, secondary: 2 };
  if (reps >= 25)  return { primary: 2, secondary: 1 };
  if (reps >= 10)  return { primary: 1, secondary: 0 };
  return { primary: 0, secondary: 0 };
}