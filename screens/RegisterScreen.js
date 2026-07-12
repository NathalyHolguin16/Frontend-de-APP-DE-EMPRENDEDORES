import { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import CustomButton from "../components/CustomButton";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !passwordConfirmation.trim()
    ) {
      setMessage("Completa todos los campos.");
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Registrando usuario...");
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage("Cuenta creada correctamente.");
    } catch (error) {
      setMessage(
        error?.payload?.message ||
          error?.message ||
          "No se pudo registrar la cuenta.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
          />

          <ProductCard
            title="Crear cuenta"
            description="El backend devuelve un token al registrar, y la app lo guarda automáticamente."
          >
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                placeholder="Juan Pérez"
                placeholderTextColor="#7c8aa1"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="juan@example.com"
                placeholderTextColor="#7c8aa1"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#7c8aa1"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#7c8aa1"
                secureTextEntry
                style={styles.input}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
              />
            </View>

            <View
              style={[styles.messageBox, !message ? { height: 0 } : undefined]}
            >
              <Text style={styles.message}>{message}</Text>
            </View>

            <CustomButton
              title={loading ? "Creando..." : "Registrarme"}
              onPress={handleRegister}
              disabled={loading}
            />
            <CustomButton
              title="Ya tengo cuenta"
              onPress={() => navigation.navigate("Login")}
              variant="secondary"
            />
          </ProductCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  icono: {
    fontSize: 58,
    textAlign: "center",
  },
  logo: {
    width: 84,
    height: 84,
    alignSelf: "center",
    marginBottom: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  input: {
    backgroundColor: "#f8fbff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ff7a00",
    color: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageBox: {
    backgroundColor: "#feeef0",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  message: {
    color: "#c0392b",
    minHeight: 20,
    textAlign: "center",
  },
});
