import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, Image, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import g from "../constants/globalStyles";
import { colors as C, spacing as S, typography as T, radius as R } from "../constants/theme";
import { ZONES } from "../constants/monsters";

const { width: W, height: H } = Dimensions.get("window");
const MAP_W = W - 32;
const MAP_H = MAP_W * 1.0;
const WORLD_MAP = require("../assets/map/world_map.png");



const ZONE_POSITIONS = {
  dark_forest:     { x:0.22, y:0.78 },
  crystal_cave:    { x:0.75, y:0.80 },
  ruined_fortress: { x:0.20, y:0.42 },
  magic_swamp:     { x:0.78, y:0.38 },
  snowy_mountain:  { x:0.50, y:0.08 },
  tower:           { x:0.48, y:0.50 },
};

export default function WorldScreen({ navigation }) {
  const uid = auth.currentUser?.uid;
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerClass, setPlayerClass] = useState(null);
  const [playerGender, setPlayerGender] = useState("m");
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data();
          setPlayerLevel(data.level ?? 1);
          setPlayerClass(data.class ?? null);
          setPlayerGender(data.gender ?? "m");
        }
      } catch(e) { console.error(e); }
      finally {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
      }
    }
    load();
  }, []);

  function goToZone(zone) {
    navigation.navigate("Zone", { zone, playerClass, playerGender });
  }

  if (loading) return <View style={g.screen}><ActivityIndicator color={C.accent} style={{ marginTop:100 }} /></View>;

  return (
    <View style={g.screen}>
      {/* Header */}
      <View style={g.headerWrap}>
        <TouchableOpacity style={g.backBtn} onPress={() => navigation.goBack()}>
          <Text style={g.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>
      <View style={s.titleRow}>
        <Text style={g.headerTitle}>MUNDO</Text>
        <View style={s.levelBadge}>
          <Text style={s.levelBadgeText}>LV {playerLevel}</Text>
        </View>
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>

        {/* Mapa */}
        <View style={s.mapContainer}>
          <Image source={WORLD_MAP} style={s.mapImage} resizeMode="cover" />

          {/* Botones sobre el mapa */}
          {ZONES.map(zone => {
            const pos     = ZONE_POSITIONS[zone.id];
            const locked  = playerLevel < zone.minLevel;
            const btnLeft = pos.x * MAP_W - 20;
            const btnTop  = pos.y * MAP_H - 20;

            return (
              <TouchableOpacity
                key={zone.id}
                style={[s.zoneMarker, {
                  left:            btnLeft,
                  top:             btnTop,
                  borderColor:     locked || zone.comingSoon ? C.border : zone.color,
                  backgroundColor: locked || zone.comingSoon ? "#0a0a1088" : zone.colorDark + "cc",
                  opacity:         locked ? 0.4 : zone.comingSoon ? 0.6 : 1,
                }]}
                onPress={() => !locked && !zone.comingSoon && goToZone(zone)}
                activeOpacity={locked || zone.comingSoon ? 1 : 0.8}
              >
                <Text style={s.zoneMarkerEmoji}>{zone.emoji}</Text>
                {!locked && !zone.comingSoon && (
                  <Text style={[s.zoneMarkerLevel, { color: zone.color }]}>{zone.minLevel}+</Text>
                )}
                {locked && <Text style={s.zoneMarkerLock}>🔒</Text>}
              </TouchableOpacity>
            );
          })}

          {/* Torre */}
          <View style={[s.zoneMarker, s.towerMarker, { left: ZONE_POSITIONS.tower.x * MAP_W - 22, top: ZONE_POSITIONS.tower.y * MAP_H - 28 }]}>
            <Text style={s.zoneMarkerEmoji}>🗼</Text>
          </View>
        </View>

        {/* Leyenda */}
        <View style={{ paddingHorizontal: S.lg, gap: S.sm, marginTop: S.lg }}>
          {ZONES.map(zone => {
            const locked = playerLevel < zone.minLevel;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[s.legendRow, { borderColor: locked || zone.comingSoon ? C.border : zone.color + "44" }]}
                onPress={() => !locked && !zone.comingSoon && goToZone(zone)}
                activeOpacity={locked || zone.comingSoon ? 1 : 0.8}
              >
                <Text style={s.legendEmoji}>{zone.emoji}</Text>
                <View style={{ flex:1 }}>
                  <Text style={[s.legendName, { color: locked || zone.comingSoon ? C.textDim : zone.color }]}>
                    {zone.name.toUpperCase()}
                  </Text>
                  <Text style={s.legendSub}>
                    {zone.comingSoon ? "🔒 Próximamente" : `x${zone.xpMultiplier} XP · Lv${zone.minLevel}+`}
                  </Text>
                </View>
                <Text style={[s.legendArrow, { color: locked || zone.comingSoon ? C.border : zone.color }]}>
                  {locked || zone.comingSoon ? "🔒" : "›"}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Torre */}
          <View style={[s.legendRow, { borderColor: C.border, opacity:0.5 }]}>
            <Text style={s.legendEmoji}>🗼</Text>
            <View style={{ flex:1 }}>
              <Text style={[s.legendName, { color: C.textDim }]}>TORRE DE BABEL</Text>
              <Text style={s.legendSub}>🔒 Próximamente</Text>
            </View>
            <Text style={[s.legendArrow, { color: C.border }]}>🔒</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  titleRow:   { flexDirection:"row", alignItems:"center", justifyContent:"center", paddingBottom: S.sm },
  levelBadge: { backgroundColor: C.accent, borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: S.xs, marginLeft: S.sm },
  levelBadgeText: { color: C.bg, fontSize: T.sm, fontWeight: T.black, letterSpacing: T.tight },

  mapContainer: { width: MAP_W, height: MAP_H, marginHorizontal: S.lg, borderWidth:1, borderColor: C.border, borderRadius: R.lg, overflow:"hidden", position:"relative" },
  mapImage:     { width:"100%", height:"100%", position:"absolute" },

  zoneMarker:      { position:"absolute", width:40, height:40, borderRadius: R.full, borderWidth:2, alignItems:"center", justifyContent:"center" },
  towerMarker:     { borderColor:"#8a4abf", backgroundColor:"#1a0a2a88", width:44, height:44 },
  zoneMarkerEmoji: { fontSize:18 },
  zoneMarkerLevel: { fontSize:T.xs, fontWeight: T.black, position:"absolute", bottom:-14 },
  zoneMarkerLock:  { fontSize:10, position:"absolute", bottom:-14 },

  legendRow:   { flexDirection:"row", alignItems:"center", gap: S.md, backgroundColor: C.surface, borderWidth:1, borderRadius: R.lg, padding: S.md },
  legendEmoji: { fontSize:24 },
  legendName:  { fontSize: T.sm, fontWeight: T.black, letterSpacing: T.normal },
  legendSub:   { color: C.textDim, fontSize: T.xs, marginTop:2 },
  legendArrow: { fontSize: T.xl, fontWeight: T.black },
});