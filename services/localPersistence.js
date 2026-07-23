import AsyncStorage from "@react-native-async-storage/async-storage";

const cartKeyPrefix = "mercatto_cart_v1";
const ordersKeyPrefix = "mercatto_orders_v1";
const sellerOrdersKeyPrefix = "mercatto_seller_orders_v1";

export function getAccountStorageId(account) {
  return String(account?.id || account?.email || "")
    .trim()
    .toLowerCase();
}

function accountKey(prefix, account) {
  const accountId = getAccountStorageId(account);
  return accountId ? `${prefix}:${accountId}` : null;
}

async function readJson(key, fallback) {
  if (!key) return fallback;
  try {
    const serialized = await AsyncStorage.getItem(key);
    return serialized ? JSON.parse(serialized) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  if (!key) return;
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function loadStoredCart(account) {
  return readJson(accountKey(cartKeyPrefix, account), null);
}

export function saveStoredCart(account, cart) {
  return writeJson(accountKey(cartKeyPrefix, account), cart);
}

export function loadStoredOrders(account) {
  return readJson(accountKey(ordersKeyPrefix, account), []);
}

export function saveStoredOrders(account, orders) {
  return writeJson(accountKey(ordersKeyPrefix, account), orders);
}

export function loadStoredSellerOrders(account) {
  return readJson(accountKey(sellerOrdersKeyPrefix, account), []);
}

export function saveStoredSellerOrders(account, orders) {
  return writeJson(accountKey(sellerOrdersKeyPrefix, account), orders);
}
