// screens/AdminDashboard.js
import React from "react";
import { View, Text, ScrollView, Button, StyleSheet } from "react-native";
import { mockObservations } from "../utils/mockData";
import ObservationCard from "../components/ObservationCard";

export default function AdminDashboard({ navigation }) {
  const flagged = mockObservations.filter((o) => o.status === "Flagged");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Flagged Observations ({flagged.length})</Text>

      {flagged.map((obs) => (
        <ObservationCard key={obs.id} {...obs} />
      ))}

      <View style={{ marginVertical: 20 }}>
        <Button
          title="View IoT Monitoring"
          color="#1565C0"
          onPress={() => navigation.navigate("IoTMonitoring")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F7F8FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
});
