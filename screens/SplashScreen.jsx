import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Image, Dimensions } from "react-native";

const { width: W } = Dimensions.get("window");
const LOGO = require("../assets/icon.png");

export default function SplashScreen({ onFinish }) {
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.8)).current;
  const titleOpacity   = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo aparece con scale
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue:1, duration:700, useNativeDriver:true }),
        Animated.spring(logoScale,   { toValue:1, tension:50, friction:7, useNativeDriver:true }),
      ]),
      // 2. Título aparece
      Animated.timing(titleOpacity,   { toValue:1, duration:500, useNativeDriver:true }),
      // 3. Tagline aparece
      Animated.timing(taglineOpacity, { toValue:1, duration:500, useNativeDriver:true }),
      // 4. Pausa épica
      Animated.delay(1000),
      // 5. Fade out
      Animated.timing(screenOpacity, { toValue:0, duration:600, useNativeDriver:true }),
    ]).start(() => onFinish?.());
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>

      {/* Estrellas */}
      <View style={styles.starsContainer}>
        {STARS.map((star, i) => (
          <View key={i} style={[styles.star, {
            top: star.top, left: star.left,
            width: star.size, height: star.size, opacity: star.opacity,
          }]} />
        ))}
      </View>

      {/* Logo imagen */}
      <Animated.View style={[styles.logoContainer, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
      </Animated.View>

      {/* Título */}
      <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
        <Text style={styles.title}>ATHRAL</Text>
        <Text style={styles.subtitle}>W O R L D</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <View style={styles.taglineDivider} />
        <Text style={styles.tagline}>Forja tu cuerpo. Conquista el mundo.</Text>
        <View style={styles.taglineDivider} />
      </Animated.View>

    </Animated.View>
  );
}

const STARS = Array.from({ length: 40 }, (_, i) => ({
  top:     `${Math.floor((i * 137.5) % 100)}%`,
  left:    `${Math.floor((i * 97.3)  % 100)}%`,
  size:    i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  opacity: 0.15 + (i % 5) * 0.08,
}));

const styles = StyleSheet.create({
  root: {
    flex:1, backgroundColor:"#000000",
    justifyContent:"center", alignItems:"center", gap:8,
  },
  starsContainer: { ...StyleSheet.absoluteFillObject, overflow:"hidden" },
  star:           { position:"absolute", backgroundColor:"#e8e0f0", borderRadius:99 },

  logoContainer: { alignItems:"center", marginBottom:8 },
  logoImage:     { width: W * 0.55, height: W * 0.55 },

  titleContainer: { alignItems:"center", gap:4 },
  title:    { fontSize:48, fontWeight:"900", color:"#e8c84a", letterSpacing:14 },
  subtitle: { fontSize:14, color:"#a07de0", letterSpacing:10, marginTop:-4 },

  taglineContainer: { alignItems:"center", gap:10, marginTop:12 },
  taglineDivider:   { width:50, height:1, backgroundColor:"#2a2a3d" },
  tagline:          { fontSize:13, color:"#6a6080", letterSpacing:1, fontStyle:"italic" },
});