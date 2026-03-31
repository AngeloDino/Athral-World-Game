import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Animated,
} from "react-native";
import { auth } from "../firebase/config";
import { MONSTERS, BOSSES } from "../constants/monsters";
import { EXERCISES } from "../systems/missionSystem";
import { checkBossDefeated } from "../firebase/firestore";

const C = {
  bg:"#0a0a0f", surface:"#12121a", surface2:"#1a1a28",
  border:"#2a2a3d", accent:"#e8c84a", text:"#e8e0f0",
  textDim:"#6a6080", success:"#55c080", danger:"#e05555",
  boss:"#bf4abf", elite:"#e8c84a",
};

const TIER_COLORS  = { "común":"#6a8a6a", "élite":"#e8c84a", "jefe":"#bf4abf", "legendario":"#e05555" };

// Calcula si el goblin etéreo aparece hoy (seed basada en fecha)
function shouldSpawnEthereal(monsterId, spawnChance = 0.18) {
  const today = new Date().toISOString().split("T")[0];
  const seed  = (monsterId + today).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 100) / 100 < spawnChance;
}

export default function ZoneScreen({ route, navigation }) {
  const { zone, playerClass } = route.params;
  const uid = auth.currentUser?.uid;

  const [bossDefeated, setBossDefeated] = useState(false);
  const [loading, setLoading]           = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    } catch(e) {
      console.error("ZoneScreen error:", e);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
    }
  }

  function fightMonster(monster) {
    navigation.navigate("Combat", { mode:"monster", monster, playerClass });
  }

  function fightBoss(boss) {
    navigation.navigate("Combat", { mode:"boss", monster:boss, playerClass });
  }

  // Construir lista de monstruos — incluir etéreos si corresponde
  const regularMonsters = (zone.monsters ?? [])
    .map(id => MONSTERS[id])
    .filter(Boolean);

  const etherealMonsters = (zone.rareMonsters ?? [])
    .map(id => MONSTERS[id])
    .filter(Boolean)
    .filter(m => shouldSpawnEthereal(m.id, m.spawnChance));

  const allMonsters = [...regularMonsters, ...etherealMonsters];
  const boss        = zone.boss ? BOSSES[zone.boss] : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: zone.colorDark }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← VOLVER</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmoji}>{zone.emoji}</Text>
          <Text style={[styles.headerName, { color: zone.color }]}>{zone.name.toUpperCase()}</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <Text style={styles.headerDesc}>{zone.description}</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >
          {/* ── Monstruos ── */}
          <Text style={styles.sectionLabel}>⚔️ MONSTRUOS — Sin límite diario</Text>

          {allMonsters.map((monster) => {
            const exercise  = EXERCISES[monster.exercise];
            const isEthereal = monster.tier === "élite";
            return (
              <View key={monster.id} style={[
                styles.monsterCard,
                { borderColor: isEthereal ? C.elite + "88" : C.border },
                isEthereal && { backgroundColor:"#1a1808" },
              ]}>
                {isEthereal && (
                  <View style={styles.etherealBanner}>
                    <Text style={styles.etherealText}>✦ APARICIÓN ETÉREA — Raro</Text>
                  </View>
                )}

                {/* Arte completo del monstruo */}
                <View style={[styles.monsterArtContainer, { backgroundColor: zone.colorDark }]}>
                  {monster.art && (
                    <Image source={monster.art} style={styles.monsterArt} resizeMode="contain" />
                  )}
                  {/* Sprite en esquina */}
                  {monster.sprite && (
                    <View style={[styles.monsterSpriteBox, { borderColor: isEthereal ? C.elite : zone.color }]}>
                      <Image source={monster.sprite} style={styles.monsterSprite} resizeMode="contain" />
                    </View>
                  )}
                  {/* Tier badge */}
                  <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[monster.tier] + "22", borderColor: TIER_COLORS[monster.tier] + "66" }]}>
                    <Text style={[styles.tierText, { color: TIER_COLORS[monster.tier] }]}>
                      ◆ {monster.tier?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.monsterInfo}>
                  <Text style={[styles.monsterName, { color: isEthereal ? C.elite : C.text }]}>{monster.name}</Text>
                  <Text style={styles.monsterDesc}>{monster.description}</Text>

                  {/* Stats row */}
                  <View style={styles.monsterStats}>
                    <View style={styles.monsterStatItem}>
                      <Text style={styles.monsterStatLabel}>EJERCICIO</Text>
                      <Text style={styles.monsterStatValue}>{exercise?.label}</Text>
                    </View>
                    <View style={styles.monsterStatDivider}/>
                    <View style={styles.monsterStatItem}>
                      <Text style={styles.monsterStatLabel}>META</Text>
                      <Text style={styles.monsterStatValue}>{monster.reps} reps</Text>
                    </View>
                    <View style={styles.monsterStatDivider}/>
                    <View style={styles.monsterStatItem}>
                      <Text style={styles.monsterStatLabel}>XP</Text>
                      <Text style={[styles.monsterStatValue, { color: C.accent }]}>+{monster.xp}</Text>
                    </View>
                  </View>

                  {/* Rewards */}
                  <View style={styles.rewardRow}>
                    {Object.entries(monster.statReward || {}).map(([stat, val]) => (
                      <View key={stat} style={[styles.rewardBadge, { borderColor: isEthereal ? C.elite + "44" : C.accent + "44" }]}>
                        <Text style={[styles.rewardText, { color: isEthereal ? C.elite : C.accent }]}>+{val} {stat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.fightBtn, { borderColor: isEthereal ? C.elite : C.danger, backgroundColor: isEthereal ? C.elite + "15" : C.danger + "15" }]}
                    onPress={() => fightMonster(monster)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fightBtnText, { color: isEthereal ? C.elite : C.danger }]}>
                      {isEthereal ? "✦  COMBATIR ETÉREO" : "⚔️  COMBATIR"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* ── Jefe ── */}
          {boss ? (
            <>
              <Text style={[styles.sectionLabel, { color: C.boss, marginTop:16 }]}>
                👑 JEFE — 1 vez por día
              </Text>
              <View style={[styles.bossCard, { borderColor: bossDefeated ? C.success + "44" : C.boss + "66" }]}>
                <View style={styles.bossTop}>
                  <Text style={styles.bossEmoji}>{boss.emoji}</Text>
                  <View style={styles.bossInfo}>
                    <Text style={[styles.bossName, { color: bossDefeated ? C.success : C.boss }]}>{boss.name}</Text>
                    <Text style={styles.bossTier}>👑 JEFE DE ZONA</Text>
                    <Text style={styles.bossDesc}>{boss.description}</Text>
                  </View>
                </View>
                <View style={styles.phasesPreview}>
                  <Text style={styles.phasesLabel}>COMBATE EN 3 FASES</Text>
                  {boss.phases.map((phase, i) => {
                    const ex = EXERCISES[phase.exercise];
                    return (
                      <View key={i} style={styles.phaseRow}>
                        <Text style={[styles.phaseNum, { color: C.boss }]}>{i + 1}</Text>
                        <Text style={styles.phaseEx}>{ex?.label}</Text>
                        <Text style={styles.phaseReps}>{phase.reps} reps</Text>
                        <Text style={styles.phaseTimer}>{Math.floor(phase.timer / 60)}min</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.bossXPRow}>
                  <Text style={styles.bossXP}>+{boss.xp.toLocaleString()} XP</Text>
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
          ) : (
            <View style={styles.bossComingSoon}>
              <Text style={styles.bossComingSoonEmoji}>👑</Text>
              <Text style={styles.bossComingSoonTitle}>JEFE — PRÓXIMAMENTE</Text>
              <Text style={styles.bossComingSoonSub}>El guardián del bosque está siendo invocado...</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex:1, backgroundColor:C.bg },
  loadingBox: { flex:1, justifyContent:"center", alignItems:"center" },
  scroll:     { paddingHorizontal:16, paddingTop:4 },

  header:      { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:52, paddingBottom:16 },
  backBtn:     { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:"#ffffff33", borderRadius:4 },
  backText:    { color:"#ffffff99", fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerInfo:  { alignItems:"center", gap:4 },
  headerEmoji: { fontSize:26 },
  headerName:  { fontSize:14, fontWeight:"900", letterSpacing:2 },
  headerDesc:  { color:C.textDim, fontSize:12, textAlign:"center", paddingHorizontal:24, paddingVertical:8, lineHeight:18 },

  sectionLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:10 },

  // Monster card
  monsterCard:        { backgroundColor:C.surface, borderWidth:1, borderRadius:8, marginBottom:14, overflow:"hidden" },
  etherealBanner:     { backgroundColor:"#e8c84a22", paddingVertical:6, paddingHorizontal:14, borderBottomWidth:1, borderBottomColor:"#e8c84a44" },
  etherealText:       { color:C.elite, fontSize:10, fontWeight:"900", letterSpacing:2 },

  monsterArtContainer:{ height:180, justifyContent:"center", alignItems:"center", position:"relative" },
  monsterArt:         { width:"90%", height:"100%", position:"absolute" },
  monsterSpriteBox:   { position:"absolute", bottom:10, left:10, width:44, height:54, borderWidth:2, borderRadius:3, backgroundColor:"#0a0a0f", overflow:"hidden" },
  monsterSprite:      { width:"100%", height:"100%" },
  tierBadge:          { position:"absolute", top:10, right:10, borderWidth:1, borderRadius:4, paddingHorizontal:8, paddingVertical:3 },
  tierText:           { fontSize:9, fontWeight:"900", letterSpacing:1 },

  monsterInfo:        { padding:14, gap:10 },
  monsterName:        { fontSize:16, fontWeight:"900" },
  monsterDesc:        { color:C.textDim, fontSize:12, lineHeight:17 },

  monsterStats:       { flexDirection:"row", backgroundColor:C.surface2, borderRadius:4 },
  monsterStatItem:    { flex:1, paddingVertical:8, alignItems:"center", gap:2 },
  monsterStatDivider: { width:1, backgroundColor:C.border },
  monsterStatLabel:   { color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:1 },
  monsterStatValue:   { color:C.text, fontSize:12, fontWeight:"900" },

  rewardRow:   { flexDirection:"row", gap:6 },
  rewardBadge: { borderWidth:1, borderRadius:3, paddingHorizontal:8, paddingVertical:3 },
  rewardText:  { fontSize:10, fontWeight:"700" },

  fightBtn:     { borderWidth:1, borderRadius:4, paddingVertical:12, alignItems:"center" },
  fightBtnText: { fontSize:12, fontWeight:"900", letterSpacing:2 },

  // Boss
  bossCard:       { backgroundColor:C.surface, borderWidth:2, borderRadius:8, padding:16, gap:12, marginBottom:10 },
  bossTop:        { flexDirection:"row", gap:14, alignItems:"flex-start" },
  bossEmoji:      { fontSize:40 },
  bossInfo:       { flex:1, gap:4 },
  bossName:       { fontSize:16, fontWeight:"900" },
  bossTier:       { fontSize:10, fontWeight:"700", letterSpacing:2, color:C.boss },
  bossDesc:       { color:C.textDim, fontSize:12, lineHeight:17 },
  phasesPreview:  { backgroundColor:C.surface2, borderRadius:4, padding:12, gap:8 },
  phasesLabel:    { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3, marginBottom:4 },
  phaseRow:       { flexDirection:"row", alignItems:"center", gap:10 },
  phaseNum:       { fontSize:14, fontWeight:"900", width:16 },
  phaseEx:        { color:C.text, fontSize:13, fontWeight:"700", flex:1 },
  phaseReps:      { color:C.accent, fontSize:12, fontWeight:"700" },
  phaseTimer:     { color:C.textDim, fontSize:11, width:35 },
  bossXPRow:      { flexDirection:"row", alignItems:"center" },
  bossXP:         { color:C.accent, fontSize:20, fontWeight:"900" },
  defeatedBadge:  { backgroundColor:C.success + "22", borderWidth:1, borderColor:C.success + "44", borderRadius:4, paddingVertical:12, alignItems:"center" },
  defeatedText:   { color:C.success, fontSize:10, fontWeight:"900", letterSpacing:1 },
  bossFightBtn:   { backgroundColor:C.boss + "22", borderWidth:1, borderColor:C.boss, borderRadius:6, paddingVertical:16, alignItems:"center" },
  bossFightBtnText:{ color:C.boss, fontSize:14, fontWeight:"900", letterSpacing:2 },

  // Boss coming soon
  bossComingSoon:      { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:8, padding:24, alignItems:"center", gap:8, marginTop:16 },
  bossComingSoonEmoji: { fontSize:36, opacity:0.4 },
  bossComingSoonTitle: { color:C.textDim, fontSize:12, fontWeight:"900", letterSpacing:3 },
  bossComingSoonSub:   { color:C.textDim, fontSize:11, fontStyle:"italic" },
});