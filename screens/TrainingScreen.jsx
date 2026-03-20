import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import { getTodayMissions, listenToTodayMissions } from "../firebase/firestore";
import { EXERCISES, MISSION_XP, FREE_TRAIN_DURATIONS } from "../systems/missionSystem";
import { DIFFICULTY_CONFIG_MAP } from "../constants/combatConfig";
import { TutorialOverlay } from "../components/TutorialOverlay";

const C = {
  bg:"#0a0a0f", surface:"#12121a", surface2:"#1a1a28",
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
  const [playerClass, setPlayerClass] = useState(null);

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
      await getTodayMissions(uid, level, cls, focus);
      setLoading(false);
    }
    init();
    const unsub = listenToTodayMissions(uid, (data) => setMissions(data));
    return unsub;
  }, [uid]);

  function startMission(difficulty, mission) {
    navigation.navigate("Combat", { mode: "mission", difficulty, mission, playerClass });
  }

  function startFree(exercise, durationMinutes) {
    navigation.navigate("Combat", { mode: "free", exercise, durationMinutes, playerClass });
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