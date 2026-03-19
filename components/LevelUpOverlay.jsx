import { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Animated, Dimensions, Modal,
} from "react-native";

const { width: W, height: H } = Dimensions.get("window");

// ─── Partícula decorativa ─────────────────────────────────────────────────────
function Particle({ delay, startX, emoji, duration }) {
  const y       = useRef(new Animated.Value(H * 0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1,   duration: 200,      useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1,   duration: 200,      useNativeDriver: true }),
        Animated.timing(y,       { toValue: H * 0.1, duration, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text style={[
      styles.particle,
      { left: startX, transform: [{ translateY: y }, { scale }], opacity }
    ]}>
      {emoji}
    </Animated.Text>
  );
}

// ─── LEVEL UP OVERLAY ─────────────────────────────────────────────────────────
export function LevelUpOverlay({ visible, newLevel, onFinish }) {
  const bgOpacity    = useRef(new Animated.Value(0)).current;
  const textScale    = useRef(new Animated.Value(0.3)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const levelScale   = useRef(new Animated.Value(0.5)).current;
  const levelOpacity = useRef(new Animated.Value(0)).current;
  const glowScale    = useRef(new Animated.Value(0.8)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const PARTICLES = [
    { delay: 100, startX: W * 0.1,  emoji: "⭐", duration: 1200 },
    { delay: 150, startX: W * 0.25, emoji: "✨", duration: 1400 },
    { delay: 200, startX: W * 0.4,  emoji: "💫", duration: 1100 },
    { delay: 100, startX: W * 0.55, emoji: "⭐", duration: 1300 },
    { delay: 250, startX: W * 0.7,  emoji: "✨", duration: 1500 },
    { delay: 180, startX: W * 0.85, emoji: "💫", duration: 1200 },
    { delay: 300, startX: W * 0.15, emoji: "⭐", duration: 1400 },
    { delay: 220, startX: W * 0.6,  emoji: "✨", duration: 1100 },
  ];

  useEffect(() => {
    if (!visible) return;

    // Reset
    bgOpacity.setValue(0);
    textScale.setValue(0.3);
    textOpacity.setValue(0);
    levelScale.setValue(0.5);
    levelOpacity.setValue(0);
    glowScale.setValue(0.8);
    screenOpacity.setValue(1);

    Animated.sequence([
      // Fondo aparece
      Animated.timing(bgOpacity, { toValue: 0.95, duration: 300, useNativeDriver: true }),

      // "LEVEL UP" aparece con bounce
      Animated.parallel([
        Animated.spring(textScale,   { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),

      // Número del nivel aparece
      Animated.parallel([
        Animated.spring(levelScale,   { toValue: 1, tension: 60, friction: 4, useNativeDriver: true }),
        Animated.timing(levelOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),

      // Pulso del glow — 3 ciclos completos
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.95, duration: 500, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.95, duration: 500, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.10, duration: 500, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.00, duration: 500, useNativeDriver: true }),
      ]),

      // Pausa épica
      Animated.delay(600),

      // Fade out
      Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => onFinish?.());
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.levelUpRoot, { opacity: screenOpacity }]}>
        {/* Fondo oscuro */}
        <Animated.View style={[styles.levelUpBg, { opacity: bgOpacity }]} />

        {/* Partículas */}
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* Contenido central */}
        <View style={styles.levelUpContent}>
          {/* Glow circle */}
          <Animated.View style={[
            styles.glowCircle,
            { transform: [{ scale: glowScale }] }
          ]} />

          {/* LEVEL UP texto */}
          <Animated.Text style={[
            styles.levelUpLabel,
            { opacity: textOpacity, transform: [{ scale: textScale }] }
          ]}>
            LEVEL UP
          </Animated.Text>

          {/* Número */}
          <Animated.View style={[
            styles.levelNumberContainer,
            { opacity: levelOpacity, transform: [{ scale: levelScale }] }
          ]}>
            <Text style={styles.levelNumberPre}>NIVEL</Text>
            <Text style={styles.levelNumber}>{newLevel}</Text>
          </Animated.View>

          <Animated.Text style={[styles.levelUpSub, { opacity: levelOpacity }]}>
            ¡Tu poder ha aumentado!
          </Animated.Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── RANK UP OVERLAY ──────────────────────────────────────────────────────────
export function RankUpOverlay({ visible, newRank, onFinish }) {
  const bgOpacity     = useRef(new Animated.Value(0)).current;
  const rayRotate     = useRef(new Animated.Value(0)).current;
  const badgeScale    = useRef(new Animated.Value(0)).current;
  const badgeOpacity  = useRef(new Animated.Value(0)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleY        = useRef(new Animated.Value(30)).current;
  const subOpacity    = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const shakeX        = useRef(new Animated.Value(0)).current;

  const RANK_PARTICLES = [
    { delay: 0,   startX: W*0.05,  emoji: "⚡", duration: 1800 },
    { delay: 100, startX: W*0.2,   emoji: "🔥", duration: 1600 },
    { delay: 200, startX: W*0.35,  emoji: "💥", duration: 2000 },
    { delay: 50,  startX: W*0.5,   emoji: "⚡", duration: 1700 },
    { delay: 150, startX: W*0.65,  emoji: "🔥", duration: 1900 },
    { delay: 250, startX: W*0.8,   emoji: "💥", duration: 1600 },
    { delay: 300, startX: W*0.92,  emoji: "⚡", duration: 1800 },
    { delay: 180, startX: W*0.12,  emoji: "🌟", duration: 2100 },
    { delay: 220, startX: W*0.45,  emoji: "🌟", duration: 1900 },
    { delay: 280, startX: W*0.75,  emoji: "🌟", duration: 2000 },
  ];

  useEffect(() => {
    if (!visible || !newRank) return;

    bgOpacity.setValue(0);
    rayRotate.setValue(0);
    badgeScale.setValue(0);
    badgeOpacity.setValue(0);
    titleOpacity.setValue(0);
    titleY.setValue(30);
    subOpacity.setValue(0);
    screenOpacity.setValue(1);
    shakeX.setValue(0);

    Animated.sequence([
      // Fondo dramático
      Animated.timing(bgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // Rayos girando + badge aparece con impact
      Animated.parallel([
        Animated.timing(rayRotate, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1.2, tension: 100, friction: 4, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),

      // Badge se asienta + shake de impacto
      Animated.parallel([
        Animated.spring(badgeScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 10,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 6,   duration: 60, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -6,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0,   duration: 60, useNativeDriver: true }),
        ]),
      ]),

      // Título aparece deslizando
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),

      // Subtítulo
      Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // Pausa dramática
      Animated.delay(1200),

      // Fade out
      Animated.timing(screenOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onFinish?.());
  }, [visible]);

  if (!visible || !newRank) return null;

  const rayRotation = rayRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.rankUpRoot, { opacity: screenOpacity }]}>
        {/* Fondo con color del rango */}
        <Animated.View style={[
          styles.rankUpBg,
          { opacity: bgOpacity, backgroundColor: newRank.colorDark ?? "#1a0a2a" }
        ]} />

        {/* Overlay oscuro encima */}
        <View style={styles.rankUpDarkOverlay} />

        {/* Partículas */}
        {RANK_PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* Rayos decorativos */}
        <Animated.View style={[
          styles.raysContainer,
          { transform: [{ rotate: rayRotation }] }
        ]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.ray,
                {
                  transform: [{ rotate: `${i * 45}deg` }],
                  backgroundColor: newRank.color + "33",
                }
              ]}
            />
          ))}
        </Animated.View>

        {/* Contenido central */}
        <View style={styles.rankUpContent}>
          {/* Texto RANGO ASCENDIDO */}
          <Animated.Text style={[styles.rankUpLabel, { opacity: titleOpacity }]}>
            ✦ RANGO ASCENDIDO ✦
          </Animated.Text>

          {/* Badge del rango */}
          <Animated.View style={[
            styles.rankBadgeContainer,
            {
              borderColor: newRank.color,
              backgroundColor: newRank.colorDark,
              opacity: badgeOpacity,
              transform: [{ scale: badgeScale }, { translateX: shakeX }],
            }
          ]}>
            <Text style={[styles.rankBadgeLabel, { color: newRank.color }]}>
              {newRank.label}
            </Text>
          </Animated.View>

          {/* Título del rango */}
          <Animated.Text style={[
            styles.rankTitle,
            { color: newRank.color, opacity: titleOpacity, transform: [{ translateY: titleY }] }
          ]}>
            {newRank.title}
          </Animated.Text>

          {/* Subtítulo */}
          <Animated.Text style={[styles.rankUpSub, { opacity: subOpacity }]}>
            Has demostrado tu valía{"\n"}en el mundo de Athral
          </Animated.Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Partícula
  particle: {
    position: "absolute",
    fontSize: 20,
    zIndex: 10,
  },

  // Level Up
  levelUpRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  levelUpBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0a0f",
  },
  levelUpContent: {
    alignItems: "center",
    gap: 16,
    zIndex: 2,
  },
  glowCircle: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#e8c84a11",
    borderWidth: 1,
    borderColor: "#e8c84a33",
  },
  levelUpLabel: {
    fontSize: 40,
    fontWeight: "900",
    color: "#e8c84a",
    letterSpacing: 8,
    textShadowColor: "#e8c84a88",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  levelNumberContainer: {
    alignItems: "center",
    gap: 4,
  },
  levelNumberPre: {
    color: "#6a6080",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 4,
  },
  levelNumber: {
    fontSize: 96,
    fontWeight: "900",
    color: "#e8c84a",
    lineHeight: 100,
    textShadowColor: "#e8c84a66",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  levelUpSub: {
    color: "#a07de0",
    fontSize: 16,
    letterSpacing: 2,
    marginTop: 8,
  },

  // Rank Up
  rankUpRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  rankUpBg: {
    ...StyleSheet.absoluteFillObject,
  },
  rankUpDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000088",
  },
  raysContainer: {
    position: "absolute",
    width: 500,
    height: 500,
    justifyContent: "center",
    alignItems: "center",
  },
  ray: {
    position: "absolute",
    width: 3,
    height: 500,
    borderRadius: 2,
  },
  rankUpContent: {
    alignItems: "center",
    gap: 20,
    zIndex: 2,
    paddingHorizontal: 32,
  },
  rankUpLabel: {
    color: "#e8e0f0",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 4,
  },
  rankBadgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadgeLabel: {
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: 2,
  },
  rankTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  rankUpSub: {
    color: "#6a6080",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 1,
  },
});