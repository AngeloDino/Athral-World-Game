import { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, Dimensions,
} from "react-native";

const { width: W, height: H } = Dimensions.get("window");

// Fondos por zona — agregar más cuando estén listos
const ZONE_BACKGROUNDS = {
  dark_forest:     require("../assets/zones/dark_forest_bg.png"),
  crystal_cave:    null,
  ruined_fortress: null,
  magic_swamp:     null,
  snowy_mountain:  null,
};

const CLASS_ART = {
  knight:    { m: require("../assets/classes/knight_m.png"),    f: require("../assets/classes/knight_f.png") },
  gladiator: { m: require("../assets/classes/gladiator_m.png"), f: require("../assets/classes/gladiator_f.png") },
  barbarian: { m: require("../assets/classes/barbarian_m.png"), f: require("../assets/classes/barbarian_f.png") },
  mage:      { m: require("../assets/classes/mage_m.png"),      f: require("../assets/classes/mage_f.png") },
  archer:    { m: require("../assets/classes/archer_m.png"),    f: require("../assets/classes/archer_f.png") },
  assassin:  { m: require("../assets/classes/assassin_m.png"),  f: require("../assets/classes/assassin_f.png") },
  scientist: { m: require("../assets/classes/scientist_m.png"), f: require("../assets/classes/scientist_f.png") },
};

function getClassArt(classId, gender) {
  const cls = CLASS_ART[classId];
  if (!cls) return null;
  return gender === "f" ? cls.f : cls.m;
}

export default function BattleIntro({ playerClass, playerGender, monster, onStart, onExit, zone }) {
  const playerX     = useRef(new Animated.Value(-W)).current;
  const monsterX    = useRef(new Animated.Value(W)).current;
  const impactScale = useRef(new Animated.Value(0)).current;
  const impactOp    = useRef(new Animated.Value(0)).current;
  const btnOp       = useRef(new Animated.Value(1)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const bgOp        = useRef(new Animated.Value(0)).current;
  const vsOp        = useRef(new Animated.Value(0)).current;

  const playerArt  = getClassArt(playerClass, playerGender);
  const monsterArt = monster?.art ?? null;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgOp, { toValue:1, duration:300, useNativeDriver:true }),
      Animated.parallel([
        Animated.spring(playerX,  { toValue:0, tension:80, friction:9, useNativeDriver:true }),
        Animated.spring(monsterX, { toValue:0, tension:80, friction:9, useNativeDriver:true }),
      ]),
      Animated.delay(100),
      Animated.timing(vsOp, { toValue:1, duration:150, useNativeDriver:true }),
      Animated.parallel([
        Animated.spring(impactScale, { toValue:1, tension:300, friction:5, useNativeDriver:true }),
        Animated.timing(impactOp,    { toValue:1, duration:100, useNativeDriver:true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(impactOp, { toValue:0, duration:200, useNativeDriver:true }),
      ]),
    ]).start();
  }, []);

  const zoneBg = ZONE_BACKGROUNDS[zone?.id] ?? ZONE_BACKGROUNDS["dark_forest"];

  return (
    <Animated.View style={[styles.root, { opacity: bgOp }]}>

      {/* Fondo de zona */}
      {zoneBg && (
        <Image
          source={zoneBg}
          style={styles.zoneBg}
          resizeMode="cover"
        />
      )}
      {/* Overlay oscuro sobre el fondo */}
      <View style={styles.zoneBgOverlay} />

      {/* Botón salir */}
      <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
        <Text style={styles.exitText}>← SALIR</Text>
      </TouchableOpacity>

      {/* Nombre del monstruo */}
      <View style={styles.topInfo}>
        <Text style={styles.monsterName}>{monster?.name ?? "Monstruo"}</Text>
        <View style={[styles.tierBadge, { borderColor: monster?.tier === "jefe" ? "#bf4abf66" : "#e8c84a44" }]}>
          <Text style={[styles.tierText, { color: monster?.tier === "jefe" ? "#bf4abf" : "#e8c84a" }]}>
            {monster?.tier?.toUpperCase() ?? "COMÚN"}
          </Text>
        </View>
      </View>

      {/* Arena — personajes uno frente al otro */}
      <View style={styles.arena}>
        {/* Jugador izquierda */}
        <Animated.View style={[styles.side, { transform:[{ translateX: playerX }] }]}>
          {playerArt ? (
            <Image source={playerArt} style={styles.charImg} resizeMode="contain" />
          ) : (
            <Text style={styles.fallback}>🗡️</Text>
          )}
          <Text style={styles.sideLabel}>TÚ</Text>
        </Animated.View>

        {/* Centro */}
        <View style={styles.center}>
          <Animated.Text style={[styles.vs, { opacity: vsOp }]}>VS</Animated.Text>
          <Animated.View style={[styles.impact, { opacity: impactOp, transform:[{ scale: impactScale }] }]}>
            <Text style={styles.impactEmoji}>⚡</Text>
          </Animated.View>
        </View>

        {/* Monstruo derecha */}
        <Animated.View style={[styles.side, { transform:[{ translateX: monsterX }] }]}>
          {monsterArt ? (
            <Image source={monsterArt} style={[styles.charImg, { transform:[{ scaleX:-1 }] }]} resizeMode="contain" />
          ) : (
            <Text style={styles.fallback}>{monster?.emoji ?? "👹"}</Text>
          )}
          <Text style={styles.sideLabel}>{monster?.name?.split(" ")[0]?.toUpperCase()}</Text>
        </Animated.View>
      </View>

      {/* Info combate */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>EJERCICIO</Text>
          <Text style={styles.infoValue}>
            {monster?.exercise === "pushups" ? "Flexiones" : monster?.exercise === "squats" ? "Sentadillas" : "Abdominales"}
          </Text>
        </View>
        <View style={styles.infoDivider}/>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>META</Text>
          <Text style={styles.infoValue}>{monster?.reps} reps</Text>
        </View>
        <View style={styles.infoDivider}/>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>XP</Text>
          <Text style={[styles.infoValue, { color:"#e8c84a" }]}>+{monster?.xp}</Text>
        </View>
      </View>

      {/* Botón COMBATIR */}
      <Animated.View style={[styles.btnWrapper, { opacity: btnOp, transform:[{ scale: btnScale }] }]}>
        <TouchableOpacity style={styles.fightBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.fightBtnText}>⚔️  ¡COMBATIR!</Text>
        </TouchableOpacity>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root:           { flex:1, backgroundColor:"#000000", justifyContent:"space-between", paddingBottom:36 },
  zoneBg:         { ...StyleSheet.absoluteFillObject, width:"100%", height:"100%" },
  zoneBgOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor:"#00000077" },

  exitBtn:  { position:"absolute", top:52, left:16, zIndex:10, paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:"#2a2a3d", borderRadius:4 },
  exitText: { color:"#6a6080", fontSize:11, fontWeight:"700", letterSpacing:1 },

  topInfo:     { paddingTop:52, alignItems:"center", gap:6, paddingHorizontal:24 },
  monsterName: { color:"#e8e0f0", fontSize:20, fontWeight:"900", letterSpacing:2, textAlign:"center" },
  tierBadge:   { borderWidth:1, borderRadius:4, paddingHorizontal:12, paddingVertical:4 },
  tierText:    { fontSize:10, fontWeight:"900", letterSpacing:2 },

  // Arena
  arena:  { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"space-evenly", paddingHorizontal:16 },
  side:   { width: W * 0.36, alignItems:"center", gap:6 },
  charImg:{ width: W * 0.36, height: H * 0.40, alignSelf:"center" },
  fallback:{ fontSize:70 },
  sideLabel:{ color:"#6a6080", fontSize:9, fontWeight:"700", letterSpacing:2 },

  center: { width: W * 0.10, alignItems:"center", justifyContent:"center" },
  vs:     { color:"#e8c84a", fontSize:18, fontWeight:"900", letterSpacing:2 },
  impact: { position:"absolute" },
  impactEmoji:{ fontSize:36 },

  // Info
  infoRow:    { flexDirection:"row", marginHorizontal:16, backgroundColor:"#0a0a10", borderRadius:8, borderWidth:1, borderColor:"#2a2a3d" },
  infoItem:   { flex:1, paddingVertical:12, alignItems:"center", gap:3 },
  infoDivider:{ width:1, backgroundColor:"#2a2a3d" },
  infoLabel:  { color:"#6a6080", fontSize:8, fontWeight:"700", letterSpacing:2 },
  infoValue:  { color:"#e8e0f0", fontSize:13, fontWeight:"900" },

  // CTA
  btnWrapper: { paddingHorizontal:16, marginTop:12 },
  fightBtn:   { backgroundColor:"#e8c84a", borderRadius:8, paddingVertical:16, alignItems:"center" },
  fightBtnText:{ color:"#000000", fontSize:16, fontWeight:"900", letterSpacing:3 },
});