import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { cities } from "../data/mercattoData";
import {
  getProductPresentation,
  getStorePresentation,
} from "../data/catalogPresentation";
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
  getMyStore,
  getOrder,
  getStoredToken,
  getStoreProducts,
  getStoreOrders,
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
import {
  getAccountStorageId,
  loadStoredCart,
  loadStoredOrders,
  loadStoredSellerOrders,
  loadStoredStoreCover,
  saveStoredCart,
  saveStoredOrders,
  saveStoredSellerOrders,
  saveStoredStoreCover,
} from "../../services/localPersistence";
import {
  createStoreFormData,
  persistStoreCover,
} from "../../services/storeMedia";

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
  const [cart, setCart] = useState(createEmptyCart);
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [isSellerOrdersLoading, setIsSellerOrdersLoading] = useState(false);
  const [sellerOrdersError, setSellerOrdersError] = useState("");
  const [notice, setNotice] = useState(null);
  const noticeTimerRef = useRef(null);
  const lastCartAddRef = useRef({ productId: null, timestamp: 0 });
  const cartOwnerRef = useRef(null);

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

  useEffect(() => {
    const ownerId = getAccountStorageId(user);
    if (!ownerId || cartOwnerRef.current !== ownerId) return;
    saveStoredCart(user, cart).catch(() => {});
  }, [cart, user]);

  useEffect(() => {
    if (!getAccountStorageId(user)) return;
    saveStoredOrders(user, orders).catch(() => {});
  }, [orders, user]);

  useEffect(() => {
    if (!getAccountStorageId(user)) return;
    saveStoredSellerOrders(user, sellerOrders).catch(() => {});
  }, [sellerOrders, user]);

  useEffect(() => {
    if (!products.length || !businesses.length) return;
    setOrders((current) =>
      current.map((order) =>
        enrichOrderWithCatalog(order, products, businesses),
      ),
    );
    setSellerOrders((current) =>
      current.map((order) =>
        enrichOrderWithCatalog(order, products, businesses),
      ),
    );
  }, [businesses, products]);

  useEffect(() => {
    if (
      !myStore?.id ||
      !myStore?.cover ||
      myStore.coverPersistence !== "local"
    ) {
      return;
    }
    setBusinesses((current) =>
      current.map((business) =>
        business.id === myStore.id
          ? { ...business, hero: myStore.cover, cover: myStore.cover }
          : business,
      ),
    );
  }, [myStore]);

  const syncBuyerOrderRecords = async (sourceOrders, token) => {
    const results = await Promise.allSettled(
      sourceOrders.map((order) =>
        order.businessId
          ? getOrder(order.businessId, order.id, token)
          : Promise.reject(new Error("Pedido sin tienda asociada.")),
      ),
    );

    return results.map((result, index) => {
      const storedOrder = sourceOrders[index];
      if (result.status === "rejected") return storedOrder;

      const store =
        businesses.find(
          (business) => business.id === storedOrder.businessId,
        ) || {
          id: storedOrder.businessId,
          name: storedOrder.businessName,
        };
      return mapApiOrder(result.value, {
        store,
        deliveryMode: storedOrder.deliveryMode,
        paymentMethod: storedOrder.payment,
        catalogProducts: products,
        catalogBusinesses: businesses,
      });
    });
  };

  const login = async ({ identifier, password }) => {
    const response = await loginUser({
      email: identifier.trim().toLowerCase(),
      password,
    });
    await saveToken(response.token);
    setIsOrdersLoading(true);
    setIsSellerOrdersLoading(true);
    setOrdersError("");
    setSellerOrdersError("");

    const [addressResult, storeResult] = await Promise.allSettled([
      getAddresses(response.token),
      getMyStore(response.token),
    ]);
    const addresses =
      addressResult.status === "fulfilled"
        ? addressResult.value?.data || []
        : [];
    const apiStore = storeResult.status === "fulfilled" ? storeResult.value : null;
    const apiStoreEntity = apiStore?.data || apiStore;
    let apiSellerOrders = [];
    if (apiStoreEntity?.id) {
      try {
        apiSellerOrders = await getAllPages((page) =>
          getStoreOrders(apiStoreEntity.id, page, response.token),
        );
      } catch (error) {
        setSellerOrdersError(
          error?.message || "No pudimos actualizar los pedidos del negocio.",
        );
      }
    }

    const defaultAddress = getDefaultAddress(addresses);
    const cachedProfile = await getCachedProfile();
    const matchingProfile =
      cachedProfile?.ownerEmail === response.user?.email ? cachedProfile.profile : {};
    const nextUser = normalizeApiUser(response.user, {
      ...matchingProfile,
      profiles: apiStore ? ["buyer", "entrepreneur"] : ["buyer"],
      ...mapApiAddress(defaultAddress),
    });
    const mappedStore = apiStore ? mapApiStore(apiStore) : null;
    const [storedCart, storedOrders, storedSellerOrders, storedStoreCover] = await Promise.all([
      loadStoredCart(nextUser),
      loadStoredOrders(nextUser),
      loadStoredSellerOrders(nextUser),
      mappedStore?.id
        ? loadStoredStoreCover(nextUser, mappedStore.id)
        : Promise.resolve(null),
    ]);
    const hydratedStore =
      mappedStore && storedStoreCover?.uri && !getApiStoreCover(apiStore)
        ? {
            ...mappedStore,
            hero: storedStoreCover.uri,
            cover: storedStoreCover.uri,
            coverPersistence: "local",
          }
        : mappedStore;
    const mappedBuyerOrders = await syncBuyerOrderRecords(
      storedOrders,
      response.token,
    );
    const remoteSellerOrders = apiSellerOrders.map((order) =>
      mapApiOrder(order, {
        store: hydratedStore,
        catalogProducts: products,
        catalogBusinesses: businesses,
      }),
    );
    const mappedSellerOrders = mergeOrdersById(
      remoteSellerOrders,
      storedSellerOrders,
    );
    cartOwnerRef.current = getAccountStorageId(nextUser);
    setCart(normalizeStoredCart(storedCart));
    setUser(nextUser);
    setSavedAddresses(addresses);
    setMyStore(hydratedStore);
    setOrders(mappedBuyerOrders);
    setSellerOrders(mappedSellerOrders);
    setIsOrdersLoading(false);
    setIsSellerOrdersLoading(false);
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
    setOrders([]);
    setSellerOrders([]);
    setOrdersError("");
    setSellerOrdersError("");
    cartOwnerRef.current = getAccountStorageId(nextUser);
    setCart(createEmptyCart());
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
    const activeToken = await getStoredToken().catch(() => null);
    if (user) {
      await Promise.allSettled([
        saveStoredCart(user, cart),
        saveStoredOrders(user, orders),
        saveStoredSellerOrders(user, sellerOrders),
      ]);
    }
    await clearStoredToken();
    cartOwnerRef.current = null;
    setUser(null);
    setSavedAddresses([]);
    setMyStore(null);
    setOrders([]);
    setSellerOrders([]);
    setOrdersError("");
    setSellerOrdersError("");
    setMode("buyer");
    setCart(createEmptyCart());
    logoutUser(activeToken).catch(() => {
      // The local session is already closed if the API is unavailable.
    });
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
    setCart(createEmptyCart());
  };

  const refreshBuyerOrders = async ({ silent = false } = {}) => {
    if (!silent) setIsOrdersLoading(true);
    setOrdersError("");
    try {
      const nextOrders = await syncBuyerOrderRecords(orders);
      setOrders(nextOrders);
      if (user) await saveStoredOrders(user, nextOrders);
      return nextOrders;
    } catch (error) {
      setOrdersError(error?.message || "No pudimos actualizar tus pedidos.");
      throw error;
    } finally {
      if (!silent) setIsOrdersLoading(false);
    }
  };

  const refreshSellerOrders = async ({ silent = false } = {}) => {
    if (!myStore?.id) {
      setSellerOrders([]);
      return [];
    }
    if (!silent) setIsSellerOrdersLoading(true);
    setSellerOrdersError("");
    try {
      const apiOrders = await getAllPages((page) =>
        getStoreOrders(myStore.id, page),
      );
      const nextOrders = apiOrders.map((order) =>
        mapApiOrder(order, {
          store: myStore,
          catalogProducts: products,
          catalogBusinesses: businesses,
        }),
      );
      const mergedOrders = mergeOrdersById(nextOrders, sellerOrders);
      setSellerOrders(mergedOrders);
      if (user) await saveStoredSellerOrders(user, mergedOrders);
      return mergedOrders;
    } catch (error) {
      setSellerOrdersError(
        error?.message || "No pudimos actualizar los pedidos del negocio.",
      );
      throw error;
    } finally {
      if (!silent) setIsSellerOrdersLoading(false);
    }
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
      store: business,
      deliveryMode: cart.deliveryMode,
      paymentMethod: cart.paymentMethod,
      catalogProducts: products,
      catalogBusinesses: businesses,
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
    const nextOrder = mapApiOrder(response, {
      store: myStore,
      catalogProducts: products,
      catalogBusinesses: businesses,
    });
    setSellerOrders((current) =>
      current.map((order) => (order.id === orderId ? nextOrder : order)),
    );
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? nextOrder : order)),
    );
    return nextOrder;
  };

  const cancelBuyerOrder = async (orderId) => {
    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder?.businessId) {
      throw new Error("No encontramos la tienda asociada a este pedido.");
    }
    if (!["Nuevo", "En preparación"].includes(currentOrder.status)) {
      throw new Error("Este pedido ya no admite cancelación.");
    }

    const response = await updateOrderStatus(
      currentOrder.businessId,
      currentOrder.id,
      "CANCELLED",
    );
    const nextOrder = mapApiOrder(response, {
      store: {
        id: currentOrder.businessId,
        name: currentOrder.businessName,
      },
      deliveryMode: currentOrder.deliveryMode,
      paymentMethod: currentOrder.payment,
      catalogProducts: products,
      catalogBusinesses: businesses,
    });
    const nextOrders = orders.map((order) =>
      order.id === orderId ? nextOrder : order,
    );
    setOrders(nextOrders);
    if (user) await saveStoredOrders(user, nextOrders);
    showNotice("Pedido cancelado correctamente.");
    return nextOrder;
  };

  const saveStore = async (payload) => {
    const fields = {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      phone: payload.phone.trim(),
      slug: createSlug(payload.slug || payload.name),
    };
    const hasNewCover = !!payload.cover?.uri;
    const requestPayload = hasNewCover
      ? createStoreFormData(fields, payload.cover, !!myStore?.id)
      : fields;
    const response = myStore?.id
      ? await updateStoreRequest(myStore.id, requestPayload)
      : await createStoreRequest(requestPayload);
    const mappedStore = mapApiStore(response);
    const remoteCover = getApiStoreCover(response);
    const persistedCover = hasNewCover
      ? await persistStoreCover(payload.cover, mappedStore.id)
      : myStore?.coverPersistence === "local"
        ? {
            uri: myStore.cover,
            fileName: "portada.jpg",
            mimeType: "image/jpeg",
          }
        : null;
    if (persistedCover?.uri && user) {
      await saveStoredStoreCover(user, mappedStore.id, persistedCover).catch(
        () => {},
      );
    }
    const effectiveCover = remoteCover || persistedCover?.uri;
    const nextStore = effectiveCover
      ? {
          ...mappedStore,
          hero: effectiveCover,
          cover: effectiveCover,
          coverPersistence: remoteCover ? "remote" : "local",
        }
      : mappedStore;
    setMyStore(nextStore);
    await refreshCatalog();
    if (effectiveCover) {
      setBusinesses((current) =>
        current.map((business) =>
          business.id === nextStore.id
            ? { ...business, hero: effectiveCover, cover: effectiveCover }
            : business,
        ),
      );
    }
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
    isOrdersLoading,
    ordersError,
    isSellerOrdersLoading,
    sellerOrdersError,
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
    cancelBuyerOrder,
    updateSellerOrder,
    refreshBuyerOrders,
    refreshSellerOrders,
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
  "En preparación": "PROCESSING",
  Enviado: "SHIPPED",
  Entregado: "DELIVERED",
  Cancelado: "CANCELLED",
};

function mapApiStore(store) {
  const entity = store?.data || store;
  const presentation = getStorePresentation(entity);
  return {
    id: entity.id,
    name: entity.name,
    logo: getInitials(entity.name),
    slug: entity.slug,
    shortDescription: entity.description || "Emprendimiento local en Mercatto.",
    about: entity.description || "Conoce los productos de este emprendimiento local.",
    category:
      entity.category?.name ||
      entity.category ||
      presentation.category ||
      "Emprendimientos",
    subcategory: presentation.subcategory || "Catálogo local",
    city: entity.city || presentation.city || null,
    serviceCities: toStringArray(
      entity.service_cities,
      presentation.serviceCities ||
        [entity.city || presentation.city].filter(Boolean),
    ),
    address: entity.address || presentation.address || "",
    contact: entity.phone,
    phone: entity.phone,
    owner: entity.owner,
    hero: entity.cover_url || entity.cover || presentation.hero || null,
    cover: entity.cover_url || entity.cover || presentation.hero || null,
    rating: Number(entity.rating || presentation.rating || 0),
    reviews: Number(entity.reviews_count || presentation.reviews || 0),
    deliveryTime:
      entity.delivery_time || presentation.deliveryTime || "Por confirmar",
    preparationTime:
      entity.preparation_time ||
      presentation.preparationTime ||
      "Por confirmar",
    deliveryCost: Number(
      entity.delivery_cost ?? presentation.deliveryCost ?? 0,
    ),
    minimumOrder: Number(
      entity.minimum_order ?? presentation.minimumOrder ?? 0,
    ),
    freeShippingFrom: Number(
      entity.free_shipping_from ?? presentation.freeShippingFrom ?? 0,
    ),
    status:
      entity.is_active === false
        ? "No disponible"
        : presentation.status || "Disponible",
    schedule: entity.schedule || presentation.schedule || "Horario por confirmar",
    tags: toStringArray(entity.tags, presentation.tags),
    modality: toStringArray(
      entity.delivery_modes,
      presentation.modality || ["Retiro en local"],
    ),
    paymentMethods: toStringArray(
      entity.payment_methods,
      presentation.paymentMethods || ["Efectivo"],
    ),
    socials: entity.socials || "",
    policies: toStringArray(entity.policies, presentation.policies),
    isBackendEntity: true,
  };
}

function getApiStoreCover(store) {
  const entity = store?.data || store;
  return entity?.cover_url || entity?.cover || null;
}

function mapApiProduct(product, store) {
  const entity = product?.data || product;
  const stock = Number(entity.stock || 0);
  const presentation = getProductPresentation(entity);
  const oldPrice = Number(entity.old_price || presentation.oldPrice || 0);
  const price = Number(entity.price || 0);
  const discount =
    Number(entity.discount || 0) ||
    (oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  return {
    id: entity.id,
    businessId: entity.store?.id || store?.id,
    name: entity.name,
    description: entity.description,
    fullDescription: entity.description,
    price,
    oldPrice: oldPrice || null,
    discount,
    badges:
      entity.is_active === false
        ? ["Pausado"]
        : toStringArray(entity.badges, presentation.badges || ["Disponible"]),
    availability: entity.is_active === false ? "No disponible" : stock <= 3 ? "Stock bajo" : "Disponible",
    stock,
    isActive: entity.is_active !== false,
    store: entity.store || store,
    image: entity.image_url || entity.image || presentation.image || null,
    category:
      entity.category?.name ||
      entity.category ||
      presentation.category ||
      "Producto",
    variants: toStringArray(
      entity.variants,
      presentation.variants || ["Estándar"],
    ),
    complements: toStringArray(
      entity.complements,
      presentation.complements || ["Sin complemento"],
    ),
    prepTime:
      entity.preparation_time || presentation.prepTime || "Por confirmar",
    validity: entity.validity || presentation.validity || "Promoción vigente",
    isBackendEntity: true,
  };
}

function mapApiOrder(order, extras = {}) {
  const entity = order?.data || order;
  const status = orderStatusFromApi[entity.status] || entity.status || "Nuevo";
  const apiItems = entity.items || [];
  const productIds = apiItems
    .map((item) => item.product?.id || item.product_id)
    .filter(Boolean);
  const inferredProduct = extras.catalogProducts?.find((product) =>
    productIds.includes(product.id),
  );
  const inferredBusiness = extras.catalogBusinesses?.find(
    (business) => business.id === inferredProduct?.businessId,
  );
  const store = extras.store || entity.store || inferredBusiness;
  const itemNames = apiItems.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const name =
      item.product?.name ||
      extras.catalogProducts?.find(
        (product) => product.id === item.product_id,
      )?.name ||
      "Producto";
    return quantity > 1 ? `${quantity} x ${name}` : name;
  });
  return {
    id: entity.id,
    businessId: store?.id || inferredProduct?.businessId || null,
    businessName: store?.name || getPickupBusinessName(entity.delivery_address),
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
    eta: getOrderEta(status),
    payment: extras.paymentMethod || "Por confirmar",
    items: itemNames.length ? itemNames : ["Productos no disponibles"],
    productIds,
    apiItems,
    isBackendEntity: true,
  };
}

function mergeOrdersById(primaryOrders = [], fallbackOrders = []) {
  const seenIds = new Set();
  return [...primaryOrders, ...fallbackOrders].filter((order) => {
    const id = order?.id;
    if (!id || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
}

function createEmptyCart() {
  return {
    businessId: null,
    items: [],
    deliveryMode: "Delivery",
    paymentMethod: "Efectivo",
    coupon: "",
  };
}

function normalizeStoredCart(storedCart) {
  if (!storedCart || !Array.isArray(storedCart.items)) {
    return createEmptyCart();
  }

  const items = storedCart.items
    .filter((item) => item?.product?.id && Number(item.quantity) > 0)
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.floor(Number(item.quantity))),
    }));

  return {
    ...createEmptyCart(),
    ...storedCart,
    businessId: items.length ? storedCart.businessId : null,
    items,
  };
}

function enrichOrderWithCatalog(order, catalogProducts, catalogBusinesses) {
  if (!order) return order;

  const existingBusiness = catalogBusinesses.find(
    (business) => business.id === order.businessId,
  );
  const matchingProduct = catalogProducts.find((product) =>
    order.productIds?.includes(product.id),
  );
  const inferredBusiness = catalogBusinesses.find(
    (business) => business.id === matchingProduct?.businessId,
  );
  const business = existingBusiness || inferredBusiness;

  if (!business) return order;
  if (
    order.businessId === business.id &&
    order.businessName === business.name
  ) {
    return order;
  }

  return {
    ...order,
    businessId: business.id,
    businessName: business.name,
  };
}

function getPickupBusinessName(address) {
  const pickupMatch = String(address || "").match(/^Retiro en\s+(.+)$/i);
  return pickupMatch?.[1]?.trim() || "Mercatto";
}

function getOrderEta(status) {
  const etaByStatus = {
    Nuevo: "Esperando confirmación",
    "En preparación": "Preparando tu pedido",
    Enviado: "En camino",
    Entregado: "Pedido entregado",
    Cancelado: "Pedido cancelado",
  };
  return etaByStatus[status] || "Por confirmar";
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
