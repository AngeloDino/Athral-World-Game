import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions,
} from "react-native";
import { auth } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { CLASSES, FOCUSES, AVATARS } from "../constants/classes";

const { width: W } = Dimensions.get("window");

const C = {
  bg:      "#0a0a0f",
  surface: "#12121a",
  surface2:"#1a1a28",
  border:  "#2a2a3d",
  accent:  "#e8c84a",
  text:    "#e8e0f0",
  textDim: "#6a6080",
  success: "#55c080",
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === current && styles.stepDotActive,
            i < current  && styles.stepDotDone,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Character Creation Screen ────────────────────────────────────────────────
export default function CharacterCreationScreen({ onFinish }) {
  const [step, setStep]               = useState(0); // 0=clase 1=avatar 2=enfoque 3=confirmación
  const [selectedClass, setSelectedClass]   = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("🧙");
  const [selectedFocus, setSelectedFocus]   = useState(null);
  const [saving, setSaving]                 = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  function goNext() {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(s => s + 1);
  }

  function goBack() {
    setStep(s => Math.max(0, s - 1));
  }

  async function handleFinish() {
    if (!selectedClass || !selectedFocus) return;
    setSaving(true);

    const uid = auth.currentUser?.uid;
    const cls = CLASSES.find(c => c.id === selectedClass);

    // Aplicar bonus de stats iniciales de la clase
    const initialStats = { STR: 0, AGI: 0, END: 0, VIT: 0 };
    Object.entries(cls.statBonus).forEach(([stat, val]) => {
      initialStats[stat] = val;
    });

    await updateDoc(doc(db, "users", uid), {
      class:       selectedClass,
      focus:       selectedFocus,
      avatar:      selectedAvatar,
      stats:       initialStats,
      title:       cls.name,   // título inicial según clase
    });

    setSaving(false);
    onFinish?.();
  }

  const canProceed = [
    !!selectedClass,
    true, // avatar siempre tiene default
    !!selectedFocus,
    true,
  ][step];

  const cls   = CLASSES.find(c => c.id === selectedClass);
  const focus = FOCUSES.find(f => f.id === selectedFocus);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLVER</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}
        <StepIndicator current={step} total={4} />
        <View style={{ width: 80 }} />
      </View>

      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>

        {/* ── PASO 0: Elegir clase ── */}
        {step === 0 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.stepTitle}>Elige tu clase</Text>
            <Text style={styles.stepSub}>Tu clase determina qué tipo de monstruos encontrarás con más frecuencia</Text>
            <View style={styles.classGrid}>
              {CLASSES.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classCard,
                    { borderColor: selectedClass === cls.id ? cls.color : C.border },
                    selectedClass === cls.id && { backgroundColor: cls.colorDark },
                  ]}
                  onPress={() => setSelectedClass(cls.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.classEmoji}>{cls.emoji}</Text>
                  <Text style={[styles.className, { color: selectedClass === cls.id ? cls.color : C.text }]}>
                    {cls.name}
                  </Text>
                  <Text style={styles.classDesc}>{cls.description}</Text>

                  {/* Stat bonus */}
                  <View style={styles.classBonusRow}>
                    {Object.entries(cls.statBonus).map(([stat, val]) => (
                      <View key={stat} style={[styles.classBonusBadge, { borderColor: cls.color + "44" }]}>
                        <Text style={[styles.classBonusText, { color: cls.color }]}>+{val} {stat}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.classLore}>{cls.lore}</Text>

                  {selectedClass === cls.id && (
                    <View style={[styles.selectedCheck, { backgroundColor: cls.color }]}>
                      <Text style={styles.selectedCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ── PASO 1: Elegir avatar ── */}
        {step === 1 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.stepTitle}>Elige tu avatar</Text>
            <Text style={styles.stepSub}>La apariencia de tu personaje en el mundo de Athral</Text>

            {/* Preview */}
            <View style={[styles.avatarPreview, { borderColor: cls?.color ?? C.accent }]}>
              <Text style={styles.avatarPreviewEmoji}>{selectedAvatar}</Text>
              <Text style={[styles.avatarPreviewName, { color: cls?.color ?? C.accent }]}>
                {cls?.name ?? "Aventurero"}
              </Text>
            </View>

            <View style={styles.avatarGrid}>
              {AVATARS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.avatarChip,
                    selectedAvatar === emoji && styles.avatarChipActive,
                  ]}
                  onPress={() => setSelectedAvatar(emoji)}
                >
                  <Text style={styles.avatarChipEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ── PASO 2: Elegir enfoque ── */}
        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.stepTitle}>Tu enfoque</Text>
            <Text style={styles.stepSub}>¿Cuál es tu objetivo principal? Esto personaliza tus misiones</Text>
            <View style={styles.focusList}>
              {FOCUSES.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.focusCard,
                    { borderColor: selectedFocus === f.id ? f.color : C.border },
                    selectedFocus === f.id && { backgroundColor: f.color + "11" },
                  ]}
                  onPress={() => setSelectedFocus(f.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.focusEmoji}>{f.emoji}</Text>
                  <View style={styles.focusInfo}>
                    <Text style={[styles.focusName, { color: selectedFocus === f.id ? f.color : C.text }]}>
                      {f.name}
                    </Text>
                    <Text style={styles.focusDesc}>{f.description}</Text>
                  </View>
                  {selectedFocus === f.id && (
                    <View style={[styles.focusCheck, { backgroundColor: f.color }]}>
                      <Text style={styles.focusCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ── PASO 3: Confirmación ── */}
        {step === 3 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.stepTitle}>Tu personaje</Text>
            <Text style={styles.stepSub}>Así comenzará tu aventura en Athral World</Text>

            {/* Character summary */}
            <View style={[styles.summaryCard, { borderColor: cls?.color + "66" }]}>
              {/* Avatar grande */}
              <View style={[styles.summaryAvatar, { borderColor: cls?.color, backgroundColor: cls?.colorDark }]}>
                <Text style={styles.summaryAvatarEmoji}>{selectedAvatar}</Text>
              </View>

              <Text style={[styles.summaryClass, { color: cls?.color }]}>
                {cls?.emoji} {cls?.name}
              </Text>

              <View style={styles.summaryDivider} />

              {/* Stats iniciales */}
              <Text style={styles.summaryLabel}>STATS INICIALES</Text>
              <View style={styles.summaryStats}>
                {Object.entries(cls?.statBonus ?? {}).map(([stat, val]) => (
                  <View key={stat} style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatVal}>+{val}</Text>
                    <Text style={styles.summaryStatKey}>{stat}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summaryDivider} />

              {/* Enfoque */}
              <Text style={styles.summaryLabel}>ENFOQUE</Text>
              <View style={[styles.summaryFocusRow, { borderColor: focus?.color + "44" }]}>
                <Text style={styles.summaryFocusEmoji}>{focus?.emoji}</Text>
                <View>
                  <Text style={[styles.summaryFocusName, { color: focus?.color }]}>{focus?.name}</Text>
                  <Text style={styles.summaryFocusDesc}>{focus?.description}</Text>
                </View>
              </View>

              {/* Lore de la clase */}
              <View style={styles.summaryDivider} />
              <Text style={styles.summaryLore}>{cls?.lore}</Text>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={step === 3 ? handleFinish : goNext}
          disabled={!canProceed || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {saving          ? "CREANDO PERSONAJE..." :
             step === 3      ? "✦  COMENZAR AVENTURA" :
             step === 1      ? "CONTINUAR →"          :
                               "CONTINUAR →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:C.bg },
  content: { flex:1 },
  scroll:  { paddingHorizontal:20, paddingTop:8, paddingBottom:20 },

  // Header
  header:   { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:20, paddingTop:56, paddingBottom:16 },
  backBtn:  { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText: { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },

  // Steps
  stepRow:      { flexDirection:"row", gap:8, alignItems:"center" },
  stepDot:      { width:8, height:8, borderRadius:4, backgroundColor:C.border },
  stepDotActive:{ width:24, backgroundColor:C.accent },
  stepDotDone:  { backgroundColor:C.success },

  // Step content
  stepTitle: { color:C.accent, fontSize:26, fontWeight:"900", letterSpacing:1, marginBottom:8 },
  stepSub:   { color:C.textDim, fontSize:14, lineHeight:20, marginBottom:24 },

  // Classes
  classGrid: { gap:12 },
  classCard: {
    backgroundColor:C.surface, borderWidth:1, borderRadius:8,
    padding:16, gap:8, position:"relative",
  },
  classEmoji:      { fontSize:36 },
  className:       { fontSize:18, fontWeight:"900" },
  classDesc:       { color:C.textDim, fontSize:13, lineHeight:18 },
  classBonusRow:   { flexDirection:"row", gap:6, flexWrap:"wrap" },
  classBonusBadge: { borderWidth:1, borderRadius:4, paddingHorizontal:8, paddingVertical:3 },
  classBonusText:  { fontSize:11, fontWeight:"700" },
  classLore:       { color:C.textDim, fontSize:11, fontStyle:"italic", lineHeight:16 },
  selectedCheck:   { position:"absolute", top:12, right:12, width:24, height:24, borderRadius:12, justifyContent:"center", alignItems:"center" },
  selectedCheckText:{ color:C.bg, fontSize:13, fontWeight:"900" },

  // Avatar
  avatarPreview:     { alignItems:"center", backgroundColor:C.surface, borderWidth:2, borderRadius:12, padding:24, marginBottom:24, gap:8 },
  avatarPreviewEmoji:{ fontSize:72 },
  avatarPreviewName: { fontSize:18, fontWeight:"900", letterSpacing:2 },
  avatarGrid:        { flexDirection:"row", flexWrap:"wrap", gap:10, justifyContent:"center" },
  avatarChip:        { width:60, height:60, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:8, justifyContent:"center", alignItems:"center" },
  avatarChipActive:  { borderColor:C.accent, backgroundColor:C.accent+"22" },
  avatarChipEmoji:   { fontSize:30 },

  // Focus
  focusList: { gap:10 },
  focusCard: { backgroundColor:C.surface, borderWidth:1, borderRadius:8, padding:16, flexDirection:"row", alignItems:"center", gap:14, position:"relative" },
  focusEmoji:{ fontSize:28, width:36 },
  focusInfo: { flex:1 },
  focusName: { fontSize:15, fontWeight:"900" },
  focusDesc: { color:C.textDim, fontSize:12, marginTop:3 },
  focusCheck:{ width:24, height:24, borderRadius:12, justifyContent:"center", alignItems:"center" },
  focusCheckText:{ color:C.bg, fontSize:13, fontWeight:"900" },

  // Summary
  summaryCard:       { backgroundColor:C.surface, borderWidth:1, borderRadius:8, padding:20, alignItems:"center", gap:16 },
  summaryAvatar:     { width:100, height:100, borderRadius:12, borderWidth:2, justifyContent:"center", alignItems:"center" },
  summaryAvatarEmoji:{ fontSize:56 },
  summaryClass:      { fontSize:20, fontWeight:"900", letterSpacing:2 },
  summaryDivider:    { width:"100%", height:1, backgroundColor:C.border },
  summaryLabel:      { color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:3, alignSelf:"flex-start" },
  summaryStats:      { flexDirection:"row", gap:16, alignSelf:"flex-start" },
  summaryStatItem:   { alignItems:"center", gap:2 },
  summaryStatVal:    { color:C.accent, fontSize:20, fontWeight:"900" },
  summaryStatKey:    { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:1 },
  summaryFocusRow:   { flexDirection:"row", alignItems:"center", gap:12, alignSelf:"flex-start", backgroundColor:C.surface2, borderWidth:1, borderRadius:6, padding:12, width:"100%" },
  summaryFocusEmoji: { fontSize:24 },
  summaryFocusName:  { fontSize:14, fontWeight:"900" },
  summaryFocusDesc:  { color:C.textDim, fontSize:11, marginTop:2 },
  summaryLore:       { color:C.textDim, fontSize:12, fontStyle:"italic", textAlign:"center", lineHeight:18 },

  // Bottom
  bottomBar:       { paddingHorizontal:20, paddingBottom:40, paddingTop:12, borderTopWidth:1, borderTopColor:C.border },
  nextBtn:         { backgroundColor:C.accent, borderRadius:8, paddingVertical:16, alignItems:"center" },
  nextBtnDisabled: { opacity:0.35 },
  nextBtnText:     { color:C.bg, fontSize:14, fontWeight:"900", letterSpacing:2 },
});