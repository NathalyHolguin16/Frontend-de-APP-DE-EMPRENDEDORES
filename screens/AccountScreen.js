import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import CustomButton from "../components/CustomButton";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";

export default function AccountScreen() {
  const { profile, logout, refreshProfile, token } = useAuth();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profile && token) {
      refreshProfile().catch(() => null);
    }
  }, [profile, refreshProfile, token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ProductCard
          title="Mi cuenta"
          description="Este perfil viene del backend y demuestra que el token se reutiliza."
        >
          <Text style={styles.icono}>👤</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{profile?.name ?? "Cargando..."}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{profile?.email ?? "Cargando..."}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.value}>{token ? "Sesión activa" : "Sin sesión"}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          <CustomButton
            title="Actualizar perfil"
            onPress={async () => {
              try {
                setMessage("Actualizando perfil...");
                await refreshProfile();
                setMessage("Perfil actualizado.");
              } catch (error) {
                setMessage(error?.payload?.message || error?.message || "No se pudo actualizar.");
              }
            }}
            variant="secondary"
          />

          <CustomButton
            title="Cerrar sesión"
            onPress={async () => {
              try {
                setMessage("Cerrando sesión...");
                await logout();
              } catch (error) {
                setMessage(error?.payload?.message || error?.message || "No se pudo cerrar sesión.");
              }
            }}
          />
        </ProductCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08111d",
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "700",
  },
  value: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  message: {
    color: "#0f5f8f",
    minHeight: 20,
  },
});