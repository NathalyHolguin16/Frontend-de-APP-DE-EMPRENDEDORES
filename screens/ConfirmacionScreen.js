import { StyleSheet, Text, View } from "react-native";

import CustomButton from "../components/CustomButton";
import ProductCard from "../components/ProductCard";

export default function ConfirmacionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ProductCard
        title="Compra simulada exitosa"
        description="Esta pantalla confirma la navegación entre varias pantallas."
      >
        <Text style={styles.icono}>🎉</Text>
        <Text style={styles.mensaje}>
          Gracias por usar la tienda móvil. Puedes volver al inicio para repetir
          la simulación.
        </Text>

        <CustomButton
          title="Volver al inicio"
          onPress={() => navigation.navigate("Producto")}
          variant="secondary"
        />
      </ProductCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3f8",
    justifyContent: "center",
    padding: 20,
  },
  icono: {
    fontSize: 58,
    textAlign: "center",
  },
  mensaje: {
    textAlign: "center",
    color: "#555",
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 22,
  },
});
