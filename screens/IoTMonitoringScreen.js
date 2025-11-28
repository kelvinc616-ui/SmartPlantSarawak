import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
import { AnimatedCircularProgress } from "react-native-circular-progress";

export default function IoT() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [dataHistory, setDataHistory] = useState([]);
  const [timeframe, setTimeframe] = useState("30min");
  const [graphType, setGraphType] = useState("temperature"); // "temperature", "humidity", "soil"

  const screenWidth = Dimensions.get("window").width - 40;

  const fetchSensorData = async () => {
    try {
      const sensorRef = doc(db, "iotData", "ESP32_001");
      const docSnap = await getDoc(sensorRef);
      if (docSnap.exists()) setSensorData(docSnap.data());
      else console.warn("No sensor data found.");
    } catch (error) {
      console.error("Error fetching IoT data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataHistory = async (type = "temperature", selectedTimeframe = "30min") => {
    try {
      const now = new Date();
      let startTime, intervalMinutes;

      if (selectedTimeframe === "30min") {
        startTime = new Date(now.getTime() - 30 * 60 * 1000);
        intervalMinutes = 5;
      } else if (selectedTimeframe === "24h") {
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        intervalMinutes = 60;
      } else if (selectedTimeframe === "1w") {
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        intervalMinutes = 12 * 60;
      }

      const q = query(
        collection(db, "iotDataHistory"),
        where("deviceId", "==", "ESP32_001"),
        where("timestamp", ">=", startTime),
        orderBy("timestamp", "asc")
      );

      const snap = await getDocs(q);
      const history = snap.docs.map(d => ({
        value: type === "temperature" ? d.data().temperatureC :
               type === "humidity" ? d.data().humidity :
               d.data().soilMoisture,
        timestamp: d.data().timestamp.toDate()
      }));

      // Aggregate data per interval
      const aggregated = [];
      const map = {};
      history.forEach(item => {
        const keyDate = new Date(item.timestamp);
        if (intervalMinutes < 60) {
          const minutes = Math.floor(keyDate.getMinutes() / intervalMinutes) * intervalMinutes;
          keyDate.setMinutes(minutes, 0, 0);
        } else if (intervalMinutes === 60) {
          keyDate.setMinutes(0, 0, 0);
        } else {
          const hours = Math.floor(keyDate.getHours() / 12) * 12;
          keyDate.setHours(hours, 0, 0, 0);
        }
        const key = keyDate.toISOString();
        if (!map[key]) map[key] = [];
        map[key].push(item.value);
      });

      for (const key in map) {
        const values = map[key];
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        aggregated.push({ timestamp: new Date(key), value: avg });
      }

      aggregated.sort((a, b) => a.timestamp - b.timestamp);
      setDataHistory(aggregated);
      setTimeframe(selectedTimeframe);
      setGraphType(type);
      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching data history:", error);
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

  const getTimeframeLabel = (tf) => {
    if (tf === "30min") return "Last 30 mins";
    if (tf === "24h") return "Last 24 hours";
    if (tf === "1w") return "Last 1 week";
    return "";
  };

  const getGraphTitle = (type) => {
    if (type === "temperature") return "Temperature";
    if (type === "humidity") return "Humidity";
    if (type === "soil") return "Soil Moisture";
    return "";
  };

  const getYAxisSuffix = (type) => {
    if (type === "temperature") return "°C";
    return "%";
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌱 IoT Sensor Dashboard</Text>
      <Text style={styles.subtitle}>
        Device: <Text style={{ fontWeight: "700" }}>{sensorData.deviceId}</Text>
      </Text>

      {/* Humidity & Soil inside a card */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
          <TouchableOpacity
            style={styles.circularContainer}
            onPress={() => fetchDataHistory("humidity", "30min")}
          >
            <AnimatedCircularProgress
              size={120}
              width={12}
              fill={sensorData.humidity}
              tintColor="#4D96FF"
              backgroundColor="#e0f0ff"
            >
              {fill => (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontWeight: "700", fontSize: 18 }}>{Math.round(fill)}%</Text>
                  <Text style={{ color: "#555" }}>Humidity</Text>
                </View>
              )}
            </AnimatedCircularProgress>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circularContainer}
            onPress={() => fetchDataHistory("soil", "30min")}
          >
            <AnimatedCircularProgress
              size={120}
              width={12}
              fill={sensorData.soilMoisture}
              tintColor="#2E7D32"
              backgroundColor="#e0f7e9"
            >
              {fill => (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontWeight: "700", fontSize: 18 }}>{Math.round(fill)}%</Text>
                  <Text style={{ color: "#555" }}>Soil Moisture</Text>
                </View>
              )}
            </AnimatedCircularProgress>
          </TouchableOpacity>
        </View>
      </View>

      {/* Temperature Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => fetchDataHistory("temperature", timeframe)}
      >
        <Ionicons name="thermometer-outline" size={28} color="#FF6B6B" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Temperature</Text>
          <Text style={styles.cardValue}>{sensorData.temperatureC} °C</Text>
        </View>
      </TouchableOpacity>

      {/* Other cards */}
      <View style={styles.card}>
        <Ionicons name="rainy-outline" size={28} color="#1F8A70" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Is it Raining?</Text>
          <Text style={styles.cardValue}>{sensorData.isRaining ? "Yes 🌧️" : "No ☀️"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="cloud-outline" size={28} color="#4D96FF" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Rain Percent</Text>
          <Text style={styles.cardValue}>{sensorData.rainPercent} %</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="time-outline" size={28} color="#FFC312" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>Last Updated</Text>
          <Text style={styles.cardValue}>{readableTime}</Text>
        </View>
      </View>

      {/* Status Card */}
      <View
        style={[
          styles.statusCard,
          (sensorData.temperatureC < 10 || sensorData.temperatureC > 45 ||
           sensorData.humidity < 5 || sensorData.humidity > 100 ||
           sensorData.soilMoisture < 0 || sensorData.soilMoisture > 90)
            ? styles.statusCardAlert
            : styles.statusCardNormal
        ]}
      >
        <Text style={styles.statusText}>
          {(sensorData.temperatureC < 10 || sensorData.temperatureC > 45)
           ? "⚠️ Temperature out of range!"
           : (sensorData.humidity < 5 || sensorData.humidity > 100)
           ? "⚠️ Humidity out of range!"
           : (sensorData.soilMoisture < 0 || sensorData.soilMoisture > 90)
           ? "⚠️ Soil moisture out of range!"
           : "✅ All readings are normal"}
        </Text>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 10 }}>
              {getGraphTitle(graphType)} ({getTimeframeLabel(timeframe)})
            </Text>

            {/* Timeframe buttons */}
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              {["30min", "24h", "1w"].map(tf => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.tfButton, timeframe === tf && styles.tfButtonActive]}
                  onPress={() => fetchDataHistory(graphType, tf)}
                >
                  <Text style={[styles.tfButtonText, timeframe === tf && styles.tfButtonTextActive]}>
                    {tf === "30min" ? "30m" : tf === "24h" ? "24h" : "1w"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {dataHistory.length > 0 ? (
              <LineChart
                data={{
                  labels: dataHistory.map(t =>
                    timeframe === "30min"
                      ? `${t.timestamp.getHours()}:${String(t.timestamp.getMinutes()).padStart(2, "0")}`
                      : timeframe === "24h"
                      ? `${t.timestamp.getHours()}:00`
                      : `${t.timestamp.getDate()}/${t.timestamp.getMonth() + 1} ${t.timestamp.getHours()}:00`
                  ),
                  datasets: [{ data: dataHistory.map(t => t.value) }]
                }}
                width={screenWidth}
                height={220}
                yAxisSuffix={getYAxisSuffix(graphType)}
                chartConfig={{
                  backgroundColor: "#e0f7e9",
                  backgroundGradientFrom: "#e0f7e9",
                  backgroundGradientTo: "#c2e9d7",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(21,147,27, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#0b6623" }
                }}
                style={{ borderRadius: 16 }}
              />
            ) : (
              <Text>No historical data available.</Text>
            )}

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 15, alignSelf: "center" }}
            >
              <Text style={{ color: "#0b6623", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center"
  },
  tfButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 5
  },
  tfButtonActive: {
    backgroundColor: "#2E7D32"
  },
  tfButtonText: {
    color: "#555",
    fontWeight: "600"
  },
  tfButtonTextActive: {
    color: "#fff"
  },
  circularContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  statusCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  statusCardNormal: {
    backgroundColor: "#2E7D32"
  },
  statusCardAlert: {
    backgroundColor: "#D32F2F"
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  }
});
