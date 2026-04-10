import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Animated, ImageBackground } from "react-native";
import { auth } from "../firebase/config";
import { MONSTERS, BOSSES } from "../constants/monsters";
import { EXERCISES } from "../systems/missionSystem";
import { checkBossDefeated } from "../firebase/firestore";
import { STAT_LABELS, EXERCISE_LABELS } from "../constants/labels";
import g from "../constants/globalStyles";
import { colors as C, spacing as S, typography as T, radius as R } from "../constants/theme";

const TIER_COLORS = { "común":"#6a8a6a", "élite":"#e8c84a", "jefe":"#bf4abf", "legendario":"#e05555" };

const ZONE_BACKGROUNDS = {
  dark_forest: require("../assets/zones/dark_forest_bg.png"),
};

function shouldSpawnEthereal(monsterId, spawnChance = 0.18) {
  const today = new Date().toISOString().split("T")[0];
  const seed  = (monsterId + today).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 100) / 100 < spawnChance;
}

function MonsterCard({ monster, zone, onFight }) {
  const isEthereal = monster.tier === "élite";
  const tierColor  = TIER_COLORS[monster.tier] ?? C.textDim;

  return (
    <View style={[g.card, { borderColor: isEthereal ? C.elite + "66" : C.border }]}>
      {isEthereal && (
        <View style={s.etherealBanner}>
          <Text style={s.etherealText}>✦ APARICIÓN ETÉREA — Raro · 18% de aparición</Text>
        </View>
      )}
      <View style={[s.artZone, { backgroundColor: isEthereal ? "#08081499" : "#05051099" }]}>
        {monster.art
          ? <Image source={monster.art} style={s.artImage} resizeMode="contain" />
          : <Text style={s.artEmoji}>{monster.emoji ?? "👹"}</Text>}
        <View style={s.artOverlay} />
        {monster.sprite && (
          <View style={[s.spriteBox, { borderColor: isEthereal ? C.elite : zone.color }]}>
            <Image source={monster.sprite} style={s.spriteImg} resizeMode="contain" />
          </View>
        )}
        <View style={[g.badge, s.xpBadge]}>
          <Text style={[g.badgeText, { color: C.accent }]}>+{monster.xp} XP</Text>
        </View>
        <View style={[g.badge, s.tierBadge, { borderColor: tierColor + "44", backgroundColor: tierColor + "11" }]}>
          <Text style={[g.badgeText, { color: tierColor }]}>{isEthereal ? "✦ ÉLITE" : `◆ ${monster.tier?.toUpperCase()}`}</Text>
        </View>
      </View>
      <View style={g.cardBody}>
        <Text style={[g.cardTitle, { fontSize: T.lg }, isEthereal && { color: C.elite }]}>{monster.name}</Text>
        <Text style={[g.cardSubtitle, { color:"#a09ab8" }]}>{monster.description}</Text>
        <View style={[g.statsRow, { backgroundColor:"#101018ee" }]}>
          <View style={g.statItem}><Text style={g.statLabel}>EJERCICIO</Text><Text style={[g.statValue, { color: C.text }]}>{EXERCISE_LABELS[monster.exercise] ?? monster.exercise}</Text></View>
          <View style={g.statDivider}/>
          <View style={g.statItem}><Text style={g.statLabel}>META</Text><Text style={[g.statValue, { color: C.text }]}>{monster.reps} reps</Text></View>
          <View style={g.statDivider}/>
          <View style={g.statItem}><Text style={g.statLabel}>TIEMPO</Text><Text style={[g.statValue, { color: C.text }]}>{monster.timer}s</Text></View>
        </View>
        <View style={g.row}>
          {Object.entries(monster.statReward || {}).map(([stat, val]) => (
            <View key={stat} style={[g.pill, { borderColor: isEthereal ? C.elite+"44":C.accent+"44", backgroundColor: isEthereal ? C.elite+"11":C.accent+"11", marginRight: S.xs }]}>
              <Text style={[g.pillText, { color: isEthereal ? C.elite : C.accent }]}>+{val} {STAT_LABELS[stat] ?? stat}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={isEthereal ? [g.btnOutline, { borderColor: C.elite+"88", backgroundColor: C.elite+"22" }] : g.btnDanger}
          onPress={() => onFight(monster)} activeOpacity={0.8}>
          <Text style={isEthereal ? [g.btnOutlineText, { color: C.elite }] : g.btnDangerText}>
            {isEthereal ? "✦  COMBATIR ETÉREO" : "⚔️  COMBATIR"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BossCard({ boss, zone, defeated, onFight }) {
  return (
    <View style={[g.card, { borderWidth:2, borderColor: defeated ? C.success+"44" : C.boss+"66", backgroundColor:"#0a0a10dd" }]}>
      <View style={[s.artZone, { height:220, backgroundColor:"#0a0018" }]}>
        {boss.art
          ? <Image source={boss.art} style={s.artImage} resizeMode="contain" />
          : <Text style={[s.artEmoji, { fontSize:100 }]}>{boss.emoji}</Text>}
        <View style={[g.badge, s.tierBadge, { borderColor: C.boss+"44", backgroundColor: C.boss+"11" }]}>
          <Text style={[g.badgeText, { color: C.boss }]}>👑 JEFE DE ZONA</Text>
        </View>
      </View>
      <View style={g.cardBody}>
        <Text style={[g.statLabel, { color: C.boss, letterSpacing: T.wide }]}>{boss.name.toUpperCase()}</Text>
        <Text style={g.cardSubtitle}>{boss.description}</Text>
        <View style={[g.row, { justifyContent:"space-between", flexWrap:"wrap", gap: S.sm }]}>
          <Text style={[g.cardTitle, { color: C.accent, fontSize: T.xl }]}>+{boss.xp.toLocaleString()} XP</Text>
          <View style={g.row}>
            {Object.entries(boss.statReward || {}).map(([stat, val]) => (
              <View key={stat} style={[g.pill, { borderColor: C.boss+"44", backgroundColor: C.boss+"11", marginLeft: S.xs }]}>
                <Text style={[g.pillText, { color: C.boss }]}>+{val} {STAT_LABELS[stat] ?? stat}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.phasesBox}>
          <Text style={[g.statLabel, { letterSpacing: T.wide, marginBottom: S.sm }]}>COMBATE EN 3 FASES</Text>
          {boss.phases.map((phase, i) => (
            <View key={i} style={[s.phaseRow, i < boss.phases.length - 1 && s.phaseRowBorder]}>
              <View style={s.phaseCircle}><Text style={[g.statValue, { color: C.boss }]}>{i+1}</Text></View>
              <View style={{ flex:1, gap:2 }}>
                <Text style={g.cardTitle}>{phase.label}</Text>
                <Text style={g.cardSubtitle}>{EXERCISE_LABELS[phase.exercise] ?? phase.exercise}</Text>
              </View>
              <View style={{ alignItems:"flex-end", gap:2 }}>
                <Text style={[g.statValue, { color: C.accent }]}>{phase.reps} reps</Text>
                <Text style={g.statLabel}>{Math.floor(phase.timer/60)} min</Text>
              </View>
            </View>
          ))}
        </View>
        {defeated
          ? <View style={[g.btnOutline, { borderColor: C.success+"44", backgroundColor: C.success+"11" }]}>
              <Text style={[g.btnOutlineText, { color: C.success }]}>✓ DERROTADO HOY — REGRESA MAÑANA</Text>
            </View>
          : <TouchableOpacity style={g.btnBoss} onPress={() => onFight(boss)} activeOpacity={0.8}>
              <Text style={g.btnBossText}>👑  DESAFIAR AL JEFE</Text>
            </TouchableOpacity>
        }
      </View>
    </View>
  );
}

export default function ZoneScreen({ route, navigation }) {
  const { zone, playerClass, playerGender } = route.params;
  const uid = auth.currentUser?.uid;
  const [bossDefeated, setBossDefeated] = useState(false);
  const [loading, setLoading]           = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadState(); }, []);
  useEffect(() => { const unsub = navigation.addListener("focus", loadState); return unsub; }, [navigation]);

  async function loadState() {
    try {
      setLoading(true);
      if (zone.boss) setBossDefeated(await checkBossDefeated(uid, zone.boss));
    } catch(e) { console.error(e); }
    finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    }
  }

  const regularMonsters  = (zone.monsters ?? []).map(id => MONSTERS[id]).filter(Boolean);
  const etherealMonsters = (zone.rareMonsters ?? []).map(id => MONSTERS[id]).filter(Boolean).filter(m => shouldSpawnEthereal(m.id, m.spawnChance));
  const allMonsters      = [...regularMonsters, ...etherealMonsters];
  const boss             = zone.boss ? BOSSES[zone.boss] : null;

  function fightMonster(monster) { navigation.navigate("Combat", { mode:"monster", monster, playerClass, playerGender, zone }); }
  function fightBoss(boss)       { navigation.navigate("Combat", { mode:"boss", monster:boss, playerClass, playerGender, zone }); }

  const zoneBg = ZONE_BACKGROUNDS[zone?.id];

  return (
    <View style={g.screen}>
      {/* Fondo de zona */}
      {zoneBg && <Image source={zoneBg} style={s.zoneBgImage} resizeMode="cover" />}
      {zoneBg && <View style={s.zoneBgOverlay} />}

      {/* Header */}
      <View style={[s.zoneHeaderBlock, { backgroundColor: zone.colorDark + "cc" }]}>
        <TouchableOpacity style={g.backBtn} onPress={() => navigation.goBack()}>
          <Text style={g.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={s.zoneHeader}>
          <Text style={s.zoneEmoji}>{zone.emoji}</Text>
          <Text style={[s.zoneName, { color: zone.color }]}>{zone.name.toUpperCase()}</Text>
        </View>
        <Text style={s.zoneDesc}>{zone.description}</Text>
      </View>

      {loading ? (
        <View style={g.centered}><ActivityIndicator color={C.accent} /></View>
      ) : (
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={g.scroll} showsVerticalScrollIndicator={false}>
          <Text style={g.sectionLabel}>⚔️ MONSTRUOS — Sin límite diario</Text>
          {allMonsters.map(m => <MonsterCard key={m.id} monster={m} zone={zone} onFight={fightMonster} />)}

          {boss ? (
            <>
              <Text style={[g.sectionLabel, { color: C.boss, marginTop: S.lg }]}>👑 JEFE — 1 vez por día</Text>
              <BossCard boss={boss} zone={zone} defeated={bossDefeated} onFight={fightBoss} />
            </>
          ) : (
            <View style={g.comingSoonBox}>
              <Text style={{ fontSize:36, opacity:.4 }}>👑</Text>
              <Text style={g.comingSoonTitle}>JEFE — PRÓXIMAMENTE</Text>
              <Text style={g.comingSoonSub}>El guardián del bosque está siendo invocado...</Text>
            </View>
          )}
          <View style={{ height:40 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  zoneBgImage:     { ...StyleSheet.absoluteFillObject, width:"100%", height:"100%" },
  zoneBgOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor:"#00000088" },
  zoneHeaderBlock: { paddingTop: 52, paddingHorizontal: S.lg, paddingBottom: S.md },
  zoneHeader: { alignItems:"center", gap: S.xs, paddingTop: S.xs, paddingBottom: S.xs, marginTop: -40},
  zoneEmoji:  { fontSize:22 },
  zoneName:   { fontSize: T.xl, fontWeight: T.black, letterSpacing: T.wide, color: C.text },
  zoneDesc:   { color: C.textDim, fontSize: T.xs, textAlign:"center", lineHeight:16, marginTop: S.xs },

  etherealBanner: { backgroundColor:"#e8c84a11", borderBottomWidth:1, borderBottomColor:"#e8c84a33", padding: S.sm, paddingHorizontal: S.lg },
  etherealText:   { color: C.elite, fontSize: T.xs, fontWeight: T.black, letterSpacing: T.tight },

  artZone:    { height:180, justifyContent:"center", alignItems:"center", position:"relative", overflow:"hidden" },
  artImage:   { width:"90%", height:"100%", position:"absolute" },
  artEmoji:   { fontSize:88 },
  artOverlay: { position:"absolute", bottom:0, left:0, right:0, height:50 },
  spriteBox:  { position:"absolute", bottom: S.sm, left: S.sm, width:44, height:54, borderWidth:2, borderRadius: R.sm, backgroundColor:"#000", overflow:"hidden" },
  spriteImg:  { width:"100%", height:"100%" },
  xpBadge:   { position:"absolute", top: S.sm, left: S.sm, backgroundColor: C.accent+"22", borderColor: C.accent+"44" },
  tierBadge:  { position:"absolute", top: S.sm, right: S.sm },

  phasesBox:      { backgroundColor: "#101018ee", borderRadius: R.md, padding: S.md, gap:0 },
  phaseRow:       { flexDirection:"row", alignItems:"center", gap: S.md, paddingVertical: S.sm },
  phaseRowBorder: { borderBottomWidth:1, borderBottomColor: C.border },
  phaseCircle:    { width:24, height:24, borderRadius:12, backgroundColor: C.boss+"22", borderWidth:1, borderColor: C.boss+"66", justifyContent:"center", alignItems:"center" },
});