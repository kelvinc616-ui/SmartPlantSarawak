// IoTDashboard.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { db } from "../firebaseConfig"; // make sure this exports your initialized Firestore `db`
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

const COLLECTION_NAME = "sensorData"; // <- change this if your collection name differs
const DEFAULT_DEVICE_ID = "ESP32_001";

export default function IoTDashboard({ route }) {
  // If you navigate here with params you can pass deviceId via route.params.deviceId
  const deviceId = route?.params?.deviceId ?? DEFAULT_DEVICE_ID;

  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Parse timestamp (Firestore Timestamp or string or Date)
  const parseTimestamp = (value) => {
    if (!value) return null;
    // Firestore Timestamp has toDate()
    if (value.toDate && typeof value.toDate === "function") {
      return value.toDate();
    }
    // If ISO string or Date
    const maybeDate = new Date(value);
    if (!isNaN(maybeDate.getTime())) return maybeDate;
    return null;
  };

  const formatTime = (ts) => {
    if (!ts) return "N/A";
    const d = parseTimestamp(ts);
    if (!d) return "N/A";
    return d.toLocaleString(); // show localised date/time
  };

  // Subscribe to latest single doc (real-time)
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setLatest({ id: doc.id, ...doc.data() });
          } else {
            setLatest(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Realtime latest error:", err);
          setError("Failed to connect to Firestore realtime feed.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError("Initialization error.");
      setLoading(false);
    }
  }, [deviceId]);

  // Subscribe to recent history (last 10)
  useEffect(() => {
    setHistoryLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setHistory(arr);
          setHistoryLoading(false);
        },
        (err) => {
          console.error("Realtime history error:", err);
          setError("Failed to load history.");
          setHistoryLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError("Failed to initialize history.");
      setHistoryLoading(false);
    }
  }, [deviceId]);

  const refreshOnce = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      // manual fresh fetch for latest and history (in case onSnapshot missed)
      const latestQ = query(
        collection(db, COLLECTION_NAME),
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const historyQ = query(
        collection(db, COLLECTION_NAME),
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const [latestSnap, historySnap] = await Promise.all([
        getDocs(latestQ),
        getDocs(historyQ),
      ]);

      if (!latestSnap.empty) {
        const d = latestSnap.docs[0];
        setLatest({ id: d.id, ...d.data() });
      } else {
        setLatest(null);
      }

      setHistory(historySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Manual refresh error", err);
      setError("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [deviceId]);

  const renderCard = (label, value, unit = "") => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>
        {value === null || value === undefined ? "—" : `${value}${unit}`}
      </Text>
    </View>
  );

  const renderHistoryItem = ({ item }) => {
    const ts = parseTimestamp(item.timestamp);
    return (
      <View style={styles.historyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.historyTime}>
            {ts ? ts.toLocaleString() : "Unknown time"}
          </Text>
          <Text style={styles.historyMini}>
            T: {item.temperatureC ?? "—"}°C · H: {item.humidity ?? "—"}% ·
            Soil: {item.soilMoisture ?? "—"} · Rain:{" "}
            {item.isRaining ? "Yes" : "No"} ({item.rainPercent ?? "—"}%)
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IoT Dashboard</Text>
        <Text style={styles.headerSubtitle}>Device: {deviceId}</Text>
        <TouchableOpacity onPress={refreshOnce} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Connecting to device...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refreshOnce} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {renderCard(
              "Temperature",
              latest?.temperatureC,
              latest?.temperatureC ? "°C" : ""
            )}
            {renderCard("Humidity", latest?.humidity, latest?.humidity ? "%" : "")}
            {renderCard(
              "Soil Moisture",
              latest?.soilMoisture,
              latest?.soilMoisture ? "" : ""
            )}
            {renderCard("Raining", latest?.isRaining ? "Yes" : "No", "")}
            {renderCard(
              "Rain Percent",
              latest?.rainPercent,
              latest?.rainPercent ? "%" : ""
            )}
            <View style={[styles.card, styles.timestampCard]}>
              <Text style={styles.cardLabel}>Last Updated</Text>
              <Text style={styles.cardValue}>
                {formatTime(latest?.timestamp)}
              </Text>
            </View>
          </View>

          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent readings</Text>
              <Text style={styles.historyCount}>
                {history?.length ?? 0}
              </Text>
            </View>

            {historyLoading ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={renderHistoryItem}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={refreshOnce} />
                }
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No history for this device.</Text>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F7F8FA" },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSubtitle: { color: "#4B5563", marginTop: 4 },
  refreshBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: { color: "#fff", fontWeight: "600" },
  center: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  loadingText: { marginTop: 8, color: "#4B5563" },
  errorText: { color: "#DC2626", marginBottom: 8 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    elevation: 2,
  },
  timestampCard: { width: "100%" },
  cardLabel: { fontSize: 13, color: "#6B7280" },
  cardValue: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  historySection: { marginTop: 12, flex: 1 },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: { fontSize: 16, fontWeight: "700" },
  historyCount: { color: "#6B7280" },
  historyRow: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
    borderRadius: 10,
  },
  historyTime: { fontSize: 12, color: "#374151", fontWeight: "600" },
  historyMini: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  emptyText: { color: "#6B7280", textAlign: "center", marginTop: 8 },
});
