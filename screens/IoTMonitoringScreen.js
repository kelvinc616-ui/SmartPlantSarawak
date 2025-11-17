// screens/IoT.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function IoT() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSensorData = async () => {
    try {
      const sensorRef = doc(db, "iotData", "ESP32_001");
      const docSnap = await getDoc(sensorRef);
      if (docSnap.exists()) {
        setSensorData(docSnap.data());
      } else {
        console.warn("No sensor data found.");
      }
    } catch (error) {
      console.error("Error fetching IoT data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 8 }}>Loading sensor data...</Text>
      </View>
    );
  }

  if (!sensorData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No sensor data available.</Text>
      </View>
    );
  }

  const readableTime = sensorData.timestamp?.seconds
    ? new Date(sensorData.timestamp.seconds * 1000).toLocaleString()
    : "N/A";

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌱 IoT Sensor Dashboard</Text>
      <Text style={styles.subtitle}>
        Real-time readings from device <Text style={{ fontWeight: "700" }}>{sensorData.deviceId}</Text>
      </Text>

      {/* Temperature */}
      <View style={styles.card}>
        <Ionicons name="thermometer-outline" size={28} color="#FF6B6B" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Temperature</Text>
          <Text style={styles.cardValue}>{sensorData.temperatureC} °C</Text>
        </View>
      </View>

      {/* Humidity */}
      <View style={styles.card}>
        <Ionicons name="water-outline" size={28} color="#4D96FF" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Humidity</Text>
          <Text style={styles.cardValue}>{sensorData.humidity} %</Text>
        </View>
      </View>

      {/* Soil Moisture */}
      <View style={styles.card}>
        <Ionicons name="leaf-outline" size={28} color="#2E7D32" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Soil Moisture</Text>
          <Text style={styles.cardValue}>{sensorData.soilMoisture} %</Text>
        </View>
      </View>

      {/* Rain Status */}
      <View style={styles.card}>
        <Ionicons name="rainy-outline" size={28} color="#1F8A70" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Is it Raining?</Text>
          <Text style={styles.cardValue}>{sensorData.isRaining ? "Yes 🌧️" : "No ☀️"}</Text>
        </View>
      </View>

      {/* Rain Percent */}
      <View style={styles.card}>
        <Ionicons name="cloud-outline" size={28} color="#4D96FF" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Rain Percent</Text>
          <Text style={styles.cardValue}>{sensorData.rainPercent} %</Text>
        </View>
      </View>

      {/* Timestamp */}
      <View style={styles.card}>
        <Ionicons name="time-outline" size={28} color="#FFC312" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Last Updated</Text>
          <Text style={styles.cardValue}>{readableTime}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8f7", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#2E7D32", textAlign: "center", marginTop: 20 },
  subtitle: { fontSize: 14, textAlign: "center", color: "#555", marginBottom: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  cardValue: { fontSize: 14, color: "#555", marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
