import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.warn("⚠️ No user data found in Firestore.");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Could not load profile data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been logged out successfully.");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Something went wrong while logging out.");
      console.error(error);
    }
  };

    const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#15931b" />
        <Text style={{ color: "#112112", marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignItems: "center", paddingTop: 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
       <View style={styles.avatarContainer}>
  {userData?.avatarUrl ? (
    <Image
      source={{ uri: userData.avatarUrl }}
      style={{ width: 100, height: 100, borderRadius: 50 }}
    />
  ) : (
    <Ionicons name="person-circle-outline" size={100} color="#15931b" />
  )}
</View>

        <Text style={styles.username}>{userData?.username || "Unknown User"}</Text>
        <Text style={styles.email}>{userData?.email || user?.email || "No email found"}</Text>
        <Text style={styles.role}>Role: {userData?.role || "N/A"}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Ionicons name="create-outline" size={18} color="#15931b" />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* My Observations Button */}
        <TouchableOpacity
          style={[styles.button, styles.observationButton]}
          onPress={() => navigation.navigate("MyObservations")}
        >
          <Ionicons name="leaf-outline" size={18} color="#fff" />
          <Text style={styles.observationText}>My Observations</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
  },
  header: { marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#145a32",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    elevation: 3,
    borderColor: "#e1e5e2",
    borderWidth: 1,
  },
  avatarContainer: { marginBottom: 10 },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: "#112112",
    marginTop: 5,
  },
  email: {
    fontSize: 14,
    color: "#5c6c5e",
    marginTop: 4,
  },
  role: {
    fontSize: 13,
    color: "#15931b",
    marginTop: 6,
  },
  actions: {
    marginTop: 30,
    width: "85%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginVertical: 6,
  },
  editButton: { backgroundColor: "rgba(21,147,27,0.1)" },
  editText: { color: "#15931b", fontWeight: "600", marginLeft: 6 },

 
  observationButton: {
    backgroundColor: "#145a32",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  observationText: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  logoutButton: { backgroundColor: "#c62828" },
  logoutText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8f6",
  },
});
