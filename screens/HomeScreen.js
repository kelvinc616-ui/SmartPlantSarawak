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
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { MaterialIcons } from '@expo/vector-icons'; 

export default function HomeScreen({ navigation }) {
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [explorePlants, setExplorePlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  async function fetchExplorePlants() {
    const q = query(
      collection(db, "predictions"),
      where("verified_label", "==", true)
    );

    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const shuffled = all.sort(() => Math.random() - 0.5);
    setExplorePlants(shuffled.slice(0, 5));
  }

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecentPredictions();
    await fetchExplorePlants();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#15931b" />
      </View>
    );
  }

  return (
     <SafeAreaView style={{ flex: 1,}}>
    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sarawak Flora</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="settings" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Quick Actions */}
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

        {/* Recent Observations */}
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
                    navigation.navigate("ObservationDetails", {
                      observation: item,
                    })
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

        {/* Explore Sarawak Flora */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Sarawak Flora</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {explorePlants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("ObservationDetails", {
                    observation: plant,
                  })
                }
              >
                {plant.imageUrl && (
                  <Image
                    source={{ uri: plant.imageUrl }}
                    style={styles.cardImage}
                  />
                )}
                <Text style={styles.cardText}>
                  {plant.predicted_label || "Unknown"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff", 
  },
  iconButton: { 
    padding: 8,
    borderRadius: 50,
    },
  gear: { fontSize: 20 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#112112",
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
