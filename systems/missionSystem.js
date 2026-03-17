// ─── Mission System ───────────────────────────────────────────────────────────

export const EXERCISES = {
  pushups: { label: "Push-ups", emoji: "💪", stat: "STR", secondaryStat: "END" },
  squats:  { label: "Squats",   emoji: "🦵", stat: "AGI", secondaryStat: "VIT" },
  situps:  { label: "Sit-ups",  emoji: "🔥", stat: "END", secondaryStat: "STR" },
};

// Tiempo límite por dificultad (en segundos)
export const MISSION_TIME = {
  easy:   2 * 60,   // 2 minutos
  medium: 4 * 60,   // 4 minutos
  hard:   6 * 60,   // 6 minutos
};

const BASE_REPS = {
  easy:   { min: 10, max: 20 },
  medium: { min: 25, max: 40 },
  hard:   { min: 45, max: 70 },
};

export const MISSION_XP = {
  easy:   50,
  medium: 100,
  hard:   175,
};

// Opciones de duración para modo libre (en minutos)
export const FREE_TRAIN_DURATIONS = [5, 10, 15, 20];

export function generateDailyMissions(playerLevel = 1) {
  const scale        = 1 + Math.floor(playerLevel / 10) * 0.2;
  const exerciseKeys = Object.keys(EXERCISES);
  const shuffled     = [...exerciseKeys].sort(() => Math.random() - 0.5);

  return {
    easy:   { exercise: shuffled[0], reps: randomReps(BASE_REPS.easy,   scale), completed: false, xp: MISSION_XP.easy   },
    medium: { exercise: shuffled[1], reps: randomReps(BASE_REPS.medium, scale), completed: false, xp: MISSION_XP.medium },
    hard:   { exercise: shuffled[2], reps: randomReps(BASE_REPS.hard,   scale), completed: false, xp: MISSION_XP.hard   },
  };
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