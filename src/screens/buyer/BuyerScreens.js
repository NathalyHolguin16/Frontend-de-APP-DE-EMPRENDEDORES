import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  ResponsiveGrid,
  Screen,
  SearchBar,
  SectionHeader,
  useResponsiveLayout,
} from "../../components/MercattoUI";
import {
  cities,
  cityCoordinates,
  cityProvinces,
  matchMercattoCity,
} from "../../data/mercattoData";
import { storeCategories } from "../../data/catalogPresentation";
import { useMercatto } from "../../context/MercattoContext";
import { colors, radius, shadows, spacing, typography } from "../../theme/mercattoTheme";
import { isEmail } from "../../utils/validation";

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

function isBusinessAvailableInCity(business, city) {
  return (
    !business.city ||
    business.city === city ||
    business.serviceCities?.includes(city)
  );
}

export function BuyerHomeScreen({ navigation }) {
  const { isCompactLandscape } = useResponsiveLayout();
  const {
    businesses,
    products,
    user,
    selectedCity,
    deliveryAddress,
    cart,
    favorites,
    toggleFavorite,
    isCatalogLoading,
    catalogError,
    refreshCatalog,
  } = useMercatto();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const cityBusinesses = businesses.filter(
    (business) => isBusinessAvailableInCity(business, selectedCity),
  );
  const cityCategories = new Set(
    cityBusinesses.map((business) => business.category).filter(Boolean),
  );
  const availableCategories = [
    "Todas",
    ...storeCategories.filter((category) => cityCategories.has(category)),
    ...[...cityCategories].filter(
      (category) => !storeCategories.includes(category),
    ),
  ];
  const filteredBusinesses = businesses.filter(
    (business) =>
      isBusinessAvailableInCity(business, selectedCity) &&
      (activeCategory === "Todas" || business.category === activeCategory) &&
      `${business.name} ${business.category} ${business.shortDescription}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visibleBusinessIds = new Set(
    filteredBusinesses.map((business) => business.id),
  );
  const visibleProducts = products.filter((product) =>
    visibleBusinessIds.has(product.businessId),
  );

  return (
    <Screen
      style={styles.homeSafe}
      contentStyle={[
        styles.homeContent,
        isCompactLandscape && styles.homeContentLandscape,
      ]}
    >
      <View
        style={[
          styles.homeTop,
          isCompactLandscape && styles.homeTopLandscape,
        ]}
      >
        <View style={styles.brandRow}>
          <Pressable onPress={() => navigation.navigate("CitySelect", { fromApp: true })} style={styles.brandMark}>
            <Text style={styles.brandText}>MERCATTO</Text>
            <Ionicons name="chevron-down" size={16} color={colors.white} />
          </Pressable>
          <View style={styles.headerActions}>
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

      <HeroDealCard
        navigation={navigation}
        products={visibleProducts}
        businessCount={filteredBusinesses.length}
        city={selectedCity}
        compact={isCompactLandscape}
      />

      <View style={styles.floatingSearch}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar emprendimientos o productos" />
      </View>

      <SectionHeader
        title="Categorías"
        action={activeCategory === "Todas" ? undefined : "Mostrar todas"}
        onPress={() => setActiveCategory("Todas")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontal}
      >
        {availableCategories.map((category) => (
          <Chip
            key={category}
            label={category}
            selected={activeCategory === category}
            onPress={() => setActiveCategory(category)}
          />
        ))}
      </ScrollView>

      <SectionHeader title="Emprendimientos disponibles" />
      {isCatalogLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <Text style={typography.muted}>Actualizando el catálogo...</Text>
        </Card>
      ) : null}
      {!isCatalogLoading && catalogError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar el catálogo"
          message={catalogError}
          action="Intentar nuevamente"
          onPress={refreshCatalog}
        />
      ) : null}
      {!isCatalogLoading && !catalogError ? (
        <ResponsiveGrid>
          {filteredBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              favorite={favorites.includes(business.id)}
              onToggleFavorite={() => toggleFavorite(business.id)}
              onPress={() =>
                navigation.navigate("BusinessDetail", {
                  businessId: business.id,
                })
              }
            />
          ))}
        </ResponsiveGrid>
      ) : null}
      {!isCatalogLoading && !catalogError && !filteredBusinesses.length ? (
        <EmptyState
          icon="storefront-outline"
          title="Sin emprendimientos"
          message={
            query || activeCategory !== "Todas"
              ? "No encontramos emprendimientos con esos filtros."
              : "Aún no existen emprendimientos activos para mostrar."
          }
          action={
            query || activeCategory !== "Todas" ? "Limpiar filtros" : undefined
          }
          onPress={() => {
            setQuery("");
            setActiveCategory("Todas");
          }}
        />
      ) : null}
    </Screen>
  );
}

function HeroDealCard({
  navigation,
  products,
  businessCount,
  city,
  compact = false,
}) {
  const heroProducts = products.filter((product) => product.image).slice(0, 3);
  return (
    <Pressable
      onPress={() => navigation.navigate("Promos")}
      style={({ pressed }) => [
        styles.heroDeal,
        compact && styles.heroDealLandscape,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.heroCopy, compact && styles.heroCopyLandscape]}
      >
        <Text style={styles.plusPill}>mercatto local</Text>
        <Text style={styles.heroEyebrow}>Emprendimientos de tu ciudad</Text>
        <Text style={styles.heroTitle}>Compra local en {city}</Text>
        <Text style={styles.heroBadge}>
          {businessCount
            ? `${businessCount} ${businessCount === 1 ? "tienda disponible" : "tiendas disponibles"}`
            : "Catálogo en actualización"}
        </Text>
      </View>
      <View style={styles.heroArt}>
        <View style={styles.heroDarkShape}>
          <Text style={styles.heroPlusOne}>+</Text>
          <Text style={styles.heroPlusTwo}>+</Text>
          <Text style={styles.heroPlusThree}>+</Text>
        </View>
        {heroProducts[0]?.image ? (
          <Image source={{ uri: heroProducts[0].image }} style={[styles.heroProduct, styles.heroProductMain]} resizeMode="cover" />
        ) : null}
        {heroProducts[1]?.image ? (
          <Image source={{ uri: heroProducts[1].image }} style={[styles.heroProduct, styles.heroProductSmall]} resizeMode="cover" />
        ) : null}
        {heroProducts[2]?.image ? (
          <Image source={{ uri: heroProducts[2].image }} style={[styles.heroProduct, styles.heroProductTiny]} resizeMode="cover" />
        ) : null}
      </View>
      <View style={styles.heroPager} />
    </Pressable>
  );
}

export function BusinessDetailScreen({ route, navigation }) {
  const { isCompactLandscape } = useResponsiveLayout();
  const {
    businesses,
    products,
    favorites,
    toggleFavorite,
    addToCart,
    showNotice,
  } = useMercatto();
  const business =
    businesses.find(
      (item) =>
        item.id === route.params?.businessId ||
        item.slug === route.params?.businessId,
    ) || null;
  const businessProducts = products.filter(
    (product) => product.businessId === business?.id,
  );
  const deliveryOptions = ["Delivery", "Retiro en local", "Punto de encuentro"].filter((option) =>
    (business?.modality || [])
      .join(" ")
      .toLowerCase()
      .includes(option.toLowerCase().split(" ")[0]),
  );
  const [deliveryMode, setDeliveryMode] = useState(deliveryOptions[0] || "Delivery");
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const addFeedbackTimer = useRef(null);

  useEffect(
    () => () => {
      if (addFeedbackTimer.current) clearTimeout(addFeedbackTimer.current);
    },
    [],
  );

  const markProductAsAdded = (productId) => {
    setRecentlyAddedId(productId);
    if (addFeedbackTimer.current) clearTimeout(addFeedbackTimer.current);
    addFeedbackTimer.current = setTimeout(() => setRecentlyAddedId(null), 1400);
  };

  const quickAdd = (product) => {
    const result = addToCart(product, 1);
    if (result.conflict) {
      Alert.alert("Carrito de otro emprendimiento", "Por ahora cada carrito pertenece a un solo negocio.", [
        { text: "Conservar carrito", style: "cancel" },
        {
          text: "Vaciar y agregar",
          onPress: () => {
            addToCart(product, 1, { replaceCart: true });
            markProductAsAdded(product.id);
          },
        },
      ]);
      return;
    }
    if (!result.duplicateSuppressed) markProductAsAdded(product.id);
  };

  const publicBaseUrl = process.env.EXPO_PUBLIC_MERCATTO_PUBLIC_URL?.replace(
    /\/$/,
    "",
  );
  const shareBusiness = async () => {
    const url = `${publicBaseUrl}/tiendas/${business.id}`;
    try {
      await Share.share({
        title: business.name,
        message: `Conoce ${business.name} en Mercatto: ${url}`,
        url,
      });
      showNotice("Enlace preparado para compartir.");
    } catch {
      showNotice("No pudimos compartir el emprendimiento.", "error");
    }
  };

  if (!business) {
    return (
      <Screen>
        <EmptyState
          icon="storefront-outline"
          title="Emprendimiento no disponible"
          message="No encontramos este emprendimiento o ya no está publicado."
          action="Volver al inicio"
          onPress={() => navigation.replace("BuyerTabs")}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 0 }}>
      <View
        style={[
          styles.coverWrap,
          isCompactLandscape && styles.coverWrapLandscape,
        ]}
      >
        {business.cover ? (
          <Image
            source={{ uri: business.cover }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Ionicons
              name="storefront-outline"
              size={52}
              color={colors.primaryDark}
            />
          </View>
        )}
        <View style={styles.coverActions}>
          <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {publicBaseUrl ? (
              <IconButton
                icon="share-social-outline"
                accessibilityLabel={`Compartir ${business.name}`}
                onPress={shareBusiness}
              />
            ) : null}
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
          <Avatar
            label={business.logo}
            image={business.logoImage}
            size={62}
          />
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
        <InfoLine
          label="Dirección"
          value={business.address || "Disponible al coordinar el pedido"}
        />
      </Card>
      <SectionHeader title="Productos" />
      <ResponsiveGrid>
        {businessProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
            onAdd={() => quickAdd(product)}
            added={recentlyAddedId === product.id}
            addDisabled={recentlyAddedId === product.id}
          />
        ))}
      </ResponsiveGrid>
      {!businessProducts.length ? (
        <EmptyState
          icon="cube-outline"
          title="Sin productos disponibles"
          message="Este emprendimiento todavía no tiene productos activos."
        />
      ) : null}
      <Card>
        <Text style={typography.h3}>Información y políticas</Text>
        <Text style={typography.muted}>Métodos de pago: {business.paymentMethods.join(", ")}.</Text>
        <Text style={typography.muted}>Contacto: {business.contact}</Text>
        {business.socials ? (
          <Text style={typography.muted}>Redes sociales: {business.socials}</Text>
        ) : null}
        {business.policies.map((policy) => <Text key={policy} style={typography.muted}>• {policy}</Text>)}
      </Card>
    </Screen>
  );
}

export function ProductDetailScreen({ route, navigation }) {
  const { isCompactLandscape } = useResponsiveLayout();
  const { addToCart, businesses, products } = useMercatto();
  const product =
    products.find((item) => item.id === route.params?.productId) || null;
  const business = businesses.find(
    (item) => item.id === product?.businessId,
  );
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(
    product?.variants?.[0] || "Estándar",
  );
  const [complement, setComplement] = useState(
    product?.complements?.[0] || "Sin complemento",
  );
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const submit = () => {
    if (isAdding || !product) return;
    setIsAdding(true);
    const result = addToCart(product, quantity, { variant, complement, notes });
    if (result.conflict) {
      setIsAdding(false);
      Alert.alert("Carrito de otro emprendimiento", "¿Deseas vaciarlo y comenzar uno nuevo?", [
        { text: "No", style: "cancel" },
        {
          text: "Sí, vaciar",
          onPress: () => {
            addToCart(product, quantity, {
              variant,
              complement,
              notes,
              replaceCart: true,
            });
            navigation.navigate("Cart");
          },
        },
      ]);
      return;
    }
    navigation.navigate("Cart");
  };

  if (!product) {
    return (
      <Screen>
        <EmptyState
          icon="cube-outline"
          title="Producto no disponible"
          message="No encontramos este producto o ya no está publicado."
          action="Volver"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 0 }}>
      {product.image ? (
        <Image
          source={{ uri: product.image }}
          style={[
            styles.productHero,
            isCompactLandscape && styles.productHeroLandscape,
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.productHero,
            isCompactLandscape && styles.productHeroLandscape,
            styles.coverPlaceholder,
          ]}
        >
          <Ionicons
            name="image-outline"
            size={52}
            color={colors.primaryDark}
          />
        </View>
      )}
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
        <PrimaryButton
          title={
            isAdding
              ? "Agregando..."
              : `Agregar al carrito · $${(product.price * quantity).toFixed(2)}`
          }
          icon="cart-outline"
          disabled={isAdding}
          onPress={submit}
        />
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
            {item.product.image ? (
              <Image
                source={{ uri: item.product.image }}
                style={styles.cartImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cartImage, styles.coverPlaceholder]}>
                <Ionicons
                  name="image-outline"
                  size={26}
                  color={colors.primaryDark}
                />
              </View>
            )}
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
      </Card>
      <OrderSummary subtotal={cartSubtotal} delivery={cartDelivery} discount={cartDiscount} total={cartTotal} />
      <PrimaryButton title="Confirmar pedido" icon="checkmark-circle-outline" onPress={() => navigation.navigate("Checkout")} />
    </Screen>
  );
}

export function CheckoutScreen({ navigation }) {
  const {
    user,
    cartBusiness,
    deliveryAddress,
    savedAddresses,
    selectDeliveryAddress,
    cart,
    cartSubtotal,
    cartDelivery,
    cartDiscount,
    cartTotal,
    confirmOrder,
  } = useMercatto();
  const [customerPhone, setCustomerPhone] = useState(user?.phone === "Pendiente" ? "" : user?.phone || "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    if (cart.deliveryMode === "Delivery" && !deliveryAddress) {
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
      navigation.replace("OrderConfirmation", { order });
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
        <InfoLine
          label="Dirección"
          value={
            cart.deliveryMode === "Delivery"
              ? deliveryAddress
              : `Retiro en ${cartBusiness?.name || "el emprendimiento"}`
          }
        />
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
      {cart.deliveryMode === "Delivery" ? (
        <Card>
          <Text style={typography.h3}>Dirección de entrega</Text>
          {savedAddresses.length ? (
            <View style={styles.addressChoiceList}>
              {savedAddresses.map((address) => {
                const label = formatSavedAddress(address);
                return (
                  <Chip
                    key={address.id}
                    label={label}
                    selected={label === deliveryAddress}
                    onPress={() => {
                      selectDeliveryAddress(address);
                      setMessage("");
                    }}
                  />
                );
              })}
            </View>
          ) : (
            <Text style={typography.muted}>
              Todavía no tienes direcciones guardadas.
            </Text>
          )}
          <PrimaryButton
            title="Agregar otra dirección"
            icon="add-outline"
            variant="secondary"
            onPress={() => navigation.navigate("Address")}
          />
        </Card>
      ) : null}
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
  const order = route.params?.order;
  const showSuccess = route.params?.showSuccess !== false;
  const shareReceipt = async () => {
    if (!order) return;
    try {
      await Share.share({
        title: `Pedido ${order.id}`,
        message: formatOrderReceipt(order),
      });
    } catch {
      Alert.alert(
        "No pudimos compartir la nota",
        "Intenta nuevamente en unos segundos.",
      );
    }
  };

  if (!order) {
    return (
      <Screen>
        <EmptyState
          icon="receipt-outline"
          title="Pedido enviado"
          message="El emprendimiento recibió tu pedido."
          action="Ver mis pedidos"
          onPress={() =>
            navigation.replace("BuyerTabs", { screen: "Pedidos" })
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.confirmationHero}>
        <View style={styles.confirmationIcon}>
          <Ionicons
            name="checkmark"
            size={34}
            color={colors.white}
          />
        </View>
        <Text style={[typography.h1, { textAlign: "center" }]}>
          {showSuccess ? "Pedido enviado correctamente" : "Detalle del pedido"}
        </Text>
        <Text style={[typography.muted, { textAlign: "center" }]}>
          {showSuccess
            ? "El emprendimiento recibió tu solicitud y podrá actualizar su estado."
            : `Estado actual: ${order.status}.`}
        </Text>
      </Card>
      <Card>
        <Text style={typography.h3}>Nota de venta</Text>
        <InfoLine label="Número de pedido" value={order.id} />
        <InfoLine label="Emprendimiento" value={order.businessName} />
        <InfoLine label="Fecha" value={order.date} />
        <InfoLine label="Productos" value={order.items.join(", ")} />
        <InfoLine label="Modalidad" value={order.deliveryMode} />
        <InfoLine label="Dirección" value={order.address} />
        <InfoLine label="Pago" value={order.payment} />
        <InfoLine label="Estado" value={order.status} />
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
      </Card>
      {showSuccess ? (
        <PrimaryButton
          title="Ver pedido"
          icon="receipt-outline"
          onPress={() =>
            navigation.replace("BuyerTabs", { screen: "Pedidos" })
          }
        />
      ) : null}
      <PrimaryButton
        title="Compartir nota de venta"
        icon="share-social-outline"
        variant="secondary"
        onPress={shareReceipt}
      />
      <PrimaryButton
        title="Volver al inicio"
        variant="ghost"
        onPress={() =>
          navigation.replace("BuyerTabs", { screen: "Inicio" })
        }
      />
    </Screen>
  );
}

export function PromosScreen({ navigation }) {
  const {
    businesses,
    products,
    selectedCity,
    isCatalogLoading,
    catalogError,
    refreshCatalog,
  } = useMercatto();
  const localBusinessIds = new Set(
    businesses
      .filter((business) => isBusinessAvailableInCity(business, selectedCity))
      .map((business) => business.id),
  );
  const promotions = products.filter(
    (product) =>
      localBusinessIds.has(product.businessId) &&
      product.discount > 0 &&
      product.image,
  );

  return (
    <Screen>
      <Text style={typography.h1}>Promos</Text>
      <Text style={typography.muted}>
        Ofertas disponibles en {selectedCity} por tiempo limitado.
      </Text>
      {isCatalogLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <Text style={typography.muted}>Buscando promociones...</Text>
        </Card>
      ) : null}
      {!isCatalogLoading && catalogError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar las promociones"
          message={catalogError}
          action="Intentar nuevamente"
          onPress={refreshCatalog}
        />
      ) : null}
      {!isCatalogLoading && !catalogError && promotions.length ? (
        <>
          <SectionHeader title={`${promotions.length} ofertas disponibles`} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontal}
          >
            {promotions.map((promo) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                businessName={
                  businesses.find((business) => business.id === promo.businessId)
                    ?.name || "Mercatto"
                }
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: promo.id })
                }
              />
            ))}
          </ScrollView>
        </>
      ) : null}
      {!isCatalogLoading && !catalogError && !promotions.length ? (
        <EmptyState
          icon="pricetag-outline"
          title="Sin promociones publicadas"
          message="Las promociones aparecerán aquí cuando los emprendimientos las publiquen."
          action="Explorar emprendimientos"
          onPress={() => navigation.navigate("Inicio")}
        />
      ) : null}
    </Screen>
  );
}

export function BuyerOrdersScreen({ navigation }) {
  const {
    orders,
    isOrdersLoading,
    ordersError,
    refreshBuyerOrders,
    cancelBuyerOrder,
  } = useMercatto();
  const [activeGroup, setActiveGroup] = useState("En curso");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const groups = {
    "En curso": orders.filter((order) => !["Entregado", "Cancelado"].includes(order.status)),
    Completados: orders.filter((order) => order.status === "Entregado"),
    Cancelados: orders.filter((order) => order.status === "Cancelado"),
  };
  const visibleOrders = groups[activeGroup];
  const requestCancellation = (order) => {
    const shortId = String(order.id).slice(0, 8).toUpperCase();
    const cancelOrder = async () => {
      setCancellingOrderId(order.id);
      setCancellationMessage("");
      try {
        await cancelBuyerOrder(order.id);
        setActiveGroup("Cancelados");
      } catch (error) {
        setCancellationMessage(
          error?.message || "No pudimos cancelar el pedido.",
        );
      } finally {
        setCancellingOrderId(null);
      }
    };
    const prompt = `¿Deseas cancelar el pedido #${shortId}?`;

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(prompt)) cancelOrder();
      return;
    }

    Alert.alert(
      "Cancelar pedido",
      prompt,
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Cancelar pedido",
          style: "destructive",
          onPress: cancelOrder,
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.ordersHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h1}>Pedidos</Text>
          <Text style={typography.muted}>
            Consulta el avance de tus compras.
          </Text>
        </View>
        <IconButton
          icon="refresh-outline"
          accessibilityLabel="Actualizar pedidos"
          disabled={isOrdersLoading}
          onPress={() => refreshBuyerOrders().catch(() => {})}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontal}
      >
        {Object.entries(groups).map(([group, groupOrders]) => (
          <Chip
            key={group}
            label={`${group} (${groupOrders.length})`}
            selected={activeGroup === group}
            onPress={() => setActiveGroup(group)}
          />
        ))}
      </ScrollView>

      {cancellationMessage ? (
        <Text selectable style={styles.orderError}>
          {cancellationMessage}
        </Text>
      ) : null}

      {isOrdersLoading && !orders.length ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <Text style={typography.muted}>Actualizando tus pedidos...</Text>
        </Card>
      ) : null}

      {ordersError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos actualizar tus pedidos"
          message={ordersError}
          action="Intentar nuevamente"
          onPress={() => refreshBuyerOrders().catch(() => {})}
        />
      ) : null}

      {!isOrdersLoading && !ordersError && visibleOrders.length ? (
        <ResponsiveGrid>
          {visibleOrders.map((order) => (
            <BuyerOrderCard
              key={order.id}
              order={order}
              navigation={navigation}
              isCancelling={cancellingOrderId === order.id}
              onCancel={() => requestCancellation(order)}
            />
          ))}
        </ResponsiveGrid>
      ) : null}

      {!isOrdersLoading && !ordersError && !visibleOrders.length ? (
        <EmptyState
          icon="receipt-outline"
          title={`Sin pedidos ${activeGroup.toLowerCase()}`}
          message={
            activeGroup === "En curso"
              ? "Tus próximos pedidos aparecerán aquí."
              : "Cuando tengas movimientos aparecerán aquí."
          }
          action={activeGroup === "En curso" ? "Explorar tiendas" : undefined}
          onPress={
            activeGroup === "En curso"
              ? () => navigation.navigate("Inicio")
              : undefined
          }
        />
      ) : null}
    </Screen>
  );
}

function BuyerOrderCard({
  order,
  navigation,
  isCancelling = false,
  onCancel,
}) {
  const shortId = String(order.id || "")
    .slice(0, 8)
    .toUpperCase();
  const statusTone =
    order.status === "Cancelado"
      ? "#FCEDEA"
      : order.status === "Entregado"
        ? "#E9F7EF"
        : colors.softOrange;

  return (
    <Card>
      <View style={styles.headerLine}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>Pedido #{shortId}</Text>
          <Text style={typography.muted}>{order.businessName} · {order.date}</Text>
        </View>
        <Chip label={order.status} tone={statusTone} />
      </View>
      <Text style={typography.muted}>{order.items.join(", ")}</Text>
      <InfoLine label="Total" value={`$${order.total.toFixed(2)}`} />
      <InfoLine label="Modalidad" value={order.deliveryMode} />
      <InfoLine label="Tiempo" value={order.eta} />
      <View style={styles.navRow}>
        <PrimaryButton
          title="Ver detalle"
          variant="secondary"
          onPress={() =>
            navigation.navigate("OrderConfirmation", {
              order,
              showSuccess: false,
            })
          }
          style={{ flex: 1 }}
        />
        {["Nuevo", "En preparación"].includes(order.status) ? (
          <PrimaryButton
            title={isCancelling ? "Cancelando..." : "Cancelar pedido"}
            icon="close-circle-outline"
            variant="ghost"
            disabled={isCancelling}
            onPress={onCancel}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
    </Card>
  );
}

export function BuyerProfileScreen({ navigation }) {
  const {
    user,
    selectedCity,
    deliveryAddress,
    logout,
    myStore,
    setMode,
  } = useMercatto();
  const handleLogout = async () => {
    await logout();
    goToLogin(navigation);
  };
  const items = [
    ["create-outline", "Editar información", "profile-edit"],
    ["location-outline", "Administrar direcciones", "address"],
    ["heart-outline", "Ver favoritos", "favorites"],
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
          <MenuRow
            key={label}
            icon={icon}
            label={label}
            onPress={() =>
              navigation.navigate(
                type === "favorites"
                  ? "Favorites"
                  : type === "address"
                    ? "Address"
                    : "EditProfile",
              )
            }
          />
        ))}
        <MenuRow
          icon="storefront-outline"
          label={
            myStore
              ? "Cambiar a modo emprendedor"
              : "Crear perfil de emprendedor"
          }
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
      <ResponsiveGrid>
        {list.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            favorite
            onToggleFavorite={() => toggleFavorite(business.id)}
            onPress={() => navigation.navigate("BusinessDetail", { businessId: business.id })}
          />
        ))}
      </ResponsiveGrid>
      {!list.length ? <EmptyState icon="heart-outline" title="Sin favoritos" message="Guarda emprendimientos para encontrarlos rápido." /> : null}
    </Screen>
  );
}

export function AddressScreen({ navigation }) {
  const {
    deliveryAddress,
    removeDeliveryAddress,
    saveDeliveryAddress,
    savedAddresses,
    selectedCity,
    user,
  } = useMercatto();
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
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(Boolean(deliveryAddress));

  const confirmDeleteAddress = (savedAddress) => {
    Alert.alert(
      "Eliminar dirección",
      `¿Deseas eliminar “${savedAddress.alias || formatSavedAddress(savedAddress)}”?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeletingAddressId(savedAddress.id);
            setMessage("");
            try {
              await removeDeliveryAddress(savedAddress.id);
            } catch (error) {
              setMessage(
                error?.message ||
                  "No pudimos eliminar la dirección. Intenta nuevamente.",
              );
            } finally {
              setDeletingAddressId(null);
            }
          },
        },
      ],
    );
  };

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
      setMessage(
        error.status === 401
          ? "Tu sesión venció. Inicia sesión nuevamente para guardar la dirección."
          : error.status === 422
            ? error.message || "Revisa los datos de la dirección e intenta nuevamente."
            : error?.message ||
              "No pudimos guardar la dirección. Conservamos los datos en el formulario para que puedas intentarlo nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.addressTitleRow}>
        <IconButton
          icon="arrow-back"
          accessibilityLabel="Volver"
          onPress={() => navigation.goBack()}
        />
        <Text style={[typography.h1, { flex: 1 }]}>Dirección de entrega</Text>
      </View>
      {savedAddresses.length ? (
        <Card>
          <Text style={typography.h3}>Direcciones guardadas</Text>
          {savedAddresses.map((savedAddress) => (
            <View key={savedAddress.id} style={styles.savedAddressRow}>
              <View style={styles.savedAddressText}>
                <Text style={styles.productName}>
                  {savedAddress.alias || "Dirección"}
                </Text>
                <Text style={typography.muted}>
                  {formatSavedAddress(savedAddress)}
                </Text>
              </View>
              <IconButton
                icon={
                  deletingAddressId === savedAddress.id
                    ? "hourglass-outline"
                    : "trash-outline"
                }
                color={colors.red}
                disabled={deletingAddressId === savedAddress.id}
                onPress={() => confirmDeleteAddress(savedAddress)}
              />
            </View>
          ))}
        </Card>
      ) : null}
      <Card>
        <Text style={typography.h3}>Agregar dirección</Text>
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
  const { user, saveUserProfile } = useMercatto();
  const initialNames = getEditableProfileNames(user);
  const [form, setForm] = useState({
    firstName: initialNames.firstName,
    lastName: initialNames.lastName,
    email: user?.email || "",
    birthDate: user?.birthDate === "Pendiente" ? "" : user?.birthDate || "",
    gender: user?.gender === "Pendiente" ? "" : user?.gender || "",
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setMessage("Ingresa nombres y apellidos.");
      return;
    }

    if (!isEmail(form.email)) {
      setMessage("Ingresa un correo electrónico válido.");
      return;
    }

    const profilePatch = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      birthDate: form.birthDate.trim() || "Pendiente",
      gender: form.gender.trim() || "Pendiente",
    };

    setIsSaving(true);
    setMessage("");
    try {
      await saveUserProfile(profilePatch);
      setMessage("Información guardada correctamente.");
    } catch (error) {
      setMessage(
        error?.message ||
          "No pudimos guardar la información. Intenta nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.h1}>Editar información</Text>
      <Text style={typography.muted}>
        Actualiza los datos disponibles de tu cuenta.
      </Text>
      <Card>
        <Field label="Nombres" value={form.firstName} onChangeText={(value) => update("firstName", value)} placeholder="Ingresa tus nombres" />
        <Field label="Apellidos" value={form.lastName} onChangeText={(value) => update("lastName", value)} placeholder="Ingresa tus apellidos" />
        <Field label="Correo electrónico" value={form.email} onChangeText={(value) => update("email", value)} placeholder="correo@ejemplo.com" />
        <BirthDateField
          value={form.birthDate}
          onChange={(value) => update("birthDate", value)}
        />
        <GenderSelector
          value={form.gender}
          onChange={(value) => update("gender", value)}
        />
        {message ? <Text style={styles.successText}>{message}</Text> : null}
        <PrimaryButton
          title={isSaving ? "Guardando cambios..." : "Guardar cambios"}
          icon="save-outline"
          disabled={isSaving}
          onPress={save}
        />
        <PrimaryButton
          title="Administrar direcciones"
          icon="location-outline"
          variant="secondary"
          onPress={() => navigation.navigate("Address")}
        />
        <PrimaryButton title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} />
      </Card>
    </Screen>
  );
}

function formatSavedAddress(address) {
  return [address.street_main, address.street_secondary]
    .filter(Boolean)
    .join(" y ");
}

function formatOrderReceipt(order) {
  return [
    "MERCATTO - NOTA DE VENTA",
    `Pedido: ${order.id}`,
    `Emprendimiento: ${order.businessName}`,
    `Fecha: ${order.date}`,
    `Productos: ${order.items.join(", ")}`,
    `Modalidad: ${order.deliveryMode}`,
    `Dirección: ${order.address}`,
    `Pago: ${order.payment}`,
    `Estado: ${order.status}`,
    `Total: $${order.total.toFixed(2)}`,
  ].join("\n");
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
  homeContentLandscape: {
    gap: spacing.md,
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
  homeTopLandscape: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
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
  heroDealLandscape: {
    minHeight: 208,
  },
  heroCopy: {
    width: "57%",
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.sm,
    zIndex: 2,
  },
  heroCopyLandscape: {
    width: "52%",
    padding: spacing.md,
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
  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
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
  ordersHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  orderError: {
    color: "#B42318",
    fontWeight: "850",
    lineHeight: 20,
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
  coverWrapLandscape: {
    height: 190,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.softOrange,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
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
  productHeroLandscape: {
    height: 210,
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
  addressChoiceList: {
    gap: spacing.sm,
  },
  savedAddressRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.sm,
  },
  savedAddressText: {
    flex: 1,
    gap: 3,
  },
  confirmationHero: {
    alignItems: "center",
  },
  confirmationIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
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
  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
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
