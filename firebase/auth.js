import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

// ─── Register ────────────────────────────────────────────────────────────────
export async function registerUser(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create player profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    username,
    email,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    clan: null,
    title: "Novato",
    streak: 0,
    lastActiveDate: null,
    stats: {
      STR: 0,
      AGI: 0,
      END: 0,
      VIT: 0,
    },
    createdAt: serverTimestamp(),
  });

  return user;
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ─── Auth State Listener ─────────────────────────────────────────────────────
// Use this in your navigator to detect if user is logged in
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}