import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { cities } from "../data/mercattoData";
import {
  clearStoredToken,
  createAddress as createAddressRequest,
  createOrder as createOrderRequest,
  createProduct as createProductRequest,
  createStore as createStoreRequest,
  deleteAddress as deleteAddressRequest,
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
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState([]);
  const [myStore, setMyStore] = useState(null);
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
  const [notice, setNotice] = useState(null);
  const noticeTimerRef = useRef(null);
  const lastCartAddRef = useRef({ productId: null, timestamp: 0 });

  const showNotice = (message, tone = "success") => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice({ message, tone });
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2800);
  };

  const refreshCatalog = async () => {
    setIsCatalogLoading(true);
    setCatalogError("");
    try {
      const apiStores = await getAllPages((page) => getStores(page));
      if (!apiStores.length) {
        setBusinesses([]);
        setProducts([]);
        return { businesses: [], products: [] };
      }

      const nextBusinesses = apiStores.map(mapApiStore);
      const productResponses = await Promise.all(
        apiStores.map((store) =>
          getAllPages((page) => getStoreProducts(store.id, page)),
        ),
      );
      const nextProducts = productResponses.flatMap((storeProducts, index) =>
        storeProducts.map((product) =>
          mapApiProduct(product, apiStores[index]),
        ),
      );
      setBusinesses(nextBusinesses);
      setProducts(nextProducts);
      return { businesses: nextBusinesses, products: nextProducts };
    } catch (error) {
      setCatalogError(error?.message || "No pudimos actualizar el catálogo.");
      setBusinesses([]);
      setProducts([]);
      return { businesses: [], products: [] };
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    },
    [],
  );

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
    let storeRegistrationError = null;
    if (profileType === "entrepreneur") {
      try {
        apiStore = await createStoreRequest(
          {
            name: data.businessName,
            description: data.shortDescription || data.about || null,
            phone: data.businessPhone,
            slug: createSlug(data.businessName || fullName),
          },
          response.token,
        );
      } catch (error) {
        storeRegistrationError = error;
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
    if (storeRegistrationError) {
      showNotice(
        "La cuenta se creó, pero no pudimos registrar la tienda. Completa el proceso desde Mi negocio.",
        "error",
      );
    }
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
      name: `${patch.firstName || ""} ${patch.lastName || ""}`.trim(),
      email: patch.email?.trim().toLowerCase(),
      birth_date: patch.birthDate || null,
      gender: patch.gender || null,
    });
    const apiUser = response?.data || response?.user || response;
    const fullName = String(apiUser?.name || user?.name || "").trim();
    const [firstName = "", ...lastNameParts] = fullName.split(/\s+/);
    const nextUser = {
      ...user,
      id: apiUser?.id || user?.id,
      firstName,
      lastName: lastNameParts.join(" "),
      name: fullName,
      email: apiUser?.email || user?.email,
      birthDate: apiUser?.birth_date || "Pendiente",
      gender: apiUser?.gender || "Pendiente",
      photo: getInitials(fullName),
    };

    setUser(nextUser);
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

  const selectDeliveryAddress = (address) => {
    const mappedAddress = mapApiAddress(address);
    if (!mappedAddress.address) return;
    updateUserProfile(mappedAddress);
  };

  const removeDeliveryAddress = async (addressId) => {
    await deleteAddressRequest(addressId);
    const remainingAddresses = savedAddresses.filter(
      (address) => address.id !== addressId,
    );
    setSavedAddresses(remainingAddresses);

    if (user?.backendAddressId === addressId) {
      const nextAddress = getDefaultAddress(remainingAddresses);
      if (nextAddress) {
        selectDeliveryAddress(nextAddress);
      } else {
        updateUserProfile({
          backendAddressId: null,
          address: "",
          addressSector: "",
          addressReference: "",
          addressCoordinates: null,
        });
      }
    }

    showNotice("Dirección eliminada correctamente.");
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
    const now = Date.now();

    if (cart.businessId && cart.businessId !== currentBusiness && !options.replaceCart) {
      return { conflict: true };
    }

    if (
      !options.replaceCart &&
      lastCartAddRef.current.productId === product.id &&
      now - lastCartAddRef.current.timestamp < 900
    ) {
      showNotice(
        "El producto ya fue agregado. Ajusta la cantidad desde el carrito.",
        "info",
      );
      return { conflict: false, duplicateSuppressed: true };
    }

    lastCartAddRef.current = { productId: product.id, timestamp: now };
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

    showNotice("Producto agregado al carrito correctamente.");
    return { conflict: false, duplicateSuppressed: false };
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
    if (!business?.isBackendEntity) {
      throw new Error("No encontramos el emprendimiento de este pedido.");
    }
    if (cart.items.some((item) => !item.product.isBackendEntity)) {
      throw new Error("Uno de los productos ya no está disponible.");
    }
    if (cart.deliveryMode === "Delivery" && !deliveryAddress.trim()) {
      throw new Error("Selecciona una dirección para recibir el pedido.");
    }

    const orderAddress =
      cart.deliveryMode === "Delivery"
        ? `${deliveryAddress}, ${selectedCity}`
        : `Retiro en ${business.name}`;
    const response = await createOrderRequest(business.id, {
      customer_name: user?.name || "Cliente Mercatto",
      customer_phone: customerPhone.trim(),
      delivery_address: orderAddress,
      items: cart.items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    });
    const nextOrder = mapApiOrder(response, {
      deliveryMode: cart.deliveryMode,
      paymentMethod: cart.paymentMethod,
    });
    setOrders((current) => [nextOrder, ...current]);
    clearCart();
    showNotice("Pedido enviado correctamente.");
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
  const cartDelivery =
    cart.items.length && cart.deliveryMode === "Delivery"
      ? cartBusiness?.deliveryCost || 0
      : 0;
  const cartDiscount = 0;
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
    isCatalogLoading,
    catalogError,
    notice,
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
    selectDeliveryAddress,
    removeDeliveryAddress,
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
    showNotice,
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
    ...extras,
    id: apiUser?.id || extras.id,
    firstName,
    lastName: lastNameParts.join(" "),
    name: fullName,
    email: apiUser?.email || extras.email || "",
    idNumber: apiUser?.id_number || extras.idNumber || "Pendiente",
    birthDate: apiUser?.birth_date || extras.birthDate || "Pendiente",
    gender: apiUser?.gender || extras.gender || "Pendiente",
    phone: apiUser?.phone || extras.phone || "Pendiente",
    profiles: extras.profiles || ["buyer"],
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

function mapApiStore(store) {
  const entity = store?.data || store;
  return {
    id: entity.id,
    name: entity.name,
    logo: getInitials(entity.name),
    slug: entity.slug,
    shortDescription: entity.description || "Emprendimiento local en Mercatto.",
    about: entity.description || "Conoce los productos de este emprendimiento local.",
    category: entity.category?.name || entity.category || "Emprendimientos",
    subcategory: "Catálogo local",
    city: entity.city || null,
    address: entity.address || "",
    contact: entity.phone,
    phone: entity.phone,
    owner: entity.owner,
    hero: entity.cover_url || entity.cover || null,
    cover: entity.cover_url || entity.cover || null,
    rating: Number(entity.rating || 0),
    reviews: Number(entity.reviews_count || 0),
    deliveryTime: entity.delivery_time || "Por confirmar",
    preparationTime: entity.preparation_time || "Por confirmar",
    deliveryCost: Number(entity.delivery_cost || 0),
    minimumOrder: Number(entity.minimum_order || 0),
    freeShippingFrom: Number(entity.free_shipping_from || 0),
    status: entity.is_active === false ? "No disponible" : "Disponible",
    tags: toStringArray(entity.tags),
    modality: toStringArray(entity.delivery_modes, ["Retiro en local"]),
    paymentMethods: toStringArray(entity.payment_methods, ["Efectivo"]),
    socials: entity.socials || "",
    policies: toStringArray(entity.policies),
    isBackendEntity: true,
  };
}

function mapApiProduct(product, store) {
  const entity = product?.data || product;
  const stock = Number(entity.stock || 0);
  return {
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
    image: entity.image_url || entity.image || null,
    category: entity.category?.name || entity.category || "Producto",
    variants: toStringArray(entity.variants, ["Estándar"]),
    complements: toStringArray(entity.complements, ["Sin complemento"]),
    prepTime: entity.preparation_time || "Por confirmar",
    isBackendEntity: true,
  };
}

function mapApiOrder(order, extras = {}) {
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
    deliveryMode:
      extras.deliveryMode ||
      (String(entity.delivery_address || "").startsWith("Retiro en")
        ? "Retiro en local"
        : "Delivery"),
    eta: "Por confirmar",
    payment: extras.paymentMethod || "Por confirmar",
    items: itemNames,
    apiItems: entity.items || [],
    isBackendEntity: true,
  };
}

async function getAllPages(fetchPage) {
  const firstResponse = await fetchPage(1);
  const items = [...(firstResponse?.data || [])];
  const lastPage = Number(
    firstResponse?.meta?.last_page ||
      firstResponse?.last_page ||
      firstResponse?.meta?.lastPage ||
      1,
  );

  if (lastPage <= 1) return items;

  const remainingResponses = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) => fetchPage(index + 2)),
  );
  remainingResponses.forEach((response) => {
    items.push(...(response?.data || []));
  });
  return items;
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

function toStringArray(value, fallback = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

export function useMercatto() {
  const context = useContext(MercattoContext);
  if (!context) {
    throw new Error("useMercatto must be used within MercattoProvider");
  }
  return context;
}
