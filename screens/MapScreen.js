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
  Modal,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);

  const [markers, setMarkers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [speciesOptions, setSpeciesOptions] = useState([]);

  const [userLocation, setUserLocation] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingPins, setLoadingPins] = useState(true);

  const [userRole, setUserRole] = useState("user");

  const [selectedMarker, setSelectedMarker] = useState(null);

  // 🔍 species filter state
  const [selectedSpecies, setSelectedSpecies] = useState([]);      // applied filter
  const [tempSelectedSpecies, setTempSelectedSpecies] = useState([]); // used inside modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // ---------------------------------------------------
  // Fetch user role
  // ---------------------------------------------------
  useEffect(() => {
    const loadRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role || "user");
      }
    };
    loadRole();
  }, []);

  // ---------------------------------------------------
  // Get user location
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // Fetch markers based on role
  // ---------------------------------------------------
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const predictionsRef = collection(db, "predictions");
        let q;

        if (userRole === "admin") {
          q = query(predictionsRef); // admin sees everything
        } else {
          // public: only verified + share_location
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
            const loc = data.location;
            if (!loc) return null;

            return {
              id: d.id,
              species: data.predicted_label,
              title: data.corrected_label || data.predicted_label,
              confidence: data.confidence,
              imageUrl: data.imageUrl,
              verified_label: data.verified_label,
              verified_location: data.verified_location,
              coordinate: {
                latitude: loc.latitude,
                longitude: loc.longitude,
              },
            };
          })
          .filter(Boolean);

        setMarkers(list);

        // build species options from current markers (option 3)
        const uniqueSpecies = Array.from(
          new Set(list.map((m) => m.species).filter(Boolean))
        ).sort();
        setSpeciesOptions(uniqueSpecies);

        // apply current filter if any, otherwise show all
        if (selectedSpecies.length > 0) {
          setFiltered(list.filter((m) => selectedSpecies.includes(m.species)));
        } else {
          setFiltered(list);
        }
      } catch (err) {
        console.error("Error fetching predictions:", err);
        Alert.alert("Error", "Failed to load map markers.");
      } finally {
        setLoadingPins(false);
      }
    };

    fetchPins();
  }, [userRole]); // re-run if role changes

  // ---------------------------------------------------
  // Apply species filter
  // ---------------------------------------------------
  const applySpeciesFilter = (speciesArray) => {
    if (!speciesArray || speciesArray.length === 0) {
      setFiltered(markers);
    } else {
      setFiltered(markers.filter((m) => speciesArray.includes(m.species)));
    }
  };

  const handleOpenFilterModal = () => {
    // when opening, use current applied species as starting point
    setTempSelectedSpecies(selectedSpecies);
    setFilterModalVisible(true);
  };

  const handleToggleSpecies = (label) => {
    setTempSelectedSpecies((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : [...prev, label]
    );
  };

  const handleApplyFilter = () => {
    setSelectedSpecies(tempSelectedSpecies);
    applySpeciesFilter(tempSelectedSpecies);
    setFilterModalVisible(false);
  };

  const handleClearFilter = () => {
    setSelectedSpecies([]);
    setTempSelectedSpecies([]);
    setFiltered(markers);
    setFilterModalVisible(false);
  };

  // ---------------------------------------------------
  // Search location by text
  // ---------------------------------------------------
  const handleSearchLocation = async () => {
    const search = queryText.trim();
    if (!search) return;

    try {
      setSearching(true);
      const results = await Location.geocodeAsync(search);
      if (results.length === 0) {
        Alert.alert("Not found", "Try another place name.");
        return;
      }
      const loc = results[0];
      mapRef.current?.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (e) {
      console.error("Geocode error:", e);
      Alert.alert("Error", "Failed to search for that location.");
    } finally {
      setSearching(false);
    }
  };

  // Marker color
  const getMarkerColor = (m) => {
    if (m.verified_label && m.verified_location) return "green";
    if (m.verified_label) return "orange";
    return "red";
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Map</Text>
        <TouchableOpacity style={styles.headerFilterButton} onPress={handleOpenFilterModal}>
          <Ionicons name="options-outline" size={22} color="#15931b" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            placeholder="Search location (e.g. Semenggoh)"
            placeholderTextColor="#888"
            value={queryText}
            onChangeText={setQueryText}
            onSubmitEditing={handleSearchLocation}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.goBtn} onPress={handleSearchLocation}>
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
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }}
      >
        {!loadingPins &&
          filtered.map((m) => (
            <Marker
              key={m.id}
              coordinate={m.coordinate}
              pinColor={getMarkerColor(m)}
              onPress={() => setSelectedMarker(m)}
            />
          ))}
      </MapView>

      {/* CENTER TO USER BUTTON */}
      {userLocation && (
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() =>
            mapRef.current?.animateToRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            })
          }
        >
          <Ionicons name="locate-outline" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ADD OBSERVATION BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("SelectPredictionForLocation")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* BOTTOM CARD FOR SELECTED MARKER */}
      {selectedMarker && (
        <View style={styles.bottomCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMarker(null)}
          >
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.cardTitle}>{selectedMarker.title}</Text>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              navigation.navigate("ObservationDetails", {
                observation: selectedMarker,
              });
              setSelectedMarker(null);
            }}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Species</Text>

            {speciesOptions.length === 0 ? (
              <Text style={{ color: "#666", marginTop: 10 }}>
                No species available to filter.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {speciesOptions.map((label) => {
                  const isSelected = tempSelectedSpecies.includes(label);
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.modalSpeciesRow,
                        isSelected && styles.modalSpeciesRowSelected,
                      ]}
                      onPress={() => handleToggleSpecies(label)}
                    >
                      <Text
                        style={[
                          styles.modalSpeciesText,
                          isSelected && { color: "#fff" },
                        ]}
                      >
                        {label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={handleClearFilter}
              >
                <Text style={styles.modalClearText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={handleApplyFilter}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              style={{ marginTop: 8, alignSelf: "center" }}
            >
              <Text style={{ color: "#555" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },

  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f6f8f6",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#15931b",
  },
  headerFilterButton: {
    padding: 6,
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterPlaceholder: {
    marginLeft: 6,
    color: "#555",
    fontSize: 13,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#15931b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
  },
  chipText: {
    color: "#fff",
    marginRight: 4,
    fontSize: 12,
    fontWeight: "600",
  },

  searchBarWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 110,
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
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: "#222",
  },
  goBtn: {
    backgroundColor: "#15931b",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  map: { flex: 1 },

  centerButton: {
    position: "absolute",
    bottom: 110,
    right: 20,
    backgroundColor: "#555",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
  },

  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#15931b",
    marginBottom: 8,
  },
  detailsButton: {
    marginTop: 10,
    backgroundColor: "#15931b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#15931b",
  },
  modalSpeciesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#f3f3f3",
  },
  modalSpeciesRowSelected: {
    backgroundColor: "#15931b",
  },
  modalSpeciesText: {
    fontSize: 14,
    color: "#333",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  modalClearButton: {
    flex: 1,
    marginRight: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ddd",
    alignItems: "center",
  },
  modalApplyButton: {
    flex: 1,
    marginLeft: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#15931b",
    alignItems: "center",
  },
  modalClearText: {
    color: "#333",
    fontWeight: "600",
  },
  modalApplyText: {
    color: "#fff",
    fontWeight: "700",
  },
});
