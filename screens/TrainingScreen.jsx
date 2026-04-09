import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import { getTodayMissions, listenToTodayMissions, completePomodoro } from "../firebase/firestore";
import { EXERCISES, MISSION_XP, FREE_TRAIN_DURATIONS, POMODORO_DURATIONS } from "../systems/missionSystem";
import { DIFFICULTY_CONFIG_MAP } from "../constants/combatConfig";
import { TutorialOverlay } from "../components/TutorialOverlay";
import { getPomodoroIntGain } from "../constants/classes";

const C = {
  bg:"#000000", surface:"#0a0a10", surface2:"#101018",
  border:"#2a2a3d", borderGlow:"#4a3f8a",
  accent:"#e8c84a", text:"#e8e0f0", textDim:"#6a6080",
  success:"#55c080",
};

function MissionCard({ difficulty, mission, onStart }) {
  const config   = DIFFICULTY_CONFIG_MAP[difficulty];
  const exercise = EXERCISES[mission.exercise];
  const animProg = useRef(new Animated.Value(mission.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animProg, { toValue: mission.completed ? 1 : 0, duration: 600, useNativeDriver: false }).start();
  }, [mission.completed]);

  return (
    <View style={[styles.missionCard, { borderColor: config.color + "44" }]}>
      <View style={styles.missionHeader}>
        <View style={styles.missionHeaderLeft}>
          <Text style={styles.missionEmoji}>{config.emoji}</Text>
          <View>
            <Text style={[styles.missionDifficulty, { color: config.color }]}>{config.label}</Text>
            <Text style={styles.missionExercise}>{exercise.emoji} {exercise.label}</Text>
          </View>
        </View>
        <View style={styles.missionMeta}>
          <Text style={styles.missionXPText}>+{config.xp} XP</Text>
          <Text style={styles.missionTimeText}>⏱ {config.time / 60} min</Text>
        </View>
      </View>

      <View style={styles.missionRepsRow}>
        <Text style={styles.missionRepsLabel}>META</Text>
        <Text style={[styles.missionRepsValue, { color: config.color }]}>{mission.reps} reps</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, {
          backgroundColor: config.color,
          width: animProg.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }),
        }]} />
      </View>

      {mission.completed ? (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ COMPLETADA</Text>
        </View>
      ) : (
        <TouchableOpacity style={[styles.missionBtn, { borderColor: config.color }]} onPress={() => onStart(difficulty, mission)} activeOpacity={0.8}>
          <Text style={[styles.missionBtnText, { color: config.color }]}>▶  INICIAR MISIÓN</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TrainingScreen({ navigation }) {
  const [missions, setMissions] = useState(null);
  const [loading, setLoading]   = useState(true);
  const uid = auth.currentUser?.uid;
  const [playerClass, setPlayerClass]   = useState(null);
  const [playerGender, setPlayerGender] = useState("m");
  const [pomodoroActive, setPomodoroActive]     = useState(false);
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning]   = useState(false);
  const [pomodoroCompleted, setPomodoroCompleted] = useState(0);
  const [pomodoroIntGained, setPomodoroIntGained] = useState(null);
  const pomodoroRef = useRef(null);
  const pomodoroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!uid) return;
    async function init() {
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");
      const snap  = await getDoc(doc(db, "users", uid));
      const data  = snap.exists() ? snap.data() : {};
      const level = data.level ?? 1;
      const cls   = data.class ?? null;
      const focus = data.focus ?? null;
      setPlayerClass(cls);
      setPlayerGender(data.gender ?? "m");
      await getTodayMissions(uid, level, cls, focus);
      setLoading(false);
    }
    init();
    const unsub = listenToTodayMissions(uid, (data) => setMissions(data));
    return unsub;
  }, [uid]);

  function startPomodoro() {
    setPomodoroTimeLeft(pomodoroDuration * 60);
    setPomodoroIntGained(null);
    setPomodoroRunning(true);
    pomodoroRef.current = setInterval(() => {
      setPomodoroTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(pomodoroRef.current);
          setPomodoroRunning(false);
          handlePomodoroComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pausePomodoro() {
    if (pomodoroRunning) {
      clearInterval(pomodoroRef.current);
      setPomodoroRunning(false);
    } else {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(pomodoroRef.current);
            setPomodoroRunning(false);
            handlePomodoroComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setPomodoroRunning(true);
    }
  }

  function cancelPomodoro() {
    clearInterval(pomodoroRef.current);
    setPomodoroRunning(false);
    setPomodoroActive(false);
    setPomodoroTimeLeft(pomodoroDuration * 60);
    setPomodoroIntGained(null);
  }

  async function handlePomodoroComplete() {
    const intGain = getPomodoroIntGain(playerClass);
    try {
      await completePomodoro(uid, intGain);
    } catch(e) { console.error(e); }
    setPomodoroCompleted(c => c + 1);
    setPomodoroIntGained(intGain);
    Animated.sequence([
      Animated.timing(pomodoroAnim, { toValue:1, duration:400, useNativeDriver:true }),
      Animated.delay(2000),
      Animated.timing(pomodoroAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }

  function formatPomodoroTime(s) {
    return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  }

  function startMission(difficulty, mission) {
    navigation.navigate("Combat", { mode:"mission", difficulty, mission, playerClass, playerGender });
  }

  function startFree(exercise, durationMinutes) {
    navigation.navigate("Combat", { mode:"free", exercise, durationMinutes, playerClass, playerGender });
  }

  const completedCount = missions ? ["easy","medium","hard"].filter(d => missions[d]?.completed).length : 0;
  const allCompleted   = completedCount === 3;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLVER</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ENTRENAMIENTO</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerItem}>
            <Text style={styles.bannerValue}>{completedCount}/3</Text>
            <Text style={styles.bannerLabel}>MISIONES HOY</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerItem}>
            <Text style={[styles.bannerValue, { color: allCompleted ? C.success : C.accent }]}>
              {allCompleted ? "✓ COMPLETO" : `${3 - completedCount} restantes`}
            </Text>
            <Text style={styles.bannerLabel}>PROGRESO DIARIO</Text>
          </View>
        </View>

        {loading || !missions ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.accent} />
            <Text style={styles.loadingText}>Generando misiones...</Text>
          </View>
        ) : (
          <View style={styles.missionsContainer}>
            <Text style={styles.sectionLabel}>MISIONES DEL DÍA</Text>
            {["easy","medium","hard"].map(diff =>
              missions[diff] && (
                <MissionCard key={diff} difficulty={diff} mission={missions[diff]} onStart={startMission} />
              )
            )}
          </View>
        )}

        {allCompleted && (
          <View style={styles.allDoneCard}>
            <Text style={styles.allDoneEmoji}>🏆</Text>
            <Text style={styles.allDoneTitle}>¡TODO COMPLETADO!</Text>
            <Text style={styles.allDoneSubtitle}>Regresa mañana para nuevas misiones</Text>
          </View>
        )}

        {/* Modo Libre */}
        <View style={styles.freeSection}>
          <Text style={styles.sectionLabel}>MODO LIBRE</Text>
          {Object.entries(EXERCISES).map(([key, ex]) => (
            <View key={key} style={styles.freeExerciseCard}>
              <Text style={styles.freeExerciseEmoji}>{ex.emoji}</Text>
              <View style={styles.freeExerciseInfo}>
                <Text style={styles.freeExerciseName}>{ex.label}</Text>
                <Text style={styles.freeExerciseStat}>+{ex.stat} · +{ex.secondaryStat}</Text>
              </View>
              <View style={styles.freeDurations}>
                {FREE_TRAIN_DURATIONS.map(min => (
                  <TouchableOpacity
                    key={min}
                    style={styles.freeDurationBtn}
                    onPress={() => startFree(key, min)}
                  >
                    <Text style={styles.freeDurationText}>{min}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* ── Pomodoro ── */}
        <View style={styles.pomodoroSection}>
          <Text style={styles.sectionLabel}>🧠 POMODORO — Entrena tu mente</Text>
          <Text style={styles.pomodoroSubtitle}>
            {playerClass === "mage" || playerClass === "scientist"
              ? "Tu clase gana +2 Inteligencia por sesión completada"
              : "Completa una sesión para ganar +1 Inteligencia"}
          </Text>

          {!pomodoroActive ? (
            <View style={styles.pomodoroSetup}>
              {/* Selector de duración */}
              <View style={styles.pomodoroDurations}>
                {[25, 45, 60].map(min => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.pomodoroDurationBtn, pomodoroDuration === min && { backgroundColor:"#a07de0", borderColor:"#a07de0" }]}
                    onPress={() => { setPomodoroDuration(min); setPomodoroTimeLeft(min * 60); }}
                  >
                    <Text style={[styles.pomodoroDurationText, pomodoroDuration === min && { color:"#000000" }]}>{min} min</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.pomodoroStartBtn} onPress={() => { setPomodoroActive(true); startPomodoro(); }}>
                <Text style={styles.pomodoroStartText}>▶  INICIAR SESIÓN</Text>
              </TouchableOpacity>

              {pomodoroCompleted > 0 && (
                <View style={styles.pomodoroStats}>
                  <Text style={styles.pomodoroStatsText}>
                    🧠 {pomodoroCompleted} sesión{pomodoroCompleted > 1 ? "es" : ""} completada{pomodoroCompleted > 1 ? "s" : ""} hoy
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.pomodoroTimer}>
              {/* Timer circular */}
              <View style={[styles.pomodoroCircle, { borderColor: pomodoroRunning ? "#a07de0" : C.border }]}>
                <Text style={[styles.pomodoroTime, { color: pomodoroRunning ? "#a07de0" : C.textDim }]}>
                  {formatPomodoroTime(pomodoroTimeLeft)}
                </Text>
                <Text style={styles.pomodoroStatus}>
                  {pomodoroTimeLeft === 0 ? "¡COMPLETADO!" : pomodoroRunning ? "CONCENTRADO" : "PAUSADO"}
                </Text>
              </View>

              {/* Barra de progreso */}
              <View style={styles.pomodoroTrack}>
                <View style={[styles.pomodoroFill, {
                  width: `${((pomodoroDuration * 60 - pomodoroTimeLeft) / (pomodoroDuration * 60)) * 100}%`,
                  backgroundColor: "#a07de0",
                }]} />
              </View>

              {/* INT ganada */}
              <Animated.View style={[styles.pomodoroReward, { opacity: pomodoroAnim }]}>
                <Text style={styles.pomodoroRewardText}>
                  +{pomodoroIntGained} Inteligencia ganada ✨
                </Text>
              </Animated.View>

              {/* Controles */}
              <View style={styles.pomodoroControls}>
                <TouchableOpacity style={styles.pomodoroCancelBtn} onPress={cancelPomodoro}>
                  <Text style={styles.pomodoroCancelText}>CANCELAR</Text>
                </TouchableOpacity>
                {pomodoroTimeLeft > 0 && (
                  <TouchableOpacity style={[styles.pomodoroPauseBtn, { backgroundColor: pomodoroRunning ? "#101018" : "#a07de0" }]} onPress={pausePomodoro}>
                    <Text style={[styles.pomodoroPauseText, { color: pomodoroRunning ? "#a07de0" : "#000000" }]}>
                      {pomodoroRunning ? "⏸  PAUSAR" : "▶  CONTINUAR"}
                    </Text>
                  </TouchableOpacity>
                )}
                {pomodoroTimeLeft === 0 && (
                  <TouchableOpacity style={styles.pomodoroPauseBtn} onPress={() => { setPomodoroActive(false); setPomodoroTimeLeft(pomodoroDuration * 60); }}>
                    <Text style={[styles.pomodoroPauseText, { color:"#000000" }]}>✓ LISTO</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TutorialOverlay sectionKey="training" />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  scroll: { paddingHorizontal:16, paddingTop:56, paddingBottom:32 },

  header:      { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
  backBtn:     { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText:    { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:4 },

  banner:        { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, flexDirection:"row", marginBottom:24 },
  bannerItem:    { flex:1, paddingVertical:14, alignItems:"center", gap:4 },
  bannerDivider: { width:1, backgroundColor:C.border },
  bannerValue:   { color:C.text, fontSize:18, fontWeight:"900" },
  bannerLabel:   { color:C.textDim, fontSize:9, letterSpacing:2, fontWeight:"700" },

  sectionLabel:       { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:10 },

  // Pomodoro
  pomodoroSection:    { paddingTop:8, paddingBottom:8 },
  pomodoroSubtitle:   { color:C.textDim, fontSize:11, marginBottom:14, lineHeight:16 },
  pomodoroSetup:      { gap:12 },
  pomodoroDurations:  { flexDirection:"row", gap:8 },
  pomodoroDurationBtn:{ flex:1, borderWidth:1, borderColor:"#2a2a3d", borderRadius:6, paddingVertical:10, alignItems:"center", backgroundColor:C.surface },
  pomodoroDurationText:{ color:C.textDim, fontSize:13, fontWeight:"700" },
  pomodoroStartBtn:   { backgroundColor:"#a07de0", borderRadius:6, paddingVertical:14, alignItems:"center" },
  pomodoroStartText:  { color:"#000000", fontSize:13, fontWeight:"900", letterSpacing:2 },
  pomodoroStats:      { backgroundColor:C.surface, borderRadius:6, padding:12, alignItems:"center" },
  pomodoroStatsText:  { color:"#a07de0", fontSize:12, fontWeight:"700" },

  pomodoroTimer:      { alignItems:"center", gap:14 },
  pomodoroCircle:     { width:160, height:160, borderRadius:80, borderWidth:3, justifyContent:"center", alignItems:"center", gap:6 },
  pomodoroTime:       { fontSize:36, fontWeight:"900", letterSpacing:2 },
  pomodoroStatus:     { fontSize:9, fontWeight:"700", letterSpacing:2, color:C.textDim },
  pomodoroTrack:      { width:"100%", height:6, backgroundColor:C.surface, borderRadius:3, overflow:"hidden" },
  pomodoroFill:       { height:"100%", borderRadius:3 },
  pomodoroReward:     { backgroundColor:"#a07de022", borderWidth:1, borderColor:"#a07de066", borderRadius:6, paddingHorizontal:16, paddingVertical:8 },
  pomodoroRewardText: { color:"#a07de0", fontSize:14, fontWeight:"900" },
  pomodoroControls:   { flexDirection:"row", gap:10, width:"100%" },
  pomodoroCancelBtn:  { flex:1, borderWidth:1, borderColor:C.border, borderRadius:6, paddingVertical:13, alignItems:"center" },
  pomodoroCancelText: { color:C.textDim, fontSize:12, fontWeight:"700", letterSpacing:1 },
  pomodoroPauseBtn:   { flex:2, borderRadius:6, paddingVertical:13, alignItems:"center", backgroundColor:"#a07de0" },
  pomodoroPauseText:  { fontSize:12, fontWeight:"900", letterSpacing:1 },
  missionsContainer:  { gap:12, marginBottom:24 },

  missionCard:       { backgroundColor:C.surface, borderWidth:1, borderRadius:4, padding:16, gap:12 },
  missionHeader:     { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  missionHeaderLeft: { flexDirection:"row", alignItems:"center", gap:10 },
  missionEmoji:      { fontSize:20 },
  missionDifficulty: { fontSize:10, fontWeight:"900", letterSpacing:2 },
  missionExercise:   { color:C.text, fontSize:15, fontWeight:"700", marginTop:2 },
  missionMeta:       { alignItems:"flex-end", gap:4 },
  missionXPText:     { color:C.accent, fontSize:14, fontWeight:"900" },
  missionTimeText:   { color:C.textDim, fontSize:11 },
  missionRepsRow:    { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  missionRepsLabel:  { color:C.textDim, fontSize:10, letterSpacing:2, fontWeight:"700" },
  missionRepsValue:  { fontSize:16, fontWeight:"900" },
  progressTrack:     { height:6, backgroundColor:C.surface2, borderRadius:2, overflow:"hidden" },
  progressFill:      { height:"100%", borderRadius:2 },
  missionBtn:        { borderWidth:1, borderRadius:4, paddingVertical:12, alignItems:"center" },
  missionBtnText:    { fontSize:12, fontWeight:"900", letterSpacing:2 },
  completedBadge:    { backgroundColor:C.success+"22", borderWidth:1, borderColor:C.success+"44", borderRadius:4, paddingVertical:10, alignItems:"center" },
  completedText:     { color:C.success, fontSize:12, fontWeight:"900", letterSpacing:2 },

  loadingBox:  { alignItems:"center", paddingVertical:60, gap:12 },
  loadingText: { color:C.textDim, fontSize:12, letterSpacing:2 },

  allDoneCard:    { backgroundColor:C.surface, borderWidth:1, borderColor:C.accent+"44", borderRadius:4, padding:24, alignItems:"center", gap:8, marginBottom:24 },
  allDoneEmoji:   { fontSize:40 },
  allDoneTitle:   { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:3 },
  allDoneSubtitle:{ color:C.textDim, fontSize:12 },

  freeSection:       { marginBottom:16, gap:10 },
  freeExerciseCard:  { backgroundColor:C.surface, borderWidth:1, borderColor:C.borderGlow, borderRadius:4, padding:14, flexDirection:"row", alignItems:"center", gap:12 },
  freeExerciseEmoji: { fontSize:28 },
  freeExerciseInfo:  { flex:1 },
  freeExerciseName:  { color:C.accent, fontSize:13, fontWeight:"900" },
  freeExerciseStat:  { color:C.textDim, fontSize:11, marginTop:2 },
  freeDurations:     { flexDirection:"row", gap:6 },
  freeDurationBtn:   { backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:4, paddingHorizontal:10, paddingVertical:6 },
  freeDurationText:  { color:C.text, fontSize:12, fontWeight:"700" },
});