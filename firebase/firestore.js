import {
  doc, getDoc, setDoc,
  onSnapshot, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import { generateDailyMissions, todayString, statPointsFromReps, EXERCISES } from "../systems/missionSystem";
import { calculateLevelUp, xpRequiredForLevel, streakMultiplier, monsterTierBonus, DAILY_COMPLETE_BONUS_XP, calculateFinalXP } from "../systems/xpSystem";
import { applyClassAbilityXP } from "../systems/classAbilities";

// ─── User Profile ─────────────────────────────────────────────────────────────

export function listenToUserProfile(uid, callback) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// ─── Daily Missions ───────────────────────────────────────────────────────────

export async function getTodayMissions(uid, playerLevel, playerClass = null, playerFocus = null) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "dailyMissions", today);
  const snap  = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const missions = generateDailyMissions(playerLevel, playerClass, playerFocus);
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

// ─── Completar Misión ─────────────────────────────────────────────────────────

export async function completeMission(uid, difficulty, exercise, reps, meetsGoal) {
  const today      = todayString();
  const missionRef = doc(db, "users", uid, "dailyMissions", today);
  const userRef    = doc(db, "users", uid);

  return await runTransaction(db, async (tx) => {
    const missionSnap = await tx.get(missionRef);
    const userSnap    = await tx.get(userRef);
    if (!missionSnap.exists() || !userSnap.exists()) return {};

    const missionData = missionSnap.data();
    const mission     = missionData[difficulty];
    if (mission.completed) return {};

    const userData = userSnap.data();

    // ── Calcular XP con multiplicadores ──
    let baseXP = meetsGoal ? mission.xp : 0;

    // Multiplicador de racha
    const streak      = userData.streak ?? 0;
    const streakMult  = streakMultiplier(streak);
    const classBonus  = meetsGoal ? getClassXPBonus(userData.class, exercise, 0) : 1.0;
    const finalXP     = Math.floor(baseXP * streakMult * classBonus);

    // ── Verificar si completó las 3 misiones ──
    const difficulties  = ["easy", "medium", "hard"];
    const othersDone    = difficulties.filter(d => d !== difficulty && missionData[d]?.completed).length;
    const allDoneBonus  = othersDone === 2 && meetsGoal ? DAILY_COMPLETE_BONUS_XP : 0;

    const totalXPGain = finalXP + allDoneBonus;

    // ── Level up ──
    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + totalXPGain, userData.level);

    // ── Stats ──
    const { primary, secondary } = statPointsFromReps(reps);
    const exerciseConfig = EXERCISES[exercise];
    const newStats = { ...userData.stats };
    newStats[exerciseConfig.stat]          = (newStats[exerciseConfig.stat]          || 0) + primary;
    newStats[exerciseConfig.secondaryStat] = (newStats[exerciseConfig.secondaryStat] || 0) + secondary;

    // ── Streak ──
    const yesterday = getYesterdayString();
    let newStreak = streak;
    if (userData.lastActiveDate === yesterday) newStreak += 1;
    else if (userData.lastActiveDate !== today) newStreak = 1;

    tx.update(missionRef, { [`${difficulty}.completed`]: true });
    tx.update(userRef, {
      xp:             remainingXP,
      level:          newLevel,
      xpToNextLevel:  xpRequiredForLevel(newLevel),
      stats:          newStats,
      streak:         newStreak,
      lastActiveDate: today,
      totalMissions:  (userData.totalMissions ?? 0) + 1,
      totalXP:        (userData.totalXP ?? 0) + totalXPGain,
    });

    return {
      xpGained:      totalXPGain,
      streakMult,
      classBonus,
      allDoneBonus,
      leveledUp:     newLevel > userData.level,
    };
  });
}

// ─── Modo Libre ───────────────────────────────────────────────────────────────

export async function completeFreeTrain(uid, exercise, reps) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    const { primary, secondary } = statPointsFromReps(reps);
    const exerciseConfig = EXERCISES[exercise];
    const newStats = { ...userData.stats };
    newStats[exerciseConfig.stat]          = (newStats[exerciseConfig.stat]          || 0) + primary;
    newStats[exerciseConfig.secondaryStat] = (newStats[exerciseConfig.secondaryStat] || 0) + secondary;
    tx.update(userRef, { stats: newStats });
  });
}

// ─── Derrotar Monstruo ────────────────────────────────────────────────────────

export async function defeatMonster(uid, monster) {
  const today   = todayString();
  const userRef = doc(db, "users", uid);
  const defRef  = doc(db, "users", uid, "defeatedMonsters", `${monster.id}_${today}`);

  return await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return {};
    const userData = userSnap.data();

    // Multiplicadores: racha + tier + clase
    const streakMult  = streakMultiplier(userData.streak ?? 0);
    const tierMult    = monsterTierBonus(monster.tier);
    const classBonus  = getClassXPBonus(userData.class, monster.exercise, 0);
    const finalXP     = Math.floor(monster.xp * streakMult * tierMult * classBonus);

    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + finalXP, userData.level);
    const newStats = { ...userData.stats };
    Object.entries(monster.statReward || {}).forEach(([stat, val]) => {
      newStats[stat] = (newStats[stat] || 0) + val;
    });

    tx.set(defRef, { monsterId: monster.id, date: today, xp: finalXP });
    tx.update(userRef, {
      xp: remainingXP, level: newLevel,
      xpToNextLevel: xpRequiredForLevel(newLevel),
      stats: newStats,
      monstersKilled: (userData.monstersKilled ?? 0) + 1,
      totalXP: (userData.totalXP ?? 0) + finalXP,
    });

    return { xpGained: finalXP, streakMult, tierMult, classBonus };
  });
}

export async function checkMonsterDefeated(uid, monsterId) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "defeatedMonsters", `${monsterId}_${today}`);
  const snap  = await getDoc(ref);
  return snap.exists();
}

// ─── Torre de Babel ───────────────────────────────────────────────────────────

export async function getTowerProgress(uid) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "towerSessions", today);
  const snap  = await getDoc(ref);
  if (snap.exists()) return snap.data();
  return { floor: 1, active: true, defeated: false };
}

export async function defeatTowerFloor(uid, monster) {
  const today   = todayString();
  const userRef = doc(db, "users", uid);
  const sessRef = doc(db, "users", uid, "towerSessions", today);

  return await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return {};
    const userData = userSnap.data();

    const streakMult = streakMultiplier(userData.streak ?? 0);
    const tierMult   = monsterTierBonus(monster.tier ?? "común");
    const classBonus = getClassXPBonus(userData.class, monster.exercise, 0);
    const finalXP    = Math.floor(monster.xp * streakMult * tierMult * classBonus);

    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + finalXP, userData.level);
    const newStats = { ...userData.stats };
    Object.entries(monster.statReward || {}).forEach(([stat, val]) => {
      newStats[stat] = (newStats[stat] || 0) + val;
    });

    const newRecord = Math.max(userData.towerRecord ?? 0, monster.floor);

    tx.set(sessRef, { floor: monster.floor + 1, active: true, defeated: false, date: today }, { merge: true });
    tx.update(userRef, {
      xp: remainingXP, level: newLevel,
      xpToNextLevel: xpRequiredForLevel(newLevel),
      stats: newStats, towerRecord: newRecord,
      monstersKilled: (userData.monstersKilled ?? 0) + 1,
      totalXP: (userData.totalXP ?? 0) + finalXP,
    });

    return { xpGained: finalXP, streakMult, tierMult };
  });
}

export async function failTowerSession(uid) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "towerSessions", today);
  await setDoc(ref, { active: false, defeated: true, date: today }, { merge: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// Retorna el multiplicador de XP de clase para un ejercicio dado
function getClassXPBonus(classId, exercise, timeRemaining) {
  const bonuses = {
    warrior:  exercise === "pushups" ? 1.25 : 1.0,
    mage:     1.0, // el bonus del mago es en timer, no en XP
    archer:   1.0, // el bonus del arquero es en reps, no en XP
    monk:     1.15,
    assassin: timeRemaining > 30 ? 2.0 : 1.0,
  };
  return bonuses[classId] ?? 1.0;
}

// ─── Derrotar Jefe ────────────────────────────────────────────────────────────

export async function defeatBoss(uid, boss) {
  const today   = todayString();
  const userRef = doc(db, "users", uid);
  const defRef  = doc(db, "users", uid, "defeatedBosses", `${boss.id}_${today}`);

  // Verificar si ya fue derrotado hoy
  const existing = await getDoc(defRef);
  if (existing.exists()) return { xpGained: 0, alreadyDefeated: true };

  return await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return {};
    const userData = userSnap.data();

    const streakMult = streakMultiplier(userData.streak ?? 0);
    const tierMult   = monsterTierBonus("jefe");
    const classBonus = getClassXPBonus(userData.class, "mixed", 0);
    const finalXP    = Math.floor(boss.xp * streakMult * tierMult * classBonus);

    const { newLevel, remainingXP } = calculateLevelUp(userData.xp + finalXP, userData.level);
    const newStats = { ...userData.stats };
    Object.entries(boss.statReward || {}).forEach(([stat, val]) => {
      newStats[stat] = (newStats[stat] || 0) + val;
    });

    tx.set(defRef, { bossId: boss.id, date: today, xp: finalXP });
    tx.update(userRef, {
      xp: remainingXP, level: newLevel,
      xpToNextLevel: xpRequiredForLevel(newLevel),
      stats: newStats,
      monstersKilled: (userData.monstersKilled ?? 0) + 1,
      totalXP: (userData.totalXP ?? 0) + finalXP,
    });

    return { xpGained: finalXP, streakMult, tierMult };
  });
}

export async function checkBossDefeated(uid, bossId) {
  const today = todayString();
  const ref   = doc(db, "users", uid, "defeatedBosses", `${bossId}_${today}`);
  const snap  = await getDoc(ref);
  return snap.exists();
}

// ─── Completar Pomodoro ───────────────────────────────────────────────────────

export async function completePomodoro(uid, intGain = 1) {
  const userRef = doc(db, "users", uid);
  const today   = todayString();

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;
    const data = userSnap.data();

    const newStats = { ...data.stats };
    newStats["INT"] = (newStats["INT"] || 0) + intGain;

    tx.update(userRef, {
      stats:            newStats,
      lastActiveDate:   today,
      totalPomodoros:   (data.totalPomodoros ?? 0) + 1,
    });
  });
}