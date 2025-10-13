// screens/IoTMonitoringScreen.js
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function IoTMonitoringScreen() {
  const dummyData = [
    { device: "Sensor A", temperature: 28.5, humidity: 85, status: "Normal" },
    { device: "Sensor B", temperature: 45.2, humidity: 60, status: "⚠️ Alert" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>IoT Monitoring</Text>
      {dummyData.map((sensor, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.device}>{sensor.device}</Text>
          <Text>🌡 Temperature: {sensor.temperature}°C</Text>
          <Text>💧 Humidity: {sensor.humidity}%</Text>
          <Text>Status: {sensor.status}</Text>
        </View>
      ))}
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
    color: "#1565C0",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  device: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
});
