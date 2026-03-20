// ─── XP System ────────────────────────────────────────────────────────────────

const XP_EXPONENT = 1.4; // Reducido de 1.6 — progresión más accesible early game

export function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, XP_EXPONENT));
}

export function calculateLevelUp(currentXP, currentLevel) {
  let xp    = currentXP;
  let level = currentLevel;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
    if (level >= 50) { level = 50; xp = 0; break; }
  }

  return { newLevel: level, remainingXP: xp };
}

export function xpProgress(currentXP, currentLevel) {
  const required = xpRequiredForLevel(currentLevel);
  return Math.min(currentXP / required, 1);
}

// ─── Multiplicadores de XP ───────────────────────────────────────────────────

// Bonus por racha de días
export function streakMultiplier(streak) {
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.4;
  if (streak >= 7)  return 1.25;
  if (streak >= 3)  return 1.1;
  return 1.0;
}

// Bonus por completar las 3 misiones del día
export const DAILY_COMPLETE_BONUS_XP = 75;

// Bonus por tier de monstruo
export function monsterTierBonus(tier) {
  switch (tier) {
    case "élite":      return 1.25;
    case "jefe":       return 1.5;
    case "legendario": return 2.0;
    default:           return 1.0;
  }
}

// Calcula XP final con todos los multiplicadores
export function calculateFinalXP(baseXP, { streak = 0, tier = "común", classBonus = 1.0 } = {}) {
  const streakMult = streakMultiplier(streak);
  const tierMult   = monsterTierBonus(tier);
  const total      = Math.floor(baseXP * streakMult * tierMult * classBonus);

  return {
    total,
    breakdown: {
      base:        baseXP,
      streakMult,
      tierMult,
      classBonus,
    },
  };
}