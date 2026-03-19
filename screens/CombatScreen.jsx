import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator, SafeAreaView,
} from "react-native";
import { auth } from "../firebase/config";
import { completeMission, defeatMonster, completeFreeTrain, defeatTowerFloor, failTowerSession } from "../firebase/firestore";
import { EXERCISES, MISSION_XP } from "../systems/missionSystem";
import { DIFFICULTY_CONFIG_MAP } from "../constants/combatConfig";
import ResultModal from "../components/ResultModal";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "#0a0a0f",
  surface: "#12121a",
  surface2:"#1a1a28",
  border:  "#2a2a3d",
  accent:  "#e8c84a",
  text:    "#e8e0f0",
  textDim: "#6a6080",
  success: "#55c080",
  warning: "#e8a84a",
  danger:  "#e05555",
};

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useTimer(initialSeconds, onFinish) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [running, setRunning]   = useState(false);
  const intervalRef             = useRef(null);
  const timeLeftRef             = useRef(initialSeconds);

  function start() { setRunning(true); }
  function stop()  { setRunning(false); clearInterval(intervalRef.current); }
  function reset(s) {
    stop();
    timeLeftRef.current = s ?? initialSeconds;
    setTimeLeft(timeLeftRef.current);
  }

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        onFinish?.();
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const progress = initialSeconds > 0 ? timeLeft / initialSeconds : 0;
  return { timeLeft, running, start, stop, reset, progress };
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ─── CombatScreen ─────────────────────────────────────────────────────────────
// params recibidos via navigation.navigate("Combat", { mode, ... })
//
// Modos:
//   mode: "mission"   → { difficulty, mission }
//   mode: "monster"   → { monster }
//   mode: "tower"     → { monster, towerRecord }
//   mode: "free"      → { exercise, durationMinutes }

export default function CombatScreen({ route, navigation }) {
  const { mode, difficulty, mission, monster, exercise, durationMinutes, towerRecord } = route.params ?? {};

  const uid = auth.currentUser?.uid;

  // ── Derivar configuración según modo ────────────────────────────────────────
  const config = buildConfig(mode, { difficulty, mission, monster, exercise, durationMinutes });

  // ── State ──────────────────────────────────────────────────────────────────
  const [reps, setReps]       = useState(0);
  const [started, setStarted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null); // { type, title, message }

  const barAnim = useRef(new Animated.Value(1)).current;

  const timer = useTimer(config.timer, () => setExpired(true));

  // Animación de barra de tiempo
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: timer.progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timer.timeLeft]);

  const timerColor = timer.progress > 0.5 ? C.success
    : timer.progress > 0.25 ? C.warning : C.danger;

  const meetsGoal  = config.hasGoal ? reps >= config.reps : true;

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleFinish() {
    if (reps === 0) return;
    timer.stop();
    setLoading(true);

    try {
      if (mode === "mission") {
        await completeMission(uid, difficulty, mission.exercise, reps, meetsGoal && !expired);
        setResult({
          type:    meetsGoal && !expired ? "mission" : "warning",
          title:   meetsGoal && !expired ? "¡Misión Completada!" : "Misión Terminada",
          message: meetsGoal && !expired
            ? `+${mission.xp} XP ganados`
            : `Obtuviste stats por ${reps} reps.\nCompleta la meta para ganar XP.`,
        });

      } else if (mode === "monster") {
        if (meetsGoal) {
          await defeatMonster(uid, monster);
          setResult({
            type:    "victory",
            title:   "¡Victoria!",
            message: `Derrotaste a ${monster.name}\n+${monster.xp} XP`,
          });
        } else {
          setResult({
            type:    "defeat",
            title:   "Derrota",
            message: `No completaste los reps necesarios.\n${monster.name} sigue en pie.`,
          });
        }

      } else if (mode === "tower") {
        if (meetsGoal) {
          await defeatTowerFloor(uid, monster);
          setResult({
            type:    "victory",
            title:   `¡Piso ${monster.floor} Superado!`,
            message: `+${monster.xp} XP\nSiguiente: Piso ${monster.floor + 1}`,
          });
        } else {
          await failTowerSession(uid);
          setResult({
            type:    "defeat",
            title:   "Caíste en la Torre",
            message: `Llegaste al piso ${monster.floor}.\nRécord: Piso ${Math.max(towerRecord ?? 0, monster.floor - 1)}\nRegresa mañana.`,
          });
        }

      } else if (mode === "free") {
        await completeFreeTrain(uid, exercise, reps);
        const ex = EXERCISES[exercise];
        setResult({
          type:    "mission",
          title:   "¡Sesión Completada!",
          message: `${reps} reps de ${ex.label}\n+${ex.stat} y +${ex.secondaryStat} ganados`,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleResultClose() {
    navigation.goBack();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← SALIR</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: config.color }]}>
          {config.title}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      {/* ── Enemy / Exercise info ── */}
      <View style={[styles.infoCard, { borderColor: config.color + "55" }]}>
        <Text style={styles.infoEmoji}>{config.emoji}</Text>
        <View style={styles.infoText}>
          <Text style={[styles.infoName, { color: config.color }]}>{config.name}</Text>
          <Text style={styles.infoDesc}>{config.description}</Text>
        </View>
      </View>

      {/* ── Challenge ── */}
      {config.hasGoal && (
        <View style={styles.challengeRow}>
          <View style={styles.challengeItem}>
            <Text style={styles.challengeLabel}>EJERCICIO</Text>
            <Text style={styles.challengeValue}>
              {EXERCISES[config.exercise]?.emoji} {EXERCISES[config.exercise]?.label}
            </Text>
          </View>
          <View style={styles.challengeDivider} />
          <View style={styles.challengeItem}>
            <Text style={styles.challengeLabel}>META</Text>
            <Text style={[styles.challengeValue, { color: config.color }]}>
              {config.reps} reps
            </Text>
          </View>
          <View style={styles.challengeDivider} />
          <View style={styles.challengeItem}>
            <Text style={styles.challengeLabel}>RECOMPENSA</Text>
            <Text style={[styles.challengeValue, { color: C.accent }]}>
              +{config.xp} XP
            </Text>
          </View>
        </View>
      )}

      {/* ── Timer ── */}
      <View style={styles.timerSection}>
        <View style={[styles.timerCircle, { borderColor: started ? timerColor : C.border }]}>
          <Text style={[styles.timerTime, { color: started ? timerColor : C.textDim }]}>
            {formatTime(timer.timeLeft)}
          </Text>
          <Text style={styles.timerStatus}>
            {expired ? "TIEMPO AGOTADO" : timer.running ? "EN CURSO" : started ? "PAUSADO" : "LISTO"}
          </Text>
        </View>

        {/* Timer bar */}
        <View style={styles.timerTrack}>
          <Animated.View style={[
            styles.timerFill,
            {
              backgroundColor: started ? timerColor : C.border,
              width: barAnim.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }),
            }
          ]} />
        </View>

        {/* Timer control */}
        {!expired && (
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: started ? C.warning : C.success }]}
            onPress={() => {
              if (!started) { setStarted(true); timer.start(); }
              else timer.running ? timer.stop() : timer.start();
            }}
          >
            <Text style={styles.timerBtnText}>
              {!started ? "▶  INICIAR" : timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Rep Counter ── */}
      <View style={styles.repSection}>
        <Text style={styles.repLabel}>REPS COMPLETADAS</Text>
        <View style={styles.repRow}>
          <TouchableOpacity
            style={styles.repMinus}
            onPress={() => setReps(r => Math.max(0, r - 1))}
          >
            <Text style={styles.repMinusText}>−</Text>
          </TouchableOpacity>
          <View style={styles.repDisplayContainer}>
            <Text style={[styles.repDisplay, config.hasGoal && reps >= config.reps && { color: C.success }]}>
              {reps}
            </Text>
            {config.hasGoal && (
              <Text style={styles.repGoal}>/ {config.reps}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.repPlus}
            onPress={() => setReps(r => r + 1)}
          >
            <Text style={styles.repPlusText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback */}
        {config.hasGoal && reps > 0 && (
          <Text style={[styles.repFeedback, { color: meetsGoal ? C.success : C.warning }]}>
            {meetsGoal ? `✓ Meta alcanzada` : `${config.reps - reps} reps para completar la meta`}
          </Text>
        )}
      </View>

      {/* ── Finish Button ── */}
      <TouchableOpacity
        style={[styles.finishBtn, (reps === 0 || loading) && styles.finishBtnDisabled]}
        onPress={handleFinish}
        disabled={reps === 0 || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={styles.finishBtnText}>TERMINAR SESIÓN</Text>
        }
      </TouchableOpacity>

      {/* ── Result Modal ── */}
      {result && (
        <ResultModal
          visible={!!result}
          type={result.type}
          title={result.title}
          message={result.message}
          onClose={handleResultClose}
        />
      )}
    </SafeAreaView>
  );
}

// ─── buildConfig ──────────────────────────────────────────────────────────────
function buildConfig(mode, params) {
  const { difficulty, mission, monster, exercise, durationMinutes } = params;

  if (mode === "mission") {
    const ex   = EXERCISES[mission.exercise];
    const diff = DIFFICULTY_CONFIG_MAP[difficulty];
    return {
      title:       diff.label,
      color:       diff.color,
      emoji:       ex.emoji,
      name:        ex.label,
      description: `Misión ${diff.label} del día`,
      exercise:    mission.exercise,
      reps:        mission.reps,
      timer:       diff.time,
      xp:          mission.xp,
      hasGoal:     true,
    };
  }

  if (mode === "monster" || mode === "tower") {
    const ex = EXERCISES[monster.exercise];
    return {
      title:       mode === "tower" ? `PISO ${monster.floor}` : "COMBATE",
      color:       mode === "tower" ? "#8a4abf" : "#e05555",
      emoji:       monster.emoji,
      name:        monster.name,
      description: monster.description,
      exercise:    monster.exercise,
      reps:        monster.reps,
      timer:       monster.timer,
      xp:          monster.xp,
      hasGoal:     true,
    };
  }

  if (mode === "free") {
    const ex = EXERCISES[exercise];
    return {
      title:       "MODO LIBRE",
      color:       "#a07de0",
      emoji:       ex.emoji,
      name:        ex.label,
      description: `${durationMinutes} minutos · Solo stats`,
      exercise,
      reps:        0,
      timer:       durationMinutes * 60,
      xp:          0,
      hasGoal:     false,
    };
  }

  return { title:"COMBATE", color:"#e8c84a", emoji:"⚔️", name:"", description:"", exercise:"pushups", reps:0, timer:60, xp:0, hasGoal:false };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },

  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  backBtn: { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText: { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle: { fontSize:14, fontWeight:"900", letterSpacing:4 },

  infoCard: { marginHorizontal:16, marginVertical:12, backgroundColor:C.surface, borderWidth:1, borderRadius:4, padding:16, flexDirection:"row", alignItems:"center", gap:14 },
  infoEmoji: { fontSize:44 },
  infoText:  { flex:1, gap:4 },
  infoName:  { fontSize:18, fontWeight:"900" },
  infoDesc:  { color:C.textDim, fontSize:12 },

  challengeRow: { flexDirection:"row", marginHorizontal:16, backgroundColor:C.surface, borderRadius:4, borderWidth:1, borderColor:C.border, marginBottom:12 },
  challengeItem: { flex:1, paddingVertical:12, alignItems:"center", gap:4 },
  challengeDivider: { width:1, backgroundColor:C.border },
  challengeLabel: { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2 },
  challengeValue: { color:C.text, fontSize:14, fontWeight:"900" },

  timerSection: { alignItems:"center", paddingHorizontal:16, gap:12, marginBottom:8 },
  timerCircle: { width:140, height:140, borderRadius:70, borderWidth:3, justifyContent:"center", alignItems:"center", gap:4 },
  timerTime:   { fontSize:32, fontWeight:"900", letterSpacing:2 },
  timerStatus: { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3 },
  timerTrack:  { width:"100%", height:6, backgroundColor:C.surface2, borderRadius:3, overflow:"hidden" },
  timerFill:   { height:"100%", borderRadius:3 },
  timerBtn:    { width:"100%", paddingVertical:14, borderRadius:4, alignItems:"center" },
  timerBtnText:{ color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  repSection: { alignItems:"center", paddingHorizontal:16, gap:10, marginBottom:16 },
  repLabel:   { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3 },
  repRow:     { flexDirection:"row", alignItems:"center", gap:24 },
  repMinus:   { width:56, height:56, backgroundColor:C.surface2, borderRadius:4, justifyContent:"center", alignItems:"center", borderWidth:1, borderColor:C.border },
  repMinusText:{ color:C.text, fontSize:30, fontWeight:"900" },
  repDisplayContainer: { alignItems:"center" },
  repDisplay: { color:C.accent, fontSize:56, fontWeight:"900", lineHeight:60 },
  repGoal:    { color:C.textDim, fontSize:13, fontWeight:"700" },
  repPlus:    { width:56, height:56, backgroundColor:C.accent, borderRadius:4, justifyContent:"center", alignItems:"center" },
  repPlusText:{ color:C.bg, fontSize:30, fontWeight:"900" },
  repFeedback:{ fontSize:13, fontWeight:"700", letterSpacing:1 },

  finishBtn: { marginHorizontal:16, backgroundColor:C.accent, borderRadius:4, paddingVertical:18, alignItems:"center" },
  finishBtnDisabled: { opacity:0.35 },
  finishBtnText: { color:C.bg, fontSize:14, fontWeight:"900", letterSpacing:2 },
});