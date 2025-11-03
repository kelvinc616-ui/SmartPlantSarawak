import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemUploadType } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function IdentifyScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 📸 Capture from camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera access is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setResult(null);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  // 🖼 Upload from gallery
  const handleUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Gallery access is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setResult(null);
      }
    } catch (err) {
      console.error("Gallery error:", err);
      Alert.alert("Error", "Failed to open gallery.");
    }
  };

  // 🌿 Identify Button — Upload → Predict → Save → Offer to Share Location
  const handleIdentify = async () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please upload or capture a photo first.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const fileName = `${user?.uid || "guest"}_${Date.now()}.jpg`;
      const BUCKET_NAME = "smartplantsarawak-f13b9.firebasestorage.app";
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/predictions%2F${encodeURIComponent(
        fileName
      )}?uploadType=media`;

      console.log("Uploading image:", uploadUrl);

      // Upload image directly to Firebase Storage using fetch
      const img = await fetch(selectedImage);
      const blob = await img.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const imageURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/predictions%2F${encodeURIComponent(
        fileName
      )}?alt=media`;
      console.log("✅ Uploaded image URL:", imageURL);

      // 🔍 Send URL to Flask AI model
      const aiResponse = await fetch(
        "https://smartplant-ai-615502932033.asia-southeast1.run.app/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageURL }),
        }
      );

      if (!aiResponse.ok) throw new Error(`Prediction failed: HTTP ${aiResponse.status}`);

      const prediction = await aiResponse.json();
      console.log("Prediction:", prediction);

      // 💾 Save prediction result to Firestore
      const docRef = await addDoc(collection(db, "predictions"), {
        userId: user?.uid || "guest",
        imageUrl: imageURL,
        predicted_label: prediction.predicted_label,
        confidence: prediction.confidence,
        top_predictions: prediction.top_predictions || [],
        model_version: prediction.model_version,
        timestamp: serverTimestamp(),
        verified_label: false,
        verified_location: false,
        location_shared: false,
      });

      console.log("✅ Prediction saved with ID:", docRef.id);

      // 🎯 Show result + ask to share location
      Alert.alert(
        "Prediction Result",
        `${prediction.predicted_label} (${prediction.confidence}%)`,
        [
          {
            text: "Share Location",
            onPress: () =>
              navigation.navigate("AddLocation", {
                predictionId: docRef.id,
                predicted_label: prediction.predicted_label,
              }),
          },
          { text: "Done", style: "cancel" },
        ]
      );

      setResult(prediction);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to upload or identify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#112112" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Identify</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>
          Capture or upload a photo of the plant to identify it.
        </Text>

        {/* Image Preview */}
        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={0.8}
          onPress={handleUploadImage}
        >
          {selectedImage ? (
            <ImageBackground
              source={{ uri: selectedImage }}
              style={styles.preview}
              imageStyle={{ borderRadius: 16 }}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="cloud-upload-outline" size={60} color="#15931b" />
              <Text style={styles.placeholderText}>Tap to upload or take a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Take a Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleUploadImage}
          >
            <Ionicons name="image" size={20} color="#15931b" />
            <Text style={styles.secondaryButtonText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Identify Button */}
        <TouchableOpacity
          style={[
            styles.identifyButton,
            (!selectedImage || loading) && { backgroundColor: "#9ecfa2" },
          ]}
          onPress={handleIdentify}
          disabled={!selectedImage || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="leaf" size={20} color="#fff" />
              <Text style={styles.identifyButtonText}>Identify Plant</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Prediction Result */}
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>🌿 Species: {result.predicted_label}</Text>
            <Text style={styles.resultText}>📊 Confidence: {result.confidence}%</Text>
            {result.top_predictions?.length > 1 && (
              <View>
                <Text style={styles.resultText}>Top 3 Predictions:</Text>
                {result.top_predictions.map((p, index) => (
                  <Text key={index} style={styles.resultText}>
                    {index + 1}. {p.label} ({p.confidence}%)
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#112112",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    textAlign: "center",
    color: "#5c6c5e",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#eef2ee",
    justifyContent: "center",
    alignItems: "center",
  },
  preview: { width: "100%", height: "100%" },
  placeholderContainer: { justifyContent: "center", alignItems: "center" },
  placeholderText: {
    color: "#5c6c5e",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  buttonsContainer: {
    flexDirection: "column",
    gap: 16,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
  },
  primaryButton: { backgroundColor: "#15931b" },
  primaryButtonText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  secondaryButton: { backgroundColor: "rgba(21,147,27,0.1)" },
  secondaryButtonText: { color: "#15931b", fontWeight: "700", marginLeft: 8 },
  identifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: "#15931b",
    marginTop: 10,
  },
  identifyButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },
  resultBox: {
    marginTop: 25,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#112112",
    marginBottom: 6,
  },
});
