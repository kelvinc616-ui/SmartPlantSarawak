import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [explorePlants, setExplorePlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ------------------------------
     FETCH MOST RECENT OBSERVATIONS
     Only verified items, sorted by time
  ------------------------------ */
  async function fetchRecentPredictions() {
    const q = query(
      collection(db, "predictions"),
      where("verified_label", "==", true),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const snap = await getDocs(q);
    setRecentPredictions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  /* ------------------------------
     FETCH EXPLORE FEED
     Includes user info + avatar
  ------------------------------ */
  async function fetchExplorePlants() {
    const q = query(
      collection(db, "predictions"),
      where("verified_label", "==", true),
      orderBy("timestamp", "desc")
    );

    const snap = await getDocs(q);
    const list = [];

    for (let d of snap.docs) {
      const data = d.data();

      // Get user info for avatar + username
      const userRef = doc(db, "users", data.userId);
      const userSnap = await getDoc(userRef);
      const user = userSnap.exists() ? userSnap.data() : {};

      list.push({
        id: d.id,
        ...data,
        username: user.username || "Unknown User",
        avatarUrl: user.avatarUrl || null, 
      });
    }

    setExplorePlants(list);
  }

  /* ------------------------------
     INITIAL LOAD
  ------------------------------ */
  useEffect(() => {
    async function load() {
      try {
        await fetchRecentPredictions();
        await fetchExplorePlants();
      } catch (e) {
        console.error("Error fetching:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ------------------------------
     PULL TO REFRESH
  ------------------------------ */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecentPredictions();
    await fetchExplorePlants();
    setRefreshing(false);
  }, []);

  /* ------------------------------
     LOADING SPINNER
  ------------------------------ */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        
        <ActivityIndicator testID="ActivityIndicator" size="large" color="#15931b" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sarawak Flora</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <MaterialIcons name="settings" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* QUICK ACTIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => navigation.navigate("Identify")}
              >
                <MaterialIcons name="search" size={20} color="#fff" />
                <Text style={styles.actionPrimaryText}> Identify Plant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={() => navigation.navigate("Map")}
              >
                <MaterialIcons name="map" size={20} color="#15931b" />
                <Text style={styles.actionSecondaryText}> Map a Sighting</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* RECENT OBSERVATIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Observations</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentPredictions.length === 0 ? (
                <Text style={{ color: "#777" }}>No recent predictions yet.</Text>
              ) : (
                recentPredictions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate("ObservationDetails", { observation: item })
                    }
                  >
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.cardImage}
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
          </View>

          {/* EXPLORE FEED */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore Sarawak Flora</Text>
            {explorePlants.length === 0 ? (
              <Text style={{ color: "#777" }}>No verified plants yet.</Text>
            ) : (
              explorePlants.map((plant) => (
                <View key={plant.id} style={styles.feedCard}>
                  {/* USER INFO */}
                  <View style={styles.feedUserRow}>
                    {plant.avatarUrl ? (
                      <Image
                        source={{ uri: plant.avatarUrl }}
                        style={styles.feedAvatar}
                      />
                    ) : (
                      <Ionicons
                        name="person-circle-outline"
                        size={42}
                        color="#15931b"
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <View>
                      <Text style={styles.feedUsername}>
                        {plant.username || "Unknown User"}
                      </Text>
                      <Text style={styles.feedTimestamp}>
                        {plant.timestamp?.toDate
                          ? plant.timestamp.toDate().toLocaleDateString("en-GB")
                          : ""}
                      </Text>
                    </View>
                  </View>

                  {/* IMAGE */}
                  {plant.imageUrl && (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ObservationDetails", { observation: plant })
                      }
                    >
                      <Image source={{ uri: plant.imageUrl }} style={styles.feedImage} />
                    </TouchableOpacity>
                  )}

                  {/* LABEL SECTION */}
                  <View style={styles.labelSection}>
                    <Text style={styles.plantScientific}>
                      <Text style={{ fontStyle: "italic" }}>
                        {plant.predicted_label || "Unknown species"}
                      </Text>{" "}
                      (L.)
                    </Text>

                    {/* CONFIDENCE */}
                    <Text style={styles.plantCommon}>
                      Confidence:{" "}
                      {typeof plant.confidence === "number"
                        ? plant.confidence.toFixed(2)
                        : "—"}
                      %
                    </Text>

                    {/* BUTTONS */}
                    <View style={styles.cardButtonRow}>
                      <TouchableOpacity
                        style={styles.cardButtonSecondary}
                        onPress={() =>
                          navigation.navigate("ObservationDetails", { observation: plant })
                        }
                      >
                        <Text style={styles.cardButtonSecondaryText}>DETAILS</Text>
                      </TouchableOpacity>

                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------
   STYLES
------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#145a32",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e2",
    borderRadius: 8,
    paddingTop: 40,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  iconButton: { padding: 8, borderRadius: 50 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#112112", marginBottom: 10 },
  quickActions: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  actionPrimary: { backgroundColor: "#0b6623" },
  actionSecondary: { backgroundColor: "rgba(21,147,27,0.15)" },
  actionPrimaryText: { color: "#fff", fontWeight: "700" },
  actionSecondaryText: { color: "#15931b", fontWeight: "700" },
  horizontalScroll: { paddingHorizontal: 12 },
  card: { width: 160, marginRight: 12 },
  cardImage: { width: "100%", height: 150, borderRadius: 12, backgroundColor: "#e0e0e0" },
  cardText: { marginTop: 6, fontSize: 14, fontWeight: "600", color: "#112112" },
  cardSubText: { fontSize: 12, color: "#5c6c5e" },
  feedCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 18, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  feedUserRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  feedAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  feedUsername: { fontSize: 14, fontWeight: "700", color: "#112112" },
  feedTimestamp: { fontSize: 12, color: "#777", marginTop: 1 },
  feedImage: { width: "100%", height: 260, borderRadius: 0, marginTop: 10, marginBottom: 10, resizeMode: "cover" },
  labelSection: { paddingTop: 6, paddingBottom: 6 },
  plantScientific: { fontSize: 17, fontWeight: "600", color: "#000", marginBottom: 4 },
  plantCommon: { fontSize: 16, color: "#7aa03d", marginBottom: 12, fontWeight: "500" },
  cardButtonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  cardButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#bfc7bf",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  cardButtonSecondaryText: { fontSize: 15, color: "#333", fontWeight: "600" },
  cardButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#ff4d4d", // red
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#ffe5e5", // light red
  },
  cardButtonPrimaryText: { fontSize: 15, color: "#ff1a1a", fontWeight: "700" }, // red text
});
