import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { registerUser, loginUser } from "../firebase/auth";

// ─── Theme ───────────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  border: "#2a2a3d",
  borderGlow: "#4a3f8a",
  primary: "#7c5cbf",
  primaryLight: "#a07de0",
  accent: "#e8c84a",
  accentDim: "#a08a2a",
  text: "#e8e0f0",
  textDim: "#6a6080",
  error: "#e05555",
  success: "#55c080",
};

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }
    if (mode === "register" && !username) {
      Alert.alert("Error", "Ingresa un nombre de usuario.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const newUser = await registerUser(email.trim(), password, username.trim());
        onAuthSuccess?.(newUser);
      } else {
        await loginUser(email.trim(), password);
      }
      // Navigator will auto-redirect when auth state changes
    } catch (error) {
      const messages = {
        "auth/email-already-in-use": "Este correo ya está registrado.",
        "auth/invalid-email": "Correo inválido.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/user-not-found": "No existe una cuenta con este correo.",
        "auth/weak-password": "La contraseña es muy débil.",
        "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
      };
      Alert.alert("Error", messages[error.code] || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo ── */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoTop}>⚔️</Text>
          <Text style={styles.logoTitle}>ATHRAL</Text>
          <Text style={styles.logoSubtitle}>W O R L D</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoTagline}>Forja tu cuerpo. Conquista el mundo.</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {/* Mode tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                INICIAR SESIÓN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                REGISTRARSE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            {mode === "register" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>NOMBRE DE JUGADOR</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre en el mundo..."
                  placeholderTextColor={COLORS.textDim}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  maxLength={20}
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CORREO</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.textDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === "register" ? "new-password" : "password"}
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "⚔  ENTRAR AL MUNDO" : "✦  CREAR PERSONAJE"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Athral World v0.1 — MVP</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoTop: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 12,
  },
  logoSubtitle: {
    fontSize: 14,
    color: COLORS.primaryLight,
    letterSpacing: 10,
    marginTop: -4,
  },
  logoDivider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.borderGlow,
    marginVertical: 16,
  },
  logoTagline: {
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 1,
    fontStyle: "italic",
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    backgroundColor: "#1a1a28",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDim,
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: COLORS.accent,
  },

  // Fields
  fields: {
    padding: 24,
    gap: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primaryLight,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },

  // Button
  button: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Footer
  footer: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
});