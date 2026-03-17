import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLyJWy29S0iWqUzSP7otMgQdr0WyQ_OSk",
  authDomain: "athral-world.firebaseapp.com",
  projectId: "athral-world",
  storageBucket: "athral-world.firebasestorage.app",
  messagingSenderId: "508202960976",
  appId: "1:508202960976:web:e019c310b204200bffa955",
};

const app = initializeApp(firebaseConfig);

// Auth con persistencia — el usuario no tendrá que iniciar sesión cada vez
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);