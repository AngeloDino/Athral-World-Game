// ─── systems/rankSystem.js ────────────────────────────────────────────────────

export const RANKS = [
  {
    id: "F", label: "F", color: "#8a8a8a", colorDark: "#3a3a3a",
    title: "Cazador de Rango F",
    requirements: null, // rango inicial
  },
  {
    id: "E", label: "E", color: "#55c080", colorDark: "#1a4a2a",
    title: "Cazador de Rango E",
    requirements: {
      level:        5,
      totalStats:   50,
      monstersKilled: 5,
      towerFloor:   0,
    },
  },
  {
    id: "D", label: "D", color: "#5599e0", colorDark: "#1a2d50",
    title: "Cazador de Rango D",
    requirements: {
      level:        10,
      totalStats:   120,
      monstersKilled: 15,
      towerFloor:   5,
    },
  },
  {
    id: "C", label: "C", color: "#e8c84a", colorDark: "#4a3a10",
    title: "Cazador de Rango C",
    requirements: {
      level:        20,
      totalStats:   250,
      monstersKilled: 35,
      towerFloor:   15,
    },
  },
  {
    id: "B", label: "B", color: "#e8904a", colorDark: "#4a2a10",
    title: "Cazador de Rango B",
    requirements: {
      level:        30,
      totalStats:   450,
      monstersKilled: 70,
      towerFloor:   25,
    },
  },
  {
    id: "A", label: "A", color: "#e05555", colorDark: "#4a1a1a",
    title: "Cazador de Rango A",
    requirements: {
      level:        40,
      totalStats:   700,
      monstersKilled: 120,
      towerFloor:   40,
    },
  },
  {
    id: "S", label: "S", color: "#bf4abf", colorDark: "#3a1a3a",
    title: "Cazador de Rango S",
    requirements: {
      level:        50,
      totalStats:   1000,
      monstersKilled: 200,
      towerFloor:   60,
    },
  },
  {
    id: "SS", label: "SS", color: "#e8a84a", colorDark: "#4a3010",
    title: "Maestro Cazador",
    requirements: {
      level:        50,
      totalStats:   1500,
      monstersKilled: 350,
      towerFloor:   80,
    },
  },
  {
    id: "SSS", label: "SSS", color: "#e8c84a", colorDark: "#4a3a10",
    title: "Leyenda de Athral",
    requirements: {
      level:        50,
      totalStats:   2500,
      monstersKilled: 500,
      towerFloor:   100,
    },
  },
];

// Obtiene el rango actual basado en las stats del jugador
export function getCurrentRank(playerData) {
  const totalStats    = getTotalStats(playerData.stats);
  const monstersKilled = playerData.monstersKilled ?? 0;
  const towerRecord   = playerData.towerRecord ?? 0;
  const level         = playerData.level ?? 1;

  let currentRank = RANKS[0];

  for (const rank of RANKS) {
    if (!rank.requirements) continue;
    const req = rank.requirements;
    if (
      level        >= req.level        &&
      totalStats   >= req.totalStats   &&
      monstersKilled >= req.monstersKilled &&
      towerRecord  >= req.towerFloor
    ) {
      currentRank = rank;
    }
  }

  return currentRank;
}

// Obtiene el siguiente rango (null si ya es SSS)
export function getNextRank(currentRankId) {
  const idx = RANKS.findIndex(r => r.id === currentRankId);
  if (idx === -1 || idx === RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

// Suma total de stats
export function getTotalStats(stats = {}) {
  return (stats.STR ?? 0) + (stats.AGI ?? 0) + (stats.END ?? 0) + (stats.VIT ?? 0);
}

// Calcula el progreso hacia el siguiente rango (0-1 por requisito)
export function getRankProgress(playerData, nextRank) {
  if (!nextRank?.requirements) return null;

  const req          = nextRank.requirements;
  const totalStats   = getTotalStats(playerData.stats);
  const monstersKilled = playerData.monstersKilled ?? 0;
  const towerRecord  = playerData.towerRecord ?? 0;
  const level        = playerData.level ?? 1;

  return {
    level:          { current: level,          required: req.level,          progress: Math.min(level / req.level, 1) },
    totalStats:     { current: totalStats,     required: req.totalStats,     progress: Math.min(totalStats / req.totalStats, 1) },
    monstersKilled: { current: monstersKilled, required: req.monstersKilled, progress: Math.min(monstersKilled / req.monstersKilled, 1) },
    towerFloor:     { current: towerRecord,    required: req.towerFloor,     progress: req.towerFloor === 0 ? 1 : Math.min(towerRecord / req.towerFloor, 1) },
  };
}