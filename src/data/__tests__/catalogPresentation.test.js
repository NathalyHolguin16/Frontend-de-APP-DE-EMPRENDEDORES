import {
  getProductPresentation,
  getStorePresentation,
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
});
