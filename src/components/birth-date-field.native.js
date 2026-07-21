import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme/mercattoTheme";

const defaultDate = new Date(2000, 0, 1);

export default function BirthDateField({ value, onChange, error }) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = parseDate(value) || defaultDate;

  const handleChange = (event, nextDate) => {
    if (process.env.EXPO_OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !nextDate) return;
    onChange(formatDate(nextDate));
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Fecha de nacimiento</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seleccionar fecha de nacimiento"
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [
          styles.control,
          error && styles.controlError,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDisplayDate(selectedDate) : "Seleccionar fecha"}
        </Text>
        <Ionicons name="calendar-outline" size={22} color={colors.primaryDark} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={process.env.EXPO_OS === "ios" ? "inline" : "calendar"}
            accentColor={colors.primaryDark}
            themeVariant="light"
            locale="es-EC"
            positiveButton={{ label: "Aceptar", textColor: colors.primaryDark }}
            negativeButton={{ label: "Cancelar", textColor: colors.muted }}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={handleChange}
          />
          {process.env.EXPO_OS === "ios" ? (
            <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
              <Text style={styles.doneText}>Listo</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function parseDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  control: {
    minHeight: 54,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  controlError: {
    borderColor: colors.red,
  },
  pressed: {
    opacity: 0.75,
  },
  value: {
    color: colors.ink,
    fontSize: 16,
    flex: 1,
  },
  placeholder: {
    color: "#9A9A9A",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  doneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  doneText: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  error: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
  },
});
