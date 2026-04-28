// ─── constants/monsters.js ────────────────────────────────────────────────────

export const TOWER_MIN_LEVEL = 10;

// Multiplicador de XP por zona (x2 por cada zona)
export const ZONE_XP_MULTIPLIERS = {
  dark_forest:      1.0,
  crystal_cave:     2.0,
  ruined_fortress:  4.0,
  magic_swamp:      8.0,
  snowy_mountain:   16.0,
};

// ─── Zonas ────────────────────────────────────────────────────────────────────
export const ZONES = [
  {
    id:          "dark_forest",
    name:        "Bosque Oscuro",
    emoji:       "🌲",
    description: "Un bosque maldito donde criaturas nocturnas acechan entre los árboles.",
    color:       "#2d5a27",
    colorDark:   "#1a3318",
    minLevel:    1,
    xpMultiplier: 1.0,
    monsters:    ["slime_rojo", "lobo_sombra", "goblin_verde"],
    rareMonsters:["goblin_etereo"],
    boss:        "guardian_bosque",
    comingSoon:  false,
  },
  {
    id:          "crystal_cave",
    name:        "Cueva de Cristal",
    emoji:       "💎",
    description: "Cristales brillantes iluminan esta cueva, pero sus guardianes son despiadados.",
    color:       "#2d4a7a",
    colorDark:   "#1a2d50",
    minLevel:    5,
    xpMultiplier: 2.0,
    monsters:    ["goblin_minero", "elemental_cristal", "golem_roca"],
    boss:        "rey_cristal",
    comingSoon:  true,
  },
  {
    id:          "ruined_fortress",
    name:        "Fortaleza en Ruinas",
    emoji:       "🏰",
    description: "Una antigua fortaleza donde los espíritus de guerreros caídos vagan eternamente.",
    color:       "#6b4a2a",
    colorDark:   "#3d2a18",
    minLevel:    10,
    xpMultiplier: 4.0,
    monsters:    ["esqueleto_guardia", "caballero_espectral", "arcanista_maldito"],
    boss:        "senor_oscuro",
    comingSoon:  true,
  },
  {
    id:          "magic_swamp",
    name:        "Pantano Mágico",
    emoji:       "🐸",
    description: "Aguas putrefactas que esconden criaturas mutadas por magia ancestral.",
    color:       "#3d5a2a",
    colorDark:   "#243318",
    minLevel:    15,
    xpMultiplier: 8.0,
    monsters:    ["rana_venenosa", "hidra_pantano", "bruja_cienaga"],
    boss:        "antiguo_pantano",
    comingSoon:  true,
  },
  {
    id:          "snowy_mountain",
    name:        "Montaña Nevada",
    emoji:       "🏔️",
    description: "Las cumbres heladas donde solo los más fuertes sobreviven al frío y a sus bestias.",
    color:       "#4a6a8a",
    colorDark:   "#2a3d50",
    minLevel:    20,
    xpMultiplier: 16.0,
    monsters:    ["yeti_joven", "aguila_glacial", "titan_escarcha"],
    boss:        "dios_escarcha",
    comingSoon:  true,
  },
];

// ─── Monstruos comunes (sin límite de derrotas por día) ───────────────────────
export const MONSTERS = {
  // ─── Bosque Oscuro ────────────────────────────────────────────────────────
  slime_rojo: {
    id:"slime_rojo", name:"Slime Rojo", zone:"dark_forest",
    tier:"común", exercise:"pushups", reps:12, timer:70, xp:90,
    statReward:{ STR:1 },
    description:"Una masa carmesí que absorbe todo a su paso. Su núcleo verde brilla con energía maligna.",
    art:    require("../assets/monsters/dark_forest/slime.png"),
    battleArt: require("../assets/monsters/dark_forest/slime_battle.png"),
    sprite: require("../assets/monsters/dark_forest/slime_sprite.png"),
  },
  lobo_sombra: {
    id:"lobo_sombra", name:"Lobo Sombra", zone:"dark_forest",
    tier:"común", exercise:"squats", reps:20, timer:80, xp:130,
    statReward:{ AGI:1 },
    description:"Una bestia encadenada y armada. Sus ojos rojos no conocen la piedad ni el cansancio.",
    art:    require("../assets/monsters/dark_forest/wolf.png"),
    battleArt: require("../assets/monsters/dark_forest/wolf_battle.png"),
    sprite: require("../assets/monsters/dark_forest/wolf_sprite.png"),
  },
  goblin_verde: {
    id:"goblin_verde", name:"Goblin Verde", zone:"dark_forest",
    tier:"común", exercise:"situps", reps:18, timer:75, xp:110,
    statReward:{ END:1 },
    description:"Agresivo y ruidoso. Su hacha dentada ha derramado más sangre de la que parece capaz.",
    art:    require("../assets/monsters/dark_forest/green_gob.png"),
    battleArt: require("../assets/monsters/dark_forest/green_gob_battle.png"),
    sprite: require("../assets/monsters/dark_forest/green_gob_sprite.png"),
  },
  goblin_etereo: {
    id:"goblin_etereo", name:"Goblin Etéreo", zone:"dark_forest",
    tier:"élite", exercise:"pushups", reps:28, timer:90, xp:320,
    spawnChance: 0.18,
    statReward:{ STR:2, AGI:1 },
    description:"Un goblin imbuido de energía de cristal. Rara vez se manifiesta en el Bosque... pero cuando aparece, es brutal.",
    art:    require("../assets/monsters/dark_forest/blue_gob.png"),
    battleArt: require("../assets/monsters/dark_forest/blue_gob_battle.png"),
    sprite: require("../assets/monsters/dark_forest/blue_gob_sprite.png"),
  },

  // Cueva de Cristal — XP x2
  goblin_minero:    { id:"goblin_minero",    name:"Goblin Minero",      emoji:"⛏️", zone:"crystal_cave",    tier:"común",  hp:80,  exercise:"pushups", reps:18, timer:70,  xp:180, statReward:{ STR:1 },         description:"Pequeño pero tenaz. Usa su pico con sorprendente fuerza." },
  elemental_cristal:{ id:"elemental_cristal",name:"Elemental Cristal",  emoji:"🔷", zone:"crystal_cave",    tier:"común",  hp:150, exercise:"squats",  reps:28, timer:80,  xp:240, statReward:{ AGI:1, VIT:1 },  description:"Una entidad de pura energía cristalizada." },
  golem_roca:       { id:"golem_roca",       name:"Gólem de Roca",      emoji:"🗿", zone:"crystal_cave",    tier:"común",  hp:220, exercise:"situps",  reps:40, timer:100, xp:320, statReward:{ END:1, VIT:1 },  description:"Una montaña con vida. Derrotarlo es una hazaña." },

  // Fortaleza — XP x4
  esqueleto_guardia:{ id:"esqueleto_guardia",name:"Esqueleto Guardia",  emoji:"💀", zone:"ruined_fortress", tier:"común",  hp:120, exercise:"pushups", reps:25, timer:75,  xp:400, statReward:{ STR:2 },         description:"Un guerrero caído que sigue cumpliendo su deber eterno." },
  caballero_espectral:{ id:"caballero_espectral",name:"Caballero Espectral",emoji:"👻",zone:"ruined_fortress",tier:"común",hp:200,exercise:"squats",  reps:38, timer:90,  xp:520, statReward:{ AGI:2, STR:1 }, description:"Un caballero de otra era. Su espada fantasmal ignora el dolor." },
  arcanista_maldito:{ id:"arcanista_maldito",name:"Arcanista Maldito",  emoji:"🧙‍♂️",zone:"ruined_fortress",tier:"común",  hp:280, exercise:"situps",  reps:50, timer:110, xp:680, statReward:{ END:2, STR:1 }, description:"Un mago corrompido por poder oscuro." },

  // Pantano — XP x8
  rana_venenosa:    { id:"rana_venenosa",    name:"Rana Venenosa",      emoji:"🐸", zone:"magic_swamp",     tier:"común",  hp:140, exercise:"squats",  reps:30, timer:80,  xp:800,  statReward:{ AGI:2 },         description:"Su veneno paraliza en segundos. Más rápida de lo que parece." },
  hidra_pantano:    { id:"hidra_pantano",    name:"Hidra del Pantano",  emoji:"🐍", zone:"magic_swamp",     tier:"común",  hp:240, exercise:"pushups", reps:45, timer:100, xp:1100, statReward:{ STR:2, VIT:1 }, description:"Tres cabezas, tres veces el peligro." },
  bruja_cienaga:    { id:"bruja_cienaga",    name:"Bruja de la Ciénaga",emoji:"🧟‍♀️",zone:"magic_swamp",    tier:"común",  hp:300, exercise:"situps",  reps:55, timer:120, xp:1400, statReward:{ END:2, VIT:1 }, description:"Domina las artes del pantano. Su maldición dura generaciones." },

  // Montaña — XP x16
  yeti_joven:       { id:"yeti_joven",       name:"Yeti Joven",         emoji:"🦍", zone:"snowy_mountain",  tier:"común",  hp:180, exercise:"pushups", reps:35, timer:85,  xp:1800, statReward:{ STR:2, VIT:1 }, description:"Joven pero feroz. Su fuerza bruta puede romper rocas." },
  aguila_glacial:   { id:"aguila_glacial",   name:"Águila Glacial",     emoji:"🦅", zone:"snowy_mountain",  tier:"común",  hp:260, exercise:"squats",  reps:48, timer:100, xp:2400, statReward:{ AGI:3, END:1 }, description:"Sus alas congelan el aire. Vuela tan alto que nadie puede seguirla." },
  titan_escarcha:   { id:"titan_escarcha",   name:"Titán de Escarcha",  emoji:"🧊", zone:"snowy_mountain",  tier:"común",  hp:380, exercise:"situps",  reps:65, timer:130, xp:3200, statReward:{ END:3, STR:2 }, description:"El guardián de las cumbres." },
};

// ─── Jefes (1 por zona, 1 derrota por día, combate secuencial 3 ejercicios) ──
export const BOSSES = {
  guardian_bosque: {
    id:"guardian_bosque", name:"Guardián del Bosque", emoji:"🌑",
    zone:"dark_forest", tier:"jefe",
    xp: 800,
    statReward: { STR:2, AGI:2, END:2, VIT:1 },
    description: "El espíritu del bosque corrompido por una fuerza ancestral. Sus ojos brillan con veneno y sus raíces devoran todo a su paso.",
    art: require("../assets/monsters/dark_forest/forest_guardian.png"),
    battleArt: require("../assets/monsters/dark_forest/forest_guardian_battle.png"),
    phases: [
      { exercise:"pushups", reps:20, timer:90,  label:"Fase I  — Garras de Raíz" },
      { exercise:"squats",  reps:20, timer:90,  label:"Fase II — Tormenta de Espinas" },
      { exercise:"situps",  reps:20, timer:90,  label:"Fase III — Núcleo Corrompido" },
    ],
  },
  rey_cristal: {
    id:"rey_cristal", name:"Rey de Cristal", emoji:"💠",
    zone:"crystal_cave", tier:"jefe",
    xp: 1800,
    statReward: { STR:3, AGI:3, END:2, VIT:2 },
    description: "Un ser de cristal puro. Su poder se divide en tres fases devastadoras.",
    phases: [
      { exercise:"pushups", reps:28, timer:100, label:"Fase I  — Golpe Cristalino" },
      { exercise:"squats",  reps:28, timer:100, label:"Fase II — Tormenta de Cristal" },
      { exercise:"situps",  reps:28, timer:100, label:"Fase III — Barrera Final" },
    ],
  },
  senor_oscuro: {
    id:"senor_oscuro", name:"Señor Oscuro", emoji:"👁️",
    zone:"ruined_fortress", tier:"jefe",
    xp: 4000,
    statReward: { STR:4, AGI:3, END:4, VIT:2 },
    description: "El comandante de la fortaleza caída. Solo los más fuertes pueden enfrentarlo.",
    phases: [
      { exercise:"pushups", reps:40, timer:110, label:"Fase I  — Puño de Sombra" },
      { exercise:"squats",  reps:40, timer:110, label:"Fase II — Torbellino Oscuro" },
      { exercise:"situps",  reps:40, timer:110, label:"Fase III — Voluntad Inquebrantable" },
    ],
  },
  antiguo_pantano: {
    id:"antiguo_pantano", name:"Antiguo del Pantano", emoji:"🐊",
    zone:"magic_swamp", tier:"jefe",
    xp: 9000,
    statReward: { STR:4, AGI:4, END:5, VIT:3 },
    description: "Una entidad primordial que duerme en las profundidades. Despertarlo es un error.",
    phases: [
      { exercise:"pushups", reps:55, timer:120, label:"Fase I  — Fauces del Pantano" },
      { exercise:"squats",  reps:55, timer:120, label:"Fase II — Cola Devastadora" },
      { exercise:"situps",  reps:55, timer:120, label:"Fase III — Maldición Eterna" },
    ],
  },
  dios_escarcha: {
    id:"dios_escarcha", name:"Dios de Escarcha", emoji:"❄️",
    zone:"snowy_mountain", tier:"jefe",
    xp: 20000,
    statReward: { STR:5, AGI:5, END:6, VIT:4 },
    description: "La deidad de las cumbres heladas. Derrotarlo es la hazaña máxima de Athral.",
    phases: [
      { exercise:"pushups", reps:70, timer:140, label:"Fase I  — Tormenta Ártica" },
      { exercise:"squats",  reps:70, timer:140, label:"Fase II — Avalancha Divina" },
      { exercise:"situps",  reps:70, timer:140, label:"Fase III — Voluntad del Invierno Eterno" },
    ],
  },
};

// ─── Torre de Babel ───────────────────────────────────────────────────────────
export const TOWER = {
  id:          "tower_of_babel",
  name:        "Torre de Babel",
  emoji:       "🗼",
  description: "Una torre infinita. Cada 5 pisos un jefe te aguarda. Si caes, lo pierdes todo.",
  color:       "#8a4abf",
  colorDark:   "#4a2a70",
  minLevel:    TOWER_MIN_LEVEL,
};

// Genera monstruo normal de la torre
export function getTowerFloorMonster(floor) {
  const exercises  = ["pushups", "squats", "situps"];
  const exercise   = exercises[(floor - 1) % 3];
  const emojis     = ["👹","🔥","💀","⚡","🌑","🩸","👁️","🌪️","☠️","🐉"];
  const emoji      = emojis[(floor - 1) % emojis.length];
  const names      = ["Centinela","Destructor","Sombra","Devorador","Coloso","Espectro","Abominación","Demonio","Ángel Caído","Dios Oscuro"];
  const name       = `${names[(floor - 1) % names.length]} del Piso ${floor}`;

  // Escala agresiva — se duplica cada 5 pisos
  const tierScale  = Math.pow(2, Math.floor((floor - 1) / 5));
  const reps       = Math.floor((8 + floor * 2) * Math.sqrt(tierScale));
  const timer      = Math.min(60 + floor * 5, 240);
  const xp         = Math.floor(150 * floor * tierScale);
  const statBonus  = Math.floor(floor / 5) + 1;
  const statMap    = { pushups:"STR", squats:"AGI", situps:"END" };

  return {
    id:          `tower_floor_${floor}`,
    name,
    emoji,
    floor,
    hp:          Math.floor(50 + floor * 30 * tierScale),
    exercise,
    reps:        Math.max(5, reps),
    timer,
    xp,
    tier:        floor >= 20 ? "legendario" : floor >= 10 ? "jefe" : floor >= 5 ? "élite" : "común",
    statReward:  { [statMap[exercise]]: statBonus, VIT: Math.max(1, Math.floor(statBonus / 2)) },
    description: `Piso ${floor} — Poder: ${Math.floor(xp / 100)}`,
    isBoss:      false,
  };
}

// Genera jefe de la torre (cada 5 pisos)
export function getTowerBossMonster(floor) {
  const tierScale  = Math.pow(2, Math.floor((floor - 1) / 5));
  const bossEmojis = ["👑","💀","🔥","🌑","⚡","🐉","👁️","☠️","🌪️","🩸"];
  const emoji      = bossEmojis[Math.floor(floor / 5) % bossEmojis.length];
  const xp         = Math.floor(500 * floor * tierScale);
  const reps       = Math.floor((12 + floor * 2) * Math.sqrt(tierScale));

  return {
    id:          `tower_boss_${floor}`,
    name:        `Coloso del Piso ${floor}`,
    emoji,
    floor,
    xp,
    tier:        "jefe",
    statReward:  { STR:2, AGI:2, END:2, VIT:2 },
    description: `Jefe del piso ${floor}. Derrótalo para seguir subiendo.`,
    isBoss:      true,
    phases: [
      { exercise:"pushups", reps: Math.max(8, reps),  timer: Math.min(60 + floor * 6, 240), label:`Fase I  — Fuerza del Piso ${floor}` },
      { exercise:"squats",  reps: Math.max(8, reps),  timer: Math.min(60 + floor * 6, 240), label:`Fase II — Velocidad del Piso ${floor}` },
      { exercise:"situps",  reps: Math.max(8, reps),  timer: Math.min(60 + floor * 6, 240), label:`Fase III — Resistencia del Piso ${floor}` },
    ],
  };
}

// Retorna true si el piso es un piso de jefe
export function isTowerBossFloor(floor) {
  return floor % 5 === 0;
}