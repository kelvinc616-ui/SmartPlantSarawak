import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function SelectPredictionForLocation({ navigation }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Login Required", "Please log in to manage your observations.");
          navigation.replace("Login");
          return;
        }

        // Fetch user's predictions that have no location or unverified location
        const q = query(
          collection(db, "predictions"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );

        const snap = await getDocs(q);
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => !item.location_shared || item.verified_location === false);

        setPredictions(list);
      } catch (err) {
        console.error("❌ Error fetching predictions:", err);
        Alert.alert("Error", "Failed to load your predictions.");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [navigation]);

  const renderItem = ({ item }) => {
    const confidence =
      typeof item.confidence === "number" ? `${item.confidence.toFixed(2)}%` : "N/A";
  
    const locationStatus = item.location_shared
      ? item.verified_location
        ? "✅ Verified"
        : "⏳ Pending"
      : "❌ Not Shared";
  
    const labelStatus = item.verified_label ? "✅ Verified" : "⏳ Pending";
  
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("AddLocation", { predictionId: item.id })}
      >
        {item.imageUrl ? (
          <Image source={{ uri: String(item.imageUrl) }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={28} color="#aaa" />
          </View>
        )}
  
        <View style={styles.cardContent}>
          <Text style={styles.title}>{String(item.predicted_label || "Unknown Plant")}</Text>
          <Text style={styles.subText}>Confidence: {String(confidence)}</Text>
          <Text style={styles.subText}>Location: {String(locationStatus)}</Text>
          <Text style={styles.subText}>Label: {String(labelStatus)}</Text>
        </View>
      
        <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevronIcon} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#15931b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Observation</Text>
        <View style={{ width: 30 }} /> {/* placeholder for spacing */}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#15931b" />
          <Text style={styles.loadingText}>Loading your observations...</Text>
        </View>
      ) : predictions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            You have no pending observations that need location updates.
          </Text>
        </View>
      ) : (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#f6f8f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e2",
  },
  backBtn: {
    padding: 5,
    borderRadius: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#15931b",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    paddingVertical: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginLeft: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#112112",
    marginBottom: 2,
  },
  subText: {
    fontSize: 13,
    color: "#5c6c5e",
    marginTop: 1,
  },
  chevronIcon: {
    marginRight: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 10,
    color: "#444",
  },
  emptyText: {
    color: "#555",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});

