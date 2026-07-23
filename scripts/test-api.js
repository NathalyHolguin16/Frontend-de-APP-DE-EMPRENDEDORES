const assert = require("node:assert/strict");

const baseUrl = (
  process.env.EXPO_PUBLIC_MERCATTO_API_URL ||
  "https://mercatto-back.onrender.com"
).replace(/\/$/, "");

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
  });
  assert.equal(
    response.ok,
    true,
    `${path} respondió HTTP ${response.status}`,
  );
  return response.json();
}

async function main() {
  const stores = await getJson("/api/stores");
  assert.equal(Array.isArray(stores.data), true, "La API debe retornar data[]");

  if (stores.data.length) {
    const firstStore = stores.data[0];
    assert.equal(typeof firstStore.id, "string");
    assert.equal(typeof firstStore.name, "string");

    const products = await getJson(`/api/stores/${firstStore.id}/products`);
    assert.equal(
      Array.isArray(products.data),
      true,
      "Productos debe retornar data[]",
    );
  }

  console.log(
    `API verificada correctamente: ${stores.data.length} tienda(s) disponible(s).`,
  );
}

main().catch((error) => {
  console.error("Falló la verificación de la API:", error.message);
  process.exit(1);
});
