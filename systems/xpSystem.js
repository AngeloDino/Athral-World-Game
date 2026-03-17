// ─── XP System ───────────────────────────────────────────────────────────────

const XP_EXPONENT = 1.6;

// XP necesario para subir del nivel actual al siguiente
export function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, XP_EXPONENT));
}

// Calcula si hay level up y retorna nuevo nivel + XP restante
export function calculateLevelUp(currentXP, currentLevel) {
  let xp = currentXP;
  let level = currentLevel;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
    if (level >= 50) { level = 50; xp = 0; break; } // cap MVP
  }

  return { newLevel: level, remainingXP: xp };
}

// Porcentaje de progreso en el nivel actual (0-1)
export function xpProgress(currentXP, currentLevel) {
  const required = xpRequiredForLevel(currentLevel);
  return Math.min(currentXP / required, 1);
}