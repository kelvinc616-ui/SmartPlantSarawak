import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function ObservationDetails({ route }) {
  // Safe read with logs
  const params = route?.params ?? {};
  const obs = params.observation ?? null;

  console.log("🧾 route.params =", params);
  console.log("🧪 obs =", obs);

  if (!obs) {
    // Render a friendly fallback instead of crashing
    return (
      <View style={styles.container}>
        <Text style={styles.error}>❌ No observation data passed to this screen.</Text>
        <Text style={styles.hint}>
          Try tapping a card on the Home screen again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Local image object (no {uri: ...}) */}
      <Image source={obs.image} style={styles.image} resizeMode="cover" />

      <Text style={styles.title}>{obs.species}</Text>
      <Text style={styles.info}>
        Confidence: {typeof obs.confidence === "number" ? `${(obs.confidence * 100).toFixed(1)}%` : "N/A"}
      </Text>
      <Text style={styles.info}>Location: {obs.location || "Unknown"}</Text>
      <Text style={styles.info}>Status: {obs.status || "Pending"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F8FA" },
  image: { width: "100%", height: 250, borderRadius: 10, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#2E7D32", marginBottom: 10 },
  info: { fontSize: 16, color: "#333", marginBottom: 6 },
  error: { fontSize: 18, color: "red", marginBottom: 6, textAlign: "center" },
  hint: { fontSize: 14, color: "#555", textAlign: "center" },
});
