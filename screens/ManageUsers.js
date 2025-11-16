import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users from Firestore
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = [];
      querySnapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter(
        (user) =>
          (user.username && user.username.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query))
      )
    );
  }, [searchQuery, users]);

  // Delete a user document from Firestore
  const handleDeleteUser = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", id));
            fetchUsers();
          } catch (error) {
            console.error("Error deleting user:", error);
          }
        },
      },
    ]);
  };

  // Switch between 'admin' and 'public' roles
  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "public" : "admin";
    try {
      await updateDoc(doc(db, "users", id), { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={50} color="#15931b" />
        )}
      </View>

      {/* User info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>Role: {item.role}</Text>
        <Text style={styles.date}>
          Created:{" "}
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : "N/A"}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleRole(item.id, item.role)}>
          <Ionicons name="swap-horizontal-outline" size={22} color="#2E7D32" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteUser(item.id)}>
          <Ionicons
            name="trash-outline"
            size={22}
            color="#C62828"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Manage Users</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#555" />
        <TextInput
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8f7", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E7D32",
    textAlign: "center",
    marginVertical: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: { width: 50, height: 50 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  username: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  email: { fontSize: 13, color: "#555" },
  role: { fontSize: 13, color: "#2E7D32", marginTop: 3 },
  date: { fontSize: 12, color: "#888" },
  actions: { flexDirection: "row", marginLeft: 10 },
});
