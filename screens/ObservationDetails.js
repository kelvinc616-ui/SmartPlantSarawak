import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";

export default function ObservationDetails({ route }) {
  const params = route?.params ?? {};
  const obs = params.observation ?? null;

  console.log("🧾 route.params =", params);
  console.log("🧪 obs =", obs);

  if (!obs) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>❌ No observation data found.</Text>
        <Text style={styles.hint}>
          Try tapping a recent prediction again.
        </Text>
      </View>
    );
  }

  // Extract details
  const {
    imageUrl,
    predicted_label,
    confidence,
    top_predictions,
    verified,
    timestamp,
    model_version,
  } = obs;

  const formattedConfidence =
    typeof confidence === "number" ? confidence.toFixed(2) : "N/A";

  const formattedTime = timestamp?.seconds
    ? new Date(timestamp.seconds * 1000).toLocaleString()
    : "Unknown";

  return (
    <ScrollView style={styles.container}>
      {/* Remote image from Firestore */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ color: "#999" }}>No Image Available</Text>
        </View>
      )}

      <Text style={styles.title}>
        {predicted_label || "Unknown Species"}
      </Text>

      <Text style={styles.info}>
        Confidence: {formattedConfidence}%
      </Text>
      <Text style={styles.info}>
        Status: {verified ? "✅ Verified" : "⏳ Pending"}
      </Text>
      <Text style={styles.info}>
        Model Version: {model_version || "v1"}
      </Text>
      <Text style={styles.info}>
        Timestamp: {formattedTime}
      </Text>

      {/* Display Top 3 Predictions */}
      {top_predictions && top_predictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Predictions</Text>
          {top_predictions.slice(0, 3).map((pred, index) => (
            <View key={index} style={styles.predRow}>
              <Text style={styles.predLabel}>
                {index + 1}. {pred.label}
              </Text>
              <Text style={styles.predConfidence}>
                {pred.confidence.toFixed(2)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F8FA" },
  image: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  error: {
    fontSize: 18,
    color: "red",
    marginBottom: 6,
    textAlign: "center",
  },
  hint: { fontSize: 14, color: "#555", textAlign: "center" },
  section: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#15931b",
    marginBottom: 10,
  },
  predRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  predLabel: {
    fontSize: 15,
    color: "#222",
  },
  predConfidence: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
});
