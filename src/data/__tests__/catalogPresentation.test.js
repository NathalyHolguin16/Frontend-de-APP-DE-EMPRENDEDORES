import {
  getProductPresentation,
  getStorePresentation,
  storeCategories,
} from "../catalogPresentation";

describe("catalogPresentation", () => {
  it("enriches demo stores without affecting unknown stores", () => {
    expect(
      getStorePresentation({ slug: "dulce-orilla-demo" }),
    ).toMatchObject({
      category: "Repostería",
      city: "Manta",
      status: "Abierto",
    });
    expect(getStorePresentation({ slug: "unknown" })).toEqual({});
  });

  it("provides images and promotional prices for selected demo products", () => {
    const product = getProductPresentation({
      name: "Cheesecake de frutos rojos",
    });

    expect(product.image).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(product.oldPrice).toBeGreaterThan(8.5);
    expect(product.badges).toContain("15% OFF");
  });

  it("covers every public store category and the Luis QA store", () => {
    expect(storeCategories).toHaveLength(10);
    expect(new Set(storeCategories).size).toBe(storeCategories.length);
    expect(
      getStorePresentation({
        slug: "tienda-qa-luis-1784778536886",
      }),
    ).toMatchObject({
      category: "Tecnología",
      city: "Manta",
      status: "Abierto",
    });
    expect(
      getProductPresentation({ name: "Audífonos inalámbricos" }).image,
    ).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });
});
