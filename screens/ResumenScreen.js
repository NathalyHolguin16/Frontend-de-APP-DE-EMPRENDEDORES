import { StyleSheet, Text, View } from "react-native";

import CustomButton from "../components/CustomButton";
import ProductCard from "../components/ProductCard";

const ACCENT = "#4fc3f7";

export default function ResumenScreen({ route, navigation }) {
  const params = route.params ?? {};
  const { producto, cantidad, precio, total } = params;

  if (!producto) {
    return (
      <View style={styles.container}>
        <ProductCard
          title="Resumen de compra"
          description="No hay datos para mostrar porque aún no se eligió un producto."
        >
          <Text style={styles.mensajeVacio}>
            Vuelve a la pantalla de producto para generar el resumen.
          </Text>

          <CustomButton
            title="Regresar al producto"
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        </ProductCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProductCard
        title="Resumen de compra"
        description="Revisa los datos enviados desde la pantalla anterior."
      >
        <Text style={styles.icono}>🧾</Text>
        <Text style={styles.producto}>{producto}</Text>

        <View style={styles.fila}>
          <Text style={styles.label}>Cantidad:</Text>
          <Text style={styles.valor}>{cantidad}</Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.label}>Precio unitario:</Text>
          <Text style={styles.valor}>$ {precio?.toFixed(2)}</Text>
        </View>

        <View style={styles.linea} />

        <View style={styles.filaTotal}>
          <Text style={styles.totalTexto}>Total:</Text>
          <Text style={styles.totalValor}>$ {total?.toFixed(2)}</Text>
        </View>

        <CustomButton
          title="Regresar al producto"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />

        <CustomButton
          title="Confirmar compra"
          onPress={() => navigation.navigate("Confirmacion")}
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
    fontSize: 48,
    textAlign: "center",
  },
  producto: {
    textAlign: "center",
    color: "#555",
    marginTop: 4,
    marginBottom: 22,
    fontSize: 16,
    fontWeight: "700",
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    color: "#555",
  },
  valor: {
    fontSize: 16,
    fontWeight: "bold",
  },
  linea: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },
  filaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f1f7f4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  totalTexto: {
    fontSize: 20,
    fontWeight: "bold",
  },
  totalValor: {
    fontSize: 20,
    fontWeight: "bold",
    color: ACCENT,
  },
});
