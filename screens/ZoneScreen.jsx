import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import { MONSTERS, EXERCISES as MONSTER_EXERCISES } from "../constants/monsters";
import { EXERCISES } from "../systems/missionSystem";
import { checkMonsterDefeated } from "../firebase/firestore";

const C = {
  bg:      "#0a0a0f",
  surface: "#12121a",
  surface2:"#1a1a28",
  border:  "#2a2a3d",
  accent:  "#e8c84a",
  text:    "#e8e0f0",
  textDim: "#6a6080",
  success: "#55c080",
  danger:  "#e05555",
};

const TIER_COLORS = {
  "común":      "#6a8a6a",
  "élite":      "#e8c84a",
  "jefe":       "#e05555",
  "legendario": "#bf4abf",
};

export default function ZoneScreen({ route, navigation }) {
  const { zone } = route.params;
  const uid = auth.currentUser?.uid;

  const [monsterStates, setMonsterStates] = useState({});
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    loadMonsterStates();
  }, []);

  // Recargar estado al volver del combate
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      loadMonsterStates();
    });
    return unsub;
  }, [navigation]);

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
    navigation.navigate("Combat", { mode: "monster", monster });
  }

  const zoneMonsters = zone.monsters.map(id => MONSTERS[id]).filter(Boolean);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: zone.colorDark }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← VOLVER</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmoji}>{zone.emoji}</Text>
          <Text style={styles.headerName}>{zone.name}</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <Text style={styles.headerDesc}>{zone.description}</Text>

      {/* Monster list */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.accent} />
          <Text style={styles.loadingText}>Cargando monstruos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>MONSTRUOS DISPONIBLES</Text>
          {zoneMonsters.map((monster) => {
            const defeated = monsterStates[monster.id];
            const exercise = EXERCISES[monster.exercise];
            return (
              <View
                key={monster.id}
                style={[styles.monsterCard, defeated && styles.monsterCardDefeated]}
              >
                <View style={styles.monsterTop}>
                  <Text style={styles.monsterEmoji}>{monster.emoji}</Text>
                  <View style={styles.monsterInfo}>
                    <Text style={styles.monsterName}>{monster.name}</Text>
                    <Text style={[styles.monsterTier, { color: TIER_COLORS[monster.tier] }]}>
                      ◆ {monster.tier?.toUpperCase()}
                    </Text>
                    <Text style={styles.monsterDesc}>{monster.description}</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={styles.monsterStats}>
                  <View style={styles.monsterStatItem}>
                    <Text style={styles.monsterStatLabel}>EJERCICIO</Text>
                    <Text style={styles.monsterStatValue}>{exercise?.emoji} {exercise?.label}</Text>
                  </View>
                  <View style={styles.monsterStatDivider} />
                  <View style={styles.monsterStatItem}>
                    <Text style={styles.monsterStatLabel}>META</Text>
                    <Text style={styles.monsterStatValue}>{monster.reps} reps</Text>
                  </View>
                  <View style={styles.monsterStatDivider} />
                  <View style={styles.monsterStatItem}>
                    <Text style={styles.monsterStatLabel}>RECOMPENSA</Text>
                    <Text style={[styles.monsterStatValue, { color: C.accent }]}>+{monster.xp} XP</Text>
                  </View>
                </View>

                {/* Stat rewards */}
                <View style={styles.rewardRow}>
                  {Object.entries(monster.statReward || {}).map(([stat, val]) => (
                    <View key={stat} style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>+{val} {stat}</Text>
                    </View>
                  ))}
                </View>

                {/* Action */}
                {defeated ? (
                  <View style={styles.defeatedBadge}>
                    <Text style={styles.defeatedText}>✓ DERROTADO HOY — REGRESA MAÑANA</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.fightBtn}
                    onPress={() => startCombat(monster)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fightBtnText}>⚔️  COMBATIR</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },

  header:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:52, paddingBottom:16 },
  backBtn:    { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:"#ffffff33", borderRadius:4 },
  backText:   { color:"#ffffff99", fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerInfo: { alignItems:"center", gap:4 },
  headerEmoji:{ fontSize:28 },
  headerName: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:2 },
  headerDesc: { color:C.textDim, fontSize:12, textAlign:"center", paddingHorizontal:24, paddingVertical:12, lineHeight:18 },

  loadingBox:  { flex:1, justifyContent:"center", alignItems:"center", gap:12 },
  loadingText: { color:C.textDim, fontSize:12, letterSpacing:2 },

  scroll:       { paddingHorizontal:16, paddingTop:8 },
  sectionLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:12 },

  monsterCard: {
    backgroundColor:C.surface, borderWidth:1, borderColor:C.border,
    borderRadius:4, padding:16, gap:12, marginBottom:12,
  },
  monsterCardDefeated: { opacity:0.45 },
  monsterTop:   { flexDirection:"row", gap:14, alignItems:"flex-start" },
  monsterEmoji: { fontSize:40 },
  monsterInfo:  { flex:1, gap:4 },
  monsterName:  { color:C.text, fontSize:16, fontWeight:"900" },
  monsterTier:  { fontSize:10, fontWeight:"700", letterSpacing:2 },
  monsterDesc:  { color:C.textDim, fontSize:12, lineHeight:18 },

  monsterStats:       { flexDirection:"row", backgroundColor:C.surface2, borderRadius:4 },
  monsterStatItem:    { flex:1, paddingVertical:10, alignItems:"center", gap:3 },
  monsterStatDivider: { width:1, backgroundColor:C.border },
  monsterStatLabel:   { color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:2 },
  monsterStatValue:   { color:C.text, fontSize:13, fontWeight:"900" },

  rewardRow:   { flexDirection:"row", gap:8, flexWrap:"wrap" },
  rewardBadge: { backgroundColor:"#e8c84a22", borderWidth:1, borderColor:"#e8c84a44", borderRadius:3, paddingHorizontal:10, paddingVertical:4 },
  rewardText:  { color:C.accent, fontSize:11, fontWeight:"700" },

  defeatedBadge: { backgroundColor:C.success+"22", borderWidth:1, borderColor:C.success+"44", borderRadius:4, paddingVertical:12, alignItems:"center" },
  defeatedText:  { color:C.success, fontSize:10, fontWeight:"900", letterSpacing:1 },

  fightBtn:     { backgroundColor:C.danger+"22", borderWidth:1, borderColor:C.danger+"88", borderRadius:4, paddingVertical:14, alignItems:"center" },
  fightBtnText: { color:C.danger, fontSize:13, fontWeight:"900", letterSpacing:2 },
});