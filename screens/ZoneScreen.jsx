import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Animated,
} from "react-native";
import { auth } from "../firebase/config";
import { MONSTERS, BOSSES } from "../constants/monsters";
import { EXERCISES } from "../systems/missionSystem";
import { checkBossDefeated } from "../firebase/firestore";
import { STAT_LABELS, EXERCISE_LABELS } from "../constants/labels";

const C = {
  bg:"#000000", surface:"#0a0a10", surface2:"#05050a",
  border:"#2a2a3d", accent:"#e8c84a", text:"#e8e0f0",
  textDim:"#6a6080", success:"#55c080", danger:"#e05555",
  boss:"#bf4abf", elite:"#e8c84a",
};

const TIER_COLORS = {
  "común":      "#6a8a6a",
  "élite":      "#e8c84a",
  "jefe":       "#bf4abf",
  "legendario": "#e05555",
};

function shouldSpawnEthereal(monsterId, spawnChance = 0.18) {
  const today = new Date().toISOString().split("T")[0];
  const seed  = (monsterId + today).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 100) / 100 < spawnChance;
}

// ─── Monster Card ─────────────────────────────────────────────────────────────
function MonsterCard({ monster, zone, onFight }) {
  const isEthereal = monster.tier === "élite";
  const tierColor  = TIER_COLORS[monster.tier] ?? C.textDim;
  const artH       = 180;

  return (
    <View style={[s.card, { borderColor: isEthereal ? C.elite + "66" : C.border }]}>

      {/* Ethereal banner */}
      {isEthereal && (
        <View style={s.etherealBanner}>
          <Text style={s.etherealText}>✦ APARICIÓN ETÉREA — Raro · 18% de aparición</Text>
        </View>
      )}

      {/* Art area */}
      <View style={[s.artZone, { height: artH, backgroundColor: isEthereal ? "#080814" : "#050510" }]}>
        {monster.art ? (
          <Image source={monster.art} style={s.artImage} resizeMode="contain" />
        ) : (
          <Text style={s.artEmoji}>{monster.emoji ?? "👹"}</Text>
        )}
        <View style={s.artOverlay} />

        {/* Sprite bottom-left */}
        {monster.sprite && (
          <View style={[s.spriteBox, { borderColor: isEthereal ? C.elite : zone.color }]}>
            <Image source={monster.sprite} style={s.spriteImg} resizeMode="contain" />
          </View>
        )}

        {/* XP top-left */}
        <View style={s.xpBadge}>
          <Text style={s.xpBadgeText}>+{monster.xp} XP</Text>
        </View>

        {/* Tier top-right */}
        <View style={[s.tierBadge, { borderColor: tierColor + "44", backgroundColor: tierColor + "11" }]}>
          <Text style={[s.tierText, { color: tierColor }]}>
            {isEthereal ? "✦ ÉLITE" : `◆ ${monster.tier?.toUpperCase()}`}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        <View>
          <Text style={[s.monsterName, isEthereal && { color: C.elite }]}>{monster.name}</Text>
          <Text style={s.monsterDesc}>{monster.description}</Text>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statLabel}>EJERCICIO</Text>
            <Text style={s.statValue}>{EXERCISE_LABELS[monster.exercise] ?? monster.exercise}</Text>
          </View>
          <View style={s.statDivider}/>
          <View style={s.statItem}>
            <Text style={s.statLabel}>META</Text>
            <Text style={s.statValue}>{monster.reps} reps</Text>
          </View>
          <View style={s.statDivider}/>
          <View style={s.statItem}>
            <Text style={s.statLabel}>TIEMPO</Text>
            <Text style={s.statValue}>{monster.timer}s</Text>
          </View>
        </View>

        {/* Rewards */}
        <View style={s.rewardsRow}>
          {Object.entries(monster.statReward || {}).map(([stat, val]) => (
            <View key={stat} style={[s.rewardPill, {
              borderColor: isEthereal ? C.elite + "44" : C.accent + "44",
              backgroundColor: isEthereal ? C.elite + "11" : C.accent + "11",
            }]}>
              <Text style={[s.rewardText, { color: isEthereal ? C.elite : C.accent }]}>
                +{val} {STAT_LABELS[stat] ?? stat}
              </Text>
            </View>
          ))}
        </View>

        {/* Fight button */}
        <TouchableOpacity
          style={[s.fightBtn, {
            backgroundColor: isEthereal ? C.elite + "22" : C.danger + "15",
            borderColor:     isEthereal ? C.elite + "88" : C.danger + "88",
          }]}
          onPress={() => onFight(monster)}
          activeOpacity={0.8}
        >
          <Text style={[s.fightBtnText, { color: isEthereal ? C.elite : C.danger }]}>
            {isEthereal ? "✦  COMBATIR ETÉREO" : "⚔️  COMBATIR"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Boss Card ────────────────────────────────────────────────────────────────
function BossCard({ boss, zone, defeated, onFight }) {
  return (
    <View style={[s.bossCard, { borderColor: defeated ? C.success + "44" : C.boss + "66" }]}>

      {/* Boss art */}
      <View style={[s.bossArtZone, { backgroundColor: "#0a0018" }]}>
        {boss.art ? (
          <Image source={boss.art} style={s.bossArtImage} resizeMode="contain" />
        ) : (
          <Text style={s.bossEmoji}>{boss.emoji}</Text>
        )}
        <View style={[s.bossGlow, { backgroundColor: C.boss + "08" }]} />
        <View style={[s.tierBadge, { borderColor: C.boss + "44", backgroundColor: C.boss + "11", top:10, right:10 }]}>
          <Text style={[s.tierText, { color: C.boss }]}>👑 JEFE DE ZONA</Text>
        </View>
      </View>

      {/* Boss body */}
      <View style={s.cardBody}>
        <View>
          <Text style={s.bossSubtitle}>{boss.name.toUpperCase()}</Text>
          <Text style={[s.monsterName, { color: defeated ? C.success : C.boss, fontSize:18 }]}>
            {boss.description?.split(".")[0]}
          </Text>
          <Text style={[s.monsterDesc, { marginTop:4 }]}>{boss.description}</Text>
        </View>

        {/* XP + rewards */}
        <View style={s.bossRewardRow}>
          <Text style={s.bossXP}>+{boss.xp.toLocaleString()} XP</Text>
          <View style={s.rewardsRow}>
            {Object.entries(boss.statReward || {}).map(([stat, val]) => (
              <View key={stat} style={[s.rewardPill, { borderColor: C.boss + "44", backgroundColor: C.boss + "11" }]}>
                <Text style={[s.rewardText, { color: C.boss }]}>+{val} {STAT_LABELS[stat] ?? stat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Phases */}
        <View style={s.phasesBox}>
          <Text style={s.phasesLabel}>COMBATE EN 3 FASES</Text>
          {boss.phases.map((phase, i) => (
            <View key={i} style={[s.phaseRow, i < boss.phases.length - 1 && s.phaseRowBorder]}>
              <View style={s.phaseNumCircle}>
                <Text style={s.phaseNumText}>{i + 1}</Text>
              </View>
              <View style={s.phaseInfo}>
                <Text style={s.phaseName}>{phase.label}</Text>
                <Text style={s.phaseEx}>{EXERCISE_LABELS[phase.exercise] ?? phase.exercise}</Text>
              </View>
              <View style={s.phaseMeta}>
                <Text style={s.phaseReps}>{phase.reps} reps</Text>
                <Text style={s.phaseTime}>{Math.floor(phase.timer / 60)}min</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        {defeated ? (
          <View style={s.defeatedBadge}>
            <Text style={s.defeatedText}>✓ DERROTADO HOY — REGRESA MAÑANA</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.bossFightBtn} onPress={() => onFight(boss)} activeOpacity={0.8}>
            <Text style={s.bossFightBtnText}>👑  DESAFIAR AL JEFE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── ZoneScreen ───────────────────────────────────────────────────────────────
export default function ZoneScreen({ route, navigation }) {
  const { zone, playerClass, playerGender } = route.params;
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
    } catch(e) { console.error(e); }
    finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    }
  }

  function fightMonster(monster) {
    navigation.navigate("Combat", { mode:"monster", monster, playerClass, playerGender, zone });
  }

  function fightBoss(boss) {
    navigation.navigate("Combat", { mode:"boss", monster:boss, playerClass, playerGender, zone });
  }

  const regularMonsters = (zone.monsters ?? []).map(id => MONSTERS[id]).filter(Boolean);
  const etherealMonsters = (zone.rareMonsters ?? [])
    .map(id => MONSTERS[id]).filter(Boolean)
    .filter(m => shouldSpawnEthereal(m.id, m.spawnChance));
  const allMonsters = [...regularMonsters, ...etherealMonsters];
  const boss = zone.boss ? BOSSES[zone.boss] : null;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.headerRow, { backgroundColor: zone.colorDark }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.headerCenter, { backgroundColor: zone.colorDark }]}>
        <Text style={s.headerEmoji}>{zone.emoji}</Text>
        <Text style={[s.headerName, { color: zone.color }]}>{zone.name.toUpperCase()}</Text>
      </View>
      <Text style={s.headerDesc}>{zone.description}</Text>

      {loading ? (
        <View style={s.loadingBox}><ActivityIndicator color={C.accent} /></View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Monstruos */}
          <Text style={s.sectionLabel}>⚔️ MONSTRUOS — Sin límite diario</Text>
          {allMonsters.map(monster => (
            <MonsterCard key={monster.id} monster={monster} zone={zone} onFight={fightMonster} />
          ))}

          {/* Jefe */}
          {boss ? (
            <>
              <Text style={[s.sectionLabel, { color: C.boss, marginTop:20 }]}>👑 JEFE — 1 vez por día</Text>
              <BossCard boss={boss} zone={zone} defeated={bossDefeated} onFight={fightBoss} />
            </>
          ) : (
            <View style={s.comingSoonBox}>
              <Text style={s.comingSoonEmoji}>👑</Text>
              <Text style={s.comingSoonTitle}>JEFE — PRÓXIMAMENTE</Text>
              <Text style={s.comingSoonSub}>El guardián del bosque está siendo invocado...</Text>
            </View>
          )}

          <View style={{ height:40 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex:1, backgroundColor:C.bg },
  loadingBox: { flex:1, justifyContent:"center", alignItems:"center" },
  scroll:     { paddingHorizontal:16, paddingTop:8 },

  headerRow:    { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingTop:52, paddingBottom:8 },
  backBtn:      { paddingVertical:8, paddingHorizontal:14, borderWidth:1, borderColor:"#e8e0f033", borderRadius:6, alignSelf:"flex-start", backgroundColor:"#e8e0f011" },
  backText:     { color:"#e8e0f0", fontSize:16, fontWeight:"700" },
  headerCenter: { alignItems:"center", gap:4, paddingVertical:10 },
  headerEmoji:  { fontSize:24 },
  headerName:   { fontSize:13, fontWeight:"900", letterSpacing:2 },
  headerDesc:   { color:C.textDim, fontSize:12, textAlign:"center", paddingHorizontal:24, paddingBottom:8, lineHeight:18 },

  sectionLabel: { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3, marginBottom:12 },

  // Monster card
  card:          { backgroundColor:C.surface, borderWidth:1, borderRadius:8, marginBottom:16, overflow:"hidden" },
  etherealBanner:{ backgroundColor:"#e8c84a11", borderBottomWidth:1, borderBottomColor:"#e8c84a33", padding:8, paddingHorizontal:14 },
  etherealText:  { color:C.elite, fontSize:9, fontWeight:"700", letterSpacing:1 },

  artZone:    { justifyContent:"center", alignItems:"center", position:"relative", overflow:"hidden" },
  artImage:   { width:"90%", height:"100%", position:"absolute" },
  artEmoji:   { fontSize:88 },
  artOverlay: { position:"absolute", bottom:0, left:0, right:0, height:50, backgroundColor:"transparent" },

  spriteBox:  { position:"absolute", bottom:10, left:10, width:44, height:54, borderWidth:2, borderRadius:3, backgroundColor:"#000", overflow:"hidden" },
  spriteImg:  { width:"100%", height:"100%" },

  xpBadge:     { position:"absolute", top:10, left:10, backgroundColor:"#e8c84a22", borderWidth:1, borderColor:"#e8c84a44", borderRadius:3, paddingHorizontal:8, paddingVertical:3 },
  xpBadgeText: { color:C.accent, fontSize:10, fontWeight:"700", letterSpacing:1 },

  tierBadge: { position:"absolute", top:10, right:10, borderWidth:1, borderRadius:3, paddingHorizontal:8, paddingVertical:3 },
  tierText:  { fontSize:9, fontWeight:"700", letterSpacing:1 },

  cardBody:    { padding:14, gap:12 },
  monsterName: { color:C.text, fontSize:17, fontWeight:"900", letterSpacing:1 },
  monsterDesc: { color:C.textDim, fontSize:11, lineHeight:17, marginTop:4 },

  statsRow:    { flexDirection:"row", backgroundColor:C.surface2, borderRadius:4, overflow:"hidden" },
  statItem:    { flex:1, paddingVertical:10, alignItems:"center", gap:3 },
  statDivider: { width:1, backgroundColor:C.border },
  statLabel:   { color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:1 },
  statValue:   { color:C.text, fontSize:12, fontWeight:"900" },

  rewardsRow:  { flexDirection:"row", gap:6, flexWrap:"wrap" },
  rewardPill:  { borderWidth:1, borderRadius:3, paddingHorizontal:8, paddingVertical:3 },
  rewardText:  { fontSize:10, fontWeight:"700" },

  fightBtn:     { borderWidth:1, borderRadius:6, paddingVertical:13, alignItems:"center" },
  fightBtnText: { fontSize:12, fontWeight:"900", letterSpacing:2 },

  // Boss card
  bossCard:      { backgroundColor:C.surface, borderWidth:2, borderRadius:8, marginBottom:16, overflow:"hidden" },
  bossArtZone:   { height:220, justifyContent:"center", alignItems:"center", position:"relative", overflow:"hidden" },
  bossArtImage:  { width:"80%", height:"100%", position:"absolute" },
  bossEmoji:     { fontSize:100 },
  bossGlow:      { position:"absolute", inset:0 },
  bossSubtitle:  { color:C.boss, fontSize:10, fontWeight:"900", letterSpacing:3, marginBottom:4 },
  bossRewardRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 },
  bossXP:        { color:C.accent, fontSize:22, fontWeight:"900" },

  phasesBox:      { backgroundColor:C.surface2, borderRadius:6, padding:12, gap:0 },
  phasesLabel:    { color:C.textDim, fontSize:8, fontWeight:"700", letterSpacing:3, marginBottom:10 },
  phaseRow:       { flexDirection:"row", alignItems:"center", gap:10, paddingVertical:8 },
  phaseRowBorder: { borderBottomWidth:1, borderBottomColor:C.border },
  phaseNumCircle: { width:24, height:24, borderRadius:12, backgroundColor:C.boss+"22", borderWidth:1, borderColor:C.boss+"66", justifyContent:"center", alignItems:"center" },
  phaseNumText:   { color:C.boss, fontSize:11, fontWeight:"900" },
  phaseInfo:      { flex:1, gap:2 },
  phaseName:      { color:C.text, fontSize:12, fontWeight:"700" },
  phaseEx:        { color:C.textDim, fontSize:10 },
  phaseMeta:      { alignItems:"flex-end", gap:2 },
  phaseReps:      { color:C.accent, fontSize:13, fontWeight:"900" },
  phaseTime:      { color:C.textDim, fontSize:9 },

  defeatedBadge:   { backgroundColor:C.success+"22", borderTopWidth:1, borderTopColor:C.success+"44", paddingVertical:16, alignItems:"center" },
  defeatedText:    { color:C.success, fontSize:10, fontWeight:"900", letterSpacing:2 },
  bossFightBtn:    { backgroundColor:C.boss+"22", borderWidth:1, borderColor:C.boss, borderRadius:6, paddingVertical:16, alignItems:"center" },
  bossFightBtnText:{ color:C.boss, fontSize:14, fontWeight:"900", letterSpacing:3 },

  comingSoonBox:   { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:8, padding:28, alignItems:"center", gap:8, marginTop:16 },
  comingSoonEmoji: { fontSize:36, opacity:.4 },
  comingSoonTitle: { color:C.textDim, fontSize:11, fontWeight:"900", letterSpacing:3 },
  comingSoonSub:   { color:C.textDim, fontSize:11, fontStyle:"italic" },
});