import { createContext, useContext, useState } from "react";

import {
  businesses,
  buyerOrders,
  cities,
  entrepreneurOrders,
  products,
} from "../data/mercattoData";

const MercattoContext = createContext(null);

export function MercattoProvider({ children }) {
  const [user, setUser] = useState(null);
  const [knownUsers, setKnownUsers] = useState({});
  const [mode, setMode] = useState("buyer");
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Av. 4 de Noviembre y calle 13",
  );
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

  const login = ({ identifier }) => {
    const normalizedIdentifier = identifier?.trim().toLowerCase();
    const rememberedUser = knownUsers[normalizedIdentifier];

    if (rememberedUser) {
      setUser(rememberedUser);
      setSelectedCity(rememberedUser.city || selectedCity);
      setDeliveryAddress(rememberedUser.address || deliveryAddress);
      return rememberedUser;
    }

    const hasBothProfiles = !identifier || identifier.toLowerCase().includes("ambos");
    const inferredName = inferNameFromIdentifier(identifier);
    const [firstName, ...lastNameParts] = inferredName.split(" ");
    const nextUser = {
      firstName,
      lastName: lastNameParts.join(" "),
      name: inferredName,
      idNumber: "Pendiente",
      birthDate: "Pendiente",
      gender: "Pendiente",
      phone: identifier && !identifier.includes("@") ? identifier : "Pendiente",
      email: identifier?.includes("@") ? identifier : "usuario@mercatto.ec",
      city: selectedCity,
      address: deliveryAddress,
      profiles: hasBothProfiles ? ["buyer", "entrepreneur"] : ["buyer"],
      photo: getInitials(inferredName),
    };
    setUser(nextUser);
    return nextUser;
  };

  const registerUser = ({ profileType, data }) => {
    const nextUser = {
      firstName: data.names || "Nuevo",
      lastName: data.lastNames || "Usuario",
      name: `${data.names || "Nuevo"} ${data.lastNames || "Usuario"}`,
      idNumber: data.idNumber || "Sin registrar",
      birthDate: data.birthDate || "Pendiente",
      gender: data.gender || "Pendiente",
      phone: data.phone || "Pendiente",
      email: data.email || "usuario@mercatto.ec",
      city: data.city || selectedCity,
      address: data.address || deliveryAddress,
      profiles: profileType === "entrepreneur" ? ["buyer", "entrepreneur"] : ["buyer"],
      photo: getInitials(`${data.names || "Nuevo"} ${data.lastNames || "Usuario"}`),
    };
    setUser(nextUser);
    setKnownUsers((current) => ({
      ...current,
      [nextUser.email.trim().toLowerCase()]: nextUser,
    }));
    setSelectedCity(nextUser.city);
    setDeliveryAddress(nextUser.address);
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

    if (nextUser.email) {
      setKnownUsers((users) => ({
        ...users,
        [nextUser.email.trim().toLowerCase()]: nextUser,
      }));
    }

    if (patch.city) {
      setSelectedCity(patch.city);
    }

    if (patch.address) {
      setDeliveryAddress(patch.address);
    }
  };

  const logout = () => {
    setUser(null);
    setMode("buyer");
    setCart({ businessId: null, items: [], deliveryMode: "Delivery", paymentMethod: "Efectivo", coupon: "" });
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

function inferNameFromIdentifier(identifier) {
  if (!identifier) {
    return "Usuario Mercatto";
  }

  if (!identifier.includes("@")) {
    return "Usuario Mercatto";
  }

  const localPart = identifier
    .split("@")[0]
    .replace(/\d+/g, "")
    .replace(/[._-]+/g, " ")
    .trim();

  if (/nathaly/i.test(localPart) && /holguin/i.test(localPart)) {
    return "Nathaly Holguin";
  }

  const words = localPart
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return words.length ? words.join(" ") : "Usuario Mercatto";
}

export function useMercatto() {
  const context = useContext(MercattoContext);
  if (!context) {
    throw new Error("useMercatto must be used within MercattoProvider");
  }
  return context;
}
