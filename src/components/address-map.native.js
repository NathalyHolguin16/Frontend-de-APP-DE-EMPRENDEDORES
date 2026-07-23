import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import MapView from "react-native-maps";

import { colors, radius, shadows } from "../theme/mercattoTheme";

const DELTA = 0.009;

export default function AddressMap({ coordinates, onCoordinateChange }) {
  const mapRef = useRef(null);
  const ignoreNextRegion = useRef(true);
  const { width, height } = useWindowDimensions();
  const compactLandscape = width > height && height < 500;

  useEffect(() => {
    ignoreNextRegion.current = true;
    mapRef.current?.animateToRegion(
      {
        ...coordinates,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      350,
    );
  }, [coordinates]);

  return (
    <View
      style={[
        styles.container,
        compactLandscape && styles.containerLandscape,
      ]}
    >
      <MapView
        ref={mapRef}
        initialRegion={{
          ...coordinates,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        onRegionChangeComplete={({ latitude, longitude }) => {
          if (ignoreNextRegion.current) {
            ignoreNextRegion.current = false;
            return;
          }
          onCoordinateChange({ latitude, longitude });
        }}
        showsCompass={false}
        showsMyLocationButton={false}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.pin}>
        <Ionicons name="location" size={46} color={colors.primaryDark} />
        <View style={styles.pinDot} />
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
    backgroundColor: "#E7E4DC",
    ...shadows.soft,
  },
  containerLandscape: {
    height: 190,
  },
  pin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    alignItems: "center",
    transform: [{ translateX: -23 }, { translateY: -42 }],
  },
  pinDot: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(23,25,24,0.22)",
  },
});
