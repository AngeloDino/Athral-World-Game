import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Configuración base ───────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

// ─── Frases motivacionales del mundo de Athral ───────────────────────────────
const MOTIVATION_MESSAGES = [
  { title: "⚔️ Athral te llama",           body: "Los monstruos de hoy no van a derrotarse solos." },
  { title: "🔥 Tu racha te espera",         body: "Cada rep cuenta. Cada día importa." },
  { title: "💪 El mundo necesita héroes",   body: "¿Vas a entrenar hoy o dejarás que otros tomen tu lugar?" },
  { title: "🗼 La Torre sigue en pie",      body: "¿Hasta qué piso llegarás hoy?" },
  { title: "⭐ Tu personaje te necesita",   body: "Sin entrenamiento no hay poder. Sin poder no hay victoria." },
  { title: "🧙 El Arcanista Maldito ríe",  body: "Dice que no te atreverás a enfrentarlo hoy." },
  { title: "🌑 Las sombras se acercan",     body: "Solo los que entrenan sobreviven la noche." },
  { title: "💀 El Esqueleto Guardia espera",body: "¿Puedes derrotarlo antes de que caiga el sol?" },
  { title: "🏆 Leyendas no nacen",         body: "Se forjan. Rep a rep. Día a día." },
  { title: "⚡ Energía de cazador",         body: "Siente el poder que crece con cada entrenamiento." },
];

const STREAK_DANGER_MESSAGES = [
  { title: "⚠️ ¡Tu racha está en peligro!", body: "Completa al menos una misión hoy para mantenerla." },
  { title: "🔥 No pierdas tu racha",         body: "Has entrenado muchos días seguidos. No lo desperdicies." },
  { title: "💀 La racha muere a medianoche", body: "Tienes tiempo. Completa una misión ahora." },
];

// ─── Pedir permisos ───────────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Cancelar todas las notificaciones programadas ───────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Programar notificación de racha en peligro ───────────────────────────────
// Se dispara diariamente a la hora que el usuario elija
export async function scheduleStreakDangerNotification(hour, minute) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const msg = STREAK_DANGER_MESSAGES[Math.floor(Math.random() * STREAK_DANGER_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body:  msg.body,
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });

  // Guardar configuración
  await AsyncStorage.setItem("notification_hour",   String(hour));
  await AsyncStorage.setItem("notification_minute", String(minute));
}

// ─── Programar motivación aleatoria ──────────────────────────────────────────
// Una notificación al día a hora aleatoria entre 9am y 6pm
export async function scheduleRandomMotivation() {
  // Cancelar motivaciones anteriores
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === "motivation") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const msg  = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
  const hour = Math.floor(Math.random() * 9) + 9; // entre 9am y 6pm

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body:  msg.body,
      sound: true,
      data:  { type: "motivation" },
    },
    trigger: {
      hour,
      minute: Math.floor(Math.random() * 60),
      repeats: true,
    },
  });
}

// ─── Inicializar todas las notificaciones ────────────────────────────────────
export async function initNotifications() {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  // Recuperar hora guardada o usar 8pm por defecto
  const savedHour   = await AsyncStorage.getItem("notification_hour");
  const savedMinute = await AsyncStorage.getItem("notification_minute");
  const hour   = savedHour   ? parseInt(savedHour)   : 20;
  const minute = savedMinute ? parseInt(savedMinute) : 0;

  await scheduleStreakDangerNotification(hour, minute);
  await scheduleRandomMotivation();

  return true;
}

// ─── Obtener configuración guardada ──────────────────────────────────────────
export async function getSavedNotificationTime() {
  const hour   = await AsyncStorage.getItem("notification_hour");
  const minute = await AsyncStorage.getItem("notification_minute");
  return {
    hour:   hour   ? parseInt(hour)   : 20,
    minute: minute ? parseInt(minute) : 0,
  };
}