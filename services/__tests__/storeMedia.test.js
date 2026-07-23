import { validateStoreCover } from "../storeMedia";

describe("storeMedia", () => {
  it("accepts a supported business cover", () => {
    expect(
      validateStoreCover({
        uri: "file:///cover.jpg",
        mimeType: "image/jpeg",
        fileSize: 900_000,
      }),
    ).toBe("");
  });

  it("rejects files larger than 5 MB", () => {
    expect(
      validateStoreCover({
        uri: "file:///cover.png",
        mimeType: "image/png",
        fileSize: 5 * 1024 * 1024 + 1,
      }),
    ).toBe("La imagen debe pesar máximo 5 MB.");
  });

  it("rejects non-image files", () => {
    expect(
      validateStoreCover({
        uri: "file:///document.pdf",
        mimeType: "application/pdf",
      }),
    ).toBe("Selecciona un archivo de imagen.");
  });
});
