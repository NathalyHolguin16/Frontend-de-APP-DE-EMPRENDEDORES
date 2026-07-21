import { StyleSheet, Text, View } from "react-native";

import { Chip } from "./MercattoUI";
import { colors, spacing } from "../theme/mercattoTheme";

const genderOptions = ["Masculino", "Femenino", "Otro"];

export default function GenderSelector({ value, onChange, error }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Género</Text>
      <View style={styles.options}>
        {genderOptions.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  error: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
  },
});
