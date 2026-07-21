import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import AddressMap from "../../components/address-map";
import BirthDateField from "../../components/birth-date-field";
import GenderSelector from "../../components/gender-selector";
import {
  Avatar,
  BusinessCard,
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
import { cities, products as showcaseProducts, promotions } from "../../data/mercattoData";
import { useMercatto } from "../../context/MercattoContext";
import { colors, radius, shadows, spacing, typography } from "../../theme/mercattoTheme";

const categoryShowcase = [
  {
    label: "Comida",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Postres",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Artesanías",
    image: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Moda",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Regalos",
    image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Hogar",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80",
  },
];

const cityCoordinates = {
  Manta: { latitude: -0.9677, longitude: -80.7089 },
  Portoviejo: { latitude: -1.0546, longitude: -80.4545 },
  Guayaquil: { latitude: -2.171, longitude: -79.9224 },
  Quito: { latitude: -0.1807, longitude: -78.4678 },
  Cuenca: { latitude: -2.9001, longitude: -79.0059 },
  Loja: { latitude: -3.9931, longitude: -79.2042 },
  Ambato: { latitude: -1.2491, longitude: -78.6168 },
  "Santo Domingo": { latitude: -0.253, longitude: -79.1754 },
};

const cityProvinces = {
  Manta: "Manabí",
  Portoviejo: "Manabí",
  Guayaquil: "Guayas",
  Quito: "Pichincha",
  Cuenca: "Azuay",
  Loja: "Loja",
  Ambato: "Tungurahua",
  "Santo Domingo": "Santo Domingo de los Tsáchilas",
};

function matchMercattoCity(place) {
  const placeNames = [place.city, place.district, place.subregion, place.region]
    .filter(Boolean)
    .map((value) =>
      value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
    );

  return cities.find((city) => {
    const normalizedCity = city
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return placeNames.some(
      (placeName) => placeName.includes(normalizedCity) || normalizedCity.includes(placeName),
    );
  });
}

function getEditableProfileNames(user) {
  const explicitFirstName = String(user?.firstName || user?.names || "").trim();
  const explicitLastName = String(user?.lastName || user?.lastNames || "").trim();
  const fullName = String(user?.name || "").trim();
  const isGenericName = ["usuario mercatto", "nuevo usuario"].includes(
    fullName.toLowerCase(),
  );
  const [nameFromFullName = "", ...lastNameParts] = isGenericName
    ? []
    : fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: explicitFirstName || nameFromFullName,
    lastName: explicitLastName || lastNameParts.join(" "),
  };
}

export function BuyerHomeScreen({ navigation }) {
  const { businesses, catalogSource, user, selectedCity, deliveryAddress, cart, favorites, toggleFavorite } = useMercatto();
  const [query, setQuery] = useState("");
  const visiblePromotions = catalogSource === "demo" ? promotions : [];
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const filteredBusinesses = businesses.filter(
    (business) =>
      (!business.city || business.city === selectedCity) &&
      `${business.name} ${business.category} ${business.shortDescription}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <Screen style={styles.homeSafe} contentStyle={styles.homeContent}>
      <View style={styles.homeTop}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => navigation.navigate("CitySelect", { fromApp: true })} style={styles.brandMark}>
            <Text style={styles.brandText}>MERCATTO</Text>
            <Ionicons name="chevron-down" size={16} color={colors.white} />
          </Pressable>
          <View style={styles.headerActions}>
            <IconButton
              icon="notifications-outline"
              color={colors.white}
              onPress={() => navigation.navigate("StateScreen", { type: "notifications" })}
              style={styles.transparentIcon}
            />
            <IconButton
              icon="cart-outline"
              badge={cartCount || null}
              color={colors.white}
              onPress={() => navigation.navigate("Cart")}
              style={styles.transparentIcon}
            />
          </View>
        </View>

        <View style={styles.locationBlock}>
          <Text style={styles.helloText}>Hola, {user?.firstName || "Usuario"}</Text>
          <Pressable onPress={() => navigation.navigate("Address")} style={styles.locationPill}>
            <Ionicons name="location-outline" size={17} color={colors.ink} />
            <Text numberOfLines={1} style={styles.locationText}>
              {deliveryAddress ? `${selectedCity} · ${deliveryAddress}` : "Configura tu dirección"}
            </Text>
            <Text style={styles.locationAction}>Cambiar</Text>
          </Pressable>
        </View>
      </View>

      <HeroDealCard navigation={navigation} />

      <View style={styles.floatingSearch}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar emprendimientos o productos" />
      </View>

      <SectionHeader title="Categorías" action="Todas" />
      <View style={styles.featureGrid}>
        {categoryShowcase.slice(0, 2).map((category) => (
          <VisualCategoryCard key={category.label} category={category} large />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {categoryShowcase.slice(2).map((category) => (
          <VisualCategoryCard key={category.label} category={category} />
        ))}
      </ScrollView>

      {visiblePromotions.length ? <SectionHeader title="Promos exclusivas" action="Ver promos" onPress={() => navigation.navigate("Promos")} /> : null}
      {visiblePromotions.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {visiblePromotions.map((promo) => {
          const business = businesses.find((item) => item.id === promo.businessId);
          return (
            <FeaturePromoCard
              key={promo.id}
              promo={promo}
              businessName={business?.name}
              onPress={() => navigation.navigate("BusinessDetail", { businessId: promo.businessId })}
            />
          );
        })}
      </ScrollView> : null}

      {visiblePromotions.length ? <SectionHeader title="Más ofertas para ti" action="Promos" onPress={() => navigation.navigate("Promos")} /> : null}
      {visiblePromotions.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {visiblePromotions.map((promo) => {
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
      </ScrollView> : null}
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

function HeroDealCard({ navigation }) {
  return (
    <Pressable onPress={() => navigation.navigate("Promos")} style={({ pressed }) => [styles.heroDeal, pressed && styles.pressed]}>
      <View style={styles.heroCopy}>
        <Text style={styles.plusPill}>mercatto plus</Text>
        <Text style={styles.heroEyebrow}>Compra local con beneficios</Text>
        <Text style={styles.heroTitle}>Envíos gratis para comprar local</Text>
        <Text style={styles.heroBadge}>Primer pedido con 20% OFF</Text>
      </View>
      <View style={styles.heroArt}>
        <View style={styles.heroDarkShape}>
          <Text style={styles.heroPlusOne}>+</Text>
          <Text style={styles.heroPlusTwo}>+</Text>
          <Text style={styles.heroPlusThree}>+</Text>
        </View>
        <Image source={{ uri: showcaseProducts[0].image }} style={[styles.heroProduct, styles.heroProductMain]} resizeMode="cover" />
        <Image source={{ uri: showcaseProducts[2].image }} style={[styles.heroProduct, styles.heroProductSmall]} resizeMode="cover" />
        <Image source={{ uri: showcaseProducts[3].image }} style={[styles.heroProduct, styles.heroProductTiny]} resizeMode="cover" />
      </View>
      <View style={styles.heroPager} />
    </Pressable>
  );
}

function VisualCategoryCard({ category, large = false }) {
  return (
    <Pressable style={({ pressed }) => [styles.visualCategory, large && styles.visualCategoryLarge, pressed && styles.pressed]}>
      <View style={styles.confettiOne} />
      <View style={styles.confettiTwo} />
      <View style={styles.confettiThree} />
      <Image source={{ uri: category.image }} style={[styles.visualCategoryImage, large && styles.visualCategoryImageLarge]} resizeMode="cover" />
      <Text style={[styles.visualCategoryText, large && styles.visualCategoryTextLarge]}>{category.label}</Text>
    </Pressable>
  );
}

function FeaturePromoCard({ promo, businessName, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featurePromo, pressed && styles.pressed]}>
      <View style={styles.featurePromoCopy}>
        <Text style={styles.featurePromoKicker}>Exclusivo para ti</Text>
        <Text style={styles.featurePromoTitle}>Hasta {promo.discount}% OFF</Text>
        <Text style={styles.featurePromoText}>en {businessName}</Text>
      </View>
      <Image source={{ uri: promo.image }} style={styles.featurePromoImage} resizeMode="cover" />
      <View style={styles.featurePromoLogo}>
        <Text style={styles.featurePromoLogoText}>M</Text>
      </View>
    </Pressable>
  );
}

export function BusinessDetailScreen({ route, navigation }) {
  const { businesses, products, favorites, toggleFavorite, addToCart } = useMercatto();
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
  const { addToCart, businesses, products } = useMercatto();
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
  const { user, cartBusiness, deliveryAddress, cart, cartSubtotal, cartDelivery, cartDiscount, cartTotal, confirmOrder } = useMercatto();
  const [customerPhone, setCustomerPhone] = useState(user?.phone === "Pendiente" ? "" : user?.phone || "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    if (!deliveryAddress) {
      setMessage("Configura una dirección de entrega antes de enviar el pedido.");
      return;
    }
    if (!customerPhone.trim()) {
      setMessage("Ingresa un número de contacto para el pedido.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const order = await confirmOrder({ customerPhone });
      navigation.replace("OrderConfirmation", { orderId: order.id });
    } catch (error) {
      setMessage(error?.message || "No pudimos enviar el pedido. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
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
        <Field
          label="Teléfono de contacto"
          placeholder="0991234567"
          keyboardType="phone-pad"
          value={customerPhone}
          onChangeText={setCustomerPhone}
        />
      </Card>
      <OrderSummary subtotal={cartSubtotal} delivery={cartDelivery} discount={cartDiscount} total={cartTotal} />
      {message ? <Text selectable style={styles.addressMessage}>{message}</Text> : null}
      <PrimaryButton
        title={isSubmitting ? "Enviando pedido..." : "Enviar pedido"}
        icon="send-outline"
        onPress={submit}
        disabled={isSubmitting}
      />
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
  const { businesses, catalogSource } = useMercatto();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const promoList = (catalogSource === "demo" ? promotions : []).filter((promo) => {
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
            <Text style={typography.h2}>{user?.name || "Usuario Mercatto"}</Text>
            <Text style={typography.muted}>{user?.email}</Text>
            <Text style={typography.muted}>{user?.phone}</Text>
          </View>
        </View>
        <InfoLine label="Cédula" value={user?.idNumber} />
        <InfoLine label="Fecha de nacimiento" value={user?.birthDate} />
        <InfoLine label="Género" value={user?.gender} />
        <InfoLine label="Dirección principal" value={deliveryAddress || "Sin configurar"} />
        <InfoLine label="Ciudad seleccionada" value={selectedCity} />
      </Card>
      <Card>
        {items.map(([icon, label, type]) => (
          <MenuRow key={label} icon={icon} label={label} onPress={() => navigation.navigate(type === "favorites" ? "Favorites" : type === "address" ? "Address" : type === "profile-edit" ? "EditProfile" : "StateScreen", { type })} />
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
  const { businesses, favorites, toggleFavorite } = useMercatto();
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
  const { deliveryAddress, saveDeliveryAddress, selectedCity, updateUserProfile, user } = useMercatto();
  const [address, setAddress] = useState(deliveryAddress);
  const [city, setCity] = useState(selectedCity);
  const [detectedSector, setDetectedSector] = useState(user?.addressSector || "");
  const [reference, setReference] = useState(user?.addressReference || "");
  const [message, setMessage] = useState("");
  const [coordinates, setCoordinates] = useState(
    user?.addressCoordinates || cityCoordinates[selectedCity] || cityCoordinates.Manta,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(Boolean(deliveryAddress));

  const selectCity = (nextCity) => {
    if (nextCity === city) return;

    setCity(nextCity);
    setCoordinates(cityCoordinates[nextCity] || cityCoordinates.Manta);
    setAddress("");
    setDetectedSector("");
    setReference("");
    setLocationConfirmed(false);
    setMessage(`Busca una dirección o mueve el mapa dentro de ${nextCity}.`);
  };

  const applyGeocodedAddress = (place, fallbackCity = city) => {
    const detectedCity = matchMercattoCity(place) || fallbackCity;
    const streetAddress = [place.street || place.name, place.streetNumber]
      .filter(Boolean)
      .join(" ");

    setCity(detectedCity);
    setAddress(streetAddress || place.formattedAddress || "");
    setDetectedSector(place.district || place.subregion || "");
    setLocationConfirmed(true);
    setMessage(`Punto de entrega ubicado en ${detectedCity}.`);
  };

  const resolveMapPoint = async (nextCoordinates) => {
    setCoordinates(nextCoordinates);
    setIsLocating(true);

    try {
      const [place] = await Location.reverseGeocodeAsync(nextCoordinates);
      if (place) {
        applyGeocodedAddress(place);
      } else {
        setLocationConfirmed(false);
        setMessage("No pudimos reconocer esa dirección. Prueba con otro punto cercano.");
      }
    } catch {
      setLocationConfirmed(false);
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
        setMessage("Activa el permiso de ubicación para usar tu posición actual.");
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
      setMessage("No pudimos obtener tu ubicación. Puedes buscar la dirección manualmente.");
    } finally {
      setIsLocating(false);
    }
  };

  const searchAddress = async () => {
    if (!address.trim()) {
      setMessage("Escribe una calle o dirección para buscarla en el mapa.");
      return;
    }

    setIsLocating(true);
    setMessage("Buscando la dirección...");

    try {
      if (process.env.EXPO_OS === "android") {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setMessage("Android necesita el permiso de ubicación para buscar direcciones.");
          return;
        }
      }

      const results = await Location.geocodeAsync(`${address.trim()}, ${city}, Ecuador`);
      if (!results.length) {
        setLocationConfirmed(false);
        setMessage("No encontramos esa dirección. Revisa la calle y la ciudad.");
        return;
      }

      const nextCoordinates = {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
      setCoordinates(nextCoordinates);
      setLocationConfirmed(true);
      setMessage(`Dirección encontrada en ${city}. Ajusta el pin si hace falta.`);
    } catch {
      setLocationConfirmed(false);
      setMessage("No pudimos buscar la dirección ahora. Intenta nuevamente.");
    } finally {
      setIsLocating(false);
    }
  };

  const saveAddress = async () => {
    if (!address.trim()) {
      setMessage("Selecciona o busca una dirección antes de guardar.");
      return;
    }

    if (!locationConfirmed) {
      setMessage("Busca la dirección o confirma el punto en el mapa antes de guardar.");
      return;
    }

    const localAddress = {
      city,
      address: address.trim(),
      addressSector: detectedSector.trim(),
      addressReference: reference.trim(),
      addressCoordinates: coordinates,
    };

    setIsSaving(true);
    setMessage("Guardando la dirección en Mercatto...");
    try {
      await saveDeliveryAddress({
        apiPayload: {
          alias: "Dirección principal",
          province: cityProvinces[city] || city,
          city,
          street_main: address.trim(),
          street_secondary: null,
          reference: reference.trim() || "Sin referencia",
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          is_default: true,
        },
        localAddress,
      });
      navigation.goBack();
    } catch (error) {
      if (!error?.status || error.status >= 500) {
        updateUserProfile({ ...localAddress, addressSyncStatus: "pending" });
        setMessage("Dirección guardada temporalmente. La sincronización con el servidor quedó pendiente.");
        Alert.alert(
          "Dirección guardada temporalmente",
          "Mercatto no pudo sincronizarla con el servidor. Podrás usarla durante esta sesión.",
          [{ text: "Entendido", onPress: () => navigation.goBack() }],
        );
        return;
      }

      setMessage(
        error.status === 401
          ? "Tu sesión venció. Inicia sesión nuevamente para guardar la dirección."
          : error.status === 422
            ? error.message || "Revisa los datos de la dirección e intenta nuevamente."
            : "No pudimos guardar la dirección. Intenta nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.h1}>Dirección de entrega</Text>
      <Card>
        <Field
          label="Buscar dirección"
          value={address}
          onChangeText={(value) => {
            setAddress(value);
            setLocationConfirmed(false);
          }}
          placeholder="Calle, avenida o lugar"
        />
        <View style={styles.addressActions}>
          <PrimaryButton
            title="Buscar en mapa"
            icon="search-outline"
            variant="secondary"
            onPress={searchAddress}
            disabled={isLocating}
            style={styles.addressActionButton}
          />
          <PrimaryButton
            title="Usar mi ubicación"
            icon="locate-outline"
            variant="secondary"
            onPress={useCurrentLocation}
            disabled={isLocating}
            style={styles.addressActionButton}
          />
        </View>
        <View style={styles.mapHeader}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Confirma el punto de entrega</Text>
            <Text style={typography.muted}>Mueve el mapa hasta dejar el pin sobre la entrada.</Text>
          </View>
          {isLocating ? <ActivityIndicator color={colors.primaryDark} /> : null}
        </View>
        <AddressMap coordinates={coordinates} onCoordinateChange={resolveMapPoint} />
        <Text style={typography.h3}>Ciudad detectada</Text>
        <View style={styles.tagWrap}>
          {cities.slice(0, 8).map((item) => (
            <Chip key={item} label={item} selected={city === item} onPress={() => selectCity(item)} />
          ))}
        </View>
        <Field label="Referencia (opcional)" value={reference} onChangeText={setReference} placeholder="Casa, edificio o punto visible" multiline />
        {message ? <Text selectable style={styles.addressMessage}>{message}</Text> : null}
        <PrimaryButton
          title={isSaving ? "Guardando dirección..." : "Confirmar dirección"}
          icon="checkmark-circle-outline"
          onPress={saveAddress}
          disabled={isLocating || isSaving}
        />
      </Card>
    </Screen>
  );
}

export function EditProfileScreen({ navigation }) {
  const { user, selectedCity, deliveryAddress, updateUserProfile } = useMercatto();
  const initialNames = getEditableProfileNames(user);
  const [form, setForm] = useState({
    firstName: initialNames.firstName,
    lastName: initialNames.lastName,
    email: user?.email || "",
    phone: user?.phone === "Pendiente" ? "" : user?.phone || "",
    idNumber: user?.idNumber === "Pendiente" ? "" : user?.idNumber || "",
    birthDate: user?.birthDate === "Pendiente" ? "" : user?.birthDate || "",
    gender: user?.gender === "Pendiente" ? "" : user?.gender || "",
    address: deliveryAddress || user?.address || "",
    city: selectedCity || user?.city || "Manta",
  });
  const [message, setMessage] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectProfileCity = (city) => {
    setForm((current) =>
      current.city === city ? current : { ...current, city, address: "" },
    );
    setMessage(`Ingresa una dirección principal válida en ${city}.`);
  };

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setMessage("Ingresa nombres y apellidos.");
      return;
    }

    if (!form.address.trim()) {
      setMessage(`Ingresa una dirección principal válida en ${form.city}.`);
      return;
    }

    updateUserProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || "Pendiente",
      idNumber: form.idNumber.trim() || "Pendiente",
      birthDate: form.birthDate.trim() || "Pendiente",
      gender: form.gender.trim() || "Pendiente",
      address: form.address.trim(),
      city: form.city,
    });
    setMessage("Cambios guardados en este dispositivo. Laravel aún no permite actualizar el perfil.");
  };

  return (
    <Screen>
      <Text style={typography.h1}>Editar información</Text>
      <Text style={typography.muted}>
        Tus cambios se conservarán en este dispositivo mientras Laravel incorpora la actualización del perfil.
      </Text>
      <Card>
        <Field label="Nombres" value={form.firstName} onChangeText={(value) => update("firstName", value)} placeholder="Ingresa tus nombres" />
        <Field label="Apellidos" value={form.lastName} onChangeText={(value) => update("lastName", value)} placeholder="Ingresa tus apellidos" />
        <Field label="Correo electrónico" value={form.email} onChangeText={(value) => update("email", value)} placeholder="correo@ejemplo.com" />
        <Field label="Número celular" value={form.phone} onChangeText={(value) => update("phone", value)} placeholder="0991234567" />
        <Field label="Número de cédula" value={form.idNumber} onChangeText={(value) => update("idNumber", value)} placeholder="1312345678" />
        <BirthDateField
          value={form.birthDate}
          onChange={(value) => update("birthDate", value)}
        />
        <GenderSelector
          value={form.gender}
          onChange={(value) => update("gender", value)}
        />
      </Card>
      <Card>
        <Text style={typography.h3}>Ciudad principal</Text>
        <View style={styles.tagWrap}>
          {cities.slice(0, 8).map((city) => (
            <Chip key={city} label={city} selected={form.city === city} onPress={() => selectProfileCity(city)} />
          ))}
        </View>
        <Field label="Dirección principal" value={form.address} onChangeText={(value) => update("address", value)} placeholder="Calle principal y referencia" multiline />
        {message ? <Text style={styles.successText}>{message}</Text> : null}
        <PrimaryButton title="Guardar cambios" icon="save-outline" onPress={save} />
        <PrimaryButton title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} />
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
  homeSafe: {
    backgroundColor: colors.white,
  },
  homeContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  homeTop: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    gap: spacing.lg,
    overflow: "hidden",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "950",
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  transparentIcon: {
    backgroundColor: "rgba(23, 25, 24, 0.18)",
    boxShadow: "none",
  },
  locationBlock: {
    gap: spacing.sm,
  },
  helloText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "950",
  },
  locationPill: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  locationText: {
    flex: 1,
    color: colors.ink,
    fontWeight: "800",
  },
  locationAction: {
    color: colors.primaryDark,
    fontWeight: "950",
  },
  heroDeal: {
    minHeight: 262,
    marginTop: -spacing.md,
    borderRadius: 34,
    backgroundColor: colors.primary,
    overflow: "hidden",
    flexDirection: "row",
    position: "relative",
    ...shadows.card,
  },
  heroCopy: {
    width: "57%",
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.sm,
    zIndex: 2,
  },
  plusPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    color: colors.primary,
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: "950",
  },
  heroEyebrow: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "950",
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    color: colors.ink,
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontWeight: "950",
  },
  heroArt: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  heroDarkShape: {
    position: "absolute",
    right: -72,
    top: 22,
    width: 248,
    height: 248,
    borderTopLeftRadius: 92,
    borderBottomLeftRadius: 24,
    backgroundColor: colors.ink,
  },
  heroPlusOne: {
    position: "absolute",
    top: 24,
    left: 58,
    color: colors.primary,
    fontSize: 42,
    fontWeight: "950",
    opacity: 0.85,
  },
  heroPlusTwo: {
    position: "absolute",
    top: 88,
    right: 44,
    color: colors.primary,
    fontSize: 54,
    fontWeight: "950",
    opacity: 0.95,
  },
  heroPlusThree: {
    position: "absolute",
    bottom: 42,
    left: 78,
    color: colors.primary,
    fontSize: 36,
    fontWeight: "950",
    opacity: 0.65,
  },
  heroProduct: {
    position: "absolute",
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.softOrange,
    ...shadows.soft,
  },
  heroProductMain: {
    right: 10,
    bottom: 26,
    width: 118,
    height: 118,
    borderRadius: 59,
  },
  heroProductSmall: {
    right: 88,
    top: 58,
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  heroProductTiny: {
    right: 14,
    top: 82,
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  heroPager: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    left: "48%",
    width: 34,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  floatingSearch: {
    marginTop: -6,
  },
  featureGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  visualCategory: {
    width: 124,
    minHeight: 152,
    borderRadius: 26,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  visualCategoryLarge: {
    flex: 1,
    minHeight: 182,
  },
  visualCategoryImage: {
    width: 92,
    height: 82,
    borderRadius: 22,
    backgroundColor: colors.softOrange,
  },
  visualCategoryImageLarge: {
    width: "100%",
    height: 108,
  },
  visualCategoryText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "950",
    textAlign: "center",
  },
  visualCategoryTextLarge: {
    fontSize: 20,
  },
  confettiOne: {
    position: "absolute",
    top: 22,
    left: 22,
    width: 9,
    height: 19,
    borderRadius: 5,
    backgroundColor: colors.primary,
    transform: [{ rotate: "-28deg" }],
  },
  confettiTwo: {
    position: "absolute",
    top: 34,
    right: 28,
    width: 8,
    height: 18,
    borderRadius: 5,
    backgroundColor: colors.ink,
    transform: [{ rotate: "32deg" }],
  },
  confettiThree: {
    position: "absolute",
    top: 72,
    left: 36,
    width: 7,
    height: 16,
    borderRadius: 5,
    backgroundColor: colors.white,
    transform: [{ rotate: "58deg" }],
  },
  featurePromo: {
    width: 318,
    minHeight: 160,
    borderRadius: 28,
    backgroundColor: colors.primary,
    overflow: "hidden",
    flexDirection: "row",
    position: "relative",
    ...shadows.card,
  },
  featurePromoCopy: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    gap: 3,
  },
  featurePromoKicker: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "850",
  },
  featurePromoTitle: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "950",
    lineHeight: 35,
  },
  featurePromoText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "750",
  },
  featurePromoImage: {
    width: 126,
    height: "100%",
    backgroundColor: colors.softOrange,
  },
  featurePromoLogo: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  featurePromoLogoText: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "950",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },
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
  successText: {
    color: "#22864B",
    fontWeight: "850",
  },
  addressMessage: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "750",
    lineHeight: 20,
  },
  addressActions: {
    gap: spacing.sm,
  },
  addressActionButton: {
    width: "100%",
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
