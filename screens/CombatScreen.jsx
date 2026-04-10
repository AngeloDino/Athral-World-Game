import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator,
  ScrollView, Image, Dimensions,
} from "react-native";
import { auth } from "../firebase/config";
import g from "../constants/globalStyles";
import { colors as C, spacing as S, typography as T, radius as R } from "../constants/theme";
import { completeMission, defeatMonster, completeFreeTrain, defeatTowerFloor, failTowerSession, defeatBoss } from "../firebase/firestore";
import { EXERCISES } from "../systems/missionSystem";
import { DIFFICULTY_CONFIG_MAP } from "../constants/combatConfig";
import { applyClassAbilitySetup, getAbilityInfo } from "../systems/classAbilities";
import ResultModal from "../components/ResultModal";
import BattleIntro from "../components/BattleIntro";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

// ─── Mapa de sprites por clase ─────────────────────────────────────────────
const CLASS_SPRITES = {
  knight:    { m: require("../assets/classes/knight_m_sprite.png"),    f: require("../assets/classes/knight_f_sprite.png") },
  gladiator: { m: require("../assets/classes/gladiator_m_sprite.png"), f: require("../assets/classes/gladiator_f_sprite.png") },
  barbarian: { m: require("../assets/classes/barbarian_m_sprite.png"), f: require("../assets/classes/barbarian_f_sprite.png") },
  mage:      { m: require("../assets/classes/mage_m_sprite.png"),      f: require("../assets/classes/mage_f_sprite.png") },
  archer:    { m: require("../assets/classes/archer_m_sprite.png"),    f: require("../assets/classes/archer_f_sprite.png") },
  assassin:  { m: require("../assets/classes/assassin_m_sprite.png"),  f: require("../assets/classes/assassin_f_sprite.png") },
  scientist: { m: require("../assets/classes/scientist_m_sprite.png"), f: require("../assets/classes/scientist_f_sprite.png") },
};

function getSprite(classId, gender) {
  const cls = CLASS_SPRITES[classId];
  if (!cls) return null;
  return gender === "f" ? cls.f : cls.m;
}

// ─── Timer Hook ──────────────────────────────────────────────────────────────
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

  return { timeLeft, running, start, stop, reset,
    progress: initialSeconds > 0 ? timeLeft / initialSeconds : 0 };
}

function formatTime(s) {
  return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
}

// ─── Game Over Screen ────────────────────────────────────────────────────────
function GameOverScreen({ onRetry, onExit }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue:8,  duration:60, useNativeDriver:true }),
          Animated.timing(shakeAnim, { toValue:-8, duration:60, useNativeDriver:true }),
          Animated.timing(shakeAnim, { toValue:0,  duration:60, useNativeDriver:true }),
        ]),
        { iterations: 3 }
      ),
    ]).start();
  }, []);

  return (
    <Animated.View style={[gameOver.root, { opacity: fadeAnim }]}>
      <Animated.Text style={[gameOver.skull, { transform:[{ translateX: shakeAnim }] }]}>💀</Animated.Text>
      <Text style={gameOver.title}>TIEMPO AGOTADO</Text>
      <Text style={gameOver.sub}>No completaste los reps a tiempo</Text>
      <View style={gameOver.btnRow}>
        <TouchableOpacity style={gameOver.exitBtn} onPress={onExit}>
          <Text style={gameOver.exitBtnText}>SALIR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={gameOver.retryBtn} onPress={onRetry}>
          <Text style={gameOver.retryBtnText}>⚔️ REINTENTAR</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const gameOver = StyleSheet.create({
  root:        { ...StyleSheet.absoluteFillObject, backgroundColor:"#000000ee", justifyContent:"center", alignItems:"center", gap:16, zIndex:100 },
  skull:       { fontSize:80 },
  title:       { color:"#e05555", fontSize:28, fontWeight:"900", letterSpacing:4 },
  sub:         { color:"#6a6080", fontSize:13, letterSpacing:1 },
  btnRow:      { flexDirection:"row", gap:12, marginTop:16 },
  exitBtn:     { borderWidth:1, borderColor:"#2a2a3d", borderRadius:6, paddingVertical:14, paddingHorizontal:24 },
  exitBtnText: { color:"#6a6080", fontSize:13, fontWeight:"700", letterSpacing:1 },
  retryBtn:    { backgroundColor:"#e8c84a", borderRadius:6, paddingVertical:14, paddingHorizontal:24 },
  retryBtnText:{ color:"#000000", fontSize:13, fontWeight:"900", letterSpacing:1 },
});

// ─── Battle Arena (zona de combate visual) ───────────────────────────────────
function BattleArena({ playerClass, playerGender, monster, isBoss, phase, timerProgress, reps, targetReps, showVictoryHit }) {
  const playerSprite  = getSprite(playerClass, playerGender);
  const monsterSprite = monster?.sprite ?? null;
  const monsterArt    = monster?.art ?? null;

  const playerBob  = useRef(new Animated.Value(0)).current;
  const monsterBob = useRef(new Animated.Value(0)).current;
  const monsterHit = useRef(new Animated.Value(0)).current;
  const monsterOp  = useRef(new Animated.Value(1)).current;

  // HP calculado — jugador pierde HP con el tiempo, monstruo con los reps
  const playerHP  = Math.max(0, timerProgress);
  const monsterHP = targetReps > 0 ? Math.max(0, 1 - (reps / targetReps)) : 1;

  const playerHpColor  = playerHP > 0.5 ? C.success : playerHP > 0.25 ? C.warning : C.danger;
  const monsterHpColor = isBoss ? C.boss : C.danger;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(playerBob,  { toValue:-5, duration:900, useNativeDriver:true }),
      Animated.timing(playerBob,  { toValue:0,  duration:900, useNativeDriver:true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(450),
      Animated.timing(monsterBob, { toValue:-5, duration:1000, useNativeDriver:true }),
      Animated.timing(monsterBob, { toValue:0,  duration:1000, useNativeDriver:true }),
    ])).start();
  }, []);

  // Animación de golpe final al monstruo
  useEffect(() => {
    if (!showVictoryHit) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(monsterHit, { toValue:20,  duration:80, useNativeDriver:true }),
        Animated.timing(monsterOp,  { toValue:0.3, duration:80, useNativeDriver:true }),
      ]),
      Animated.parallel([
        Animated.timing(monsterHit, { toValue:-20, duration:80, useNativeDriver:true }),
        Animated.timing(monsterOp,  { toValue:1,   duration:80, useNativeDriver:true }),
      ]),
      Animated.parallel([
        Animated.timing(monsterHit, { toValue:15,  duration:80, useNativeDriver:true }),
        Animated.timing(monsterOp,  { toValue:0.2, duration:80, useNativeDriver:true }),
      ]),
      Animated.parallel([
        Animated.timing(monsterHit, { toValue:0,   duration:80, useNativeDriver:true }),
        Animated.timing(monsterOp,  { toValue:0,   duration:150, useNativeDriver:true }),
      ]),
    ]).start();
  }, [showVictoryHit]);

  return (
    <View style={arena.container}>
      {/* Jugador */}
      <Animated.View style={[arena.playerSide, { transform:[{ translateY: playerBob }] }]}>
        {playerSprite ? (
          <Image source={playerSprite} style={arena.playerSprite} resizeMode="contain" />
        ) : <Text style={arena.fallback}>🗡️</Text>}
        <View style={arena.hpBarBg}>
          <Animated.View style={[arena.hpFill, { width:`${playerHP * 100}%`, backgroundColor: playerHpColor }]} />
        </View>
        <Text style={arena.unitLabel}>TÚ</Text>
      </Animated.View>

      {/* Centro */}
      <View style={arena.center}>
        {isBoss && phase ? (
          <View style={arena.phaseTag}>
            <Text style={arena.phaseTagText}>{phase.label}</Text>
          </View>
        ) : <Text style={arena.vsSmall}>⚔️</Text>}
      </View>

      {/* Monstruo */}
      <Animated.View style={[arena.monsterSide, { opacity: monsterOp, transform:[{ translateY: monsterBob }, { translateX: monsterHit }] }]}>
        {monsterSprite ? (
          <Image source={monsterSprite} style={[arena.monsterSprite]} resizeMode="contain" />
        ) : monsterArt ? (
          <Image source={monsterArt} style={[arena.monsterArtSmall]} resizeMode="contain" />
        ) : <Text style={arena.fallback}>{monster?.emoji ?? "👹"}</Text>}
        <View style={arena.hpBarBg}>
          <View style={[arena.hpFill, { width:`${monsterHP * 100}%`, backgroundColor: monsterHpColor }]} />
        </View>
        <Text style={arena.unitLabel}>{monster?.name?.split(" ")[0]?.toUpperCase()}</Text>
      </Animated.View>
    </View>
  );
}

const SPRITE_SIZE = Math.min(W * 0.28, 110);

const arena = StyleSheet.create({
  container:      { height: SPRITE_SIZE + 40, flexDirection:"row", alignItems:"flex-end", justifyContent:"space-between", paddingHorizontal:16, marginBottom:8 },
  playerSide:     { alignItems:"center", gap:4, width: SPRITE_SIZE },
  monsterSide:    { alignItems:"center", gap:4, width: SPRITE_SIZE },
  center:         { flex:1, alignItems:"center", justifyContent:"center", paddingBottom:20 },
  playerSprite:   { width: SPRITE_SIZE, height: SPRITE_SIZE },
  monsterSprite:  { width: SPRITE_SIZE, height: SPRITE_SIZE },
  monsterArtSmall:{ width: SPRITE_SIZE, height: SPRITE_SIZE },
  fallback:       { fontSize:48 },
  hpBarBg:        { width:"100%", height:6, backgroundColor:"#1a1a28", borderRadius:3, overflow:"hidden", borderWidth:1, borderColor:"#2a2a3d" },
  hpFill:         { height:"100%", borderRadius:3 },
  unitLabel:      { color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:1 },
  vsSmall:        { fontSize:22 },
  phaseTag:       { backgroundColor:"#bf4abf22", borderWidth:1, borderColor:"#bf4abf66", borderRadius:4, paddingHorizontal:8, paddingVertical:4 },
  phaseTagText:   { color:"#bf4abf", fontSize:8, fontWeight:"900", letterSpacing:1, textAlign:"center" },
});

// ─── Phase Combat (jefes) ────────────────────────────────────────────────────
function PhaseCombat({ phases, playerClass, playerGender, monster, onAllPhasesComplete, onFail }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [reps, setReps]         = useState(0);
  const [started, setStarted]   = useState(false);
  const [expired, setExpired]   = useState(false);

  const phase    = phases[phaseIdx];
  const exercise = EXERCISES[phase.exercise];
  const { reps: adjReps, timer: adjTimer } = applyClassAbilitySetup(playerClass, phase.exercise, phase.reps, phase.timer);
  const timer    = useTimer(adjTimer, () => setExpired(true));
  const meetsGoal = reps >= adjReps;
  const isLast    = phaseIdx === phases.length - 1;
  const timerColor = timer.progress > 0.5 ? C.success : timer.progress > 0.25 ? C.warning : C.danger;

  useEffect(() => {
    setReps(0); setStarted(false); setExpired(false);
    timer.reset(adjTimer);
  }, [phaseIdx]);

  return (
    <View style={styles.root}>
      {/* Arena */}
      <BattleArena playerClass={playerClass} playerGender={playerGender} monster={monster} isBoss phase={phase} />

      {/* Phase dots */}
      <View style={styles.phaseDots}>
        {phases.map((_, i) => (
          <View key={i} style={[styles.phaseDot,
            i === phaseIdx && styles.phaseDotActive,
            i < phaseIdx  && styles.phaseDotDone,
          ]}><Text style={styles.phaseDotText}>{i+1}</Text></View>
        ))}
      </View>

      {/* Ejercicio actual */}
      <View style={[styles.exerciseTag, { borderColor: C.boss + "66" }]}>
        <Text style={[styles.exerciseEmoji]}>{exercise?.emoji ?? "💪"}</Text>
        <Text style={[styles.exerciseName, { color: C.boss }]}>{phase.label}</Text>
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <View style={[styles.timerCircle, { borderColor: started ? timerColor : C.border }]}>
          <Text style={[styles.timerTime, { color: started ? timerColor : C.textDim }]}>{formatTime(timer.timeLeft)}</Text>
          <Text style={styles.timerStatus}>{expired ? "TIEMPO" : timer.running ? "COMBATE" : started ? "PAUSA" : "LISTO"}</Text>
        </View>
        <View style={styles.timerTrack}>
          <View style={[styles.timerFill, { backgroundColor: started ? timerColor : C.border, width:`${timer.progress*100}%` }]} />
        </View>
        {!expired && (
          <TouchableOpacity style={[styles.timerBtn, { backgroundColor: started ? C.warning : C.boss }]}
            onPress={() => { if (!started) { setStarted(true); timer.start(); } else timer.running ? timer.stop() : timer.start(); }}>
            <Text style={styles.timerBtnText}>{!started ? "▶  INICIAR FASE" : timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rep counter */}
      <View style={styles.repSection}>
        <Text style={styles.repHint}>{started ? "REPS COMPLETADAS" : "INICIA EL TIMER PARA CONTAR"}</Text>
        <View style={styles.repRow}>
          <TouchableOpacity style={[styles.repMinus, !started && styles.repDisabled]} onPress={() => started && setReps(r => Math.max(0,r-1))} disabled={!started}>
            <Text style={styles.repMinusText}>−</Text>
          </TouchableOpacity>
          <View style={styles.repDisplay}>
            <Text style={[styles.repNum, meetsGoal && { color:C.success }]}>{reps}</Text>
            <Text style={styles.repGoal}>/ {adjReps}</Text>
          </View>
          <TouchableOpacity style={[styles.repPlus, !started && styles.repDisabled]} onPress={() => started && setReps(r => r+1)} disabled={!started}>
            <Text style={styles.repPlusText}>+</Text>
          </TouchableOpacity>
        </View>
        {reps > 0 && <Text style={[styles.repFeedback, { color: meetsGoal ? C.success : C.warning }]}>
          {meetsGoal ? (isLast ? "✓ ¡Última fase!" : `✓ ¡Fase ${phaseIdx+1} lista!`) : `${adjReps-reps} reps para completar`}
        </Text>}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.fleeBtn} onPress={onFail}>
          <Text style={styles.fleeBtnText}>HUIR</Text>
        </TouchableOpacity>
        {expired ? (
          <TouchableOpacity style={[styles.finishBtn, { backgroundColor:C.danger }]} onPress={onFail}>
            <Text style={styles.finishBtnText}>TIEMPO AGOTADO</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.finishBtn, reps===0 && styles.finishBtnDisabled]}
            onPress={() => { if (!meetsGoal) { onFail(); return; } timer.stop(); isLast ? onAllPhasesComplete() : setPhaseIdx(i=>i+1); }}
            disabled={reps===0}>
            <Text style={styles.finishBtnText}>{isLast ? "DERROTAR JEFE" : "SIGUIENTE FASE →"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── CombatScreen principal ──────────────────────────────────────────────────
export default function CombatScreen({ route, navigation }) {
  const { mode, difficulty, mission, monster, exercise, durationMinutes, towerRecord, playerClass, playerGender, zone } = route.params ?? {};
  const uid = auth.currentUser?.uid;

  const isBoss    = monster?.isBoss || (mode === "boss");
  const needsIntro = (mode === "monster" || mode === "boss" || mode === "tower") && monster;
  const [showIntro, setShowIntro] = useState(needsIntro);

  const rawConfig = buildConfig(mode, { difficulty, mission, monster, exercise, durationMinutes });
  const { reps: adjReps, timer: adjTimer } = applyClassAbilitySetup(playerClass, rawConfig.exercise, rawConfig.reps, rawConfig.timer);
  const config = { ...rawConfig, reps: rawConfig.hasGoal ? adjReps : rawConfig.reps, timer: adjTimer };
  const abilityInfo = getAbilityInfo(playerClass);

  const [reps, setReps]           = useState(0);
  const [started, setStarted]     = useState(false);
  const [expired, setExpired]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictoryHit, setShowVictoryHit] = useState(false);

  const timer      = useTimer(config.timer, () => {
    setExpired(true);
    // Solo game over en combate de monstruo si no alcanzó la meta
    if ((mode === "monster" || mode === "tower") && reps < config.reps) {
      setTimeout(() => setShowGameOver(true), 600);
    }
  });
  const meetsGoal  = config.hasGoal ? reps >= config.reps : true;
  const timerColor = timer.progress > 0.5 ? C.success : timer.progress > 0.25 ? C.warning : C.danger;

  async function handleFinish() {
    if (reps === 0 && config.hasGoal) return;
    timer.stop();
    // Animación de golpe si ganó
    if ((mode === "monster" || mode === "tower") && meetsGoal && !expired) {
      setShowVictoryHit(true);
      await new Promise(r => setTimeout(r, 600));
    }
    setLoading(true);
    try {
      if (mode === "mission") {
        const res = await completeMission(uid, difficulty, mission.exercise, reps, meetsGoal && !expired);
        setResult({ type: meetsGoal && !expired ? "mission" : "warning",
          title: meetsGoal && !expired ? "¡Misión Completada!" : "Misión Terminada",
          message: meetsGoal && !expired ? `+${res?.xpGained ?? mission.xp} XP${res?.allDoneBonus ? `\n+${res.allDoneBonus} XP bonus` : ""}${res?.streakMult > 1 ? `\n🔥 Racha x${res.streakMult}` : ""}` : `Stats ganados por ${reps} reps.` });
      } else if (mode === "monster") {
        if (meetsGoal && !expired) {
          const res = await defeatMonster(uid, monster);
          setResult({ type:"victory", title:"¡Victoria!", message:`Derrotaste a ${monster.name}\n+${res?.xpGained ?? monster.xp} XP` });
        } else {
          setResult({ type:"defeat", title:"Derrota", message:`No completaste los reps.\n${monster.name} sigue en pie.\nPuedes intentarlo de nuevo.` });
        }
      } else if (mode === "tower") {
        if (meetsGoal && !expired) {
          const res = await defeatTowerFloor(uid, monster);
          setResult({ type:"victory", title:`¡Piso ${monster.floor} Superado!`, message:`+${res?.xpGained ?? monster.xp} XP\nSiguiente: Piso ${monster.floor+1}` });
        } else {
          await failTowerSession(uid);
          setResult({ type:"defeat", title:"Caíste en la Torre", message:`Llegaste al piso ${monster.floor}.\nRegresa mañana.` });
        }
      } else if (mode === "free") {
        await completeFreeTrain(uid, exercise, reps);
        setResult({ type:"mission", title:"¡Sesión Completada!", message:`${reps} reps completados` });
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleBossComplete() {
    setLoading(true);
    try {
      const res = await defeatBoss(uid, monster);
      setResult({ type:"victory", title:"¡JEFE DERROTADO!", message:`${monster.name} ha caído\n+${res?.xpGained ?? monster.xp} XP` });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleBossFail() {
    if (mode === "tower") await failTowerSession(uid);
    setResult({ type:"defeat", title:"Derrota ante el Jefe", message:"No completaste todas las fases.\nInténtalo de nuevo mañana." });
  }

  // ── Intro ──
  if (showIntro) {
    return <BattleIntro
      playerClass={playerClass}
      playerGender={playerGender ?? "m"}
      monster={monster}
      zone={zone}
      onStart={() => setShowIntro(false)}
      onExit={() => navigation.goBack()}
    />;
  }

  // ── Boss phases ──
  if (isBoss && monster?.phases) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={g.backBtn}>
            <Text style={g.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.boss }]}>COMBATE DE JEFE</Text>
          <View style={{ width:60 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom:20 }} showsVerticalScrollIndicator={false}>
          <PhaseCombat phases={monster.phases} playerClass={playerClass} playerGender={playerGender ?? "m"}
            monster={monster} onAllPhasesComplete={handleBossComplete} onFail={handleBossFail} />
        </ScrollView>
        {result && <ResultModal visible={!!result} type={result.type} title={result.title} message={result.message} onClose={() => navigation.goBack()} />}
        {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={C.accent} /></View>}
      </SafeAreaView>
    );
  }

  // ── Normal combat ──
  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={g.backBtn}>
          <Text style={g.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: config.color }]}>{config.title}</Text>
        <View style={{ width:60 }} />
      </View>

      {/* Arena visual */}
      {(mode === "monster" || mode === "tower") && (
        <BattleArena
          playerClass={playerClass} playerGender={playerGender ?? "m"}
          monster={monster} isBoss={false}
          timerProgress={timer.progress}
          reps={reps} targetReps={config.reps}
          showVictoryHit={showVictoryHit}
        />
      )}

      {/* Ejercicio y meta */}
      {config.hasGoal && (
        <View style={[styles.exerciseTag, { borderColor: config.color + "66", marginHorizontal:16, marginBottom:8 }]}>
          <Text style={styles.exerciseEmoji}>{EXERCISES[config.exercise]?.emoji}</Text>
          <View style={{ flex:1 }}>
            <Text style={[styles.exerciseName, { color: config.color }]}>
            {{"pushups":"Flexiones","squats":"Sentadillas","situps":"Abdominales"}[config.exercise] ?? EXERCISES[config.exercise]?.label}
          </Text>
            <Text style={styles.exerciseSub}>Meta: {config.reps} reps · +{config.xp} XP</Text>
          </View>
        </View>
      )}

      {/* Ability banner */}
      {abilityInfo && (
        <View style={styles.abilityBanner}>
          <Text style={styles.abilityEmoji}>{abilityInfo.emoji}</Text>
          <View style={{ flex:1 }}>
            <Text style={styles.abilityName}>{abilityInfo.name} — {abilityInfo.shortDesc}</Text>
            <Text style={styles.abilityDesc}>{abilityInfo.description}</Text>
          </View>
        </View>
      )}

      {/* Timer */}
      <View style={styles.timerSection}>
        <View style={[styles.timerCircle, { borderColor: started ? timerColor : C.border }]}>
          <Text style={[styles.timerTime, { color: started ? timerColor : C.textDim }]}>{formatTime(timer.timeLeft)}</Text>
          <Text style={styles.timerStatus}>{expired ? "TIEMPO" : timer.running ? "EN CURSO" : started ? "PAUSA" : "LISTO"}</Text>
        </View>
        <View style={styles.timerTrack}>
          <View style={[styles.timerFill, { backgroundColor: started ? timerColor : C.border, width:`${timer.progress*100}%` }]} />
        </View>
        {!expired && (
          <TouchableOpacity style={[styles.timerBtn, { backgroundColor: started ? C.warning : C.success }]}
            onPress={() => { if (!started) { setStarted(true); timer.start(); } else timer.running ? timer.stop() : timer.start(); }}>
            <Text style={styles.timerBtnText}>{!started ? "▶  INICIAR" : timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rep counter */}
      <View style={styles.repSection}>
        <Text style={styles.repHint}>{started ? "REPS COMPLETADAS" : "INICIA EL TIMER PARA CONTAR"}</Text>
        <View style={styles.repRow}>
          <TouchableOpacity style={[styles.repMinus, !started && styles.repDisabled]} onPress={() => started && setReps(r => Math.max(0,r-1))} disabled={!started}>
            <Text style={styles.repMinusText}>−</Text>
          </TouchableOpacity>
          <View style={styles.repDisplay}>
            <Text style={[styles.repNum, config.hasGoal && reps >= config.reps && { color:C.success }]}>{reps}</Text>
            {config.hasGoal && <Text style={styles.repGoal}>/ {config.reps}</Text>}
          </View>
          <TouchableOpacity style={[styles.repPlus, !started && styles.repDisabled]} onPress={() => started && setReps(r => r+1)} disabled={!started}>
            <Text style={styles.repPlusText}>+</Text>
          </TouchableOpacity>
        </View>
        {config.hasGoal && reps > 0 && (
          <Text style={[styles.repFeedback, { color: meetsGoal ? C.success : C.warning }]}>
            {meetsGoal ? "✓ Meta alcanzada — ¡termina el combate!" : `${config.reps - reps} reps para la meta`}
          </Text>
        )}
      </View>

      {/* Finish */}
      <TouchableOpacity style={[styles.finishBtnLarge, (loading || (reps===0 && config.hasGoal)) && styles.finishBtnDisabled]}
        onPress={handleFinish} disabled={loading || (reps===0 && config.hasGoal)}>
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={styles.finishBtnText}>TERMINAR COMBATE</Text>}
      </TouchableOpacity>

      {result && <ResultModal visible={!!result} type={result.type} title={result.title} message={result.message} onClose={() => navigation.goBack()} />}
      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={C.accent} /></View>}
      {showGameOver && (
        <GameOverScreen
          onRetry={() => { setShowGameOver(false); setExpired(false); setStarted(false); setReps(0); timer.reset(config.timer); }}
          onExit={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}

function buildConfig(mode, { difficulty, mission, monster, exercise, durationMinutes }) {
  if (mode === "mission") {
    const ex = EXERCISES[mission?.exercise ?? "pushups"];
    const diff = DIFFICULTY_CONFIG_MAP?.[difficulty] ?? { label:"MISIÓN", color:C.accent, time:120 };
    return { title:diff.label, color:diff.color, emoji:ex?.emoji, name:ex?.label, description:`Misión ${diff.label}`, exercise:mission?.exercise, reps:mission?.reps, timer:diff.time, xp:mission?.xp, hasGoal:true };
  }
  if (mode === "monster" || mode === "tower") {
    return { title:mode==="tower"?`PISO ${monster?.floor}`:"COMBATE", color:mode==="tower"?"#8a4abf":C.danger, emoji:monster?.emoji, name:monster?.name, description:monster?.description, exercise:monster?.exercise, reps:monster?.reps, timer:monster?.timer, xp:monster?.xp, hasGoal:true };
  }
  if (mode === "free") {
    const ex = EXERCISES[exercise];
    return { title:"MODO LIBRE", color:"#a07de0", emoji:ex?.emoji, name:ex?.label, description:`${durationMinutes} minutos`, exercise, reps:0, timer:durationMinutes*60, xp:0, hasGoal:false };
  }
  return { title:"COMBATE", color:C.accent, emoji:"⚔️", name:"", description:"", exercise:"pushups", reps:0, timer:60, xp:0, hasGoal:false };
}

const styles = StyleSheet.create({
  root:        { flex:1, backgroundColor:C.bg },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:"#000000aa", justifyContent:"center", alignItems:"center" },

  headerRow:   { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingTop:52, paddingBottom:8 },
  backBtn:     { paddingVertical:8, paddingHorizontal:14, borderWidth:1, borderColor:"#e8e0f033", borderRadius:6, alignSelf:"flex-start", backgroundColor:"#e8e0f011" },
  backText:    { color:"#e8e0f0", fontSize:16, fontWeight:"700" },
  headerTitle: { fontSize:14, fontWeight:"900", letterSpacing:4, textAlign:"center", paddingHorizontal:16, paddingBottom:8, marginTop:4 },

  // Phase dots
  phaseDots:     { flexDirection:"row", justifyContent:"center", gap:8, marginBottom:8 },
  phaseDot:      { width:28, height:28, borderRadius:14, backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, justifyContent:"center", alignItems:"center" },
  phaseDotActive:{ borderColor:C.boss, backgroundColor:C.boss+"33" },
  phaseDotDone:  { backgroundColor:C.success, borderColor:C.success },
  phaseDotText:  { color:C.text, fontSize:11, fontWeight:"900" },

  // Exercise tag
  exerciseTag:  { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:C.surface, borderWidth:1, borderRadius:6, padding:10, marginBottom:4 },
  exerciseEmoji:{ fontSize:22 },
  exerciseName: { fontSize:14, fontWeight:"900" },
  exerciseSub:  { color:C.textDim, fontSize:11, marginTop:2 },

  // Ability
  abilityBanner: { flexDirection:"row", gap:10, backgroundColor:"#4a3f8a22", borderWidth:1, borderColor:"#4a3f8a", borderRadius:6, padding:10, marginHorizontal:16, marginBottom:8 },
  abilityEmoji:  { fontSize:18 },
  abilityName:   { color:"#a07de0", fontSize:11, fontWeight:"900" },
  abilityDesc:   { color:C.textDim, fontSize:10, marginTop:2, lineHeight:14 },

  // Timer
  timerSection:  { alignItems:"center", paddingHorizontal:16, gap:8, marginBottom:8 },
  timerCircle:   { width:120, height:120, borderRadius:60, borderWidth:3, justifyContent:"center", alignItems:"center", gap:4 },
  timerTime:     { fontSize:28, fontWeight:"900", letterSpacing:2 },
  timerStatus:   { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2 },
  timerTrack:    { width:"100%", height:4, backgroundColor:C.surface2, borderRadius:2, overflow:"hidden" },
  timerFill:     { height:"100%", borderRadius:2 },
  timerBtn:      { width:"100%", paddingVertical:12, borderRadius:6, alignItems:"center" },
  timerBtnText:  { color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  // Reps
  repSection:  { alignItems:"center", gap:6, paddingHorizontal:16, marginBottom:8 },
  repHint:     { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2 },
  repRow:      { flexDirection:"row", alignItems:"center", gap:16 },
  repMinus:    { width:50, height:50, backgroundColor:C.surface2, borderRadius:6, justifyContent:"center", alignItems:"center", borderWidth:1, borderColor:C.border },
  repMinusText:{ color:C.text, fontSize:26, fontWeight:"900" },
  repDisplay:  { alignItems:"center" },
  repNum:      { color:C.accent, fontSize:48, fontWeight:"900", lineHeight:52 },
  repGoal:     { color:C.textDim, fontSize:12, fontWeight:"700" },
  repPlus:     { width:50, height:50, backgroundColor:C.accent, borderRadius:6, justifyContent:"center", alignItems:"center" },
  repPlusText: { color:C.bg, fontSize:26, fontWeight:"900" },
  repDisabled: { opacity:0.3 },
  repFeedback: { fontSize:12, fontWeight:"700", letterSpacing:1 },

  // Finish
  finishBtnLarge:   { marginHorizontal:16, backgroundColor:C.accent, borderRadius:6, paddingVertical:14, alignItems:"center", marginBottom:8 },
  finishBtn:        { flex:1, backgroundColor:C.accent, borderRadius:6, paddingVertical:13, alignItems:"center" },
  finishBtnDisabled:{ opacity:0.3 },
  finishBtnText:    { color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  // Action row
  actionRow:  { flexDirection:"row", gap:10, marginHorizontal:16, marginBottom:8 },
  fleeBtn:    { flex:1, borderWidth:1, borderColor:C.border, borderRadius:6, paddingVertical:13, alignItems:"center" },
  fleeBtnText:{ color:C.textDim, fontSize:12, fontWeight:"700", letterSpacing:1 },
});