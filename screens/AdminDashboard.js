// screens/AdminDashboard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌿 SmartPlant Admin Panel</Text>
      <Text style={styles.subtitle}>Manage users, monitor predictions, and view analytics.</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ManagePredictions")}
      >
        <Ionicons name="analytics-outline" size={26} color="#2E7D32" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Manage Predictions</Text>
          <Text style={styles.cardDesc}>View or delete user predictions.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ManageUsers")}
      >
        <Ionicons name="people-outline" size={26} color="#2E7D32" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Manage Users</Text>
          <Text style={styles.cardDesc}>View, promote, or remove users.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Analytics")}
      >
        <Ionicons name="stats-chart-outline" size={26} color="#2E7D32" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>View Analytics</Text>
          <Text style={styles.cardDesc}>Check prediction usage and performance metrics.</Text>
        </View>
      </TouchableOpacity>

            {/* IoT Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("IoTMonitoring")}
      >
        <Ionicons name="hardware-chip-outline" size={26} color="#2E7D32" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>IoT Sensor Data</Text>
          <Text style={styles.cardDesc}>View real-time environmental sensor readings.</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8f7", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E7D32",
    textAlign: "center",
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  cardDesc: { fontSize: 13, color: "#666" },
});
