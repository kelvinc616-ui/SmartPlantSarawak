import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export default function MyObservations({ navigation }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  //  search + filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | VERIFIED | PENDING

    const fetchUserObservations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("⚠️ No user signed in.");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "predictions"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setObservations(list);
      } catch (error) {
        console.error("❌ Error fetching user predictions:", error);
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    fetchUserObservations();
  }, []);

  // FILTER + SEARCH
  const filteredData = observations.filter((item) => {
    const matchesSearch =
      item.predicted_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      "";

    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "VERIFIED"
        ? item.verified_label === true
        : item.verified_label === false;

    return matchesSearch && matchesFilter;
  });

  const renderItem = ({ item }) => {
    const formattedConfidence =
      typeof item.confidence === "number"
        ? `${item.confidence.toFixed(2)}%`
        : "N/A";

    const formattedTime = item.timestamp?.seconds
      ? new Date(item.timestamp.seconds * 1000).toLocaleString()
      : "Unknown";

    const statusColor = item.verified_label ? "#2E7D32" : "#D32F2F";
    const statusLabel = item.verified_label ? "Verified" : "Pending";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("ObservationDetails", { observation: item })
        }
      >
        {/* IMAGE */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={36} color="#9e9e9e" />
            <Text style={{ color: "#9e9e9e", fontSize: 12 }}>No Image</Text>
          </View>
        )}

        {/* CONTENT */}
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.predicted_label || "Unknown"}</Text>
          <Text style={styles.detail}>Confidence: {formattedConfidence}</Text>
          <Text style={styles.detail}>Date: {formattedTime}</Text>

          {/* BADGES ROW */}
          <View style={styles.badgeRow}>
            {/* VERIFIED/PENDING BADGE */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Ionicons
                name={
                  item.verified_label
                    ? "checkmark-circle-outline"
                    : "time-outline"
                }
                size={16}
                color={statusColor}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>

            {/* ADD / UPDATE LOCATION BUTTON */}
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={() =>
                navigation.navigate("AddLocation", {
                  predictionId: item.id,
                  existingLocation: item.location || null,
                })
              }
            >
              <Ionicons
                name="location-outline"
                size={16}
                color="#15931b"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.locationBtnText}>
                {item.location ? "Update Location" : "Add Location"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#15931b" />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>My Observations</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search plants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {["ALL", "VERIFIED", "PENDING"].map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[
              styles.filterBtn,
              filter === key && styles.filterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === key && styles.filterBtnTextActive,
              ]}
            >
              {key === "ALL"
                ? "All"
                : key === "VERIFIED"
                ? "Verified"
                : "Pending"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 30 }} />
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={60} color="#9e9e9e" />
          <Text style={styles.emptyText}>No results found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshing={loading}
          onRefresh={fetchUserObservations}
        />
      )}
    </SafeAreaView>
  );
}

// ------------------ STYLES ------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#F7F8FA",
  },

  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(21,147,27,0.1)",
    marginRight: 10,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E7D32",
  },

  // SEARCH BAR
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  // FILTER BUTTONS
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },

  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#15931b",
  },

  filterBtnActive: {
    backgroundColor: "#15931b",
  },

  filterBtnText: {
    color: "#15931b",
    fontWeight: "600",
  },

  filterBtnTextActive: {
    color: "#fff",
  },

  // CARD
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    padding: 10,
    elevation: 3,
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },

  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1b1b1b",
  },

  detail: {
    fontSize: 13,
    color: "#444",
    marginTop: 3,
  },

  // BADGES ROW
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // LOCATION BUTTON
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21,147,27,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  locationBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15931b",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#777",
  },
});
