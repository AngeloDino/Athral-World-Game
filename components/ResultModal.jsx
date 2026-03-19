import { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from "react-native";

// No usa Modal — se renderiza directamente encima con position absolute
// Esto evita todos los problemas de modales anidados en iOS

export default function ResultModal({ visible, type, title, message, onClose }) {
  const scaleAnim   = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,   tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1,   duration: 200,            useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View style={[
        styles.card,
        { borderColor: config.color, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + "22", borderColor: config.color + "44" }]}>
          <Text style={styles.icon}>{config.emoji}</Text>
        </View>
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: config.color }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>{config.btnLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const TYPE_CONFIG = {
  victory: { emoji: "⚔️", color: "#e8c84a", btnLabel: "¡GENIAL!" },
  defeat:  { emoji: "💀", color: "#e05555", btnLabel: "INTENTAR DE NUEVO" },
  mission: { emoji: "✅", color: "#55c080", btnLabel: "¡GENIAL!" },
  warning: { emoji: "⚠️", color: "#e8a84a", btnLabel: "ENTENDIDO" },
  info:    { emoji: "ℹ️", color: "#5599e0", btnLabel: "OK" },
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#000000bb",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    backgroundColor: "#12121a",
    borderWidth: 1,
    borderRadius: 8,
    padding: 28,
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, justifyContent: "center", alignItems: "center",
  },
  icon:    { fontSize: 36 },
  title:   { fontSize: 22, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  message: { color: "#a09aaa", fontSize: 14, textAlign: "center", lineHeight: 22 },
  btn: {
    width: "100%", paddingVertical: 14,
    borderRadius: 4, alignItems: "center", marginTop: 4,
  },
  btnText: { color: "#0a0a0f", fontSize: 13, fontWeight: "900", letterSpacing: 2 },
});