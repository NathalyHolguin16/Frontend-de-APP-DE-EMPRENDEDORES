import { Platform } from "react-native";

const maxProductImageBytes = 2 * 1024 * 1024;

export function validateProductImage(asset) {
  if (!asset?.uri) return "Selecciona una imagen válida.";
  if (asset.fileSize && asset.fileSize > maxProductImageBytes) {
    return "La imagen del producto debe pesar máximo 2 MB.";
  }
  if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
    return "Selecciona una imagen JPG, PNG o WebP.";
  }
  return "";
}

export function createProductFormData(
  fields,
  image,
  methodOverride = false,
) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
      return;
    }
    formData.append(key, value === null ? "" : String(value));
  });
  if (methodOverride) formData.append("_method", "PUT");

  if (Platform.OS === "web" && image.file) {
    formData.append("image", image.file);
  } else {
    formData.append("image", {
      uri: image.uri,
      name: image.fileName || `producto-${Date.now()}.jpg`,
      type: image.mimeType || "image/jpeg",
    });
  }

  return formData;
}
