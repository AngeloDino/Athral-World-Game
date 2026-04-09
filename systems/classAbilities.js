// ─── systems/classAbilities.js ────────────────────────────────────────────────

export const CLASS_ABILITIES = {
  knight: {
    name:      "Voluntad de Hierro",
    emoji:     "⚔️",
    shortDesc: "+30% VIT en combate",
    description: "Los Caballeros entrenan su cuerpo como su escudo. Su VIT aumenta un 30% en combate.",
    apply: ({ exercise, baseXP }) => ({
      xpMultiplier:  1.0,
      timerBonus:    0,
      repsReduction: 0,
    }),
  },

  gladiator: {
    name:      "Furia Gladiatoria",
    emoji:     "🏟️",
    shortDesc: "+25% XP en push-ups",
    description: "Los Gladiadores dominan la fuerza bruta. Ganan 25% más XP en combates de push-ups.",
    apply: ({ exercise }) => ({
      xpMultiplier:  exercise === "pushups" ? 1.25 : 1.0,
      timerBonus:    0,
      repsReduction: 0,
    }),
  },

  barbarian: {
    name:      "Berserker",
    emoji:     "🪓",
    shortDesc: "+40% END en combate",
    description: "Los Bárbaros canalizan su furia en resistencia pura. Su END sube un 40% en combate intenso.",
    apply: ({ exercise }) => ({
      xpMultiplier:  exercise === "pushups" ? 1.15 : 1.0,
      timerBonus:    0,
      repsReduction: 0,
    }),
  },

  mage: {
    name:      "Arcano Supremo",
    emoji:     "🧙",
    shortDesc: "+2 INT por Pomodoro · +20s en sit-ups",
    description: "Los Magos canalizan su estudio en poder. +20 segundos extra en combates de sit-ups.",
    apply: ({ exercise }) => ({
      xpMultiplier:  1.0,
      timerBonus:    exercise === "situps" ? 20 : 0,
      repsReduction: 0,
    }),
  },

  archer: {
    name:      "Ojo de Águila",
    emoji:     "🏹",
    shortDesc: "-20% reps en squats",
    description: "Los Arqueros dominan el movimiento de piernas. Necesitan 20% menos reps en squats.",
    apply: ({ exercise, baseReps }) => ({
      xpMultiplier:  1.0,
      timerBonus:    0,
      repsReduction: exercise === "squats" ? Math.floor(baseReps * 0.2) : 0,
    }),
  },

  assassin: {
    name:      "Golpe Letal",
    emoji:     "🗡️",
    shortDesc: "2x XP si quedan +30s",
    description: "Los Asesinos son letales bajo presión. Si terminan con más de 30s restantes, obtienen 2x XP.",
    isDynamic: true,
    apply: ({ timeRemaining }) => ({
      xpMultiplier:  timeRemaining > 30 ? 2.0 : 1.0,
      timerBonus:    0,
      repsReduction: 0,
    }),
  },

  scientist: {
    name:      "Mente Maestra",
    emoji:     "🔬",
    shortDesc: "+2 INT por Pomodoro",
    description: "Los Científicos acumulan inteligencia con cada sesión de estudio. +2 INT por Pomodoro completado.",
    apply: () => ({
      xpMultiplier:  1.10,
      timerBonus:    0,
      repsReduction: 0,
    }),
  },
};

// Aplica la habilidad al inicio del combate — ajusta timer y reps
export function applyClassAbilitySetup(classId, exercise, baseReps, baseTimer) {
  const ability = CLASS_ABILITIES[classId];
  if (!ability) return { reps: baseReps, timer: baseTimer };

  const result = ability.apply({
    exercise,
    baseXP:        0,
    baseReps,
    timeRemaining: 0,
  });

  return {
    reps:  Math.max(1, baseReps - (result.repsReduction ?? 0)),
    timer: baseTimer + (result.timerBonus ?? 0),
  };
}

// Aplica la habilidad al XP final del combate
export function applyClassAbilityXP(classId, exercise, baseXP, timeRemaining) {
  const ability = CLASS_ABILITIES[classId];
  if (!ability) return baseXP;

  const result = ability.apply({ exercise, baseXP, baseReps:0, timeRemaining });
  return Math.floor(baseXP * (result.xpMultiplier ?? 1.0));
}

// Obtiene info de la habilidad para mostrar al jugador
export function getAbilityInfo(classId) {
  return CLASS_ABILITIES[classId] ?? null;
}

// XP multiplier para Firestore (sin timeRemaining dinámico)
export function getClassXPMultiplier(classId, exercise) {
  const map = {
    knight:    1.0,
    gladiator: exercise === "pushups" ? 1.25 : 1.0,
    barbarian: exercise === "pushups" ? 1.15 : 1.0,
    mage:      1.0,
    archer:    1.0,
    assassin:  1.0, // dinámico, se calcula al terminar
    scientist: 1.10,
  };
  return map[classId] ?? 1.0;
}