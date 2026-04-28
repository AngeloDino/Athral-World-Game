# ⚔️ Athral World

> **A fitness RPG mobile app that turns your real workouts into in-game power.**
> Push-ups build strength. Squats raise agility. Every rep matters.

[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%2B_Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![EAS](https://img.shields.io/badge/EAS-OTA_Updates-4630EB?style=flat-square&logo=expo)](https://expo.dev/eas)

---

## 🎮 Demo

> 📹 **[Watch the app in action →](https://youtube.com/shorts/ar3ruSxsTAY)

---

## 📖 What is Athral World?

Athral World bridges the gap between fitness and gaming. Players choose one of **7 character classes**, complete **daily exercise missions**, and fight monsters in real-time combat — where your actual rep count deals the damage.

The core philosophy: **real-world improvement and in-game improvement must happen simultaneously.**

- 🏋️ Do push-ups → gain STR, deal more damage in combat
- 🦵 Do squats → gain AGI, unlock faster combos
- 🔥 Maintain streaks → unlock XP multipliers and titles
- ⚔️ Fight monsters in Bosque Oscuro with a live rep-based combat system

---

## 🏗️ Architecture & Technical Highlights

### Stack
| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native + Expo SDK 54 |
| Backend / Auth | Firebase Authentication |
| Database | Cloud Firestore |
| OTA Updates | EAS (Expo Application Services) |
| Navigation | React Navigation |

### Key Engineering Decisions

**Firestore Transactions for game state integrity**
All XP awards, level-ups, and mission completions run inside Firestore transactions — preventing race conditions when users are active on multiple devices simultaneously.

```javascript
// completeMission uses runTransaction to atomically:
// 1. Verify mission hasn't already been completed
// 2. Calculate XP with streak multiplier
// 3. Award bonus XP if all 3 daily missions are done
// 4. Update stats, level, and XP in a single atomic write
return await runTransaction(db, async (tx) => { ... });
```

**Date-seeded procedural content**
The rare Goblin Etéreo (18% spawn rate) is seeded by the current date — meaning all players share the same rare encounter window each day, creating community-wide events without any server coordination logic.

**Weighted mission generation per class + focus**
Daily missions are generated from a weighted pool combining the player's chosen class (60%) and training focus (40%), ensuring missions feel personalized without requiring manual curation.

```javascript
const pool = [
  ...(CLASS_POOL[classId] ?? defaultPool),   // 60% class identity
  ...(FOCUS_POOL[focusId]  ?? defaultPool),  // 40% training focus
].sort(/* Fisher-Yates shuffle */);
```

**Passive class abilities affecting combat math**
Each of the 7 classes modifies combat parameters differently. The Assassin doubles XP if the monster is defeated with 30+ seconds remaining. The Archer reduces squat rep requirements by 20%. All applied at runtime without storing ability state in Firestore.

---

## 🧩 Game Systems

### 7 Character Classes
`Caballero` · `Gladiador` · `Bárbaro` · `Mago` · `Arquero` · `Asesino` · `Científico`

Each class has unique passive abilities, a weighted exercise pool, and custom pixel art (32×48px sprites + card art).

### Stat System
| Stat | Exercise | Governs |
|------|----------|---------|
| STR | Push-ups | Damage per rep in combat |
| AGI | Squats | Time bonus per streak |
| END | Sit-ups | Max timer duration |
| VIT | Mixed | HP pool |

### Rank Progression
`F → E → D → C → B → A → S → SS → SSS`

### Combat (Bosque Oscuro)
Real-time rep-based combat: each tap = one rep = damage dealt. Win by depleting monster HP before the timer ends. Monster HP and damage scale with your STR stat.

Monsters include: `Slime Rojo` · `Lobo Sombra` · `Goblin Verde` · `Goblin Etéreo` (rare, 18% daily spawn)

---

## 📁 Project Structure

```
athral/
├── assets/
│   ├── classes/          ← Profile art + pixel art sprites per class
│   │   └── battle/       ← Combat art per class
│   ├── monsters/
│   │   └── dark_forest/  ← Monster art, sprites, battle scenes
│   ├── zones/            ← Combat background art
│   └── map/              ← World map
├── constants/
│   ├── theme.js          ← Design tokens (colors, spacing, typography)
│   ├── globalStyles.js   ← Global reusable styles
│   ├── classes.js        ← 7 class definitions
│   ├── monsters.js       ← Zones, monsters, bosses
│   └── labels.js         ← Stat and exercise translations
├── firebase/
│   ├── config.js         ← Firebase initialization
│   ├── auth.js           ← Registration and login
│   └── firestore.js      ← All data logic
├── systems/
│   ├── xpSystem.js       ← XP curve and level calculation
│   ├── rankSystem.js     ← F→SSS rank progression
│   ├── missionSystem.js  ← Daily mission generation
│   └── classAbilities.js ← Passive abilities per class
├── screens/              ← All app screens
├── components/           ← BattleIntro, overlays, modals
└── navigation/
    └── AppNavigator.jsx  ← Full app navigation flow
```

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/AngeloDino/athral.git
cd athral

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

> **Note:** You'll need your own Firebase project. Create a `.env` file with your Firebase config keys. A `.env.example` is included.

---

## 🗺️ Roadmap

- [x] Authentication + profile creation with Early Access badge system
- [x] 7 character classes with passive abilities
- [x] Daily mission system with streak multipliers
- [x] Real-time rep-based combat (Bosque Oscuro)
- [x] XP, leveling, and rank progression (F → SSS)
- [ ] Additional world zones (Montaña de Fuego, Abismo, and more)
- [ ] PvP system (stat infrastructure already in place)
- [ ] Clan system (field already in user document)
- [ ] Inventory and loot drops
- [ ] Weekly leaderboards via Cloud Functions
- [ ] Prestige system

---

## 👤 Author

**Angelo Velasquez** — Founder, New Tech Industries (NTI)

Building products at the intersection of fitness, gaming, and technology.

- 🎮 [Athral World on Gumroad](https://nti.gumroad.com/l/athralworld)
- 📺 [YouTube — Angelo Velasquez](https://youtube.com/@angelo_vel)
- 💼 [GitHub](https://github.com/AngeloDino)

---

## 📄 License

This project is source-available for portfolio purposes. All rights reserved — New Tech Industries © 2026.
