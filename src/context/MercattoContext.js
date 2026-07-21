import { createContext, useContext, useEffect, useState } from "react";

import {
  businesses as demoBusinesses,
  cities,
  products as demoProducts,
} from "../data/mercattoData";
import {
  clearStoredToken,
  createAddress as createAddressRequest,
  createOrder as createOrderRequest,
  createProduct as createProductRequest,
  createStore as createStoreRequest,
  deleteProduct as deleteProductRequest,
  getAddresses,
  getCachedProfile,
  getMyOrders,
  getMyStore,
  getStoreProducts,
  getStores,
  loginUser,
  logoutUser,
  registerUser as registerUserRequest,
  saveToken,
  saveCachedProfile,
  updateOrderStatus,
  updateProfile as updateProfileRequest,
  updateProduct as updateProductRequest,
  updateStore as updateStoreRequest,
} from "../../services/mercattoApi";

const MercattoContext = createContext(null);

export function MercattoProvider({ children }) {
  const [user, setUser] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [mode, setMode] = useState("buyer");
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [businesses, setBusinesses] = useState(demoBusinesses);
  const [products, setProducts] = useState(demoProducts);
  const [myStore, setMyStore] = useState(null);
  const [catalogSource, setCatalogSource] = useState("demo");
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [favorites, setFavorites] = useState(["dulce-orilla"]);
  const [cart, setCart] = useState({
    businessId: null,
    items: [],
    deliveryMode: "Delivery",
    paymentMethod: "Efectivo",
    coupon: "",
  });
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);

  const refreshCatalog = async () => {
    setIsCatalogLoading(true);
    setCatalogError("");
    try {
      const storeResponse = await getStores();
      const apiStores = storeResponse?.data || [];
      if (!apiStores.length) {
        setBusinesses(demoBusinesses);
        setProducts(demoProducts);
        setCatalogSource("demo");
        return { businesses: demoBusinesses, products: demoProducts };
      }

      const nextBusinesses = apiStores.map(mapApiStore);
      const productResponses = await Promise.all(
        apiStores.map((store) => getStoreProducts(store.id)),
      );
      const nextProducts = productResponses.flatMap((response, index) =>
        (response?.data || []).map((product) => mapApiProduct(product, apiStores[index])),
      );
      setBusinesses(nextBusinesses);
      setProducts(nextProducts);
      setCatalogSource("backend");
      return { businesses: nextBusinesses, products: nextProducts };
    } catch (error) {
      setCatalogError(error?.message || "No pudimos actualizar el catálogo.");
      setBusinesses(demoBusinesses);
      setProducts(demoProducts);
      setCatalogSource("demo");
      return { businesses: demoBusinesses, products: demoProducts };
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  const login = async ({ identifier, password }) => {
    const response = await loginUser({
      email: identifier.trim().toLowerCase(),
      password,
    });
    await saveToken(response.token);

    const [addressResult, storeResult, orderResult] = await Promise.allSettled([
      getAddresses(response.token),
      getMyStore(response.token),
      getMyOrders(1, response.token),
    ]);
    const addresses = addressResult.status === "fulfilled" ? addressResult.value?.data || [] : [];
    const apiStore = storeResult.status === "fulfilled" ? storeResult.value : null;
    const apiOrders = orderResult.status === "fulfilled" ? orderResult.value?.data || [] : [];

    const defaultAddress = getDefaultAddress(addresses);
    const cachedProfile = await getCachedProfile();
    const matchingProfile =
      cachedProfile?.ownerEmail === response.user?.email ? cachedProfile.profile : {};
    const nextUser = normalizeApiUser(response.user, {
      ...matchingProfile,
      profiles: apiStore ? ["buyer", "entrepreneur"] : ["buyer"],
      ...mapApiAddress(defaultAddress),
    });
    setUser(nextUser);
    setSavedAddresses(addresses);
    setMyStore(apiStore ? mapApiStore(apiStore) : null);
    setSellerOrders(apiOrders.map(mapApiOrder));
    if (nextUser.city) {
      setSelectedCity(nextUser.city);
    }
    if (nextUser.address) {
      setDeliveryAddress(nextUser.address);
    }
    return nextUser;
  };

  const registerUser = async ({ profileType, data }) => {
    const fullName = `${data.names || ""} ${data.lastNames || ""}`.trim();
    const response = await registerUserRequest({
      name: fullName,
      email: String(data.email || "").trim().toLowerCase(),
      password: data.password || "",
      password_confirmation: data.confirmPassword || "",
    });
    await saveToken(response.token);

    let apiStore = null;
    if (profileType === "entrepreneur") {
      try {
        apiStore = await createStoreRequest(
          {
            name: data.businessName || `${fullName} Store`,
            description: data.shortDescription || data.about || null,
            phone: data.businessPhone || data.phone || "Sin teléfono",
            slug: createSlug(data.businessName || fullName),
          },
          response.token,
        );
      } catch {
        apiStore = null;
      }
    }

    const nextUser = normalizeApiUser(response.user, {
      firstName: data.names || "Nuevo",
      lastName: data.lastNames || "Usuario",
      idNumber: data.idNumber || "Sin registrar",
      birthDate: data.birthDate || "Pendiente",
      gender: data.gender || "Pendiente",
      phone: data.phone || "Pendiente",
      email: data.email || "usuario@mercatto.ec",
      city: data.city || selectedCity,
      homeAddress: data.address || "",
      address: "",
      profiles: profileType === "entrepreneur" ? ["buyer", "entrepreneur"] : ["buyer"],
    });
    setUser(nextUser);
    setSelectedCity(nextUser.city);
    setDeliveryAddress(nextUser.address || "");
    setSavedAddresses([]);
    setMyStore(apiStore ? mapApiStore(apiStore) : null);
    setSellerOrders([]);
    setMode(profileType === "entrepreneur" ? "entrepreneur" : "buyer");
    await saveCachedProfile({ ownerEmail: nextUser.email, profile: nextUser });
    if (apiStore) await refreshCatalog();
    return nextUser;
  };

  const updateUserProfile = (patch) => {
    const firstName = patch.firstName ?? user?.firstName ?? "Usuario";
    const lastName = patch.lastName ?? user?.lastName ?? "";
    const name = `${firstName} ${lastName}`.trim();
    const nextUser = {
      ...user,
      ...patch,
      firstName,
      lastName,
      name,
      photo: getInitials(name),
    };

    setUser(nextUser);
    saveCachedProfile({ ownerEmail: nextUser.email, profile: nextUser }).catch(() => {});

    if (patch.city) {
      setSelectedCity(patch.city);
    }

    if (patch.address) {
      setDeliveryAddress(patch.address);
    }
  };

  const saveUserProfile = async (patch) => {
    const response = await updateProfileRequest({
      birth_date: patch.birthDate || null,
      gender: patch.gender || null,
    });
    const apiUser = response?.user || response?.data || response;
    const nextUser = {
      ...user,
      ...patch,
      id: apiUser?.id || user?.id,
      email: apiUser?.email || patch.email || user?.email,
      birthDate: apiUser?.birth_date || patch.birthDate || "Pendiente",
      gender: apiUser?.gender || patch.gender || "Pendiente",
      name: `${patch.firstName || user?.firstName || ""} ${patch.lastName || user?.lastName || ""}`.trim(),
    };
    nextUser.photo = getInitials(nextUser.name);

    setUser(nextUser);
    if (patch.city) setSelectedCity(patch.city);
    if (patch.address) setDeliveryAddress(patch.address);
    await saveCachedProfile({ ownerEmail: nextUser.email, profile: nextUser });
    return nextUser;
  };

  const saveDeliveryAddress = async ({ apiPayload, localAddress }) => {
    const response = await createAddressRequest(apiPayload);
    const savedAddress = response?.data || response;
    const nextAddress = {
      ...localAddress,
      backendAddressId: savedAddress?.id,
    };

    setSavedAddresses((current) => [
      savedAddress,
      ...current.map((address) => ({ ...address, is_default: false })),
    ]);
    updateUserProfile(nextAddress);
    return savedAddress;
  };

  const logout = async () => {
    setUser(null);
    setSavedAddresses([]);
    setMyStore(null);
    setOrders([]);
    setSellerOrders([]);
    setMode("buyer");
    setCart({ businessId: null, items: [], deliveryMode: "Delivery", paymentMethod: "Efectivo", coupon: "" });
    try {
      await logoutUser();
    } catch {
      // The local session must still close if the API is unavailable.
    } finally {
      await clearStoredToken();
    }
  };

  const toggleFavorite = (businessId) => {
    setFavorites((current) =>
      current.includes(businessId)
        ? current.filter((id) => id !== businessId)
        : [...current, businessId],
    );
  };

  const addToCart = (product, quantity = 1, options = {}) => {
    const currentBusiness = product.businessId;

    if (cart.businessId && cart.businessId !== currentBusiness && !options.replaceCart) {
      return { conflict: true };
    }

    setCart((current) => {
      const base =
        current.businessId && current.businessId !== currentBusiness
          ? { ...current, businessId: currentBusiness, items: [] }
          : { ...current, businessId: currentBusiness };
      const existing = base.items.find((item) => item.product.id === product.id);

      if (existing) {
        return {
          ...base,
          items: base.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity, notes: options.notes || item.notes }
              : item,
          ),
        };
      }

      return {
        ...base,
        items: [
          ...base.items,
          {
            product,
            quantity,
            variant: options.variant || product.variants?.[0] || "Estándar",
            complement: options.complement || product.complements?.[0] || "Sin complemento",
            notes: options.notes || "",
          },
        ],
      };
    });

    return { conflict: false };
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((current) => {
      const items = current.items
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0);
      return { ...current, businessId: items.length ? current.businessId : null, items };
    });
  };

  const removeFromCart = (productId) => {
    setCart((current) => {
      const items = current.items.filter((item) => item.product.id !== productId);
      return { ...current, businessId: items.length ? current.businessId : null, items };
    });
  };

  const setCartMeta = (patch) => {
    setCart((current) => ({ ...current, ...patch }));
  };

  const clearCart = () => {
    setCart({ businessId: null, items: [], deliveryMode: "Delivery", paymentMethod: "Efectivo", coupon: "" });
  };

  const confirmOrder = async ({ customerPhone }) => {
    const business = businesses.find((item) => item.id === cart.businessId);
    if (!business?.isBackendEntity || cart.items.some((item) => !item.product.isBackendEntity)) {
      const error = new Error(
        "Este catálogo es demostrativo. Registra la tienda y sus productos en Laravel para crear pedidos reales.",
      );
      error.status = 409;
      throw error;
    }

    const response = await createOrderRequest(business.id, {
      customer_name: user?.name || "Cliente Mercatto",
      customer_phone: customerPhone.trim(),
      delivery_address: `${deliveryAddress}, ${selectedCity}`,
      items: cart.items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    });
    const nextOrder = mapApiOrder(response);
    setOrders((current) => [nextOrder, ...current]);
    clearCart();
    return nextOrder;
  };

  const updateSellerOrder = async (orderId, status) => {
    if (!myStore?.id) throw new Error("Primero debes registrar tu tienda.");
    const apiStatus = orderStatusToApi[status] || status;
    const response = await updateOrderStatus(myStore.id, orderId, apiStatus);
    const nextOrder = mapApiOrder(response);
    setSellerOrders((current) =>
      current.map((order) => (order.id === orderId ? nextOrder : order)),
    );
    return nextOrder;
  };

  const saveStore = async (payload) => {
    const requestPayload = {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      phone: payload.phone.trim(),
      slug: createSlug(payload.slug || payload.name),
    };
    const response = myStore?.id
      ? await updateStoreRequest(myStore.id, requestPayload)
      : await createStoreRequest(requestPayload);
    const nextStore = mapApiStore(response);
    setMyStore(nextStore);
    await refreshCatalog();
    return nextStore;
  };

  const addSellerProduct = async (payload) => {
    if (!myStore?.id) throw new Error("Primero debes registrar tu tienda.");
    const response = await createProductRequest(myStore.id, normalizeProductPayload(payload));
    const nextProduct = mapApiProduct(response, myStore);
    setProducts((current) => [nextProduct, ...current]);
    return nextProduct;
  };

  const saveSellerProduct = async (productId, payload) => {
    if (!myStore?.id) throw new Error("Primero debes registrar tu tienda.");
    const response = await updateProductRequest(
      myStore.id,
      productId,
      normalizeProductPayload(payload),
    );
    const nextProduct = mapApiProduct(response, myStore);
    setProducts((current) =>
      current.map((product) => (product.id === productId ? nextProduct : product)),
    );
    return nextProduct;
  };

  const removeSellerProduct = async (productId) => {
    if (!myStore?.id) throw new Error("Primero debes registrar tu tienda.");
    await deleteProductRequest(myStore.id, productId);
    setProducts((current) => current.filter((product) => product.id !== productId));
  };

  const cartBusiness = businesses.find((business) => business.id === cart.businessId);
  const cartSubtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const cartDelivery = cart.items.length ? cartBusiness?.deliveryCost || 0 : 0;
  const cartDiscount = cart.coupon.trim().toUpperCase() === "MERCATTO10" ? cartSubtotal * 0.1 : 0;
  const cartTotal = Math.max(0, cartSubtotal + cartDelivery - cartDiscount);

  const value = {
    user,
    mode,
    selectedCity,
    deliveryAddress,
    savedAddresses,
    favorites,
    cart,
    orders,
    sellerOrders,
    products,
    businesses,
    myStore,
    catalogSource,
    isCatalogLoading,
    catalogError,
    cartBusiness,
    cartSubtotal,
    cartDelivery,
    cartDiscount,
    cartTotal,
    setMode,
    setSelectedCity,
    setDeliveryAddress,
    login,
    registerUser,
    updateUserProfile,
    saveUserProfile,
    saveDeliveryAddress,
    logout,
    toggleFavorite,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    setCartMeta,
    clearCart,
    confirmOrder,
    updateSellerOrder,
    refreshCatalog,
    saveStore,
    addSellerProduct,
    saveSellerProduct,
    removeSellerProduct,
  };

  return <MercattoContext.Provider value={value}>{children}</MercattoContext.Provider>;
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "M";
}

function normalizeApiUser(apiUser, extras = {}) {
  const fullName = String(apiUser?.name || extras.name || "Usuario Mercatto").trim();
  const [firstName = "Usuario", ...lastNameParts] = fullName.split(/\s+/);
  const normalized = {
    id: apiUser?.id,
    firstName,
    lastName: lastNameParts.join(" "),
    name: fullName,
    email: apiUser?.email || extras.email || "",
    idNumber: "Pendiente",
    birthDate: "Pendiente",
    gender: "Pendiente",
    phone: "Pendiente",
    profiles: ["buyer"],
    ...extras,
  };

  return {
    ...normalized,
    name: `${normalized.firstName} ${normalized.lastName}`.trim() || fullName,
    photo: getInitials(`${normalized.firstName} ${normalized.lastName}`),
  };
}

function getDefaultAddress(addresses) {
  return addresses.find((address) => address.is_default) || addresses[0] || null;
}

function mapApiAddress(address) {
  if (!address) return {};

  return {
    backendAddressId: address.id,
    city: address.city,
    address: [address.street_main, address.street_secondary].filter(Boolean).join(" y "),
    addressSector: "",
    addressReference: address.reference === "Sin referencia" ? "" : address.reference,
    addressCoordinates: {
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    },
  };
}

const orderStatusFromApi = {
  PENDING: "Nuevo",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const orderStatusToApi = {
  Nuevo: "PENDING",
  Confirmado: "PROCESSING",
  "En preparación": "PROCESSING",
  "Listo para retirar": "SHIPPED",
  Enviado: "SHIPPED",
  Entregado: "DELIVERED",
  Cancelado: "CANCELLED",
};

function mapApiStore(store, index = 0) {
  const entity = store?.data || store;
  const visualFallback = demoBusinesses[index % demoBusinesses.length];
  return {
    ...visualFallback,
    id: entity.id,
    name: entity.name,
    logo: getInitials(entity.name),
    slug: entity.slug,
    shortDescription: entity.description || "Emprendimiento local en Mercatto.",
    about: entity.description || "Conoce los productos de este emprendimiento local.",
    category: "Emprendimiento",
    subcategory: "Catálogo local",
    city: null,
    address: "No registrada en el backend",
    contact: entity.phone,
    phone: entity.phone,
    owner: entity.owner,
    isBackendEntity: true,
  };
}

function mapApiProduct(product, store) {
  const entity = product?.data || product;
  const visualFallback = demoProducts.find((item) => item.businessId === store?.id) || demoProducts[0];
  const stock = Number(entity.stock || 0);
  return {
    ...visualFallback,
    id: entity.id,
    businessId: entity.store?.id || store?.id,
    name: entity.name,
    description: entity.description,
    fullDescription: entity.description,
    price: Number(entity.price || 0),
    oldPrice: null,
    discount: 0,
    badges: entity.is_active === false ? ["Pausado"] : [],
    availability: entity.is_active === false ? "No disponible" : stock <= 3 ? "Stock bajo" : "Disponible",
    stock,
    isActive: entity.is_active !== false,
    store: entity.store || store,
    isBackendEntity: true,
  };
}

function mapApiOrder(order) {
  const entity = order?.data || order;
  const status = orderStatusFromApi[entity.status] || entity.status || "Nuevo";
  const itemNames = (entity.items || []).map((item) => item.product?.name || "Producto");
  return {
    id: entity.id,
    businessId: entity.store?.id,
    businessName: entity.store?.name || "Mercatto",
    buyer: entity.customer_name,
    phone: entity.customer_phone,
    address: entity.delivery_address,
    date: formatApiDate(entity.created_at),
    time: formatApiDate(entity.created_at),
    status,
    total: Number(entity.total_price || 0),
    deliveryMode: "Delivery",
    eta: "Por confirmar",
    payment: "Por confirmar",
    items: itemNames,
    apiItems: entity.items || [],
    isBackendEntity: true,
  };
}

function normalizeProductPayload(payload) {
  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    price: Number(payload.price),
    stock: Number.parseInt(payload.stock, 10),
    is_active: payload.isActive !== false,
  };
}

function createSlug(value) {
  return String(value || "tienda")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatApiDate(value) {
  if (!value) return "Ahora";
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function useMercatto() {
  const context = useContext(MercattoContext);
  if (!context) {
    throw new Error("useMercatto must be used within MercattoProvider");
  }
  return context;
}
