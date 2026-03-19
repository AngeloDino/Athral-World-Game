import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, ActivityIndicator,
  Dimensions,
} from "react-native";
import { auth } from "../firebase/config";
import { listenToUserProfile } from "../firebase/firestore";
import { xpRequiredForLevel, xpProgress } from "../systems/xpSystem";
import { getCurrentRank } from "../systems/rankSystem";
import { LevelUpOverlay, RankUpOverlay } from "../components/LevelUpOverlay";

const { width: W } = Dimensions.get("window");

const C = {
  bg:           "#0a0a0f",
  surface:      "#12121a",
  surface2:     "#1a1a28",
  border:       "#2a2a3d",
  borderGlow:   "#4a3f8a",
  primary:      "#7c5cbf",
  primaryLight: "#a07de0",
  accent:       "#e8c84a",
  text:         "#e8e0f0",
  textDim:      "#6a6080",
  str:          "#e05555",
  agi:          "#55c080",
  end:          "#5599e0",
  vit:          "#e055aa",
};

const STAT_CONFIG = {
  STR: { label: "STR", color: "#e05555", emoji: "⚔️" },
  AGI: { label: "AGI", color: "#55c080", emoji: "💨" },
  END: { label: "END", color: "#5599e0", emoji: "🛡️" },
  VIT: { label: "VIT", color: "#e055aa", emoji: "❤️" },
};

const MENU_BUTTONS = [
  { id: "training", label: "ENTRENAMIENTO", emoji: "💪", active: true,  desc: "Misiones diarias" },
  { id: "world",    label: "MUNDO",         emoji: "🗺️", active: true,  desc: "Explorar zonas"  },
  { id: "stats",    label: "ESTADÍSTICAS",  emoji: "📊", active: true,  desc: "Tu progreso"     },
];

// ─── XP Bar ───────────────────────────────────────────────────────────────────
function XPBar({ xp, level }) {
  const animWidth = useRef(new Animated.Value(0)).current;
  const progress  = xpProgress(xp, level);
  const required  = xpRequiredForLevel(level);

  useEffect(() => {
    Animated.timing(animWidth, { toValue: progress, duration: 900, useNativeDriver: false }).start();
  }, [xp, level]);

  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpLabelRow}>
        <Text style={styles.xpLabel}>EXPERIENCIA</Text>
        <Text style={styles.xpNumbers}>{xp} / {required} XP</Text>
      </View>
      <View style={styles.xpTrack}>
        <Animated.View style={[
          styles.xpFill,
          { width: animWidth.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }) }
        ]} />
      </View>
    </View>
  );
}

// ─── Main Menu ────────────────────────────────────────────────────────────────
export default function MainMenuScreen({ navigation }) {
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpValue, setLevelUpValue] = useState(null);
  const [showRankUp, setShowRankUp]   = useState(false);
  const [rankUpValue, setRankUpValue] = useState(null);
  const prevLevelRef = useRef(null);
  const prevRankRef  = useRef(null);
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = listenToUserProfile(uid, (data) => {
      if (prevLevelRef.current !== null && data.level > prevLevelRef.current) {
        setLevelUpValue(data.level);
        setShowLevelUp(true);
      }
      const newRank = getCurrentRank(data);
      if (prevRankRef.current !== null && newRank.id !== prevRankRef.current) {
        setRankUpValue(newRank);
        setShowRankUp(true);
      }
      prevLevelRef.current = data.level;
      prevRankRef.current  = newRank.id;
      setProfile(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
    });
    return unsub;
  }, []);

  function handleNav(id) {
    const map = { training:"Training", world:"World", stats:"Statistics" };
    if (map[id]) navigation.navigate(map[id]);
  }

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Cargando mundo...</Text>
      </View>
    );
  }

  const stats       = profile?.stats || { STR:0, AGI:0, END:0, VIT:0 };
  const currentRank = getCurrentRank(profile);
  const streak      = profile?.streak ?? 0;

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ATHRAL</Text>
            <Text style={styles.headerSub}>W O R L D</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.settingsBtn}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Character Card ── */}
        <View style={styles.characterCard}>
          {/* Avatar + nivel */}
          <View style={styles.avatarCol}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🧙</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelLV}>LV</Text>
              <Text style={styles.levelNum}>{profile?.level ?? 1}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.characterInfo}>
            <Text style={styles.username}>{profile?.username ?? "Aventurero"}</Text>

            {/* Rango */}
            <View style={[styles.rankBadge, { borderColor: currentRank.color + "66", backgroundColor: currentRank.colorDark }]}>
              <Text style={[styles.rankLabel, { color: currentRank.color }]}>
                {currentRank.label}  {currentRank.title}
              </Text>
            </View>

            {/* Título y racha */}
            <View style={styles.metaRow}>
              <Text style={styles.titleText}>✦ {profile?.title ?? "Novato"}</Text>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {streak}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── XP Bar ── */}
        <View style={styles.card}>
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </View>

        {/* ── Stats ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ATRIBUTOS</Text>
          <View style={styles.statsGrid}>
            {Object.entries(STAT_CONFIG).map(([key, cfg]) => (
              <View key={key} style={[styles.statCard, { borderColor: cfg.color + "44" }]}>
                <Text style={styles.statEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.statValue, { color: cfg.color }]}>{stats[key] ?? 0}</Text>
                <Text style={styles.statLabel}>{cfg.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.menuSection}>
          {MENU_BUTTONS.map((btn) => (
            <TouchableOpacity
              key={btn.id}
              style={styles.menuBtn}
              onPress={() => handleNav(btn.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.menuBtnEmoji}>{btn.emoji}</Text>
              <View style={styles.menuBtnText}>
                <Text style={styles.menuBtnLabel}>{btn.label}</Text>
                <Text style={styles.menuBtnDesc}>{btn.desc}</Text>
              </View>
              <Text style={styles.menuBtnArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Level Up */}
      <LevelUpOverlay
        visible={showLevelUp}
        newLevel={levelUpValue}
        onFinish={() => setShowLevelUp(false)}
      />

      {/* Rank Up — después del level up */}
      {!showLevelUp && (
        <RankUpOverlay
          visible={showRankUp}
          newRank={rankUpValue}
          onFinish={() => { setShowRankUp(false); setRankUpValue(null); }}
        />
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex:1, backgroundColor:C.bg },
  scroll:      { paddingHorizontal:16, paddingTop:56, paddingBottom:24 },
  loadingRoot: { flex:1, backgroundColor:C.bg, justifyContent:"center", alignItems:"center", gap:16 },
  loadingText: { color:C.textDim, fontSize:13, letterSpacing:2 },

  // Header
  header:       { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  headerTitle:  { color:C.accent, fontSize:28, fontWeight:"900", letterSpacing:10 },
  headerSub:    { color:C.primaryLight, fontSize:11, letterSpacing:8, marginTop:-4 },
  settingsBtn:  { padding:10, borderWidth:1, borderColor:C.border, borderRadius:8 },
  settingsIcon: { fontSize:20 },

  // Character card
  characterCard: {
    backgroundColor:C.surface, borderWidth:1, borderColor:C.borderGlow,
    borderRadius:8, padding:16, flexDirection:"row",
    alignItems:"center", gap:16, marginBottom:12,
  },
  avatarCol:   { alignItems:"center", gap:6 },
  avatar: {
    width:76, height:76, backgroundColor:C.surface2,
    borderWidth:2, borderColor:C.primary, borderRadius:8,
    justifyContent:"center", alignItems:"center",
  },
  avatarEmoji: { fontSize:42 },
  levelBadge:  { backgroundColor:C.accent, paddingHorizontal:12, paddingVertical:3, borderRadius:4, alignItems:"center" },
  levelLV:     { color:C.bg, fontSize:8, fontWeight:"900", letterSpacing:1 },
  levelNum:    { color:C.bg, fontSize:18, fontWeight:"900", lineHeight:20 },

  characterInfo: { flex:1, gap:8 },
  username:      { color:C.text, fontSize:20, fontWeight:"900" },
  rankBadge:     { alignSelf:"flex-start", borderWidth:1, borderRadius:4, paddingHorizontal:10, paddingVertical:4 },
  rankLabel:     { fontSize:11, fontWeight:"900", letterSpacing:1 },
  metaRow:       { flexDirection:"row", alignItems:"center", gap:8 },
  titleText:     { color:C.primaryLight, fontSize:12 },
  streakBadge:   { backgroundColor:"#e8a84a22", borderWidth:1, borderColor:"#e8a84a44", borderRadius:4, paddingHorizontal:8, paddingVertical:2 },
  streakText:    { color:"#e8a84a", fontSize:12, fontWeight:"700" },

  // Card wrapper
  card: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:8, padding:14, marginBottom:12 },

  // XP
  xpContainer: { gap:8 },
  xpLabelRow:  { flexDirection:"row", justifyContent:"space-between" },
  xpLabel:     { color:C.textDim, fontSize:10, letterSpacing:2, fontWeight:"700" },
  xpNumbers:   { color:C.accent, fontSize:11, fontWeight:"700" },
  xpTrack:     { height:12, backgroundColor:"#1e1e2e", borderRadius:6, overflow:"hidden", borderWidth:1, borderColor:C.border },
  xpFill:      { height:"100%", backgroundColor:C.accent, borderRadius:6 },

  // Stats
  sectionLabel: { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3, marginBottom:10 },
  statsGrid:    { flexDirection:"row", gap:8 },
  statCard:     { flex:1, backgroundColor:C.surface2, borderWidth:1, borderRadius:6, paddingVertical:12, alignItems:"center", gap:4 },
  statEmoji:    { fontSize:18 },
  statValue:    { fontSize:20, fontWeight:"900" },
  statLabel:    { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:1 },

  // Menu
  menuSection: { gap:10, marginTop:4 },
  menuBtn: {
    backgroundColor:C.surface, borderWidth:1, borderColor:C.border,
    borderRadius:8, padding:18, flexDirection:"row",
    alignItems:"center", gap:16,
  },
  menuBtnEmoji: { fontSize:30 },
  menuBtnText:  { flex:1 },
  menuBtnLabel: { color:C.accent, fontSize:14, fontWeight:"900", letterSpacing:1 },
  menuBtnDesc:  { color:C.textDim, fontSize:12, marginTop:2 },
  menuBtnArrow: { color:C.textDim, fontSize:28, fontWeight:"300" },
});