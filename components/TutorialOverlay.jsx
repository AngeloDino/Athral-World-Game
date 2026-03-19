import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Tutorial data por sección ────────────────────────────────────────────────
export const TUTORIALS = {
  mainMenu: [
    { title: "Tu perfil de cazador",   body: "Aquí ves tu nivel, XP, rango y stats. Todo sube cuando entrenas en el mundo real." },
    { title: "Barra de experiencia",   body: "Cada misión completada te da XP. Cuando la barra se llena, subes de nivel." },
    { title: "Tus atributos",          body: "STR, AGI, END y VIT crecen según qué ejercicios haces. Push-ups = STR, Squats = AGI, Sit-ups = END." },
    { title: "El menú principal",      body: "Entrena para misiones diarias, explora el Mundo para derrotar monstruos, y revisa tus Estadísticas." },
  ],
  training: [
    { title: "Misiones del día",       body: "Cada día recibes 3 misiones. Tienes un tiempo límite para completar las reps requeridas." },
    { title: "¿Cómo funciona?",        body: "Pulsa INICIAR MISIÓN, haz el ejercicio en la vida real, luego registra tus reps con los botones + y −." },
    { title: "Recompensas",            body: "Si completas la meta en tiempo → XP completo + stats. Si no llegas → solo ganas stats por los reps hechos." },
    { title: "Modo libre",             body: "¿Quieres entrenar más? El modo libre te da stats extra sin límite de meta. Solo stats, sin XP adicional." },
  ],
  world: [
    { title: "El mundo de Athral",     body: "Cada zona tiene monstruos únicos. Derrota monstruos completando ejercicios antes de que se acabe el tiempo." },
    { title: "Monstruos derrotados",   body: "Un monstruo derrotado no reaparece hasta el día siguiente. Explora nuevas zonas para seguir ganando XP." },
    { title: "Torre de Babel",         body: "La Torre es el desafío máximo. Pisos infinitos, cada vez más difíciles. Si pierdes en un piso, pierdes todo el progreso del día." },
    { title: "Zonas bloqueadas",       body: "Las zonas avanzadas requieren un nivel mínimo. Sube de nivel entrenando para acceder a enemigos más fuertes." },
  ],
  statistics: [
    { title: "Tu rango de cazador",    body: "El rango va de F a SSS. Sube completando requisitos de nivel, stats, monstruos derrotados y Torre de Babel." },
    { title: "Progreso al siguiente",  body: "Cada barra muestra qué tan cerca estás de subir de rango. Completa todos los requisitos para ascender." },
    { title: "Historial",              body: "Aquí ves tus logros: racha de días, monstruos derrotados, XP total ganado y récord en la Torre." },
  ],
};

// ─── Hook para verificar si el tutorial ya fue visto ─────────────────────────
export function useTutorial(sectionKey) {
  const [show, setShow]   = useState(false);
  const [step, setStep]   = useState(0);
  const storageKey        = `tutorial_done_${sectionKey}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(done => {
      if (!done) setShow(true);
    });
  }, []);

  async function dismiss() {
    setShow(false);
    await AsyncStorage.setItem(storageKey, "true");
  }

  function next() {
    const steps = TUTORIALS[sectionKey] ?? [];
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  const steps    = TUTORIALS[sectionKey] ?? [];
  const current  = steps[step];
  const isLast   = step === steps.length - 1;

  return { show, step, current, isLast, next, dismiss, total: steps.length };
}

// ─── Tutorial Overlay Component ───────────────────────────────────────────────
export function TutorialOverlay({ sectionKey }) {
  const { show, step, current, isLast, next, dismiss, total } = useTutorial(sectionKey);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
        Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
      ]).start();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      slideAnim.setValue(20);
      Animated.timing(slideAnim, { toValue:0, duration:300, useNativeDriver:true }).start();
    }
  }, [step]);

  if (!show || !current) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
        {/* Step dots */}
        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        {/* Content */}
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={dismiss} style={styles.skipBtn}>
            <Text style={styles.skipText}>Saltar tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} style={styles.nextBtn}>
            <Text style={styles.nextText}>
              {isLast ? "¡Entendido!" : "Siguiente →"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position:"absolute", bottom:0, left:0, right:0,
    backgroundColor:"#000000aa",
    padding:20, paddingBottom:40,
    zIndex:9998,
  },
  card: {
    backgroundColor:"#12121a", borderWidth:1,
    borderColor:"#4a3f8a", borderRadius:12,
    padding:20, gap:12,
  },
  dots:    { flexDirection:"row", gap:6 },
  dot:     { width:6, height:6, borderRadius:3, backgroundColor:"#2a2a3d" },
  dotActive:{ width:18, backgroundColor:"#e8c84a" },
  dotDone: { backgroundColor:"#55c080" },
  title:   { color:"#e8c84a", fontSize:16, fontWeight:"900", letterSpacing:1 },
  body:    { color:"#a09aaa", fontSize:14, lineHeight:22 },
  actions: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginTop:4 },
  skipBtn: { paddingVertical:8, paddingHorizontal:4 },
  skipText:{ color:"#6a6080", fontSize:13 },
  nextBtn: { backgroundColor:"#e8c84a", paddingHorizontal:20, paddingVertical:10, borderRadius:6 },
  nextText:{ color:"#0a0a0f", fontSize:13, fontWeight:"900", letterSpacing:1 },
});