// ─── constants/classes.js ─────────────────────────────────────────────────────

export const CLASSES = [
  {
    id:          "warrior",
    name:        "Guerrero",
    emoji:       "⚔️",
    color:       "#e05555",
    colorDark:   "#3a1010",
    description: "Domina la fuerza bruta. Los push-ups son su arma principal.",
    statBonus:   { STR: 5 },
    favExercise: "pushups",
    lore:        "En el mundo de Athral, los Guerreros son la primera línea de batalla. Su cuerpo es su arma.",
  },
  {
    id:          "mage",
    name:        "Mago",
    emoji:       "🧙",
    color:       "#a07de0",
    colorDark:   "#2a1a4a",
    description: "La resistencia es su poder. Los sit-ups forjan su mente y cuerpo.",
    statBonus:   { END: 5 },
    favExercise: "situps",
    lore:        "Los Magos de Athral canalizan energía a través de la disciplina. Su resistencia es ilimitada.",
  },
  {
    id:          "archer",
    name:        "Arquero",
    emoji:       "🏹",
    color:       "#55c080",
    colorDark:   "#0a3020",
    description: "Velocidad y precisión. Los squats son la base de su poder.",
    statBonus:   { AGI: 5 },
    favExercise: "squats",
    lore:        "Los Arqueros de Athral se mueven como el viento. Su agilidad no tiene igual en el mundo.",
  },
  {
    id:          "monk",
    name:        "Monje",
    emoji:       "☯️",
    color:       "#e8c84a",
    colorDark:   "#3a3010",
    description: "Equilibrio perfecto. Domina todos los ejercicios por igual.",
    statBonus:   { STR: 1, AGI: 1, END: 1, VIT: 2 },
    favExercise: "all",
    lore:        "Los Monjes buscan la armonía total. No hay debilidades, solo fortalezas distintas.",
  },
  {
    id:          "assassin",
    name:        "Asesino",
    emoji:       "🗡️",
    color:       "#5599e0",
    colorDark:   "#0a1a3a",
    description: "Velocidad explosiva. Combina push-ups y squats en circuitos rápidos.",
    statBonus:   { AGI: 3, STR: 2 },
    favExercise: "mixed",
    lore:        "Los Asesinos atacan rápido y sin piedad. Su entrenamiento es tan intenso como sus batallas.",
  },
];

export const FOCUSES = [
  {
    id:          "strength",
    name:        "Ganar masa muscular",
    emoji:       "💪",
    description: "Más push-ups y ejercicios de fuerza en tus misiones.",
    color:       "#e05555",
    exercises:   ["pushups"],
  },
  {
    id:          "cardio",
    name:        "Perder peso",
    emoji:       "🔥",
    description: "Circuitos de cardio y resistencia. Quema más calorías.",
    color:       "#e8a84a",
    exercises:   ["situps", "squats"],
  },
  {
    id:          "agility",
    name:        "Mejorar agilidad",
    emoji:       "⚡",
    description: "Squats y ejercicios de velocidad para moverte mejor.",
    color:       "#55c080",
    exercises:   ["squats"],
  },
  {
    id:          "balanced",
    name:        "Equilibrio general",
    emoji:       "☯️",
    description: "Todos los ejercicios por igual. El camino del Monje.",
    color:       "#e8c84a",
    exercises:   ["pushups", "squats", "situps"],
  },
  {
    id:          "endurance",
    name:        "Aumentar resistencia",
    emoji:       "🛡️",
    description: "Sit-ups y ejercicios de larga duración para un cuerpo resistente.",
    color:       "#5599e0",
    exercises:   ["situps"],
  },
];

export const AVATARS = [
  "🧙", "⚔️", "🏹", "🗡️", "☯️",
  "🦅", "🐉", "🔥", "⚡", "🌑",
  "🛡️", "👁️", "💀", "🌟", "🏔️",
];

// Obtiene la clase por ID
export function getClassById(id) {
  return CLASSES.find(c => c.id === id) ?? CLASSES[0];
}

// Obtiene el enfoque por ID
export function getFocusById(id) {
  return FOCUSES.find(f => f.id === id) ?? FOCUSES[3];
}

// Dado la clase y enfoque del jugador, retorna el ejercicio recomendado para misiones
export function getRecommendedExercise(classId, focusId) {
  const cls   = getClassById(classId);
  const focus = getFocusById(focusId);

  // Si la clase tiene un ejercicio favorito específico, tiene prioridad
  if (cls.favExercise !== "all" && cls.favExercise !== "mixed") {
    return cls.favExercise;
  }

  // Si no, usar el del enfoque
  const exercises = focus.exercises;
  return exercises[Math.floor(Math.random() * exercises.length)];
}