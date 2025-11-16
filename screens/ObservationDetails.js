import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";

export default function ObservationDetails({ route }) {
  const obs = route?.params?.observation ?? null;

  console.log("🧪 Observation data =", obs);

  if (!obs) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>❌ No observation data found.</Text>
        <Text style={styles.hint}>Try tapping on a recent prediction again.</Text>
      </View>
    );
  }

  // 🔹 Safely extract all fields (with fallbacks)
  const {
    imageUrl,
    title,
    predicted_label,
    corrected_label,
    confidence,
    top_predictions,
    verified_label,
    verified_location,
    timestamp,
    model_version,
    address,
    share_location,
  } = obs;

  // 🔹 Determine display name
  const displayName =
    title || corrected_label || predicted_label || "Unknown Species";

  // 🔹 Ensure confidence is displayed correctly
  const formattedConfidence =
    typeof confidence === "number" ? confidence.toFixed(2) : "N/A";

  // 🔹 Convert Firestore timestamp to readable format
  const formattedTime = timestamp?.seconds
    ? new Date(timestamp.seconds * 1000).toLocaleString()
    : "Unknown";

  return (
    <ScrollView style={styles.container}>
      {/* 🖼️ Image Section */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ color: "#999" }}>No Image Available</Text>
        </View>
      )}

      {/* 🌿 Title */}
      <Text style={styles.title}>{displayName}</Text>

      {/* 🌍 Details */}
      <View style={styles.detailsBox}>
        <Text style={styles.info}>
          Confidence: {formattedConfidence}%
        </Text>
        <Text style={styles.info}>
          Label Verified:{" "}
          {verified_label ? (
            <Text style={{ color: "#2E7D32", fontWeight: "700" }}>✅ Yes</Text>
          ) : (
            <Text style={{ color: "#E6A800", fontWeight: "700" }}>⏳ No</Text>
          )}
        </Text>
        <Text style={styles.info}>
          Location Verified:{" "}
          {verified_location ? (
            <Text style={{ color: "#2E7D32", fontWeight: "700" }}>✅ Yes</Text>
          ) : (
            <Text style={{ color: "#E6A800", fontWeight: "700" }}>⏳ No</Text>
          )}
        </Text>
        <Text style={styles.info}>
          Share Location:{" "}
          {share_location ? (
            <Text style={{ color: "#2E7D32", fontWeight: "700" }}>🌍 Public</Text>
          ) : (
            <Text style={{ color: "#E53935", fontWeight: "700" }}>🔒 Private</Text>
          )}
        </Text>
        <Text style={styles.info}>Model Version: {model_version || "v1"}</Text>
        <Text style={styles.info}>Timestamp: {formattedTime}</Text>
        <Text style={styles.info}>
          Address: {address || "No address available"}
        </Text>
      </View>

      {/* 📊 Top Predictions */}
      {top_predictions && top_predictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Predictions</Text>
          {top_predictions.slice(0, 3).map((pred, index) => (
            <View key={index} style={styles.predRow}>
              <Text style={styles.predLabel}>
                {index + 1}. {pred.label}
              </Text>
              <Text style={styles.predConfidence}>
                {typeof pred.confidence === "number"
                  ? pred.confidence.toFixed(2)
                  : "—"}
                %
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F7F8FA",
  },
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
  detailsBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
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
  hint: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 30,
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
