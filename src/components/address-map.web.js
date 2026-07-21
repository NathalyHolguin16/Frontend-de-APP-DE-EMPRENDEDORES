import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../theme/mercattoTheme";

export default function AddressMap({ coordinates }) {
  return (
    <View style={styles.container}>
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />
      <View style={styles.blockOne} />
      <View style={styles.blockTwo} />
      <View style={styles.park} />
      <View style={styles.pin}>
        <Ionicons name="location" size={46} color={colors.primaryDark} />
      </View>
      <View style={styles.coordinates}>
        <Text style={styles.coordinateText}>
          {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 260,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#E9E5DC",
    position: "relative",
  },
  road: {
    position: "absolute",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D6D1C6",
  },
  roadOne: {
    width: "130%",
    height: 38,
    top: 96,
    left: "-15%",
    transform: [{ rotate: "-8deg" }],
  },
  roadTwo: {
    width: 42,
    height: "140%",
    top: "-20%",
    left: "35%",
    transform: [{ rotate: "16deg" }],
  },
  roadThree: {
    width: 30,
    height: "120%",
    top: "-10%",
    right: "20%",
    transform: [{ rotate: "-20deg" }],
  },
  blockOne: {
    position: "absolute",
    width: 100,
    height: 52,
    left: 24,
    top: 24,
    borderRadius: 8,
    backgroundColor: "#D9D3C7",
  },
  blockTwo: {
    position: "absolute",
    width: 110,
    height: 58,
    right: 24,
    bottom: 24,
    borderRadius: 8,
    backgroundColor: "#D9D3C7",
  },
  park: {
    position: "absolute",
    width: 90,
    height: 58,
    right: 30,
    top: 24,
    borderRadius: 12,
    backgroundColor: "#BFD9C2",
  },
  pin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -23 }, { translateY: -36 }],
  },
  coordinates: {
    position: "absolute",
    left: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  coordinateText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
});
