import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import StatusChip from "./StatusChip";
import ConfidenceBar from "./ConfidenceBar";

export default function ObservationCard({ species, confidence, location, image, status }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.species}>{species}</Text>
        <ConfidenceBar confidence={confidence} />
        <Text style={styles.location}>📍 {location}</Text>
        <StatusChip status={status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 180,
  },
  info: {
    padding: 12,
  },
  species: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  location: {
    marginTop: 6,
    fontSize: 14,
    color: "#555",
  },
});
