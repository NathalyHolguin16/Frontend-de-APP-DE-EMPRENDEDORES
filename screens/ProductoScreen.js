import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import CustomButton from "../components/CustomButton";
import ProductCard from "../components/ProductCard";

const STOCK_DISPONIBLE = 5;
const PRECIO = 199.99;
const NOMBRE_PRODUCTO = "Anillo de compromiso";
const ACCENT = "#4fc3f7";

export default function ProductoScreen({ navigation }) {
  const [cantidad, setCantidad] = useState(0);

  const aumentar = () => {
    if (cantidad < STOCK_DISPONIBLE) {
      setCantidad(cantidad + 1);
    } else {
      Alert.alert("Stock agotado", "No puedes superar el stock disponible.");
    }
  };

  const disminuir = () => {
    if (cantidad > 0) {
      setCantidad(cantidad - 1);
    } else {
      Alert.alert("Cantidad mínima", "No puedes seleccionar menos de 0.");
    }
  };

  const total = cantidad * PRECIO;
  const sinStock = cantidad === STOCK_DISPONIBLE;

  const verResumen = () => {
    if (cantidad === 0) {
      Alert.alert("Sin productos", "Selecciona al menos un producto.");
      return;
    }

    navigation.navigate("Resumen", {
      producto: NOMBRE_PRODUCTO,
      cantidad,
      precio: PRECIO,
      total,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Tienda móvil</Text>
        <Text style={styles.subtitulo}>
          Interfaz avanzada con componentes reutilizables
        </Text>

        <ProductCard title={NOMBRE_PRODUCTO} description={null}>
          <Text style={styles.descripcionProducto}>
            Anillo de diamante con oro blanco de 24 quilates. Perfecto para
            compromisos y ocasiones especiales.
          </Text>
          <Text style={styles.emoji}>💍</Text>
          <Text style={styles.precio}>$ {PRECIO.toFixed(2)}</Text>
          <Text style={styles.stock}>Stock disponible: {STOCK_DISPONIBLE}</Text>
        </ProductCard>

        <View style={styles.panelCompra}>
          <Text style={styles.panelTitulo}>Seleccionar cantidad</Text>

          <View style={styles.contadorBox}>
            <CustomButton
              title="-"
              onPress={disminuir}
              variant="primary"
              compact
              style={styles.botonContador}
              textStyle={styles.textoContadorSimbolo}
            />

            <Text style={styles.cantidad}>{cantidad}</Text>

            <CustomButton
              title="+"
              onPress={aumentar}
              compact
              style={styles.botonContador}
              textStyle={styles.textoContadorSimbolo}
            />
          </View>

          {sinStock && (
            <Text style={styles.alertaStock}>
              Has seleccionado todo el stock disponible.
            </Text>
          )}

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total a pagar:</Text>
            <Text style={styles.totalValor}>$ {total.toFixed(2)}</Text>
          </View>

          <CustomButton title="Ver resumen de compra" onPress={verResumen} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef3f8",
  },
  container: {
    padding: 20,
    paddingBottom: 35,
    gap: 24,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1f2937",
    marginTop: 10,
  },
  subtitulo: {
    textAlign: "center",
    color: "#0f172a",
    marginTop: 5,
    marginBottom: 0,
  },
  panelCompra: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
    gap: 8,
  },
  panelTitulo: {
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
  },
  emoji: {
    fontSize: 52,
    textAlign: "center",
  },
  descripcionProducto: {
    color: "#0b1013",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  precio: {
    fontSize: 18,
    fontWeight: "bold",
    color: ACCENT,
    textAlign: "center",
  },
  stock: {
    marginTop: 2,
    color: "#444",
    textAlign: "center",
  },
  contadorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
  },
  botonContador: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textoContadorSimbolo: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 26,
  },
  cantidad: {
    fontSize: 30,
    fontWeight: "bold",
    marginHorizontal: 26,
  },
  alertaStock: {
    color: "#b45309",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  totalBox: {
    backgroundColor: "#edf8fe",
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValor: {
    fontSize: 18,
    fontWeight: "bold",
    color: ACCENT,
  },
});
