import { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, FlatList, Image,
  Platform, StatusBar,
} from "react-native";

const SAFE_TOP    = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;
const SAFE_BOTTOM = Platform.OS === "android" ? 16 : 34;
import { auth } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const { width: W, height: H } = Dimensions.get("window");
const CARD_W = W * 0.88;
const CARD_H = H * 0.72;

// ─── Clases ───────────────────────────────────────────────────────────────────
const CLASSES = [
  {
    id: "knight",
    name: "Caballero",
    tier: "DEFENSOR",
    color: "#7a7aaa",
    colorDark: "#0a0a18",
    artM: require("../assets/classes/knight_m.png"),
    artF: require("../assets/classes/knight_f.png"),
    spriteM: require("../assets/classes/knight_m_sprite.png"),
    spriteF: require("../assets/classes/knight_f_sprite.png"),
    lore: '"El honor es mi armadura, la justicia mi espada. Ningún mal pasará mientras yo esté en pie."',
    stats: [
      { label: "STR", val: "+5", color: "#e05555" },
      { label: "VIT", val: "+5", color: "#e055aa" },
      { label: "END", val: "+3", color: "#5599e0" },
      { label: "AGI", val: "+2", color: "#55c080" },
    ],
    ability: { title: "VOLUNTAD DE HIERRO", desc: "+30% VIT en combate · Inmune al primer golpe fatal" },
    favExercise: "pushups",
  },
  {
    id: "gladiator",
    name: "Gladiador",
    tier: "ATACANTE",
    color: "#c03030",
    colorDark: "#1a0808",
    artM: require("../assets/classes/gladiator_m.png"),
    artF: require("../assets/classes/gladiator_f.png"),
    spriteM: require("../assets/classes/gladiator_m_sprite.png"),
    spriteF: require("../assets/classes/gladiator_f_sprite.png"),
    lore: '"La arena es mi templo. Cada combate, una oración de sangre y sudor a los dioses del poder."',
    stats: [
      { label: "STR", val: "+7", color: "#e05555" },
      { label: "AGI", val: "+3", color: "#55c080" },
      { label: "VIT", val: "+3", color: "#e055aa" },
      { label: "END", val: "+2", color: "#5599e0" },
    ],
    ability: { title: "FURIA GLADIATORIA", desc: "+25% XP en combate · +50% daño con push-ups" },
    favExercise: "pushups",
  },
  {
    id: "barbarian",
    name: "Bárbaro",
    tier: "TANQUE",
    color: "#c07030",
    colorDark: "#1a0e04",
    artM: require("../assets/classes/barbarian_m.png"),
    artF: require("../assets/classes/barbarian_f.png"),
    spriteM: require("../assets/classes/barbarian_m_sprite.png"),
    spriteF: require("../assets/classes/barbarian_f_sprite.png"),
    lore: '"La civilización es una jaula. La fuerza bruta es la única verdad que existe en este mundo."',
    stats: [
      { label: "STR", val: "+6", color: "#e05555" },
      { label: "END", val: "+6", color: "#5599e0" },
      { label: "AGI", val: "+2", color: "#55c080" },
      { label: "VIT", val: "+1", color: "#e055aa" },
    ],
    ability: { title: "BERSERKER", desc: "+40% END · Reps ilimitados cuando la vida es baja" },
    favExercise: "pushups",
  },
  {
    id: "mage",
    name: "Mago",
    tier: "INTELIGENCIA",
    color: "#8050c0",
    colorDark: "#0e0818",
    artM: require("../assets/classes/mage_m.png"),
    artF: require("../assets/classes/mage_f.png"),
    spriteM: require("../assets/classes/mage_m_sprite.png"),
    spriteF: require("../assets/classes/mage_f_sprite.png"),
    lore: '"El conocimiento es el poder más antiguo. Cada libro leído, un hechizo más en mi arsenal."',
    stats: [
      { label: "INT", val: "+8", color: "#a07de0" },
      { label: "END", val: "+4", color: "#5599e0" },
      { label: "AGI", val: "+2", color: "#55c080" },
      { label: "STR", val: "+1", color: "#e05555" },
    ],
    ability: { title: "ARCANO SUPREMO", desc: "+2 INT por Pomodoro · Hechizos reducen reps en combate" },
    favExercise: "situps",
  },
  {
    id: "archer",
    name: "Arquero",
    tier: "VELOCIDAD",
    color: "#308050",
    colorDark: "#061008",
    artM: require("../assets/classes/archer_m.png"),
    artF: require("../assets/classes/archer_f.png"),
    spriteM: require("../assets/classes/archer_m_sprite.png"),
    spriteF: require("../assets/classes/archer_f_sprite.png"),
    lore: '"La flecha no conoce el miedo. Veo, apunto, disparo. La distancia es mi aliada eterna."',
    stats: [
      { label: "AGI", val: "+8", color: "#55c080" },
      { label: "STR", val: "+3", color: "#e05555" },
      { label: "END", val: "+2", color: "#5599e0" },
      { label: "VIT", val: "+2", color: "#e055aa" },
    ],
    ability: { title: "OJO DE AGUILA", desc: "-20% reps en squats · 2x AGI en combate de agilidad" },
    favExercise: "squats",
  },
  {
    id: "assassin",
    name: "Asesino",
    tier: "CRÍTICO",
    color: "#304080",
    colorDark: "#06080e",
    artM: require("../assets/classes/assassin_m.png"),
    artF: require("../assets/classes/assassin_f.png"),
    spriteM: require("../assets/classes/assassin_m_sprite.png"),
    spriteF: require("../assets/classes/assassin_f_sprite.png"),
    lore: '"Las sombras son mi hogar. Llego antes de que sepas que estoy ahí. No hay segunda oportunidad."',
    stats: [
      { label: "AGI", val: "+6", color: "#55c080" },
      { label: "STR", val: "+5", color: "#e05555" },
      { label: "END", val: "+2", color: "#5599e0" },
      { label: "VIT", val: "+2", color: "#e055aa" },
    ],
    ability: { title: "GOLPE LETAL", desc: "2x XP si quedan +30s · Primer ataque siempre crítico" },
    favExercise: "squats",
  },
  {
    id: "scientist",
    name: "Científico",
    tier: "INTELIGENCIA",
    color: "#808020",
    colorDark: "#101002",
    artM: require("../assets/classes/scientist_m.png"),
    artF: require("../assets/classes/scientist_f.png"),
    spriteM: require("../assets/classes/scientist_m_sprite.png"),
    spriteF: require("../assets/classes/scientist_f_sprite.png"),
    lore: '"La mente es el músculo más poderoso. Cada Pomodoro completado, un paso más hacia la omnisciencia."',
    stats: [
      { label: "INT", val: "+10", color: "#a07de0" },
      { label: "END", val: "+5", color: "#5599e0" },
      { label: "AGI", val: "+3", color: "#55c080" },
      { label: "STR", val: "+1", color: "#e05555" },
    ],
    ability: { title: "MENTE MAESTRA", desc: "+2 INT por Pomodoro · Analiza debilidades del enemigo" },
    favExercise: "situps",
  },
];

const FOCUSES = [
  { id: "strength",  name: "Ganar fuerza",        desc: "Más push-ups en tus misiones",     color: "#e05555" },
  { id: "cardio",    name: "Perder peso",          desc: "Circuitos de cardio y resistencia", color: "#e8a84a" },
  { id: "agility",   name: "Mejorar agilidad",     desc: "Squats y velocidad",                color: "#55c080" },
  { id: "balanced",  name: "Equilibrio general",   desc: "Todos los ejercicios por igual",    color: "#e8c84a" },
  { id: "endurance", name: "Aumentar resistencia", desc: "Sit-ups y larga duración",          color: "#5599e0" },
];

// ─── Class Card ───────────────────────────────────────────────────────────────
function ClassCard({ cls, gender, active }) {
  const art    = gender === "m" ? cls.artM    : cls.artF;
  const sprite = gender === "m" ? cls.spriteM : cls.spriteF;
  const ART_H  = CARD_H * 0.50;

  return (
    <View style={[styles.card, { borderColor: active ? cls.color : cls.color + "44", width: CARD_W, height: CARD_H }]}>

      {/* Top bar */}
      <View style={[styles.cardTopBar, { backgroundColor: cls.colorDark }]}>
        <Text style={[styles.cardName, { color: cls.color }]}>{cls.name.toUpperCase()}</Text>
        <View style={[styles.tierBadge, { borderColor: cls.color + "66", backgroundColor: cls.color + "22" }]}>
          <Text style={[styles.tierText, { color: cls.color }]}>{cls.tier}</Text>
        </View>
      </View>

      {/* Art area — fixed height */}
      <View style={[styles.cardArt, { height: ART_H, backgroundColor: cls.colorDark }]}>
        <View style={[styles.artGlow, { backgroundColor: cls.color + "18" }]} />
        <Image source={art} style={styles.characterArt} resizeMode="contain" />
        <View style={[styles.spriteBox, { borderColor: cls.color }]}>
          <Image source={sprite} style={styles.spriteImage} resizeMode="contain" />
        </View>
        <Text style={[styles.stars, { color: cls.color }]}>★★★</Text>
      </View>

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: cls.color + "44" }]} />

      {/* Bottom section fills remaining space */}
      <View style={styles.cardBottom}>

        {/* Lore */}
        <View style={styles.loreContainer}>
          <Text style={styles.cardLore}>{cls.lore}</Text>
        </View>

        {/* Stats — 2x2 grid */}
        <View style={styles.statsGrid}>
          {cls.stats.map((s) => (
            <View key={s.label} style={[styles.statRow, { borderColor: s.color + "33" }]}>
              <Text style={[styles.statLabel, { color: s.color + "99" }]}>{s.label}</Text>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* Ability */}
        <View style={[styles.abilityBox, { borderLeftColor: cls.color, backgroundColor: cls.color + "11" }]}>
          <Text style={[styles.abilityTitle, { color: cls.color }]}>{cls.ability.title}</Text>
          <Text style={styles.abilityDesc}>{cls.ability.desc}</Text>
        </View>

      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CharacterCreationScreen({ onFinish }) {
  const [step, setStep]           = useState(0); // 0=clase 1=género 2=enfoque 3=confirm
  const [selectedClass, setSelectedClass] = useState(0);
  const [gender, setGender]       = useState("m");
  const [selectedFocus, setSelectedFocus] = useState(null);
  const [saving, setSaving]       = useState(false);

  const flatListRef = useRef(null);
  const slideAnim   = useRef(new Animated.Value(0)).current;

  const cls = CLASSES[selectedClass];

  function animateStep(nextStep) {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 30, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,  duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  }

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setSelectedClass(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 60 };

  async function handleFinish() {
    setSaving(true);
    const uid = auth.currentUser?.uid;
    const initialStats = { STR: 0, AGI: 0, END: 0, VIT: 0, INT: 0 };
    cls.stats.forEach(({ label, val }) => {
      initialStats[label] = parseInt(val.replace("+", ""));
    });
    await updateDoc(doc(db, "users", uid), {
      class:       cls.id,
      className:   cls.name,
      gender,
      focus:       selectedFocus,
      stats:       initialStats,
      title:       cls.name,
    });
    setSaving(false);
    onFinish?.();
  }

  // ── STEP 0: Selector de clase ──────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={[styles.root, { paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ELIGE TU CLASE</Text>
          <Text style={styles.headerSub}>Desliza para explorar</Text>
        </View>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {CLASSES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === selectedClass && { width: 18, backgroundColor: cls.color },
              ]}
            />
          ))}
        </View>

        {/* Card carousel */}
        <FlatList
          ref={flatListRef}
          data={CLASSES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <ClassCard cls={item} gender={gender} active={index === selectedClass} />
            </View>
          )}
        />

        {/* Gender toggle */}
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === "m" && { backgroundColor: cls.color }]}
            onPress={() => setGender("m")}
          >
            <Text style={[styles.genderBtnText, gender === "m" && { color: "#0a0a0f" }]}>♂ MASCULINO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, gender === "f" && { backgroundColor: cls.color }]}
            onPress={() => setGender("f")}
          >
            <Text style={[styles.genderBtnText, gender === "f" && { color: "#0a0a0f" }]}>♀ FEMENINO</Text>
          </TouchableOpacity>
        </View>

        {/* Next */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: cls.color }]}
          onPress={() => animateStep(1)}
        >
          <Text style={styles.nextBtnText}>CONTINUAR →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── STEP 1: Enfoque ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={[styles.root, { paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }]}>
        <TouchableOpacity onPress={() => animateStep(0)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← VOLVER</Text>
        </TouchableOpacity>

        {/* Character preview small */}
        <View style={styles.previewRow}>
          <Image
            source={gender === "m" ? cls.artM : cls.artF}
            style={styles.previewArt}
            resizeMode="contain"
          />
          <View style={styles.previewInfo}>
            <Text style={[styles.previewName, { color: cls.color }]}>{cls.name}</Text>
            <Text style={styles.previewGender}>{gender === "m" ? "♂ Masculino" : "♀ Femenino"}</Text>
          </View>
        </View>

        <Text style={styles.stepTitle}>TU ENFOQUE</Text>
        <Text style={styles.stepSub}>¿Cuál es tu objetivo principal?</Text>

        <Animated.ScrollView
          style={{ transform: [{ translateY: slideAnim }] }}
          contentContainerStyle={styles.focusList}
          showsVerticalScrollIndicator={false}
        >
          {FOCUSES.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.focusCard,
                { borderColor: selectedFocus === f.id ? f.color : "#2a2a3d" },
                selectedFocus === f.id && { backgroundColor: f.color + "11" },
              ]}
              onPress={() => setSelectedFocus(f.id)}
            >
              <View style={styles.focusInfo}>
                <Text style={[styles.focusName, { color: selectedFocus === f.id ? f.color : "#e8e0f0" }]}>
                  {f.name}
                </Text>
                <Text style={styles.focusDesc}>{f.desc}</Text>
              </View>
              {selectedFocus === f.id && (
                <View style={[styles.focusCheck, { backgroundColor: f.color }]}>
                  <Text style={styles.focusCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: cls.color, opacity: selectedFocus ? 1 : 0.35 }]}
          onPress={() => selectedFocus && animateStep(2)}
          disabled={!selectedFocus}
        >
          <Text style={styles.nextBtnText}>CONTINUAR →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── STEP 2: Confirmación ───────────────────────────────────────────────────
  const focus = FOCUSES.find(f => f.id === selectedFocus);

  return (
    <View style={[styles.root, { paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }]}>
      <TouchableOpacity onPress={() => animateStep(1)} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← VOLVER</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>TU PERSONAJE</Text>
      <Text style={styles.stepSub}>Así comenzará tu aventura en Athral</Text>

      {/* Big character preview */}
      <View style={[styles.confirmCard, { borderColor: cls.color + "66" }]}>
        <Image
          source={gender === "m" ? cls.artM : cls.artF}
          style={styles.confirmArt}
          resizeMode="contain"
        />

        {/* Sprite small */}
        <View style={[styles.confirmSpriteBox, { borderColor: cls.color }]}>
          <Image
            source={gender === "m" ? cls.spriteM : cls.spriteF}
            style={styles.confirmSprite}
            resizeMode="contain"
          />
        </View>

        {/* Info overlay at bottom */}
        <View style={[styles.confirmOverlay, { backgroundColor: cls.colorDark + "ee" }]}>
          <Text style={[styles.confirmName, { color: cls.color }]}>
            {cls.name.toUpperCase()} · {gender === "m" ? "♂" : "♀"}
          </Text>
          <Text style={styles.confirmFocus}>✦ {focus?.name}</Text>
          <View style={styles.confirmStatsRow}>
            {cls.stats.slice(0, 3).map(s => (
              <Text key={s.label} style={[styles.confirmStat, { color: s.color }]}>
                {s.label} {s.val}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: cls.color }]}
        onPress={handleFinish}
        disabled={saving}
      >
        <Text style={styles.nextBtnText}>
          {saving ? "CREANDO PERSONAJE..." : "✦  COMENZAR AVENTURA"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:"#0a0a0f" },

  header:     { paddingHorizontal:24, paddingTop:6, paddingBottom:2 },
  headerTitle:{ color:"#e8c84a", fontSize:18, fontWeight:"900", letterSpacing:4 },
  headerSub:  { color:"#6a6080", fontSize:10, letterSpacing:2, marginTop:1 },

  dotsRow:    { flexDirection:"row", gap:6, paddingHorizontal:24, marginBottom:2 },
  dot:        { width:6, height:6, borderRadius:3, backgroundColor:"#2a2a3d" },

  carouselContent: { paddingHorizontal:(W - CARD_W) / 2 - 6, paddingVertical:4 },
  cardWrapper:     { width: CARD_W + 12, alignItems:"center", justifyContent:"center" },

  // Card
  card:         { borderWidth:2, borderRadius:12, overflow:"hidden", backgroundColor:"#0f0f1a" },
  cardTopBar:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:12, paddingVertical:8 },
  cardName:     { fontSize:18, fontWeight:"900", letterSpacing:2 },
  tierBadge:    { borderWidth:1, borderRadius:3, paddingHorizontal:8, paddingVertical:3 },
  tierText:     { fontSize:10, fontWeight:"900", letterSpacing:1 },

  cardArt:      { justifyContent:"center", alignItems:"center", position:"relative", overflow:"hidden" },
  artGlow:      { position:"absolute", inset:0, borderRadius:0 },
  characterArt: { width:"100%", height:"100%", position:"absolute" },

  spriteBox: {
    position:"absolute", bottom:10, left:10,
    width:48, height:60, borderWidth:2, borderRadius:3,
    backgroundColor:"#0a0a0f", overflow:"hidden",
  },
  spriteImage:   { width:"100%", height:"100%" },
  spriteOverlay: {
    position:"absolute", inset:0,
    backgroundColor:"transparent",
  },
  stars:         { position:"absolute", top:10, right:10, fontSize:14, fontWeight:"700" },

  cardDivider:   { height:1, marginHorizontal:0 },

  cardBottom:    { flex:1, paddingHorizontal:14, paddingTop:10, paddingBottom:10, justifyContent:"space-between" },

  loreContainer: { flex:1, justifyContent:"center" },
  cardLore:      { fontSize:13, fontStyle:"italic", color:"#9a90b0", textAlign:"center", lineHeight:19 },

  statsGrid: { flexDirection:"row", flexWrap:"wrap", gap:6, marginVertical:10 },
  statRow:   {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    gap:8, backgroundColor:"#1a1a28", paddingHorizontal:12, paddingVertical:9,
    borderRadius:4, width:"47%", borderWidth:1,
  },
  statLabel: { fontSize:12, fontWeight:"900", letterSpacing:1 },
  statVal:   { fontSize:16, fontWeight:"900" },

  abilityBox:   { padding:12, borderRadius:6, borderLeftWidth:4 },
  abilityTitle: { fontSize:11, fontWeight:"900", letterSpacing:2, marginBottom:5 },
  abilityDesc:  { fontSize:12, color:"#8a80a0", lineHeight:18 },

  genderRow: { flexDirection:"row", gap:10, paddingHorizontal:24, marginTop:6, marginBottom:6 },
  genderBtn: { flex:1, backgroundColor:"#1a1a28", borderWidth:1, borderColor:"#2a2a3d", borderRadius:6, paddingVertical:8, alignItems:"center" },
  genderBtnText:{ color:"#6a6080", fontSize:11, fontWeight:"900", letterSpacing:1 },

  nextBtn:     { marginHorizontal:24, marginBottom:8, paddingVertical:12, borderRadius:6, alignItems:"center" },
  nextBtnText: { color:"#0a0a0f", fontSize:14, fontWeight:"900", letterSpacing:2 },

  backBtn:     { paddingHorizontal:20, paddingTop:16, paddingBottom:8 },
  backBtnText: { color:"#6a6080", fontSize:12, fontWeight:"700", letterSpacing:1 },

  // Step 1
  previewRow:    { flexDirection:"row", alignItems:"center", gap:16, paddingHorizontal:20, paddingBottom:12 },
  previewArt:    { width:60, height:80 },
  previewInfo:   { gap:4 },
  previewName:   { fontSize:18, fontWeight:"900" },
  previewGender: { color:"#6a6080", fontSize:12 },

  stepTitle: { color:"#e8c84a", fontSize:20, fontWeight:"900", letterSpacing:3, paddingHorizontal:20, marginBottom:4 },
  stepSub:   { color:"#6a6080", fontSize:12, paddingHorizontal:20, marginBottom:16 },

  focusList: { paddingHorizontal:20, gap:10, paddingBottom:20 },
  focusCard: { backgroundColor:"#12121a", borderWidth:1, borderRadius:6, padding:16, flexDirection:"row", alignItems:"center" },
  focusInfo: { flex:1 },
  focusName: { fontSize:14, fontWeight:"900" },
  focusDesc: { color:"#6a6080", fontSize:11, marginTop:3 },
  focusCheck:    { width:24, height:24, borderRadius:12, justifyContent:"center", alignItems:"center" },
  focusCheckText:{ color:"#0a0a0f", fontSize:14, fontWeight:"900" },

  // Step 2
  confirmCard: {
    flex:1, marginHorizontal:20, marginBottom:16,
    borderWidth:2, borderRadius:8, overflow:"hidden",
    position:"relative",
  },
  confirmArt:     { width:"100%", height:"100%", position:"absolute" },
  confirmSpriteBox:{
    position:"absolute", top:12, left:12,
    width:44, height:56, borderWidth:2, borderRadius:4,
    backgroundColor:"#0a0a0fee", overflow:"hidden",
  },
  confirmSprite:  { width:"100%", height:"100%" },
  confirmOverlay: {
    position:"absolute", bottom:0, left:0, right:0,
    padding:16, gap:6,
  },
  confirmName:      { fontSize:18, fontWeight:"900", letterSpacing:2 },
  confirmFocus:     { color:"#a07de0", fontSize:13 },
  confirmStatsRow:  { flexDirection:"row", gap:12 },
  confirmStat:      { fontSize:12, fontWeight:"700" },
});