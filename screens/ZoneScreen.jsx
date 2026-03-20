import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import { MONSTERS, BOSSES } from "../constants/monsters";
import { EXERCISES } from "../systems/missionSystem";
import { checkBossDefeated } from "../firebase/firestore";

const C = {
  bg:"#0a0a0f", surface:"#12121a", surface2:"#1a1a28",
  border:"#2a2a3d", accent:"#e8c84a", text:"#e8e0f0",
  textDim:"#6a6080", success:"#55c080", danger:"#e05555", boss:"#bf4abf",
};

const TIER_COLORS = {
  "común":      "#6a8a6a",
  "élite":      "#e8c84a",
  "jefe":       "#bf4abf",
  "legendario": "#e05555",
};

export default function ZoneScreen({ route, navigation }) {
  const { zone } = route.params;
  const uid = auth.currentUser?.uid;

  const [bossDefeated, setBossDefeated] = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { loadState(); }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadState);
    return unsub;
  }, [navigation]);

  async function loadState() {
    try {
      setLoading(true);
      if (zone.boss) {
        const defeated = await checkBossDefeated(uid, zone.boss);
        setBossDefeated(defeated);
      }
    } catch (e) {
      console.error("ZoneScreen loadState error:", e);
    } finally {
      setLoading(false);
    }
  }

  function fightMonster(monster) {
    navigation.navigate("Combat", { mode:"monster", monster, playerClass: route.params?.playerClass });
  }

  function fightBoss(boss) {
    navigation.navigate("Combat", { mode:"boss", monster: boss, playerClass: route.params?.playerClass });
  }

  const zoneMonsters = zone.monsters.map(id => MONSTERS[id]).filter(Boolean);
  const boss         = zone.boss ? BOSSES[zone.boss] : null;

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

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Monstruos comunes (repetibles) ── */}
          <Text style={styles.sectionLabel}>⚔️ MONSTRUOS — Sin límite diario</Text>
          {zoneMonsters.map((monster) => {
            const exercise = EXERCISES[monster.exercise];
            return (
              <View key={monster.id} style={styles.monsterCard}>
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
                    <Text style={styles.monsterStatLabel}>XP</Text>
                    <Text style={[styles.monsterStatValue, { color: C.accent }]}>+{monster.xp}</Text>
                  </View>
                </View>

                <View style={styles.rewardRow}>
                  {Object.entries(monster.statReward || {}).map(([stat, val]) => (
                    <View key={stat} style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>+{val} {stat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.fightBtn} onPress={() => fightMonster(monster)} activeOpacity={0.8}>
                  <Text style={styles.fightBtnText}>⚔️  COMBATIR</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* ── Jefe (1 vez por día) ── */}
          {boss && (
            <>
              <Text style={[styles.sectionLabel, { color: C.boss, marginTop: 16 }]}>
                👑 JEFE — 1 vez por día
              </Text>
              <View style={[styles.bossCard, { borderColor: bossDefeated ? C.success + "44" : C.boss + "66" }]}>
                <View style={styles.bossTop}>
                  <Text style={styles.bossEmoji}>{boss.emoji}</Text>
                  <View style={styles.bossInfo}>
                    <Text style={[styles.bossName, { color: bossDefeated ? C.success : C.boss }]}>
                      {boss.name}
                    </Text>
                    <Text style={styles.bossTier}>👑 JEFE DE ZONA</Text>
                    <Text style={styles.bossDesc}>{boss.description}</Text>
                  </View>
                </View>

                {/* Fases */}
                <View style={styles.phasesPreview}>
                  <Text style={styles.phasesLabel}>COMBATE EN 3 FASES</Text>
                  {boss.phases.map((phase, i) => {
                    const ex = EXERCISES[phase.exercise];
                    return (
                      <View key={i} style={styles.phaseRow}>
                        <Text style={styles.phaseNum}>{i + 1}</Text>
                        <Text style={styles.phaseEx}>{ex?.emoji} {ex?.label}</Text>
                        <Text style={styles.phaseReps}>{phase.reps} reps</Text>
                        <Text style={styles.phaseTimer}>{Math.floor(phase.timer / 60)}min</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.bossXPRow}>
                  <Text style={styles.bossXP}>+{boss.xp.toLocaleString()} XP</Text>
                  <View style={styles.bossRewards}>
                    {Object.entries(boss.statReward || {}).map(([stat, val]) => (
                      <View key={stat} style={[styles.rewardBadge, { borderColor: C.boss + "44" }]}>
                        <Text style={[styles.rewardText, { color: C.boss }]}>+{val} {stat}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {bossDefeated ? (
                  <View style={styles.defeatedBadge}>
                    <Text style={styles.defeatedText}>✓ DERROTADO HOY — REGRESA MAÑANA</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.bossFightBtn} onPress={() => fightBoss(boss)} activeOpacity={0.8}>
                    <Text style={styles.bossFightBtnText}>👑  DESAFIAR AL JEFE</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:52, paddingBottom:16 },
  backBtn:{ paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:"#ffffff33", borderRadius:4 },
  backText:{ color:"#ffffff99", fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerInfo:{ alignItems:"center", gap:4 },
  headerEmoji:{ fontSize:28 },
  headerName: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:2 },
  headerDesc: { color:C.textDim, fontSize:12, textAlign:"center", paddingHorizontal:24, paddingVertical:10, lineHeight:18 },
  loadingBox: { flex:1, justifyContent:"center", alignItems:"center" },
  scroll:     { paddingHorizontal:16, paddingTop:4 },
  sectionLabel:{ color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:10 },

  monsterCard: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, padding:14, gap:10, marginBottom:10 },
  monsterTop:  { flexDirection:"row", gap:12, alignItems:"flex-start" },
  monsterEmoji:{ fontSize:36 },
  monsterInfo: { flex:1, gap:3 },
  monsterName: { color:C.text, fontSize:15, fontWeight:"900" },
  monsterTier: { fontSize:9, fontWeight:"700", letterSpacing:2 },
  monsterDesc: { color:C.textDim, fontSize:11, lineHeight:16 },
  monsterStats:{ flexDirection:"row", backgroundColor:C.surface2, borderRadius:4 },
  monsterStatItem:{ flex:1, paddingVertical:8, alignItems:"center", gap:2 },
  monsterStatDivider:{ width:1, backgroundColor:C.border },
  monsterStatLabel:{ color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:1 },
  monsterStatValue:{ color:C.text, fontSize:12, fontWeight:"900" },
  rewardRow:  { flexDirection:"row", gap:6, flexWrap:"wrap" },
  rewardBadge:{ backgroundColor:"#e8c84a22", borderWidth:1, borderColor:"#e8c84a44", borderRadius:3, paddingHorizontal:8, paddingVertical:3 },
  rewardText: { color:C.accent, fontSize:10, fontWeight:"700" },
  fightBtn:   { backgroundColor:C.danger+"22", borderWidth:1, borderColor:C.danger+"88", borderRadius:4, paddingVertical:12, alignItems:"center" },
  fightBtnText:{ color:C.danger, fontSize:12, fontWeight:"900", letterSpacing:2 },

  bossCard:   { backgroundColor:C.surface, borderWidth:2, borderRadius:8, padding:16, gap:12, marginBottom:10 },
  bossTop:    { flexDirection:"row", gap:14, alignItems:"flex-start" },
  bossEmoji:  { fontSize:44 },
  bossInfo:   { flex:1, gap:4 },
  bossName:   { fontSize:18, fontWeight:"900" },
  bossTier:   { fontSize:10, fontWeight:"700", letterSpacing:2, color:C.boss },
  bossDesc:   { color:C.textDim, fontSize:12, lineHeight:17 },
  phasesPreview:{ backgroundColor:C.surface2, borderRadius:4, padding:12, gap:8 },
  phasesLabel:{ color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3, marginBottom:4 },
  phaseRow:   { flexDirection:"row", alignItems:"center", gap:10 },
  phaseNum:   { color:C.boss, fontSize:14, fontWeight:"900", width:16 },
  phaseEx:    { color:C.text, fontSize:13, fontWeight:"700", flex:1 },
  phaseReps:  { color:C.accent, fontSize:12, fontWeight:"700" },
  phaseTimer: { color:C.textDim, fontSize:11, width:35 },
  bossXPRow:  { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  bossXP:     { color:C.accent, fontSize:20, fontWeight:"900" },
  bossRewards:{ flexDirection:"row", gap:6, flexWrap:"wrap" },
  defeatedBadge:{ backgroundColor:C.success+"22", borderWidth:1, borderColor:C.success+"44", borderRadius:4, paddingVertical:12, alignItems:"center" },
  defeatedText: { color:C.success, fontSize:10, fontWeight:"900", letterSpacing:1 },
  bossFightBtn: { backgroundColor:C.boss+"22", borderWidth:1, borderColor:C.boss, borderRadius:6, paddingVertical:16, alignItems:"center" },
  bossFightBtnText:{ color:C.boss, fontSize:14, fontWeight:"900", letterSpacing:2 },
});