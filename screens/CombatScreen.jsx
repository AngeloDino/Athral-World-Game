import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator, SafeAreaView, ScrollView,
} from "react-native";
import { auth } from "../firebase/config";
import { completeMission, defeatMonster, completeFreeTrain, defeatTowerFloor, failTowerSession, defeatBoss } from "../firebase/firestore";
import { EXERCISES } from "../systems/missionSystem";
import { DIFFICULTY_CONFIG_MAP } from "../constants/combatConfig";
import { applyClassAbilitySetup, getAbilityInfo } from "../systems/classAbilities";
import ResultModal from "../components/ResultModal";

const C = {
  bg:"#0a0a0f", surface:"#12121a", surface2:"#1a1a28",
  border:"#2a2a3d", accent:"#e8c84a", text:"#e8e0f0",
  textDim:"#6a6080", success:"#55c080", warning:"#e8a84a", danger:"#e05555",
  boss:"#bf4abf",
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

  return {
    timeLeft, running, start, stop, reset,
    progress: initialSeconds > 0 ? timeLeft / initialSeconds : 0,
  };
}

function formatTime(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ─── Phase Combat (Boss) ──────────────────────────────────────────────────────
function PhaseCombat({ phases, playerClass, onAllPhasesComplete, onFail }) {
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [reps, setReps]           = useState(0);
  const [started, setStarted]     = useState(false);
  const [expired, setExpired]     = useState(false);

  const phase    = phases[phaseIdx];
  const exercise = EXERCISES[phase.exercise];

  // Apply class ability to this phase
  const { reps: adjReps, timer: adjTimer } = applyClassAbilitySetup(
    playerClass, phase.exercise, phase.reps, phase.timer
  );

  const timer = useTimer(adjTimer, () => setExpired(true));

  // Reset when phase changes
  useEffect(() => {
    setReps(0);
    setStarted(false);
    setExpired(false);
    timer.reset(adjTimer);
  }, [phaseIdx]);

  const meetsGoal  = reps >= adjReps;
  const timerColor = timer.progress > 0.5 ? C.success : timer.progress > 0.25 ? C.warning : C.danger;
  const isLastPhase = phaseIdx === phases.length - 1;

  function handlePhaseFinish() {
    if (reps === 0) return;
    if (!meetsGoal) { onFail(); return; }
    timer.stop();
    if (isLastPhase) {
      onAllPhasesComplete();
    } else {
      setPhaseIdx(i => i + 1);
    }
  }

  function handleExpiredFinish() {
    onFail();
  }

  return (
    <View style={styles.phaseContainer}>
      {/* Phase indicators */}
      <View style={styles.phaseIndicators}>
        {phases.map((p, i) => (
          <View key={i} style={[
            styles.phaseDot,
            i === phaseIdx && styles.phaseDotActive,
            i < phaseIdx  && styles.phaseDotDone,
          ]}>
            <Text style={styles.phaseDotText}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.phaseLabel, { color: C.boss }]}>{phase.label}</Text>
      <Text style={styles.phaseExercise}>{exercise.emoji} {exercise.label}</Text>
      <Text style={styles.phaseGoal}>
        Meta: <Text style={{ color: C.boss, fontWeight:"900" }}>{adjReps} reps</Text>
      </Text>

      {/* Timer */}
      <View style={[styles.timerCircle, { borderColor: started ? timerColor : C.border }]}>
        <Text style={[styles.timerTime, { color: started ? timerColor : C.textDim }]}>
          {formatTime(timer.timeLeft)}
        </Text>
        <Text style={styles.timerStatus}>
          {expired ? "TIEMPO AGOTADO" : timer.running ? "EN COMBATE" : started ? "PAUSADO" : "LISTO"}
        </Text>
      </View>

      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, {
          backgroundColor: started ? timerColor : C.border,
          width: `${timer.progress * 100}%`,
        }]} />
      </View>

      {/* Timer control */}
      {!expired && (
        <TouchableOpacity
          style={[styles.timerBtn, { backgroundColor: started ? C.warning : C.boss }]}
          onPress={() => {
            if (!started) { setStarted(true); timer.start(); }
            else timer.running ? timer.stop() : timer.start();
          }}
        >
          <Text style={styles.timerBtnText}>
            {!started ? "▶  INICIAR FASE" : timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Rep Counter */}
      <View style={styles.repSection}>
        <Text style={styles.repLabel}>REPS COMPLETADAS</Text>
        <View style={styles.repRow}>
          <TouchableOpacity
            style={[styles.repMinus, !started && styles.repBtnDisabled]}
            onPress={() => started && setReps(r => Math.max(0, r - 1))}
            disabled={!started}
          >
            <Text style={styles.repMinusText}>−</Text>
          </TouchableOpacity>
          <View style={styles.repDisplayContainer}>
            <Text style={[styles.repDisplay, meetsGoal && { color: C.success }]}>{reps}</Text>
            <Text style={styles.repGoal}>/ {adjReps}</Text>
          </View>
          <TouchableOpacity
            style={[styles.repPlus, !started && styles.repBtnDisabled]}
            onPress={() => started && setReps(r => r + 1)}
            disabled={!started}
          >
            <Text style={styles.repPlusText}>+</Text>
          </TouchableOpacity>
        </View>
        {reps > 0 && (
          <Text style={[styles.repFeedback, { color: meetsGoal ? C.success : C.warning }]}>
            {meetsGoal
              ? isLastPhase ? "✓ ¡Última fase! Termina el combate" : `✓ Fase completada — siguiente: Fase ${phaseIdx + 2}`
              : `${adjReps - reps} reps para completar esta fase`}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.abandonBtn} onPress={onFail}>
          <Text style={styles.abandonBtnText}>HUIR</Text>
        </TouchableOpacity>
        {expired ? (
          <TouchableOpacity style={[styles.finishBtn, { backgroundColor: C.danger }]} onPress={handleExpiredFinish}>
            <Text style={styles.finishBtnText}>TIEMPO AGOTADO</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.finishBtn, reps === 0 && styles.finishBtnDisabled]}
            onPress={handlePhaseFinish}
            disabled={reps === 0}
          >
            <Text style={styles.finishBtnText}>
              {isLastPhase ? "TERMINAR JEFE" : `SIGUIENTE FASE →`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── CombatScreen ─────────────────────────────────────────────────────────────
export default function CombatScreen({ route, navigation }) {
  const { mode, difficulty, mission, monster, exercise, durationMinutes, towerRecord, playerClass } = route.params ?? {};
  const uid = auth.currentUser?.uid;

  const isBoss = monster?.isBoss || (mode === "boss");

  const rawConfig  = buildConfig(mode, { difficulty, mission, monster, exercise, durationMinutes });
  const { reps: adjustedReps, timer: adjustedTimer } = applyClassAbilitySetup(
    playerClass, rawConfig.exercise, rawConfig.reps, rawConfig.timer
  );
  const config = {
    ...rawConfig,
    reps:  rawConfig.hasGoal ? adjustedReps : rawConfig.reps,
    timer: adjustedTimer,
  };

  const abilityInfo = getAbilityInfo(playerClass);

  const [reps, setReps]         = useState(0);
  const [started, setStarted]   = useState(false);
  const [expired, setExpired]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const timer = useTimer(config.timer, () => setExpired(true));
  const meetsGoal   = config.hasGoal ? reps >= config.reps : true;
  const timerColor  = timer.progress > 0.5 ? C.success : timer.progress > 0.25 ? C.warning : C.danger;

  async function handleFinish() {
    if (reps === 0) return;
    timer.stop();
    setLoading(true);
    try {
      if (mode === "mission") {
        const res = await completeMission(uid, difficulty, mission.exercise, reps, meetsGoal && !expired);
        setResult({
          type:    meetsGoal && !expired ? "mission" : "warning",
          title:   meetsGoal && !expired ? "¡Misión Completada!" : "Misión Terminada",
          message: meetsGoal && !expired
            ? `+${res?.xpGained ?? mission.xp} XP${res?.allDoneBonus ? `\n+${res.allDoneBonus} XP bonus por completar las 3 misiones` : ""}${res?.streakMult > 1 ? `\n🔥 Racha x${res.streakMult}` : ""}`
            : `Obtuviste stats por ${reps} reps.`,
        });
      } else if (mode === "monster") {
        if (meetsGoal) {
          const res = await defeatMonster(uid, monster);
          setResult({
            type:    "victory",
            title:   "¡Victoria!",
            message: `Derrotaste a ${monster.name}\n+${res?.xpGained ?? monster.xp} XP${res?.tierMult > 1 ? `\n⭐ Bonus de tier x${res.tierMult}` : ""}`,
          });
        } else {
          setResult({ type:"defeat", title:"Derrota", message:`No completaste los reps.\n${monster.name} sigue en pie.\nPuedes intentarlo de nuevo.` });
        }
      } else if (mode === "tower") {
        if (meetsGoal) {
          const res = await defeatTowerFloor(uid, monster);
          setResult({ type:"victory", title:`¡Piso ${monster.floor} Superado!`, message:`+${res?.xpGained ?? monster.xp} XP\nSiguiente: Piso ${monster.floor + 1}` });
        } else {
          await failTowerSession(uid);
          setResult({ type:"defeat", title:"Caíste en la Torre", message:`Llegaste al piso ${monster.floor}.\nRécord: Piso ${Math.max(towerRecord ?? 0, monster.floor - 1)}\nRegresa mañana.` });
        }
      } else if (mode === "free") {
        await completeFreeTrain(uid, exercise, reps);
        const ex = EXERCISES[exercise];
        setResult({ type:"mission", title:"¡Sesión Completada!", message:`${reps} reps de ${ex.label}\n+${ex.stat} y +${ex.secondaryStat} ganados` });
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleBossComplete() {
    setLoading(true);
    try {
      const res = await defeatBoss(uid, monster);
      setResult({
        type:"victory",
        title:"¡JEFE DERROTADO!",
        message:`Has derrotado a ${monster.name}\n+${res?.xpGained ?? monster.xp} XP\nRecompensas especiales obtenidas`,
      });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleBossFail() {
    if (mode === "tower") await failTowerSession(uid);
    setResult({ type:"defeat", title:"Derrota ante el Jefe", message:"No pudiste completar todas las fases.\nInténtalo de nuevo mañana." });
  }

  // Boss combat — render phase system
  if (isBoss && monster?.phases) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← HUIR</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.boss }]}>COMBATE DE JEFE</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={[styles.infoCard, { borderColor: C.boss + "66" }]}>
          <Text style={styles.infoEmoji}>{monster.emoji}</Text>
          <View style={styles.infoText}>
            <Text style={[styles.infoName, { color: C.boss }]}>{monster.name}</Text>
            <Text style={styles.infoDesc}>{monster.description}</Text>
            <Text style={[styles.bossBadge]}>👑 JEFE — +{monster.xp.toLocaleString()} XP</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <PhaseCombat
            phases={monster.phases}
            playerClass={playerClass}
            onAllPhasesComplete={handleBossComplete}
            onFail={handleBossFail}
          />
        </ScrollView>

        {result && (
          <ResultModal
            visible={!!result}
            type={result.type}
            title={result.title}
            message={result.message}
            onClose={() => navigation.goBack()}
          />
        )}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Normal combat
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← SALIR</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: config.color }]}>{config.title}</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={[styles.infoCard, { borderColor: config.color + "55" }]}>
        <Text style={styles.infoEmoji}>{config.emoji}</Text>
        <View style={styles.infoText}>
          <Text style={[styles.infoName, { color: config.color }]}>{config.name}</Text>
          <Text style={styles.infoDesc}>{config.description}</Text>
        </View>
      </View>

      {config.hasGoal && (
        <View style={styles.challengeRow}>
          <View style={styles.challengeItem}>
            <Text style={styles.challengeLabel}>EJERCICIO</Text>
            <Text style={styles.challengeValue}>{EXERCISES[config.exercise]?.emoji} {EXERCISES[config.exercise]?.label}</Text>
          </View>
          <View style={styles.challengeDivider} />
          <View style={styles.challengeItem}>
            <Text style={styles.challengeLabel}>META</Text>
            <Text style={[styles.challengeValue, { color: config.color }]}>{config.reps} reps</Text>
          </View>
          <View style={styles.challengeDivider} />
          <View style={styles.challengeItem}>
            <Text style={styles.challengeLabel}>XP</Text>
            <Text style={[styles.challengeValue, { color: C.accent }]}>+{config.xp}</Text>
          </View>
        </View>
      )}

      {abilityInfo && (
        <View style={styles.abilityBanner}>
          <Text style={styles.abilityEmoji}>{abilityInfo.emoji}</Text>
          <View style={styles.abilityInfo}>
            <Text style={styles.abilityName}>{abilityInfo.name} — {abilityInfo.shortDesc}</Text>
            <Text style={styles.abilityDesc}>{abilityInfo.description}</Text>
          </View>
        </View>
      )}

      <View style={styles.timerSection}>
        <View style={[styles.timerCircle, { borderColor: started ? timerColor : C.border }]}>
          <Text style={[styles.timerTime, { color: started ? timerColor : C.textDim }]}>{formatTime(timer.timeLeft)}</Text>
          <Text style={styles.timerStatus}>
            {expired ? "TIEMPO AGOTADO" : timer.running ? "EN CURSO" : started ? "PAUSADO" : "LISTO"}
          </Text>
        </View>
        <View style={styles.timerTrack}>
          <View style={[styles.timerFill, { backgroundColor: started ? timerColor : C.border, width:`${timer.progress * 100}%` }]} />
        </View>
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

      <View style={styles.repSection}>
        <Text style={styles.repLabel}>
          {started ? "REPS COMPLETADAS" : "INICIA EL TIMER PARA CONTAR REPS"}
        </Text>
        <View style={styles.repRow}>
          <TouchableOpacity
            style={[styles.repMinus, !started && styles.repBtnDisabled]}
            onPress={() => started && setReps(r => Math.max(0, r - 1))}
            disabled={!started}
          >
            <Text style={styles.repMinusText}>−</Text>
          </TouchableOpacity>
          <View style={styles.repDisplayContainer}>
            <Text style={[styles.repDisplay, config.hasGoal && reps >= config.reps && { color: C.success }]}>{reps}</Text>
            {config.hasGoal && <Text style={styles.repGoal}>/ {config.reps}</Text>}
          </View>
          <TouchableOpacity
            style={[styles.repPlus, !started && styles.repBtnDisabled]}
            onPress={() => started && setReps(r => r + 1)}
            disabled={!started}
          >
            <Text style={styles.repPlusText}>+</Text>
          </TouchableOpacity>
        </View>
        {config.hasGoal && reps > 0 && (
          <Text style={[styles.repFeedback, { color: meetsGoal ? C.success : C.warning }]}>
            {meetsGoal ? "✓ Meta alcanzada" : `${config.reps - reps} reps para la meta`}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.finishBtnLarge, (reps === 0 || loading) && styles.finishBtnDisabled]}
        onPress={handleFinish}
        disabled={reps === 0 || loading}
      >
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={styles.finishBtnText}>TERMINAR</Text>}
      </TouchableOpacity>

      {result && (
        <ResultModal
          visible={!!result}
          type={result.type}
          title={result.title}
          message={result.message}
          onClose={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}

function buildConfig(mode, { difficulty, mission, monster, exercise, durationMinutes }) {
  if (mode === "mission") {
    const ex   = EXERCISES[mission.exercise];
    const diff = DIFFICULTY_CONFIG_MAP[difficulty];
    return { title:diff.label, color:diff.color, emoji:ex.emoji, name:ex.label, description:`Misión ${diff.label}`, exercise:mission.exercise, reps:mission.reps, timer:diff.time, xp:mission.xp, hasGoal:true };
  }
  if (mode === "monster" || mode === "tower") {
    return { title:mode==="tower"?`PISO ${monster.floor}`:"COMBATE", color:mode==="tower"?"#8a4abf":"#e05555", emoji:monster.emoji, name:monster.name, description:monster.description, exercise:monster.exercise, reps:monster.reps, timer:monster.timer, xp:monster.xp, hasGoal:true };
  }
  if (mode === "free") {
    const ex = EXERCISES[exercise];
    return { title:"MODO LIBRE", color:"#a07de0", emoji:ex.emoji, name:ex.label, description:`${durationMinutes} minutos · Solo stats`, exercise, reps:0, timer:durationMinutes*60, xp:0, hasGoal:false };
  }
  return { title:"COMBATE", color:C.accent, emoji:"⚔️", name:"", description:"", exercise:"pushups", reps:0, timer:60, xp:0, hasGoal:false };
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  backBtn:{ paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText:{ color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle:{ fontSize:14, fontWeight:"900", letterSpacing:4 },

  infoCard:  { marginHorizontal:16, marginVertical:8, backgroundColor:C.surface, borderWidth:1, borderRadius:4, padding:14, flexDirection:"row", alignItems:"center", gap:12 },
  infoEmoji: { fontSize:40 },
  infoText:  { flex:1, gap:4 },
  infoName:  { fontSize:16, fontWeight:"900" },
  infoDesc:  { color:C.textDim, fontSize:12 },
  bossBadge: { color:C.boss, fontSize:12, fontWeight:"700", marginTop:4 },

  challengeRow:    { flexDirection:"row", marginHorizontal:16, backgroundColor:C.surface, borderRadius:4, borderWidth:1, borderColor:C.border, marginBottom:8 },
  challengeItem:   { flex:1, paddingVertical:10, alignItems:"center", gap:3 },
  challengeDivider:{ width:1, backgroundColor:C.border },
  challengeLabel:  { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2 },
  challengeValue:  { color:C.text, fontSize:13, fontWeight:"900" },

  abilityBanner: { marginHorizontal:16, marginBottom:8, backgroundColor:"#4a3f8a22", borderWidth:1, borderColor:"#4a3f8a", borderRadius:4, padding:10, flexDirection:"row", gap:10 },
  abilityEmoji:  { fontSize:20 },
  abilityInfo:   { flex:1 },
  abilityName:   { color:"#a07de0", fontSize:11, fontWeight:"900" },
  abilityDesc:   { color:"#6a6080", fontSize:10, marginTop:2, lineHeight:14 },

  timerSection:  { alignItems:"center", paddingHorizontal:16, gap:10, marginBottom:8 },
  timerCircle:   { width:130, height:130, borderRadius:65, borderWidth:3, justifyContent:"center", alignItems:"center", gap:4 },
  timerTime:     { fontSize:30, fontWeight:"900", letterSpacing:2 },
  timerStatus:   { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2 },
  timerTrack:    { width:"100%", height:5, backgroundColor:C.surface2, borderRadius:3, overflow:"hidden" },
  timerFill:     { height:"100%", borderRadius:3 },
  timerBtn:      { width:"100%", paddingVertical:12, borderRadius:4, alignItems:"center" },
  timerBtnText:  { color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  repSection:          { alignItems:"center", paddingHorizontal:16, gap:8, marginBottom:12 },
  repLabel:            { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3 },
  repRow:              { flexDirection:"row", alignItems:"center", gap:20 },
  repMinus:            { width:52, height:52, backgroundColor:C.surface2, borderRadius:4, justifyContent:"center", alignItems:"center", borderWidth:1, borderColor:C.border },
  repMinusText:        { color:C.text, fontSize:28, fontWeight:"900" },
  repDisplayContainer: { alignItems:"center" },
  repDisplay:          { color:C.accent, fontSize:52, fontWeight:"900", lineHeight:56 },
  repGoal:             { color:C.textDim, fontSize:12, fontWeight:"700" },
  repPlus:             { width:52, height:52, backgroundColor:C.accent, borderRadius:4, justifyContent:"center", alignItems:"center" },
  repPlusText:         { color:C.bg, fontSize:28, fontWeight:"900" },
  repFeedback:         { fontSize:12, fontWeight:"700", letterSpacing:1 },

  finishBtnLarge:   { marginHorizontal:16, backgroundColor:C.accent, borderRadius:4, paddingVertical:16, alignItems:"center" },
  finishBtn:        { flex:1, backgroundColor:C.accent, borderRadius:4, paddingVertical:14, alignItems:"center" },
  finishBtnDisabled:{ opacity:0.35 },
  finishBtnText:    { color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  actionRow:    { flexDirection:"row", gap:10, marginHorizontal:16, marginTop:8 },
  abandonBtn:   { flex:1, borderWidth:1, borderColor:C.border, borderRadius:4, paddingVertical:14, alignItems:"center" },
  abandonBtnText:{ color:C.textDim, fontSize:12, fontWeight:"700", letterSpacing:1 },

  // Phase combat
  phaseContainer:  { paddingHorizontal:16, paddingTop:8, alignItems:"center", gap:10 },
  phaseIndicators: { flexDirection:"row", gap:8 },
  phaseDot:        { width:32, height:32, borderRadius:16, backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, justifyContent:"center", alignItems:"center" },
  phaseDotActive:  { borderColor:C.boss, backgroundColor:C.boss+"33" },
  phaseDotDone:    { backgroundColor:C.success, borderColor:C.success },
  phaseDotText:    { color:C.text, fontSize:12, fontWeight:"900" },
  phaseLabel:      { fontSize:13, fontWeight:"900", letterSpacing:2 },
  phaseExercise:   { color:C.text, fontSize:18, fontWeight:"900" },
  phaseGoal:       { color:C.textDim, fontSize:14 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:"#000000aa", justifyContent:"center", alignItems:"center" },
});