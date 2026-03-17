import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Animated, ActivityIndicator, Alert, AppState,
} from "react-native";
import { auth } from "../firebase/config";
import { getTodayMissions, listenToTodayMissions, completeMission, completeFreeTrain } from "../firebase/firestore";
import { EXERCISES, MISSION_XP, MISSION_TIME, FREE_TRAIN_DURATIONS } from "../systems/missionSystem";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:           "#0a0a0f",
  surface:      "#12121a",
  surface2:     "#1a1a28",
  border:       "#2a2a3d",
  borderGlow:   "#4a3f8a",
  accent:       "#e8c84a",
  text:         "#e8e0f0",
  textDim:      "#6a6080",
  success:      "#55c080",
  warning:      "#e8a84a",
  danger:       "#e05555",
  easy:         "#55c080",
  medium:       "#e8c84a",
  hard:         "#e05555",
};

const DIFFICULTY_CONFIG = {
  easy:   { label: "FÁCIL",   color: C.easy,   emoji: "🟢", xp: MISSION_XP.easy,   time: MISSION_TIME.easy   },
  medium: { label: "MEDIO",   color: C.medium,  emoji: "🟡", xp: MISSION_XP.medium, time: MISSION_TIME.medium },
  hard:   { label: "DIFÍCIL", color: C.hard,    emoji: "🔴", xp: MISSION_XP.hard,   time: MISSION_TIME.hard   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useTimer(initialSeconds, onFinish) {
  const [timeLeft, setTimeLeft]   = useState(initialSeconds);
  const [running, setRunning]     = useState(false);
  const intervalRef               = useRef(null);
  const timeLeftRef               = useRef(initialSeconds);

  function start() {
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    clearInterval(intervalRef.current);
  }

  function reset(newSeconds) {
    stop();
    timeLeftRef.current = newSeconds ?? initialSeconds;
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

  const progress = timeLeft / initialSeconds;
  return { timeLeft, running, start, stop, reset, progress };
}

// ─── Mission Timer Modal ──────────────────────────────────────────────────────
function MissionTimerModal({ visible, mission, difficulty, onFinish, onClose }) {
  const [reps, setReps]         = useState("");
  const [started, setStarted]   = useState(false);
  const [finished, setFinished] = useState(false);
  const [expired, setExpired]   = useState(false);

  const config    = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;
  const totalTime = config?.time ?? 120;
  const exercise  = mission ? EXERCISES[mission.exercise] : null;

  const timer = useTimer(totalTime, () => {
    setExpired(true);
    setFinished(true);
  });

  // Reset al abrir
  useEffect(() => {
    if (visible) {
      setReps("");
      setStarted(false);
      setFinished(false);
      setExpired(false);
      timer.reset(totalTime);
    }
  }, [visible]);

  if (!mission || !config || !exercise) return null;

  const entered   = parseInt(reps) || 0;
  const meetsGoal = entered >= mission.reps;

  // Color del timer según tiempo restante
  const timerColor = timer.progress > 0.5
    ? C.success
    : timer.progress > 0.25
      ? C.warning
      : C.danger;

  async function handleFinish() {
    if (entered === 0) {
      Alert.alert("Error", "Ingresa las reps que completaste.");
      return;
    }
    timer.stop();
    await onFinish(entered, meetsGoal && !expired);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.timerCard}>

          {/* Header */}
          <View style={styles.timerHeader}>
            <Text style={[styles.timerDifficulty, { color: config.color }]}>
              {config.emoji} {config.label}
            </Text>
            <Text style={styles.timerExercise}>
              {exercise.emoji} {exercise.label}
            </Text>
            <Text style={styles.timerGoal}>
              Meta: <Text style={{ color: config.color, fontWeight: "900" }}>{mission.reps} reps</Text>
            </Text>
          </View>

          {/* Timer circle */}
          <View style={styles.timerCircleContainer}>
            <View style={[styles.timerCircle, { borderColor: timerColor }]}>
              <Text style={[styles.timerDisplay, { color: timerColor }]}>
                {formatTime(timer.timeLeft)}
              </Text>
              <Text style={styles.timerLabel}>
                {expired ? "TIEMPO AGOTADO" : timer.running ? "EN CURSO" : started ? "PAUSADO" : "LISTO"}
              </Text>
            </View>
          </View>

          {/* Timer bar */}
          <View style={styles.timerBar}>
            <View
              style={[styles.timerBarFill, {
                backgroundColor: timerColor,
                width: `${timer.progress * 100}%`,
              }]}
            />
          </View>

          {/* Controls */}
          {!finished && (
            <View style={styles.timerControls}>
              {!started ? (
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: C.success }]}
                  onPress={() => { setStarted(true); timer.start(); }}
                >
                  <Text style={styles.timerBtnText}>▶  INICIAR</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: C.warning }]}
                  onPress={() => timer.running ? timer.stop() : timer.start()}
                >
                  <Text style={styles.timerBtnText}>
                    {timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Rep input — solo cuando ha iniciado o expiró */}
          {(started || expired) && (
            <View style={styles.repInputSection}>
              <Text style={styles.repInputLabel}>¿CUÁNTAS REPS COMPLETASTE?</Text>
              <TextInput
                style={styles.repInput}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={C.textDim}
                maxLength={4}
              />
              {entered > 0 && (
                <Text style={[
                  styles.repFeedback,
                  { color: meetsGoal && !expired ? C.success : C.warning }
                ]}>
                  {expired
                    ? `Tiempo agotado — ${entered >= mission.reps ? "¡Meta alcanzada! Stats garantizados" : "Stats por reps realizados"}`
                    : meetsGoal
                      ? `✓ Meta alcanzada — +${config.xp} XP + stats`
                      : `⚠ Bajo la meta — solo stats`
                  }
                </Text>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.timerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>ABANDONAR</Text>
            </TouchableOpacity>
            {(started || expired) && (
              <TouchableOpacity
                style={[styles.confirmBtn, entered === 0 && styles.confirmBtnDisabled]}
                onPress={handleFinish}
                disabled={entered === 0}
              >
                <Text style={styles.confirmBtnText}>TERMINAR</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Free Train Modal ─────────────────────────────────────────────────────────
function FreeTrainModal({ visible, onClose }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [phase, setPhase]     = useState("setup");  // setup | training | done
  const [reps, setReps]       = useState("");
  const [loading, setLoading] = useState(false);

  const durationSeconds = (selectedDuration ?? 0) * 60;
  const timer = useTimer(durationSeconds, () => setPhase("done"));

  useEffect(() => {
    if (visible) {
      setSelectedExercise(null);
      setSelectedDuration(null);
      setPhase("setup");
      setReps("");
    }
  }, [visible]);

  function handleStart() {
    if (!selectedExercise || !selectedDuration) return;
    timer.reset(selectedDuration * 60);
    setPhase("training");
    timer.start();
  }

  async function handleFinish() {
    const entered = parseInt(reps) || 0;
    if (entered === 0) {
      Alert.alert("Error", "Ingresa las reps que completaste.");
      return;
    }
    setLoading(true);
    const uid = auth.currentUser?.uid;
    await completeFreeTrain(uid, selectedExercise, entered);
    setLoading(false);
    setPhase("done");
    timer.stop();

    const ex      = EXERCISES[selectedExercise];
    const statKey = ex.stat;
    Alert.alert(
      "¡Sesión completada! 💪",
      `${entered} reps de ${ex.label}\n+${ex.stat} y +${ex.secondaryStat} ganados`,
      [{ text: "¡Genial!", onPress: onClose }]
    );
  }

  const timerColor = timer.progress > 0.5
    ? C.success
    : timer.progress > 0.25
      ? C.warning
      : C.danger;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.timerCard}>

          {/* ── SETUP ── */}
          {phase === "setup" && (
            <>
              <Text style={styles.freeTrainTitle}>🏋️ MODO LIBRE</Text>
              <Text style={styles.freeTrainSubtitle}>Solo stats · Sin XP · Sin límite de meta</Text>

              <Text style={styles.sectionLabel}>EJERCICIO</Text>
              <View style={styles.exerciseGrid}>
                {Object.entries(EXERCISES).map(([key, ex]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.exerciseChip, selectedExercise === key && styles.exerciseChipActive]}
                    onPress={() => setSelectedExercise(key)}
                  >
                    <Text style={styles.exerciseChipEmoji}>{ex.emoji}</Text>
                    <Text style={[styles.exerciseChipLabel, selectedExercise === key && { color: C.accent }]}>
                      {ex.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>DURACIÓN</Text>
              <View style={styles.durationGrid}>
                {FREE_TRAIN_DURATIONS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.durationChip, selectedDuration === min && styles.durationChipActive]}
                    onPress={() => setSelectedDuration(min)}
                  >
                    <Text style={[styles.durationChipText, selectedDuration === min && { color: C.accent }]}>
                      {min} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.timerActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, (!selectedExercise || !selectedDuration) && styles.confirmBtnDisabled]}
                  onPress={handleStart}
                  disabled={!selectedExercise || !selectedDuration}
                >
                  <Text style={styles.confirmBtnText}>▶ INICIAR</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── TRAINING ── */}
          {phase === "training" && (
            <>
              <Text style={styles.freeTrainTitle}>
                {EXERCISES[selectedExercise]?.emoji} {EXERCISES[selectedExercise]?.label}
              </Text>
              <Text style={styles.freeTrainSubtitle}>{selectedDuration} minutos · Solo stats</Text>

              <View style={styles.timerCircleContainer}>
                <View style={[styles.timerCircle, { borderColor: timerColor }]}>
                  <Text style={[styles.timerDisplay, { color: timerColor }]}>
                    {formatTime(timer.timeLeft)}
                  </Text>
                  <Text style={styles.timerLabel}>{timer.running ? "EN CURSO" : "PAUSADO"}</Text>
                </View>
              </View>

              <View style={styles.timerBar}>
                <View style={[styles.timerBarFill, { backgroundColor: timerColor, width: `${timer.progress * 100}%` }]} />
              </View>

              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: C.warning }]}
                  onPress={() => timer.running ? timer.stop() : timer.start()}
                >
                  <Text style={styles.timerBtnText}>
                    {timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.repInputSection}>
                <Text style={styles.repInputLabel}>REPS ACUMULADAS (OPCIONAL)</Text>
                <TextInput
                  style={styles.repInput}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={C.textDim}
                  maxLength={4}
                />
              </View>

              <View style={styles.timerActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>SALIR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
                  onPress={handleFinish}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color={C.bg} size="small" />
                    : <Text style={styles.confirmBtnText}>TERMINAR</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({ difficulty, mission, onStart }) {
  const config   = DIFFICULTY_CONFIG[difficulty];
  const exercise = EXERCISES[mission.exercise];
  const animProg = useRef(new Animated.Value(mission.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animProg, {
      toValue: mission.completed ? 1 : 0,
      duration: 600, useNativeDriver: false,
    }).start();
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
        <Animated.View style={[
          styles.progressFill,
          { backgroundColor: config.color, width: animProg.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }) },
        ]} />
      </View>

      {mission.completed ? (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ COMPLETADA</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.missionBtn, { borderColor: config.color }]}
          onPress={() => onStart(difficulty, mission)}
          activeOpacity={0.8}
        >
          <Text style={[styles.missionBtnText, { color: config.color }]}>
            ▶  INICIAR MISIÓN
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Training Screen ──────────────────────────────────────────────────────────
export default function TrainingScreen({ navigation }) {
  const [missions, setMissions]                 = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [missionModal, setMissionModal]         = useState(false);
  const [freeModal, setFreeModal]               = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState(null);
  const [activeMission, setActiveMission]       = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    async function init() {
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");
      const userSnap = await getDoc(doc(db, "users", uid));
      const level = userSnap.exists() ? userSnap.data().level : 1;
      await getTodayMissions(uid, level);
      setLoading(false);
    }

    init();

    const unsub = listenToTodayMissions(uid, (data) => setMissions(data));
    return unsub;
  }, [uid]);

  function openMission(difficulty, mission) {
    setActiveDifficulty(difficulty);
    setActiveMission(mission);
    setMissionModal(true);
  }

  async function handleMissionFinish(reps, meetsGoal) {
    setMissionModal(false);
    await completeMission(uid, activeDifficulty, activeMission.exercise, reps, meetsGoal);

    if (meetsGoal) {
      Alert.alert(
        "¡Misión completada! 🎉",
        `+${DIFFICULTY_CONFIG[activeDifficulty].xp} XP ganados`,
        [{ text: "¡Genial!" }]
      );
    } else {
      Alert.alert(
        "Misión terminada",
        `Obtuviste stats por ${reps} reps.\nCompleta la meta para ganar XP.`,
        [{ text: "OK" }]
      );
    }
  }

  const completedCount = missions
    ? ["easy","medium","hard"].filter(d => missions[d]?.completed).length
    : 0;
  const allCompleted = completedCount === 3;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLVER</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ENTRENAMIENTO</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* ── Banner ── */}
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

        {/* ── Misiones ── */}
        {loading || !missions ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.accent} />
            <Text style={styles.loadingText}>Generando misiones...</Text>
          </View>
        ) : (
          <View style={styles.missionsContainer}>
            <Text style={styles.sectionLabel}>MISIONES DEL DÍA</Text>
            {["easy","medium","hard"].map((diff) => (
              missions[diff] && (
                <MissionCard
                  key={diff}
                  difficulty={diff}
                  mission={missions[diff]}
                  onStart={openMission}
                />
              )
            ))}
          </View>
        )}

        {/* ── All complete ── */}
        {allCompleted && (
          <View style={styles.allDoneCard}>
            <Text style={styles.allDoneEmoji}>🏆</Text>
            <Text style={styles.allDoneTitle}>¡TODO COMPLETADO!</Text>
            <Text style={styles.allDoneSubtitle}>Regresa mañana para nuevas misiones</Text>
          </View>
        )}

        {/* ── Modo Libre ── */}
        <View style={styles.freeSection}>
          <Text style={styles.sectionLabel}>MODO LIBRE</Text>
          <TouchableOpacity
            style={styles.freeBtn}
            onPress={() => setFreeModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.freeBtnEmoji}>🏋️</Text>
            <View style={styles.freeBtnInfo}>
              <Text style={styles.freeBtnTitle}>ENTRENAMIENTO LIBRE</Text>
              <Text style={styles.freeBtnSub}>Elige ejercicio · 5–20 min · Solo stats</Text>
            </View>
            <Text style={styles.freeBtnArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Mission Timer Modal ── */}
      <MissionTimerModal
        visible={missionModal}
        mission={activeMission}
        difficulty={activeDifficulty}
        onFinish={handleMissionFinish}
        onClose={() => setMissionModal(false)}
      />

      {/* ── Free Train Modal ── */}
      <FreeTrainModal
        visible={freeModal}
        onClose={() => setFreeModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 32 },

  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
  backBtn: { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText: { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:4 },

  banner: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, flexDirection:"row", marginBottom:24 },
  bannerItem: { flex:1, paddingVertical:14, alignItems:"center", gap:4 },
  bannerDivider: { width:1, backgroundColor:C.border },
  bannerValue: { color:C.text, fontSize:18, fontWeight:"900" },
  bannerLabel: { color:C.textDim, fontSize:9, letterSpacing:2, fontWeight:"700" },

  sectionLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:10 },
  missionsContainer: { gap:12, marginBottom:24 },

  missionCard: { backgroundColor:C.surface, borderWidth:1, borderRadius:4, padding:16, gap:12 },
  missionHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  missionHeaderLeft: { flexDirection:"row", alignItems:"center", gap:10 },
  missionEmoji: { fontSize:20 },
  missionDifficulty: { fontSize:10, fontWeight:"900", letterSpacing:2 },
  missionExercise: { color:C.text, fontSize:15, fontWeight:"700", marginTop:2 },
  missionMeta: { alignItems:"flex-end", gap:4 },
  missionXPText: { color:C.accent, fontSize:14, fontWeight:"900" },
  missionTimeText: { color:C.textDim, fontSize:11 },
  missionRepsRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  missionRepsLabel: { color:C.textDim, fontSize:10, letterSpacing:2, fontWeight:"700" },
  missionRepsValue: { fontSize:16, fontWeight:"900" },
  progressTrack: { height:6, backgroundColor:C.surface2, borderRadius:2, overflow:"hidden" },
  progressFill: { height:"100%", borderRadius:2 },
  missionBtn: { borderWidth:1, borderRadius:4, paddingVertical:12, alignItems:"center" },
  missionBtnText: { fontSize:12, fontWeight:"900", letterSpacing:2 },
  completedBadge: { backgroundColor:C.success+"22", borderWidth:1, borderColor:C.success+"44", borderRadius:4, paddingVertical:10, alignItems:"center" },
  completedText: { color:C.success, fontSize:12, fontWeight:"900", letterSpacing:2 },

  loadingBox: { alignItems:"center", paddingVertical:60, gap:12 },
  loadingText: { color:C.textDim, fontSize:12, letterSpacing:2 },

  allDoneCard: { backgroundColor:C.surface, borderWidth:1, borderColor:C.accent+"44", borderRadius:4, padding:24, alignItems:"center", gap:8, marginBottom:24 },
  allDoneEmoji: { fontSize:40 },
  allDoneTitle: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:3 },
  allDoneSubtitle: { color:C.textDim, fontSize:12 },

  // Free Train
  freeSection: { marginBottom:16 },
  freeBtn: { backgroundColor:C.surface, borderWidth:1, borderColor:C.borderGlow, borderRadius:4, padding:16, flexDirection:"row", alignItems:"center", gap:14 },
  freeBtnEmoji: { fontSize:32 },
  freeBtnInfo: { flex:1, gap:4 },
  freeBtnTitle: { color:C.accent, fontSize:13, fontWeight:"900", letterSpacing:2 },
  freeBtnSub: { color:C.textDim, fontSize:11 },
  freeBtnArrow: { color:C.textDim, fontSize:16 },

  // Modal base
  modalOverlay: { flex:1, backgroundColor:"#000000cc", justifyContent:"flex-end" },
  timerCard: { backgroundColor:C.surface, borderTopWidth:1, borderTopColor:C.borderGlow, borderTopLeftRadius:12, borderTopRightRadius:12, padding:24, gap:14 },

  // Timer
  freeTrainTitle: { color:C.accent, fontSize:18, fontWeight:"900", letterSpacing:3, textAlign:"center" },
  freeTrainSubtitle: { color:C.textDim, fontSize:12, textAlign:"center" },
  timerHeader: { alignItems:"center", gap:4 },
  timerDifficulty: { fontSize:11, fontWeight:"900", letterSpacing:3 },
  timerExercise: { color:C.text, fontSize:18, fontWeight:"900" },
  timerGoal: { color:C.textDim, fontSize:13 },
  timerCircleContainer: { alignItems:"center", paddingVertical:8 },
  timerCircle: { width:140, height:140, borderRadius:70, borderWidth:4, justifyContent:"center", alignItems:"center", gap:4 },
  timerDisplay: { fontSize:36, fontWeight:"900", letterSpacing:2 },
  timerLabel: { fontSize:9, letterSpacing:3, color:C.textDim, fontWeight:"700" },
  timerBar: { height:6, backgroundColor:C.surface2, borderRadius:3, overflow:"hidden" },
  timerBarFill: { height:"100%", borderRadius:3 },
  timerControls: { alignItems:"center" },
  timerBtn: { paddingHorizontal:40, paddingVertical:14, borderRadius:4, alignItems:"center" },
  timerBtnText: { color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  // Rep input
  repInputSection: { gap:8 },
  repInputLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:2 },
  repInput: { backgroundColor:C.bg, borderWidth:1, borderColor:C.border, borderRadius:4, paddingHorizontal:16, paddingVertical:12, color:C.accent, fontSize:32, fontWeight:"900", textAlign:"center" },
  repFeedback: { fontSize:12, textAlign:"center", fontWeight:"700" },

  // Action buttons
  timerActions: { flexDirection:"row", gap:10 },
  cancelBtn: { flex:1, borderWidth:1, borderColor:C.border, borderRadius:4, paddingVertical:14, alignItems:"center" },
  cancelBtnText: { color:C.textDim, fontSize:12, fontWeight:"700", letterSpacing:1 },
  confirmBtn: { flex:1, backgroundColor:C.accent, borderRadius:4, paddingVertical:14, alignItems:"center" },
  confirmBtnDisabled: { opacity:0.4 },
  confirmBtnText: { color:C.bg, fontSize:12, fontWeight:"900", letterSpacing:1 },

  // Free train setup
  exerciseGrid: { flexDirection:"row", gap:8 },
  exerciseChip: { flex:1, backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:4, padding:12, alignItems:"center", gap:6 },
  exerciseChipActive: { borderColor:C.accent },
  exerciseChipEmoji: { fontSize:24 },
  exerciseChipLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:1, textAlign:"center" },
  durationGrid: { flexDirection:"row", gap:8 },
  durationChip: { flex:1, backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:4, paddingVertical:12, alignItems:"center" },
  durationChipActive: { borderColor:C.accent },
  durationChipText: { color:C.textDim, fontSize:13, fontWeight:"700" },
});