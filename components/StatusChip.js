import React from "react";
import { Text, StyleSheet, View } from "react-native";

export default function StatusChip({ status }) {
  let bg = "#A0AEC0";
  if (status === "Verified") bg = "#16A34A";
  else if (status === "Pending") bg = "#F59E0B";
  else if (status === "Flagged") bg = "#DC2626";

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
