import {
  createProductFormData,
  validateProductImage,
} from "../productMedia";

describe("productMedia", () => {
  it("accepts a supported product image", () => {
    expect(
      validateProductImage({
        uri: "file:///product.webp",
        mimeType: "image/webp",
        fileSize: 800_000,
      }),
    ).toBe("");
  });

  it("rejects product images larger than 2 MB", () => {
    expect(
      validateProductImage({
        uri: "file:///product.jpg",
        mimeType: "image/jpeg",
        fileSize: 2 * 1024 * 1024 + 1,
      }),
    ).toBe("La imagen del producto debe pesar máximo 2 MB.");
  });

  it("sends the product image and Laravel method override", () => {
    const formData = createProductFormData(
      {
        name: "Producto QA",
        price: 10,
        stock: 5,
        is_active: true,
      },
      {
        uri: "file:///product.png",
        fileName: "product.png",
        mimeType: "image/png",
      },
      true,
    );

    expect(Array.from(formData.keys())).toEqual([
      "name",
      "price",
      "stock",
      "is_active",
      "_method",
      "image",
    ]);
    expect(formData.get("is_active")).toBe("1");
  });
});
