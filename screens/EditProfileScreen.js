import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


export default function EditProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUsername(data.username || "");
          setEmail(data.email || user.email);
          setAvatarUrl(data.avatarUrl || null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        Alert.alert("Error", "Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  // Pick image from gallery
  const pickImage = async () => {
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

  // Save changes
  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Validation Error", "Username cannot be empty.");
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setSaving(true);
   try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
 if (selectedImage) {
 const BUCKET_NAME = "smartplantsarawak-f13b9.firebasestorage.app";
  const fileName = `${user.uid}_${Date.now()}.jpg`;

  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/avatars%2F${encodeURIComponent(fileName)}?uploadType=media`;

  // Fetch the local image and convert to blob
  const img = await fetch(selectedImage);
  const blob = await img.blob();

  // Upload the blob using POST
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: blob,
    headers: { "Content-Type": "image/jpeg" },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }

  // Construct the publicly accessible URL
  newAvatarUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/avatars%2F${encodeURIComponent(fileName)}?alt=media`;
}

      // Update Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: username.trim(),
        avatarUrl: newAvatarUrl,
      });

      if (password.trim() !== "") {
    await updatePassword(user, password);
}


      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#15931b" testID="ActivityIndicator" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.avatar} />
        ) : avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color="#15931b" />
        )}
        <Text style={styles.changePhotoText}>Change Profile Photo</Text>
      </TouchableOpacity>

      {/* Username */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter your username"
        />
      </View>

      {/* Email (readonly) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#eee" }]}
          value={email}
          editable={false}
        />
      </View>

      {/* Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && { backgroundColor: "#9ecfa2" }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f6f8f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  changePhotoText: { marginTop: 8, color: "#15931b", fontWeight: "600" },
  inputContainer: { width: "100%", marginBottom: 20 },
  label: { marginBottom: 6, fontWeight: "600", color: "#112112" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#15931b",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
