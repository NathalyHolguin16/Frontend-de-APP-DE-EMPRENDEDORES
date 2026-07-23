import { createStoreFormData, validateStoreImage } from "../storeMedia";

describe("storeMedia", () => {
  it("accepts a supported store image", () => {
    expect(
      validateStoreImage({
        uri: "file:///cover.jpg",
        mimeType: "image/jpeg",
        fileSize: 900_000,
      }),
    ).toBe("");
  });

  it("rejects files larger than 5 MB", () => {
    expect(
      validateStoreImage({
        uri: "file:///cover.png",
        mimeType: "image/png",
        fileSize: 5 * 1024 * 1024 + 1,
      }),
    ).toBe("La imagen debe pesar máximo 5 MB.");
  });

  it("rejects non-image files", () => {
    expect(
      validateStoreImage({
        uri: "file:///document.pdf",
        mimeType: "application/pdf",
      }),
    ).toBe("Selecciona un archivo de imagen.");
  });

  it("sends logo and banner with the Laravel method override", () => {
    const formData = createStoreFormData(
      { name: "Tienda QA", phone: "0999999999" },
      {
        logo: {
          uri: "file:///logo.png",
          fileName: "logo.png",
          mimeType: "image/png",
        },
        banner: {
          uri: "file:///banner.jpg",
          fileName: "banner.jpg",
          mimeType: "image/jpeg",
        },
      },
      true,
    );
    const fields = Array.from(formData.keys());

    expect(fields).toEqual([
      "name",
      "phone",
      "_method",
      "logo",
      "banner",
    ]);
  });
});
