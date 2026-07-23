import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getAccountStorageId,
  loadStoredCart,
  loadStoredOrders,
  saveStoredCart,
  saveStoredOrders,
} from "../localPersistence";

describe("localPersistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("keeps carts isolated by account", async () => {
    const luis = { id: "luis-id", email: "luis@example.com" };
    const ana = { id: "ana-id", email: "ana@example.com" };
    const cart = { businessId: "store-1", items: [{ quantity: 2 }] };

    await saveStoredCart(luis, cart);

    await expect(loadStoredCart(luis)).resolves.toEqual(cart);
    await expect(loadStoredCart(ana)).resolves.toBeNull();
  });

  it("stores an order fallback for the same account", async () => {
    const account = { email: "LUIS@EXAMPLE.COM" };
    const orders = [{ id: "order-1", status: "Nuevo" }];

    await saveStoredOrders(account, orders);

    expect(getAccountStorageId(account)).toBe("luis@example.com");
    await expect(loadStoredOrders(account)).resolves.toEqual(orders);
  });
});
