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
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingPins, setLoadingPins] = useState(true);
  const [userRole, setUserRole] = useState("user"); // default role

  // ✅ Fetch current user role (to know if admin)
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserRole(snap.data().role || "user");
      }
    };
    fetchRole();
  }, []);

  // ✅ Get user's location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required.");
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

  // ✅ Fetch map markers from Firestore
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const predictionsRef = collection(db, "predictions");
        let q;

        if (userRole === "admin") {
          q = query(predictionsRef);
        } else {
          // Only fully verified pins visible to public users
          q = query(
            predictionsRef,
            where("verified_label", "==", true),
            where("verified_location", "==", true)
          );
        }

        const snapshot = await getDocs(q);
        const list = snapshot.docs
          .filter((d) => d.data().lat && d.data().lng) // only entries with coordinates
          .map((d) => ({
            id: d.id,
            title: d.data().corrected_label || d.data().predicted_label || "Unknown Species",
            verified_label: d.data().verified_label,
            verified_location: d.data().verified_location,
            lat: d.data().lat,
            lng: d.data().lng,
            coordinate: { latitude: d.data().lat, longitude: d.data().lng },
            userId: d.data().userId,
          }));

        setMarkers(list);
      } catch (err) {
        console.error("❌ Error loading pins:", err);
      } finally {
        setLoadingPins(false);
      }
    };

    fetchPins();
  }, [userRole]);

  // 🔍 Local search
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

  // 🎯 Center to user
  const handleCenterToUser = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  // 🎨 Marker color logic
  const getMarkerColor = (m) => {
    if (m.verified_label && m.verified_location) return "green";
    if (m.verified_label && !m.verified_location) return "orange";
    return "red";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Map</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="leaf-outline" size={22} color="#15931b" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
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

      {/* Map */}
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
              description={
                userRole === "admin"
                  ? `Label: ${m.verified_label ? "✅" : "❌"} | Location: ${
                      m.verified_location ? "✅" : "❌"
                    }`
                  : undefined
              }
              pinColor={getMarkerColor(m)}
            >
              <Callout
                onPress={() =>
                  navigation.navigate("ObservationDetails", {
                    observation: m,
                  })
                }
              >
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{m.title}</Text>
                  {userRole === "admin" && (
                    <>
                      <Text style={styles.calloutDescription}>
                        Label verified: {m.verified_label ? "Yes" : "No"}
                      </Text>
                      <Text style={styles.calloutDescription}>
                        Location verified: {m.verified_location ? "Yes" : "No"}
                      </Text>
                    </>
                  )}
                  <Text style={styles.calloutLink}>View Details →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>

      {/* Center to My Location */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterToUser}>
        <Ionicons name="locate-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ➕ Add Observation Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("SelectPredictionForLocation")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#15931b" },
  iconButton: { padding: 6 },
  map: { flex: 1 },
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
  searchInput: { flex: 1, color: "#112112", fontSize: 15 },
  goBtn: {
    backgroundColor: "#15931b",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  calloutContainer: { width: 180 },
  calloutTitle: { fontWeight: "700", fontSize: 14, color: "#112112" },
  calloutDescription: { fontSize: 12, color: "#5c6c5e" },
  calloutLink: { marginTop: 4, color: "#15931b", fontWeight: "600", fontSize: 12 },
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
