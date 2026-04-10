import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from "react-native";
import { auth } from "../firebase/config";
import { getTodayMissions, listenToTodayMissions, completePomodoro } from "../firebase/firestore";
import { EXERCISES, MISSION_XP, FREE_TRAIN_DURATIONS } from "../systems/missionSystem";
import { STAT_LABELS } from "../constants/labels";
import { DIFFICULTY_CONFIG_MAP } from "../constants/combatConfig";
import { TutorialOverlay } from "../components/TutorialOverlay";
import { getPomodoroIntGain } from "../constants/classes";
import g from "../constants/globalStyles";
import { colors as C, spacing as S, typography as T, radius as R } from "../constants/theme";

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({ difficulty, mission, onStart }) {
  if (!mission || !mission.exercise || mission.completed === undefined) return null;
  const config   = DIFFICULTY_CONFIG_MAP[difficulty];
  const exercise = EXERCISES[mission.exercise];
  const animProg = useRef(new Animated.Value(mission.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animProg, { toValue: mission.completed ? 1 : 0, duration: 600, useNativeDriver: false }).start();
  }, [mission.completed]);

  return (
    <View style={[g.card, { borderColor: config.color + "44" }]}>
      <View style={[g.cardBody, { gap: S.sm }]}>
      <View style={s.missionHeader}>
        <View style={s.missionLeft}>
          <View style={[s.dot, { backgroundColor: config.color }]} />
          <View>
            <Text style={[s.diffLabel, { color: config.color }]}>{config.label}</Text>
            <Text style={s.exerciseName}>{exercise?.emoji} {exercise?.label}</Text>
          </View>
        </View>
        <View style={s.missionRight}>
          <Text style={[s.xpText, { color: config.color }]}>+{mission.xp} XP</Text>
          <Text style={s.timeText}>⏱ {config.time ? Math.floor(config.time / 60) : config.minutes} min</Text>
        </View>
      </View>

      <View style={s.missionMeta}>
        <Text style={g.statLabel}>META</Text>
        <Text style={[s.repsText, { color: mission.completed ? C.success : config.color }]}>
          {mission.reps} reps
        </Text>
      </View>

      <View style={s.progressBar}>
        <Animated.View style={[s.progressFill, { width: animProg.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }), backgroundColor: config.color }]} />
      </View>

      {mission.completed ? (
        <View style={[g.btnOutline, { borderColor: C.success + "44", backgroundColor: C.success + "11" }]}>
          <Text style={[g.btnOutlineText, { color: C.success }]}>✓ COMPLETADA</Text>
        </View>
      ) : (
        <TouchableOpacity style={[g.btnOutline, { borderColor: config.color + "66" }]} onPress={() => onStart(difficulty, mission)} activeOpacity={0.8}>
          <Text style={[g.btnOutlineText, { color: config.color }]}>▶ INICIAR MISIÓN</Text>
        </TouchableOpacity>
      )}
      </View>
    </View>
  );
}

// ─── TrainingScreen ───────────────────────────────────────────────────────────
export default function TrainingScreen({ navigation }) {
  const uid = auth.currentUser?.uid;
  const [missions, setMissions]         = useState({});
  const [loading, setLoading]           = useState(true);
  const [playerClass, setPlayerClass]   = useState(null);
  const [playerGender, setPlayerGender] = useState("m");
  const [completedCount, setCompletedCount] = useState(0);

  // Pomodoro state
  const [pomodoroActive, setPomodoroActive]       = useState(false);
  const [pomodoroDuration, setPomodoroDuration]   = useState(25);
  const [pomodoroTimeLeft, setPomodoroTimeLeft]   = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning]     = useState(false);
  const [pomodoroCompleted, setPomodoroCompleted] = useState(0);
  const [pomodoroIntGained, setPomodoroIntGained] = useState(null);
  const pomodoroRef  = useRef(null);
  const pomodoroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!uid) return;
    async function init() {
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");
      const snap = await getDoc(doc(db, "users", uid));
      const data = snap.exists() ? snap.data() : {};
      setPlayerClass(data.class ?? null);
      setPlayerGender(data.gender ?? "m");
      await getTodayMissions(uid, data.level ?? 1, data.class, data.focus);
      setLoading(false);
    }
    init();
    const unsub = listenToTodayMissions(uid, (data) => {
      setMissions(data ?? {});
      setCompletedCount(Object.values(data ?? {}).filter(m => m && m.completed).length);
    });
    return unsub;
  }, []);

  // Pomodoro functions
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
    try { await completePomodoro(uid, intGain); } catch(e) { console.error(e); }
    setPomodoroCompleted(c => c + 1);
    setPomodoroIntGained(intGain);
    Animated.sequence([
      Animated.timing(pomodoroAnim, { toValue:1, duration:400, useNativeDriver:true }),
      Animated.delay(2000),
      Animated.timing(pomodoroAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }

  function formatTime(sec) {
    return `${Math.floor(sec/60).toString().padStart(2,"0")}:${(sec%60).toString().padStart(2,"0")}`;
  }

  function startMission(difficulty, mission) {
    navigation.navigate("Combat", { mode:"mission", difficulty, mission, playerClass, playerGender });
  }

  function startFree(exercise, durationMinutes) {
    navigation.navigate("Combat", { mode:"free", exercise, durationMinutes, playerClass, playerGender });
  }

  const total     = Object.keys(missions).length;
  const remaining = total - completedCount;

  return (
    <View style={g.screen}>
      {/* Header */}
      <View style={s.headerCompact}>
        <TouchableOpacity style={g.backBtn} onPress={() => navigation.goBack()}>
          <Text style={g.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={g.headerTitle}>ENTRENAMIENTO</Text>
      </View>

      {loading ? (
        <View style={g.centered}><ActivityIndicator color={C.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={g.scroll} showsVerticalScrollIndicator={false}>

          {/* Stats rápidas */}
          <View style={s.quickStats}>
            <View style={s.quickStatItem}>
              <Text style={s.quickStatNum}>{completedCount}/{total}</Text>
              <Text style={g.statLabel}>MISIONES HOY</Text>
            </View>
            <View style={[s.quickStatItem, { borderLeftWidth:1, borderLeftColor:C.border }]}>
              <Text style={[s.quickStatNum, { color: remaining === 0 ? C.success : C.accent }]}>
                {remaining === 0 ? "✓ LISTO" : remaining}
              </Text>
              <Text style={g.statLabel}>{remaining === 0 ? "COMPLETADO" : "RESTANTES"}</Text>
            </View>
          </View>

          {/* Misiones */}
          <Text style={[g.sectionLabel, { marginTop: S.lg }]}>MISIONES DEL DÍA</Text>
          {["easy","medium","hard"].map(diff => missions[diff] && missions[diff].exercise ? (
            <MissionCard key={diff} difficulty={diff} mission={missions[diff]} onStart={startMission} />
          ) : null)}

          {/* Modo Libre */}
          <Text style={g.sectionLabel}>MODO LIBRE</Text>
          {Object.entries(EXERCISES).map(([key, ex]) => (
            <View key={key} style={[g.card, s.freeCard]}>
              <Text style={s.freeEmoji}>{ex.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={g.cardTitle}>{ex.label}</Text>
                <Text style={g.cardSubtitle}>+{STAT_LABELS[ex.stat] ?? ex.stat} · +{STAT_LABELS[ex.secondaryStat] ?? ex.secondaryStat}</Text>
              </View>
              <View style={s.freeDurations}>
                {FREE_TRAIN_DURATIONS.map(min => (
                  <TouchableOpacity key={min} style={s.freeDurationBtn} onPress={() => startFree(key, min)}>
                    <Text style={s.freeDurationText}>{min}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Pomodoro */}
          <Text style={g.sectionLabel}>🧠 POMODORO</Text>
          <Text style={[g.cardSubtitle, { marginBottom: S.md }]}>
            {playerClass === "mage" || playerClass === "scientist"
              ? "Tu clase gana +2 Inteligencia por sesión completada"
              : "Completa una sesión para ganar +1 Inteligencia"}
          </Text>

          {!pomodoroActive ? (
            <View style={g.card}>
              <View style={[g.cardBody, { gap: S.md }]}>
                <View style={s.pomodoroDurations}>
                  {[25, 45, 60].map(min => (
                    <TouchableOpacity
                      key={min}
                      style={[s.pomodoroDurationBtn, pomodoroDuration === min && { backgroundColor:"#a07de0", borderColor:"#a07de0" }]}
                      onPress={() => { setPomodoroDuration(min); setPomodoroTimeLeft(min * 60); }}
                    >
                      <Text style={[s.pomodoroDurationText, pomodoroDuration === min && { color:C.bg }]}>{min} min</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[g.btnPrimary, { backgroundColor:"#a07de0" }]} onPress={() => { setPomodoroActive(true); startPomodoro(); }}>
                  <Text style={g.btnPrimaryText}>▶  INICIAR SESIÓN</Text>
                </TouchableOpacity>
                {pomodoroCompleted > 0 && (
                  <View style={[g.card, { marginBottom:0, borderColor: "#a07de0" + "44", backgroundColor: "#a07de0" + "11" }]}>
                    <Text style={[g.cardSubtitle, { color:"#a07de0", textAlign:"center", paddingVertical: S.sm }]}>
                      🧠 {pomodoroCompleted} sesión{pomodoroCompleted > 1 ? "es" : ""} completada{pomodoroCompleted > 1 ? "s" : ""} hoy
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={g.card}>
              <View style={[g.cardBody, { alignItems:"center", gap: S.lg }]}>
                <View style={[s.pomodoroCircle, { borderColor: pomodoroRunning ? "#a07de0" : C.border }]}>
                  <Text style={[s.pomodoroTime, { color: pomodoroRunning ? "#a07de0" : C.textDim }]}>
                    {formatTime(pomodoroTimeLeft)}
                  </Text>
                  <Text style={g.statLabel}>
                    {pomodoroTimeLeft === 0 ? "¡COMPLETADO!" : pomodoroRunning ? "CONCENTRADO" : "PAUSADO"}
                  </Text>
                </View>
                <View style={[s.pomodoroTrack, { width:"100%" }]}>
                  <View style={[s.pomodoroFill, {
                    width: `${((pomodoroDuration * 60 - pomodoroTimeLeft) / (pomodoroDuration * 60)) * 100}%`,
                  }]} />
                </View>
                <Animated.View style={[s.pomodoroReward, { opacity: pomodoroAnim }]}>
                  <Text style={s.pomodoroRewardText}>+{pomodoroIntGained} Inteligencia ganada ✨</Text>
                </Animated.View>
                <View style={[g.row, { gap: S.sm, width:"100%" }]}>
                  <TouchableOpacity style={[g.btnOutline, { flex:1 }]} onPress={cancelPomodoro}>
                    <Text style={g.btnOutlineText}>CANCELAR</Text>
                  </TouchableOpacity>
                  {pomodoroTimeLeft > 0 ? (
                    <TouchableOpacity
                      style={[g.btnPrimary, { flex:2, backgroundColor: pomodoroRunning ? C.surface2 : "#a07de0" }]}
                      onPress={pausePomodoro}
                    >
                      <Text style={[g.btnPrimaryText, { color: pomodoroRunning ? "#a07de0" : C.bg }]}>
                        {pomodoroRunning ? "⏸  PAUSAR" : "▶  CONTINUAR"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[g.btnPrimary, { flex:2, backgroundColor:"#a07de0" }]}
                      onPress={() => { setPomodoroActive(false); setPomodoroTimeLeft(pomodoroDuration * 60); }}
                    >
                      <Text style={g.btnPrimaryText}>✓ LISTO</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      <TutorialOverlay sectionKey="training" />
    </View>
  );
}

const s = StyleSheet.create({
  // Header compact
  headerCompact: { paddingTop: 52, paddingHorizontal: S.lg, paddingBottom: S.xs },

  // Mission card internals
  missionHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom: S.xs },
  missionLeft:   { flexDirection:"row", alignItems:"center", gap: S.sm },
  missionRight:  { alignItems:"flex-end", gap: 2 },
  dot:           { width:12, height:12, borderRadius:6 },
  diffLabel:     { fontSize: T.xs, fontWeight: T.black, letterSpacing: T.tight, marginBottom: 2 },
  exerciseName:  { color: C.text, fontSize: T.lg, fontWeight: T.black, marginTop: 2 },
  xpText:        { fontSize: T.md, fontWeight: T.black },
  timeText:      { color: C.textDim, fontSize: T.xs },
  missionMeta:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom: S.xs },
  repsText:      { fontSize: T.xl, fontWeight: T.black },
  progressBar:   { height:4, backgroundColor: C.surface2, borderRadius: R.full, overflow:"hidden" },
  progressFill:  { height:"100%", borderRadius: R.full },

  // Quick stats
  quickStats:    { flexDirection:"row", backgroundColor: C.surface, borderRadius: R.lg, borderWidth:1, borderColor: C.border, marginBottom: S.lg, overflow:"hidden" },
  quickStatItem: { flex:1, paddingVertical: S.md, paddingHorizontal: S.sm, alignItems:"center", gap: S.xs },
  quickStatNum:  { color: C.text, fontSize: T.xl, fontWeight: T.black },

  // Free train
  freeCard:        { flexDirection:"row", alignItems:"center", gap: S.md, padding: S.lg },
  freeEmoji:       { fontSize: 28 },
  freeDurations:   { flexDirection:"row", gap: S.xs },
  freeDurationBtn: { backgroundColor: C.surface2, borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth:1, borderColor: C.border },
  freeDurationText:{ color: C.textDim, fontSize: T.xs, fontWeight: T.bold },

  // Pomodoro
  pomodoroDurations:   { flexDirection:"row", gap: S.sm, width:"100%" },
  pomodoroDurationBtn: { flex:1, borderWidth:1, borderColor: C.border, borderRadius: R.md, paddingVertical: S.sm, alignItems:"center", backgroundColor: C.surface2 },
  pomodoroDurationText:{ color: C.textDim, fontSize: T.md, fontWeight: T.bold },
  pomodoroCircle:      { width:160, height:160, borderRadius:80, borderWidth:3, justifyContent:"center", alignItems:"center", gap: S.xs },
  pomodoroTime:        { fontSize: T.hero - 12, fontWeight: T.black, letterSpacing: 2 },
  pomodoroTrack:       { height:6, backgroundColor: C.surface2, borderRadius: R.full, overflow:"hidden" },
  pomodoroFill:        { height:"100%", borderRadius: R.full, backgroundColor:"#a07de0" },
  pomodoroReward:      { backgroundColor:"#a07de022", borderWidth:1, borderColor:"#a07de066", borderRadius: R.md, paddingHorizontal: S.lg, paddingVertical: S.sm },
  pomodoroRewardText:  { color:"#a07de0", fontSize: T.md, fontWeight: T.black },
});