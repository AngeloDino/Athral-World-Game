import { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ScrollView,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:           "#000000",
  surface:      "#0a0a10",
  border:       "#2a2a3d",
  borderGlow:   "#4a3f8a",
  accent:       "#e8c84a",
  primary:      "#7c5cbf",
  primaryLight: "#a07de0",
  text:         "#e8e0f0",
  textDim:      "#6a6080",
};

// ─── Slide Data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    emoji:    "🌍",
    title:    "Bienvenido a\nAthral World",
    subtitle: "Un mundo donde tu esfuerzo físico\nse convierte en poder real.",
    color:    "#a07de0",
    items: [
      { emoji: "💪", text: "Haz ejercicio en el mundo real" },
      { emoji: "⚔️", text: "Gana XP y sube de nivel" },
      { emoji: "🏆", text: "Conviértete en una leyenda" },
    ],
  },
  {
    emoji:    "⚔️",
    title:    "Así funciona\nel juego",
    subtitle: "Cada repetición que haces tiene\nun impacto directo en tu personaje.",
    color:    "#e8c84a",
    items: [
      { emoji: "📋", text: "Completa misiones diarias para ganar XP" },
      { emoji: "👹", text: "Derrota monstruos completando ejercicios" },
      { emoji: "🗼", text: "Sube la Torre de Babel para dominar" },
      { emoji: "📊", text: "Tus stats crecen con tu cuerpo real" },
    ],
  },
  {
    emoji:    "🧙",
    title:    "Crea tu\npersonaje",
    subtitle: "Tu aventura comienza ahora.\nEl límite lo pones tú.",
    color:    "#55c080",
    items: [
      { emoji: "⭐", text: "Empieza en Rango F — el único camino es arriba" },
      { emoji: "🔥", text: "Entrena cada día para mantener tu racha" },
      { emoji: "🌟", text: "Alcanza el Rango SSS y sé una leyenda" },
    ],
  },
];

// ─── Slide Component ──────────────────────────────────────────────────────────
function Slide({ slide }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideInner}>
        {/* Emoji grande */}
        <View style={[styles.emojiCircle, { borderColor: slide.color + "44", backgroundColor: slide.color + "11" }]}>
          <Text style={styles.slideEmoji}>{slide.emoji}</Text>
        </View>

        {/* Título */}
        <Text style={[styles.slideTitle, { color: slide.color }]}>
          {slide.title}
        </Text>

        {/* Subtítulo */}
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

        {/* Items */}
        <View style={styles.itemsContainer}>
          {slide.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, { borderColor: slide.color + "22" }]}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Onboarding Screen ────────────────────────────────────────────────────────
export default function OnboardingScreen({ onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef   = useRef(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const isLast = currentIndex === SLIDES.length - 1;

  function goNext() {
    if (isLast) {
      // Animación de botón antes de terminar
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
      ]).start(() => onFinish?.());
      return;
    }

    const next = currentIndex + 1;
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setCurrentIndex(next);
  }

  function handleScroll(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(idx);
  }

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.root}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, i) => (
          <Slide key={i} slide={slide} />
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && [styles.dotActive, { backgroundColor: currentSlide.color }],
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], width: "100%" }}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: currentSlide.color }]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? "✦  COMENZAR AVENTURA" : "SIGUIENTE  →"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip */}
        {!isLast && (
          <TouchableOpacity onPress={onFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  scrollView: { flex: 1 },

  slide:      { justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  slideInner: { alignItems: "center", gap: 20, width: "100%" },

  emojiCircle: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2, justifyContent: "center", alignItems: "center",
    marginBottom: 8,
  },
  slideEmoji:    { fontSize: 56 },
  slideTitle: {
    fontSize: 32, fontWeight: "900", textAlign: "center",
    letterSpacing: 1, lineHeight: 40,
  },
  slideSubtitle: {
    color: C.textDim, fontSize: 15, textAlign: "center",
    lineHeight: 22, letterSpacing: 0.5,
  },

  itemsContainer: { width: "100%", gap: 10 },
  itemRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surface, borderWidth: 1,
    borderRadius: 4, paddingHorizontal: 16, paddingVertical: 12,
  },
  itemEmoji: { fontSize: 20, width: 28 },
  itemText:  { color: C.text, fontSize: 14, flex: 1, lineHeight: 20 },

  // Controls
  controls: {
    paddingHorizontal: 24, paddingBottom: 48,
    paddingTop: 16, alignItems: "center", gap: 12,
  },
  dots: { flexDirection: "row", gap: 8, marginBottom: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.border,
  },
  dotActive: { width: 24 },

  nextBtn: {
    width: "100%", paddingVertical: 16,
    borderRadius: 4, alignItems: "center",
  },
  nextBtnText: {
    color: C.bg, fontSize: 14,
    fontWeight: "900", letterSpacing: 2,
  },

  skipBtn:  { paddingVertical: 8 },
  skipText: { color: C.textDim, fontSize: 13, letterSpacing: 1 },
});