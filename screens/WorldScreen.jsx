import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, Image,
} from "react-native";

import { auth } from "../firebase/config";
import { ZONES, TOWER, getTowerFloorMonster, getTowerBossMonster, isTowerBossFloor, TOWER_MIN_LEVEL } from "../constants/monsters";
import { TutorialOverlay } from "../components/TutorialOverlay";

const { width: W } = Dimensions.get("window");
const MAP_W = W - 32;
const MAP_H = MAP_W * 0.88;
const VW = 320;
const VH = 280;

const ZONE_POSITIONS = {
  dark_forest:     { x: 0.22, y: 0.78 },
  crystal_cave:    { x: 0.75, y: 0.80 },
  ruined_fortress: { x: 0.20, y: 0.42 },
  magic_swamp:     { x: 0.78, y: 0.38 },
  snowy_mountain:  { x: 0.50, y: 0.08 },
  tower:           { x: 0.48, y: 0.50 },
};

const ZONE_META = {
  dark_forest:     { emoji:"🌲", label:"BOSQUE",     color:"#2d5a27", bg:"#0d200d", minLevel:1  },
  crystal_cave:    { emoji:"💎", label:"CUEVA",      color:"#2d4a7a", bg:"#0a0d28", minLevel:5  },
  ruined_fortress: { emoji:"🏰", label:"FORTALEZA",  color:"#6b4a2a", bg:"#1a1208", minLevel:10 },
  magic_swamp:     { emoji:"🐸", label:"PANTANO",    color:"#3d5a2a", bg:"#0e1a08", minLevel:15 },
  snowy_mountain:  { emoji:"🏔", label:"MONTAÑA",    color:"#4a6a8a", bg:"#141820", minLevel:20 },
};

// ─── World Map Image ─────────────────────────────────────────────────────────
const WORLD_MAP = require("../assets/map/world_map.png");

export default function WorldScreen({ navigation }) {
  const [playerLevel, setPlayerLevel] = useState(1);
  const [towerRecord, setTowerRecord] = useState(0);
  const [playerClass, setPlayerClass] = useState(null);
  const [towerVisible, setTowerVisible] = useState(false);
  const [loading, setLoading]           = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    async function init() {
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const d = snap.data();
        setPlayerLevel(d.level ?? 1);
        setTowerRecord(d.towerRecord ?? 0);
        setPlayerClass(d.class ?? null);
      }
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
    }
    init();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => setTowerVisible(false));
    return unsub;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.loadingText}>Cargando mundo...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MUNDO</Text>
          <View style={{ width:40 }} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LV {playerLevel}</Text>
          </View>
        </View>

        {/* Pixel map */}
        <View style={styles.mapContainer}>
          <Image source={WORLD_MAP} style={styles.mapImage} resizeMode="cover" />

          {/* Zone overlays */}
          {ZONES.map(zone => {
            const pos    = ZONE_POSITIONS[zone.id];
            const meta   = ZONE_META[zone.id];
            if (!pos || !meta) return null;
            const locked = playerLevel < meta.minLevel;
            const left   = pos.x * MAP_W - 18;
            const top    = pos.y * MAP_H - 18;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneMarker,
                  {
                    left, top,
                    borderColor: locked ? "#2a2a3d" : zone.comingSoon ? meta.color + "44" : meta.color,
                    backgroundColor: locked ? "#000000" : meta.bg,
                    opacity: locked ? 0.4 : zone.comingSoon ? 0.6 : 1,
                  }
                ]}
                onPress={() => {
                  if (locked) return;
                  if (zone.comingSoon) return;
                  navigation.navigate("Zone", { zone, playerClass });
                }}
                activeOpacity={(locked || zone.comingSoon) ? 1 : 0.8}
              >
                <Text style={styles.zoneEmoji}>{meta.emoji}</Text>
                {locked && (
                  <View style={styles.lockPill}>
                    <Text style={styles.lockPillText}>{meta.minLevel}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Tower overlay */}
          {(() => {
            const pos = ZONE_POSITIONS.tower;
            return (
              <TouchableOpacity
                style={[styles.towerMarker, { left: pos.x * MAP_W - 20, top: pos.y * MAP_H - 24 }]}
                onPress={() => setTowerVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.towerEmoji}>🗼</Text>
              </TouchableOpacity>
            );
          })()}
        </View>

        {/* Legend list */}
        <View style={styles.legend}>
          {ZONES.map(zone => {
            const meta   = ZONE_META[zone.id];
            if (!meta) return null;
            const locked = playerLevel < meta.minLevel;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[styles.legendRow, { borderColor: locked ? "#2a2a3d" : meta.color + "66", opacity: locked ? 0.5 : 1 }]}
                onPress={() => {
                  if (locked) return;
                  if (zone.comingSoon) return;
                  navigation.navigate("Zone", { zone, playerClass });
                }}
                activeOpacity={(locked || zone.comingSoon) ? 1 : 0.8}
              >
                <Text style={styles.legendEmoji}>{meta.emoji}</Text>
                <View style={styles.legendInfo}>
                  <Text style={[styles.legendName, { color: locked ? "#6a6080" : meta.color }]}>{meta.label}</Text>
                  <Text style={styles.legendSub}>
                {zone.comingSoon ? "🔒 Próximamente" : `x${zone.xpMultiplier} XP · Lv${meta.minLevel}+`}
              </Text>
                </View>
                {locked ? <Text style={styles.legendLock}>🔒</Text> : <Text style={styles.legendArrow}>›</Text>}
              </TouchableOpacity>
            );
          })}
          <View style={[styles.legendRow, { borderColor:"#8a4abf44", opacity:0.6 }]}>
            <Text style={styles.legendEmoji}>🗼</Text>
            <View style={styles.legendInfo}>
              <Text style={[styles.legendName, { color:"#8a4abf" }]}>TORRE DE BABEL</Text>
              <Text style={styles.legendSub}>🔒 Próximamente</Text>
            </View>
            <Text style={[styles.legendArrow, { color:"#4a3f8a" }]}>›</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tower overlay */}
      {towerVisible && (
        <TowerPanel
          playerLevel={playerLevel}
          towerRecord={towerRecord}
          uid={uid}
          playerClass={playerClass}
          navigation={navigation}
          onClose={() => setTowerVisible(false)}
        />
      )}

      <TutorialOverlay sectionKey="world" />
    </Animated.View>
  );
}

// ─── Tower Panel ──────────────────────────────────────────────────────────────
function TowerPanel({ playerLevel, towerRecord, uid, playerClass, navigation, onClose }) {
  const [session, setSession]     = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const { getTowerProgress } = await import("../firebase/firestore");
      const s = await getTowerProgress(uid);
      setSession(s);
      setCurrentFloor(s.floor ?? 1);
      setLoading(false);
    }
    load();
  }, []);

  const locked       = playerLevel < TOWER_MIN_LEVEL;
  const sessionEnded = session?.defeated;
  const isBoss       = isTowerBossFloor(currentFloor);
  const floorData    = isBoss ? getTowerBossMonster(currentFloor) : getTowerFloorMonster(currentFloor);

  function startFloor() {
    onClose();
    navigation.navigate("Combat", { mode:"tower", monster:floorData, towerRecord, playerClass });
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.towerCard}>
        <View style={styles.towerHeader}>
          <Text style={styles.towerTitle}>🗼 TORRE DE BABEL</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.towerClose}>✕</Text></TouchableOpacity>
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : locked ? (
          <View style={styles.centeredBox}>
            <Text style={{ fontSize:36 }}>🔒</Text>
            <Text style={[styles.bigLabel, { color:"#e05555" }]}>NIVEL {TOWER_MIN_LEVEL} REQUERIDO</Text>
            <Text style={styles.subLabel}>Tu nivel: {playerLevel}</Text>
          </View>
        ) : sessionEnded ? (
          <View style={styles.centeredBox}>
            <Text style={{ fontSize:36 }}>💀</Text>
            <Text style={[styles.bigLabel, { color:"#e05555" }]}>YA CAÍSTE HOY</Text>
            <Text style={styles.subLabel}>Récord: Piso {towerRecord}{"\n"}Regresa mañana</Text>
          </View>
        ) : (
          <View style={{ gap:14 }}>
            <View style={styles.towerStats}>
              <View style={styles.towerStatCol}>
                <Text style={styles.towerStatNum}>{currentFloor}</Text>
                <Text style={styles.towerStatLbl}>PISO ACTUAL</Text>
              </View>
              <View style={styles.towerStatDiv}/>
              <View style={styles.towerStatCol}>
                <Text style={[styles.towerStatNum, { color:"#8a4abf" }]}>{towerRecord}</Text>
                <Text style={styles.towerStatLbl}>RÉCORD</Text>
              </View>
            </View>
            <View style={[styles.floorPreview, isBoss && { borderColor:"#8a4abf" }]}>
              <Text style={[styles.floorLabel, isBoss && { color:"#8a4abf" }]}>
                {isBoss ? "👑 PISO DE JEFE" : `PISO ${currentFloor}`}
              </Text>
              <View style={styles.floorRow}>
                <Text style={{ fontSize:32 }}>{floorData.emoji}</Text>
                <View style={{ flex:1, gap:4 }}>
                  <Text style={[styles.floorName, isBoss && { color:"#8a4abf" }]}>{floorData.name}</Text>
                  <Text style={{ color:"#e8c84a", fontSize:13, fontWeight:"700" }}>+{floorData.xp.toLocaleString()} XP</Text>
                  {isBoss && <Text style={{ color:"#8a4abf", fontSize:10, fontWeight:"700", letterSpacing:1 }}>3 FASES · MIXTO</Text>}
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.fightBtn, isBoss && { borderColor:"#8a4abf" }]} onPress={startFloor} activeOpacity={0.8}>
              <Text style={[styles.fightBtnText, isBoss && { color:"#8a4abf" }]}>
                {isBoss ? "👑  DESAFIAR JEFE" : `⚔️  SUBIR PISO ${currentFloor}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const C = { bg:"#000000", surface:"#0a0a10", surface2:"#101018", border:"#2a2a3d", accent:"#e8c84a", text:"#e8e0f0", textDim:"#6a6080" };

const styles = StyleSheet.create({
  root:        { flex:1, backgroundColor:C.bg },
  scroll:      { paddingHorizontal:16, paddingTop:56, paddingBottom:32 },
  loadingRoot: { flex:1, backgroundColor:C.bg, justifyContent:"center", alignItems:"center" },
  loadingText: { color:C.textDim, fontSize:12, letterSpacing:2, textAlign:"center" },

  header:         { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  backBtn:        { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:2 },
  backText:       { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle:    { color:C.accent, fontSize:15, fontWeight:"900", letterSpacing:3, flex:1, textAlign:"center" },
  levelBadge:     { backgroundColor:C.accent, paddingHorizontal:10, paddingVertical:4, borderRadius:2 },
  levelBadgeText: { color:C.bg, fontSize:11, fontWeight:"900" },

  mapContainer: { width:MAP_W, height:MAP_H, borderWidth:2, borderColor:C.border, backgroundColor:"#0d1a0d", position:"relative", overflow:"hidden", marginBottom:14 },
  mapImage:     { width:"100%", height:"100%", position:"absolute" },

  zoneMarker: { position:"absolute", width:36, height:36, borderWidth:2, borderRadius:0, justifyContent:"center", alignItems:"center" },
  zoneEmoji:  { fontSize:18 },
  lockPill:   { position:"absolute", top:-8, right:-8, backgroundColor:"#101018", borderWidth:1, borderColor:"#4a3f8a", paddingHorizontal:3, paddingVertical:1 },
  lockPillText:{ color:"#a07de0", fontSize:7, fontWeight:"900" },

  towerMarker: { position:"absolute", width:40, height:48, backgroundColor:"#1a0a2a", borderWidth:2, borderColor:"#8a4abf", justifyContent:"center", alignItems:"center" },
  towerEmoji:  { fontSize:22 },

  legend:      { gap:8 },
  legendRow:   { backgroundColor:C.surface, borderWidth:1, borderRadius:2, padding:12, flexDirection:"row", alignItems:"center", gap:12 },
  legendEmoji: { fontSize:22, width:28 },
  legendInfo:  { flex:1 },
  legendName:  { fontSize:11, fontWeight:"900", letterSpacing:1 },
  legendSub:   { color:C.textDim, fontSize:10, marginTop:2 },
  legendLock:  { fontSize:14 },
  legendArrow: { color:C.textDim, fontSize:22 },

  overlay:    { position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"#000000cc", justifyContent:"flex-end" },
  towerCard:  { backgroundColor:C.surface, borderTopWidth:2, borderTopColor:"#8a4abf", borderTopLeftRadius:8, borderTopRightRadius:8, padding:20, gap:14 },
  towerHeader:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  towerTitle: { color:"#aa6adf", fontSize:16, fontWeight:"900", letterSpacing:2 },
  towerClose: { color:C.textDim, fontSize:18, fontWeight:"700", padding:4 },

  centeredBox:  { alignItems:"center", gap:10, paddingVertical:20 },
  bigLabel:     { fontSize:14, fontWeight:"900", letterSpacing:2 },
  subLabel:     { color:C.textDim, fontSize:12, textAlign:"center" },

  towerStats:   { flexDirection:"row", backgroundColor:C.surface2, borderRadius:2 },
  towerStatCol: { flex:1, paddingVertical:12, alignItems:"center", gap:4 },
  towerStatDiv: { width:1, backgroundColor:C.border },
  towerStatNum: { color:C.text, fontSize:22, fontWeight:"900" },
  towerStatLbl: { color:C.textDim, fontSize:9, letterSpacing:2, fontWeight:"700" },

  floorPreview: { backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:2, padding:14, gap:10 },
  floorLabel:   { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3 },
  floorRow:     { flexDirection:"row", gap:12, alignItems:"center" },
  floorName:    { color:C.text, fontSize:14, fontWeight:"900" },

  fightBtn:     { backgroundColor:C.surface2, borderWidth:1, borderColor:C.accent, borderRadius:2, paddingVertical:14, alignItems:"center" },
  fightBtnText: { color:C.accent, fontSize:13, fontWeight:"900", letterSpacing:2 },
});