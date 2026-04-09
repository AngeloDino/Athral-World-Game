// ─── constants/classes.js ─────────────────────────────────────────────────────

export const CLASSES = [
  {
    id:          "knight",
    name:        "Caballero",
    emoji:       "⚔️",
    color:       "#7a7aaa",
    colorDark:   "#0a0a18",
    description: "Defensor nato. Su armadura es su fortaleza y su honor, su arma.",
    statBonus:   { STR:5, VIT:5, END:3, AGI:2 },
    favExercise: "pushups",
    canPomodoro: false,
    lore:        '"El honor es mi armadura, la justicia mi espada. Ningún mal pasará mientras yo esté en pie."',
    ability: {
      title:     "VOLUNTAD DE HIERRO",
      shortDesc: "+30% VIT en combate",
      desc:      "Los Caballeros entrenan su cuerpo como su escudo. Su VIT aumenta un 30% en cada combate.",
    },
  },
  {
    id:          "gladiator",
    name:        "Gladiador",
    emoji:       "🏟️",
    color:       "#c03030",
    colorDark:   "#1a0808",
    description: "Nacido para la arena. Cada combate es su templo.",
    statBonus:   { STR:7, AGI:3, VIT:3, END:2 },
    favExercise: "pushups",
    canPomodoro: false,
    lore:        '"La arena es mi templo. Cada combate, una oración de sangre y sudor a los dioses del poder."',
    ability: {
      title:     "FURIA GLADIATORIA",
      shortDesc: "+25% XP en push-ups",
      desc:      "Los Gladiadores dominan la fuerza bruta. Ganan 25% más XP en todos los combates de push-ups.",
    },
  },
  {
    id:          "barbarian",
    name:        "Bárbaro",
    emoji:       "🪓",
    color:       "#c07030",
    colorDark:   "#1a0e04",
    description: "Fuerza pura y resistencia sin límites. El Bárbaro no conoce el dolor.",
    statBonus:   { STR:6, END:6, AGI:2, VIT:1 },
    favExercise: "pushups",
    canPomodoro: false,
    lore:        '"La civilización es una jaula. La fuerza bruta es la única verdad que existe en este mundo."',
    ability: {
      title:     "BERSERKER",
      shortDesc: "+40% END en combate",
      desc:      "Los Bárbaros canalizan su furia en resistencia pura. Su END sube un 40% cuando la batalla es intensa.",
    },
  },
  {
    id:          "mage",
    name:        "Mago",
    emoji:       "🧙",
    color:       "#8050c0",
    colorDark:   "#0e0818",
    description: "El conocimiento es poder. La resistencia forja la mente y el cuerpo.",
    statBonus:   { INT:8, END:4, AGI:2, STR:1 },
    favExercise: "situps",
    canPomodoro: true,
    pomodoroBonus: 2, // +2 INT por Pomodoro (vs +1 de otras clases)
    lore:        '"El conocimiento es el poder más antiguo. Cada libro leído, un hechizo más en mi arsenal."',
    ability: {
      title:     "ARCANO SUPREMO",
      shortDesc: "+2 INT por Pomodoro · +20s en sit-ups",
      desc:      "Los Magos canalizan su estudio en poder. Obtienen +2 INT por cada Pomodoro completado y 20 segundos extra en combates de sit-ups.",
    },
  },
  {
    id:          "archer",
    name:        "Arquero",
    emoji:       "🏹",
    color:       "#308050",
    colorDark:   "#061008",
    description: "Precisión y velocidad. La distancia es su aliada eterna.",
    statBonus:   { AGI:8, STR:3, END:2, VIT:2 },
    favExercise: "squats",
    canPomodoro: false,
    lore:        '"La flecha no conoce el miedo. Veo, apunto, disparo. La distancia es mi aliada eterna."',
    ability: {
      title:     "OJO DE AGUILA",
      shortDesc: "-20% reps en squats",
      desc:      "Los Arqueros dominan el movimiento de piernas. Necesitan un 20% menos de reps en todos los combates de squats.",
    },
  },
  {
    id:          "assassin",
    name:        "Asesino",
    emoji:       "🗡️",
    color:       "#304080",
    colorDark:   "#06080e",
    description: "Velocidad explosiva. Ataca antes de que el enemigo reaccione.",
    statBonus:   { AGI:6, STR:5, END:2, VIT:2 },
    favExercise: "squats",
    canPomodoro: false,
    lore:        '"Las sombras son mi hogar. Llego antes de que sepas que estoy ahí. No hay segunda oportunidad."',
    ability: {
      title:     "GOLPE LETAL",
      shortDesc: "2x XP si quedan +30s",
      desc:      "Los Asesinos son letales bajo presión. Si completan el combate con más de 30 segundos restantes, obtienen el doble de XP.",
    },
  },
  {
    id:          "scientist",
    name:        "Científico",
    emoji:       "🔬",
    color:       "#808020",
    colorDark:   "#101002",
    description: "La mente es el músculo más poderoso. El conocimiento supera a la fuerza bruta.",
    statBonus:   { INT:10, END:5, AGI:3, STR:1 },
    favExercise: "situps",
    canPomodoro: true,
    pomodoroBonus: 2, // +2 INT por Pomodoro
    lore:        '"La mente es el músculo más poderoso. Cada Pomodoro completado, un paso más hacia la omnisciencia."',
    ability: {
      title:     "MENTE MAESTRA",
      shortDesc: "+2 INT por Pomodoro",
      desc:      "Los Científicos acumulan inteligencia con cada sesión de estudio. Obtienen +2 INT por cada Pomodoro completado y analizan las debilidades del enemigo.",
    },
  },
];

export const FOCUSES = [
  {
    id:        "strength",
    name:      "Ganar fuerza",
    emoji:     "💪",
    desc:      "Más push-ups en tus misiones diarias.",
    color:     "#e05555",
    exercises: ["pushups"],
  },
  {
    id:        "cardio",
    name:      "Perder peso",
    emoji:     "🔥",
    desc:      "Circuitos de cardio y resistencia.",
    color:     "#e8a84a",
    exercises: ["situps", "squats"],
  },
  {
    id:        "agility",
    name:      "Mejorar agilidad",
    emoji:     "⚡",
    desc:      "Squats y ejercicios de velocidad.",
    color:     "#55c080",
    exercises: ["squats"],
  },
  {
    id:        "balanced",
    name:      "Equilibrio general",
    emoji:     "☯️",
    desc:      "Todos los ejercicios por igual.",
    color:     "#e8c84a",
    exercises: ["pushups", "squats", "situps"],
  },
  {
    id:        "endurance",
    name:      "Aumentar resistencia",
    emoji:     "🛡️",
    desc:      "Sit-ups y ejercicios de larga duración.",
    color:     "#5599e0",
    exercises: ["situps"],
  },
];

// Duración de Pomodoros disponibles (en minutos)
export const POMODORO_DURATIONS = [25, 45, 60];

// Obtiene clase por ID
export function getClassById(id) {
  return CLASSES.find(c => c.id === id) ?? CLASSES[0];
}

// Obtiene enfoque por ID
export function getFocusById(id) {
  return FOCUSES.find(f => f.id === id) ?? FOCUSES[3];
}

// INT ganada por Pomodoro según clase
export function getPomodoroIntGain(classId) {
  const cls = getClassById(classId);
  if (!cls.canPomodoro) return 1; // cualquier clase gana +1 INT
  return cls.pomodoroBonus ?? 2;  // Mago y Científico ganan +2
}

// Ejercicios recomendados para misiones según clase y enfoque
export function getRecommendedExercises(classId, focusId) {
  const cls   = getClassById(classId);
  const focus = getFocusById(focusId);

  const CLASS_POOL = {
    knight:    ["pushups","pushups","squats","situps"],
    gladiator: ["pushups","pushups","squats","situps"],
    barbarian: ["pushups","pushups","situps","squats"],
    mage:      ["situps","situps","pushups","squats"],
    archer:    ["squats","squats","pushups","situps"],
    assassin:  ["squats","pushups","squats","situps"],
    scientist: ["situps","situps","squats","pushups"],
  };

  const classPool = CLASS_POOL[classId] ?? ["pushups","squats","situps"];
  const focusPool = focus.exercises;

  // 60% clase + 40% enfoque
  return [...classPool, ...classPool, ...focusPool].sort(() => Math.random() - 0.5);
}