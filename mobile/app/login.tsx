import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@greenwood.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onPress() {
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    router.replace("/(app)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>S</Text>
      <Text style={styles.title}>School ERP</Text>
      <Text style={styles.subtitle}>Parent & teacher companion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={onPress} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
      <Text style={styles.demo}>Demo: admin@greenwood.local / Password123!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f5f7fa" },
  logo: { fontSize: 56, fontWeight: "800", color: "#0f4c81", textAlign: "center" },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", color: "#0f4c81" },
  subtitle: { fontSize: 13, textAlign: "center", color: "#64748b", marginBottom: 24 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    marginBottom: 12,
  },
  button: { backgroundColor: "#0f4c81", borderRadius: 10, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  demo: { marginTop: 16, textAlign: "center", fontSize: 11, color: "#94a3b8" },
  error: { color: "#dc2626", marginBottom: 8, textAlign: "center" },
});
