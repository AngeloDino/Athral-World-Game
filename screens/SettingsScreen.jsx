import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Animated, Alert,
} from "react-native";
import { auth } from "../firebase/config";
import { logoutUser } from "../firebase/auth";
import {
  initNotifications, scheduleStreakDangerNotification,
  scheduleRandomMotivation, cancelAllNotifications,
  getSavedNotificationTime, requestNotificationPermissions,
} from "../systems/notificationSystem";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "#0a0a0f",
  surface: "#12121a",
  surface2:"#1a1a28",
  border:  "#2a2a3d",
  borderGlow:"#4a3f8a",
  accent:  "#e8c84a",
  text:    "#e8e0f0",
  textDim: "#6a6080",
  success: "#55c080",
  danger:  "#e05555",
  primary: "#7c5cbf",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function formatHour(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const h      = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${period}`;
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedHour, setSelectedHour]   = useState(20);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [saving, setSaving]               = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;

  useEffect(() => {
    loadSettings();
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  async function loadSettings() {
    const enabled = await AsyncStorage.getItem("notifications_enabled");
    setNotificationsEnabled(enabled === "true");
    const { hour, minute } = await getSavedNotificationTime();
    setSelectedHour(hour);
    setSelectedMinute(minute);
  }

  async function handleToggleNotifications(value) {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Permisos requeridos",
          "Necesitas permitir notificaciones en la configuración de tu dispositivo.",
        );
        return;
      }
      await initNotifications();
      await AsyncStorage.setItem("notifications_enabled", "true");
    } else {
      await cancelAllNotifications();
      await AsyncStorage.setItem("notifications_enabled", "false");
    }
    setNotificationsEnabled(value);
  }

  async function handleSaveTime() {
    setSaving(true);
    await scheduleStreakDangerNotification(selectedHour, selectedMinute);
    await scheduleRandomMotivation();
    setSaving(false);
    Alert.alert("✓ Guardado", `Recordatorio configurado para las ${formatHour(selectedHour).replace("00", String(selectedMinute).padStart(2,"0"))}`);
  }

  async function handleLogout() {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir del mundo?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: async () => await logoutUser() },
      ]
    );
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLVER</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AJUSTES</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Player info */}
        <View style={styles.playerCard}>
          <Text style={styles.playerEmoji}>🧙</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{user?.displayName ?? user?.email}</Text>
            <Text style={styles.playerEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>

          {/* Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Activar notificaciones</Text>
              <Text style={styles.settingDesc}>Recordatorios de racha y motivación diaria</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor={notificationsEnabled ? C.accent : C.textDim}
            />
          </View>

          {/* Hour picker */}
          {notificationsEnabled && (
            <View style={styles.timePickerCard}>
              <Text style={styles.timePickerLabel}>HORA DEL RECORDATORIO DE RACHA</Text>
              <Text style={styles.timePickerSub}>
                Si no has entrenado antes de esta hora recibirás un aviso
              </Text>

              {/* Hour selector */}
              <Text style={styles.pickerGroupLabel}>HORA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.pickerChip, selectedHour === h && styles.pickerChipActive]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text style={[styles.pickerChipText, selectedHour === h && { color: C.accent }]}>
                      {formatHour(h)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Minute selector */}
              <Text style={[styles.pickerGroupLabel, { marginTop: 12 }]}>MINUTOS</Text>
              <View style={styles.minuteRow}>
                {MINUTES.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.minuteChip, selectedMinute === m && styles.pickerChipActive]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text style={[styles.pickerChipText, selectedMinute === m && { color: C.accent }]}>
                      :{String(m).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected time display */}
              <View style={styles.selectedTimeRow}>
                <Text style={styles.selectedTimeLabel}>RECORDATORIO A LAS</Text>
                <Text style={styles.selectedTimeValue}>
                  {formatHour(selectedHour).replace("00", String(selectedMinute).padStart(2,"0"))}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveTime}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "GUARDANDO..." : "✓ GUARDAR HORARIO"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* What notifications will you get */}
        {notificationsEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUÉ RECIBIRÁS</Text>
            <View style={styles.notifInfoCard}>
              {[
                { emoji:"⚠️", title:"Racha en peligro",     desc:`Diario a las ${formatHour(selectedHour)} si no has entrenado` },
                { emoji:"💪", title:"Motivación aleatoria",  desc:"Una vez al día en horario aleatorio" },
              ].map((item, i) => (
                <View key={i} style={[styles.notifInfoRow, i < 1 && { borderBottomWidth:1, borderBottomColor:C.border }]}>
                  <Text style={styles.notifInfoEmoji}>{item.emoji}</Text>
                  <View style={styles.notifInfoText}>
                    <Text style={styles.notifInfoTitle}>{item.title}</Text>
                    <Text style={styles.notifInfoDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CUENTA</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>✕  CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Athral World v0.1 — MVP</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  scroll: { paddingHorizontal:16, paddingTop:56, paddingBottom:32 },

  header:      { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:24 },
  backBtn:     { paddingVertical:6, paddingHorizontal:12, borderWidth:1, borderColor:C.border, borderRadius:4 },
  backText:    { color:C.textDim, fontSize:11, fontWeight:"700", letterSpacing:1 },
  headerTitle: { color:C.accent, fontSize:16, fontWeight:"900", letterSpacing:4 },

  playerCard: { backgroundColor:C.surface, borderWidth:1, borderColor:C.borderGlow, borderRadius:4, padding:16, flexDirection:"row", alignItems:"center", gap:14, marginBottom:24 },
  playerEmoji:{ fontSize:36 },
  playerInfo: { flex:1 },
  playerName: { color:C.text, fontSize:16, fontWeight:"900" },
  playerEmail:{ color:C.textDim, fontSize:12, marginTop:4 },

  section:      { marginBottom:24 },
  sectionLabel: { color:C.textDim, fontSize:10, fontWeight:"700", letterSpacing:3, marginBottom:12 },

  settingRow:   { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, padding:16, flexDirection:"row", alignItems:"center", gap:14 },
  settingInfo:  { flex:1 },
  settingTitle: { color:C.text, fontSize:14, fontWeight:"700" },
  settingDesc:  { color:C.textDim, fontSize:12, marginTop:4 },

  timePickerCard: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, padding:16, gap:8, marginTop:10 },
  timePickerLabel:{ color:C.text, fontSize:12, fontWeight:"900", letterSpacing:1 },
  timePickerSub:  { color:C.textDim, fontSize:11, lineHeight:16 },
  pickerGroupLabel:{ color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2, marginTop:8 },

  pickerScroll: { flexGrow:0 },
  pickerChip:   { paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:C.border, borderRadius:4, marginRight:8, backgroundColor:C.surface2 },
  pickerChipActive: { borderColor:C.accent, backgroundColor:C.accent+"22" },
  pickerChipText:   { color:C.textDim, fontSize:12, fontWeight:"700" },

  minuteRow:  { flexDirection:"row", gap:8 },
  minuteChip: { flex:1, paddingVertical:10, borderWidth:1, borderColor:C.border, borderRadius:4, alignItems:"center", backgroundColor:C.surface2 },

  selectedTimeRow:  { flexDirection:"row", justifyContent:"space-between", alignItems:"center", backgroundColor:C.surface2, borderRadius:4, padding:12, marginTop:8 },
  selectedTimeLabel:{ color:C.textDim, fontSize:9, fontWeight:"700", letterSpacing:2 },
  selectedTimeValue:{ color:C.accent, fontSize:16, fontWeight:"900" },

  saveBtn:     { backgroundColor:C.accent, borderRadius:4, paddingVertical:14, alignItems:"center", marginTop:4 },
  saveBtnText: { color:C.bg, fontSize:12, fontWeight:"900", letterSpacing:2 },

  notifInfoCard: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:4, overflow:"hidden" },
  notifInfoRow:  { flexDirection:"row", alignItems:"center", gap:14, padding:14 },
  notifInfoEmoji:{ fontSize:24, width:32 },
  notifInfoText: { flex:1 },
  notifInfoTitle:{ color:C.text, fontSize:13, fontWeight:"700" },
  notifInfoDesc: { color:C.textDim, fontSize:11, marginTop:2 },

  logoutBtn:     { backgroundColor:C.danger+"22", borderWidth:1, borderColor:C.danger+"66", borderRadius:4, paddingVertical:16, alignItems:"center" },
  logoutBtnText: { color:C.danger, fontSize:13, fontWeight:"900", letterSpacing:2 },

  version: { color:C.textDim, fontSize:11, textAlign:"center", marginTop:8, letterSpacing:1 },
});