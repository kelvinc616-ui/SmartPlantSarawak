import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export default function MyObservations({ navigation }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchUserObservations();
  }, []);

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
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={36} color="#9e9e9e" />
            <Text style={{ color: "#9e9e9e", fontSize: 12 }}>No Image</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.predicted_label || "Unknown"}</Text>
          <Text style={styles.detail}>Confidence: {formattedConfidence}</Text>
          <Text style={styles.detail}>Date: {formattedTime}</Text>

          <View
            style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
          >
            <Ionicons
              name={item.verified_label ? "checkmark-circle-outline" : "time-outline"}
              size={16}
              color={statusColor}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#15931b" />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>My Observations</Text>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 30 }} />
      ) : observations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={60} color="#9e9e9e" />
          <Text style={styles.emptyText}>
            You haven’t made any predictions yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={observations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16, // 👈 Added extra top space for better visual balance
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 8,
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
    justifyContent: "center",
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
});
