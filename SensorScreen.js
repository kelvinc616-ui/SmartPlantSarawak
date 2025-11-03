// SensorScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { db } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export default function SensorScreen() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Listen to real-time updates from Firestore document
    const unsub = onSnapshot(doc(db, "sensors", "esp32"), (doc) => {
      setData(doc.data());
    });
    return unsub; // Cleanup listener when screen unmounts
  }, []);

  if (!data) return <ActivityIndicator size="large" color="#2E7D32" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 SmartPlant Sensor Data</Text>
      <Text style={styles.dataText}>🌡 Temperature: {data.temperature}°C</Text>
      <Text style={styles.dataText}>💧 Humidity: {data.humidity}%</Text>
      <Text style={styles.dataText}>🌱 Soil Moisture: {data.soil}%</Text>
      <Text style={styles.dataText}>☔ Rain: {data.rain ? "Detected" : "No Rain"}</Text>
      <Text style={styles.dataText}>🔊 Sound Level: {data.sound}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 20,
  },
  dataText: {
    fontSize: 18,
    color: "#2E7D32",
    marginVertical: 6,
  },
});
