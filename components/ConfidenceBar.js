import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ConfidenceBar({ confidence }) {
  const percent = Math.round(confidence * 100);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Confidence: {percent}%</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: { fontSize: 12, color: "#333" },
  barBackground: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    marginTop: 2,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
  },
});
