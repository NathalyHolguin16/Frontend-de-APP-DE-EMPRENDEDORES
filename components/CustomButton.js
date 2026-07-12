import { Pressable, StyleSheet, Text } from "react-native";

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  compact = false,
  style,
  textStyle,
}) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  compact: {
    minWidth: 48,
    minHeight: 48,
    width: 48,
    height: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  primary: {
    backgroundColor: "#ff7a00",
  },
  secondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ff7a00",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 16,
    fontWeight: "800",
  },
  primaryText: {
    color: "#ffffff",
  },
  secondaryText: {
    color: "#ff7a00",
  },
});
