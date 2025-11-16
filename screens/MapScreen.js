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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingPins, setLoadingPins] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [selectedMarker, setSelectedMarker] = useState(null);

  /** ------------------------------
   * Fetch current user role
   * ------------------------------ */
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) setUserRole(snap.data().role || "user");
    };
    fetchRole();
  }, []);

  /** ------------------------------
   * Get user current location
   * ------------------------------ */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);

      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  /** ------------------------------
   * Fetch predictions (pins)
   * ------------------------------ */
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const predictionsRef = collection(db, "predictions");
        let q;

        if (userRole === "admin") {
          q = query(predictionsRef);
        } else {
          q = query(
            predictionsRef,
            where("verified_label", "==", true),
            where("verified_location", "==", true),
            where("share_location", "==", true)
          );
        }

        const snapshot = await getDocs(q);

        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            const loc = data.location || {};
            return {
              id: d.id,
              title: data.corrected_label || data.predicted_label || "Unknown Species",
              imageUrl: data.imageUrl,
              confidence: data.confidence,
              timestamp: data.timestamp,
              model_version: data.model_version || "v1",
              address: data.address || "Unknown Location",
              lat: loc.latitude,
              lng: loc.longitude,
              coordinate:
                loc.latitude && loc.longitude
                  ? { latitude: loc.latitude, longitude: loc.longitude }
                  : null,
              verified_label: data.verified_label,
              verified_location: data.verified_location,
              share_location: data.share_location,
              userId: data.userId,
            };
          })
          .filter((m) => m.coordinate);

        setMarkers(list);
      } catch (err) {
        console.error("❌ Error loading pins:", err);
      } finally {
        setLoadingPins(false);
      }
    };

    fetchPins();
  }, [userRole]);

  /** ------------------------------
   * Search Location
   * ------------------------------ */
  const handleSearch = async () => {
    const trimmed = queryText.trim();
    if (!trimmed) return Alert.alert("Search", "Enter a location name.");

    try {
      setSearching(true);
      const results = await Location.geocodeAsync(trimmed);

      if (results.length === 0) return Alert.alert("Not found", "Try another name.");

      const { latitude, longitude } = results[0];

      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (e) {
      console.error("Geocode error:", e);
      Alert.alert("Error", "Failed to find that location.");
    } finally {
      setSearching(false);
    }
  };

  /** ------------------------------
   * Center on user
   * ------------------------------ */
  const handleCenterToUser = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  /** ------------------------------
   * Marker Color
   * ------------------------------ */
  const getMarkerColor = (m) => {
    if (m.verified_label && m.verified_location) return "green";
    if (m.verified_label && !m.verified_location) return "orange";
    return "red";
  };

  /** ------------------------------
   * UI
   * ------------------------------ */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Map</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="leaf-outline" size={22} color="#15931b" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search location (e.g. Semenggoh)"
            placeholderTextColor="#888"
            value={queryText}
            onChangeText={setQueryText}
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

      {/* MAP */}
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
      >
        {!loadingPins &&
          markers.map((m) => (
            <Marker
              key={m.id}
              coordinate={m.coordinate}
              title={m.title}
              pinColor={getMarkerColor(m)}
              tracksViewChanges={false}
              onPress={() => setSelectedMarker(m)}
            />
          ))}
      </MapView>

      {/* Center to User */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterToUser}>
        <Ionicons name="locate-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Add Observation */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("SelectPredictionForLocation")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* BOTTOM SHEET CARD */}
      {selectedMarker && (
        <View style={styles.bottomCard}>
          <TouchableOpacity
            style={styles.cardClose}
            onPress={() => setSelectedMarker(null)}
          >
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>

          <Text style={styles.cardTitle}>{selectedMarker.title}</Text>

          {userRole === "admin" && (
            <>
              <Text style={styles.cardText}>
                Label Verified: {selectedMarker.verified_label ? "Yes" : "No"}
              </Text>
              <Text style={styles.cardText}>
                Location Verified: {selectedMarker.verified_location ? "Yes" : "No"}
              </Text>
            </>
          )}

          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => {
              navigation.navigate("ObservationDetails", { observation: selectedMarker });
              setSelectedMarker(null);
            }}
          >
            <Text style={styles.cardButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** ------------------------------
 * Styles
 * ------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e2",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#15931b" },

  map: { flex: 1 },

  searchBarWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 100,
    width: "90%",
    alignSelf: "center",
    zIndex: 2,
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
  goBtn: {
    backgroundColor: "#15931b",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },

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
    zIndex: 2,
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
    zIndex: 2,
  },

  /** Bottom Card */
  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#15931b",
    textAlign: "center",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginVertical: 2,
  },
  cardButton: {
    backgroundColor: "#15931b",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  cardButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  cardClose: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 6,
    zIndex: 4,
  },
});
