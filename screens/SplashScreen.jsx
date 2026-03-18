import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function SplashScreen({ onFinish }) {
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.8)).current;
  const titleOpacity   = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth       = useRef(new Animated.Value(0)).current;
  const screenOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo aparece con scale
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      ]),
      // 2. Título aparece
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // 3. Tagline aparece
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // 4. Pausa épica
      Animated.delay(800),
      // 5. Fade out
      Animated.timing(screenOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onFinish?.());
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      {/* Fondo con estrellas simuladas */}
      <View style={styles.starsContainer}>
        {STARS.map((star, i) => (
          <View
            key={i}
            style={[styles.star, { top: star.top, left: star.left, width: star.size, height: star.size, opacity: star.opacity }]}
          />
        ))}
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Text style={styles.logoEmoji}>⚔️</Text>
        <View style={styles.logoDividerTop} />
      </Animated.View>

      {/* Título */}
      <Animated.View style={{ opacity: titleOpacity, alignItems: "center" }}>
        <Text style={styles.title}>ATHRAL</Text>
        <Text style={styles.subtitle}>W O R L D</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <View style={styles.taglineDivider} />
        <Text style={styles.tagline}>Forja tu cuerpo.</Text>
        <Text style={styles.tagline}>Conquista el mundo.</Text>
        <View style={styles.taglineDivider} />
      </Animated.View>
    </Animated.View>
  );
}

// Estrellas decorativas estáticas
const STARS = Array.from({ length: 40 }, (_, i) => ({
  top:     `${Math.floor((i * 137.5) % 100)}%`,
  left:    `${Math.floor((i * 97.3) % 100)}%`,
  size:    i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  opacity: 0.2 + (i % 5) * 0.1,
}));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    backgroundColor: "#e8e0f0",
    borderRadius: 99,
  },

  // Logo
  logoContainer: { alignItems: "center", gap: 12, marginBottom: 8 },
  logoEmoji:     { fontSize: 72 },
  logoDividerTop:{ width: 60, height: 2, backgroundColor: "#4a3f8a" },

  // Title
  title: {
    fontSize: 52,
    fontWeight: "900",
    color: "#e8c84a",
    letterSpacing: 14,
  },
  subtitle: {
    fontSize: 16,
    color: "#a07de0",
    letterSpacing: 12,
    marginTop: -8,
  },

  // Tagline
  taglineContainer: { alignItems: "center", gap: 8, marginTop: 16 },
  taglineDivider:   { width: 40, height: 1, backgroundColor: "#2a2a3d" },
  tagline: {
    fontSize: 14,
    color: "#6a6080",
    letterSpacing: 2,
    fontStyle: "italic",
  },
});