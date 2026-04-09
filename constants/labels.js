// ─── constants/labels.js ──────────────────────────────────────────────────────
// Nombres completos para stats y ejercicios en toda la UI

export const STAT_LABELS = {
  STR: "Fuerza",
  AGI: "Agilidad",
  END: "Resistencia",
  VIT: "Vitalidad",
  INT: "Inteligencia",
};

export const STAT_ICONS = {
  STR: "⚔️",
  AGI: "💨",
  END: "🛡️",
  VIT: "❤️",
  INT: "🧠",
};

export const STAT_COLORS = {
  STR: "#e05555",
  AGI: "#55c080",
  END: "#5599e0",
  VIT: "#e055aa",
  INT: "#a07de0",
};

export const EXERCISE_LABELS = {
  pushups: "Flexiones",
  squats:  "Sentadillas",
  situps:  "Abdominales",
};

export const EXERCISE_ICONS = {
  pushups: "💪",
  squats:  "🦵",
  situps:  "🔥",
};

// Helper — obtiene nombre completo de stat
export function statName(key) {
  return STAT_LABELS[key] ?? key;
}

// Helper — obtiene nombre completo de ejercicio
export function exerciseName(key) {
  return EXERCISE_LABELS[key] ?? key;
}