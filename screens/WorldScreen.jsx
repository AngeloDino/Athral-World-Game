import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Animated, ActivityIndicator, Alert, FlatList,
} from "react-native";
import { auth } from "../firebase/config";
import { ZONES, MONSTERS, TOWER, getTowerFloorMonster, TOWER_MIN_LEVEL } from "../constants/monsters";
import { EXERCISES } from "../systems/missionSystem";
import ResultModal from "../components/ResultModal";
import { checkMonsterDefeated, defeatMonster, getTowerProgress, defeatTowerFloor, failTowerSession } from "../firebase/firestore";

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
  danger:       "#e05555",
  warning:      "#e8a84a",
  tower:        "#8a4abf",
};

const TIER_COLORS = {
  "común":      "#6a8a6a",
  "élite":      "#e8c84a",
  "jefe":       "#e05555",
  "legendario": "#bf4abf",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2,"0");
  const sec = (s % 60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}

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

  return { timeLeft, running, start, stop, reset, progress: timeLeft / initialSeconds };
}

// ─── Combat Modal ─────────────────────────────────────────────────────────────
function CombatModal({ visible, monster, onWin, onLose, onClose }) {
  const [reps, setReps]         = useState("");
  const [started, setStarted]   = useState(false);
  const [finished, setFinished] = useState(false);
  const [expired, setExpired]   = useState(false);

  const timer = useTimer(monster?.timer ?? 60, () => {
    setExpired(true);
    setFinished(true);
  });

  useEffect(() => {
    if (visible) {
      setReps(""); setStarted(false);
      setFinished(false); setExpired(false);
      timer.reset(monster?.timer ?? 60);
    }
  }, [visible, monster]);

  if (!monster) return null;

  const entered   = parseInt(reps) || 0;
  const meetsGoal = entered >= monster.reps;
  const timerColor = timer.progress > 0.5 ? C.success : timer.progress > 0.25 ? C.warning : C.danger;

  const exercise = EXERCISES[monster.exercise];

  async function handleFinish() {
    if (entered === 0) { Alert.alert("Error", "Ingresa tus reps."); return; }
    timer.stop();
    if (meetsGoal) {
      await onWin(entered);
    } else {
      await onLose(entered);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.combatCard}>

          {/* Monster info */}
          <View style={styles.combatHeader}>
            <Text style={styles.combatEmoji}>{monster.emoji}</Text>
            <View style={styles.combatInfo}>
              <Text style={styles.combatName}>{monster.name}</Text>
              <Text style={[styles.combatTier, { color: TIER_COLORS[monster.tier] ?? C.textDim }]}>
                ◆ {monster.tier?.toUpperCase()}
              </Text>
              <Text style={styles.combatDesc}>{monster.description}</Text>
            </View>
          </View>

          {/* Rewards preview */}
          <View style={styles.combatRewards}>
            <Text style={styles.combatRewardItem}>⚡ {monster.xp} XP</Text>
            {Object.entries(monster.statReward || {}).map(([stat, val]) => (
              <Text key={stat} style={styles.combatRewardItem}>+{val} {stat}</Text>
            ))}
          </View>

          {/* Challenge */}
          <View style={styles.combatChallenge}>
            <Text style={styles.combatChallengeLabel}>DESAFÍO</Text>
            <Text style={styles.combatChallengeText}>
              {exercise?.emoji} {monster.reps} {exercise?.label} en {formatTime(monster.timer)}
            </Text>
          </View>

          {/* Timer */}
          <View style={[styles.timerCircle, { borderColor: timerColor }]}>
            <Text style={[styles.timerDisplay, { color: timerColor }]}>
              {formatTime(timer.timeLeft)}
            </Text>
            <Text style={styles.timerLabel}>
              {expired ? "TIEMPO AGOTADO" : timer.running ? "EN COMBATE" : started ? "PAUSADO" : "LISTO"}
            </Text>
          </View>

          <View style={styles.timerBar}>
            <View style={[styles.timerBarFill, { backgroundColor: timerColor, width: `${timer.progress * 100}%` }]} />
          </View>

          {/* Controls */}
          {!finished && !started && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.success }]} onPress={() => { setStarted(true); timer.start(); }}>
              <Text style={styles.actionBtnText}>⚔️  INICIAR COMBATE</Text>
            </TouchableOpacity>
          )}
          {!finished && started && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.warning }]} onPress={() => timer.running ? timer.stop() : timer.start()}>
              <Text style={styles.actionBtnText}>{timer.running ? "⏸  PAUSAR" : "▶  CONTINUAR"}</Text>
            </TouchableOpacity>
          )}

          {/* Rep input */}
          {(started || expired) && (
            <View style={styles.repSection}>
              <Text style={styles.repLabel}>¿CUÁNTAS REPS COMPLETASTE?</Text>
              <View style={styles.repInputRow}>
                <TouchableOpacity style={styles.repMinus} onPress={() => setReps(String(Math.max(0, entered - 1)))}>
                  <Text style={styles.repMinusText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.repDisplay}>{entered}</Text>
                <TouchableOpacity style={styles.repPlus} onPress={() => setReps(String(entered + 1))}>
                  <Text style={styles.repPlusText}>+</Text>
                </TouchableOpacity>
              </View>
              {entered > 0 && (
                <Text style={[styles.repFeedback, { color: meetsGoal ? C.success : C.danger }]}>
                  {meetsGoal ? `✓ Monstruo derrotado — +${monster.xp} XP` : `✗ Insuficiente — necesitas ${monster.reps} reps`}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.combatActions}>
            <TouchableOpacity style={styles.abandonBtn} onPress={onClose}>
              <Text style={styles.abandonBtnText}>HUIR</Text>
            </TouchableOpacity>
            {(started || expired) && (
              <TouchableOpacity
                style={[styles.finishBtn, entered === 0 && styles.finishBtnDisabled]}
                onPress={handleFinish}
                disabled={entered === 0}
              >
                <Text style={styles.finishBtnText}>TERMINAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Zone Modal ───────────────────────────────────────────────────────────────
function ZoneModal({ visible, zone, playerLevel, uid, onClose, onResult, onStartCombat }) {
  const [monsterStates, setMonsterStates] = useState({});
  const [loading, setLoading]             = useState(true);
  const [combatMonster, setCombatMonster] = useState(null);
  const [combatVisible, setCombatVisible] = useState(false);

  useEffect(() => {
    if (!visible || !zone) return;
    loadMonsterStates();
  }, [visible, zone]);

  async function loadMonsterStates() {
    setLoading(true);
    const states = {};
    for (const mId of zone.monsters) {
      states[mId] = await checkMonsterDefeated(uid, mId);
    }
    setMonsterStates(states);
    setLoading(false);
  }

  function startCombat(monster) {
    onStartCombat("monster", { monster });
  }

  async function handleWin(reps) {
    await defeatMonster(uid, combatMonster);
    setMonsterStates(prev => ({ ...prev, [combatMonster.id]: true }));
    setCombatVisible(false);
    onResult?.("victory", "¡Victoria!", `Derrotaste a ${combatMonster.name}\n+${combatMonster.xp} XP`);
  }

  async function handleLose(reps) {
    setCombatVisible(false);
    onResult?.("defeat", "Derrota", `No completaste los reps necesarios.\n${combatMonster.name} sigue en pie.`);
  }

  if (!zone) return null;
  const zoneMonsters = zone.monsters.map(id => MONSTERS[id]).filter(Boolean);

  return (
    <>
      <Modal visible={visible && !combatVisible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.zoneCard, { borderColor: zone.color }]}>

            {/* Header */}
            <View style={[styles.zoneHeader, { backgroundColor: zone.colorDark }]}>
              <Text style={styles.zoneHeaderEmoji}>{zone.emoji}</Text>
              <View style={styles.zoneHeaderInfo}>
                <Text style={styles.zoneHeaderName}>{zone.name}</Text>
                <Text style={styles.zoneHeaderDesc}>{zone.description}</Text>
              </View>
            </View>

            {/* Monsters list */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={C.accent} />
              </View>
            ) : (
              <ScrollView style={styles.monsterList} showsVerticalScrollIndicator={false}>
                <Text style={styles.monsterListLabel}>MONSTRUOS DISPONIBLES</Text>
                {zoneMonsters.map((monster) => {
                  const defeated = monsterStates[monster.id];
                                const exercise = EXERCISES[monster.exercise];
                  return (
                    <View key={monster.id} style={[styles.monsterCard, defeated && styles.monsterCardDefeated]}>
                      <View style={styles.monsterCardLeft}>
                        <Text style={styles.monsterCardEmoji}>{monster.emoji}</Text>
                        <View>
                          <Text style={styles.monsterCardName}>{monster.name}</Text>
                          <Text style={[styles.monsterCardTier, { color: TIER_COLORS[monster.tier] }]}>
                            ◆ {monster.tier}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.monsterCardRight}>
                        <Text style={styles.monsterCardXP}>+{monster.xp} XP</Text>
                        <Text style={styles.monsterCardReps}>
                          {exercise?.emoji} {monster.reps} reps
                        </Text>
                        {defeated ? (
                          <View style={styles.defeatedBadge}>
                            <Text style={styles.defeatedText}>DERROTADO</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.fightBtn}
                            onPress={() => startCombat(monster)}
                          >
                            <Text style={styles.fightBtnText}>COMBATIR</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeZoneBtn} onPress={onClose}>
              <Text style={styles.closeZoneBtnText}>← VOLVER AL MAPA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CombatModal
        visible={combatVisible}
        monster={combatMonster}
        onWin={handleWin}
        onLose={handleLose}
        onClose={() => setCombatVisible(false)}
      />

    </>
  );
}

// ─── Tower Modal ──────────────────────────────────────────────────────────────
function TowerModal({ visible, playerLevel, uid, towerRecord, onClose, onResult, onStartCombat }) {
  const [session, setSession]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [combatMonster, setCombatMonster] = useState(null);
  const [combatVisible, setCombatVisible] = useState(false);
  const [currentFloor, setCurrentFloor]   = useState(1);

  useEffect(() => {
    if (!visible) return;
    loadSession();
  }, [visible]);

  async function loadSession() {
    setLoading(true);
    const s = await getTowerProgress(uid);
    setSession(s);
    setCurrentFloor(s.floor ?? 1);
    setLoading(false);
  }

  function startFloor() {
    const monster = getTowerFloorMonster(currentFloor);
    onStartCombat("tower", { monster, towerRecord });
  }

  async function handleFloorWin(reps) {
    await defeatTowerFloor(uid, combatMonster);
    const nextFloor = currentFloor + 1;
    setCurrentFloor(nextFloor);
    setCombatVisible(false);
    onResult?.("victory", `¡Piso ${currentFloor} Superado!`, `+${combatMonster.xp} XP\nSiguiente: Piso ${nextFloor}`);
  }

  async function handleFloorLose(reps) {
    await failTowerSession(uid);
    setSession(prev => ({ ...prev, active: false, defeated: true }));
    setCombatVisible(false);
    onResult?.("defeat", "Caíste en la Torre", `Llegaste al piso ${currentFloor}.\nTu récord: Piso ${Math.max(towerRecord ?? 0, currentFloor - 1)}\nRegresa mañana para intentarlo de nuevo.`, true);
  }

  const locked        = playerLevel < TOWER_MIN_LEVEL;
  const sessionEnded  = session?.defeated;
  const floorMonster  = getTowerFloorMonster(currentFloor);

  return (
    <>
      <Modal visible={visible && !combatVisible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.zoneCard, { borderColor: C.tower }]}>

            {/* Header */}
            <View style={[styles.zoneHeader, { backgroundColor: "#2a1a40" }]}>
              <Text style={styles.zoneHeaderEmoji}>🗼</Text>
              <View style={styles.zoneHeaderInfo}>
                <Text style={[styles.zoneHeaderName, { color: "#c084f5" }]}>Torre de Babel</Text>
                <Text style={styles.zoneHeaderDesc}>Una torre infinita. Entra una vez al día.</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}><ActivityIndicator color={C.tower} /></View>
            ) : locked ? (
              <View style={styles.towerLocked}>
                <Text style={styles.towerLockedEmoji}>🔒</Text>
                <Text style={styles.towerLockedTitle}>NIVEL INSUFICIENTE</Text>
                <Text style={styles.towerLockedSub}>
                  Necesitas nivel {TOWER_MIN_LEVEL} para entrar.{"\n"}Tu nivel actual: {playerLevel}
                </Text>
              </View>
            ) : sessionEnded ? (
              <View style={styles.towerLocked}>
                <Text style={styles.towerLockedEmoji}>💀</Text>
                <Text style={styles.towerLockedTitle}>YA CAÍSTE HOY</Text>
                <Text style={styles.towerLockedSub}>
                  Regresa mañana para intentarlo de nuevo.{"\n"}Récord personal: Piso {towerRecord ?? 0}
                </Text>
              </View>
            ) : (
              <View style={styles.towerContent}>
                {/* Stats */}
                <View style={styles.towerStats}>
                  <View style={styles.towerStatItem}>
                    <Text style={styles.towerStatValue}>{currentFloor}</Text>
                    <Text style={styles.towerStatLabel}>PISO ACTUAL</Text>
                  </View>
                  <View style={styles.towerStatDivider} />
                  <View style={styles.towerStatItem}>
                    <Text style={[styles.towerStatValue, { color: C.tower }]}>{towerRecord ?? 0}</Text>
                    <Text style={styles.towerStatLabel}>RÉCORD</Text>
                  </View>
                </View>

                {/* Next floor monster preview */}
                <View style={styles.towerFloorPreview}>
                  <Text style={styles.towerFloorLabel}>PRÓXIMO ENEMIGO — PISO {currentFloor}</Text>
                  <View style={styles.towerMonsterRow}>
                    <Text style={styles.towerMonsterEmoji}>{floorMonster.emoji}</Text>
                    <View style={styles.towerMonsterInfo}>
                      <Text style={styles.towerMonsterName}>{floorMonster.name}</Text>
                      <Text style={[styles.towerMonsterTier, { color: TIER_COLORS[floorMonster.tier] }]}>
                        ◆ {floorMonster.tier}
                      </Text>
                      <Text style={styles.towerMonsterStats}>
                        {floorMonster.reps} reps · {formatTime(floorMonster.timer)} · +{floorMonster.xp} XP
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: C.tower }]}
                  onPress={startFloor}
                >
                  <Text style={styles.actionBtnText}>⚔️  SUBIR AL PISO {currentFloor}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.closeZoneBtn} onPress={onClose}>
              <Text style={styles.closeZoneBtnText}>← VOLVER AL MAPA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CombatModal
        visible={combatVisible}
        monster={combatMonster}
        onWin={handleFloorWin}
        onLose={handleFloorLose}
        onClose={() => { setCombatVisible(false); failTowerSession(uid); setSession(p => ({...p, defeated:true})); }}
      />

    </>
  );
}

// ─── World Screen ─────────────────────────────────────────────────────────────
export default function WorldScreen({ navigation }) {
  const [playerLevel, setPlayerLevel]   = useState(1);
  const [towerRecord, setTowerRecord]   = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const [towerVisible, setTowerVisible] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [resultModal, setResultModal]   = useState({ visible: false, type: "info", title: "", message: "", closeFn: null });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  function handleResult(type, title, message, closeAfter = false) {
    setResultModal({
      visible: true, type, title, message,
      closeFn: closeAfter ? () => { setSelectedZone(null); setTowerVisible(false); } : null,
    });
  }

  const uid = auth.currentUser?.uid;

  function handleStartCombat(mode, params) {
    // Cerrar modales antes de navegar al combate
    navigation.navigate("Combat", { mode, uid, ...params });
  }

  // Cuando regresamos del combate, cerrar todos los modales
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setSelectedZone(null);
      setTowerVisible(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    async function init() {
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setPlayerLevel(snap.data().level ?? 1);
        setTowerRecord(snap.data().towerRecord ?? 0);
      }
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
    }
    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Cargando mundo...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLVER</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MUNDO</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LV {playerLevel}</Text>
          </View>
        </View>

        {/* World subtitle */}
        <Text style={styles.worldSub}>Selecciona una zona para explorar</Text>

        {/* Zone grid */}
        <View style={styles.zonesGrid}>
          {ZONES.map((zone) => {
            const locked = playerLevel < zone.minLevel;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneCard2,
                  { borderColor: locked ? C.border : zone.color },
                  locked && styles.zoneCardLocked,
                ]}
                onPress={() => !locked && navigation.navigate("Zone", { zone })}
                activeOpacity={locked ? 1 : 0.8}
              >
                <Text style={styles.zoneCard2Emoji}>{zone.emoji}</Text>
                <Text style={[styles.zoneCard2Name, locked && { color: C.textDim }]}>
                  {zone.name}
                </Text>
                <Text style={styles.zoneCard2Monsters}>
                  {zone.monsters.length} monstruos
                </Text>
                {locked ? (
                  <View style={styles.zoneLockBadge}>
                    <Text style={styles.zoneLockText}>🔒 Nv.{zone.minLevel}</Text>
                  </View>
                ) : (
                  <View style={[styles.zoneOpenBadge, { backgroundColor: zone.color + "33" }]}>
                    <Text style={[styles.zoneOpenText, { color: zone.color }]}>EXPLORAR</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tower of Babel */}
        <View style={styles.towerSection}>
          <Text style={styles.sectionLabel}>DESAFÍO ESPECIAL</Text>
          <TouchableOpacity
            style={[
              styles.towerBtn,
              playerLevel < TOWER_MIN_LEVEL && styles.towerBtnLocked,
            ]}
            onPress={() => setTowerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.towerBtnLeft}>
              <Text style={styles.towerBtnEmoji}>🗼</Text>
              <View>
                <Text style={styles.towerBtnName}>Torre de Babel</Text>
                <Text style={styles.towerBtnSub}>
                  {playerLevel < TOWER_MIN_LEVEL
                    ? `🔒 Requiere nivel ${TOWER_MIN_LEVEL}`
                    : `Pisos infinitos · Récord: ${towerRecord}`
                  }
                </Text>
              </View>
            </View>
            <Text style={styles.towerBtnArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Zone Modal */}
      <ZoneModal
        visible={!!selectedZone}
        zone={selectedZone}
        playerLevel={playerLevel}
        uid={uid}
        onClose={() => setSelectedZone(null)}
        onResult={handleResult}
        onStartCombat={handleStartCombat}
      />

      {/* Tower Modal */}
      <TowerModal
        visible={towerVisible}
        playerLevel={playerLevel}
        uid={uid}
        towerRecord={towerRecord}
        onClose={() => setTowerVisible(false)}
        onResult={handleResult}
        onStartCombat={handleStartCombat}
      />

      {/* Result Modal — fuera de ScrollView y modales, cubre toda la pantalla */}
      <ResultModal
        visible={resultModal.visible}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={() => {
          setResultModal(r => ({ ...r, visible: false }));
          resultModal.closeFn?.();
        }}
      />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex:1, backgroundColor:C.bg },
  scroll:      { paddingHorizontal:16, paddingTop:56, paddingBottom:32 },
  loadingRoot: { flex:1, backgroundColor:C.bg, justifyContent:"center", alignItems:"center", gap:16 },
  loadingText: { color:C.textDim, fontSize:13, letterSpacing:2 },

  header:        { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:8 },
  backBtn:       { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText:      { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle:   { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:4 },
  levelBadge:    { backgroundColor:C.accent, paddingHorizontal:10, paddingVertical:4, borderRadius:4 },
  levelBadgeText:{ color:C.bg, fontSize:11, fontWeight:"900" },
  worldSub:      { color:C.textDim, fontSize:12, textAlign:"center", marginBottom:24, letterSpacing:1 },

  sectionLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:10 },

  zonesGrid: { flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:28 },
  zoneCard2: {
    width:"47%", backgroundColor:C.surface, borderWidth:1,
    borderRadius:4, padding:14, alignItems:"center", gap:8,
  },
  zoneCardLocked:  { opacity:0.5 },
  zoneCard2Emoji:  { fontSize:32 },
  zoneCard2Name:   { color:C.text, fontSize:13, fontWeight:"900", textAlign:"center" },
  zoneCard2Monsters:{ color:C.textDim, fontSize:10, letterSpacing:1 },
  zoneLockBadge:   { backgroundColor:C.border, paddingHorizontal:10, paddingVertical:4, borderRadius:3 },
  zoneLockText:    { color:C.textDim, fontSize:10, fontWeight:"700" },
  zoneOpenBadge:   { paddingHorizontal:10, paddingVertical:4, borderRadius:3 },
  zoneOpenText:    { fontSize:10, fontWeight:"900", letterSpacing:1 },

  towerSection: { marginBottom:16 },
  towerBtn: {
    backgroundColor:C.surface, borderWidth:1, borderColor:"#8a4abf",
    borderRadius:4, padding:16, flexDirection:"row",
    alignItems:"center", justifyContent:"space-between",
  },
  towerBtnLocked:  { borderColor:C.border, opacity:0.6 },
  towerBtnLeft:    { flexDirection:"row", alignItems:"center", gap:14 },
  towerBtnEmoji:   { fontSize:32 },
  towerBtnName:    { color:"#c084f5", fontSize:14, fontWeight:"900", letterSpacing:2 },
  towerBtnSub:     { color:C.textDim, fontSize:11, marginTop:2 },
  towerBtnArrow:   { color:C.textDim, fontSize:16 },

  // Modals
  modalOverlay: { flex:1, backgroundColor:"#000000cc", justifyContent:"flex-end" },

  zoneCard: {
    backgroundColor:C.surface, borderTopWidth:2,
    borderTopLeftRadius:12, borderTopRightRadius:12,
    maxHeight:"85%",
  },
  zoneHeader:      { flexDirection:"row", padding:20, gap:14, alignItems:"center" },
  zoneHeaderEmoji: { fontSize:36 },
  zoneHeaderInfo:  { flex:1 },
  zoneHeaderName:  { color:C.accent, fontSize:18, fontWeight:"900" },
  zoneHeaderDesc:  { color:C.textDim, fontSize:12, marginTop:4 },

  monsterList:       { paddingHorizontal:16 },
  monsterListLabel:  { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:12 },
  monsterCard: {
    backgroundColor:C.surface2, borderWidth:1, borderColor:C.border,
    borderRadius:4, padding:14, flexDirection:"row",
    justifyContent:"space-between", alignItems:"center", marginBottom:10,
  },
  monsterCardDefeated: { opacity:0.4 },
  monsterCardLeft:  { flexDirection:"row", alignItems:"center", gap:10 },
  monsterCardEmoji: { fontSize:28 },
  monsterCardName:  { color:C.text, fontSize:14, fontWeight:"700" },
  monsterCardTier:  { fontSize:10, fontWeight:"700", letterSpacing:1, marginTop:2 },
  monsterCardRight: { alignItems:"flex-end", gap:4 },
  monsterCardXP:    { color:C.accent, fontSize:13, fontWeight:"900" },
  monsterCardReps:  { color:C.textDim, fontSize:11 },
  defeatedBadge:    { backgroundColor:C.success+"22", borderWidth:1, borderColor:C.success+"44", borderRadius:3, paddingHorizontal:8, paddingVertical:4 },
  defeatedText:     { color:C.success, fontSize:9, fontWeight:"900", letterSpacing:1 },
  fightBtn:         { backgroundColor:C.danger+"22", borderWidth:1, borderColor:C.danger+"66", borderRadius:3, paddingHorizontal:10, paddingVertical:5 },
  fightBtnText:     { color:C.danger, fontSize:10, fontWeight:"900", letterSpacing:1 },

  closeZoneBtn:     { margin:16, borderWidth:1, borderColor:C.border, borderRadius:4, paddingVertical:14, alignItems:"center" },
  closeZoneBtnText: { color:C.textDim, fontSize:12, fontWeight:"700", letterSpacing:2 },

  loadingBox: { padding:40, alignItems:"center" },

  // Combat modal
  combatCard: {
    backgroundColor:C.surface, borderTopWidth:1, borderTopColor:C.danger,
    borderTopLeftRadius:12, borderTopRightRadius:12, padding:20, gap:14,
  },
  combatHeader:    { flexDirection:"row", gap:14, alignItems:"center" },
  combatEmoji:     { fontSize:44 },
  combatInfo:      { flex:1 },
  combatName:      { color:C.text, fontSize:18, fontWeight:"900" },
  combatTier:      { fontSize:10, fontWeight:"700", letterSpacing:2, marginTop:2 },
  combatDesc:      { color:C.textDim, fontSize:11, marginTop:4 },
  combatRewards:   { flexDirection:"row", gap:12, flexWrap:"wrap" },
  combatRewardItem:{ color:C.accent, fontSize:12, fontWeight:"700" },
  combatChallenge: { backgroundColor:C.surface2, borderRadius:4, padding:12, gap:4 },
  combatChallengeLabel: { color:C.textDim, fontSize:9, letterSpacing:3, fontWeight:"700" },
  combatChallengeText:  { color:C.text, fontSize:14, fontWeight:"700" },
  timerCircle: {
    alignSelf:"center", width:120, height:120, borderRadius:60,
    borderWidth:3, justifyContent:"center", alignItems:"center", gap:4,
  },
  timerDisplay: { fontSize:28, fontWeight:"900", letterSpacing:2 },
  timerLabel:   { fontSize:9, letterSpacing:3, color:C.textDim, fontWeight:"700" },
  timerBar:     { height:5, backgroundColor:C.surface2, borderRadius:3, overflow:"hidden" },
  timerBarFill: { height:"100%", borderRadius:3 },
  actionBtn:    { paddingVertical:14, borderRadius:4, alignItems:"center" },
  actionBtnText:{ color:C.bg, fontSize:13, fontWeight:"900", letterSpacing:2 },

  repSection:   { gap:8 },
  repLabel:     { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:2 },
  repInputRow:  { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:20 },
  repMinus:     { width:44, height:44, backgroundColor:C.surface2, borderRadius:4, justifyContent:"center", alignItems:"center" },
  repMinusText: { color:C.text, fontSize:24, fontWeight:"900" },
  repDisplay:   { color:C.accent, fontSize:40, fontWeight:"900", minWidth:80, textAlign:"center" },
  repPlus:      { width:44, height:44, backgroundColor:C.accent, borderRadius:4, justifyContent:"center", alignItems:"center" },
  repPlusText:  { color:C.bg, fontSize:24, fontWeight:"900" },
  repFeedback:  { fontSize:12, textAlign:"center", fontWeight:"700" },

  combatActions: { flexDirection:"row", gap:10 },
  abandonBtn:    { flex:1, borderWidth:1, borderColor:C.border, borderRadius:4, paddingVertical:14, alignItems:"center" },
  abandonBtnText:{ color:C.textDim, fontSize:12, fontWeight:"700", letterSpacing:1 },
  finishBtn:     { flex:1, backgroundColor:C.accent, borderRadius:4, paddingVertical:14, alignItems:"center" },
  finishBtnDisabled: { opacity:0.4 },
  finishBtnText: { color:C.bg, fontSize:12, fontWeight:"900", letterSpacing:1 },

  // Tower
  towerLocked:      { padding:32, alignItems:"center", gap:12 },
  towerLockedEmoji: { fontSize:44 },
  towerLockedTitle: { color:C.danger, fontSize:16, fontWeight:"900", letterSpacing:3 },
  towerLockedSub:   { color:C.textDim, fontSize:13, textAlign:"center", lineHeight:20 },
  towerContent:     { padding:16, gap:16 },
  towerStats:       { flexDirection:"row", backgroundColor:C.surface2, borderRadius:4 },
  towerStatItem:    { flex:1, paddingVertical:14, alignItems:"center", gap:4 },
  towerStatDivider: { width:1, backgroundColor:C.border },
  towerStatValue:   { color:C.text, fontSize:22, fontWeight:"900" },
  towerStatLabel:   { color:C.textDim, fontSize:9, letterSpacing:2, fontWeight:"700" },
  towerFloorPreview:{ backgroundColor:C.surface2, borderRadius:4, padding:14, gap:10 },
  towerFloorLabel:  { color:C.textDim, fontSize:9, letterSpacing:3, fontWeight:"700" },
  towerMonsterRow:  { flexDirection:"row", alignItems:"center", gap:14 },
  towerMonsterEmoji:{ fontSize:36 },
  towerMonsterInfo: { flex:1, gap:4 },
  towerMonsterName: { color:C.text, fontSize:15, fontWeight:"900" },
  towerMonsterTier: { fontSize:10, fontWeight:"700", letterSpacing:1 },
  towerMonsterStats:{ color:C.textDim, fontSize:11 },
});