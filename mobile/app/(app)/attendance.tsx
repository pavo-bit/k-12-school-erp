import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { api } from "../../src/api";

type AttendanceStatus = "present" | "absent" | "late" | "half_day";

interface Section {
  id: string;
  name: string;
}
interface Session {
  id: string;
  sectionId: string;
  date: string;
  sessionType: string;
  status: string;
}
interface RosterStudent {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

const STATUS_OPTIONS: Array<{ key: AttendanceStatus; label: string }> = [
  { key: "present", label: "P" },
  { key: "absent", label: "A" },
  { key: "late", label: "L" },
  { key: "half_day", label: "H" },
];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "#15803d",
  absent: "#dc2626",
  late: "#ca8a04",
  half_day: "#7e22ce",
};

export default function AttendanceScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sectionId, setSectionId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadSections = useCallback(async () => {
    const res = await api.sections();
    setSections(res.data ?? []);
    if (res.data && res.data.length > 0 && !sectionId) {
      setSectionId(res.data[0]!.id);
    }
  }, [sectionId]);

  const loadRoster = useCallback(async () => {
    if (!sectionId) return;
    const res = await api.roster(sectionId);
    const students = res.data ?? [];
    setRoster(students);
    setMarks((prev) => {
      const next = { ...prev };
      for (const s of students) {
        if (!next[s.id]) next[s.id] = "present";
      }
      return next;
    });
  }, [sectionId]);

  const loadSessions = useCallback(async () => {
    if (!sectionId) return;
    const res = await api.sessions(sectionId, today);
    setSessions(res.data ?? []);
    if (res.data && res.data.length > 0) {
      setSessionId((current) => current || res.data![0]!.id);
    } else {
      setSessionId("");
    }
  }, [sectionId, today]);

  useEffect(() => {
    (async () => {
      await loadSections();
      setLoading(false);
    })();
  }, [loadSections]);

  useEffect(() => {
    loadRoster();
    loadSessions();
  }, [loadRoster, loadSessions]);

  async function createTodaySession() {
    if (!sectionId) return;
    setSaving(true);
    setMessage("");
    const res = await api.createSession(sectionId, today);
    if (res.data?.id) {
      setSessionId(res.data.id);
      await loadSessions();
      setMessage("Session created. Mark the roster and tap Save.");
    } else {
      setMessage(res.error?.message ?? "Could not create session.");
    }
    setSaving(false);
  }

  async function save() {
    if (!sessionId) {
      setMessage("Create or select a session for today first.");
      return;
    }
    setSaving(true);
    setMessage("");
    const records = roster.map((s) => ({ studentId: s.id, status: marks[s.id] ?? "present" }));
    const res = await api.markRoster(sessionId, records);
    if (res.data) {
      setMessage(`Saved attendance for ${res.data.count} students.`);
    } else {
      setMessage(res.error?.message ?? "Could not save attendance.");
    }
    setSaving(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadRoster(), loadSessions()]);
    setRefreshing(false);
  }

  if (loading) return <ActivityIndicator style={styles.center} />;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionRow}>
        {sections.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSectionId(s.id)}
            style={[styles.sectionChip, sectionId === s.id && styles.sectionChipActive]}
          >
            <Text
              style={[styles.sectionChipText, sectionId === s.id && styles.sectionChipTextActive]}
            >
              Section {s.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sessionBar}>
        {sessions.length > 0 ? (
          <Text style={styles.sessionInfo}>
            Today: {sessions[0]!.sessionType} · status{" "}
            <Text style={styles.sessionStatus}>{sessions[0]!.status}</Text>
          </Text>
        ) : (
          <View style={styles.sessionEmpty}>
            <Text style={styles.sessionEmptyText}>No session for today yet.</Text>
            <Pressable onPress={createTodaySession} disabled={saving} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Create session</Text>
            </Pressable>
          </View>
        )}
      </View>

      <FlatList
        data={roster}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No students in this section yet.</Text>}
        renderItem={({ item }) => {
          const current = marks[item.id] ?? "present";
          return (
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: STATUS_COLORS[current] }]}>
                <Text style={styles.avatarText}>{item.firstName.charAt(0)}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.meta}>{item.admissionNumber}</Text>
              </View>
              <View style={styles.markRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setMarks((m) => ({ ...m, [item.id]: opt.key }))}
                    style={[
                      styles.markButton,
                      current === opt.key && { backgroundColor: STATUS_COLORS[opt.key] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.markButtonText,
                        current === opt.key && styles.markButtonTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save attendance ({roster.length})</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  center: { flex: 1, textAlign: "center", marginTop: 40 },
  sectionRow: { flexGrow: 0, paddingHorizontal: 12, paddingVertical: 10 },
  sectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  sectionChipActive: { backgroundColor: "#0f4c81" },
  sectionChipText: { color: "#334155", fontWeight: "600", fontSize: 13 },
  sectionChipTextActive: { color: "#ffffff" },
  sessionBar: { paddingHorizontal: 12, paddingBottom: 8 },
  sessionInfo: { fontSize: 13, color: "#334155" },
  sessionStatus: { fontWeight: "700", color: "#0f4c81" },
  sessionEmpty: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sessionEmptyText: { fontSize: 13, color: "#b45309" },
  smallButton: {
    backgroundColor: "#0f4c81",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  list: { padding: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  rowText: { flex: 1 },
  name: { fontWeight: "600", color: "#1a2a3a", fontSize: 14 },
  meta: { fontSize: 11, color: "#64748b" },
  markRow: { flexDirection: "row", gap: 4 },
  markButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  markButtonText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  markButtonTextActive: { color: "#ffffff" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 12,
  },
  message: { fontSize: 12, color: "#334155", marginBottom: 8, textAlign: "center" },
  saveButton: { backgroundColor: "#0f4c81", borderRadius: 10, padding: 14, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
