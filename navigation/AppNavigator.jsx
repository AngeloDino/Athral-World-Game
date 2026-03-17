import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthChange } from "../firebase/auth";

import AuthScreen        from "../screens/AuthScreen";
import MainMenuScreen    from "../screens/MainMenuScreen";
import TrainingScreen    from "../screens/TrainingScreen";
import WorldScreen       from "../screens/WorldScreen";
import StatisticsScreen  from "../screens/StatisticsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => setUser(firebaseUser));
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e8c84a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainMenu"    component={MainMenuScreen}   />
            <Stack.Screen name="Training"    component={TrainingScreen}   />
            <Stack.Screen name="World"       component={WorldScreen}      />
            <Stack.Screen name="Statistics"  component={StatisticsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#0a0a0f", justifyContent: "center", alignItems: "center" },
});