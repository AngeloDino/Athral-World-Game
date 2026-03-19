import { MISSION_XP, MISSION_TIME } from "../systems/missionSystem";

export const DIFFICULTY_CONFIG_MAP = {
  easy:   { label: "FÁCIL",   color: "#55c080", emoji: "🟢", xp: MISSION_XP.easy,   time: MISSION_TIME.easy   },
  medium: { label: "MEDIO",   color: "#e8c84a", emoji: "🟡", xp: MISSION_XP.medium, time: MISSION_TIME.medium },
  hard:   { label: "DIFÍCIL", color: "#e05555", emoji: "🔴", xp: MISSION_XP.hard,   time: MISSION_TIME.hard   },
};