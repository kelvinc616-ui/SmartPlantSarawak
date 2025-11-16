import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";   // ⭐ ADDED
import MapView, { Marker } from "react-native-maps";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import { db, storage } from "../firebaseConfig";  
import { ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage"; // ⭐ ADDED

export default function ManagePredictions() {
  const [predictions, setPredictions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingPrediction, setEditingPrediction] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [showMap, setShowMap] = useState(false);

  const [newVerifiedImage, setNewVerifiedImage] = useState(null); // ⭐ ADDED

  // 🔥 Fetch ONLY predictions flagged as unsure
  const fetchPredictions = async () => {
    try {
      const q = query(
        collection(db, "predictions"),
        where("flagged_unsure", "==", true)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const coords = data.location || {};
        return {
          id: docSnap.id,
          ...data,
          lat: coords.latitude,
          lng: coords.longitude,
        };
      });

      setPredictions(list);
      setFiltered(list);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      Alert.alert("Error", "Failed to load predictions.");
    } finally {
      setLoading(false);
    }
  };

  const deletePrediction = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this prediction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "predictions", id));

            const updated = predictions.filter((p) => p.id !== id);
            setPredictions(updated);
            setFiltered(updated);

            Alert.alert("Deleted", "Prediction removed successfully.");
          } catch (error) {
            console.error("Error deleting:", error);
            Alert.alert("Error", "Failed to delete prediction.");
          }
        },
      },
    ]);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFiltered(predictions);
    } else {
      const queryLower = text.toLowerCase();
      const results = predictions.filter(
        (p) =>
          p.predicted_label?.toLowerCase().includes(queryLower) ||
          p.userId?.toLowerCase().includes(queryLower)
      );
      setFiltered(results);
    }
  };

  const handleSort = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);

    const sorted = [...filtered].sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return newOrder === "desc" ? bTime - aTime : aTime - bTime;
    });

    setFiltered(sorted);
  };

  const startEditing = (item) => {
    setEditingPrediction(item);
    setNewLabel(item.predicted_label);
    setNewVerifiedImage(null); // ⭐ reset
  };

  // ⭐ Pick verified image
  const pickVerifiedImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow gallery access to upload image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 1,
    });

    if (!result.canceled) {
      setNewVerifiedImage(result.assets[0].uri);
    }
  };

  // ⭐ Upload new image + delete old one
  const uploadVerifiedImage = async (oldUrl, predictionId) => {
    if (!newVerifiedImage) return oldUrl; // nothing changed

    try {
      const filename = `verified_${predictionId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `predictions/${filename}`);

      // upload new file
      const img = await fetch(newVerifiedImage);
      const blob = await img.blob();
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      // delete OLD image
      try {
        const oldRef = ref(storage, decodeURIComponent(oldUrl.split("/o/")[1].split("?")[0]));
        await deleteObject(oldRef);
      } catch (err) {
        console.warn("Old image delete failed (ignored):", err);
      }

      return downloadURL;
    } catch (err) {
      console.error("Image upload failed:", err);
      Alert.alert("Error", "Failed to upload verified image.");
      return oldUrl;
    }
  };

  // 🔥 Save verified label/location + NEW verified image
  const saveEdit = async () => {
    if (!editingPrediction) return;

    try {
      const docRef = doc(db, "predictions", editingPrediction.id);

      // ⭐ Upload image if selected
      const updatedImageUrl = await uploadVerifiedImage(
        editingPrediction.imageUrl,
        editingPrediction.id
      );

      await updateDoc(docRef, {
        predicted_label: newLabel,
        verified_label: editingPrediction.verified_label || false,
        verified_location: editingPrediction.verified_location || false,
        flagged_unsure: false,
        imageUrl: updatedImageUrl, // ⭐ replace original image
      });

      // Remove from admin list
      const updated = predictions.filter((p) => p.id !== editingPrediction.id);
      setPredictions(updated);
      setFiltered(updated);

      setEditingPrediction(null);
      setNewLabel("");
      setNewVerifiedImage(null);

      Alert.alert("Updated", "Prediction verified successfully.");
    } catch (error) {
      console.error("Error updating:", error);
      Alert.alert("Error", "Failed to update prediction.");
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text>Loading predictions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌱 Manage Flagged Predictions</Text>

      {/* Search & Sort Controls */}
      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            placeholder="Search by user ID or label..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity style={styles.sortButton} onPress={handleSort}>
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down-outline" : "arrow-up-outline"}
            size={18}
            color="#fff"
          />
          <Text style={styles.sortText}>
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Prediction Cards */}
      {filtered.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={{ color: "#555", marginTop: 10 }}>No flagged predictions 🎉</Text>
        </View>
      ) : (
        filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />

            <View style={styles.info}>
              <Text style={styles.label}>
                {item.predicted_label}{" "}
                {item.verified_label && <Text style={styles.verified_label}>✔ Verified</Text>}
              </Text>

              <Text style={styles.confidence}>
                Confidence: {item.confidence?.toFixed(2)}%
              </Text>

              <Text style={styles.timestamp}>
                📅 {item.timestamp?.toDate?.().toLocaleString?.() || item.timestamp}
              </Text>

              <Text style={styles.model}>Model: {item.model_version}</Text>
              <Text style={styles.userId}>User ID: {item.userId}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEditing(item)}
              >
                <Ionicons name="create-outline" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePrediction(item.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Edit Modal */}
      <Modal visible={!!editingPrediction} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit & Verify</Text>

            {/* Label Input */}
            <TextInput
              style={styles.modalInput}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Enter corrected label"
              placeholderTextColor="#999"
            />

            {/* ⭐ PICK Verified Image */}
            <TouchableOpacity style={styles.uploadBtn} onPress={pickVerifiedImage}>
              <Ionicons name="image-outline" size={22} color="#2E7D32" />
              <Text style={styles.uploadText}>Upload Verified Image</Text>
            </TouchableOpacity>

            {newVerifiedImage && (
              <Image
                source={{ uri: newVerifiedImage }}
                style={{ width: "100%", height: 160, borderRadius: 10, marginBottom: 10 }}
              />
            )}

            {/* Checkboxes */}
            <TouchableOpacity
              style={styles.verifyRow}
              onPress={() =>
                setEditingPrediction((prev) => ({
                  ...prev,
                  verified_label: !prev.verified_label,
                }))
              }
            >
              <Ionicons
                name={
                  editingPrediction?.verified_label
                    ? "checkbox-outline"
                    : "square-outline"
                }
                size={22}
                color={editingPrediction?.verified_label ? "#2E7D32" : "#666"}
              />
              <Text style={styles.verifyText}>Mark Label as Verified</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verifyRow}
              onPress={() =>
                setEditingPrediction((prev) => ({
                  ...prev,
                  verified_location: !prev.verified_location,
                }))
              }
            >
              <Ionicons
                name={
                  editingPrediction?.verified_location
                    ? "checkbox-outline"
                    : "square-outline"
                }
                size={22}
                color={editingPrediction?.verified_location ? "#2E7D32" : "#666"}
              />
              <Text style={styles.verifyText}>Mark Location as Verified</Text>
            </TouchableOpacity>

            {/* Save */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingPrediction(null);
                  setNewVerifiedImage(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Preview Modal */}
      <Modal visible={showMap} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.mapBox}>
            <Text style={styles.modalTitle}>Location Preview</Text>
            {editingPrediction?.lat && editingPrediction?.lng ? (
              <MapView
                style={styles.previewMap}
                initialRegion={{
                  latitude: editingPrediction.lat,
                  longitude: editingPrediction.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: editingPrediction.lat,
                    longitude: editingPrediction.lng,
                  }}
                  title={editingPrediction.predicted_label}
                />
              </MapView>
            ) : (
              <Text style={{ textAlign: "center", color: "#999" }}>
                No location available
              </Text>
            )}
            <TouchableOpacity
              style={[styles.cancelButton, { alignSelf: "center", marginTop: 15 }]}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.cancelText}>Close Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8f7", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E7D32",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
  },
    uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#eaf7ea",
    padding: 10,
    borderRadius: 8,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#2E7D32",
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: "#333" },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortText: { color: "#fff", fontSize: 13, fontWeight: "500", marginLeft: 5 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  info: { marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  verified_label: { color: "#2E7D32", fontWeight: "700" },
  verified_location: { color: "#00796B", fontWeight: "700" },
  confidence: { fontSize: 13, color: "#2E7D32" },
  timestamp: { fontSize: 12, color: "#666", marginTop: 3 },
  model: { fontSize: 12, color: "#888" },
  userId: { fontSize: 11, color: "#999", marginTop: 2 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editButton: {
    backgroundColor: "#1976D2",
    padding: 10,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#e53935",
    padding: 10,
    borderRadius: 8,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#2E7D32", marginBottom: 10 },
  modalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
    color: "#333",
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  saveButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelText: { color: "#333", fontWeight: "600" },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  verifyText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  mapBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    width: "90%",
    height: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  previewMap: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginTop: 10,
  },
});
