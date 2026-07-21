import { createContext, useContext, useState } from "react";

import {
  businesses,
  buyerOrders,
  cities,
  entrepreneurOrders,
  products,
} from "../data/mercattoData";
import {
  clearStoredToken,
  createAddress as createAddressRequest,
  getAddresses,
  loginUser,
  logoutUser,
  registerUser as registerUserRequest,
  saveToken,
} from "../../services/mercattoApi";

const MercattoContext = createContext(null);

export function MercattoProvider({ children }) {
  const [user, setUser] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [mode, setMode] = useState("buyer");
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [favorites, setFavorites] = useState(["dulce-orilla"]);
  const [cart, setCart] = useState({
    businessId: null,
    items: [],
    deliveryMode: "Delivery",
    paymentMethod: "Efectivo",
    coupon: "",
  });
  const [orders, setOrders] = useState(buyerOrders);
  const [sellerOrders, setSellerOrders] = useState(entrepreneurOrders);

  const login = async ({ identifier, password }) => {
    const response = await loginUser({
      email: identifier.trim().toLowerCase(),
      password,
    });
    await saveToken(response.token);

    let addresses = [];
    try {
      const addressResponse = await getAddresses(response.token);
      addresses = addressResponse?.data || [];
    } catch {
      addresses = [];
    }

    const defaultAddress = getDefaultAddress(addresses);
    const nextUser = normalizeApiUser(response.user, {
      profiles: ["buyer"],
      ...mapApiAddress(defaultAddress),
    });
    setUser(nextUser);
    setSavedAddresses(addresses);
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
    setMode(profileType === "entrepreneur" ? "entrepreneur" : "buyer");
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

    if (patch.city) {
      setSelectedCity(patch.city);
    }

    if (patch.address) {
      setDeliveryAddress(patch.address);
    }
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

  const confirmOrder = () => {
    const business = businesses.find((item) => item.id === cart.businessId);
    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const nextOrder = {
      id: `MCT-${Math.floor(1100 + Math.random() * 800)}`,
      businessId: business?.id,
      businessName: business?.name || "Mercatto",
      date: "Ahora",
      status: "Pedido enviado",
      total: Number((total + (business?.deliveryCost || 0)).toFixed(2)),
      deliveryMode: cart.deliveryMode,
      eta: business?.deliveryTime || "30 min",
      items: cart.items.map((item) => item.product.name),
    };
    setOrders((current) => [nextOrder, ...current]);
    clearCart();
    return nextOrder;
  };

  const updateSellerOrder = (orderId, status) => {
    setSellerOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
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

export function useMercatto() {
  const context = useContext(MercattoContext);
  if (!context) {
    throw new Error("useMercatto must be used within MercattoProvider");
  }
  return context;
}
