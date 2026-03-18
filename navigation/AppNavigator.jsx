import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthChange } from "../firebase/auth";

import SplashScreen     from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import AuthScreen       from "../screens/AuthScreen";
import MainMenuScreen   from "../screens/MainMenuScreen";
import TrainingScreen   from "../screens/TrainingScreen";
import WorldScreen      from "../screens/WorldScreen";
import StatisticsScreen from "../screens/StatisticsScreen";

const Stack = createNativeStackNavigator();

// Estados en orden estricto:
// "waiting"    → esperando que Firebase confirme auth (pantalla de carga)
// "splash"     → Firebase ya respondió, mostramos splash
// "onboarding" → usuario nuevo
// "auth"       → no logueado
// "app"        → logueado

export default function AppNavigator() {
  const [user, setUser]         = useState(undefined);
  const [appState, setAppState] = useState("waiting");

  // Paso 1 — Firebase responde
  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser ?? null);
      // Solo cuando Firebase confirma pasamos al splash
      setAppState("splash");
    });
    return unsub;
  }, []);

  // Paso 2 — Splash termina
  async function handleSplashFinish() {
    if (!user) {
      setAppState("auth");
      return;
    }
    const done = await AsyncStorage.getItem(`onboarding_done_${user.uid}`);
    setAppState(done ? "app" : "onboarding");
  }

  // Paso 3 — Onboarding termina
  async function handleOnboardingFinish() {
    if (user) {
      await AsyncStorage.setItem(`onboarding_done_${user.uid}`, "true");
    }
    setAppState("app");
  }

  // Paso 4 — Usuario nuevo se registra
  async function handleAuthSuccess(newUser) {
    const done = await AsyncStorage.getItem(`onboarding_done_${newUser.uid}`);
    setAppState(done ? "app" : "onboarding");
  }

  // ── Pantalla de carga mientras Firebase valida ────────────────────────────
  if (appState === "waiting") {
    return <LoadingScreen />;
  }

  if (appState === "splash") {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (appState === "onboarding") {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainMenu"   component={MainMenuScreen}   />
            <Stack.Screen name="Training"   component={TrainingScreen}   />
            <Stack.Screen name="World"      component={WorldScreen}      />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Pantalla de carga ─────────────────────────────────────────────────────────
function LoadingScreen() {
  const pulse = new Animated.Value(0.4);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingRoot}>
      <Animated.Text style={[styles.loadingEmoji, { opacity: pulse }]}>⚔️</Animated.Text>
      <ActivityIndicator size="small" color="#4a3f8a" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingEmoji: {
    fontSize: 48,
  },
});