import { StyleSheet, Text, View } from "react-native";

export default function ProductCard({ title, description, children, style }) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    gap: 14,
  },
  title: {
    color: "#ff7a00",
    fontSize: 24,
    fontWeight: "900",
  },
  description: {
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 22,
  },
});
