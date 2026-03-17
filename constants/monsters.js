// ─── constants/monsters.js ────────────────────────────────────────────────────
// Toda la data de zonas y monstruos del mundo de Athral

// Nivel mínimo para acceder a la Torre de Babel
export const TOWER_MIN_LEVEL = 10;

// ─── Zonas normales ───────────────────────────────────────────────────────────
export const ZONES = [
  {
    id:          "dark_forest",
    name:        "Bosque Oscuro",
    emoji:       "🌲",
    description: "Un bosque maldito donde criaturas nocturnas acechan entre los árboles.",
    color:       "#2d5a27",
    colorDark:   "#1a3318",
    minLevel:    1,
    monsters:    ["slime_verde", "lobo_sombra", "treant_podrido"],
  },
  {
    id:          "crystal_cave",
    name:        "Cueva de Cristal",
    emoji:       "💎",
    description: "Cristales brillantes iluminan esta cueva, pero sus guardianes son despiadados.",
    color:       "#2d4a7a",
    colorDark:   "#1a2d50",
    minLevel:    5,
    monsters:    ["goblin_minero", "elemental_cristal", "golem_roca"],
  },
  {
    id:          "ruined_fortress",
    name:        "Fortaleza en Ruinas",
    emoji:       "🏰",
    description: "Una antigua fortaleza donde los espíritus de guerreros caídos vagan eternamente.",
    color:       "#6b4a2a",
    colorDark:   "#3d2a18",
    minLevel:    10,
    monsters:    ["esqueleto_guardia", "caballero_espectral", "arcanista_maldito"],
  },
  {
    id:          "magic_swamp",
    name:        "Pantano Mágico",
    emoji:       "🐸",
    description: "Aguas putrefactas que esconden criaturas mutadas por magia ancestral.",
    color:       "#3d5a2a",
    colorDark:   "#243318",
    minLevel:    15,
    monsters:    ["rana_venenosa", "hidra_pantano", "bruja_ciénaga"],
  },
  {
    id:          "snowy_mountain",
    name:        "Montaña Nevada",
    emoji:       "🏔️",
    description: "Las cumbres heladas donde solo los más fuertes sobreviven al frío y a sus bestias.",
    color:       "#4a6a8a",
    colorDark:   "#2a3d50",
    minLevel:    20,
    monsters:    ["yeti_joven", "aguila_glacial", "titan_escarcha"],
  },
];

// ─── Monstruos normales ───────────────────────────────────────────────────────
export const MONSTERS = {
  // Bosque Oscuro
  slime_verde: {
    id: "slime_verde", name: "Slime Verde", emoji: "🟢",
    zone: "dark_forest", tier: "común",
    hp: 50, exercise: "pushups", reps: 10, timer: 60,
    xp: 80, statReward: { STR: 1 },
    description: "Una masa gelatinosa inofensiva. Perfecto para entrenar.",
  },
  lobo_sombra: {
    id: "lobo_sombra", name: "Lobo Sombra", emoji: "🐺",
    zone: "dark_forest", tier: "común",
    hp: 100, exercise: "squats", reps: 20, timer: 75,
    xp: 120, statReward: { AGI: 1 },
    description: "Rápido y sigiloso. Sus zarpas cortan como cuchillos.",
  },
  treant_podrido: {
    id: "treant_podrido", name: "Treant Podrido", emoji: "🌳",
    zone: "dark_forest", tier: "élite",
    hp: 200, exercise: "situps", reps: 35, timer: 90,
    xp: 220, statReward: { END: 2 },
    description: "Un árbol ancestral corrompido. Su resistencia es legendaria.",
  },

  // Cueva de Cristal
  goblin_minero: {
    id: "goblin_minero", name: "Goblin Minero", emoji: "⛏️",
    zone: "crystal_cave", tier: "común",
    hp: 80, exercise: "pushups", reps: 18, timer: 70,
    xp: 110, statReward: { STR: 1 },
    description: "Pequeño pero tenaz. Usa su pico con sorprendente fuerza.",
  },
  elemental_cristal: {
    id: "elemental_cristal", name: "Elemental de Cristal", emoji: "🔷",
    zone: "crystal_cave", tier: "común",
    hp: 150, exercise: "squats", reps: 28, timer: 80,
    xp: 180, statReward: { AGI: 1, VIT: 1 },
    description: "Una entidad de pura energía cristalizada. Sus golpes perforan armaduras.",
  },
  golem_roca: {
    id: "golem_roca", name: "Gólem de Roca", emoji: "🗿",
    zone: "crystal_cave", tier: "élite",
    hp: 300, exercise: "situps", reps: 45, timer: 100,
    xp: 300, statReward: { END: 2, VIT: 1 },
    description: "Una montaña con vida. Derrotarlo es una hazaña que pocos logran.",
  },

  // Fortaleza en Ruinas
  esqueleto_guardia: {
    id: "esqueleto_guardia", name: "Esqueleto Guardia", emoji: "💀",
    zone: "ruined_fortress", tier: "común",
    hp: 120, exercise: "pushups", reps: 25, timer: 75,
    xp: 160, statReward: { STR: 2 },
    description: "Un guerrero caído que sigue cumpliendo su deber por toda la eternidad.",
  },
  caballero_espectral: {
    id: "caballero_espectral", name: "Caballero Espectral", emoji: "👻",
    zone: "ruined_fortress", tier: "élite",
    hp: 250, exercise: "squats", reps: 40, timer: 90,
    xp: 280, statReward: { AGI: 2, STR: 1 },
    description: "Un caballero de otra era. Su espada fantasmal ignora el dolor.",
  },
  arcanista_maldito: {
    id: "arcanista_maldito", name: "Arcanista Maldito", emoji: "🧙‍♂️",
    zone: "ruined_fortress", tier: "jefe",
    hp: 400, exercise: "situps", reps: 60, timer: 120,
    xp: 450, statReward: { END: 3, STR: 1 },
    description: "Un mago corrompido por poder oscuro. Solo los más fuertes sobreviven.",
  },

  // Pantano Mágico
  rana_venenosa: {
    id: "rana_venenosa", name: "Rana Venenosa", emoji: "🐸",
    zone: "magic_swamp", tier: "común",
    hp: 140, exercise: "squats", reps: 30, timer: 80,
    xp: 190, statReward: { AGI: 2 },
    description: "Su veneno paraliza en segundos. Más rápida de lo que parece.",
  },
  hidra_pantano: {
    id: "hidra_pantano", name: "Hidra del Pantano", emoji: "🐍",
    zone: "magic_swamp", tier: "élite",
    hp: 350, exercise: "pushups", reps: 50, timer: 110,
    xp: 380, statReward: { STR: 2, VIT: 1 },
    description: "Tres cabezas, tres veces el peligro. Corta una y crecen dos.",
  },
  bruja_ciénaga: {
    id: "bruja_ciénaga", name: "Bruja de la Ciénaga", emoji: "🧟‍♀️",
    zone: "magic_swamp", tier: "jefe",
    hp: 500, exercise: "situps", reps: 70, timer: 130,
    xp: 550, statReward: { END: 3, VIT: 2 },
    description: "Domina las artes del pantano. Su maldición dura generaciones.",
  },

  // Montaña Nevada
  yeti_joven: {
    id: "yeti_joven", name: "Yeti Joven", emoji: "🦍",
    zone: "snowy_mountain", tier: "común",
    hp: 180, exercise: "pushups", reps: 35, timer: 85,
    xp: 230, statReward: { STR: 2, VIT: 1 },
    description: "Joven pero feroz. Su fuerza bruta puede romper rocas con facilidad.",
  },
  aguila_glacial: {
    id: "aguila_glacial", name: "Águila Glacial", emoji: "🦅",
    zone: "snowy_mountain", tier: "élite",
    hp: 280, exercise: "squats", reps: 48, timer: 100,
    xp: 350, statReward: { AGI: 3, END: 1 },
    description: "Sus alas congelan el aire. Vuela tan alto que nadie puede seguirla.",
  },
  titan_escarcha: {
    id: "titan_escarcha", name: "Titán de Escarcha", emoji: "🧊",
    zone: "snowy_mountain", tier: "jefe",
    hp: 600, exercise: "situps", reps: 80, timer: 150,
    xp: 700, statReward: { END: 3, STR: 2, VIT: 2 },
    description: "El guardián de las cumbres. Derrotarlo es la mayor hazaña del mundo.",
  },
};

// ─── Torre de Babel ───────────────────────────────────────────────────────────
// Los pisos se generan dinámicamente escalando con el piso actual

export const TOWER = {
  id:          "tower_of_babel",
  name:        "Torre de Babel",
  emoji:       "🗼",
  description: "Una torre infinita donde cada piso es más peligroso que el anterior. Entra una vez al día. Si caes, lo pierdes todo.",
  color:       "#8a4abf",
  colorDark:   "#4a2a70",
  minLevel:    TOWER_MIN_LEVEL,
};

// Genera el monstruo de un piso específico de la Torre
export function getTowerFloorMonster(floor) {
  const exercises = ["pushups", "squats", "situps"];
  const exercise  = exercises[(floor - 1) % 3];

  const emojis = ["👹","🔥","💀","⚡","🌑","🩸","👁️","🌪️","☠️","🐉"];
  const emoji  = emojis[(floor - 1) % emojis.length];

  const names = [
    "Centinela", "Destructor", "Sombra", "Devorador",
    "Coloso", "Espectro", "Abominación", "Demonio", "Ángel Caído", "Dios Oscuro",
  ];
  const name = `${names[(floor - 1) % names.length]} del Piso ${floor}`;

  // Escala progresiva
  const hp      = Math.floor(50  + floor * 40  + Math.pow(floor, 1.4) * 5);
  const reps    = Math.floor(8   + floor * 3   + Math.floor(floor / 5));
  const timer   = Math.min(60   + floor * 8,  240); // máx 4 min
  const xp      = Math.floor(100 + floor * 60 + Math.pow(floor, 1.5) * 10);

  // Stats reward escala cada 5 pisos
  const statBonus = Math.floor(floor / 5) + 1;
  const statMap   = { pushups: "STR", squats: "AGI", situps: "END" };

  return {
    id:          `tower_floor_${floor}`,
    name,
    emoji,
    floor,
    hp,
    exercise,
    reps,
    timer,
    xp,
    tier:        floor >= 20 ? "legendario" : floor >= 10 ? "jefe" : floor >= 5 ? "élite" : "común",
    statReward:  { [statMap[exercise]]: statBonus, VIT: Math.floor(statBonus / 2) },
    description: `Piso ${floor} de la Torre de Babel. Poder: ${Math.floor(hp / 10)}.`,
  };
}