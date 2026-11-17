import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "../../src/api";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalPaise: number;
  paidPaise: number;
  status: string;
}

function rupees(paise: number) {
  return "₹" + (paise / 100).toFixed(2);
}

export default function FeesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.invoices();
      if (res.error) setError(res.error.message);
      else setInvoices(res.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <FlatList
      data={invoices}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No invoices yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.invoiceNumber}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>{rupees(item.totalPaise)}</Text>
            <Text style={styles.paid}>Paid {rupees(item.paidPaise)}</Text>
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
  name: { fontWeight: "600", color: "#1a2a3a" },
  meta: { fontSize: 12, color: "#64748b" },
  amount: { fontWeight: "700", color: "#0f4c81" },
  paid: { fontSize: 11, color: "#64748b" },
});
