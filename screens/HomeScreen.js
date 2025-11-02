import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { mockObservations } from "../utils/mockData";

export default function HomeScreen({ navigation }) {
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch the latest verified predictions
  useEffect(() => {
    async function fetchVerifiedPredictions() {
      try {
        const q = query(
          collection(db, "predictions"),
          where("verified", "==", true),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecentPredictions(list);
      } catch (e) {
        console.error("Error fetching predictions:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchVerifiedPredictions();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sarawak Flora</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.gear}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => navigation.navigate("Identify")}
            >
              <Text style={styles.actionPrimaryText}>Identify Plant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSecondary]}
              onPress={() => navigation.navigate("Map")}
            >
              <Text style={styles.actionSecondaryText}>Map a Sighting</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🪴 Recent Observations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Observations</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#15931b" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentPredictions.length === 0 ? (
                <Text style={{ color: "#777" }}>
                  No recent predictions yet.
                </Text>
              ) : (
                recentPredictions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate("ObservationDetails", {
                        observation: item,
                      })
                    }
                  >
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.cardText}>
                      {item.predicted_label || "Unknown"}
                    </Text>
                    <Text style={styles.cardSubText}>
                      Confidence:{" "}
                      {typeof item.confidence === "number"
                        ? item.confidence.toFixed(2)
                        : "—"}
                      %
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>

        {/* 🌿 Featured Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Plants</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {mockObservations.map((plant) => (
              <View key={plant.id} style={styles.card}>
                {plant.image && (
                  <Image
                    source={plant.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.cardText}>{plant.species}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e2",
    backgroundColor: "#f6f8f6",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#15931b",
  },
  iconButton: { padding: 8, borderRadius: 50 },
  gear: { fontSize: 20 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#112112",
    marginBottom: 10,
  },
  quickActions: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  actionPrimary: { backgroundColor: "#15931b" },
  actionSecondary: { backgroundColor: "rgba(21,147,27,0.15)" },
  actionPrimaryText: { color: "#fff", fontWeight: "700" },
  actionSecondaryText: { color: "#15931b", fontWeight: "700" },
  horizontalScroll: { paddingHorizontal: 12 },
  card: { width: 160, marginRight: 12 },
  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },
  cardText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#112112",
  },
  cardSubText: {
    fontSize: 12,
    color: "#5c6c5e",
  },
});
