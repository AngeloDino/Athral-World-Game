// ─── systems/classAbilities.js ───────────────────────────────────────────────
// Habilidades pasivas por clase que afectan el combate

import { getClassById } from "../constants/classes";

export const CLASS_ABILITIES = {
  warrior: {
    name:        "Golpe Brutal",
    emoji:       "⚔️",
    description: "Los Guerreros tratan los combates de push-ups como su campo de batalla natural. Bonus de +25% XP en combates de fuerza.",
    shortDesc:   "+25% XP en push-ups",
    apply: ({ exercise, baseXP }) => ({
      xpMultiplier: exercise === "pushups" ? 1.25 : 1.0,
      timerBonus:   0,
      repsReduction: 0,
    }),
  },

  mage: {
    name:        "Concentración Arcana",
    emoji:       "🧙",
    description: "Los Magos canalizan su energía para prolongar su resistencia. Tienen 20 segundos extra en combates de sit-ups.",
    shortDesc:   "+20s en combates de sit-ups",
    apply: ({ exercise }) => ({
      xpMultiplier:  1.0,
      timerBonus:    exercise === "situps" ? 20 : 0,
      repsReduction: 0,
    }),
  },

  archer: {
    name:        "Paso Ligero",
    emoji:       "🏹",
    description: "Los Arqueros dominan el movimiento de piernas. Necesitan un 20% menos de reps en combates de squats.",
    shortDesc:   "-20% reps en squats",
    apply: ({ exercise, baseReps }) => ({
      xpMultiplier:  1.0,
      timerBonus:    0,
      repsReduction: exercise === "squats" ? Math.floor(baseReps * 0.2) : 0,
    }),
  },

  monk: {
    name:        "Armonía Total",
    emoji:       "☯️",
    description: "Los Monjes encuentran equilibrio en todo. Reciben +15% XP en todas las misiones y combates.",
    shortDesc:   "+15% XP en todo",
    apply: () => ({
      xpMultiplier:  1.15,
      timerBonus:    0,
      repsReduction: 0,
    }),
  },

  assassin: {
    name:        "Golpe Letal",
    emoji:       "🗡️",
    description: "Los Asesinos son más efectivos bajo presión. Si completan el combate con más de 30s restantes, ganan el doble de XP.",
    shortDesc:   "2x XP si quedan +30s",
    apply: ({ timeRemaining, baseXP }) => ({
      xpMultiplier:  timeRemaining > 30 ? 2.0 : 1.0,
      timerBonus:    0,
      repsReduction: 0,
    }),
    // Nota: el multiplicador del asesino se calcula al terminar, no al inicio
    isDynamic: true,
  },
};

// Aplica la habilidad de clase al inicio del combate (ajusta timer y reps)
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

// Aplica la habilidad de clase al XP final
export function applyClassAbilityXP(classId, exercise, baseXP, timeRemaining) {
  const ability = CLASS_ABILITIES[classId];
  if (!ability) return baseXP;

  const result = ability.apply({ exercise, baseXP, baseReps: 0, timeRemaining });
  return Math.floor(baseXP * (result.xpMultiplier ?? 1.0));
}

// Obtiene info de la habilidad para mostrar al jugador
export function getAbilityInfo(classId) {
  return CLASS_ABILITIES[classId] ?? null;
}