// ─── constants/theme.js ───────────────────────────────────────────────────────
// Token central de diseño — importar desde aquí en toda la app

import { Dimensions, StyleSheet } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

// ─── Colores ──────────────────────────────────────────────────────────────────
export const colors = {
  // Fondos
  bg:        "#000000",
  surface:   "#0a0a10",
  surface2:  "#101018",
  surface3:  "#1a1a28",

  // Texto
  text:      "#e8e0f0",
  textDim:   "#6a6080",
  textMuted: "#3a3050",

  // Acento principal
  accent:    "#e8c84a",
  accentDim: "#e8c84a22",

  // Semánticos
  success:   "#55c080",
  warning:   "#e8a84a",
  danger:    "#e05555",
  boss:      "#bf4abf",
  elite:     "#e8c84a",
  info:      "#5599e0",

  // Stats
  str:       "#e05555",
  agi:       "#55c080",
  end:       "#5599e0",
  vit:       "#e055aa",
  int:       "#a07de0",

  // Bordes
  border:    "#2a2a3d",
  borderGlow:"#4a3f8a",
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

// ─── Tipografía ───────────────────────────────────────────────────────────────
export const typography = {
  // Tamaños
  xs:   9,
  sm:   11,
  md:   13,
  lg:   16,
  xl:   20,
  xxl:  28,
  hero: 48,

  // Pesos
  regular: "400",
  bold:    "700",
  black:   "900",

  // Letter spacing comunes
  tight:  1,
  normal: 2,
  wide:   3,
  wider:  4,
};

// ─── Bordes ───────────────────────────────────────────────────────────────────
export const radius = {
  sm:  3,
  md:  6,
  lg:  8,
  xl:  12,
  full: 999,
};

// ─── Dimensiones ──────────────────────────────────────────────────────────────
export const screen = { W, H };

// ─── Safe area ────────────────────────────────────────────────────────────────
// Safe area — usar directamente en JSX con Platform.OS, no en StyleSheet.create
// Android: ~40px, iOS: ~52px