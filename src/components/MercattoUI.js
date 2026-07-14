import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, shadows, spacing, typography } from "../theme/mercattoTheme";
import { useMercatto } from "../context/MercattoContext";

export const logoSource = require("../../assets/images/icon.png");

export function Screen({ children, scroll = true, style, contentStyle }) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <Wrapper
        contentInsetAdjustmentBehavior={scroll ? "automatic" : undefined}
        contentContainerStyle={scroll ? [styles.scrollContent, contentStyle] : undefined}
        style={!scroll ? [styles.flex, contentStyle] : undefined}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

export function MercattoLogo({ size = 82, showName = true, light = false }) {
  return (
    <View style={styles.logoWrap}>
      <Image source={logoSource} style={{ width: size, height: size, borderRadius: size * 0.28 }} resizeMode="contain" />
      {showName ? (
        <Text style={[styles.logoName, light && { color: colors.white }]}>Mercatto</Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  style,
}) {
  const secondary = variant === "secondary";
  const ghost = variant === "ghost";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        ghost && styles.buttonGhost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={19}
          color={secondary || ghost ? colors.primaryDark : colors.white}
        />
      ) : null}
      <Text style={[styles.buttonText, (secondary || ghost) && styles.buttonTextSecondary]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, badge, color = colors.ink, style }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, style]}>
      <Ionicons name={icon} size={22} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={typography.h3}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.linkText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline = false,
  rightIcon,
  onRightPress,
  error,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError, multiline && styles.multilineWrap]}>
        <TextInput
          autoCapitalize="none"
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9A9A9A"
          secureTextEntry={secureTextEntry}
          style={[styles.input, multiline && styles.multiline]}
          value={value}
        />
        {rightIcon ? (
          <Pressable onPress={onRightPress} style={styles.inputIcon}>
            <Ionicons name={rightIcon} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Chip({ label, icon, selected = false, onPress, tone }) {
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={16} color={selected ? colors.white : colors.ink} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </>
  );
  if (!onPress) {
    return <View style={[styles.chip, tone && { backgroundColor: tone }]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function CheckboxRow({ label, checked, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.checkboxRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export function PasswordStrength({ result }) {
  const width = `${Math.max(16, result.score * 20)}%`;
  const barColor = result.score <= 2 ? colors.red : result.score <= 4 ? colors.primary : colors.green;
  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthTrack}>
        <View style={[styles.strengthBar, { width, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.strengthText}>Fortaleza: {result.label}</Text>
      {[
        ["length", "Mínimo 8 caracteres"],
        ["upper", "Una mayúscula"],
        ["lower", "Una minúscula"],
        ["number", "Un número"],
        ["special", "Un signo especial"],
      ].map(([key, label]) => (
        <Text key={key} style={[styles.rule, result.checks[key] && styles.ruleOk]}>
          {result.checks[key] ? "✓" : "•"} {label}
        </Text>
      ))}
    </View>
  );
}

export function BuyerHeader({ navigation, title = "Hola, María" }) {
  const { selectedCity, deliveryAddress, cart } = useMercatto();
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <View style={styles.buyerHeader}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{title}</Text>
          <Pressable onPress={() => navigation.navigate("CitySelect", { fromApp: true })} style={styles.cityRow}>
            <Ionicons name="location-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.cityText}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={15} color={colors.primaryDark} />
          </Pressable>
        </View>
        <IconButton icon="notifications-outline" onPress={() => navigation.navigate("StateScreen", { type: "notifications" })} />
        <IconButton icon="cart-outline" badge={cartCount || null} onPress={() => navigation.navigate("Cart")} />
      </View>
      <Pressable onPress={() => navigation.navigate("Address")} style={styles.addressRow}>
        <Ionicons name="navigate-outline" size={16} color={colors.muted} />
        <Text numberOfLines={1} style={styles.addressText}>{deliveryAddress}</Text>
        <Text style={styles.changeText}>Cambiar</Text>
      </Pressable>
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={20} color={colors.muted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function BusinessCard({ business, onPress, favorite, onToggleFavorite }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.businessCard, pressed && styles.pressed]}>
      <Image source={{ uri: business.hero }} style={styles.businessImage} resizeMode="cover" />
      <View style={styles.favoriteFloating}>
        <IconButton
          icon={favorite ? "heart" : "heart-outline"}
          color={favorite ? colors.red : colors.ink}
          onPress={onToggleFavorite}
          style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
        />
      </View>
      <View style={styles.businessBody}>
        <View style={styles.businessTitleRow}>
          <Avatar label={business.logo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessDesc} numberOfLines={2}>{business.shortDescription}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Meta icon="star" label={`${business.rating} (${business.reviews})`} color={colors.primaryDark} />
          <Meta icon="time-outline" label={business.deliveryTime} />
          <Meta icon="bicycle-outline" label={`$${business.deliveryCost.toFixed(2)}`} />
        </View>
        <View style={styles.tagRow}>
          <Chip label={business.status} tone={business.status === "Abierto" ? "#E9F7EF" : "#F1F1F1"} />
          {business.tags.slice(0, 2).map((tag) => <Chip key={tag} label={tag} tone={colors.softOrange} />)}
        </View>
      </View>
    </Pressable>
  );
}

export function ProductCard({ product, onPress, onAdd }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}>
      <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productContent}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {product.oldPrice ? <Text style={styles.oldPrice}>${product.oldPrice.toFixed(2)}</Text> : null}
          {product.discount ? <Text style={styles.discount}>{product.discount}%</Text> : null}
        </View>
        <View style={styles.productFooter}>
          <Chip label={product.badges[0]} tone={colors.softOrange} />
          <IconButton icon="add" onPress={onAdd} color={colors.white} style={styles.addButton} />
        </View>
      </View>
    </Pressable>
  );
}

export function PromoCard({ promo, businessName, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.promoCard, pressed && styles.pressed]}>
      <Image source={{ uri: promo.image }} style={styles.promoImage} resizeMode="cover" />
      <View style={styles.promoBody}>
        <Text style={styles.discountPill}>{promo.discount}% OFF</Text>
        <Text style={styles.productName}>{promo.name}</Text>
        <Text style={styles.productDesc}>{businessName}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.oldPrice}>${promo.oldPrice.toFixed(2)}</Text>
          <Text style={styles.price}>${promo.price.toFixed(2)}</Text>
        </View>
        <Text style={styles.productDesc}>{promo.validity}</Text>
      </View>
    </Pressable>
  );
}

export function Avatar({ label, size = 46 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{label}</Text>
    </View>
  );
}

export function Meta({ icon, label, color = colors.muted }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.metaText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, message, action, onPress }) {
  return (
    <Card style={styles.emptyState}>
      <Ionicons name={icon} size={42} color={colors.primaryDark} />
      <Text style={typography.h3}>{title}</Text>
      <Text style={[typography.muted, { textAlign: "center" }]}>{message}</Text>
      {action ? <PrimaryButton title={action} onPress={onPress} variant="secondary" /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  logoWrap: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logoName: {
    fontSize: 32,
    fontWeight: "950",
    color: colors.ink,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...shadows.soft,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 0,
    boxShadow: "none",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  buttonTextSecondary: {
    color: colors.primaryDark,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkText: {
    color: colors.primaryDark,
    fontWeight: "850",
  },
  field: {
    gap: 7,
  },
  label: {
    color: colors.ink,
    fontWeight: "850",
    fontSize: 14,
  },
  inputWrap: {
    minHeight: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  multilineWrap: {
    alignItems: "flex-start",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 48,
  },
  multiline: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  inputIcon: {
    padding: spacing.xs,
  },
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    lineHeight: 18,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: colors.white,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  strengthWrap: {
    gap: 6,
  },
  strengthTrack: {
    height: 8,
    backgroundColor: "#EEEAE2",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: radius.pill,
  },
  strengthText: {
    color: colors.ink,
    fontWeight: "850",
    fontSize: 13,
  },
  rule: {
    color: colors.muted,
    fontSize: 12,
  },
  ruleOk: {
    color: colors.green,
    fontWeight: "800",
  },
  buyerHeader: {
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  greeting: {
    fontSize: 25,
    fontWeight: "950",
    color: colors.ink,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cityText: {
    color: colors.primaryDark,
    fontWeight: "850",
  },
  addressRow: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.soft,
  },
  addressText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
  changeText: {
    color: colors.primaryDark,
    fontWeight: "850",
    fontSize: 13,
  },
  searchBar: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  businessCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.card,
  },
  businessImage: {
    height: 150,
    width: "100%",
    backgroundColor: colors.softOrange,
  },
  favoriteFloating: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  businessBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  businessTitleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  businessName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "950",
  },
  businessDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "800",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatar: {
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "950",
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    flexDirection: "row",
    ...shadows.card,
  },
  productImage: {
    width: 112,
    minHeight: 150,
    backgroundColor: colors.softOrange,
  },
  productContent: {
    flex: 1,
    padding: spacing.md,
    gap: 8,
  },
  productName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "950",
  },
  productDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "950",
  },
  oldPrice: {
    color: colors.muted,
    textDecorationLine: "line-through",
    fontSize: 13,
  },
  discount: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900",
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
  },
  promoCard: {
    width: 260,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginRight: spacing.md,
    ...shadows.card,
  },
  promoImage: {
    height: 118,
    width: "100%",
    backgroundColor: colors.softOrange,
  },
  promoBody: {
    padding: spacing.md,
    gap: 7,
  },
  discountPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    color: colors.primary,
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "950",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
});
