import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function AddLocation({ route, navigation }) {
  const { predictionId } = route.params || {};
  const mapRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  // Get user’s current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required to continue.");
          navigation.goBack();
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(coords);
        setMarkerPosition(coords);
        fetchAddress(coords);
      } catch (e) {
        console.error("❌ Location error:", e);
        Alert.alert("Error", "Could not fetch your location.");
        navigation.goBack();
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    })();
  }, []);

  // Fetch readable address from coordinates
  const fetchAddress = async (coords) => {
    try {
      const result = await Location.reverseGeocodeAsync(coords);
      if (result[0]) {
        const { name, city, region } = result[0];
        const formatted = `${name || ""} ${city || ""} ${region || ""}`.trim();
        setAddress(formatted || "Unnamed location");
      }
    } catch (err) {
      console.warn("Address lookup failed:", err);
    }
  };

  //  Search by place name
  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      setSearching(true);
      const results = await Location.geocodeAsync(trimmed);
      if (results.length === 0) {
        Alert.alert("Not Found", "No location found for that search.");
        return;
      }
      const { latitude, longitude } = results[0];
      const newCoords = { latitude, longitude };
      setMarkerPosition(newCoords);
      mapRef.current?.animateToRegion({
        ...newCoords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      fetchAddress(newCoords);
    } catch (err) {
      console.error("Geocode error:", err);
      Alert.alert("Error", "Search failed. Try again later.");
    } finally {
      setSearching(false);
    }
  };

  // User drags pin
  const onMarkerDragEnd = (e) => {
    const coords = e.nativeEvent.coordinate;
    setMarkerPosition(coords);
    fetchAddress(coords);
  };

  // Center to user
  const handleCenterToUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMarkerPosition(userLocation);
      fetchAddress(userLocation);
    }
  };

  // Save location to Firestore
  const handleSaveLocation = async () => {
    if (!markerPosition) {
      Alert.alert("No Location", "Please select a location first.");
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated.");

      await updateDoc(doc(db, "predictions", predictionId), {
        location_shared: true,
        verified_location: false,
        location: markerPosition,
        address: address || "",
      });

      Alert.alert("✅ Location Submitted", "Your plant location was uploaded for review.");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error saving location:", error);
      Alert.alert("Error", "Could not save location.");
    } finally {
      setSaving(false);
    }
  };

  // Render
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#15931b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Plant Location</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search a place (e.g., Kuching, Semenggoh)"
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} disabled={searching}>
            {searching ? (
              <ActivityIndicator size="small" color="#15931b" />
            ) : (
              <Ionicons name="arrow-forward" size={18} color="#15931b" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Section */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#15931b" />
          <Text style={styles.loaderText}>Loading map...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            ...markerPosition,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            setMarkerPosition(e.nativeEvent.coordinate);
            fetchAddress(e.nativeEvent.coordinate);
          }}
        >
          {markerPosition && (
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={onMarkerDragEnd}
            />
          )}
        </MapView>
      )}

      {/* Floating Center Button */}
      {!loading && (
        <TouchableOpacity style={styles.centerButton} onPress={handleCenterToUser}>
          <Ionicons name="locate-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 🧾 Mini Preview Card */}
      {markerPosition && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📍 Selected Location</Text>
          <Text style={styles.infoText}>{address || "Loading address..."}</Text>
          <Text style={styles.infoCoords}>
            Lat: {markerPosition.latitude.toFixed(5)} | Lng: {markerPosition.longitude.toFixed(5)}
          </Text>

          <TouchableOpacity
            style={[styles.confirmBtn, saving && { backgroundColor: "#9ecfa2" }]}
            onPress={handleSaveLocation}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.confirmText}>Confirm Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#f6f8f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e2",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#15931b" },
  backButton: { padding: 5 },
  map: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, color: "#555" },

  // Search bar
  searchBarWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 100,
    width: "90%",
    alignSelf: "center",
    zIndex: 10,
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
  searchInput: { flex: 1, color: "#112112", fontSize: 15 },

  centerButton: {
    position: "absolute",
    bottom: 180,
    right: 20,
    backgroundColor: "#555",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#15931b" },
  infoText: { fontSize: 14, color: "#333", marginTop: 6 },
  infoCoords: { fontSize: 12, color: "#777", marginTop: 4 },
  confirmBtn: {
    marginTop: 12,
    backgroundColor: "#15931b",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 15,
  },
});
