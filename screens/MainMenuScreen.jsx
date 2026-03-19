import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { auth } from "../firebase/config";
import { listenToUserProfile } from "../firebase/firestore";
import { logoutUser } from "../firebase/auth";
import { xpRequiredForLevel, xpProgress } from "../systems/xpSystem";
import { getCurrentRank } from "../systems/rankSystem";
import { LevelUpOverlay, RankUpOverlay } from "../components/LevelUpOverlay";

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg:           "#0a0a0f",
  surface:      "#12121a",
  surface2:     "#1a1a28",
  border:       "#2a2a3d",
  borderGlow:   "#4a3f8a",
  primary:      "#7c5cbf",
  primaryLight: "#a07de0",
  accent:       "#e8c84a",
  accentDim:    "#a08a2a",
  text:         "#e8e0f0",
  textDim:      "#6a6080",
  str:          "#e05555",
  agi:          "#55c080",
  end:          "#5599e0",
  vit:          "#e055aa",
  xpBar:        "#e8c84a",
  xpTrack:      "#1e1e2e",
};

const STAT_CONFIG = {
  STR: { label: "STR", color: C.str, emoji: "⚔️" },
  AGI: { label: "AGI", color: C.agi, emoji: "💨" },
  END: { label: "END", color: C.end, emoji: "🛡️" },
  VIT: { label: "VIT", color: C.vit, emoji: "❤️" },
};

const MENU_BUTTONS = [
  { id: "training", label: "ENTRENAMIENTO", emoji: "💪", active: true,  desc: "Misiones diarias" },
  { id: "world",    label: "MUNDO",          emoji: "🗺️", active: true,  desc: "Explorar zonas" },
  { id: "stats",    label: "ESTADÍSTICAS",   emoji: "📊", active: true,  desc: "Tu progreso" },
  { id: "clan",     label: "CLAN",           emoji: "⚔️", active: false, desc: "Próximamente" },
  { id: "shop",     label: "TIENDA",         emoji: "🏪", active: false, desc: "Próximamente" },
  { id: "events",   label: "EVENTOS",        emoji: "🌟", active: false, desc: "Próximamente" },
];

// ─── XP Bar Component ─────────────────────────────────────────────────────────
function XPBar({ xp, level }) {
  const animWidth = useRef(new Animated.Value(0)).current;
  const progress = xpProgress(xp, level);
  const required = xpRequiredForLevel(level);

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [xp, level]);

  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpLabelRow}>
        <Text style={styles.xpLabel}>EXPERIENCIA</Text>
        <Text style={styles.xpNumbers}>{xp} / {required} XP</Text>
      </View>
      <View style={styles.xpTrack}>
        <Animated.View
          style={[
            styles.xpFill,
            { width: animWidth.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] }) },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ statKey, value }) {
  const { label, color, emoji } = STAT_CONFIG[statKey];
  return (
    <View style={[styles.statCard, { borderColor: color + "44" }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MainMenuScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Level up / rank up
  const [showLevelUp, setShowLevelUp]   = useState(false);
  const [levelUpValue, setLevelUpValue] = useState(null);
  const [showRankUp, setShowRankUp]     = useState(false);
  const [rankUpValue, setRankUpValue]   = useState(null);
  const prevLevelRef = useRef(null);
  const prevRankRef  = useRef(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = listenToUserProfile(uid, (data) => {
      // Detectar level up
      if (prevLevelRef.current !== null && data.level > prevLevelRef.current) {
        setLevelUpValue(data.level);
        setShowLevelUp(true);
      }

      // Detectar rank up
      const newRank  = getCurrentRank(data);
      if (prevRankRef.current !== null && newRank.id !== prevRankRef.current) {
        setRankUpValue(newRank);
        setShowRankUp(true);
      }

      prevLevelRef.current = data.level;
      prevRankRef.current  = getCurrentRank(data).id;

      setProfile(data);
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    });

    return unsub;
  }, []);

  async function handleLogout() {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir del mundo?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: async () => await logoutUser() },
      ]
    );
  }

  function handleNav(buttonId) {
    switch (buttonId) {
      case "training":   navigation.navigate("Training");   break;
      case "world":      navigation.navigate("World");      break;
      case "stats":      navigation.navigate("Statistics"); break;
      default: break;
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Cargando mundo...</Text>
      </View>
    );
  }

  const stats = profile?.stats || { STR: 0, AGI: 0, END: 0, VIT: 0 };

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ATHRAL</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>✕ SALIR</Text>
          </TouchableOpacity>
        </View>

        {/* ── Character Card ── */}
        <View style={styles.characterCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🧙</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LV</Text>
              <Text style={styles.levelNumber}>{profile?.level ?? 1}</Text>
            </View>
          </View>

          <View style={styles.characterInfo}>
            <Text style={styles.username}>{profile?.username ?? "Aventurero"}</Text>
            <Text style={styles.titleBadge}>✦ {profile?.title ?? "Novato"}</Text>
            <Text style={styles.clanText}>
              {profile?.clan ? `⚔️ ${profile.clan}` : "⚔️ Sin clan"}
            </Text>
          </View>
        </View>

        {/* ── XP Bar ── */}
        <View style={styles.section}>
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </View>

        {/* ── Stats ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ESTADÍSTICAS</Text>
          <View style={styles.statsGrid}>
            {Object.keys(STAT_CONFIG).map((key) => (
              <StatCard key={key} statKey={key} value={stats[key] ?? 0} />
            ))}
          </View>
        </View>

        {/* ── Menu Buttons ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MENÚ</Text>
          <View style={styles.menuGrid}>
            {MENU_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.id}
                style={[styles.menuBtn, !btn.active && styles.menuBtnDisabled]}
                onPress={() => btn.active && handleNav(btn.id)}
                activeOpacity={btn.active ? 0.7 : 1}
              >
                <Text style={styles.menuBtnEmoji}>{btn.emoji}</Text>
                <Text style={[styles.menuBtnLabel, !btn.active && styles.menuBtnLabelDim]}>
                  {btn.label}
                </Text>
                <Text style={styles.menuBtnDesc}>{btn.desc}</Text>
                {!btn.active && (
                  <View style={styles.lockedOverlay}>
                    <Text style={styles.lockedText}>🔒</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 32 },
  loadingRoot: { flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: C.textDim, fontSize: 13, letterSpacing: 2 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { color: C.accent, fontSize: 22, fontWeight: "900", letterSpacing: 8 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border, borderRadius: 4 },
  logoutText: { color: C.textDim, fontSize: 11, letterSpacing: 1, fontWeight: "700" },

  // Character Card
  characterCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderGlow,
    borderRadius: 4, padding: 16, flexDirection: "row", alignItems: "center",
    gap: 16, marginBottom: 12,
  },
  avatarContainer: { alignItems: "center", gap: 6 },
  avatar: {
    width: 72, height: 72, backgroundColor: C.surface2,
    borderWidth: 2, borderColor: C.primary, borderRadius: 4,
    justifyContent: "center", alignItems: "center",
  },
  avatarEmoji: { fontSize: 40 },
  levelBadge: {
    backgroundColor: C.accent, paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 2, alignItems: "center",
  },
  levelText: { color: C.bg, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  levelNumber: { color: C.bg, fontSize: 16, fontWeight: "900", lineHeight: 18 },
  characterInfo: { flex: 1, gap: 6 },
  username: { color: C.text, fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  titleBadge: { color: C.primaryLight, fontSize: 12, letterSpacing: 1 },
  clanText: { color: C.textDim, fontSize: 12 },

  // XP
  section: { marginBottom: 20 },
  sectionLabel: { color: C.textDim, fontSize: 10, fontWeight: "700", letterSpacing: 3, marginBottom: 10 },
  xpContainer: { gap: 6 },
  xpLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  xpLabel: { color: C.textDim, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  xpNumbers: { color: C.accent, fontSize: 11, fontWeight: "700" },
  xpTrack: {
    height: 10, backgroundColor: C.xpTrack, borderRadius: 2,
    overflow: "hidden", borderWidth: 1, borderColor: C.border,
  },
  xpFill: { height: "100%", backgroundColor: C.xpBar, borderRadius: 2 },

  // Stats
  statsGrid: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1,
    borderRadius: 4, paddingVertical: 12, alignItems: "center", gap: 4,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { color: C.textDim, fontSize: 9, fontWeight: "700", letterSpacing: 2 },

  // Menu
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  menuBtn: {
    width: "31%", backgroundColor: C.surface, borderWidth: 1,
    borderColor: C.border, borderRadius: 4, padding: 14,
    alignItems: "center", gap: 4, overflow: "hidden",
  },
  menuBtnDisabled: { opacity: 0.5 },
  menuBtnEmoji: { fontSize: 26 },
  menuBtnLabel: { color: C.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1, textAlign: "center" },
  menuBtnLabelDim: { color: C.textDim },
  menuBtnDesc: { color: C.textDim, fontSize: 9, textAlign: "center" },
  lockedOverlay: { position: "absolute", top: 4, right: 4 },
  lockedText: { fontSize: 10 },
  bottomSpacer: { height: 20 }
});