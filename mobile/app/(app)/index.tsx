import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.name ?? "User"}</Text>
      <Text style={styles.sub}>Welcome to School ERP</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <Pressable style={styles.action} onPress={() => router.push("/(app)/students")}>
          <Text style={styles.actionText}>View students</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => router.push("/(app)/attendance")}>
          <Text style={styles.actionText}>Mark attendance</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => router.push("/(app)/fees")}>
          <Text style={styles.actionText}>View fee invoices</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f7fa" },
  greeting: { fontSize: 24, fontWeight: "700", color: "#0f4c81" },
  sub: { color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontWeight: "700", color: "#1a2a3a", marginBottom: 12 },
  action: { backgroundColor: "#e6eff7", borderRadius: 10, padding: 14, marginBottom: 10 },
  actionText: { color: "#0f4c81", fontWeight: "600" },
  logout: {
    marginTop: 24,
    padding: 14,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  logoutText: { color: "#64748b", fontWeight: "600" },
});
