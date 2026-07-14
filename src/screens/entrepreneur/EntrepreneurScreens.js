import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Card,
  Chip,
  Field,
  IconButton,
  PrimaryButton,
  ProductCard,
  Screen,
  SectionHeader,
} from "../../components/MercattoUI";
import {
  businesses,
  entrepreneurProfile,
  entrepreneurStats,
  products,
  promotions,
} from "../../data/mercattoData";
import { useMercatto } from "../../context/MercattoContext";
import { colors, radius, shadows, spacing, typography } from "../../theme/mercattoTheme";

export function EntrepreneurDashboardScreen({ navigation }) {
  const { setMode } = useMercatto();
  const [open, setOpen] = useState(true);
  return (
    <Screen>
      <Card style={styles.heroAdmin}>
        <View style={styles.heroTop}>
          <Avatar label="DO" size={68} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: colors.white }]}>{entrepreneurProfile.name}</Text>
            <Text style={[typography.muted, { color: "#EDE6DB" }]}>Perfil completado al {entrepreneurProfile.completion}%</Text>
          </View>
          <Chip label={open ? "Abierto" : "Pausado"} tone={open ? "#E9F7EF" : "#FCEDEA"} />
        </View>
        <View style={styles.progressDark}>
          <View style={[styles.progressOrange, { width: `${entrepreneurProfile.completion}%` }]} />
        </View>
        <PrimaryButton
          title={open ? "Pausar tienda" : "Abrir tienda"}
          icon={open ? "pause-circle-outline" : "play-circle-outline"}
          variant="secondary"
          onPress={() => setOpen((value) => !value)}
        />
      </Card>
      <View style={styles.statsGrid}>
        {entrepreneurStats.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon} size={22} color={colors.primaryDark} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>
      <SectionHeader title="Accesos rápidos" />
      <View style={styles.quickGrid}>
        {[
          ["Agregar producto", "add-circle-outline", "SellerProducts"],
          ["Crear promoción", "pricetag-outline", "SellerPromos"],
          ["Revisar pedidos", "receipt-outline", "SellerOrders"],
          ["Editar mi negocio", "storefront-outline", "SellerBusiness"],
          ["Actualizar horarios", "time-outline", "SellerBusiness"],
          ["Ver como comprador", "eye-outline", "preview"],
        ].map(([label, icon, route]) => (
          <Pressable
            key={label}
            style={styles.quickAction}
            onPress={() => {
              if (route === "preview") {
                setMode("buyer");
                navigation.getParent()?.replace?.("BusinessDetail", { businessId: "dulce-orilla" });
              } else {
                navigation.navigate(route);
              }
            }}
          >
            <Ionicons name={icon} size={24} color={colors.ink} />
            <Text style={styles.quickText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Card>
        <SectionHeader title="Alertas" />
        <AlertLine icon="notifications-outline" text="Nuevo pedido MCT-1052 esperando confirmación." />
        <AlertLine icon="cube-outline" text="Cheesecake de maracuyá tiene stock bajo." />
        <AlertLine icon="star-outline" text="Tienes una nueva reseña de 5 estrellas." />
        <AlertLine icon="pricetag-outline" text="La promo Combo dulce tarde finaliza en 48 horas." />
      </Card>
    </Screen>
  );
}

export function SellerOrdersScreen() {
  const { sellerOrders, updateSellerOrder } = useMercatto();
  const statuses = ["Nuevo", "Confirmado", "En preparación", "Listo para retirar", "Enviado", "Entregado", "Cancelado"];
  return (
    <Screen>
      <Text style={typography.h1}>Pedidos del negocio</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {statuses.map((status) => <Chip key={status} label={status} />)}
      </ScrollView>
      {sellerOrders.map((order) => (
        <Card key={order.id}>
          <View style={styles.headerLine}>
            <View>
              <Text style={typography.h3}>{order.id}</Text>
              <Text style={typography.muted}>{order.buyer} · {order.time}</Text>
            </View>
            <Chip label={order.status} tone={order.status === "Nuevo" ? colors.softOrange : "#E9F7EF"} />
          </View>
          <Text style={typography.muted}>{order.items.join(", ")}</Text>
          <InfoLine label="Contacto" value={order.phone} />
          <InfoLine label="Total" value={`$${order.total.toFixed(2)}`} />
          <InfoLine label="Pago" value={order.payment} />
          <InfoLine label="Entrega" value={`${order.deliveryMode} · ${order.address}`} />
          <View style={styles.actionWrap}>
            {order.status === "Nuevo" ? (
              <>
                <PrimaryButton title="Aceptar" onPress={() => updateSellerOrder(order.id, "Confirmado")} style={{ flex: 1 }} />
                <PrimaryButton title="Rechazar" variant="secondary" onPress={() => updateSellerOrder(order.id, "Cancelado")} style={{ flex: 1 }} />
              </>
            ) : (
              <>
                <PrimaryButton title="Cambiar estado" onPress={() => updateSellerOrder(order.id, nextStatus(order.status))} style={{ flex: 1 }} />
                <PrimaryButton title="Contactar" variant="secondary" onPress={() => Alert.alert("Contacto", `Llamando a ${order.phone}`)} style={{ flex: 1 }} />
              </>
            )}
          </View>
          <PrimaryButton title="Ver ubicación o comprobante" variant="ghost" onPress={() => Alert.alert("Comprobante", "Vista simulada para imprimir o compartir.")} />
        </Card>
      ))}
    </Screen>
  );
}

export function SellerProductsScreen() {
  const sellerProducts = products.filter((product) => product.businessId === "dulce-orilla");
  return (
    <Screen>
      <View style={styles.headerLine}>
        <View>
          <Text style={typography.h1}>Productos</Text>
          <Text style={typography.muted}>Administra catálogo, stock, variaciones y disponibilidad.</Text>
        </View>
        <IconButton icon="add" color={colors.white} style={{ backgroundColor: colors.primary }} onPress={() => Alert.alert("Agregar producto", "Formulario simulado listo para conectarse.")} />
      </View>
      {sellerProducts.map((product) => (
        <Card key={product.id}>
          <ProductCard product={product} onPress={() => null} onAdd={() => null} />
          <View style={styles.tagWrap}>
            {["Editar", "Duplicar", "Ocultar", "Pausar", "Agotado"].map((action) => (
              <Chip key={action} label={action} onPress={() => Alert.alert(action, `${action} producto en maqueta.`)} />
            ))}
          </View>
          <InfoLine label="Stock" value={product.availability === "Stock bajo" ? "3 unidades" : "18 unidades"} />
          <InfoLine label="Preparación" value={product.prepTime} />
          <InfoLine label="Variaciones" value={product.variants.join(", ")} />
          <InfoLine label="Complementos" value={product.complements.join(", ")} />
        </Card>
      ))}
      <Card>
        <Text style={typography.h3}>Control de inventario</Text>
        <Text style={typography.muted}>Alertas de stock bajo, productos agotados, límite por pedido, activación por días y pausa de catálogo.</Text>
      </Card>
    </Screen>
  );
}

export function SellerPromosScreen() {
  const sellerPromos = promotions.filter((promo) => promo.businessId === "dulce-orilla");
  return (
    <Screen>
      <View style={styles.headerLine}>
        <View>
          <Text style={typography.h1}>Promociones</Text>
          <Text style={typography.muted}>Crea descuentos, combos, cupones, 2x1 y envío gratis.</Text>
        </View>
        <IconButton icon="add" color={colors.white} style={{ backgroundColor: colors.primary }} onPress={() => Alert.alert("Crear promoción", "Formulario simulado listo.")} />
      </View>
      <Card style={styles.formCard}>
        <Text style={typography.h3}>Nueva promoción rápida</Text>
        <Field label="Nombre" placeholder="Combo familiar" value="" onChangeText={() => null} />
        <Field label="Descripción" placeholder="Describe las condiciones" value="" onChangeText={() => null} multiline />
        <View style={styles.tagWrap}>
          {["% descuento", "Precio especial", "Combo", "2x1", "Cupón", "Envío gratis"].map((item) => <Chip key={item} label={item} />)}
        </View>
        <PrimaryButton title="Guardar borrador" variant="secondary" onPress={() => Alert.alert("Borrador", "Promoción guardada en maqueta.")} />
      </Card>
      {sellerPromos.map((promo) => (
        <Card key={promo.id}>
          <Image source={{ uri: promo.image }} style={styles.promoImage} resizeMode="cover" />
          <Text style={typography.h3}>{promo.name}</Text>
          <InfoLine label="Precio normal" value={`$${promo.oldPrice.toFixed(2)}`} />
          <InfoLine label="Promocional" value={`$${promo.price.toFixed(2)} · ${promo.discount}%`} />
          <InfoLine label="Vigencia" value={promo.validity} />
          <InfoLine label="Condiciones" value={promo.conditions} />
          <View style={styles.actionWrap}>
            <PrimaryButton title="Editar" style={{ flex: 1 }} onPress={() => null} />
            <PrimaryButton title="Pausar" variant="secondary" style={{ flex: 1 }} onPress={() => null} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

export function SellerBusinessScreen({ navigation }) {
  const business = businesses[0];
  const [form, setForm] = useState({
    name: entrepreneurProfile.name,
    about: entrepreneurProfile.about,
    phone: entrepreneurProfile.phone,
    whatsapp: entrepreneurProfile.whatsapp,
    website: entrepreneurProfile.website,
    policies: entrepreneurProfile.policies,
    address: entrepreneurProfile.address,
  });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Screen>
      <Text style={typography.h1}>Mi negocio</Text>
      <Text style={typography.muted}>
        Esta plantilla editable define exactamente lo que verá el comprador en el perfil del emprendimiento.
      </Text>
      <Card>
        <Image source={{ uri: business.cover }} style={styles.coverPreview} resizeMode="cover" />
        <View style={styles.businessInline}>
          <Avatar label={business.logo} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Logo, portada y producto estrella</Text>
            <Text style={typography.muted}>Previsualizar, reemplazar, eliminar, reordenar y validar resolución.</Text>
          </View>
        </View>
      </Card>
      <Card>
        <Field label="Nombre" value={form.name} onChangeText={(value) => update("name", value)} />
        <Field label="Descripción corta" value={business.shortDescription} onChangeText={() => null} multiline />
        <Field label="Conoce más sobre nosotros" value={form.about} onChangeText={(value) => update("about", value)} multiline />
        <Field label="Categoría" value={business.category} onChangeText={() => null} />
        <Field label="Subcategoría" value={business.subcategory} onChangeText={() => null} />
        <Field label="Número de contacto" value={form.phone} onChangeText={(value) => update("phone", value)} />
        <Field label="WhatsApp" value={form.whatsapp} onChangeText={(value) => update("whatsapp", value)} />
        <Field label="Redes sociales" value={business.socials} onChangeText={() => null} />
        <Field label="Sitio web" value={form.website} onChangeText={(value) => update("website", value)} />
      </Card>
      <Card>
        <Text style={typography.h3}>Operación y entrega</Text>
        <InfoLine label="Horarios" value={business.schedule} />
        <InfoLine label="Ciudad" value={business.city} />
        <InfoLine label="Dirección" value={form.address} />
        <InfoLine label="Modalidad" value={business.modality.join(", ")} />
        <InfoLine label="Opciones de entrega" value="Delivery, retiro y punto de encuentro" />
        <InfoLine label="Costo de envío" value={`$${business.deliveryCost.toFixed(2)}`} />
        <InfoLine label="Pedido mínimo" value={`$${business.minimumOrder.toFixed(2)}`} />
        <InfoLine label="Métodos de pago" value={business.paymentMethods.join(", ")} />
        <InfoLine label="Zonas de cobertura" value="Centro, Tarqui, Los Esteros, Barbasquillo" />
      </Card>
      <Card>
        <Text style={typography.h3}>Políticas y disponibilidad</Text>
        <Field label="Políticas" value={form.policies} onChangeText={(value) => update("policies", value)} multiline />
        <Text style={typography.muted}>Incluye cierre temporal, vacaciones, feriados, pausa de pedidos y tiempo adicional por alta demanda.</Text>
      </Card>
      <PrimaryButton title="Vista previa como comprador" icon="eye-outline" onPress={() => navigation.getParent()?.navigate("BusinessDetail", { businessId: "dulce-orilla" })} />
      <PrimaryButton title="Guardar cambios" variant="secondary" onPress={() => Alert.alert("Guardado", "Información del negocio actualizada en maqueta.")} />
    </Screen>
  );
}

export function SellerSettingsScreen({ navigation }) {
  const { setMode, logout } = useMercatto();
  return (
    <Screen>
      <Text style={typography.h1}>Configuración</Text>
      <Card>
        {[
          "Datos del propietario",
          "Seguridad",
          "Métodos de pago",
          "Datos bancarios",
          "Notificaciones",
          "Términos y condiciones",
          "Políticas de privacidad",
          "Ayuda y soporte",
          "Pausar emprendimiento",
          "Eliminar emprendimiento",
        ].map((item) => (
          <Pressable key={item} style={styles.menuRow}>
            <Text style={styles.menuLabel}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>
      <PrimaryButton title="Cambiar al modo comprador" icon="swap-horizontal-outline" onPress={() => { setMode("buyer"); navigation.getParent()?.replace?.("BuyerTabs"); }} />
      <PrimaryButton title="Cerrar sesión" variant="secondary" onPress={() => { logout(); navigation.getParent()?.replace?.("Login"); }} />
    </Screen>
  );
}

function AlertLine({ icon, text }) {
  return (
    <View style={styles.alertLine}>
      <Ionicons name={icon} size={20} color={colors.primaryDark} />
      <Text style={typography.muted}>{text}</Text>
    </View>
  );
}

function InfoLine({ label, value }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Pendiente"}</Text>
    </View>
  );
}

function nextStatus(status) {
  const flow = ["Nuevo", "Confirmado", "En preparación", "Listo para retirar", "Enviado", "Entregado"];
  const index = flow.indexOf(status);
  return flow[Math.min(index + 1, flow.length - 1)] || "Confirmado";
}

const styles = StyleSheet.create({
  heroAdmin: {
    backgroundColor: colors.ink,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  progressDark: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  progressOrange: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    width: "48%",
    minHeight: 118,
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "950",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "750",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickAction: {
    width: "48%",
    minHeight: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: "center",
    ...shadows.soft,
  },
  quickText: {
    color: colors.ink,
    fontWeight: "900",
  },
  alertLine: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  horizontal: {
    gap: spacing.sm,
  },
  headerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  actionWrap: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 4,
  },
  infoLabel: {
    color: colors.muted,
    fontWeight: "750",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: colors.ink,
    fontWeight: "850",
  },
  formCard: {
    backgroundColor: colors.softOrange,
  },
  promoImage: {
    height: 170,
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: colors.softOrange,
  },
  coverPreview: {
    width: "100%",
    height: 170,
    borderRadius: radius.lg,
    backgroundColor: colors.softOrange,
  },
  businessInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuLabel: {
    flex: 1,
    color: colors.ink,
    fontWeight: "850",
  },
});
