import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

export default function IdentifyScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);

  // 📸 Capture from camera
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 🖼️ Upload from gallery
  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 🌿 Identify button press (mock for now)
  const handleIdentify = () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please upload or capture a photo first.");
      return;
    }

    Alert.alert("Analyzing Plant...", "Your image is being identified 🌿");
    // later: navigation.navigate("ObservationDetails", { imageUri: selectedImage });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#112112" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identify</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>
        Capture or upload a photo of the plant to identify it
      </Text>

      {/* 📷 Image Preview / Placeholder */}
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

      {/* 📸 Action Buttons */}
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

      {/* 🌿 Identify Button */}
      <TouchableOpacity
        style={[
          styles.identifyButton,
          !selectedImage && { backgroundColor: "#9ecfa2" }, // disable effect
        ]}
        onPress={handleIdentify}
        disabled={!selectedImage}
      >
        <Ionicons name="leaf" size={20} color="#fff" />
        <Text style={styles.identifyButtonText}>Identify Plant</Text>
      </TouchableOpacity>
    </View>
  );
}

// 💅 Styles
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
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  primaryButton: {
    backgroundColor: "#15931b",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "rgba(21,147,27,0.1)",
  },
  secondaryButtonText: {
    color: "#15931b",
    fontWeight: "700",
    marginLeft: 8,
  },
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
});
