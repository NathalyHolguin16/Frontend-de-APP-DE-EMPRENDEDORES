import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  BusinessCard,
  BuyerHeader,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Meta,
  PrimaryButton,
  ProductCard,
  PromoCard,
  Screen,
  SearchBar,
  SectionHeader,
} from "../../components/MercattoUI";
import { banners, businesses, categories, products, promotions } from "../../data/mercattoData";
import { useMercatto } from "../../context/MercattoContext";
import { colors, radius, shadows, spacing, typography } from "../../theme/mercattoTheme";

export function BuyerHomeScreen({ navigation }) {
  const { user, selectedCity, favorites, toggleFavorite } = useMercatto();
  const [query, setQuery] = useState("");
  const filteredBusinesses = businesses.filter(
    (business) =>
      business.city === selectedCity &&
      `${business.name} ${business.category} ${business.shortDescription}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <Screen>
      <BuyerHeader navigation={navigation} title={`Hola, ${user?.firstName || "María"}`} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar emprendimientos o productos" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.banner, { backgroundColor: banner.tone }]}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerText}>{banner.subtitle}</Text>
            <PrimaryButton title="Ver ahora" variant="secondary" onPress={() => navigation.navigate("Promos")} />
          </View>
        ))}
      </ScrollView>
      <SectionHeader title="Categorías" action="Todas" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {categories.map((category) => (
          <Pressable key={category.id} style={styles.categoryTile}>
            <Ionicons name={category.icon} size={24} color={colors.primaryDark} />
            <Text style={styles.categoryText}>{category.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <SectionHeader title="Ofertas para ti" action="Promos" onPress={() => navigation.navigate("Promos")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {promotions.map((promo) => {
          const business = businesses.find((item) => item.id === promo.businessId);
          return (
            <PromoCard
              key={promo.id}
              promo={promo}
              businessName={business?.name}
              onPress={() => navigation.navigate("Promos")}
            />
          );
        })}
      </ScrollView>
      {["Emprendimientos destacados", "Cerca de ti", "Nuevos en Mercatto"].map((title, index) => (
        <View key={title} style={{ gap: spacing.md }}>
          <SectionHeader title={title} />
          {filteredBusinesses.slice(index === 2 ? 1 : 0).map((business) => (
            <BusinessCard
              key={`${title}-${business.id}`}
              business={business}
              favorite={favorites.includes(business.id)}
              onToggleFavorite={() => toggleFavorite(business.id)}
              onPress={() => navigation.navigate("BusinessDetail", { businessId: business.id })}
            />
          ))}
        </View>
      ))}
      {!filteredBusinesses.length ? (
        <EmptyState
          icon="storefront-outline"
          title="Sin emprendimientos"
          message="Aún no tenemos negocios activos en esta ciudad. Cambia de ciudad o vuelve pronto."
          action="Cambiar ciudad"
          onPress={() => navigation.navigate("CitySelect", { fromApp: true })}
        />
      ) : null}
    </Screen>
  );
}

export function BusinessDetailScreen({ route, navigation }) {
  const { favorites, toggleFavorite, addToCart } = useMercatto();
  const business = businesses.find((item) => item.id === route.params?.businessId) || businesses[0];
  const businessProducts = products.filter((product) => product.businessId === business.id);
  const deliveryOptions = ["Delivery", "Retiro en local", "Punto de encuentro"].filter((option) =>
    business.modality.join(" ").toLowerCase().includes(option.toLowerCase().split(" ")[0]),
  );
  const [deliveryMode, setDeliveryMode] = useState(deliveryOptions[0] || "Delivery");

  const quickAdd = (product) => {
    const result = addToCart(product, 1);
    if (result.conflict) {
      Alert.alert("Carrito de otro emprendimiento", "Por ahora cada carrito pertenece a un solo negocio.", [
        { text: "Conservar carrito", style: "cancel" },
        { text: "Vaciar y agregar", onPress: () => addToCart(product, 1, { replaceCart: true }) },
      ]);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: 0 }}>
      <View style={styles.coverWrap}>
        <Image source={{ uri: business.cover }} style={styles.coverImage} resizeMode="cover" />
        <View style={styles.coverActions}>
          <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <IconButton icon="share-social-outline" onPress={() => Alert.alert("Compartir", "Enlace copiado para esta maqueta.")} />
            <IconButton
              icon={favorites.includes(business.id) ? "heart" : "heart-outline"}
              color={favorites.includes(business.id) ? colors.red : colors.ink}
              onPress={() => toggleFavorite(business.id)}
            />
          </View>
        </View>
      </View>
      <Card style={styles.profileCard}>
        <View style={styles.businessTitleRow}>
          <Avatar label={business.logo} size={62} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>{business.name}</Text>
            <Text style={typography.muted}>{business.category} · {business.subcategory}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Meta icon="star" label={`${business.rating} (${business.reviews} reseñas)`} color={colors.primaryDark} />
          <Meta icon="time-outline" label={business.schedule} />
          <Meta icon="radio-button-on-outline" label={business.status} color={business.status === "Abierto" ? colors.green : colors.red} />
        </View>
        <View style={styles.tagWrap}>
          {business.modality.map((item) => <Chip key={item} label={item} tone={colors.softOrange} />)}
        </View>
        <Text style={typography.body}>{business.shortDescription}</Text>
        <Text style={typography.h3}>Conoce más sobre nosotros</Text>
        <Text style={typography.muted}>{business.about}</Text>
      </Card>
      <Card>
        <Text style={typography.h3}>Tipo de entrega</Text>
        <View style={styles.tagWrap}>
          {deliveryOptions.map((option) => (
            <Chip key={option} label={option} selected={deliveryMode === option} onPress={() => setDeliveryMode(option)} />
          ))}
        </View>
        <InfoLine label="Tiempo estimado" value={business.deliveryTime} />
        <InfoLine label="Preparación" value={business.preparationTime} />
        <InfoLine label="Costo de envío" value={`$${business.deliveryCost.toFixed(2)}`} />
        <InfoLine label="Pedido mínimo" value={`$${business.minimumOrder.toFixed(2)}`} />
        <InfoLine label="Envío gratis desde" value={`$${business.freeShippingFrom.toFixed(2)}`} />
        <InfoLine label="Dirección" value={business.address} />
      </Card>
      <SectionHeader title="Productos" />
      {businessProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
          onAdd={() => quickAdd(product)}
        />
      ))}
      <Card>
        <Text style={typography.h3}>Información y políticas</Text>
        <Text style={typography.muted}>Métodos de pago: {business.paymentMethods.join(", ")}.</Text>
        <Text style={typography.muted}>Contacto: {business.contact} · {business.socials}</Text>
        {business.policies.map((policy) => <Text key={policy} style={typography.muted}>• {policy}</Text>)}
      </Card>
    </Screen>
  );
}

export function ProductDetailScreen({ route, navigation }) {
  const { addToCart } = useMercatto();
  const product = products.find((item) => item.id === route.params?.productId) || products[0];
  const business = businesses.find((item) => item.id === product.businessId);
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(product.variants[0]);
  const [complement, setComplement] = useState(product.complements[0]);
  const [notes, setNotes] = useState("");

  const submit = () => {
    const result = addToCart(product, quantity, { variant, complement, notes });
    if (result.conflict) {
      Alert.alert("Carrito de otro emprendimiento", "¿Deseas vaciarlo y comenzar uno nuevo?", [
        { text: "No", style: "cancel" },
        { text: "Sí, vaciar", onPress: () => addToCart(product, quantity, { variant, complement, notes, replaceCart: true }) },
      ]);
      return;
    }
    navigation.navigate("Cart");
  };

  return (
    <Screen contentStyle={{ paddingTop: 0 }}>
      <Image source={{ uri: product.image }} style={styles.productHero} resizeMode="cover" />
      <View style={styles.detailBack}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
      </View>
      <Card style={{ marginTop: -24 }}>
        <Text style={typography.h2}>{product.name}</Text>
        <Text style={typography.muted}>{business?.name} · {product.category}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.bigPrice}>${product.price.toFixed(2)}</Text>
          {product.oldPrice ? <Text style={styles.oldPrice}>${product.oldPrice.toFixed(2)}</Text> : null}
          {product.discount ? <Chip label={`${product.discount}% descuento`} tone="#E9F7EF" /> : null}
        </View>
        <Text style={typography.body}>{product.fullDescription}</Text>
        <View style={styles.tagWrap}>
          {product.badges.map((badge) => <Chip key={badge} label={badge} tone={colors.softOrange} />)}
          <Chip label={product.availability} tone="#E9F7EF" />
          <Chip label={product.prepTime} />
        </View>
      </Card>
      <Card>
        <Text style={typography.h3}>Variaciones</Text>
        <View style={styles.tagWrap}>
          {product.variants.map((item) => <Chip key={item} label={item} selected={variant === item} onPress={() => setVariant(item)} />)}
        </View>
        <Text style={typography.h3}>Complementos</Text>
        <View style={styles.tagWrap}>
          {product.complements.map((item) => <Chip key={item} label={item} selected={complement === item} onPress={() => setComplement(item)} />)}
        </View>
        <Field label="Observaciones" placeholder="Ej. sin maní, dedicatoria, color preferido" multiline value={notes} onChangeText={setNotes} />
        <View style={styles.quantityRow}>
          <IconButton icon="remove" onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
          <Text style={styles.quantityText}>{quantity}</Text>
          <IconButton icon="add" onPress={() => setQuantity((value) => value + 1)} />
        </View>
        <PrimaryButton title={`Agregar al carrito · $${(product.price * quantity).toFixed(2)}`} icon="cart-outline" onPress={submit} />
      </Card>
    </Screen>
  );
}

export function CartScreen({ navigation }) {
  const {
    cart,
    cartBusiness,
    cartSubtotal,
    cartDelivery,
    cartDiscount,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    setCartMeta,
    clearCart,
  } = useMercatto();

  if (!cart.items.length) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Carrito vacío"
          message="Agrega productos de un emprendimiento para preparar tu pedido."
          action="Explorar emprendimientos"
          onPress={() => navigation.navigate("BuyerTabs")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerLine}>
        <View>
          <Text style={typography.h1}>Carrito</Text>
          <Text style={typography.muted}>{cartBusiness?.name}</Text>
        </View>
        <IconButton icon="trash-outline" color={colors.red} onPress={clearCart} />
      </View>
      {cart.items.map((item) => (
        <Card key={item.product.id}>
          <View style={styles.cartItem}>
            <Image source={{ uri: item.product.image }} style={styles.cartImage} resizeMode="cover" />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <Text style={typography.muted}>{item.variant} · {item.complement}</Text>
              {item.notes ? <Text style={typography.muted}>Obs: {item.notes}</Text> : null}
              <Text style={styles.price}>${item.product.price.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.quantityRow}>
            <IconButton icon="remove" onPress={() => updateCartQuantity(item.product.id, -1)} />
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <IconButton icon="add" onPress={() => updateCartQuantity(item.product.id, 1)} />
            <PrimaryButton title="Eliminar" variant="ghost" onPress={() => removeFromCart(item.product.id)} />
          </View>
        </Card>
      ))}
      <Card>
        <Text style={typography.h3}>Entrega y pago</Text>
        <View style={styles.tagWrap}>
          {["Delivery", "Retiro en local", "Punto de encuentro"].map((mode) => (
            <Chip key={mode} label={mode} selected={cart.deliveryMode === mode} onPress={() => setCartMeta({ deliveryMode: mode })} />
          ))}
        </View>
        <View style={styles.tagWrap}>
          {["Efectivo", "Transferencia", "Pago al retirar"].map((method) => (
            <Chip key={method} label={method} selected={cart.paymentMethod === method} onPress={() => setCartMeta({ paymentMethod: method })} />
          ))}
        </View>
        <Field label="Cupón" placeholder="Prueba MERCATTO10" value={cart.coupon} onChangeText={(value) => setCartMeta({ coupon: value })} />
      </Card>
      <OrderSummary subtotal={cartSubtotal} delivery={cartDelivery} discount={cartDiscount} total={cartTotal} />
      <PrimaryButton title="Confirmar pedido" icon="checkmark-circle-outline" onPress={() => navigation.navigate("Checkout")} />
    </Screen>
  );
}

export function CheckoutScreen({ navigation }) {
  const { cartBusiness, deliveryAddress, cart, cartSubtotal, cartDelivery, cartDiscount, cartTotal, confirmOrder } = useMercatto();
  const submit = () => {
    const order = confirmOrder();
    navigation.replace("OrderConfirmation", { orderId: order.id });
  };
  return (
    <Screen>
      <Text style={typography.h1}>Resumen del pedido</Text>
      <Card>
        <InfoLine label="Emprendimiento" value={cartBusiness?.name} />
        <InfoLine label="Dirección" value={deliveryAddress} />
        <InfoLine label="Modalidad" value={cart.deliveryMode} />
        <InfoLine label="Método de pago" value={cart.paymentMethod} />
        <InfoLine label="Tiempo estimado" value={cartBusiness?.deliveryTime} />
      </Card>
      <OrderSummary subtotal={cartSubtotal} delivery={cartDelivery} discount={cartDiscount} total={cartTotal} />
      <PrimaryButton title="Enviar pedido" icon="send-outline" onPress={submit} />
      <PrimaryButton title="Volver al carrito" variant="secondary" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

export function OrderConfirmationScreen({ route, navigation }) {
  return (
    <Screen>
      <EmptyState
        icon="checkmark-circle-outline"
        title="Pedido confirmado"
        message={`Tu pedido ${route.params?.orderId || ""} fue enviado al emprendimiento y aparecerá en Pedidos.`}
        action="Ver mis pedidos"
        onPress={() => navigation.replace("BuyerTabs", { screen: "Pedidos" })}
      />
    </Screen>
  );
}

export function PromosScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const promoList = promotions.filter((promo) => {
    const business = businesses.find((item) => item.id === promo.businessId);
    return (
      (category === "Todas" || promo.category === category) &&
      `${promo.name} ${business?.name}`.toLowerCase().includes(query.toLowerCase())
    );
  });
  return (
    <Screen>
      <Text style={typography.h1}>Promos</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar promociones" />
      <View style={styles.tagWrap}>
        {["Todas", "Postres", "Artesanías", "Ropa", "Envío gratis"].map((item) => (
          <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
        ))}
      </View>
      <SectionHeader title="Promociones destacadas" />
      {promoList.map((promo) => {
        const business = businesses.find((item) => item.id === promo.businessId);
        return (
          <Card key={promo.id}>
            <Image source={{ uri: promo.image }} style={styles.promoWideImage} resizeMode="cover" />
            <Text style={typography.h3}>{promo.name}</Text>
            <Text style={typography.muted}>{business?.name} · {promo.category}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.oldPrice}>${promo.oldPrice.toFixed(2)}</Text>
              <Text style={styles.bigPrice}>${promo.price.toFixed(2)}</Text>
              <Chip label={`${promo.discount}% OFF`} tone="#E9F7EF" />
            </View>
            <Text style={typography.muted}>Vigencia: {promo.validity}. {promo.conditions}</Text>
            <PrimaryButton title="Ver o comprar" onPress={() => navigation.navigate("BusinessDetail", { businessId: promo.businessId })} />
          </Card>
        );
      })}
      {!promoList.length ? <EmptyState icon="pricetag-outline" title="Sin promociones" message="No encontramos promociones con esos filtros." /> : null}
    </Screen>
  );
}

export function BuyerOrdersScreen({ navigation }) {
  const { orders } = useMercatto();
  const groups = {
    "En curso": orders.filter((order) => !["Entregado", "Cancelado"].includes(order.status)),
    Completados: orders.filter((order) => order.status === "Entregado"),
    Cancelados: orders.filter((order) => order.status === "Cancelado"),
  };
  return (
    <Screen>
      <Text style={typography.h1}>Pedidos</Text>
      {Object.entries(groups).map(([title, list]) => (
        <View key={title} style={{ gap: spacing.md }}>
          <SectionHeader title={title} />
          {list.length ? list.map((order) => <BuyerOrderCard key={order.id} order={order} navigation={navigation} />) : <EmptyState title={`Sin pedidos ${title.toLowerCase()}`} message="Cuando tengas movimientos aparecerán aquí." />}
        </View>
      ))}
    </Screen>
  );
}

function BuyerOrderCard({ order, navigation }) {
  return (
    <Card>
      <View style={styles.headerLine}>
        <View>
          <Text style={typography.h3}>{order.id}</Text>
          <Text style={typography.muted}>{order.businessName} · {order.date}</Text>
        </View>
        <Chip label={order.status} tone={order.status === "Cancelado" ? "#FCEDEA" : colors.softOrange} />
      </View>
      <Text style={typography.muted}>{order.items.join(", ")}</Text>
      <InfoLine label="Total" value={`$${order.total.toFixed(2)}`} />
      <InfoLine label="Modalidad" value={order.deliveryMode} />
      <InfoLine label="Tiempo" value={order.eta} />
      <View style={styles.navRow}>
        <PrimaryButton title="Ver detalle" variant="secondary" onPress={() => navigation.navigate("StateScreen", { type: "receipt" })} style={{ flex: 1 }} />
        {order.status === "Entregado" ? <PrimaryButton title="Calificar" onPress={() => navigation.navigate("StateScreen", { type: "reviews" })} style={{ flex: 1 }} /> : null}
      </View>
    </Card>
  );
}

export function BuyerProfileScreen({ navigation }) {
  const { user, selectedCity, deliveryAddress, logout, setMode } = useMercatto();
  const handleLogout = () => {
    logout();
    goToLogin(navigation);
  };
  const items = [
    ["create-outline", "Editar información", "profile-edit"],
    ["location-outline", "Administrar direcciones", "address"],
    ["heart-outline", "Ver favoritos", "favorites"],
    ["lock-closed-outline", "Cambiar contraseña", "password"],
    ["notifications-outline", "Configurar notificaciones", "notifications"],
    ["card-outline", "Administrar métodos de pago", "payments"],
    ["document-text-outline", "Términos y condiciones", "terms"],
    ["shield-checkmark-outline", "Políticas de privacidad", "privacy"],
    ["help-circle-outline", "Ayuda y soporte", "support"],
  ];
  return (
    <Screen>
      <Card>
        <View style={styles.profileRow}>
          <Avatar label={user?.photo || "MZ"} size={76} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>{user?.name || "María Zambrano"}</Text>
            <Text style={typography.muted}>{user?.email}</Text>
            <Text style={typography.muted}>{user?.phone}</Text>
          </View>
        </View>
        <InfoLine label="Cédula" value={user?.idNumber} />
        <InfoLine label="Fecha de nacimiento" value={user?.birthDate} />
        <InfoLine label="Género" value={user?.gender} />
        <InfoLine label="Dirección principal" value={deliveryAddress} />
        <InfoLine label="Ciudad seleccionada" value={selectedCity} />
      </Card>
      <Card>
        {items.map(([icon, label, type]) => (
          <MenuRow key={label} icon={icon} label={label} onPress={() => navigation.navigate(type === "favorites" ? "Favorites" : type === "address" ? "Address" : "StateScreen", { type })} />
        ))}
        <MenuRow
          icon="storefront-outline"
          label="Crear perfil de emprendedor"
          onPress={() => navigation.navigate("EntrepreneurRegister")}
        />
        <MenuRow
          icon="swap-horizontal-outline"
          label="Cambiar a modo emprendedor"
          onPress={() => {
            setMode("entrepreneur");
            navigation.getParent()?.replace?.("EntrepreneurTabs");
          }}
        />
      </Card>
      <Card style={styles.logoutCard}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>¿Terminaste por ahora?</Text>
          <Text style={typography.muted}>
            Cierra sesión para proteger tu cuenta y tus pedidos.
          </Text>
        </View>
        <PrimaryButton
          title="Cerrar sesión"
          icon="log-out-outline"
          variant="secondary"
          onPress={handleLogout}
        />
      </Card>
    </Screen>
  );
}

export function FavoritesScreen({ navigation }) {
  const { favorites, toggleFavorite } = useMercatto();
  const list = businesses.filter((business) => favorites.includes(business.id));
  return (
    <Screen>
      <Text style={typography.h1}>Favoritos</Text>
      {list.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          favorite
          onToggleFavorite={() => toggleFavorite(business.id)}
          onPress={() => navigation.navigate("BusinessDetail", { businessId: business.id })}
        />
      ))}
      {!list.length ? <EmptyState icon="heart-outline" title="Sin favoritos" message="Guarda emprendimientos para encontrarlos rápido." /> : null}
    </Screen>
  );
}

export function AddressScreen({ navigation }) {
  const { deliveryAddress, setDeliveryAddress } = useMercatto();
  const [address, setAddress] = useState(deliveryAddress);
  const [sector, setSector] = useState("Centro");
  const [reference, setReference] = useState("Casa color blanco, portón negro");
  return (
    <Screen>
      <Text style={typography.h1}>Dirección de entrega</Text>
      <Card>
        <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Calle principal y secundaria" />
        <Field label="Sector" value={sector} onChangeText={setSector} placeholder="Sector o barrio" />
        <Field label="Referencia" value={reference} onChangeText={setReference} placeholder="Referencia visible para entrega" multiline />
        <Card style={{ backgroundColor: colors.softOrange }}>
          <Text style={typography.h3}>Ubicación en mapa</Text>
          <Text style={typography.muted}>Mapa simulado. Más adelante se conectará con geolocalización.</Text>
        </Card>
        <PrimaryButton title="Guardar dirección" onPress={() => { setDeliveryAddress(address); navigation.goBack(); }} />
      </Card>
    </Screen>
  );
}

export function StateScreen({ route, navigation }) {
  const map = {
    notifications: ["notifications-outline", "Notificaciones", "Nuevo pedido, reseñas, cambios de estado y avisos administrativos aparecerán aquí."],
    support: ["help-buoy-outline", "Centro de ayuda", "Encuentra soporte para pedidos, pagos, entregas, cuenta y emprendimientos."],
    payments: ["card-outline", "Métodos de pago", "Tarjetas, transferencias, billeteras digitales y pago contra entrega."],
    terms: ["document-text-outline", "Términos y condiciones", "Documento legal simulado preparado para conectarse a contenido real."],
    privacy: ["shield-checkmark-outline", "Políticas de privacidad", "Gestión responsable de datos personales y seguridad de cuenta."],
    reviews: ["star-outline", "Calificaciones y reseñas", "Solo compradores con pedidos completados podrán calificar."],
    receipt: ["receipt-outline", "Comprobante", "Comprobante visual del pedido, listo para compartir o imprimir más adelante."],
    password: ["lock-closed-outline", "Cambiar contraseña", "Pantalla lista para conectar con verificación de seguridad."],
    "profile-edit": ["create-outline", "Editar información", "Actualiza nombres, celular, correo, cédula y datos personales."],
  };
  const [icon, title, message] = map[route.params?.type] || ["construct-outline", "Estado adicional", "Pantalla preparada para crecer."];
  return (
    <Screen>
      <EmptyState icon={icon} title={title} message={message} action="Volver" onPress={() => navigation.goBack()} />
      <Card>
        <Text style={typography.h3}>Estados contemplados</Text>
        <Text style={typography.muted}>Error de conexión, sin ubicación, permiso de ubicación, skeleton screens, cuenta en revisión, emprendimiento aprobado o rechazado, perfil incompleto y contenido vacío.</Text>
      </Card>
    </Screen>
  );
}

function OrderSummary({ subtotal, delivery, discount, total }) {
  return (
    <Card>
      <Text style={typography.h3}>Totales</Text>
      <InfoLine label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
      <InfoLine label="Costo de envío" value={`$${delivery.toFixed(2)}`} />
      <InfoLine label="Descuento" value={`-$${discount.toFixed(2)}`} />
      <View style={styles.totalLine}>
        <Text style={styles.totalLabel}>Total final</Text>
        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
      </View>
    </Card>
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

function MenuRow({ icon, label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Ionicons name={icon} size={21} color={danger ? colors.red : colors.primaryDark} />
      <Text style={[styles.menuLabel, danger && { color: colors.red }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function goToLogin(navigation) {
  const rootNavigation = navigation.getParent?.() || navigation;
  rootNavigation.reset({
    index: 0,
    routes: [{ name: "Login" }],
  });
}

const styles = StyleSheet.create({
  horizontal: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  banner: {
    width: 280,
    minHeight: 150,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: "space-between",
    ...shadows.card,
  },
  bannerTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "950",
  },
  bannerText: {
    color: colors.muted,
    lineHeight: 20,
  },
  categoryTile: {
    width: 92,
    minHeight: 92,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: spacing.sm,
    ...shadows.soft,
  },
  categoryText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "850",
    textAlign: "center",
  },
  coverWrap: {
    height: 240,
    marginHorizontal: -spacing.md,
    marginBottom: -52,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.softOrange,
  },
  coverActions: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileCard: {
    marginTop: 0,
  },
  businessTitleRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  bigPrice: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "950",
  },
  oldPrice: {
    color: colors.muted,
    textDecorationLine: "line-through",
    fontWeight: "800",
  },
  productHero: {
    height: 310,
    width: "100%",
    marginHorizontal: -spacing.md,
    backgroundColor: colors.softOrange,
  },
  detailBack: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  quantityText: {
    minWidth: 42,
    textAlign: "center",
    color: colors.ink,
    fontSize: 24,
    fontWeight: "950",
    fontVariant: ["tabular-nums"],
  },
  headerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cartImage: {
    width: 86,
    height: 86,
    borderRadius: radius.md,
    backgroundColor: colors.softOrange,
  },
  productName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "950",
  },
  price: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "950",
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  totalLabel: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "950",
  },
  totalValue: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: "950",
  },
  promoWideImage: {
    width: "100%",
    height: 170,
    borderRadius: radius.lg,
    backgroundColor: colors.softOrange,
  },
  profileRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  menuRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
