# Athral World — Game Systems Design
**Version 1.0 — MVP**

---

## 1. Philosophy

Athral World's progression is built on a single principle: **players must feel real-world improvement and in-game improvement simultaneously.**

This means:
- Early levels come quickly to build habit and momentum
- Later levels require more work — but by then the player is genuinely fitter
- Every rep in the real world maps to a meaningful action in the game world

The curve is **accelerated early, plateauing mid-game, then requiring mastery** — mirroring how physical fitness actually works.

---

## 2. Stats System

### 2.1 The Four Core Stats

| Stat | Symbol | Governs |
|------|--------|---------|
| Strength | STR | Physical power, damage output in combat |
| Agility | AGI | Speed, dodge chance, combo speed |
| Endurance | END | Stamina pool, time bonuses in combat |
| Vitality | VIT | Max HP, damage tolerance |

### 2.2 Exercise → Stat Mapping

Each exercise contributes primarily to one stat and secondarily to another.

| Exercise | Primary Stat (+2) | Secondary Stat (+1) |
|----------|-------------------|----------------------|
| Push-ups | STR | END |
| Squats | AGI | VIT |
| Sit-ups | END | STR |

**Rule:** Stat points are awarded per milestone within a session, not per rep.

### 2.3 Stat Milestones (per exercise session)

| Reps Completed | Stat Points Awarded |
|----------------|---------------------|
| 10 reps | +1 Primary |
| 25 reps | +2 Primary, +1 Secondary |
| 50 reps | +3 Primary, +2 Secondary |
| 100 reps | +5 Primary, +3 Secondary |

Stats are **cumulative** — completing 50 reps gives the 10 and 25 milestones automatically.

### 2.4 Stat Influence on Gameplay

```
STR  →  Damage dealt per rep in combat
AGI  →  Time bonus per successful streak in combat
END  →  Max timer duration in combat
VIT  →  HP pool (absorbs failed combat attempts without full loss)
```

**Combat damage formula:**
```
damage_per_rep = base_damage × (1 + STR / 100)
time_bonus     = base_time   × (1 + AGI / 150)
max_timer      = base_timer  + (END × 0.5 seconds)
max_hp         = 100 + (VIT × 5)
```

---

## 3. XP System

### 3.1 XP Sources

| Source | XP Awarded |
|--------|------------|
| Daily Mission — Easy | 50 XP |
| Daily Mission — Medium | 100 XP |
| Daily Mission — Hard | 175 XP |
| Monster Defeated — Common | 80–120 XP |
| Monster Defeated — Elite | 200–350 XP |
| Dungeon Cleared | 500 XP bonus |
| Streak Bonus (7 days) | +25% XP on all sources for 24h |

### 3.2 XP to Level Formula

```
xp_required(level) = 100 × level^1.6
```

**Level progression table (key levels):**

| Level | XP to Next Level | Cumulative XP |
|-------|-----------------|---------------|
| 1 | 100 | 0 |
| 2 | 193 | 100 |
| 3 | 303 | 293 |
| 5 | 574 | 922 |
| 10 | 1,512 | 5,278 |
| 20 | 4,595 | 23,816 |
| 30 | 9,365 | 70,141 |
| 50 | 25,357 | 278,543 |

**Design rationale:** A new player completing daily missions consistently can reach Level 10 in ~2 weeks. Level 30 requires roughly 3–4 months of daily play — by which point the habit is formed.

### 3.3 Level Cap

MVP cap: **Level 50**

This can be raised in future patches with new world zones and story content.

---

## 4. Daily Mission System

### 4.1 Mission Structure

Each day, the player receives **3 missions** — one per difficulty tier.

**Mission pool examples:**

| Difficulty | Example Mission | XP |
|------------|----------------|-----|
| Easy | Complete 15 push-ups | 50 XP |
| Medium | Complete 30 squats + 20 sit-ups | 100 XP |
| Hard | Complete 50 push-ups + 40 squats + 30 sit-ups | 175 XP |

Missions reset at **midnight (local time)**.

### 4.2 Streak System

| Streak Days | Bonus |
|-------------|-------|
| 3 days | +10% XP all sources |
| 7 days | +25% XP all sources + cosmetic reward |
| 14 days | +40% XP all sources |
| 30 days | +50% XP + title unlock |

Missing a day **resets the streak to 0**.

### 4.3 Mission Generation Rules (Firestore)

Missions are generated server-side daily. Rules:
- Hard missions scale with player level (reps increase slightly per 10 levels)
- Easy missions never exceed 20 reps of any single exercise at MVP
- Future: missions can include world-event themes

---

## 5. Combat System

### 5.1 Core Loop

```
1. Player enters zone → selects monster
2. Combat screen loads:
   - Player character sprite (left)
   - Monster sprite (right)
   - HP bar (monster)
   - Timer countdown
   - Rep counter button
3. Player taps button per rep → deals damage
4. Win condition:  monster HP reaches 0 before timer ends
5. Lose condition: timer reaches 0 before monster HP is depleted
```

### 5.2 Combat Parameters

Each monster has:
- **HP** — total damage needed to defeat it
- **Rep Type** — which exercise is used (push-ups, squats, or sit-ups)
- **Timer** — seconds to complete the challenge
- **XP Reward** — awarded on win

**Base damage per rep** = `10 × (1 + STR / 100)`

Example at STR 0: each tap = 10 damage
Example at STR 50: each tap = 15 damage

### 5.3 Monster Tiers (MVP)

| Tier | HP | Timer | Rep Type | XP Reward |
|------|----|-------|----------|-----------|
| Weak Slime | 50 | 60s | Push-ups | 80 XP |
| Forest Goblin | 100 | 60s | Squats | 100 XP |
| Cave Troll | 200 | 90s | Sit-ups | 150 XP |
| Dungeon Guard | 300 | 90s | Push-ups | 200 XP |
| Shadow Beast | 500 | 120s | Mixed* | 350 XP |

*Mixed: player completes reps of two exercise types in sequence.

### 5.4 Monster Respawn Rule

Monsters do **NOT** respawn on the same calendar day after being defeated.

Implementation:
```
monsters/{monsterId}/defeatedBy/{userId} → { date: "YYYY-MM-DD" }
```

On zone load, the client checks if today's date matches the defeated date. If so, the monster is shown as "Defeated" until midnight.

### 5.5 Win / Lose Outcomes

**Win:**
- XP awarded
- Stat points from exercise reps within the session
- Monster marked defeated for the day
- Loot drop check (future: inventory system)

**Lose:**
- No XP
- No stat points from combat reps
- Monster remains available to challenge again immediately
- A short cooldown (30 seconds) before re-entering the same combat

---

## 6. Firestore Data Model

### 6.1 User Document

```
users/{userId}
  ├── username: string
  ├── level: number
  ├── xp: number
  ├── xpToNextLevel: number
  ├── clan: string | null
  ├── title: string
  ├── streak: number
  ├── lastActiveDate: string (YYYY-MM-DD)
  ├── stats:
  │     ├── STR: number
  │     ├── AGI: number
  │     ├── END: number
  │     └── VIT: number
  └── createdAt: timestamp
```

### 6.2 Daily Missions

```
users/{userId}/dailyMissions/{date}
  ├── easy:   { type, reps, completed: bool, xpRewarded: bool }
  ├── medium: { type, reps, completed: bool, xpRewarded: bool }
  └── hard:   { type, reps, completed: bool, xpRewarded: bool }
```

### 6.3 Monster Defeat Log

```
monsters/{monsterId}/defeats/{userId}
  └── date: string (YYYY-MM-DD)
```

### 6.4 Inventory (future-ready)

```
users/{userId}/inventory/{itemId}
  ├── name: string
  ├── type: string
  ├── quantity: number
  └── acquiredAt: timestamp
```

---

## 7. XP & Level-Up Logic (Client-Side + Firestore)

```javascript
// xpSystem.js

const XP_EXPONENT = 1.6;

export function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, XP_EXPONENT));
}

export function calculateLevelUp(currentXP, currentLevel) {
  let xp = currentXP;
  let level = currentLevel;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  return { newLevel: level, remainingXP: xp };
}

export function awardXP(userId, xpGained) {
  // Read user doc, add XP, check for level up, write back
  // Use Firestore transaction to prevent race conditions
}
```

**Important:** All XP and level mutations must use **Firestore transactions** to prevent double-awarding if the user is on multiple devices.

---

## 8. Security Rules (Firestore)

```
// Never allow client to directly write XP or level
// All XP changes go through Cloud Functions

match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Only Cloud Functions write this
}
```

XP, level, and stat awards are handled by **Cloud Functions** triggered by verified exercise completion events — preventing cheating.

---

## 9. Anti-Cheat Considerations

- Rep taps are throttled: max **3 taps/second** accepted (human physiological limit)
- Combat sessions are timestamped server-side
- Suspicious sessions (e.g. 200 reps in 10 seconds) are flagged and XP withheld pending review
- In the future, optional camera verification can be added

---

## 10. Future Expansion Hooks

| System | How Current Design Supports It |
|--------|-------------------------------|
| PvP | Stats already affect combat math; add opponent HP as second bar |
| Clans | Clan field already in user doc; add clan leaderboards collection |
| World Events | XP multipliers and mission pools can be event-themed |
| New Exercises | Just add new exercise → stat mappings |
| Prestige System | Level cap raises; add `prestige: number` to user doc |
| Leaderboards | Firestore collection `leaderboards/weekly` updated via Cloud Function |
