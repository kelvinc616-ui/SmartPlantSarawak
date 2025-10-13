// screens/MapScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([
    {
      id: 1,
      title: "Nepenthes rafflesiana",
      description: "Kubah National Park",
      coordinate: { latitude: 1.608, longitude: 110.188 },
    },
    {
      id: 2,
      title: "Shorea macrophylla",
      description: "Semenggoh Nature Reserve",
      coordinate: { latitude: 1.416, longitude: 110.329 },
    },
  ]);

  const [userLocation, setUserLocation] = useState(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // 🧭 Get user's location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  // 🔎 Search by address/place name using device geocoder (no API key)
  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      Alert.alert("Search", "Please enter a place or address.");
      return;
    }
    try {
      setSearching(true);
      // Example: "Kuching", "Semenggoh", "Kubah National Park"
      const results = await Location.geocodeAsync(trimmed);
      if (!results || results.length === 0) {
        Alert.alert("Not found", "Could not find that location.");
        return;
      }
      const { latitude, longitude } = results[0];
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (e) {
      console.error("Geocode error:", e);
      Alert.alert("Error", "Failed to look up that location.");
    } finally {
      setSearching(false);
    }
  };

  // 📍 Add mock marker on long press
  const handleAddMarker = (event) => {
    const newCoordinate = event.nativeEvent.coordinate;
    const newMarker = {
      id: Date.now(),
      title: "New Plant Sighting",
      description: "User-added observation",
      coordinate: newCoordinate,
    };
    setMarkers((prev) => [...prev, newMarker]);
    Alert.alert("📍 New Sighting", "Added new plant location successfully!");
  };

  // 🎯 Center to user's current location
  const handleCenterToUser = () => {
    if (!userLocation) {
      Alert.alert("Location not available", "Try again once GPS is ready.");
      return;
    }
    mapRef.current?.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Map</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="options-outline" size={22} color="#112112" />
        </TouchableOpacity>
      </View>

      {/* 🔎 Simple Search Bar (no Google key needed) */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search for a location (e.g., Kuching, Semenggoh)"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            style={styles.searchInput}
          />
          <TouchableOpacity onPress={handleSearch} disabled={searching} style={styles.goBtn}>
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Section */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 1.55,
          longitude: 110.34,
          latitudeDelta: 0.4,
          longitudeDelta: 0.4,
        }}
        onLongPress={handleAddMarker}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor="red"
          >
            <Callout
              onPress={() =>
                navigation.navigate("ObservationDetails", {
                  observation: marker,
                })
              }
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.title}</Text>
                <Text style={styles.calloutDescription}>{marker.description}</Text>
                <Text style={styles.calloutLink}>View Details →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* 🎯 Center to My Location Button */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterToUser}>
        <Ionicons name="locate-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ➕ Add Observation Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert("Coming Soon", "Add new observation form")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#f6f8f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e2",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#15931b",
  },
  iconButton: { padding: 6 },
  map: { flex: 1 },

  // Search bar
  searchBarWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 100,
    width: "90%",
    alignSelf: "center",
    zIndex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e5e2",
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: "#112112",
    fontSize: 15,
  },
  goBtn: {
    backgroundColor: "#15931b",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },

  // Callout
  calloutContainer: { width: 180 },
  calloutTitle: { fontWeight: "700", fontSize: 14, color: "#112112" },
  calloutDescription: { fontSize: 12, color: "#5c6c5e" },
  calloutLink: { marginTop: 4, color: "#15931b", fontWeight: "600", fontSize: 12 },

  // Floating buttons
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#15931b",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  centerButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#555",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
