import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import g from "../constants/globalStyles";
import { colors as C, spacing as S, typography as T, radius as R } from "../constants/theme";
import { listenToUserProfile } from "../firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getCurrentRank, getNextRank, getRankProgress, getTotalStats, RANKS } from "../systems/rankSystem";
import { STAT_LABELS, STAT_ICONS, STAT_COLORS } from "../constants/labels";
import { TutorialOverlay } from "../components/TutorialOverlay";
import { RankUpOverlay } from "../components/LevelUpOverlay";
import { xpRequiredForLevel } from "../systems/xpSystem";

const STAT_CONFIG = {
  STR: { label: "Fuerza",       color: "#e05555", emoji: "⚔️",  desc: "Potencia en flexiones" },
  AGI: { label: "Agilidad",     color: "#55c080", emoji: "💨",  desc: "Velocidad en sentadillas" },
  END: { label: "Resistencia",  color: "#5599e0", emoji: "🛡️", desc: "Duración en abdominales" },
  VIT: { label: "Vitalidad",    color: "#e055aa", emoji: "❤️",  desc: "Puntos de vida máximos" },
  INT: { label: "Inteligencia", color: "#a07de0", emoji: "🧠",  desc: "Poder mental — sube con Pomodoros" },
};

// ─── Animated Bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ progress, color, height = 8 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(progress, 1),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[barStyles.track, { height, backgroundColor: C.surface2 }]}>
      <Animated.View style={[
        barStyles.fill,
        {
          height,
          backgroundColor: color,
          width: anim.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }),
        }
      ]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { borderRadius: 3, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  fill:  { borderRadius: 3 },
});

// ─── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank, size = "large" }) {
  const isLarge = size === "large";
  return (
    <View style={[
      rankStyles.badge,
      {
        borderColor: rank.color,
        backgroundColor: rank.colorDark,
        width:  isLarge ? 80 : 44,
        height: isLarge ? 80 : 44,
        borderRadius: isLarge ? 8 : 4,
        borderWidth: isLarge ? 2 : 1,
      }
    ]}>
      <Text style={[rankStyles.label, { color: rank.color, fontSize: isLarge ? 28 : 14 }]}>
        {rank.label}
      </Text>
    </View>
  );
}

const rankStyles = StyleSheet.create({
  badge: { justifyContent: "center", alignItems: "center" },
  label: { fontWeight: "900", letterSpacing: 1 },
});

// ─── Statistics Screen ────────────────────────────────────────────────────────
export default function StatisticsScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const [rankingUp, setRankingUp]   = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpValue, setRankUpValue] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = listenToUserProfile(uid, (data) => {
      setProfile(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  const stats        = profile?.stats ?? { STR:0, AGI:0, END:0, VIT:0, INT:0 };
  const totalStats   = getTotalStats(stats);
  const currentRank  = getCurrentRank(profile);
  const nextRank     = getNextRank(currentRank.id);
  const rankProgress = nextRank ? getRankProgress(profile, nextRank) : null;

  // Stat bar max = 500 para visualización
  const STAT_MAX = 500;

  // Verificar si el jugador puede subir de rango
  const canRankUp = nextRank && rankProgress && Object.values(rankProgress).every(r => r.progress >= 1);

  async function handleRankUp() {
    if (!canRankUp || rankingUp) return;
    setRankingUp(true);
    try {
      const uid = auth.currentUser?.uid;
      await updateDoc(doc(db, "users", uid), { rank: nextRank.id });
      setRankUpValue(nextRank);
      setShowRankUp(true);
    } catch(e) {
      console.error(e);
    } finally {
      setRankingUp(false);
    }
  }

  const overviewItems = [
    { label: "NIVEL",             value: profile?.level ?? 1,           color: C.accent },
    { label: "STREAK",            value: `${profile?.streak ?? 0} días`, color: C.success },
    { label: "MONSTRUOS",         value: profile?.monstersKilled ?? 0,  color: "#e05555" },
    { label: "MISIONES",          value: profile?.totalMissions ?? 0,   color: "#5599e0" },
    { label: "XP TOTAL",          value: (profile?.totalXP ?? 0).toLocaleString(), color: C.accent },
    { label: "RÉCORD TORRE",      value: `Piso ${profile?.towerRecord ?? 0}`, color: "#8a4abf" },
  ];

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={g.backBtn}>
            <Text style={g.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={g.headerTitle}>ESTADÍSTICAS</Text>
          <View style={{ width:40 }} />
          <View style={{ width: 70 }} />
        </View>

        {/* ── Rank Card ── */}
        <View style={[styles.rankCard, { borderColor: currentRank.color + "66" }]}>
          <RankBadge rank={currentRank} size="large" />
          <View style={styles.rankInfo}>
            <Text style={styles.rankLabel}>RANGO DE CAZADOR</Text>
            <Text style={[styles.rankTitle, { color: currentRank.color }]}>
              {currentRank.title}
            </Text>
            {nextRank ? (
              <Text style={styles.rankNext}>
                Siguiente rango: <Text style={{ color: nextRank.color, fontWeight:"900" }}>{nextRank.label}</Text>
              </Text>
            ) : (
              <Text style={[styles.rankNext, { color: C.accent }]}>
                ✦ Rango máximo alcanzado
              </Text>
            )}
          </View>
        </View>

        {/* ── Rank Progress ── */}
        {nextRank && rankProgress && (
          <View style={styles.section}>
            <View style={styles.rankProgressHeader}>
              <Text style={[styles.sectionLabel, { marginBottom:0 }]}>PROGRESO AL RANGO {nextRank.label}</Text>
              {canRankUp && (
                <TouchableOpacity
                  style={[styles.rankUpBtn, rankingUp && { opacity:0.5 }]}
                  onPress={handleRankUp}
                  disabled={rankingUp}
                >
                  <Text style={styles.rankUpBtnText}>
                    {rankingUp ? "..." : `⬆ SUBIR A ${nextRank.label}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.rankProgressCard}>
              {[
                { key: "level",          label: "Nivel",              emoji: "⭐" },
                { key: "totalStats",     label: "Stats totales",      emoji: "💪" },
                { key: "monstersKilled", label: "Monstruos derrotados",emoji: "⚔️" },
                { key: "towerFloor",     label: "Piso Torre de Babel", emoji: "🗼" },
              ].map(({ key, label, emoji }) => {
                const req = rankProgress[key];
                const done = req.progress >= 1;
                return (
                  <View key={key} style={styles.reqRow}>
                    <View style={styles.reqLeft}>
                      <Text style={styles.reqEmoji}>{emoji}</Text>
                      <View style={styles.reqInfo}>
                        <Text style={styles.reqLabel}>{label}</Text>
                        <Text style={[styles.reqValues, { color: done ? C.success : C.textDim }]}>
                          {req.current} / {req.required}
                          {done ? "  ✓" : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reqBarContainer}>
                      <AnimatedBar
                        progress={req.progress}
                        color={done ? C.success : nextRank.color}
                        height={6}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Overview Grid ── */}
        <View style={styles.section}>
          <Text style={g.sectionLabel}>RESUMEN</Text>
          <View style={styles.overviewGrid}>
            {overviewItems.map((item) => (
              <View key={item.label} style={styles.overviewCard}>
                <Text style={[styles.overviewValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.overviewLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Stats Bars ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={g.sectionLabel}>ATRIBUTOS</Text>
            <Text style={styles.statsTotalBadge}>Total: {totalStats}</Text>
          </View>
          <View style={styles.statsCard}>
            {Object.entries(STAT_CONFIG).filter(([key]) => {
              if (key === "INT") return (stats.INT ?? 0) > 0;
              return true;
            }).map(([key, cfg]) => {
              const val = stats[key] ?? 0;
              return (
                <View key={key} style={styles.statRow}>
                  <View style={styles.statRowLeft}>
                    <Text style={styles.statEmoji}>{cfg.emoji}</Text>
                    <View>
                      <Text style={[styles.statName, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={styles.statDesc}>{cfg.desc}</Text>
                    </View>
                  </View>
                  <View style={styles.statRowRight}>
                    <Text style={[styles.statValue, { color: cfg.color }]}>{val}</Text>
                    <View style={styles.statBarWrapper}>
                      <AnimatedBar
                        progress={val / STAT_MAX}
                        color={cfg.color}
                        height={7}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── All Ranks ── */}
        <View style={styles.section}>
          <Text style={g.sectionLabel}>TODOS LOS RANGOS</Text>
          <View style={styles.allRanksCard}>
            {RANKS.map((rank, idx) => {
              const isCurrent  = rank.id === currentRank.id;
              const isUnlocked = RANKS.indexOf(currentRank) >= idx;
              return (
                <View
                  key={rank.id}
                  style={[
                    styles.rankRow,
                    isCurrent && { backgroundColor: rank.colorDark, borderColor: rank.color },
                    idx < RANKS.length - 1 && styles.rankRowBorder,
                  ]}
                >
                  <RankBadge rank={rank} size="small" />
                  <View style={styles.rankRowInfo}>
                    <Text style={[styles.rankRowTitle, !isUnlocked && { color: C.textDim }]}>
                      {rank.title}
                    </Text>
                    {rank.requirements && (
                      <Text style={styles.rankRowReq}>
                        Nv.{rank.requirements.level} · {rank.requirements.totalStats} stats · {rank.requirements.monstersKilled} monstruos
                      </Text>
                    )}
                    {!rank.requirements && (
                      <Text style={styles.rankRowReq}>Rango inicial</Text>
                    )}
                  </View>
                  {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: rank.color }]}>
                      <Text style={styles.currentBadgeText}>ACTUAL</Text>
                    </View>
                  )}
                  {!isUnlocked && (
                    <Text style={styles.rankLock}>🔒</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TutorialOverlay sectionKey="statistics" />

      <RankUpOverlay
        visible={showRankUp}
        newRank={rankUpValue}
        onFinish={() => { setShowRankUp(false); setRankUpValue(null); }}
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

  headerRow:   { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingTop:52, paddingBottom:8 },
  backBtn:     { paddingVertical:8, paddingHorizontal:14, borderWidth:1, borderColor:"#e8e0f033", borderRadius:6, alignSelf:"flex-start", backgroundColor:"#e8e0f011" },
  backText:    { color:"#e8e0f0", fontSize:16, fontWeight:"700" },
  headerTitle: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:4, textAlign:"center", paddingHorizontal:16, paddingBottom:12, marginTop:4 },

  // Rank card
  rankCard: {
    backgroundColor:C.surface, borderWidth:1, borderRadius:4,
    padding:16, flexDirection:"row", alignItems:"center",
    gap:16, marginBottom:20,
  },
  rankInfo:  { flex:1, gap:6 },
  rankLabel: { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3 },
  rankTitle: { fontSize:16, fontWeight:"900", letterSpacing:1 },
  rankNext:  { color:C.textDim, fontSize:12 },

  // Section
  section:     { marginBottom:20 },
  sectionRow:  { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  sectionLabel:{ color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:10 },
  statsTotalBadge: { color:C.accent, fontSize:12, fontWeight:"900" },

  // Rank progress
  rankProgressCard:   { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, padding:16, gap:14 },
  rankProgressHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  rankUpBtn:          { backgroundColor:"#e8c84a", paddingHorizontal:12, paddingVertical:8, borderRadius:4 },
  rankUpBtnText:      { color:"#000000", fontSize:11, fontWeight:"900", letterSpacing:1 },
  reqRow:       { gap:8 },
  reqLeft:      { flexDirection:"row", alignItems:"center", gap:10 },
  reqEmoji:     { fontSize:18, width:28 },
  reqInfo:      { flex:1 },
  reqLabel:     { color:C.text, fontSize:13, fontWeight:"700" },
  reqValues:    { fontSize:11, marginTop:2 },
  reqBarContainer: { marginTop:4 },

  // Overview grid
  overviewGrid: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  overviewCard: {
    width:"31%", backgroundColor:C.surface, borderWidth:1,
    borderColor:C.border, borderRadius:4,
    paddingVertical:14, alignItems:"center", gap:4,
  },
  overviewValue: { fontSize:18, fontWeight:"900" },
  overviewLabel: { color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:2, textAlign:"center" },

  // Stats bars
  statsCard:    { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, overflow:"hidden" },
  statRow:      { flexDirection:"row", justifyContent:"space-between", alignItems:"center", padding:14, borderBottomWidth:1, borderBottomColor:C.border },
  statRowLeft:  { flexDirection:"row", alignItems:"center", gap:10, flex:1 },
  statEmoji:    { fontSize:20, width:28 },
  statName:     { fontSize:13, fontWeight:"900" },
  statDesc:     { color:C.textDim, fontSize:10, marginTop:2 },
  statRowRight: { alignItems:"flex-end", gap:6, flex:1 },
  statValue:    { fontSize:20, fontWeight:"900" },
  statBarWrapper: { width:"100%" },

  // All ranks
  allRanksCard:  { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, overflow:"hidden" },
  rankRow:       { flexDirection:"row", alignItems:"center", padding:12, gap:12, borderWidth:1, borderColor:"transparent" },
  rankRowBorder: { borderBottomWidth:1, borderBottomColor:C.border },
  rankRowInfo:   { flex:1 },
  rankRowTitle:  { color:C.text, fontSize:13, fontWeight:"700" },
  rankRowReq:    { color:C.textDim, fontSize:10, marginTop:2 },
  currentBadge:  { paddingHorizontal:8, paddingVertical:3, borderRadius:3 },
  currentBadgeText: { color:C.bg, fontSize:9, fontWeight:"900", letterSpacing:1 },
  rankLock:      { fontSize:14 },
});