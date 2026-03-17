import {
  doc, getDoc, setDoc,
  onSnapshot, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import { generateDailyMissions, todayString, statPointsFromReps, EXERCISES } from "../systems/missionSystem";
import { calculateLevelUp, xpRequiredForLevel } from "../systems/xpSystem";

// ─── User Profile ─────────────────────────────────────────────────────────────

export function listenToUserProfile(uid, callback) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// ─── Daily Missions ───────────────────────────────────────────────────────────

export async function getTodayMissions(uid, playerLevel) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "dailyMissions", today);
  const snap  = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const missions = generateDailyMissions(playerLevel);
  await setDoc(ref, { ...missions, generatedAt: serverTimestamp() });
  return missions;
}

export function listenToTodayMissions(uid, callback) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "dailyMissions", today);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// ─── Completar Misión (con tiempo límite) ─────────────────────────────────────

export async function completeMission(uid, difficulty, exercise, reps, meetsGoal) {
  const today      = todayString();
  const missionRef = doc(db, "users", uid, "dailyMissions", today);
  const userRef    = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const missionSnap = await tx.get(missionRef);
    const userSnap    = await tx.get(userRef);
    if (!missionSnap.exists() || !userSnap.exists()) return;

    const mission  = missionSnap.data()[difficulty];
    if (mission.completed) return;

    const userData = userSnap.data();

    // XP solo si cumplió la meta dentro del tiempo
    const xpGain = meetsGoal ? mission.xp : 0;
    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + xpGain, userData.level);

    // Stats siempre se ganan
    const { primary, secondary } = statPointsFromReps(reps);
    const exerciseConfig = EXERCISES[exercise];
    const newStats = { ...userData.stats };
    newStats[exerciseConfig.stat]          = (newStats[exerciseConfig.stat]          || 0) + primary;
    newStats[exerciseConfig.secondaryStat] = (newStats[exerciseConfig.secondaryStat] || 0) + secondary;

    // Streak
    const yesterday = getYesterdayString();
    let newStreak = userData.streak || 0;
    if (userData.lastActiveDate === yesterday) newStreak += 1;
    else if (userData.lastActiveDate !== today) newStreak = 1;

    tx.update(missionRef, { [`${difficulty}.completed`]: true });
    tx.update(userRef, {
      xp: remainingXP, level: newLevel,
      xpToNextLevel: xpRequiredForLevel(newLevel),
      stats: newStats, streak: newStreak, lastActiveDate: today,
    });
  });
}

// ─── Modo Libre ───────────────────────────────────────────────────────────────

export async function completeFreeTrain(uid, exercise, reps) {
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();

    // Solo stats, sin XP
    const { primary, secondary } = statPointsFromReps(reps);
    const exerciseConfig = EXERCISES[exercise];
    const newStats = { ...userData.stats };
    newStats[exerciseConfig.stat]          = (newStats[exerciseConfig.stat]          || 0) + primary;
    newStats[exerciseConfig.secondaryStat] = (newStats[exerciseConfig.secondaryStat] || 0) + secondary;

    tx.update(userRef, { stats: newStats });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ─── World: Monster Defeat Log ────────────────────────────────────────────────

export async function checkMonsterDefeated(uid, monsterId) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "defeatedMonsters", `${monsterId}_${today}`);
  const snap  = await getDoc(ref);
  return snap.exists();
}

export async function defeatMonster(uid, monster) {
  const today   = todayString();
  const userRef = doc(db, "users", uid);
  const defRef  = doc(db, "users", uid, "defeatedMonsters", `${monster.id}_${today}`);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + monster.xp, userData.level);

    const newStats = { ...userData.stats };
    Object.entries(monster.statReward || {}).forEach(([stat, val]) => {
      newStats[stat] = (newStats[stat] || 0) + val;
    });

    tx.set(defRef, { monsterId: monster.id, date: today, xp: monster.xp });
    tx.update(userRef, {
      xp: remainingXP, level: newLevel,
      xpToNextLevel: xpRequiredForLevel(newLevel),
      stats: newStats,
      monstersKilled: (userData.monstersKilled ?? 0) + 1,
      totalXP: (userData.totalXP ?? 0) + monster.xp,
    });
  });
}

// ─── Torre de Babel ───────────────────────────────────────────────────────────

export async function getTowerProgress(uid) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "towerSessions", today);
  const snap  = await getDoc(ref);
  if (snap.exists()) return snap.data();
  return { floor: 1, active: true, defeated: false };
}

export async function saveTowerProgress(uid, floor, defeated = false) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "towerSessions", today);
  await setDoc(ref, { floor, active: !defeated, defeated, date: today }, { merge: true });
}

export async function defeatTowerFloor(uid, monster) {
  const today   = todayString();
  const userRef = doc(db, "users", uid);
  const sessRef = doc(db, "users", uid, "towerSessions", today);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + monster.xp, userData.level);

    const newStats = { ...userData.stats };
    Object.entries(monster.statReward || {}).forEach(([stat, val]) => {
      newStats[stat] = (newStats[stat] || 0) + val;
    });

    // Guardar récord personal de piso más alto
    const currentRecord = userData.towerRecord || 0;
    const newRecord     = Math.max(currentRecord, monster.floor);

    tx.set(sessRef, {
      floor: monster.floor + 1, active: true,
      defeated: false, date: today,
    }, { merge: true });

    tx.update(userRef, {
      xp: remainingXP, level: newLevel,
      xpToNextLevel: xpRequiredForLevel(newLevel),
      stats: newStats, towerRecord: newRecord,
      monstersKilled: (userData.monstersKilled ?? 0) + 1,
      totalXP: (userData.totalXP ?? 0) + monster.xp,
    });
  });
}

export async function failTowerSession(uid) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "towerSessions", today);
  await setDoc(ref, { active: false, defeated: true, date: today }, { merge: true });
}