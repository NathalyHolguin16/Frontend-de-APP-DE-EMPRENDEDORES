import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AddressMap from "../../components/address-map";
import {
  Card,
  CheckboxRow,
  Chip,
  Field,
  MercattoLogo,
  PrimaryButton,
  Screen,
  SearchBar,
  useResponsiveLayout,
} from "../../components/MercattoUI";
import { useMercatto } from "../../context/MercattoContext";
import {
  cities,
  cityCoordinates,
  cityProvinces,
  matchMercattoCity,
} from "../../data/mercattoData";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "../../theme/mercattoTheme";
import { isEmail, validatePassword } from "../../utils/validation";

export function SplashScreen({ navigation }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: process.env.EXPO_OS !== "web",
        friction: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: process.env.EXPO_OS !== "web",
      }),
    ]).start();
    const id = setTimeout(() => navigation.replace("Login"), 1300);
    return () => clearTimeout(id);
  }, [navigation, opacity, scale]);

  return (
    <Screen
      scroll={false}
      style={styles.splash}
      contentStyle={styles.splashContent}
    >
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <MercattoLogo size={108} light />
      </Animated.View>
      <Text style={styles.splashSubtitle}>
        Compra local. Vende fácil. Crece cerca.
      </Text>
      <View style={styles.loadingTrack}>
        <Animated.View style={[styles.loadingBar, { opacity }]} />
      </View>
    </Screen>
  );
}

export function LoginScreen({ navigation }) {
  const { isCompactLandscape } = useResponsiveLayout();
  const { login } = useMercatto();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const nextErrors = {};
    if (!identifier.trim()) {
      nextErrors.identifier = "Ingresa tu correo electrónico.";
    } else if (!isEmail(identifier)) {
      nextErrors.identifier = "Ingresa un correo electrónico válido.";
    }
    if (!password.trim()) {
      nextErrors.password = "Ingresa tu contraseña.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const nextUser = await login({ identifier, password });
      if (nextUser.profiles.length > 1) {
        navigation.replace("ModeSelect");
        return;
      }
      if (nextUser.backendAddressId) {
        navigation.replace("BuyerTabs");
        return;
      }
      navigation.replace("CitySelect", { fromLogin: true });
    } catch (error) {
      setErrors({
        form:
          error?.status === 422
            ? "El correo o la contraseña son incorrectos."
            : error?.message || "No pudimos conectar con Mercatto. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      contentStyle={[
        styles.authContent,
        isCompactLandscape && styles.authContentLandscape,
      ]}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[
          styles.authLayout,
          isCompactLandscape && styles.authLayoutLandscape,
        ]}
      >
        <View
          style={[
            styles.authIntro,
            isCompactLandscape && styles.authIntroLandscape,
          ]}
        >
          <MercattoLogo size={isCompactLandscape ? 68 : 82} />
          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={typography.h2}>Bienvenido de vuelta</Text>
            <Text style={[typography.muted, { textAlign: "center" }]}>
              Ingresa con tu correo electrónico para continuar.
            </Text>
          </View>
        </View>

        <Card style={isCompactLandscape && styles.authCardLandscape}>
          <Field
            label="Correo electrónico"
            placeholder="maria@correo.com"
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              setErrors({});
            }}
            error={errors.identifier}
          />
          <Field
            label="Contraseña"
            placeholder="Tu contraseña"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightPress={() => setShowPassword((value) => !value)}
            error={errors.password}
          />
          {errors.form ? <Text selectable style={styles.errorHint}>{errors.form}</Text> : null}
          <PrimaryButton
            title={isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            icon="log-in-outline"
            onPress={submit}
            disabled={isSubmitting}
          />
          <Pressable
            onPress={() => navigation.navigate("RegisterRole")}
            style={styles.centerRow}
          >
            <Text style={styles.bottomText}>¿No tienes una cuenta? </Text>
            <Text style={styles.bottomLink}>Regístrate</Text>
          </Pressable>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function ModeSelectScreen({ navigation }) {
  const { setMode } = useMercatto();
  const selectMode = (nextMode) => {
    setMode(nextMode);
    navigation.replace(
      nextMode === "buyer" ? "CitySelect" : "EntrepreneurTabs",
    );
  };
  return (
    <Screen>
      <Text style={typography.h1}>¿Cómo deseas entrar?</Text>
      <Text style={typography.muted}>
        Tu cuenta tiene perfil comprador y emprendedor. Puedes cambiarlo después
        desde Perfil.
      </Text>
      <RoleCard
        icon="bag-handle-outline"
        title="Entrar como comprador"
        description="Explora emprendimientos, promociones, favoritos, pedidos y carrito."
        button="Continuar como comprador"
        onPress={() => selectMode("buyer")}
      />
      <RoleCard
        icon="storefront-outline"
        title="Entrar como emprendedor"
        description="Administra productos, promociones, pedidos y la información de tu negocio."
        button="Continuar como emprendedor"
        onPress={() => selectMode("entrepreneur")}
        dark
      />
    </Screen>
  );
}

export function RegisterRoleScreen({ navigation }) {
  const [selected, setSelected] = useState("buyer");
  const goNext = () => {
    navigation.navigate(
      selected === "buyer" ? "BuyerRegister" : "EntrepreneurRegister",
    );
  };
  return (
    <Screen>
      <Text style={typography.h1}>¿Cómo deseas utilizar Mercatto?</Text>
      <Text style={typography.muted}>
        Elige el uso principal con el que deseas comenzar.
      </Text>
      <RoleCard
        icon="basket-outline"
        title="Comprar en Mercatto"
        description="Descubre emprendimientos, encuentra productos, aprovecha promociones y realiza tus pedidos de forma rápida y segura."
        button="Seleccionar comprador"
        selected={selected === "buyer"}
        onPress={() => setSelected("buyer")}
      />
      <RoleCard
        icon="storefront-outline"
        title="Vender en Mercatto"
        description="Crea el perfil de tu emprendimiento, publica tus productos, ofrece promociones y administra tus pedidos."
        button="Seleccionar emprendedor"
        selected={selected === "entrepreneur"}
        onPress={() => setSelected("entrepreneur")}
        dark
      />
      <PrimaryButton
        title="Continuar"
        icon="arrow-forward-outline"
        onPress={goNext}
      />
    </Screen>
  );
}

function RoleCard({
  icon,
  title,
  description,
  button,
  onPress,
  selected,
  dark,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCard,
        dark && styles.roleCardDark,
        selected && styles.roleSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.roleTop}>
        <View
          style={[styles.roleIcon, dark && { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name={icon}
            size={27}
            color={dark ? colors.ink : colors.primaryDark}
          />
        </View>
        {selected ? (
          <View
            style={[
              styles.roleStatus,
              dark ? styles.roleStatusDark : styles.roleStatusLight,
            ]}
          >
            <Text
              style={[
                styles.roleStatusText,
                dark ? styles.roleStatusTextDark : styles.roleStatusTextLight,
              ]}
            >
              Opción seleccionada
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.roleTitle, dark && { color: colors.white }]}>
        {title}
      </Text>
      <Text style={[styles.roleDesc, dark && { color: "#E9E1D4" }]}>
        {description}
      </Text>
      <PrimaryButton
        title={button}
        variant={dark ? "secondary" : "primary"}
        onPress={onPress}
      />
    </Pressable>
  );
}

export function BuyerRegisterScreen({ navigation }) {
  return <RegisterForm profileType="buyer" navigation={navigation} />;
}

export function EntrepreneurRegisterScreen({ navigation }) {
  const { registerUser } = useMercatto();
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (key, value) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", form: "" }));
  };

  const submit = async () => {
    const nextErrors = {};
    if (!data.names?.trim()) nextErrors.names = "Ingresa tus nombres.";
    if (!data.lastNames?.trim()) nextErrors.lastNames = "Ingresa tus apellidos.";
    if (!data.email?.trim()) {
      nextErrors.email = "Ingresa tu correo electrónico.";
    } else if (!isEmail(data.email)) {
      nextErrors.email = "Ingresa un correo electrónico válido.";
    }
    if (!validatePassword(data.password || "").valid) {
      nextErrors.password = "Usa al menos 8 caracteres.";
    }
    if (!data.confirmPassword) {
      nextErrors.confirmPassword = "Repite tu contraseña.";
    } else if (data.password !== data.confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (!data.businessName?.trim()) {
      nextErrors.businessName = "Ingresa el nombre del emprendimiento.";
    }
    if (!data.businessPhone?.trim()) {
      nextErrors.businessPhone = "Ingresa un teléfono de contacto.";
    }
    if (!data.legal) {
      nextErrors.legal = "Debes aceptar los términos y la política de privacidad.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await registerUser({ profileType: "entrepreneur", data });
      navigation.replace("EntrepreneurTabs");
    } catch (error) {
      setErrors({
        form:
          error?.message ||
          "No pudimos crear la cuenta y el emprendimiento. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.h1}>Registro emprendedor</Text>
      <Text style={typography.muted}>
        Crea tu cuenta y registra los datos básicos de tu emprendimiento.
      </Text>
      <Card>
        <Field
          label="Nombres"
          placeholder="Tus nombres"
          value={data.names || ""}
          onChangeText={(value) => update("names", value)}
          error={errors.names}
        />
        <Field
          label="Apellidos"
          placeholder="Tus apellidos"
          value={data.lastNames || ""}
          onChangeText={(value) => update("lastNames", value)}
          error={errors.lastNames}
        />
        <Field
          label="Correo electrónico"
          placeholder="correo@ejemplo.com"
          value={data.email || ""}
          onChangeText={(value) => update("email", value)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <PasswordPair data={data} update={update} errors={errors} />
      </Card>
      <Card>
        <Text style={typography.h3}>Tu emprendimiento</Text>
        <Field
          label="Nombre del emprendimiento"
          placeholder="Nombre público del negocio"
          value={data.businessName || ""}
          onChangeText={(value) => update("businessName", value)}
          error={errors.businessName}
        />
        <Field
          label="Descripción"
          placeholder="Describe brevemente lo que ofreces"
          value={data.shortDescription || ""}
          onChangeText={(value) => update("shortDescription", value)}
          multiline
        />
        <Field
          label="Teléfono de contacto"
          placeholder="0991234567"
          value={data.businessPhone || ""}
          onChangeText={(value) => update("businessPhone", value)}
          keyboardType="phone-pad"
          error={errors.businessPhone}
        />
        <CheckboxRow
          label="Acepto los términos y la política de privacidad de Mercatto."
          checked={!!data.legal}
          onPress={() => update("legal", !data.legal)}
        />
        {errors.legal ? (
          <Text style={styles.errorHint}>{errors.legal}</Text>
        ) : null}
        {errors.form ? (
          <Text selectable style={styles.errorHint}>{errors.form}</Text>
        ) : null}
        <PrimaryButton
          title={isSubmitting ? "Creando emprendimiento..." : "Crear emprendimiento"}
          icon="storefront-outline"
          onPress={submit}
          disabled={isSubmitting}
        />
      </Card>
      <View style={styles.navRow}>
        <PrimaryButton
          title="Volver"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

function RegisterForm({ profileType, navigation }) {
  const { registerUser } = useMercatto();
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (key, value) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", form: "" }));
  };
  const fields = [
    ["names", "Nombres"],
    ["lastNames", "Apellidos"],
    ["email", "Correo electrónico"],
  ];

  const submit = async () => {
    const nextErrors = {};
    if (!data.names?.trim()) nextErrors.names = "Ingresa tus nombres.";
    if (!data.lastNames?.trim()) nextErrors.lastNames = "Ingresa tus apellidos.";
    if (!data.email?.trim()) {
      nextErrors.email = "Ingresa tu correo electrónico.";
    } else if (!isEmail(data.email)) {
      nextErrors.email = "Ingresa un correo electrónico válido.";
    }
    if (!validatePassword(data.password || "").valid) {
      nextErrors.password = "Usa al menos 8 caracteres.";
    }
    if (!data.confirmPassword) {
      nextErrors.confirmPassword = "Repite tu contraseña.";
    } else if (data.password !== data.confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (!data.legal) {
      nextErrors.legal = "Debes aceptar los términos y la política de privacidad.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await registerUser({ profileType, data });
      navigation.replace(profileType === "entrepreneur" ? "EntrepreneurTabs" : "CitySelect");
    } catch (error) {
      setErrors({
        form: error?.message || "No pudimos crear la cuenta. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.h1}>Registro comprador</Text>
      <Text style={typography.muted}>
        Crea tu cuenta para comprar en emprendimientos de tu ciudad.
      </Text>
      <Card>
        {fields.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            placeholder={placeholderFor(label)}
            value={data[key] || ""}
            onChangeText={(value) => update(key, value)}
            error={errors[key]}
            keyboardType={key === "email" ? "email-address" : undefined}
            autoCapitalize={key === "email" ? "none" : "words"}
          />
        ))}
        <PasswordPair data={data} update={update} errors={errors} />
        <CheckboxRow
          label="Acepto los términos y la política de privacidad de Mercatto."
          checked={!!data.legal}
          onPress={() => update("legal", !data.legal)}
        />
        {errors.legal ? (
          <Text style={styles.errorHint}>{errors.legal}</Text>
        ) : null}
        {errors.form ? <Text selectable style={styles.errorHint}>{errors.form}</Text> : null}
        <PrimaryButton
          title={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          icon="person-add-outline"
          disabled={isSubmitting}
          onPress={submit}
        />
      </Card>
    </Screen>
  );
}

function PasswordPair({ data, update, errors = {} }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch =
    data.confirmPassword && data.password !== data.confirmPassword;
  return (
    <>
      <Field
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        secureTextEntry={!showPassword}
        value={data.password || ""}
        onChangeText={(value) => update("password", value)}
        rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
        onRightPress={() => setShowPassword((value) => !value)}
        error={errors.password}
      />
      <Field
        label="Confirmación de contraseña"
        placeholder="Repite tu contraseña"
        secureTextEntry={!showConfirm}
        value={data.confirmPassword || ""}
        onChangeText={(value) => update("confirmPassword", value)}
        rightIcon={showConfirm ? "eye-off-outline" : "eye-outline"}
        onRightPress={() => setShowConfirm((value) => !value)}
        error={
          mismatch ? "Las contraseñas no coinciden." : errors.confirmPassword
        }
      />
      {data.confirmPassword && !mismatch ? (
        <Text style={styles.success}>Las contraseñas coinciden.</Text>
      ) : null}
    </>
  );
}

export function CitySelectScreen({ route, navigation }) {
  const {
    saveDeliveryAddress,
    selectedCity,
    setSelectedCity,
    showNotice,
  } = useMercatto();
  const [query, setQuery] = useState("");
  const [nextCity, setNextCity] = useState(selectedCity);
  const [coordinates, setCoordinates] = useState(
    cityCoordinates[selectedCity] || cityCoordinates.Manta,
  );
  const [detectedAddress, setDetectedAddress] = useState("");
  const [detectedSector, setDetectedSector] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = cities.filter((city) =>
    city.toLowerCase().includes(query.toLowerCase()),
  );

  const selectCity = (city) => {
    setNextCity(city);
    setCoordinates(cityCoordinates[city] || cityCoordinates.Manta);
    setAddressConfirmed(false);
    setDetectedAddress("");
    setDetectedSector("");
    setMessage("");
  };

  const resolveMapPoint = async (nextCoordinates) => {
    setCoordinates(nextCoordinates);
    setIsLocating(true);
    try {
      const [place] = await Location.reverseGeocodeAsync(nextCoordinates);
      const detectedCity = place ? matchMercattoCity(place) : null;
      if (detectedCity && place) {
        const streetAddress = [place.street || place.name, place.streetNumber]
          .filter(Boolean)
          .join(" ");
        setNextCity(detectedCity);
        setDetectedAddress(streetAddress || place.formattedAddress || "");
        setDetectedSector(place.district || place.subregion || "");
        setAddressConfirmed(true);
        setMessage(
          `Ubicación detectada en ${detectedCity}. Puedes guardarla al continuar.`,
        );
      } else {
        setAddressConfirmed(false);
        setMessage("No pudimos reconocer una ciudad de Mercatto en ese punto.");
      }
    } catch {
      setAddressConfirmed(false);
      setMessage("No pudimos consultar la dirección de ese punto.");
    } finally {
      setIsLocating(false);
    }
  };

  const useCurrentLocation = async () => {
    setIsLocating(true);
    setMessage("Buscando tu ubicación actual...");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setMessage("Activa el permiso de ubicación para detectar tu ciudad.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await resolveMapPoint({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      setMessage(
        "No pudimos obtener tu ubicación. Selecciona tu ciudad manualmente.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const continueToApp = async () => {
    setSelectedCity(nextCity);

    if (addressConfirmed && detectedAddress) {
      setIsSaving(true);
      try {
        await saveDeliveryAddress({
          apiPayload: {
            alias: "Dirección principal",
            province: cityProvinces[nextCity] || nextCity,
            city: nextCity,
            street_main: detectedAddress,
            street_secondary: null,
            reference: detectedSector || "Sin referencia",
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            is_default: true,
          },
          localAddress: {
            city: nextCity,
            address: detectedAddress,
            addressSector: detectedSector,
            addressReference: "",
            addressCoordinates: coordinates,
          },
        });
      } catch {
        showNotice(
          "Seleccionamos tu ciudad, pero no pudimos guardar la dirección.",
          "error",
        );
      } finally {
        setIsSaving(false);
      }
    }

    if (route.params?.fromApp) {
      navigation.goBack();
      return;
    }
    navigation.replace("BuyerTabs");
  };

  return (
    <Screen>
      <Text style={typography.h1}>¿En qué ciudad te encuentras?</Text>
      <Text style={typography.muted}>
        Mercatto mostrará emprendimientos, promociones y entregas disponibles en
        tu ciudad.
      </Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar ciudad"
      />
      <View style={styles.mapHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>Confirma tu ubicación</Text>
          <Text style={typography.muted}>
            Mueve el mapa o usa tu ubicación actual.
          </Text>
        </View>
        {isLocating ? <ActivityIndicator color={colors.primaryDark} /> : null}
      </View>
      <AddressMap
        coordinates={coordinates}
        onCoordinateChange={resolveMapPoint}
      />
      <PrimaryButton
        title="Usar ubicación actual"
        icon="locate-outline"
        variant="secondary"
        onPress={useCurrentLocation}
        disabled={isLocating}
      />
      {message ? <Text style={styles.locationMessage}>{message}</Text> : null}
      <SectionTitle text="Ciudades populares" />
      <View style={styles.chipWrap}>
        {cities.slice(0, 5).map((city) => (
          <Chip
            key={city}
            label={city}
            selected={nextCity === city}
            onPress={() => selectCity(city)}
          />
        ))}
      </View>
      <SectionTitle text="Todas las ciudades" />
      <Card>
        {filtered.map((city) => (
          <Pressable
            key={city}
            onPress={() => selectCity(city)}
            style={styles.cityOption}
          >
            <Text style={styles.cityOptionText}>{city}</Text>
            {nextCity === city ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.primaryDark}
              />
            ) : null}
          </Pressable>
        ))}
      </Card>
      <PrimaryButton
        title={isSaving ? "Guardando dirección..." : "Continuar"}
        icon="arrow-forward-outline"
        onPress={continueToApp}
        disabled={isLocating || isSaving}
      />
    </Screen>
  );
}

function SectionTitle({ text }) {
  return <Text style={[typography.h3, { marginTop: spacing.sm }]}>{text}</Text>;
}

function placeholderFor(label) {
  if (label.includes("Correo")) return "correo@ejemplo.com";
  if (label.includes("celular") || label.includes("contacto"))
    return "0991234567";
  if (label.includes("Fecha")) return "AAAA-MM-DD";
  if (label.includes("Ciudad")) return "Manta";
  if (label.includes("Dirección")) return "Calle, número y referencia";
  if (label.includes("Descripción"))
    return "Describe con claridad lo que ofreces";
  return label;
}

const styles = StyleSheet.create({
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  locationMessage: {
    color: colors.muted,
    fontWeight: "750",
    lineHeight: 20,
  },
  splash: {
    backgroundColor: colors.primary,
  },
  splashContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  splashSubtitle: {
    color: colors.ink,
    fontWeight: "850",
    fontSize: 16,
    textAlign: "center",
  },
  loadingTrack: {
    width: 180,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  loadingBar: {
    width: "72%",
    height: "100%",
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  authContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  authContentLandscape: {
    paddingVertical: spacing.sm,
  },
  authLayout: {
    gap: spacing.md,
  },
  authLayoutLandscape: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  authIntro: {
    alignItems: "center",
    gap: spacing.md,
  },
  authIntroLandscape: {
    flex: 0.72,
    minWidth: 0,
  },
  authCardLandscape: {
    flex: 1.28,
    gap: spacing.sm,
    padding: spacing.md,
  },
  forgot: {
    alignSelf: "flex-end",
    color: colors.primaryDark,
    fontWeight: "850",
  },
  centerRow: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 4,
  },
  bottomText: {
    color: colors.muted,
  },
  bottomLink: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  roleCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.card,
  },
  roleCardDark: {
    backgroundColor: colors.ink,
  },
  roleSelected: {
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  roleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  roleStatus: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  roleStatusLight: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  roleStatusDark: {
    backgroundColor: colors.white,
    borderColor: "rgba(255,255,255,0.25)",
  },
  roleStatusText: {
    fontSize: 13,
    fontWeight: "900",
  },
  roleStatusTextLight: {
    color: colors.white,
  },
  roleStatusTextDark: {
    color: colors.ink,
  },
  roleIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softOrange,
  },
  roleTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "950",
  },
  roleDesc: {
    color: colors.muted,
    lineHeight: 21,
  },
  errorHint: {
    color: colors.red,
    fontWeight: "750",
    lineHeight: 20,
  },
  success: {
    color: colors.green,
    fontWeight: "850",
    lineHeight: 20,
  },
  progressTrack: {
    height: 10,
    backgroundColor: "#ECE7DF",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  uploadGrid: {
    gap: spacing.sm,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 5,
    backgroundColor: colors.softOrange,
  },
  uploadTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  uploadText: {
    color: colors.muted,
    fontSize: 13,
  },
  warning: {
    color: colors.primaryDark,
    fontWeight: "850",
    fontSize: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cityOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cityOptionText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
});
