import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthChange } from "../firebase/auth";
import { initNotifications } from "../systems/notificationSystem";

import SplashScreen             from "../screens/SplashScreen";
import OnboardingScreen         from "../screens/OnboardingScreen";
import AuthScreen               from "../screens/AuthScreen";
import MainMenuScreen           from "../screens/MainMenuScreen";
import TrainingScreen           from "../screens/TrainingScreen";
import WorldScreen              from "../screens/WorldScreen";
import StatisticsScreen         from "../screens/StatisticsScreen";
import CombatScreen             from "../screens/CombatScreen";
import ZoneScreen               from "../screens/ZoneScreen";
import SettingsScreen           from "../screens/SettingsScreen";
import CharacterCreationScreen  from "../screens/CharacterCreationScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser]         = useState(undefined);
  const [appState, setAppState] = useState("waiting");

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (firebaseUser) initNotifications();
      setAppState("splash");
    });
    return unsub;
  }, []);

  async function handleSplashFinish() {
    if (!user) { setAppState("auth"); return; }
    const onboardingDone = await AsyncStorage.getItem(`onboarding_done_${user.uid}`);
    const characterDone  = await AsyncStorage.getItem(`character_created_${user.uid}`);
    if (!onboardingDone)      setAppState("onboarding");
    else if (!characterDone)  setAppState("character");
    else                      setAppState("app");
  }

  async function handleOnboardingFinish() {
    if (user) await AsyncStorage.setItem(`onboarding_done_${user.uid}`, "true");
    setAppState("character");
  }

  async function handleCharacterCreationFinish() {
    if (user) await AsyncStorage.setItem(`character_created_${user.uid}`, "true");
    setAppState("app");
  }

  async function handleAuthSuccess(newUser) {
    const onboardingDone = await AsyncStorage.getItem(`onboarding_done_${newUser.uid}`);
    const characterDone  = await AsyncStorage.getItem(`character_created_${newUser.uid}`);
    if (!onboardingDone)     setAppState("onboarding");
    else if (!characterDone) setAppState("character");
    else                     setAppState("app");
  }

  if (appState === "waiting") return <LoadingScreen />;
  if (appState === "splash")  return <SplashScreen onFinish={handleSplashFinish} />;
  if (appState === "onboarding") return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  if (appState === "character")  return <CharacterCreationScreen onFinish={handleCharacterCreationFinish} />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainMenu"   component={MainMenuScreen}   />
            <Stack.Screen name="Training"   component={TrainingScreen}   />
            <Stack.Screen name="World"      component={WorldScreen}      />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
            <Stack.Screen name="Combat"     component={CombatScreen}     />
            <Stack.Screen name="Zone"       component={ZoneScreen}       />
            <Stack.Screen name="Settings"   component={SettingsScreen}   />
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

function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      <Animated.Text style={{ fontSize: 48, opacity: pulse }}>⚔️</Animated.Text>
      <ActivityIndicator size="small" color="#4a3f8a" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:"#0a0a0f", justifyContent:"center", alignItems:"center" },
});