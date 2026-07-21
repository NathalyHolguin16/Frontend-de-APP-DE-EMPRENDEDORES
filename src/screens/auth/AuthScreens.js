import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    Card,
    CheckboxRow,
    Chip,
    Field,
    MercattoLogo,
    PrimaryButton,
    Screen,
    SearchBar,
} from "../../components/MercattoUI";
import { useMercatto } from "../../context/MercattoContext";
import { cities, formSteps } from "../../data/mercattoData";
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
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
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
    <Screen contentStyle={styles.authContent}>
      <KeyboardAvoidingView behavior="padding" style={{ gap: spacing.md }}>
        <MercattoLogo />
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={typography.h2}>Bienvenido de vuelta</Text>
          <Text style={[typography.muted, { textAlign: "center" }]}>
            Ingresa con tu correo electrónico para continuar.
          </Text>
        </View>

        <Card>
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
          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
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

export function ForgotPasswordScreen({ navigation }) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Screen>
      <Text style={typography.h1}>Recuperar contraseña</Text>
      <Text style={typography.muted}>
        Te enviaremos un código de seguridad a tu correo o celular registrado.
      </Text>
      <Card>
        <Field
          label="Correo o celular"
          placeholder="maria@correo.com"
          value={value}
          onChangeText={setValue}
        />
        {sent ? (
          <Text style={styles.success}>
            Código enviado. Revisa tus mensajes.
          </Text>
        ) : null}
        <PrimaryButton title="Enviar código" onPress={() => setSent(true)} />
        <PrimaryButton
          title="Introducir código"
          variant="secondary"
          onPress={() =>
            navigation.navigate("Verification", { purpose: "password" })
          }
        />
      </Card>
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
        Elige un punto de partida. Más adelante podrás activar ambos perfiles en
        tu cuenta.
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
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const progress = ((step + 1) / formSteps.length) * 100;

  const update = (key, value) =>
    setData((current) => ({ ...current, [key]: value }));
  const fieldsByStep = [
    [
      ["names", "Nombres"],
      ["lastNames", "Apellidos"],
      ["idNumber", "Número de cédula"],
      ["birthDate", "Fecha de nacimiento"],
      ["gender", "Género"],
      ["phone", "Número celular"],
      ["email", "Correo electrónico"],
    ],
    [
      ["businessName", "Nombre del emprendimiento"],
      ["category", "Categoría principal"],
      ["subcategory", "Subcategoría"],
      ["shortDescription", "Descripción corta"],
      ["about", "Conoce más sobre nosotros"],
      ["startYear", "Año de inicio opcional"],
      ["businessPhone", "Contacto del negocio"],
      ["businessEmail", "Correo del negocio"],
      ["whatsapp", "Enlace de WhatsApp"],
      ["socials", "Redes sociales"],
      ["website", "Sitio web"],
      ["baseCity", "Ciudad base"],
      ["coverage", "Sectores o ciudades donde ofrece productos"],
    ],
    [
      ["logo", "Logo del emprendimiento"],
      ["cover", "Imagen de portada"],
      ["starProduct", "Fotografía del producto estrella"],
      ["gallery", "Fotos adicionales"],
    ],
    [
      ["modality", "Modalidad del negocio"],
      ["location", "Dirección exacta"],
      ["schedule", "Horarios de atención"],
      ["pickup", "Retiro, delivery o punto de encuentro"],
    ],
    [
      ["delivery", "Zonas y costos de delivery"],
      ["prepTime", "Tiempo de preparación"],
      ["minOrder", "Pedido mínimo"],
      ["freeFrom", "Envío gratis desde"],
    ],
    [
      ["payments", "Métodos de pago"],
      ["bank", "Datos bancarios privados"],
      ["wallet", "Billetera digital"],
    ],
    [
      ["changes", "Política de cambios"],
      ["returns", "Política de devoluciones"],
      ["cancel", "Política de cancelación"],
      ["custom", "Condiciones para personalizados"],
    ],
    [["review", "Resumen final y notas para revisión"]],
  ];

  const finish = () => {
    navigation.navigate("Verification", { profileType: "entrepreneur", data });
  };

  return (
    <Screen>
      <Text style={typography.h1}>Registro emprendedor</Text>
      <Text style={typography.muted}>
        Paso {step + 1} de {formSteps.length}: {formSteps[step]}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Card>
        {fieldsByStep[step].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            placeholder={placeholderFor(label)}
            value={data[key] || ""}
            onChangeText={(value) => update(key, value)}
            multiline={[
              "about",
              "coverage",
              "delivery",
              "changes",
              "returns",
              "custom",
              "review",
            ].includes(key)}
          />
        ))}
        {step === 0 ? (
          <>
            <PasswordPair data={data} update={update} />
            <LegalChecks data={data} update={update} />
          </>
        ) : null}
        {step === 2 ? <ImageUploadMock /> : null}
        {step === 3 ? <MultiSelectMock /> : null}
        {step === 7 ? <ReviewPreview data={data} /> : null}
      </Card>
      <View style={styles.navRow}>
        <PrimaryButton
          title="Atrás"
          variant="secondary"
          onPress={() =>
            step === 0 ? navigation.goBack() : setStep((value) => value - 1)
          }
          style={{ flex: 1 }}
        />
        <PrimaryButton
          title={
            step === formSteps.length - 1 ? "Enviar para revisión" : "Siguiente"
          }
          onPress={() =>
            step === formSteps.length - 1
              ? finish()
              : setStep((value) => value + 1)
          }
          style={{ flex: 1 }}
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

function LegalChecks({ data, update }) {
  return (
    <>
      <CheckboxRow
        label="Acepto los términos y condiciones de Mercatto."
        checked={!!data.terms}
        onPress={() => update("terms", !data.terms)}
      />
      <CheckboxRow
        label="Acepto las políticas de privacidad y tratamiento de datos."
        checked={!!data.privacy}
        onPress={() => update("privacy", !data.privacy)}
      />
    </>
  );
}

function ImageUploadMock() {
  return (
    <View style={styles.uploadGrid}>
      {["Logo", "Portada", "Producto estrella", "Galería"].map(
        (item, index) => (
          <View key={item} style={styles.uploadBox}>
            <Ionicons
              name={index === 0 ? "image-outline" : "cloud-upload-outline"}
              size={24}
              color={colors.primaryDark}
            />
            <Text style={styles.uploadTitle}>{item}</Text>
            <Text style={styles.uploadText}>
              Previsualizar, recortar, reemplazar o eliminar.
            </Text>
            {index === 2 ? (
              <Text style={styles.warning}>
                Resolución sugerida: 1200 x 900 px
              </Text>
            ) : null}
          </View>
        ),
      )}
    </View>
  );
}

function MultiSelectMock() {
  const options = [
    "Local físico",
    "Solo ventas en línea",
    "Bajo pedido",
    "Delivery",
    "Retiro en local",
    "Punto de encuentro",
  ];
  const [selected, setSelected] = useState(["Delivery", "Retiro en local"]);
  return (
    <View style={styles.chipWrap}>
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={selected.includes(option)}
          onPress={() =>
            setSelected((current) =>
              current.includes(option)
                ? current.filter((item) => item !== option)
                : [...current, option],
            )
          }
        />
      ))}
    </View>
  );
}

function ReviewPreview({ data }) {
  const completed = Math.min(
    96,
    45 + Object.values(data).filter(Boolean).length * 4,
  );
  return (
    <Card style={{ backgroundColor: colors.softOrange }}>
      <Text style={typography.h3}>Vista previa del perfil</Text>
      <Text style={typography.body}>
        {data.businessName || "Nombre del emprendimiento"}
      </Text>
      <Text style={typography.muted}>
        {data.shortDescription || "Descripción corta visible para compradores."}
      </Text>
      <Text style={styles.success}>Perfil completado al {completed}%</Text>
      <PrimaryButton
        title="Editar información del negocio"
        variant="secondary"
        onPress={() => null}
      />
    </Card>
  );
}

export function VerificationScreen({ route, navigation }) {
  const { registerUser } = useMercatto();
  const { profileType = "buyer", data = {}, purpose } = route.params || {};
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verify = async () => {
    if (code.length < 4) {
      setMessage("Ingresa el código de seguridad de 4 dígitos.");
      return;
    }
    if (purpose === "password") {
      navigation.replace("Login");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser({ profileType, data });
      navigation.replace(
        profileType === "entrepreneur" ? "EntrepreneurTabs" : "CitySelect",
      );
    } catch (error) {
      setMessage(error?.message || "No pudimos crear la cuenta. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.h1}>Verificación</Text>
      <Text style={typography.muted}>
        Enviamos un código de seguridad a tu celular o correo. Para esta maqueta
        usa 1234.
      </Text>
      <Card>
        <Field
          label="Código"
          placeholder="1234"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        {message ? <Text style={styles.errorHint}>{message}</Text> : null}
        <PrimaryButton
          title={isSubmitting ? "Creando cuenta..." : "Verificar y continuar"}
          icon="shield-checkmark-outline"
          onPress={verify}
          disabled={isSubmitting}
        />
        <PrimaryButton
          title="Reenviar código"
          variant="secondary"
          onPress={() => setMessage("Código reenviado correctamente.")}
        />
      </Card>
    </Screen>
  );
}

export function CitySelectScreen({ route, navigation }) {
  const { selectedCity, setSelectedCity } = useMercatto();
  const [query, setQuery] = useState("");
  const [nextCity, setNextCity] = useState(selectedCity);
  const filtered = cities.filter((city) =>
    city.toLowerCase().includes(query.toLowerCase()),
  );
  const continueToApp = () => {
    setSelectedCity(nextCity);
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
      <PrimaryButton
        title="Usar ubicación actual"
        icon="locate-outline"
        variant="secondary"
        onPress={() => setNextCity("Manta")}
      />
      <SectionTitle text="Ciudades populares" />
      <View style={styles.chipWrap}>
        {cities.slice(0, 5).map((city) => (
          <Chip
            key={city}
            label={city}
            selected={nextCity === city}
            onPress={() => setNextCity(city)}
          />
        ))}
      </View>
      <SectionTitle text="Todas las ciudades" />
      <Card>
        {filtered.map((city) => (
          <Pressable
            key={city}
            onPress={() => setNextCity(city)}
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
        title="Continuar"
        icon="arrow-forward-outline"
        onPress={continueToApp}
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
