import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "../../src/api";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.students();
      if (res.error) setError(res.error.message);
      else setStudents(res.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <FlatList
      data={students}
      keyExtractor={(s) => s.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No students yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.firstName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.name}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.meta}>Admission {item.admissionNumber}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, textAlign: "center", marginTop: 40, color: "#64748b" },
  list: { padding: 12, backgroundColor: "#f5f7fa" },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f4c81",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  name: { fontWeight: "600", color: "#1a2a3a" },
  meta: { fontSize: 12, color: "#64748b" },
});
