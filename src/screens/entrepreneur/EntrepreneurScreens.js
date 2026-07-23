import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Avatar,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  PrimaryButton,
  ProductCard,
  Screen,
  SectionHeader,
} from "../../components/MercattoUI";
import { useMercatto } from "../../context/MercattoContext";
import { colors, radius, shadows, spacing, typography } from "../../theme/mercattoTheme";

export function EntrepreneurDashboardScreen({ navigation }) {
  const { logout, myStore, setMode, sellerOrders, products } = useMercatto();
  const storeProducts = products.filter(
    (product) => product.businessId === myStore?.id,
  );
  const completionFields = [
    myStore?.name,
    myStore?.shortDescription,
    myStore?.phone,
    myStore?.slug,
  ];
  const completion = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100,
  );
  const stats = [
    {
      label: "Pedidos",
      value: String(sellerOrders.length),
      icon: "receipt-outline",
    },
    {
      label: "En preparación",
      value: String(
        sellerOrders.filter((order) => order.status === "En preparación")
          .length,
      ),
      icon: "time-outline",
    },
    {
      label: "Productos activos",
      value: String(storeProducts.filter((product) => product.isActive).length),
      icon: "cube-outline",
    },
    {
      label: "Stock bajo",
      value: String(
        storeProducts.filter((product) => product.stock <= 3).length,
      ),
      icon: "alert-circle-outline",
    },
  ];
  const pendingOrders = sellerOrders.filter(
    (order) => order.status === "Nuevo",
  );
  const lowStockProducts = storeProducts.filter(
    (product) => product.stock <= 3,
  );
  const handleLogout = async () => {
    await logout();
    goToLogin(navigation);
  };
  return (
    <Screen>
      <Card style={styles.heroAdmin}>
        <View style={styles.heroTop}>
          <Avatar label={myStore?.logo || "M"} size={68} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: colors.white }]}>
              {myStore?.name || "Mi emprendimiento"}
            </Text>
            <Text style={[typography.muted, { color: "#EDE6DB" }]}>
              Datos básicos completados al {completion}%
            </Text>
          </View>
          <Chip label={myStore ? "Publicado" : "Incompleto"} tone={myStore ? "#E9F7EF" : "#FCEDEA"} />
        </View>
        <View style={styles.progressDark}>
          <View style={[styles.progressOrange, { width: `${completion}%` }]} />
        </View>
        <PrimaryButton
          title="Cerrar sesión"
          icon="log-out-outline"
          variant="ghost"
          onPress={handleLogout}
        />
      </Card>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
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
          ["Revisar pedidos", "receipt-outline", "SellerOrders"],
          ["Editar mi negocio", "storefront-outline", "SellerBusiness"],
          myStore
            ? ["Ver como comprador", "eye-outline", "preview"]
            : null,
        ].filter(Boolean).map(([label, icon, route]) => (
          <Pressable
            key={label}
            style={styles.quickAction}
            onPress={() => {
              if (route === "preview") {
                setMode("buyer");
                navigation.getParent()?.replace?.("BusinessDetail", { businessId: myStore?.id });
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
        {pendingOrders.map((order) => (
          <AlertLine
            key={order.id}
            icon="notifications-outline"
            text={`El pedido ${order.id} espera confirmación.`}
          />
        ))}
        {lowStockProducts.map((product) => (
          <AlertLine
            key={product.id}
            icon="cube-outline"
            text={`${product.name} tiene ${product.stock} unidades disponibles.`}
          />
        ))}
        {!pendingOrders.length && !lowStockProducts.length ? (
          <Text style={typography.muted}>No tienes alertas pendientes.</Text>
        ) : null}
      </Card>
    </Screen>
  );
}

export function SellerOrdersScreen() {
  const {
    sellerOrders,
    updateSellerOrder,
    refreshSellerOrders,
    isSellerOrdersLoading,
    sellerOrdersError,
  } = useMercatto();
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeStatus, setActiveStatus] = useState("Todos");
  const [message, setMessage] = useState(null);
  const statuses = [
    "Todos",
    "Nuevo",
    "En preparación",
    "Enviado",
    "Entregado",
    "Cancelado",
  ];
  const filteredOrders =
    activeStatus === "Todos"
      ? sellerOrders
      : sellerOrders.filter((order) => order.status === activeStatus);

  const changeStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setMessage(null);
    try {
      await updateSellerOrder(orderId, status);
      setMessage({
        tone: "success",
        text: `Pedido actualizado a "${status}".`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error?.message || "No pudimos actualizar el pedido.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const contactBuyer = async (phone) => {
    const normalizedPhone = String(phone || "").replace(/[^\d+]/g, "");
    if (!normalizedPhone) {
      Alert.alert("Contacto no disponible", "Este pedido no tiene un teléfono registrado.");
      return;
    }

    try {
      await Linking.openURL(`tel:${normalizedPhone}`);
    } catch {
      Alert.alert("No pudimos abrir el teléfono", `Comunícate al ${phone}.`);
    }
  };

  return (
    <Screen>
      <View style={styles.ordersHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h1}>Pedidos del negocio</Text>
          <Text style={typography.muted}>
            Confirma, prepara y completa cada venta.
          </Text>
        </View>
        <IconButton
          icon="refresh-outline"
          accessibilityLabel="Actualizar pedidos del negocio"
          disabled={isSellerOrdersLoading}
          onPress={() => refreshSellerOrders().catch(() => {})}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontal}
      >
        {statuses.map((status) => {
          const count =
            status === "Todos"
              ? sellerOrders.length
              : sellerOrders.filter((order) => order.status === status).length;
          return (
            <Chip
              key={status}
              label={`${status} (${count})`}
              selected={activeStatus === status}
              onPress={() => setActiveStatus(status)}
            />
          );
        })}
      </ScrollView>

      {message ? (
        <Text
          selectable
          style={message.tone === "success" ? styles.success : styles.warning}
        >
          {message.text}
        </Text>
      ) : null}

      {isSellerOrdersLoading && !sellerOrders.length ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <Text style={typography.muted}>Actualizando pedidos...</Text>
        </Card>
      ) : null}

      {sellerOrdersError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar los pedidos"
          message={sellerOrdersError}
          action="Intentar nuevamente"
          onPress={() => refreshSellerOrders().catch(() => {})}
        />
      ) : null}

      {!sellerOrdersError && filteredOrders.map((order) => (
        <Card key={order.id}>
          <View style={styles.headerLine}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>
                Pedido #{String(order.id || "").slice(0, 8).toUpperCase()}
              </Text>
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
                <PrimaryButton title="Aceptar" disabled={updatingOrderId === order.id} onPress={() => changeStatus(order.id, "En preparación")} style={{ flex: 1 }} />
                <PrimaryButton title="Rechazar" disabled={updatingOrderId === order.id} variant="secondary" onPress={() => changeStatus(order.id, "Cancelado")} style={{ flex: 1 }} />
              </>
            ) : !["Entregado", "Cancelado"].includes(order.status) ? (
              <>
                <PrimaryButton title={`Marcar como ${nextStatus(order.status).toLowerCase()}`} disabled={updatingOrderId === order.id} onPress={() => changeStatus(order.id, nextStatus(order.status))} style={{ flex: 1 }} />
              </>
            ) : null}
            <PrimaryButton title="Contactar" variant="secondary" onPress={() => contactBuyer(order.phone)} style={{ flex: 1 }} />
          </View>
          <PrimaryButton
            title="Ver dirección"
            variant="ghost"
            onPress={() =>
              Alert.alert(
                "Dirección del pedido",
                order.address || "El pedido no requiere dirección de entrega.",
              )
            }
          />
        </Card>
      ))}

      {!isSellerOrdersLoading && !sellerOrdersError && !filteredOrders.length ? (
        <EmptyState
          icon="receipt-outline"
          title={activeStatus === "Todos" ? "Sin pedidos" : `Sin pedidos ${activeStatus.toLowerCase()}`}
          message={
            activeStatus === "Todos"
              ? "Los pedidos creados para tu tienda aparecerán aquí."
              : "No hay pedidos con este estado."
          }
        />
      ) : null}
    </Screen>
  );
}

export function SellerProductsScreen() {
  const {
    products,
    myStore,
    addSellerProduct,
    saveSellerProduct,
    removeSellerProduct,
  } = useMercatto();
  const emptyForm = { name: "", description: "", price: "", stock: "", isActive: true };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const sellerProducts = products.filter(
    (product) => product.businessId === myStore?.id && product.isBackendEntity,
  );
  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      isActive: product.isActive,
    });
  };
  const submit = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.price || !form.stock) {
      setMessage("Completa nombre, descripción, precio y stock.");
      return;
    }
    setIsSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await saveSellerProduct(editingId, form);
      } else {
        await addSellerProduct(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setMessage(
        editingId
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente.",
      );
    } catch (error) {
      setMessage(error?.message || "No pudimos guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  };
  const toggleProduct = async (product) => {
    try {
      await saveSellerProduct(product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        isActive: !product.isActive,
      });
    } catch (error) {
      setMessage(error?.message || "No pudimos cambiar la disponibilidad.");
    }
  };
  const confirmDelete = (product) => {
    Alert.alert("Eliminar producto", `¿Deseas eliminar ${product.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await removeSellerProduct(product.id);
          } catch (error) {
            setMessage(error?.message || "No pudimos eliminar el producto.");
          }
        },
      },
    ]);
  };
  return (
    <Screen>
      <View style={styles.headerLine}>
        <View>
          <Text style={typography.h1}>Productos</Text>
          <Text style={typography.muted}>
            Administra los productos publicados y su stock.
          </Text>
        </View>
        <IconButton
          icon="add"
          color={colors.white}
          style={{ backgroundColor: colors.primary }}
          onPress={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
        />
      </View>
      <Card style={styles.formCard}>
        <Text style={typography.h3}>{editingId ? "Editar producto" : "Nuevo producto"}</Text>
        <Field label="Nombre" value={form.name} onChangeText={(value) => updateForm("name", value)} />
        <Field label="Descripción" value={form.description} onChangeText={(value) => updateForm("description", value)} multiline />
        <Field label="Precio" keyboardType="decimal-pad" value={form.price} onChangeText={(value) => updateForm("price", value)} />
        <Field label="Stock" keyboardType="number-pad" value={form.stock} onChangeText={(value) => updateForm("stock", value)} />
        {message ? <Text selectable style={styles.warning}>{message}</Text> : null}
        <PrimaryButton
          title={isSaving ? "Guardando..." : editingId ? "Actualizar producto" : "Crear producto"}
          disabled={isSaving || !myStore}
          onPress={submit}
        />
      </Card>
      {sellerProducts.map((product) => (
        <Card key={product.id}>
          <ProductCard
            product={product}
            onPress={() => editProduct(product)}
            showAdd={false}
          />
          <View style={styles.tagWrap}>
            <Chip label="Editar" onPress={() => editProduct(product)} />
            <Chip label={product.isActive ? "Pausar" : "Activar"} onPress={() => toggleProduct(product)} />
            <Chip label="Eliminar" onPress={() => confirmDelete(product)} />
          </View>
          <InfoLine label="Stock" value={`${product.stock} unidades`} />
          <InfoLine label="Preparación" value={product.prepTime} />
          <InfoLine label="Variaciones" value={product.variants.join(", ")} />
          <InfoLine label="Complementos" value={product.complements.join(", ")} />
        </Card>
      ))}
      {myStore && !sellerProducts.length ? (
        <EmptyState
          icon="cube-outline"
          title="Sin productos"
          message="Crea el primer producto para publicarlo en tu catálogo."
        />
      ) : null}
      {!myStore ? <Text style={styles.warning}>Registra tu tienda antes de crear productos.</Text> : null}
    </Screen>
  );
}

export function SellerPromosScreen() {
  return (
    <Screen>
      <Text style={typography.h1}>Promociones</Text>
      <EmptyState
        icon="pricetag-outline"
        title="Sin promociones publicadas"
        message="Las promociones estarán disponibles cuando el servicio de publicación sea habilitado."
      />
    </Screen>
  );
}

export function SellerBusinessScreen({ navigation }) {
  const { logout, myStore, saveStore } = useMercatto();
  const [form, setForm] = useState({
    name: myStore?.name || "",
    description: myStore?.shortDescription || "",
    phone: myStore?.phone || "",
    slug: myStore?.slug || "",
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!myStore) return;
    setForm({
      name: myStore.name || "",
      description: myStore.shortDescription || "",
      phone: myStore.phone || "",
      slug: myStore.slug || "",
    });
  }, [myStore]);
  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setMessage("Completa el nombre y teléfono del negocio.");
      return;
    }
    setIsSaving(true);
    setMessage("");
    try {
      await saveStore(form);
      setMessage("Información guardada correctamente.");
    } catch (error) {
      setMessage(error?.message || "No pudimos guardar el negocio.");
    } finally {
      setIsSaving(false);
    }
  };
  const business = myStore;
  return (
    <Screen>
      <Text style={typography.h1}>Mi negocio</Text>
      <Text style={typography.muted}>
        Mantén actualizada la información pública de tu emprendimiento.
      </Text>
      {business ? <Card>
        {business.cover ? (
          <Image source={{ uri: business.cover }} style={styles.coverPreview} resizeMode="cover" />
        ) : (
          <View style={[styles.coverPreview, styles.coverPlaceholder]}>
            <Ionicons
              name="storefront-outline"
              size={42}
              color={colors.primaryDark}
            />
          </View>
        )}
        <View style={styles.businessInline}>
          <Avatar label={business.logo} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{business.name}</Text>
            <Text style={typography.muted}>Tienda sincronizada con Mercatto.</Text>
          </View>
        </View>
      </Card> : null}
      <Card>
        <Field label="Nombre" value={form.name} onChangeText={(value) => update("name", value)} />
        <Field label="Descripción" value={form.description} onChangeText={(value) => update("description", value)} multiline />
        <Field label="Número de contacto" value={form.phone} onChangeText={(value) => update("phone", value)} />
        <Field label="Identificador web" value={form.slug} onChangeText={(value) => update("slug", value)} />
        {message ? <Text selectable style={styles.warning}>{message}</Text> : null}
      </Card>
      {business ? <PrimaryButton title="Vista previa como comprador" icon="eye-outline" onPress={() => navigation.getParent()?.navigate("BusinessDetail", { businessId: business.id })} /> : null}
      <PrimaryButton
        title={isSaving ? "Guardando..." : business ? "Guardar cambios" : "Crear tienda"}
        variant="secondary"
        disabled={isSaving}
        onPress={submit}
      />
      <Card style={styles.logoutCard}>
        <Text style={typography.h3}>Sesión del emprendedor</Text>
        <Text style={typography.muted}>
          Sal de Mercatto cuando termines de administrar tu negocio.
        </Text>
        <PrimaryButton
          title="Cerrar sesión"
          icon="log-out-outline"
          variant="secondary"
          onPress={async () => {
            await logout();
            goToLogin(navigation);
          }}
        />
      </Card>
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
  const flow = ["Nuevo", "En preparación", "Enviado", "Entregado"];
  const index = flow.indexOf(status);
  return flow[Math.min(index + 1, flow.length - 1)] || "En preparación";
}

function goToLogin(navigation) {
  const rootNavigation = navigation.getParent?.() || navigation;
  rootNavigation.reset({
    index: 0,
    routes: [{ name: "Login" }],
  });
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
  ordersHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingCard: {
    alignItems: "center",
  },
  success: {
    color: "#22864B",
    fontWeight: "850",
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
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
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
  logoutCard: {
    borderWidth: 1,
    borderColor: "#F4C5BA",
    backgroundColor: "#FFF8F6",
  },
});
